import type { Runner } from './protocol';

// 미리보기 문서의 기본 스타일. 예제 코드가 CSS 없이도 보기 좋게 나오도록 최소한만 잡아 둡니다.
const baseCss = `
:root { color-scheme: light; --ink:#1c1b18; --muted:#666257; --line:#dcd8cb; --bg:#ffffff; --soft:#f3f1ea; --accent:#2b68b5; --accent-ink:#fff; --bad:#b0281f; --good:#1b7448; }
:root[data-theme='dark'] { color-scheme: dark; --ink:#e9e6de; --muted:#9aa0ab; --line:#2c3440; --bg:#11151b; --soft:#1b212b; --accent:#74aaf0; --accent-ink:#0a1220; --bad:#f08a80; --good:#5fc08d; }
*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif; word-break: keep-all; }
#root { min-height: 100%; }
.tsl-web #root { padding: 16px; }
.tsl-native #root { display: flex; flex-direction: column; height: 100%; }
h1, h2, h3, h4 { margin: 0 0 8px; line-height: 1.3; letter-spacing: -0.01em; }
h1 { font-size: 1.4rem; } h2 { font-size: 1.2rem; } h3 { font-size: 1.05rem; }
p { margin: 0 0 8px; }
ul, ol { margin: 0 0 8px; padding-left: 20px; }
small, .muted { color: var(--muted); }
code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.88em; background: var(--soft); padding: 1px 5px; border-radius: 4px; }
button { font: inherit; font-weight: 600; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--soft); color: var(--ink); cursor: pointer; }
button:hover { border-color: var(--muted); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
button.ghost { background: transparent; }
button.danger { background: var(--bad); border-color: var(--bad); color: #fff; }
input, select, textarea { font: inherit; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); max-width: 100%; }
input[type='checkbox'], input[type='radio'] { padding: 0; accent-color: var(--accent); }
label { display: inline-flex; align-items: center; gap: 6px; }
hr { border: 0; border-top: 1px solid var(--line); margin: 12px 0; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.stack { display: grid; gap: 10px; }
.card { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
.badge { display: inline-block; padding: 1px 9px; border-radius: 999px; background: var(--soft); font-size: 0.8rem; font-weight: 600; }
.badge.info { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.badge.danger { background: color-mix(in srgb, var(--bad) 16%, transparent); color: var(--bad); }
.badge.success { background: color-mix(in srgb, var(--good) 18%, transparent); color: var(--good); }
.tsl-empty { margin: 0; padding: 24px 16px; color: var(--muted); font-size: 0.9rem; text-align: center; }
.tsl-crash { display: grid; gap: 4px; margin: 16px; padding: 12px 14px; border-radius: 10px; background: color-mix(in srgb, var(--bad) 12%, transparent); color: var(--bad); font-size: 0.9rem; }
`;

// 실제 네트워크와 외부 리소스를 막습니다. 예제의 fetch는 런타임의 가짜 API가 처리합니다.
const CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:;";

/** iframe의 srcdoc으로 넣을 HTML 문서를 만듭니다. */
export function buildDocument(runtime: string, runner: Runner, theme: 'light' | 'dark'): string {
  // 스크립트 안에 "</script>"가 있으면 문서가 깨지므로 이스케이프합니다.
  const safeRuntime = runtime.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  return `<!doctype html>
<html lang="ko" data-theme="${theme}" class="${runner === 'native' ? 'tsl-native' : 'tsl-web'}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<style>${baseCss}</style>
</head>
<body>
<div id="root"></div>
<script>${safeRuntime}</script>
</body>
</html>`;
}
