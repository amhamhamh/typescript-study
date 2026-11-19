import { transform } from 'sucrase';

export type CompileResult = { ok: true; code: string } | { ok: false; message: string };

/**
 * TS/TSX를 "브라우저가 바로 실행할 수 있는 JS"로 바꿉니다.
 * 타입 표기를 지우고, JSX를 함수 호출로, import를 require로 바꾸는 것이 전부입니다.
 * 타입 검사는 하지 않습니다 — 실제 번들러(Metro, Vite)와 같은 방식입니다.
 */
export function compile(source: string, jsx: boolean): CompileResult {
  try {
    const { code } = transform(source, {
      // JSX를 켜면 `<T>(x: T) => x` 같은 제네릭 화살표 함수를 태그로 오해하므로, 필요할 때만 켭니다.
      transforms: jsx ? ['typescript', 'jsx', 'imports'] : ['typescript', 'imports'],
      jsxRuntime: 'automatic',
      production: true,
      filePath: jsx ? 'example.tsx' : 'example.ts',
    });
    return { ok: true, code };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // sucrase 메시지 예: "Unexpected token (3:12)" → 줄 번호만 한국어로 다듬습니다.
    const at = message.match(/\((\d+):(\d+)\)\s*$/);
    const text = message.replace(/^Error transforming [^:]+: /, '').replace(/\s*\(\d+:\d+\)\s*$/, '');
    return { ok: false, message: at ? `문법 오류: ${text}  (${at[1]}행)` : `문법 오류: ${text}` };
  }
}
