// 미리보기 iframe 안에서 실행되는 런타임입니다.
// scripts/prebuild.ts 가 이 파일을 하나의 스크립트로 묶어 src/generated/sandbox-runtime.js 로 만듭니다.
//
// 하는 일
//  - 부모가 보낸 (이미 JS로 변환된) 코드를 실행
//  - console.* 과 잡히지 않은 오류를 부모에게 전달
//  - `export default` 된 컴포넌트를 화면에 렌더링 (React DOM 또는 react-native-web)
import * as React from 'react';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReduxToolkit from '@reduxjs/toolkit';
import * as ReactRedux from 'react-redux';
import * as ReactNative from 'react-native-web';
import { formatArgs } from './inspect';
import { installMockFetch } from './mockApi';
import { CHANNEL, LOOP_GUARD, type FromSandbox, type LogLevel, type RunRequest, type Runner } from './protocol';

const SOURCE_NAME = 'example.tsx';

function post(message: FromSandbox): void {
  window.parent.postMessage({ [CHANNEL]: true, ...message }, '*');
}

function log(level: LogLevel, text: string, uncaught = false): void {
  post(uncaught ? { type: 'log', level, text, uncaught } : { type: 'log', level, text });
}

// ── 오류에 줄 번호 붙이기 ────────────────────────────────

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;

/** new Function 으로 만든 함수는 브라우저마다 본문 앞에 붙는 줄 수가 다릅니다. 한 번 재 둡니다. */
function measureLineOffset(): number {
  try {
    const probe = new Function(`return new Error().stack\n//# sourceURL=${SOURCE_NAME}`) as () => string | undefined;
    const match = probe()?.match(new RegExp(`${SOURCE_NAME.replace('.', '\\.')}:(\\d+)`));
    return match ? Number(match[1]) - 1 : 0;
  } catch {
    return 0;
  }
}
const lineOffset = measureLineOffset();

function lineOf(error: unknown): number | null {
  if (!(error instanceof Error) || !error.stack) return null;
  const match = error.stack.match(new RegExp(`${SOURCE_NAME.replace('.', '\\.')}:(\\d+)`));
  if (!match) return null;
  const line = Number(match[1]) - lineOffset;
  return line > 0 ? line : null;
}

function describe(error: unknown): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : `Uncaught ${formatArgs([error])}`;
  const line = lineOf(error);
  return line ? `${text}  (${line}행)` : text;
}

// ── 콘솔 · 전역 오류 가로채기 ────────────────────────────

const IGNORED = [/Download the React DevTools/];

function patchConsole(): void {
  const levels: Record<string, LogLevel> = { log: 'log', debug: 'log', info: 'info', warn: 'warn', error: 'error' };
  const target = console as unknown as Record<string, (...args: unknown[]) => void>;
  for (const [method, level] of Object.entries(levels)) {
    const original = target[method]?.bind(console);
    target[method] = (...args: unknown[]) => {
      original?.(...args);
      let text: string;
      try {
        text = formatArgs(args);
      } catch {
        text = '[출력할 수 없는 값]';
      }
      // console.error(error)로 넘어온 오류에도 줄 번호를 붙여 줍니다.
      if (args.length === 1 && args[0] instanceof Error) text = describe(args[0]);
      if (!IGNORED.some((pattern) => pattern.test(text))) log(level, text);
    };
  }
  target.table = (...args: unknown[]) => target.log?.(...args);
}

function patchGlobals(): void {
  window.addEventListener('error', (event) => {
    event.preventDefault();
    log('error', describe(event.error ?? event.message), true);
  });
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    log('error', `${describe(event.reason)}  ← 처리되지 않은 Promise 거부`, true);
  });

  // 샌드박스에서는 alert 같은 모달이 막혀 있으므로 콘솔로 돌립니다.
  window.alert = (message?: unknown) => log('info', `[alert] ${formatArgs([message])}`);
  window.confirm = (message?: unknown) => {
    log('info', `[confirm] ${formatArgs([message])} → true`);
    return true;
  };
  window.prompt = (message?: unknown) => {
    log('info', `[prompt] ${formatArgs([message])} → null`);
    return null;
  };

  // 출처가 없는 샌드박스에서는 localStorage 접근이 예외를 던집니다. 메모리 저장소로 바꿉니다.
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, String(value)),
      removeItem: (key: string) => void memory.delete(key),
      clear: () => memory.clear(),
      key: (index: number) => [...memory.keys()][index] ?? null,
      get length() {
        return memory.size;
      },
    };
    try {
      Object.defineProperty(window, name, { value: storage, configurable: true });
    } catch {
      // 재정의할 수 없는 환경이면 그대로 둡니다.
    }
  }
}

