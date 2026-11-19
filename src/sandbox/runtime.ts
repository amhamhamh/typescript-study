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

// 학습자 코드가 window.setTimeout 같은 전역을 바꿔 끼울 수 있습니다(가짜 타이머, 디바운스 실습 등).
// 런타임이 스스로 쓰는 타이머와 시계는 코드를 실행하기 전에 원래 것을 잡아 둡니다.
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window);
const nativeSetInterval = window.setInterval.bind(window);
const nativeClearInterval = window.clearInterval.bind(window);
const nativeNow = performance.now.bind(performance);

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

/** 취소된 Proxy(또는 getPrototypeOf 트랩이 던지는 Proxy)는 instanceof 검사만으로도 예외가 납니다. */
function isError(value: unknown): value is Error {
  try {
    return value instanceof Error;
  } catch {
    return false;
  }
}

function lineOf(error: unknown): number | null {
  try {
    if (!isError(error) || !error.stack) return null;
    const match = error.stack.match(new RegExp(`${SOURCE_NAME.replace('.', '\\.')}:(\\d+)`));
    if (!match) return null;
    const line = Number(match[1]) - lineOffset;
    return line > 0 ? line : null;
  } catch {
    // stack을 읽는 것만으로 예외가 나는 값(get 트랩이 던지는 Proxy, 던지는 getter)은 줄 번호 없이 보여 줍니다.
    return null;
  }
}

function describe(error: unknown): string {
  // 오류는 "이름: 메시지" 뒤에 cause나 직접 붙인 필드(code, status …)까지 보여 줍니다.
  const text = isError(error) ? formatArgs([error]) : `Uncaught ${formatArgs([error])}`;
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
      if (args.length === 1 && isError(args[0])) text = describe(args[0]);
      if (!IGNORED.some((pattern) => pattern.test(text))) log(level, text);
    };
  }
  target.table = (...args: unknown[]) => target.log?.(...args);

  // 아래 메서드들도 콘솔 패널에 한 줄씩 남깁니다. 위에서 바꾼 log/warn/error를 거치므로 형식과 필터가 같습니다.
  target.dir = (value: unknown) => target.log?.(value);
  target.dirxml = (...args: unknown[]) => target.log?.(...args);
  target.trace = (...args: unknown[]) =>
    typeof args[0] === 'string' ? target.log?.(`Trace: ${args[0]}`, ...args.slice(1)) : target.log?.('Trace', ...args);
  target.assert = (condition?: unknown, ...args: unknown[]) => {
    if (condition) return;
    if (typeof args[0] === 'string') target.error?.(`Assertion failed: ${args[0]}`, ...args.slice(1));
    else target.error?.('Assertion failed', ...args);
  };
  // 묶음의 들여쓰기는 흉내 내지 않고 제목만 보여 줍니다.
  target.group = target.groupCollapsed = (...args: unknown[]) => {
    if (args.length > 0) target.log?.(...args);
  };
  const counts = new Map<string, number>();
  target.count = (label: unknown = 'default') => {
    const key = String(label);
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    target.log?.(`${key}: ${next}`);
  };
  target.countReset = (label: unknown = 'default') => void counts.delete(String(label));
  const timers = new Map<string, number>();
  const elapsed = (label: unknown, rest: unknown[], stop: boolean): void => {
    const key = String(label);
    const startedAt = timers.get(key);
    if (startedAt === undefined) return void target.warn?.(`Timer '${key}' does not exist`);
    if (stop) timers.delete(key);
    target.log?.(`${key}: ${(nativeNow() - startedAt).toFixed(1)}ms`, ...rest);
  };
  target.time = (label: unknown = 'default') => void timers.set(String(label), nativeNow());
  target.timeLog = (label: unknown = 'default', ...rest: unknown[]) => elapsed(label, rest, false);
  target.timeEnd = (label: unknown = 'default') => elapsed(label, [], true);
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
  if (typeof BigInt === 'function') pin(BigInt.prototype, 'toLocaleString');
  for (const method of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']) pin(Date.prototype, method);

  const intl = Intl as unknown as Record<string, new (...args: unknown[]) => object>;
  const withLocale = (args: unknown[]): unknown[] => [args[0] ?? LOCALE, ...args.slice(1)];
  // `new` 없이 불러도 되는 생성자들. 나머지는 원래대로 TypeError가 나야 합니다.
  const CALLABLE = new Set(['NumberFormat', 'DateTimeFormat', 'Collator']);
  const names = ['NumberFormat', 'DateTimeFormat', 'RelativeTimeFormat', 'ListFormat', 'PluralRules', 'Collator', 'DisplayNames', 'Segmenter', 'DurationFormat'];
  for (const name of names) {
    const Original = intl[name];
    if (typeof Original !== 'function') continue;
    const proxy = new Proxy(Original, {
      // newTarget을 그대로 넘겨야 `class Won extends Intl.NumberFormat`의 인스턴스가 Won의 메서드를 가집니다.
      construct: (target, args: unknown[], newTarget) => Reflect.construct(target, withLocale(args), newTarget),
      apply: (target, self, args: unknown[]) =>
        CALLABLE.has(name) ? new target(...withLocale(args)) : (Reflect.apply(target, self, args) as object),
    });
    try {
      // `new Intl.NumberFormat().constructor === Intl.NumberFormat`이 그대로 성립하게 합니다.
      Object.defineProperty(Original.prototype, 'constructor', { value: proxy, writable: true, configurable: true });
    } catch {
      // 재정의할 수 없는 환경이면 그대로 둡니다.
    }
    intl[name] = proxy;
  }
}

