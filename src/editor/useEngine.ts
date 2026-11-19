import { useEffect, useState } from 'react';
import { loadRuntime } from '../sandbox/loadRuntime';

type MonacoModule = typeof import('./monaco');

/** 실습 화면에 필요한 무거운 것들: 에디터 엔진 + 코드 실행 런타임 */
export interface Engine {
  editor: MonacoModule;
  runtime: string;
}

let pending: Promise<Engine> | null = null;

function load(): Promise<Engine> {
  pending ??= Promise.all([import('./monaco'), loadRuntime()]).then(([editor, runtime]) => ({ editor, runtime }));
  return pending;
}

/** 용량이 커서, 처음 필요해지는 순간 한 번만 불러옵니다. */
export function useEngine(): Engine | null {
  const [engine, setEngine] = useState<Engine | null>(null);

  useEffect(() => {
    let alive = true;
    void load().then((loaded) => {
      if (alive) setEngine(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  return engine;
}
