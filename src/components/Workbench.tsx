import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Runner } from '../content/types';
import type { Diagnostic } from '../editor/monaco';
import { useEngine } from '../editor/useEngine';
import { highlight } from '../lib/highlight';
import type { Observation } from '../lib/goal';
import { compile } from '../sandbox/compile';
import { SandboxHost, type SandboxEvent } from '../sandbox/host';
import type { LogLevel } from '../sandbox/protocol';
import { selectTheme, useAppSelector } from '../store';

/** 부모(레슨 화면)가 에디터를 조작할 때 쓰는 손잡이 */
export interface WorkbenchApi {
  getValue(): string;
  setValue(code: string): void;
  diagnose(): Promise<Diagnostic[]>;
}

/** 부모에게 알려 주는 "지금 화면에 보이는 결과" */
export interface BenchReport extends Observation {
  /** 처음 코드에서 바뀌었는지 */
  edited: boolean;
}

interface WorkbenchProps {
  /** 에디터 모델의 이름이자 작성 중인 코드를 기억하는 키 */
  id: string;
  code: string;
  runner: Runner;
  /** true면 부모 높이를 꽉 채우고, false면 내용에 맞춰 늘어납니다 */
  fill?: boolean;
  apiRef?: RefObject<WorkbenchApi | null>;
  onReport?: (report: BenchReport) => void;
  /** 사용자가 코드를 고칠 때마다 호출됩니다 */
  onEdit?: () => void;
}

interface LogEntry {
  level: LogLevel;
  text: string;
  /** 같은 내용이 연달아 찍힌 횟수 */
  count: number;
}

type LowerTab = 'console' | 'js';

const MAX_LOGS = 200;
const MAX_AUTO_HEIGHT = 520;
const RUN_DELAY = 450;

/** 단계를 오가도 고치던 코드가 사라지지 않도록 기억해 둡니다. (새로고침하면 초기화) */
const drafts = new Map<string, string>();

const fileName: Record<Runner, string> = { console: 'example.ts', react: 'App.tsx', native: 'App.tsx' };
const previewLabel: Record<Runner, string> = { console: '', react: '미리보기', native: '미리보기 · 휴대폰' };

