import { useSyncExternalStore } from 'react';

// 화면 종류를 판별 유니온으로 표현합니다. (레슨 3)
export type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'cheatsheet' };

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path.startsWith('lesson/')) return { name: 'lesson', lessonId: path.slice('lesson/'.length) };
  if (path === 'cheatsheet') return { name: 'cheatsheet' };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'lesson':
      return `#/lesson/${route.lessonId}`;
    case 'cheatsheet':
      return '#/cheatsheet';
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** GitHub Pages는 서버 라우팅이 없어서 해시(#) 기반으로 화면을 전환합니다. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}
