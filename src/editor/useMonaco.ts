import { useEffect, useState } from 'react';

type MonacoModule = typeof import('./monaco');

let pending: Promise<MonacoModule> | null = null;

/** 에디터 엔진은 용량이 커서, 처음 필요해지는 순간 한 번만 불러옵니다. */
export function useMonaco(): MonacoModule | null {
  const [mod, setMod] = useState<MonacoModule | null>(null);

  useEffect(() => {
    let alive = true;
    pending ??= import('./monaco');
    pending.then((loaded) => {
      if (alive) setMod(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  return mod;
}
