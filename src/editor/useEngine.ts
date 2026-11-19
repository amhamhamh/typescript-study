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
  retry(): void;
}

let pending: Promise<Engine> | null = null;

function load(): Promise<Engine> {
  pending ??= Promise.all([import('./monaco'), loadRuntime()])
    .then(([editor, runtime]) => ({ editor, runtime }))
    .catch((error: unknown) => {
      // 실패한 Promise를 계속 들고 있으면 다시 시도할 수 없습니다.
      pending = null;
      throw error;
    });
  return pending;
}

/** 용량이 커서, 처음 필요해지는 순간 한 번만 불러옵니다. */
export function useEngine(): EngineState {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return { engine, failed, retry };
}
