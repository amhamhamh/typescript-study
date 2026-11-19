import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
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
  /** 코드를 통째로 바꿉니다. 에디터의 실행 취소(Ctrl/Cmd+Z)로 되돌릴 수 있습니다. */
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

/** 세로로 스크롤되는 가장 가까운 조상을 찾습니다. 없으면 페이지 전체가 스크롤됩니다. */
function scrollParent(element: HTMLElement): HTMLElement | Window {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return window;
}

/** 단계를 오가도 고치던 코드가 사라지지 않도록 기억해 둡니다. (새로고침하면 초기화) */
const drafts = new Map<string, string>();

const fileName: Record<Runner, string> = { console: 'example.ts', react: 'App.tsx', native: 'App.tsx' };
const previewLabel: Record<Runner, string> = { console: '', react: '미리보기', native: '미리보기 · 휴대폰' };

export function Workbench({ id, code, runner, fill = false, apiRef, onReport, onEdit }: WorkbenchProps) {
  const { engine, failed, offline, retry } = useEngine();
  const tabsId = useId();
  const theme = useAppSelector(selectTheme);

  const editorHostRef = useRef<HTMLDivElement>(null);
  const frameHostRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLElement>(null);

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
  const focusEditorRef = useRef<() => void>(() => {});

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
        // Monaco의 우클릭 메뉴는 에디터 바깥에 붙어서 테마 색을 받지 못합니다(배경 없이 글자만 코드 위에 겹칩니다).
        // 끄면 브라우저의 기본 메뉴(복사/붙여넣기)가 대신 뜹니다. (Shift+F10은 editor/monaco.ts에서 따로 풀어 줍니다)
        contextmenu: false,
        wordWrap: 'on',
        ariaLabel: '코드 에디터. Esc 키를 누르면 에디터에서 나갑니다.',
      });

      // 에디터 안에서는 Tab이 들여쓰기라서 키보드만으로는 빠져나올 수 없습니다. Esc로 결과 영역으로 나가게 합니다.
      // (자동완성 목록, 찾기, 이름 바꾸기, 참조 보기, 문제 보기, 명령 팔레트 등이 떠 있을 때의 Esc는 원래대로 그 창을 닫습니다)
      // addCommand로 등록한 단축키는 에디터를 닫아도 지워지지 않고 쌓이므로, 정리할 수 있는 addAction을 씁니다.
      const leaveAction = editor.addAction({
        id: 'tsl.leaveEditor',
        label: '에디터에서 나가기',
        keybindings: [monaco.KeyCode.Escape],
        keybindingContext:
          'editorTextFocus && !suggestWidgetVisible && !parameterHintsVisible && !findWidgetVisible && !renameInputVisible && !inSnippetMode && !editorHasMultipleSelections && !referenceSearchVisible && !inReferenceSearchEditor && !markersNavigationVisible && !inQuickInput',
        run: () => {
          outputRef.current?.focus();
        },
      });

      // 터치 화면에서 에디터 위를 쓸어내리면 Monaco가 제스처를 가져가서 페이지가 움직이지 않습니다.
      // 에디터가 더 스크롤할 수 없는 방향이면 그만큼 바깥(페이지)을 대신 스크롤합니다.
      let touchY: number | null = null;
      let redirected = 0; // 이번 제스처에서 페이지로 넘긴 거리(px)
      const onTouchStart = (event: TouchEvent) => {
        touchY = event.touches.length === 1 ? (event.touches[0]?.clientY ?? null) : null;
        // 넘긴 거리는 새 제스처가 시작될 때만 지웁니다. 에디터를 쓸어 넘기던 손가락이 아직 닿아 있는데
        // 두 번째 손가락이 닿은 것이라면 같은 제스처가 이어지는 것입니다. (지우면 첫 손가락을 뗄 때 탭으로 처리됩니다)
        const onEditor = Array.from(event.touches).filter(
          (touch) => touch.target instanceof Node && editorHost.contains(touch.target),
        ).length;
        if (onEditor <= event.changedTouches.length) redirected = 0;
      };
      const onTouchMove = (event: TouchEvent) => {
        const y = event.touches[0]?.clientY;
        if (touchY === null || y === undefined || event.touches.length !== 1) return;
        const delta = touchY - y;
        touchY = y;
        const top = editor.getScrollTop();
        const max = editor.getScrollHeight() - editor.getLayoutInfo().height;
        const editorCanScroll = delta > 0 ? top < max - 1 : top > 0;
        if (!editorCanScroll) {
          // 실제로 바깥이 움직인 만큼만 셉니다. 바깥도 더 움직일 수 없을 때는 넘긴 것이 없으므로
          // (Monaco가 손가락의 움직임을 그대로 봅니다) 탭을 막을 이유가 없습니다.
          const parent = scrollParent(editorHost);
          const offset = () => (parent instanceof Window ? parent.scrollY : parent.scrollTop);
          const before = offset();
          parent.scrollBy(0, delta);
          redirected += Math.abs(offset() - before);
        }
      };
      // 페이지를 대신 스크롤하면 Monaco에는 손가락이 멈춘 것처럼 보여서(pageY가 그대로) 탭이나 길게 누르기로 처리합니다.
      // 그 결과로 나오는 포커스(화면 키보드)와 컨텍스트 메뉴만 막습니다. 손가락이 조금 떨린 정도의 탭은 그대로 둡니다.
      const onMonacoGesture = (event: Event) => {
        if (redirected > 10) event.stopPropagation();
      };
      editorHost.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
      editorHost.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
      editorHost.addEventListener('-monaco-gesturetap', onMonacoGesture, true);
      editorHost.addEventListener('-monaco-gesturecontextmenu', onMonacoGesture, true);

      let sizeSub: { dispose(): void } | null = null;
      if (!fill) {
        const fit = () => {
          // 작은 화면에서 에디터가 화면을 다 차지하지 않도록 높이를 화면의 절반으로 제한합니다.
          const limit = Math.min(MAX_AUTO_HEIGHT, Math.max(200, window.innerHeight * 0.5));
          editorHost.style.height = `${Math.min(Math.max(editor.getContentHeight(), 120), limit)}px`;
          editor.layout();
        };
        sizeSub = editor.onDidContentSizeChange(fit);
        fit();
      }

      // ── 실행 결과 수집 ──
      // 타입 검사와 실행은 각각 비동기로 끝납니다. 둘 다 "지금 코드"에 대한 결과일 때만 부모에게 알립니다.
      let version = 0;
      // 마지막 실행 이후 코드가 바뀌었으면, 화면에 남아 있는 결과는 더 이상 "지금 코드"의 것이 아닙니다.
      let dirty = false;
      let checkedVersion = -1;
      let finishedVersion = -1;
      let typeErrors: number | null = null;
      let consoleText = '';
      let previewText = '';

      const report = () => {
        const settled = !dirty && checkedVersion === version && finishedVersion === version;
        onReportRef.current?.({
          typeErrors: settled ? typeErrors : null,
          console: settled ? consoleText : '',
          preview: settled ? previewText : '',
          code: model.getValue(),
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
        let found: Diagnostic[];
        let js: string;
        try {
          [found, js] = await Promise.all([getDiagnostics(model), getCompiledJs(model)]);
        } catch (error) {
          // 검사 도중 화면을 떠나면 모델이 이미 지워져 있습니다. 그 경우는 조용히 끝냅니다.
          if (alive && forVersion === version) console.error('타입 검사에 실패했습니다', error);
          return;
        }
        if (!alive || forVersion !== version) return;
        typeErrors = found.length;
        checkedVersion = forVersion;
        setDiagnostics(found);
        setCompiledJs(js);
        report();
      };

      const execute = () => {
        version += 1;
        dirty = false;
        const source = model.getValue();
        const compiled = compile(source, jsx);
        // 휴대폰 미리보기는 실제 기기처럼 항상 밝은 화면으로 둡니다. (RN의 기본 글자색이 검정이라서)
        const previewTheme = runner === 'native' ? 'light' : themeRef.current;
        if (compiled.ok) host.run({ code: compiled.code, runner, theme: previewTheme });
        else host.fail(compiled.message);
        void check(version);
      };

      let timer: ReturnType<typeof setTimeout> | undefined;
      const changeSub = model.onDidChangeContent(() => {
        dirty = true;
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
      focusEditorRef.current = () => editor.focus();
      const api: WorkbenchApi = {
        getValue: () => model.getValue(),
        setValue: (next) => {
          // model.setValue는 실행 취소 기록을 지웁니다. 편집으로 넣어야 Ctrl/Cmd+Z로 내 코드를 되찾을 수 있습니다.
          editor.pushUndoStop();
          editor.executeEdits('replace-all', [{ range: model.getFullModelRange(), text: next }]);
          editor.pushUndoStop();
          editor.setScrollTop(0);
        },
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
        focusEditorRef.current = () => {};
        innerApiRef.current = null;
        if (apiRef) apiRef.current = null;
        host.dispose();
        editorHost.removeEventListener('touchstart', onTouchStart, { capture: true });
        editorHost.removeEventListener('touchmove', onTouchMove, { capture: true });
        editorHost.removeEventListener('-monaco-gesturetap', onMonacoGesture, true);
        editorHost.removeEventListener('-monaco-gesturecontextmenu', onMonacoGesture, true);
        sizeSub?.dispose();
        changeSub.dispose();
        leaveAction.dispose();
        editor.dispose();
        model.dispose();
      };
    };

    // React Native 예제는 RN 타입 선언을 먼저 불러온 뒤에 에디터를 엽니다.
    if (runner === 'native') {
      // 타입 선언을 못 받아와도 에디터와 미리보기는 쓸 수 있게 엽니다. (타입 검사만 부정확해집니다)
      void ensureNativeTypes()
        .catch(() => {})
        .then(() => {
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
    // 테마에 따라 화면이 달라지는 건 웹 미리보기뿐입니다. 나머지는 다시 실행하면 상태만 초기화됩니다.
    if (runner === 'react') rerunRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // 새 로그가 찍히면 콘솔을 맨 아래로 내립니다.
  useEffect(() => {
    const element = consoleRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [logs]);

  const reset = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      innerApiRef.current?.setValue(code);
      drafts.delete(id);
      // 키보드(Enter/Space)로 눌렀을 때는 버튼이 사라지면서 포커스가 body로 떨어지므로 에디터로 옮깁니다.
      // (마우스·터치로 눌렀을 때는 옮기지 않습니다. 터치 화면에서 화면 키보드가 뜨지 않게 하기 위해서입니다)
      if (event.detail === 0) focusEditorRef.current();
    },
    [code, id],
  );

  // 탭: 왼쪽/오른쪽 화살표로 오갑니다. (WAI-ARIA 탭 패턴)
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: LowerTab = tab === 'console' ? 'js' : 'console';
    setTab(next);
    document.getElementById(`${tabsId}-tab-${next}`)?.focus();
  };

  // 에디터를 불러오지 못하면 코드는 실행되지도 검사되지도 않습니다. '실행 중', '검사 중'으로 남겨 두지 않습니다.
  const broken = failed && !ready;

  const liveStatus = (
    <span className={`wb__live${broken ? ' is-off' : running ? ' is-running' : ''}`} role="status">
      {broken ? '실행 안 됨' : running ? '실행 중' : '반영됨'}
    </span>
  );

  const errorCount = diagnostics?.length ?? 0;
  const logCount = logs.reduce((sum, entry) => sum + entry.count, 0);
  const hasPreview = runner !== 'console';

  return (
    <div className={`wb${fill ? ' wb--fill' : ''}${hasPreview ? ' wb--preview' : ''}${runner === 'native' ? ' wb--native' : ''}`}>
      <section className="wb__editor" aria-label="코드 에디터">
        <header className="wb__bar">
          <span className="wb__file">{fileName[runner]}</span>
          <span className="wb__bar-right">
            <span className="wb__hint">Esc로 에디터 나가기</span>
            {edited && (
              <button className="wb__mini" onClick={reset} title="처음 코드로 되돌립니다">
                처음으로
              </button>
            )}
          </span>
        </header>
        <div className="wb__monaco" ref={editorHostRef}>
          {/* 안내는 코드보다 위에 둡니다. 코드가 길면 에디터 높이를 넘는 부분이 잘려서, 아래에 두면 '다시 시도'가 보이지 않습니다. */}
          {broken && (
            <div className="wb__failed" role="alert">
              <p>에디터를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.</p>
              {offline && <p>아직 오프라인입니다. 인터넷에 연결한 뒤 다시 눌러 주세요.</p>}
              <button className="btn btn--small" onClick={retry}>
                다시 시도
              </button>
            </div>
          )}
          {!ready && (
            <pre className="wb__fallback">
              <code dangerouslySetInnerHTML={{ __html: highlight(code, hasPreview ? 'tsx' : 'ts') }} />
            </pre>
          )}
        </div>
      </section>

      <section className="wb__output" aria-label="실행 결과" ref={outputRef} tabIndex={-1}>
        {/* 콘솔 전용 예제에서도 코드를 실행할 iframe은 필요하므로, 영역만 숨깁니다. */}
        <div className={`wb__pane wb__pane--preview${hasPreview ? '' : ' is-offscreen'}`}>
          {hasPreview && (
            <header className="wb__bar">
              <span className="wb__label">{previewLabel[runner]}</span>
              <span className="wb__bar-right">
                {liveStatus}
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

        <div className="wb__lower">
        <div className="wb__pane wb__pane--console">
          <header className="wb__bar wb__bar--tabs">
            <div className="wb__tabs" role="tablist" aria-label="출력 보기" onKeyDown={onTabKey}>
              <button
                role="tab"
                id={`${tabsId}-tab-console`}
                aria-controls={`${tabsId}-panel`}
                aria-selected={tab === 'console'}
                tabIndex={tab === 'console' ? 0 : -1}
                className="wb__tab"
                onClick={() => setTab('console')}
              >
                콘솔
                {logCount > 0 && <span className="wb__count">{logCount}</span>}
              </button>
              <button
                role="tab"
                id={`${tabsId}-tab-js`}
                aria-controls={`${tabsId}-panel`}
                aria-selected={tab === 'js'}
                tabIndex={tab === 'js' ? 0 : -1}
                className="wb__tab"
                onClick={() => setTab('js')}
              >
                변환된 JS
              </button>
            </div>
            {!hasPreview && (
              <span className="wb__bar-right">
                {liveStatus}
                <button className="wb__mini" onClick={() => rerunRef.current()} title="코드를 다시 실행합니다">
                  다시 실행
                </button>
              </span>
            )}
          </header>
          <div className="wb__panel" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-tab-${tab}`}>
            {tab === 'console' ? (
              <div className="wb__console" ref={consoleRef} role="log" aria-label="콘솔 출력" tabIndex={0}>
                {logs.length === 0 ? (
                  <p className="wb__empty">
                    {broken ? (
                      '에디터를 불러오지 못해 코드를 실행할 수 없습니다.'
                    ) : running ? (
                      '실행 중…'
                    ) : (
                      <>출력이 없습니다. <code>console.log(값)</code>으로 값을 찍어 보세요.</>
                    )}
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
              <div className="wb__console" tabIndex={0}>
                <p className="wb__empty">타입 표기는 빌드할 때 전부 지워집니다. 타입을 지우고 나면 이런 JavaScript가 남습니다.</p>
                <pre className="wb__js">
                  <code dangerouslySetInnerHTML={{ __html: highlight(compiledJs || '// (비어 있음)', 'js') }} />
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className={`wb__types${errorCount > 0 ? ' has-errors' : ''}`}>
          <header className="wb__bar">
            <span className="wb__label">타입 검사</span>
            <span role="status">
              {diagnostics === null ? (
                <span className="pill">{broken ? '검사 안 됨' : '검사 중'}</span>
              ) : errorCount > 0 ? (
                <span className="pill pill--bad">오류 {errorCount}</span>
              ) : (
                <span className="pill pill--good">통과</span>
              )}
            </span>
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
        </div>
      </section>
    </div>
  );
}
