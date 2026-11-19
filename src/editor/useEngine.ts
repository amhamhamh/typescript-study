import { useCallback, useEffect, useState } from 'react';
import { loadRuntime } from '../sandbox/loadRuntime';

type MonacoModule = typeof import('./monaco');

/** 실습 화면에 필요한 무거운 것들: 에디터 엔진 + 코드 실행 런타임 */
export interface Engine {
  editor: MonacoModule;
  runtime: string;
}

export interface EngineState {
  engine: Engine | null;
  /** 불러오기에 실패했는지 (네트워크가 끊긴 경우 등) */
  failed: boolean;
  /** '다시 시도'를 눌렀지만 기기가 아직 오프라인이라 아무것도 하지 못했는지 */
  offline: boolean;
  retry(): void;
}

let pending: Promise<Engine> | null = null;

function load(): Promise<Engine> {
  pending ??= Promise.all([import('./monaco'), loadRuntime()])
    .then(([editor, runtime]) => ({ editor, runtime }))
    .catch((error: unknown) => {
      // 실패한 Promise를 계속 들고 있으면 다음 화면에서도 다시 요청해 보지 못합니다.
      pending = null;
      throw error;
    });
  return pending;
}

/** 용량이 커서, 처음 필요해지는 순간 한 번만 불러옵니다. */
export function useEngine(): EngineState {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    load().then(
      (loaded) => {
        if (alive) setEngine(loaded);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const retry = useCallback(() => {
    // 한 번 실패한 import()는 브라우저가 문서 단위로 기억해서, 같은 페이지에서는 요청 없이 곧바로 다시 실패합니다.
    // 그래서 페이지를 새로 불러옵니다. (에디터가 열린 적이 없으니 잃을 코드가 없고, 주소와 진도는 그대로 남습니다)
    // 오프라인일 때 새로 고치면 읽고 있던 설명까지 브라우저 오류 화면으로 바뀌므로, 그때는 안내만 합니다.
    if (navigator.onLine === false) {
      setOffline(true);
      return;
    }
    window.location.reload();
  }, []);

  // 연결이 돌아오면 "아직 오프라인" 안내를 거둡니다.
  useEffect(() => {
    if (!offline) return;
    const onOnline = () => setOffline(false);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [offline]);

  return { engine, failed, offline, retry };
}