// ── 끝나지 않는 반복문 막기 ──────────────────────────────
// compile.ts 가 모든 반복문 본문 첫머리에 이 함수의 호출을 넣어 둡니다. 인자는 반복문마다 다른 번호입니다.

const LOOP_BUDGET_MS = 2000;
/**
 * 시계를 읽는 간격의 상한. 본문이 가벼운 반복문에서는 이만큼의 반복마다 한 번만 읽습니다.
 * 가볍게 돌던 본문이 갑자기 무거워지면 다음에 시계를 읽을 때까지(최대 15번의 반복) 알아채지 못하므로 크게 잡지 않습니다.
 * (16이면 반복 한 번에 8ns쯤 듭니다. 64는 4ns쯤이지만 본문이 70ms로 바뀐 반복문을 4초 넘게 놓칩니다.)
 */
const MAX_STRIDE = 16;

interface LoopSite {
  /** 이번 동기 구간에서 이 반복문의 시간을 재기 시작한 시각 */
  startedAt: number;
  lastCheckAt: number;
  /** 시계를 몇 번째 반복마다 읽을지 */
  stride: number;
  untilCheck: number;
  /** 예산 내내 돌지 않다가 다시 돈 것을 이미 한 번 봐줬는지 */
  resumed: boolean;
}

/** 반복문 번호 → 이번 동기 구간에서의 상태. 구간이 끝나면 비웁니다. */
const loopSites = new Map<unknown, LoopSite>();
let inSlice = false;
let tripped = false;

function loopError(): Error {
  const error = new Error(`반복문이 ${LOOP_BUDGET_MS / 1000}초 넘게 끝나지 않았습니다. 반복이 끝나는 조건을 확인해 보세요.`);
  error.name = '실행 중단';
  return error;
}

function endSlice(): void {
  inSlice = false;
  tripped = false;
  loopSites.clear();
}

/**
 * 반복문이 끝났는지는 알 수 없고, 같은 번호의 반복문이 또 돌았다는 것만 보입니다. 그래서 2초 넘게 조용하다가
 * 다시 돈 반복문은 어림으로 다룹니다.
 *  - 짧은 반복문이 2초 넘게 걸린 다른 계산의 앞뒤로 불린 경우: 한 번은 봐주고, 같은 일이 또 생기면 중단합니다.
 *  - 반복 한 번이 2초 넘게 걸리는 반복문: 위와 구별되지 않아, 두 번째가 아니라 세 번째 반복에서 중단합니다.
 *  - 가볍게 돌다가 본문이 무거워져 시계를 읽지 못한 사이에 2초가 지난 반복문: 마찬가지로 2초를 더 돈 뒤에 중단합니다.
 */
