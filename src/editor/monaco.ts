// Monaco(VS Code의 에디터 엔진)를 설정합니다. 용량이 커서 필요한 순간에 동적 import로 불러옵니다.
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker.js?worker';

// 에디터 안의 가상 파일 시스템에 넣을 타입 선언 묶음입니다. (scripts/prebuild.ts 가 생성)
// React, Redux Toolkit, react-redux의 실제 타입이 들어 있어 자동완성과 오류 메시지가 실제 프로젝트와 같습니다.
import coreTypes from '../generated/types-core.json';
import nativeTypesUrl from '../generated/types-native.json?url';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    return label === 'typescript' || label === 'javascript' ? new TsWorker() : new EditorWorker();
  },
};

const ts = monaco.typescript;

ts.typescriptDefaults.setCompilerOptions({
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  esModuleInterop: true,
  allowNonTsExtensions: true,
  // 모든 예제를 각각 독립된 모듈로 취급합니다. (예제끼리 변수 이름이 겹쳐도 충돌하지 않도록)
  moduleDetection: 3,
});
ts.typescriptDefaults.setEagerModelSync(true);

function addLibs(libs: Record<string, string>): void {
  for (const [path, content] of Object.entries(libs)) ts.typescriptDefaults.addExtraLib(content, `file:///${path}`);
}
addLibs(coreTypes);

let nativeTypes: Promise<void> | null = null;

/** React Native 타입은 용량이 커서, RN 예제가 처음 열릴 때 불러옵니다. */
export function ensureNativeTypes(): Promise<void> {
  // import()가 아니라 fetch로 받습니다. 한 번 실패한 동적 import는 브라우저가 기억해서 같은 페이지에서 다시 받을 수 없지만,
  // fetch는 다음 RN 예제를 열 때 다시 요청할 수 있습니다.
  nativeTypes ??= fetch(nativeTypesUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`types-native ${response.status}`);
      return response.json() as Promise<Record<string, string>>;
    })
    .then(addLibs)
    .catch((error: unknown) => {
      nativeTypes = null;
      throw error;
    });
  return nativeTypes;
}

monaco.editor.defineTheme('tsl-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#fbfaf7',
    'editor.lineHighlightBackground': '#f1efe8',
    'editorLineNumber.foreground': '#7d796c',
    'editorLineNumber.activeForeground': '#1c1b18',
    'editorGutter.background': '#fbfaf7',
  },
});
monaco.editor.defineTheme('tsl-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#12161d',
    'editor.lineHighlightBackground': '#1a202a',
    'editorLineNumber.foreground': '#7a8496',
    'editorLineNumber.activeForeground': '#e9e6de',
    'editorGutter.background': '#12161d',
  },
});

// 에디터의 우클릭 메뉴는 꺼 두었습니다(Workbench.tsx의 contextmenu: false). 그런데 Shift+F10은 Monaco가 여전히 가져가서
// 아무 메뉴도 뜨지 않는 죽은 키가 됩니다. 단축키를 풀어서 우클릭과 똑같이 브라우저의 기본 메뉴가 뜨게 합니다.
monaco.editor.addKeybindingRule({ keybinding: monaco.KeyMod.Shift | monaco.KeyCode.F10, command: null });

export interface Diagnostic {
  line: number;
  column: number;
  message: string;
  code: number;
}

type MessageChain = { messageText: string; next?: MessageChain[] };

function flatten(message: string | MessageChain): string {
  if (typeof message === 'string') return message;
  const rest = (message.next ?? []).map(flatten).join(' ');
  return rest ? `${message.messageText} ${rest}` : message.messageText;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function workerFor(uri: monaco.Uri) {
  // TypeScript 언어 기능은 첫 모델이 만들어진 뒤 비동기로 등록됩니다.
  // 그 전에 요청하면 "TypeScript not registered!" 오류가 나므로 준비될 때까지 잠깐 기다립니다.
  for (let attempt = 0; ; attempt++) {
    try {
      const getWorker = await ts.getTypeScriptWorker();
      return await getWorker(uri);
    } catch (error) {
      if (attempt >= 40) throw error;
      await wait(150);
    }
  }
}

/** 모델의 문법/타입 오류를 TypeScript 워커에 직접 물어봅니다. */
export async function getDiagnostics(model: monaco.editor.ITextModel): Promise<Diagnostic[]> {
  const worker = await workerFor(model.uri);
  const name = model.uri.toString();
  const [syntactic, semantic] = await Promise.all([
    worker.getSyntacticDiagnostics(name),
    worker.getSemanticDiagnostics(name),
  ]);
  return [...syntactic, ...semantic]
    .filter((d) => d.category === 1)
    .map((d) => {
      const pos = model.getPositionAt(d.start ?? 0);
      return { line: pos.lineNumber, column: pos.column, message: flatten(d.messageText), code: d.code };
    })
    .sort((a, b) => a.line - b.line || a.column - b.column);
}

/** 타입이 지워진 뒤의 JavaScript를 돌려줍니다. */
export async function getCompiledJs(model: monaco.editor.ITextModel): Promise<string> {
  const worker = await workerFor(model.uri);
  const output = await worker.getEmitOutput(model.uri.toString());
  return output.outputFiles[0]?.text ?? '';
}

export { monaco };
