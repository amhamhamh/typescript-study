import { parse } from 'acorn';
import { transform } from 'sucrase';
import { LOOP_GUARD } from './protocol';

export type CompileResult = { ok: true; code: string } | { ok: false; message: string };


/**
 * TS/TSX를 "브라우저가 바로 실행할 수 있는 JS"로 바꿉니다.
 * 타입 표기를 지우고, JSX를 함수 호출로, import를 require로 바꾸는 것이 전부입니다.
 * 타입 검사는 하지 않습니다 — 실제 번들러(Metro, Vite)와 같은 방식입니다.
 */
export function compile(source: string, jsx: boolean): CompileResult {
  const unsupported = findUnsupported(source);
  if (unsupported) return { ok: false, message: unsupported };

  try {
    const { code } = transform(source, {
      // JSX를 켜면 `<T>(x: T) => x` 같은 제네릭 화살표 함수를 태그로 오해하므로, 필요할 때만 켭니다.
      transforms: jsx ? ['typescript', 'jsx', 'imports'] : ['typescript', 'imports'],
      jsxRuntime: 'automatic',
      production: true,
      filePath: jsx ? 'example.tsx' : 'example.ts',
    });
    return { ok: true, code: guardLoops(code) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // sucrase 메시지 예: "Unexpected token (3:12)" → 줄 번호만 한국어로 다듬습니다.
    const at = message.match(/\((\d+):(\d+)\)\s*$/);
    const text = message.replace(/^Error transforming [^:]+: /, '').replace(/\s*\(\d+:\d+\)\s*$/, '');
    return { ok: false, message: at ? `문법 오류: ${text}  (${at[1]}행)` : `문법 오류: ${text}` };
  }
}

/** 주석·문자열·템플릿 리터럴의 내용을 공백으로 바꿉니다. 길이와 줄바꿈은 그대로라 줄 번호가 유지됩니다. */
function blankNonCode(source: string): string {
  const out = source.split('');
  const blank = (from: number, to: number): void => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const length = source.length;
  const templates: number[] = []; // `${` 를 만났을 때의 중괄호 깊이
  let depth = 0;
  let i = 0;
  const template = (from: number): number => {
    let k = from;
    while (k < length && source[k] !== '`') {
      if (source[k] === '\\') k++;
      else if (source[k] === '$' && source[k + 1] === '{') {
        blank(from, k);
        templates.push(depth);
        return k + 2;
      }
      k++;
    }
    blank(from, k);
    return k + 1;
  };
  while (i < length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      let k = i;
      while (k < length && source[k] !== '\n') k++;
      blank(i, k);
      i = k;
    } else if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const k = end === -1 ? length : end + 2;
      blank(i, k);
      i = k;
    } else if (ch === '"' || ch === "'") {
      // 따옴표는 한 줄 안에서만 닫힙니다. JSX 글자 속의 아포스트로피(<p>Don't</p>)가 뒤 줄까지 삼키지 않게 합니다.
      let k = i + 1;
      while (k < length && source[k] !== ch && source[k] !== '\n') k += source[k] === '\\' ? 2 : 1;
      blank(i + 1, Math.min(k, length));
      i = k + 1;
    } else if (ch === '`') {
      i = template(i + 1);
    } else if (ch === '{') {
      depth++;
      i++;
    } else if (ch === '}') {
      if (templates.length > 0 && templates[templates.length - 1] === depth) {
        templates.pop();
        i = template(i + 1);
      } else {
        depth--;
        i++;
      }
    } else i++;
  }
  return out.join('');
}

