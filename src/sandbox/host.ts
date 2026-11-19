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
/**
 * 신호는 계속 오는데(끝나지 않는 최상위 await 등) 실행을 넘긴 뒤 이 시간이 지나도록 끝나지 않으면,
 * 더 기다리지 않고 지금까지의 결과를 반영합니다.
 */
const SETTLE_MS = 10000;
/**
 * 긴 동기 계산을 막 끝낸 iframe도 밀려 있던 "살아 있다" 신호부터 보내고, 완료 신호는 그 뒤(40ms쯤)에 보냅니다.
 * 그래서 SETTLE_MS가 지난 뒤에 신호를 받고도 이만큼 더 기다립니다. 그래도 끝나지 않아야 await에서 기다리는 중입니다.
 */
const SETTLE_GRACE_MS = 300;
/** 타이머가 이보다 늦게 실행됐다면, 같은 스레드를 쓰는 iframe이 그동안 동기 계산을 하고 있었던 것입니다. */
const LATE_MS = 100;
/**
 * 멈춘 iframe을 지운 뒤에도 Chromium은 그 프로세스를 0.5초쯤 더 붙잡아 둡니다. 그 전에 만든 iframe은
 * 멈춘 프로세스에 들어가 시작조차 못 하므로, 넉넉히 기다린 뒤 다시 실행합니다.
 */
const RESTART_DELAY_MS = 1200;
/** 시작 신호가 오지 않을 때 자동으로 다시 실행해 보는 횟수. 기다리는 사이에 코드를 고쳐도 그 코드 탓으로 돌리지 않기 위해 두 번까지 봅니다. */
const MAX_RETRIES = 2;
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
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  /** 실행을 넘긴 지 SETTLE_MS가 지났는지. 그 뒤에 오는 "살아 있다" 신호를 보고 마무리합니다. */
  private overdue = false;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  /** 멈춘 프로세스를 정리한 뒤 다시 실행하기 위해 마지막 요청을 기억합니다. */
  private last: RunOptions | null = null;
  private retries = 0;

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
    const blockedByEarlierRun = this.request !== null && this.retries < MAX_RETRIES;
    const mine = this.last;
    // 멈춘 스크립트는 iframe 하나를 지우는 것으로는 끝나지 않습니다. 모든 iframe을 지워 프로세스를 끝냅니다.
    for (const host of SandboxHost.hosts) host.removeFrames();

    for (const host of SandboxHost.hosts) {
      if (host === this || !host.last) continue;
      const again = host.last;
      clearTimeout(host.restartTimer);
      host.restartTimer = setTimeout(() => host.run(again), RESTART_DELAY_MS);
    }

    if (blockedByEarlierRun && mine) {
      this.retries += 1;
      this.restartTimer = setTimeout(() => this.run(mine), RESTART_DELAY_MS);
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
    clearTimeout(this.settleTimer);
    this.overdue = false;
    this.pending?.remove();
    this.pending = null;
  }

  /** 준비된 새 화면을 이전 화면과 바꿔 끼웁니다. */
  private reveal(frame: HTMLIFrameElement): void {
    clearTimeout(this.timer);
    clearTimeout(this.settleTimer);
    this.overdue = false;
    this.visible?.remove();
    this.visible = frame;
    this.pending = null;
    frame.classList.remove('is-pending');
  }

  /**
   * iframe은 살아 있는데 최상위 코드가 끝나지 않는 경우입니다. 이유를 알리고 지금까지의 결과로 마무리합니다.
   * iframe은 그대로 두므로 뒤늦게 오는 출력과 진짜 완료 신호도 그대로 반영됩니다.
   */
  private settle(frame: HTMLIFrameElement): void {
    if (this.pending !== frame) return;
    this.emit({
      type: 'log',
      level: 'warn',
      text: `${SETTLE_MS / 1000}초가 지나도 끝나지 않은 await가 있습니다. 지금까지의 결과를 먼저 보여 드립니다. Promise의 resolve()가 호출되는지 확인해 보세요.`,
    });
    this.reveal(frame);
    this.emit({ type: 'done', rendered: false });
  }

  private onMessage = (event: MessageEvent): void => {
    const frame = this.current;
    if (!frame || event.source !== frame.contentWindow) return;
    const message = parseMessage(event.data);
    if (!message) return;
    if (this.pending === frame) this.watch(frame);

    switch (message.type) {
      case 'ready':
        this.retries = 0;
        if (this.request) {
          frame.contentWindow?.postMessage(this.request, '*');
          clearTimeout(this.settleTimer);
          this.overdue = false;
          this.settleTimer = setTimeout(() => {
            if (this.pending === frame) this.overdue = true;
          }, SETTLE_MS);
        }
        this.request = null;
        break;
      case 'alive':
        // 시간이 지났다고 바로 마무리하지 않습니다. 그 순간 iframe이 동기 계산 중이었는지(곧 스스로 끝남),
        // await에서 쉬고 있었는지는 그 뒤에 오는 신호로만 알 수 있습니다. 신호는 iframe이 쉬고 있을 때만 옵니다.
        if (this.overdue && this.pending === frame) {
          clearTimeout(this.settleTimer);
          const dueAt = Date.now() + SETTLE_GRACE_MS;
          this.settleTimer = setTimeout(() => {
            // 기다리는 사이에 다시 계산을 시작했다면(타이머가 밀림) 마무리하지 않고 다음 신호에서 다시 봅니다.
            if (Date.now() - dueAt < LATE_MS) this.settle(frame);
          }, SETTLE_GRACE_MS);
        }
        break;
      case 'log':
        this.emit(message);
        break;
      case 'dom':
        this.emit(message);
        break;
      case 'done':
        if (this.pending === frame) this.reveal(frame);
        this.emit(message);
        break;
    }
  };
}
