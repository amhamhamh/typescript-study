// 빌드 전에 두 가지를 만들어 src/generated/ 에 넣습니다.
//  1) 에디터(Monaco)에 넣어 줄 타입 선언 묶음 (React, Redux Toolkit, React Native …)
//  2) 미리보기 iframe 안에서 돌아가는 런타임 번들 (React, react-native-web, 콘솔 가로채기 등)
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');
const out = join(root, 'src/generated');
mkdirSync(out, { recursive: true });

type LibMap = Record<string, string>;
const read = (path: string) => readFileSync(join(modules, path), 'utf8');

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

// ── 1) 타입 선언 ─────────────────────────────────────────
// 키는 에디터 안 가상 파일 시스템의 경로입니다. 패키지마다 index.d.ts 로 두면
// package.json 없이도 `import ... from '패키지'` 가 해석됩니다.
const core: LibMap = {
  'node_modules/@types/react/index.d.ts': read('@types/react/index.d.ts'),
  'node_modules/@types/react/global.d.ts': read('@types/react/global.d.ts'),
  'node_modules/@types/react/jsx-runtime.d.ts': read('@types/react/jsx-runtime.d.ts'),
  'node_modules/csstype/index.d.ts': read('csstype/index.d.ts'),
  'node_modules/redux/index.d.ts': read('redux/dist/redux.d.ts'),
  'node_modules/immer/index.d.ts': read('immer/dist/immer.d.ts'),
  'node_modules/reselect/index.d.ts': read('reselect/dist/reselect.d.ts'),
  'node_modules/redux-thunk/index.d.ts': read('redux-thunk/dist/redux-thunk.d.ts'),
  'node_modules/@reduxjs/toolkit/index.d.ts': read('@reduxjs/toolkit/dist/index.d.ts'),
  'node_modules/react-redux/index.d.ts': read('react-redux/dist/react-redux.d.ts'),
};
writeFileSync(join(out, 'types-core.json'), JSON.stringify(core));

const native: LibMap = {
  'node_modules/react-native/index.d.ts': "export * from './types_generated/index';\n",
  'node_modules/@react-native/virtualized-lists/index.d.ts': "export * from './types_generated/index';\n",
};
for (const [pkg, dirs] of [
  ['react-native', ['types_generated', 'src/types']],
  ['@react-native/virtualized-lists', ['types_generated']],
] as const) {
  for (const dir of dirs) {
    for (const file of walk(join(modules, pkg, dir))) {
      native[`node_modules/${pkg}/${relative(join(modules, pkg), file)}`] = readFileSync(file, 'utf8');
    }
  }
}
writeFileSync(join(out, 'types-native.json'), JSON.stringify(native));

// ── 2) 샌드박스 런타임 ────────────────────────────────────
await build({
  configFile: false,
  root,
  logLevel: 'error',
  // 학습용이므로 React의 친절한 경고 메시지가 나오는 개발 빌드를 씁니다.
  define: { 'process.env.NODE_ENV': '"development"' },
  build: {
    lib: { entry: join(root, 'src/sandbox/runtime.ts'), formats: ['iife'], name: '__tslRuntime', fileName: () => 'sandbox-runtime.js' },
    outDir: out,
    emptyOutDir: false,
    copyPublicDir: false,
    minify: true,
  },
});

const size = (name: string) => `${(statSync(join(out, name)).size / 1024).toFixed(0)}KB`;
console.log(`generated: types-core ${size('types-core.json')}, types-native ${size('types-native.json')}, runtime ${size('sandbox-runtime.js')}`);