/**
 * `toLocaleString()`처럼 로케일을 생략한 호출은 브라우저 언어 설정에 따라 결과가 달라집니다.
 * (같은 12000이 '12,000' / '12.000' / '12 000') 설명과 미션이 누구에게나 같은 화면을 가리키도록
 * 기본 로케일을 한국어로 고정합니다. 로케일을 직접 넘긴 호출은 그대로 둡니다.
 */
function patchLocale(): void {
  const LOCALE = 'ko-KR';
  type Localized = (this: unknown, locales?: unknown, options?: unknown) => string;
  const pin = (proto: object, method: string): void => {
    const target = proto as Record<string, Localized>;
    const original = target[method];
    if (typeof original !== 'function') return;
    target[method] = function (this: unknown, locales?: unknown, options?: unknown) {
      return original.call(this, locales ?? LOCALE, options);
    };
  };
  pin(Number.prototype, 'toLocaleString');
  for (const method of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']) pin(Date.prototype, method);

  const intl = Intl as unknown as Record<string, new (locales?: unknown, options?: unknown) => object>;
  for (const name of ['NumberFormat', 'DateTimeFormat']) {
    const Original = intl[name];
    if (typeof Original !== 'function') continue;
    intl[name] = new Proxy(Original, {
      construct: (target, args: unknown[]) => new target(args[0] ?? LOCALE, args[1]),
      apply: (target, _self, args: unknown[]) => new target(args[0] ?? LOCALE, args[1]),
    });
  }
}

// ── 끝나지 않는 반복문 막기 ──────────────────────────────
// compile.ts 가 모든 반복문 본문 첫머리에 이 함수의 호출을 넣어 둡니다.

const LOOP_BUDGET_MS = 2000;
let loopTicks = 0;
let sliceStartedAt = 0;
let inSlice = false;
let tripped = false;

function loopError(): Error {
  const error = new Error(`반복문이 ${LOOP_BUDGET_MS / 1000}초 넘게 끝나지 않았습니다. 반복이 끝나는 조건을 확인해 보세요.`);
  error.name = '실행 중단';
  return error;
}

function loopGuard(): void {
  // 한 번 걸리면 같은 동기 구간 안에서는 계속 던져서, 바깥 반복문이 try/catch로 삼켜도 빠져나오게 합니다.
  if (tripped) throw loopError();
  if (++loopTicks % 64 !== 0) return;
  const now = performance.now();
  if (!inSlice) {
    // 타이머 콜백은 동기 코드가 끝나야 실행됩니다. 즉 이 플래그가 켜져 있는 동안은 "한 번도 쉬지 않고" 돌았다는 뜻입니다.
    inSlice = true;
    sliceStartedAt = now;
    setTimeout(() => {
      inSlice = false;
      tripped = false;
    }, 0);
    return;
  }
  if (now - sliceStartedAt > LOOP_BUDGET_MS) {
    tripped = true;
    throw loopError();
  }
}

// ── 모듈 ─────────────────────────────────────────────────

function asModule(namespace: object): Record<string, unknown> {
  const ns = namespace as Record<string, unknown>;
  return { ...ns, default: ns.default ?? ns, __esModule: true };
}

const nativeModule = asModule(ReactNative);
// react-native-web의 Alert는 아무 일도 하지 않습니다. 눌렀다는 걸 알 수 있게 콘솔에 남깁니다.
nativeModule.Alert = {
  alert: (title: string, message?: string) => log('info', `[Alert] ${title}${message ? ` — ${message}` : ''}`),
};

const modules: Record<string, Record<string, unknown>> = {
  react: asModule(React),
  'react/jsx-runtime': asModule(ReactJsxRuntime),
  'react-dom': asModule(ReactDOM),
  'react-dom/client': asModule(ReactDOMClient),
  '@reduxjs/toolkit': asModule(ReduxToolkit),
  'react-redux': asModule(ReactRedux),
  'react-native': nativeModule,
};

function requireModule(name: string): Record<string, unknown> {
  const found = modules[name];
  if (!found) {
    throw new Error(`'${name}' 모듈은 실습 환경에 없습니다. 사용할 수 있는 모듈: ${Object.keys(modules).join(', ')}`);
  }
  return found;
}

// ── 렌더링 ───────────────────────────────────────────────

interface BoundaryState {
  error: Error | null;
}

class Boundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    log('error', `컴포넌트 오류 — ${describe(error)}`, true);
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return React.createElement(
      'div',
      { className: 'tsl-crash' },
      React.createElement('strong', null, '컴포넌트에서 오류가 났습니다'),
      React.createElement('span', null, `${this.state.error.name}: ${this.state.error.message}`),
    );
  }
}

