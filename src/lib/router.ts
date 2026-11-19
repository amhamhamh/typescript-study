import { useSyncExternalStore } from 'react';

/** 레슨 안에서의 위치: 단계 번호(1부터), 실습, 퀴즈 */
export type LessonPart = number | 'exercise' | 'quiz';

// 화면 종류를 판별 유니온으로 표현합니다. (레슨 3)
export type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string; part: LessonPart }
  | { name: 'cheatsheet' };

function parsePart(raw: string | undefined): LessonPart {
  if (raw === 'exercise' || raw === 'quiz') return raw;
  const step = Number(raw);
  return Number.isInteger(step) && step >= 1 ? step : 1;
}

function parse(hash: string): Route {
  const [first, lessonId, part] = hash.replace(/^#\/?/, '').split('/');
  if (first === 'lesson' && lessonId) return { name: 'lesson', lessonId, part: parsePart(part) };
  if (first === 'cheatsheet') return { name: 'cheatsheet' };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'lesson':
      return `#/lesson/${route.lessonId}/${route.part}`;
    case 'cheatsheet':
      return '#/cheatsheet';
  }
}

/** 레슨의 첫 단계로 가는 주소 */
export function lessonHref(lessonId: string, part: LessonPart = 1): string {
  return href({ name: 'lesson', lessonId, part });
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
