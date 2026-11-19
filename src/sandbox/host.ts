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

const TIMEOUT_MS = 5000;

function isFromSandbox(data: unknown): data is FromSandbox {
  return typeof data === 'object' && data !== null && (data as Record<string, unknown>)[CHANNEL] === true;
}

/**
 * 코드를 실행할 iframe을 관리합니다.
 *
 * 실행할 때마다 새 iframe을 만듭니다. 이전 실행의 타이머·이벤트 리스너·전역 변수가 남지 않고,
 * 무한 루프에 빠져도 그 iframe만 버리면 됩니다. 새 화면이 준비될 때까지는 이전 화면을 그대로
 * 보여 주다가 바꿔 끼우므로 입력할 때마다 미리보기가 깜빡이지 않습니다.
 */
export class SandboxHost {
  private visible: HTMLIFrameElement | null = null;
  private pending: HTMLIFrameElement | null = null;
  /** 현재 실행에 해당하는 iframe. 여기서 온 메시지만 화면에 반영합니다. */
  private current: HTMLIFrameElement | null = null;
  private request: RunRequest | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly container: HTMLElement,
    private readonly runtime: string,
    private readonly emit: (event: SandboxEvent) => void,
  ) {
    window.addEventListener('message', this.onMessage);
  }

  run({ code, runner, theme }: RunOptions): void {
    this.discardPending();
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

    this.timer = setTimeout(() => {
      if (this.pending !== frame) return;
      this.discardPending();
      this.emit({
        type: 'log',
        level: 'error',
        text: `실행이 ${TIMEOUT_MS / 1000}초 안에 끝나지 않아 중단했습니다. 끝나지 않는 반복문이 있는지 확인해 보세요.`,
      });
      this.emit({ type: 'done', rendered: false });
    }, TIMEOUT_MS);
  }

  /** 실행 전(문법 오류 등)에 끝난 경우에도 콘솔을 같은 흐름으로 갱신합니다. */
  fail(message: string): void {
    this.discardPending();
    this.current = null;
    this.emit({ type: 'start' });
    this.emit({ type: 'log', level: 'error', text: message });
    this.emit({ type: 'done', rendered: false });
  }

  dispose(): void {
    window.removeEventListener('message', this.onMessage);
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
    if (!frame || event.source !== frame.contentWindow || !isFromSandbox(event.data)) return;
    const message = event.data;

    switch (message.type) {
      case 'ready':
        if (this.request) frame.contentWindow?.postMessage(this.request, '*');
        this.request = null;
        break;
      case 'log':
        this.emit({ type: 'log', level: message.level, text: message.text, uncaught: message.uncaught });
        break;
      case 'dom':
        this.emit({ type: 'dom', text: message.text });
        break;
      case 'done':
        if (this.pending === frame) {
          clearTimeout(this.timer);
          this.visible?.remove();
          this.visible = frame;
          this.pending = null;
          frame.classList.remove('is-pending');
        }
        this.emit({ type: 'done', rendered: message.rendered });
        break;
    }
  };
}