function watchDom(root: HTMLElement): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const report = () => post({ type: 'dom', text: (root.innerText || root.textContent || '').slice(0, 4000) });
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(report, 80);
  }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true });
}

/** 함수 컴포넌트뿐 아니라 memo / forwardRef / lazy 로 감싼 컴포넌트도 받습니다. */
function isComponent(value: unknown): value is React.ComponentType {
  if (typeof value === 'function') return true;
  if (typeof value !== 'object' || value === null) return false;
  const tag = (value as { $$typeof?: unknown }).$$typeof;
  return tag === Symbol.for('react.memo') || tag === Symbol.for('react.forward_ref') || tag === Symbol.for('react.lazy');
}

function mount(component: unknown, runner: Runner): boolean {
  const root = document.getElementById('root');
  if (!root || runner === 'console') return false;

  if (!isComponent(component)) {
    root.innerHTML =
      '<p class="tsl-empty">미리보기에 표시할 컴포넌트가 없습니다.<br><code>export default function App() { … }</code> 형태로 내보내 주세요.</p>';
    return false;
  }
  watchDom(root);
  // 렌더링 오류는 Boundary가 한 줄로 정리해 콘솔에 남깁니다. React의 긴 기본 메시지는 끕니다.
  const rootOptions = {
    onCaughtError: () => {},
    onUncaughtError: (error: unknown) => log('error', describe(error), true),
  };
  ReactDOMClient.createRoot(root, rootOptions).render(
    React.createElement(Boundary, null, React.createElement(component)),
  );
  return true;
}

// ── 실행 ─────────────────────────────────────────────────

async function run(request: RunRequest): Promise<void> {
  const module: { exports: Record<string, unknown> } = { exports: {} };
  let rendered = false;
  // 최상위 await가 오래 걸려도 "멈춘 것"으로 오해받지 않도록, 살아 있다는 신호를 주기적으로 보냅니다.
  const heartbeat = setInterval(() => post({ type: 'alive' }), 1000);
  try {
    const execute = new AsyncFunction(
      'require',
      'module',
      'exports',
      LOOP_GUARD,
      `${request.code}\n//# sourceURL=${SOURCE_NAME}`,
    );
    await execute(requireModule, module, module.exports, loopGuard);
    rendered = mount(module.exports.default, request.runner);
  } catch (error) {
    log('error', describe(error), true);
  }
  // 첫 렌더링과 useEffect가 끝난 뒤에 "완료"를 알립니다.
  setTimeout(() => {
    clearInterval(heartbeat);
    post({ type: 'done', rendered });
  }, 40);
}

function isRunRequest(data: unknown): data is RunRequest {
  return typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'run';
}

let started = false;

patchConsole();
patchGlobals();
patchLocale();
installMockFetch();

window.addEventListener('message', (event) => {
  // 부모 창이 보낸 실행 요청만, 한 번만 받습니다. (실행할 때마다 iframe을 새로 만듭니다)
  if (event.source !== window.parent || started || !isRunRequest(event.data)) return;
  started = true;
  void run(event.data);
});

post({ type: 'ready' });
