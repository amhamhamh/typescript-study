import { buildDocument } from './document';
import { CHANNEL, type FromSandbox, type LogLevel, type RunRequest, type Runner } from './protocol';

/** 실습 화면(Workbench)이 받는 이벤트 */
export type SandboxEvent =
  | { type: 'start' }
  | { type: 'log'; level: LogLevel; text: string; uncaught?: boolean }
  | { type: 'done'; rendered: boolean }
  | { type: 'dom'; text: string };

interface RunOptions {
  /** sucrase로 변환이 끝난 JS */
  code: string;
  runner: Runner;
  theme: 'light' | 'dark';
}

/** 이 시간 동안 iframe에서 아무 신호도 오지 않으면 스크립트가 멈춘 것으로 봅니다. */
const SILENCE_MS = 5000;
const MAX_TEXT = 20000;
const LEVELS: readonly string[] = ['log', 'info', 'warn', 'error'];

/**
 * iframe 안의 코드는 학습자가 쓴 것이므로 메시지의 모양을 믿지 않습니다.
 * (예: window.parent.postMessage({ __tsl: true, type: 'log', text: {} }, '*'))
 */
function parseMessage(data: unknown): FromSandbox | null {
  if (typeof data !== 'object' || data === null) return null;
  const raw = data as Record<string, unknown>;
  if (raw[CHANNEL] !== true) return null;
  switch (raw.type) {
    case 'ready':
    case 'alive':
      return { type: raw.type };
    case 'log': {
      if (typeof raw.text !== 'string' || typeof raw.level !== 'string' || !LEVELS.includes(raw.level)) return null;
      const message: FromSandbox = { type: 'log', level: raw.level as LogLevel, text: raw.text.slice(0, MAX_TEXT) };
      if (raw.uncaught === true) message.uncaught = true;
      return message;
    }
    case 'dom':
      return typeof raw.text === 'string' ? { type: 'dom', text: raw.text.slice(0, MAX_TEXT) } : null;
    case 'done':
      return { type: 'done', rendered: raw.rendered === true };
    default:
      return null;
  }
}

/**
 * 코드를 실행할 iframe을 관리합니다.
 *
 * 실행할 때마다 새 iframe을 만듭니다. 이전 실행의 타이머·이벤트 리스너·전역 변수가 남지 않습니다.
 * 새 화면이 준비될 때까지는 이전 화면을 그대로 보여 주다가 바꿔 끼우므로 입력할 때마다 미리보기가
 * 깜빡이지 않습니다.
 *
 * 끝나지 않는 반복문은 compile.ts가 넣어 둔 보호 코드가 먼저 막습니다. 그래도 스크립트가 멈추면
 * (극단적으로 느린 정규식 등) 페이지의 모든 미리보기 iframe이 같은 프로세스를 쓰기 때문에 함께
 * 멈춥니다. 이때는 모든 iframe을 지워 그 프로세스를 끝내고, 다른 예제들은 다시 실행합니다.
 */
export class SandboxHost {
  private static readonly hosts = new Set<SandboxHost>();

  private visible: HTMLIFrameElement | null = null;
  private pending: HTMLIFrameElement | null = null;
  /** 현재 실행에 해당하는 iframe. 여기서 온 메시지만 화면에 반영합니다. */
  private current: HTMLIFrameElement | null = null;
  private request: RunRequest | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  /** 멈춘 프로세스를 정리한 뒤 다시 실행하기 위해 마지막 요청을 기억합니다. */
  private last: RunOptions | null = null;
  private retried = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly runtime: string,
    private readonly emit: (event: SandboxEvent) => void,
  ) {
    window.addEventListener('message', this.onMessage);
    SandboxHost.hosts.add(this);
  }

  run(options: RunOptions): void {
    const { code, runner, theme } = options;
    clearTimeout(this.restartTimer);
    this.discardPending();
    this.last = options;
    this.emit({ type: 'start' });

    const frame = document.createElement('iframe');
    // allow-same-origin 을 주지 않으므로 이 페이지의 저장소·쿠키·DOM에 접근할 수 없습니다.
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.title = '실행 결과';
    frame.className = 'sandbox-frame is-pending';
    frame.srcdoc = buildDocument(this.runtime, runner, theme);

    this.pending = frame;
    this.current = frame;
    this.request = { type: 'run', code, runner };
    this.container.appendChild(frame);
    this.watch(frame);
  }

  /** 실행 전(문법 오류 등)에 끝난 경우에도 콘솔을 같은 흐름으로 갱신합니다. */
  fail(message: string): void {
    clearTimeout(this.restartTimer);
    this.discardPending();
    this.current = null;
    this.last = null;
    this.emit({ type: 'start' });
    this.emit({ type: 'log', level: 'error', text: message });
    this.emit({ type: 'done', rendered: false });
  }

  dispose(): void {
    window.removeEventListener('message', this.onMessage);
    SandboxHost.hosts.delete(this);
    clearTimeout(this.restartTimer);
    this.removeFrames();
  }

  /** 신호가 올 때마다 다시 호출해서 "조용한 시간"을 처음부터 잽니다. */
  private watch(frame: HTMLIFrameElement): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.pending !== frame) return;
      this.onHang();
    }, SILENCE_MS);
  }

  private onHang(): void {
    // 런타임이 시작 신호조차 못 보냈다면, 이번 코드가 아니라 이전 실행(예: 클릭 핸들러)이 프로세스를 붙잡고 있던 것입니다.
    const blockedByEarlierRun = this.request !== null && !this.retried;
    const mine = this.last;
    // 멈춘 스크립트는 iframe 하나를 지우는 것으로는 끝나지 않습니다. 모든 iframe을 지워 프로세스를 끝냅니다.
    for (const host of SandboxHost.hosts) host.removeFrames();

    for (const host of SandboxHost.hosts) {
      if (host === this || !host.last) continue;
      const again = host.last;
      clearTimeout(host.restartTimer);
      host.restartTimer = setTimeout(() => host.run(again), 300);
    }

    if (blockedByEarlierRun && mine) {
      this.retried = true;
      this.restartTimer = setTimeout(() => this.run(mine), 300);
      return;
    }
    this.last = null;
    this.emit({
      type: 'log',
      level: 'error',
      text: `실행이 ${SILENCE_MS / 1000}초 넘게 응답하지 않아 중단했습니다. 끝나지 않는 계산이 있는지 확인해 보세요.`,
    });
    this.emit({ type: 'done', rendered: false });
  }

  private removeFrames(): void {
    this.discardPending();
    this.visible?.remove();
    this.visible = null;
    this.current = null;
  }

  private discardPending(): void {
    clearTimeout(this.timer);
    this.pending?.remove();
    this.pending = null;
  }

  private onMessage = (event: MessageEvent): void => {
    const frame = this.current;
    if (!frame || event.source !== frame.contentWindow) return;
    const message = parseMessage(event.data);
    if (!message) return;
    if (this.pending === frame) this.watch(frame);

    switch (message.type) {
      case 'ready':
        this.retried = false;
        if (this.request) frame.contentWindow?.postMessage(this.request, '*');
        this.request = null;
        break;
      case 'alive':
        break;
      case 'log':
        this.emit(message);
        break;
      case 'dom':
        this.emit(message);
        break;
      case 'done':
        if (this.pending === frame) {
          clearTimeout(this.timer);
          this.visible?.remove();
          this.visible = frame;
          this.pending = null;
          frame.classList.remove('is-pending');
        }
        this.emit(message);
        break;
    }
  };
}
