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

/**
 * sucrase는 `namespace` 블록을 조용히 지워 버립니다. 타입 검사는 통과하는데 실행하면
 * "X is not defined"가 나는 혼란을 막기 위해, 실행 전에 알려 줍니다.
 */
function findUnsupported(source: string): string | null {
  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index++) {
    if (/^\s*(export\s+)?(namespace|module)\s+[A-Za-z_$][\w$.]*\s*\{/.test(lines[index] ?? '')) {
      return `실습 환경에서는 namespace 블록을 실행할 수 없습니다. 객체나 모듈(export)로 바꿔 주세요.  (${index + 1}행)`;
    }
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
 * 모든 반복문의 본문 첫머리에 `__tslLoop();`를 넣습니다.
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

  const inserts: Array<{ at: number; text: string }> = [];
  const visit = (node: AstNode): void => {
    if (LOOPS.has(node.type) && isNode(node.body)) {
      const body = node.body;
      if (body.type === 'BlockStatement') {
        inserts.push({ at: body.start + 1, text: `${LOOP_GUARD}();` });
      } else {
        // 중괄호 없는 본문: `while (x) step();` → `while (x) {__tslLoop();step();}`
        inserts.push({ at: body.start, text: `{${LOOP_GUARD}();` });
        inserts.push({ at: body.end, text: '}' });
      }
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) {
        for (const item of value) if (isNode(item)) visit(item);
      } else if (isNode(value)) {
        visit(value);
      }
    }
  };
  visit(ast);
  if (inserts.length === 0) return code;

  // 뒤에서부터 끼워 넣어야 앞쪽 위치가 밀리지 않습니다. 같은 위치라면 닫는 괄호가 먼저 와야 합니다.
  inserts.sort((a, b) => b.at - a.at || (a.text === '}' ? 1 : -1));
  let output = code;
  for (const insert of inserts) output = output.slice(0, insert.at) + insert.text + output.slice(insert.at);
  return output;
}