/** 통째로 타입 선언인 블록: `declare namespace X {`, `declare module 'x' {`, `declare global {` */
const AMBIENT = /\bdeclare\s+(?:global|(?:namespace|module)\s+(?:[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*|'[^'\n]*'|"[^"\n]*"))\s*\{/g;
const NAMESPACE = /(?:^|[^\w$.])(?:namespace|module)\s+[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*\{/gm;
const VALUE_DECLARATION = /\b(?:const|let|var|function|class|enum)\b(?!\s*[?:(<,;}])/;

/**
 * sucrase는 `namespace` 블록을 조용히 지워 버립니다. 타입 검사는 통과하는데 실행하면
 * "X is not defined"가 나는 혼란을 막기 위해, 실행 전에 알려 줍니다.
 *
 * 주석·문자열 안의 글자는 보지 않고, 중괄호가 다음 줄에 있어도 찾습니다. `declare`가 붙은 블록(과 그 안의
 * namespace), 타입만 담은 namespace는 지워져도 실행 결과가 같으므로 그대로 둡니다.
 */
function findUnsupported(source: string): string | null {
  if (!/\b(namespace|module)\b/.test(source)) return null;
  let code = blankNonCode(source);
  // 여는 중괄호 바로 뒤의 위치를 받아, 짝이 되는 닫는 중괄호 바로 뒤의 위치를 돌려줍니다.
  const closeOf = (from: number): number => {
    let depth = 1;
    let end = from;
    while (end < code.length && depth > 0) {
      if (code[end] === '{') depth++;
      else if (code[end] === '}') depth--;
      end++;
    }
    return end;
  };

  // declare 블록은 안에 든 namespace·const·function까지 모두 타입 선언입니다. 통째로 공백으로 바꿔 검사에서 뺍니다.
  AMBIENT.lastIndex = 0;
  for (let match = AMBIENT.exec(code); match; match = AMBIENT.exec(code)) {
    const end = closeOf(AMBIENT.lastIndex);
    code = code.slice(0, match.index) + code.slice(match.index, end).replace(/[^\n]/g, ' ') + code.slice(end);
    AMBIENT.lastIndex = end;
  }

  NAMESPACE.lastIndex = 0;
  for (let match = NAMESPACE.exec(code); match; match = NAMESPACE.exec(code)) {
    const end = closeOf(NAMESPACE.lastIndex);
    // interface/type만 담은 namespace는 실행할 것이 없으므로 지워져도 괜찮습니다.
    if (!VALUE_DECLARATION.test(code.slice(NAMESPACE.lastIndex, end))) continue;
    const start = match.index + match[0].search(/(?:namespace|module)\s+[A-Za-z_$]/);
    const line = code.slice(0, start).split('\n').length;
    return `실습 환경에서는 namespace 블록을 실행할 수 없습니다. 객체나 모듈(export)로 바꿔 주세요.  (${line}행)`;
  }
  return null;
}

// ── 끝나지 않는 반복문 막기 ──────────────────────────────

interface AstNode {
  type: string;
  start: number;
  end: number;
  body?: AstNode | AstNode[];
  [key: string]: unknown;
}

const LOOPS = new Set(['WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement']);

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';
}

/**
 * 모든 반복문의 본문 첫머리에 `__tslLoop(n);`을 넣습니다. n은 반복문마다 다른 번호(코드에 나온 순서)이고,
 * 런타임은 이 번호로 반복문별 실행 시간을 따로 잽니다.
 *
 * 미리보기 iframe은 페이지 안의 다른 미리보기들과 같은 스레드에서 돌기 때문에, `while (true) {}` 한 줄이면
 * 모든 예제가 함께 멈춥니다. iframe을 지우는 것만으로는 멈춘 스크립트를 중단할 수 없으므로,
 * 반복이 너무 오래 이어지면 스스로 예외를 던지게 합니다. (CodePen, CodeSandbox와 같은 방식)
 * 줄바꿈을 추가하지 않으므로 오류 메시지의 줄 번호는 그대로입니다.
 */
function guardLoops(code: string): string {
  if (!/\b(for|while|do)\b/.test(code)) return code;

  let ast: AstNode;
  try {
    ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    }) as unknown as AstNode;
  } catch {
    // 분석하지 못하면 보호 없이 실행합니다. 문법 오류라면 실행 단계에서 그대로 보고됩니다.
    return code;
  }

  // 재귀 대신 명시적 스택으로 순회합니다. 항이 수천 개인 식처럼 아주 깊은 트리에서도 호출 스택이 넘치지 않습니다.
  const bodies: AstNode[] = [];
  const pending: AstNode[] = [ast];
  for (let node = pending.pop(); node; node = pending.pop()) {
    if (LOOPS.has(node.type) && isNode(node.body)) bodies.push(node.body);
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) {
        for (const item of value) if (isNode(item)) pending.push(item);
      } else if (isNode(value)) {
        pending.push(value);
      }
    }
  }
  // 번호가 순회 순서가 아니라 코드에 나온 순서를 따르게 합니다.
  bodies.sort((a, b) => a.start - b.start);

  const inserts: Array<{ at: number; text: string }> = [];
  bodies.forEach((body, site) => {
    if (body.type === 'BlockStatement') {
      inserts.push({ at: body.start + 1, text: `${LOOP_GUARD}(${site});` });
    } else {
      // 중괄호 없는 본문: `while (x) step();` → `while (x) {__tslLoop(0);step();}`
      inserts.push({ at: body.start, text: `{${LOOP_GUARD}(${site});` });
      inserts.push({ at: body.end, text: '}' });
    }
  });
  if (inserts.length === 0) return code;

  // 뒤에서부터 끼워 넣어야 앞쪽 위치가 밀리지 않습니다. 같은 위치라면 닫는 괄호가 먼저 와야 합니다.
  inserts.sort((a, b) => b.at - a.at || (a.text === '}' ? 1 : -1));
  let output = code;
  for (const insert of inserts) output = output.slice(0, insert.at) + insert.text + output.slice(insert.at);
  return output;
}