export function Workbench({ id, code, runner, fill = false, apiRef, onReport, onEdit }: WorkbenchProps) {
  const engine = useEngine();
  const theme = useAppSelector(selectTheme);

  const editorHostRef = useRef<HTMLDivElement>(null);
  const frameHostRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // 최신 값을 이펙트 밖에서 읽기 위한 ref들
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;
  const rerunRef = useRef<() => void>(() => {});
  const innerApiRef = useRef<WorkbenchApi | null>(null);
  const revealRef = useRef<(line: number) => void>(() => {});

  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[] | null>(null);
  const [compiledJs, setCompiledJs] = useState('');
  const [running, setRunning] = useState(true);
  const [edited, setEdited] = useState(false);
  const [tab, setTab] = useState<LowerTab>('console');

  useEffect(() => {
    const editorHost = editorHostRef.current;
    const frameHost = frameHostRef.current;
    if (!engine || !editorHost || !frameHost) return;
    const { monaco, getDiagnostics, getCompiledJs, ensureNativeTypes } = engine.editor;

    let alive = true;
    let cleanup = () => {};

    const start = () => {
      const jsx = runner !== 'console';
      const uri = monaco.Uri.parse(`file:///${id}.${jsx ? 'tsx' : 'ts'}`);
      monaco.editor.getModel(uri)?.dispose();
      const model = monaco.editor.createModel(drafts.get(id) ?? code, 'typescript', uri);

      const editor = monaco.editor.create(editorHost, {
        model,
        theme: themeRef.current === 'dark' ? 'tsl-dark' : 'tsl-light',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontFamily: "'JetBrains Mono Variable', ui-monospace, Menlo, monospace",
        fontSize: 13.5,
        lineHeight: 21,
        lineNumbersMinChars: 3,
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        scrollbar: { alwaysConsumeMouseWheel: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        tabSize: 2,
        stickyScroll: { enabled: false },
        fixedOverflowWidgets: true,
        wordWrap: 'on',
        ariaLabel: '코드 에디터',
      });

      let sizeSub: { dispose(): void } | null = null;
      if (!fill) {
        const fit = () => {
          editorHost.style.height = `${Math.min(Math.max(editor.getContentHeight(), 120), MAX_AUTO_HEIGHT)}px`;
          editor.layout();
        };
        sizeSub = editor.onDidContentSizeChange(fit);
        fit();
      }

      // ── 실행 결과 수집 ──
      // 타입 검사와 실행은 각각 비동기로 끝납니다. 둘 다 "지금 코드"에 대한 결과일 때만 부모에게 알립니다.
      let version = 0;
      let checkedVersion = -1;
      let finishedVersion = -1;
      let typeErrors: number | null = null;
      let consoleText = '';
      let previewText = '';

      const report = () => {
        const settled = checkedVersion === version && finishedVersion === version;
        onReportRef.current?.({
          typeErrors: settled ? typeErrors : null,
          console: settled ? consoleText : '',
          preview: settled ? previewText : '',
          edited: model.getValue().trim() !== code.trim(),
        });
      };

      const onEvent = (event: SandboxEvent) => {
        if (!alive) return;
        switch (event.type) {
          case 'start':
            consoleText = '';
            previewText = '';
            setLogs([]);
            setRunning(true);
            break;
          case 'log':
            consoleText += `${event.text}\n`;
            setLogs((previous) => {
              const last = previous[previous.length - 1];
              if (last && last.level === event.level && last.text === event.text) {
                return [...previous.slice(0, -1), { ...last, count: last.count + 1 }];
              }
              return [...previous, { level: event.level, text: event.text, count: 1 }].slice(-MAX_LOGS);
            });
            report();
            break;
          case 'dom':
            previewText = event.text;
            report();
            break;
          case 'done':
            finishedVersion = version;
            setRunning(false);
            report();
            break;
        }
      };

      const host = new SandboxHost(frameHost, engine.runtime, onEvent);

      const check = async (forVersion: number) => {
        const [found, js] = await Promise.all([getDiagnostics(model), getCompiledJs(model)]);
        if (!alive || forVersion !== version) return;
        typeErrors = found.length;
        checkedVersion = forVersion;
        setDiagnostics(found);
        setCompiledJs(js);
        report();
      };

      const execute = () => {
        version += 1;
        const source = model.getValue();
        const compiled = compile(source, jsx);
        if (compiled.ok) host.run({ code: compiled.code, runner, theme: themeRef.current });
        else host.fail(compiled.message);
        void check(version);
      };

      let timer: ReturnType<typeof setTimeout> | undefined;
      const changeSub = model.onDidChangeContent(() => {
        const value = model.getValue();
        drafts.set(id, value);
        setEdited(value.trim() !== code.trim());
        onEditRef.current?.();
        clearTimeout(timer);
        timer = setTimeout(execute, RUN_DELAY);
      });

      rerunRef.current = execute;
      revealRef.current = (line) => {
        editor.revealLineInCenterIfOutsideViewport(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
      };
      const api: WorkbenchApi = {
        getValue: () => model.getValue(),
        setValue: (next) => model.setValue(next),
        diagnose: () => getDiagnostics(model),
      };
      innerApiRef.current = api;
      if (apiRef) apiRef.current = api;

      setEdited(model.getValue().trim() !== code.trim());
      setReady(true);
      execute();

      cleanup = () => {
        clearTimeout(timer);
        rerunRef.current = () => {};
        revealRef.current = () => {};
        innerApiRef.current = null;
        if (apiRef) apiRef.current = null;
        host.dispose();
        sizeSub?.dispose();
        changeSub.dispose();
        editor.dispose();
        model.dispose();
      };
    };

    // React Native 예제는 RN 타입 선언을 먼저 불러온 뒤에 에디터를 엽니다.
    if (runner === 'native') {
      void ensureNativeTypes().then(() => {
        if (alive) start();
      });
    } else {
      start();
    }

    return () => {
      alive = false;
      cleanup();
    };
    // code는 초기값으로만 쓰고, 이후 변경은 에디터가 직접 관리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, id, runner, fill]);

  // 테마가 바뀌면 에디터 색을 바꾸고, 미리보기도 새 테마로 다시 그립니다.
  useEffect(() => {
    if (!engine || !ready) return;
    engine.editor.monaco.editor.setTheme(theme === 'dark' ? 'tsl-dark' : 'tsl-light');
    rerunRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // 새 로그가 찍히면 콘솔을 맨 아래로 내립니다.
  useEffect(() => {
    const element = consoleRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [logs]);

  const reset = useCallback(() => {
    innerApiRef.current?.setValue(code);
    drafts.delete(id);
  }, [code, id]);

  const errorCount = diagnostics?.length ?? 0;
  const logCount = logs.reduce((sum, entry) => sum + entry.count, 0);
  const hasPreview = runner !== 'console';

  return (
    <div className={`wb${fill ? ' wb--fill' : ''}${hasPreview ? ' wb--preview' : ''}`}>
      <section className="wb__editor" aria-label="코드 에디터">
        <header className="wb__bar">
          <span className="wb__file">{fileName[runner]}</span>
          <span className="wb__bar-right">
            {edited && (
              <button className="wb__mini" onClick={reset} title="처음 코드로 되돌립니다">
                처음으로
              </button>
            )}
          </span>
        </header>
        <div className="wb__monaco" ref={editorHostRef}>
          {!ready && (
            <pre className="wb__fallback">
              <code dangerouslySetInnerHTML={{ __html: highlight(code, hasPreview ? 'tsx' : 'ts') }} />
            </pre>
          )}
        </div>
      </section>

      <section className="wb__output" aria-label="실행 결과">
        {/* 콘솔 전용 예제에서도 코드를 실행할 iframe은 필요하므로, 영역만 숨깁니다. */}
        <div className={`wb__pane wb__pane--preview${hasPreview ? '' : ' is-offscreen'}`}>
          {hasPreview && (
            <header className="wb__bar">
              <span className="wb__label">{previewLabel[runner]}</span>
              <span className="wb__bar-right">
                <span className={`wb__live${running ? ' is-running' : ''}`}>{running ? '실행 중' : '반영됨'}</span>
                <button className="wb__mini" onClick={() => rerunRef.current()} title="코드를 다시 실행합니다 (상태 초기화)">
                  다시 실행
                </button>
              </span>
            </header>
          )}
          <div className={`wb__stage${runner === 'native' ? ' wb__stage--phone' : ''}`}>
            <div className={runner === 'native' ? 'phone' : 'wb__frames'}>
              {runner === 'native' && <span className="phone__notch" aria-hidden="true" />}
              <div className="wb__frame-host" ref={frameHostRef} />
            </div>
          </div>
        </div>

        <div className="wb__pane wb__pane--console">
          <header className="wb__bar wb__bar--tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'console'} className="wb__tab" onClick={() => setTab('console')}>
              콘솔
              {logCount > 0 && <span className="wb__count">{logCount}</span>}
            </button>
            <button role="tab" aria-selected={tab === 'js'} className="wb__tab" onClick={() => setTab('js')}>
              변환된 JS
            </button>
            {!hasPreview && (
              <span className="wb__bar-right">
                <span className={`wb__live${running ? ' is-running' : ''}`}>{running ? '실행 중' : '반영됨'}</span>
                <button className="wb__mini" onClick={() => rerunRef.current()} title="코드를 다시 실행합니다">
                  다시 실행
                </button>
              </span>
            )}
          </header>
          {tab === 'console' ? (
            <div className="wb__console" ref={consoleRef} role="log" aria-label="콘솔 출력">
              {logs.length === 0 ? (
                <p className="wb__empty">
                  {running ? '실행 중…' : <>출력이 없습니다. <code>console.log(값)</code>으로 값을 찍어 보세요.</>}
                </p>
              ) : (
                logs.map((entry, index) => (
                  <div key={index} className={`log log--${entry.level}`}>
                    <span className="log__mark" aria-hidden="true">
                      {entry.level === 'error' ? '✕' : entry.level === 'warn' ? '!' : '›'}
                    </span>
                    <pre className="log__text">{entry.text}</pre>
                    {entry.count > 1 && <span className="log__count">{entry.count}</span>}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="wb__console">
              <p className="wb__empty">타입 표기는 빌드할 때 전부 지워집니다. 실제로 실행되는 건 이 코드입니다.</p>
              <pre className="wb__js">
                <code dangerouslySetInnerHTML={{ __html: highlight(compiledJs || '// (비어 있음)', 'js') }} />
              </pre>
            </div>
          )}
        </div>

        <div className={`wb__types${errorCount > 0 ? ' has-errors' : ''}`}>
          <header className="wb__bar">
            <span className="wb__label">타입 검사</span>
            {diagnostics === null ? (
              <span className="pill">검사 중</span>
            ) : errorCount > 0 ? (
              <span className="pill pill--bad">오류 {errorCount}</span>
            ) : (
              <span className="pill pill--good">통과</span>
            )}
          </header>
          {errorCount > 0 && diagnostics && (
            <ul className="wb__errors">
              {diagnostics.map((diagnostic, index) => (
                <li key={index}>
                  <button onClick={() => revealRef.current(diagnostic.line)} title="에디터에서 이 줄로 이동">
                    <span className="wb__line">{diagnostic.line}행</span>
                    <span>{diagnostic.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