function loopGuard(site?: unknown): void {
  // 한 번 걸리면 같은 동기 구간 안에서는 계속 던져서, 바깥 반복문이 try/catch로 삼켜도 빠져나오게 합니다.
  if (tripped) throw loopError();
  const state = loopSites.get(site);
  if (state === undefined) {
    // 시간은 반복문마다 따로 잽니다. 반복문 앞에서 오래 걸린 다른 계산이 이 반복문 탓이 되지 않습니다.
    const now = nativeNow();
    loopSites.set(site, { startedAt: now, lastCheckAt: now, stride: 1, untilCheck: 1, resumed: false });
    if (!inSlice) {
      // 타이머 콜백은 동기 코드가 끝나야 실행됩니다. 즉 이 플래그가 켜져 있는 동안은 "한 번도 쉬지 않고" 돌았다는 뜻입니다.
      // (마이크로태스크로 바꾸면 안 됩니다. `while (true) { await Promise.resolve(); }`도 쉬지 않는 반복입니다.)
      inSlice = true;
      nativeSetTimeout(endSlice, 0);
    }
    return;
  }
  if (--state.untilCheck > 0) return;
  const now = nativeNow();
  const gap = now - state.lastCheckAt;
  if (now - state.startedAt > LOOP_BUDGET_MS) {
    // 예산 내내 이 반복문에서 시계를 한 번도 읽지 않았다면 2초 동안 돈 것이 아닐 수 있습니다. 합계를 구하는 함수의 짧은
    // 반복문이 오래 걸린 다른 계산의 앞뒤로 두 번 불린 경우가 그렇습니다. 한 번은 시간을 처음부터 다시 잽니다.
    if (!state.resumed && gap > LOOP_BUDGET_MS) {
      state.resumed = true;
      state.startedAt = state.lastCheckAt = now;
      state.stride = state.untilCheck = 1;
      return;
    }
    tripped = true;
    throw loopError();
  }
  // 본문이 느리면(지난 간격이 1ms 이상) 매 반복마다, 빠르면 점점 드물게 시계를 읽습니다.
  // 매번 읽으면 가벼운 반복문이 몇 배 느려지고, 고정 간격으로 읽으면 본문이 무거운 반복문을 2초에 멈추지 못합니다.
  state.stride = gap >= 1 ? 1 : Math.min(state.stride * 2, MAX_STRIDE);
  state.untilCheck = state.stride;
  state.lastCheckAt = now;
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
  let timer: number | undefined;
  const report = () => post({ type: 'dom', text: (root.innerText || root.textContent || '').slice(0, 4000) });
  new MutationObserver(() => {
    nativeClearTimeout(timer);
    timer = nativeSetTimeout(report, 80);
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
  const heartbeat = nativeSetInterval(() => post({ type: 'alive' }), 1000);
  try {
    const execute = new AsyncFunction(
      'require',
      'module',
      'exports',
      LOOP_GUARD,
      // 블록으로 감싸 학습자의 const/let/class 가 주입한 매개변수 이름(require, module, exports)을 가릴 수 있게 합니다.
      // 줄바꿈을 앞에 추가하지 않으므로 줄 번호는 그대로이고, "use strict" 는 블록 밖에 다시 적어 엄격 모드를 유지합니다.
      `"use strict";{${request.code}\n}\n//# sourceURL=${SOURCE_NAME}`,
    );
    await execute(requireModule, module, module.exports, loopGuard);
    rendered = mount(module.exports.default, request.runner);
  } catch (error) {
    log('error', describe(error), true);
  }
  // 첫 렌더링과 useEffect가 끝난 뒤에 "완료"를 알립니다.
  nativeSetTimeout(() => {
    nativeClearInterval(heartbeat);
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
