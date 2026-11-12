import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useMonaco } from '../editor/useMonaco';
import type { Diagnostic } from '../editor/monaco';
import { highlight } from '../lib/highlight';

/** 부모(실습 카드)가 에디터를 조작할 때 쓰는 손잡이 */
export interface PlaygroundApi {
  getValue(): string;
  setValue(code: string): void;
  diagnose(): Promise<Diagnostic[]>;
}

interface PlaygroundProps {
  id: string;
  code: string;
  jsx?: boolean;
  apiRef?: RefObject<PlaygroundApi | null>;
  onEdit?: () => void;
}

type Panel = 'errors' | 'js';

const MAX_HEIGHT = 620;

export function Playground({ id, code, jsx = false, apiRef, onEdit }: PlaygroundProps) {
  const mod = useMonaco();
  const hostRef = useRef<HTMLDivElement>(null);
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  const [diagnostics, setDiagnostics] = useState<Diagnostic[] | null>(null);
  const [panel, setPanel] = useState<Panel>('errors');
  const [compiled, setCompiled] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    if (!mod || !host) return;
    const { monaco, getDiagnostics, getCompiledJs } = mod;

    const uri = monaco.Uri.parse(`file:///${id}.${jsx ? 'tsx' : 'ts'}`);
    monaco.editor.getModel(uri)?.dispose();
    const model = monaco.editor.createModel(code, 'typescript', uri);

    const editor = monaco.editor.create(host, {
      model,
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
      ariaLabel: '코드 에디터',
    });

    const fit = () => {
      host.style.height = `${Math.min(editor.getContentHeight(), MAX_HEIGHT)}px`;
      editor.layout();
    };
    const sizeSub = editor.onDidContentSizeChange(fit);
    fit();

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      const [found, js] = await Promise.all([getDiagnostics(model), getCompiledJs(model)]);
      if (!alive) return;
      setDiagnostics(found);
      setCompiled(js);
    };
    const changeSub = model.onDidChangeContent(() => {
      onEditRef.current?.();
      clearTimeout(timer);
      timer = setTimeout(refresh, 350);
    });
    refresh();

    if (apiRef) {
      apiRef.current = {
        getValue: () => model.getValue(),
        setValue: (next) => model.setValue(next),
        diagnose: () => getDiagnostics(model),
      };
    }

    return () => {
      alive = false;
      clearTimeout(timer);
      if (apiRef) apiRef.current = null;
      sizeSub.dispose();
      changeSub.dispose();
      editor.dispose();
      model.dispose();
    };
    // code는 초기값으로만 씁니다. 이후 변경은 에디터가 직접 관리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, id, jsx]);

  const errorCount = diagnostics?.length ?? 0;

  return (
    <div className="pg">
      <div className="pg__bar">
        <span className="pg__file">{jsx ? 'example.tsx' : 'example.ts'}</span>
        <span className="pg__hint">직접 고쳐 볼 수 있습니다</span>
      </div>

      <div className="pg__editor" ref={hostRef}>
        {!mod && (
          <pre className="pg__fallback">
            <code dangerouslySetInnerHTML={{ __html: highlight(code, jsx ? 'tsx' : 'ts') }} />
          </pre>
        )}
      </div>

      <div className="pg__tabs" role="tablist">
        <button role="tab" aria-selected={panel === 'errors'} className="pg__tab" onClick={() => setPanel('errors')}>
          타입 검사
          {diagnostics && (
            <span className={`pill ${errorCount ? 'pill--bad' : 'pill--good'}`}>{errorCount ? `오류 ${errorCount}` : '통과'}</span>
          )}
        </button>
        <button role="tab" aria-selected={panel === 'js'} className="pg__tab" onClick={() => setPanel('js')}>
          변환된 JS
        </button>
      </div>

      <div className="pg__panel" role="tabpanel">
        {panel === 'errors' &&
          (diagnostics === null ? (
            <p className="pg__muted">에디터를 불러오는 중…</p>
          ) : errorCount === 0 ? (
            <p className="pg__ok">타입 오류가 없습니다.</p>
          ) : (
            <ul className="pg__errors">
              {diagnostics.map((d, index) => (
                <li key={index}>
                  <span className="pg__line">{d.line}행</span>
                  <span>{d.message}</span>
                </li>
              ))}
            </ul>
          ))}
        {panel === 'js' && (
          <>
            <p className="pg__muted">타입 표기는 빌드할 때 전부 지워집니다. 실제로 실행되는 건 이 코드입니다.</p>
            <pre className="pg__js">
              <code dangerouslySetInnerHTML={{ __html: highlight(compiled || '// (비어 있음)', 'js') }} />
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
