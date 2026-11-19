import type { Chapter, ChapterId, Lesson } from './types';
import { lesson as inference } from './lessons/inference';
import { lesson as objects } from './lessons/objects';
import { lesson as unions } from './lessons/unions';
import { lesson as generics } from './lessons/generics';
import { lesson as utility } from './lessons/utility';
import { lesson as reactProps } from './lessons/react-props';
import { lesson as reactHooks } from './lessons/react-hooks';
import { lesson as reactEvents } from './lessons/react-events';
import { lesson as reduxActions } from './lessons/redux-actions';
import { lesson as reduxToolkit } from './lessons/redux-toolkit';
import { lesson as asyncApi } from './lessons/async';
import { lesson as reactNative } from './lessons/react-native';
import { lesson as migration } from './lessons/migration';

export const chapters: Chapter[] = [
  {
    id: 'basics',
    title: 'JS에서 TS로',
    fromExperience: 'JavaScript를 쓸 줄 안다',
    description: '타입 표기, 객체 모양, 유니온과 좁히기, 제네릭. 뒤의 모든 챕터가 이 다섯 레슨 위에 올라갑니다.',
  },
  {
    id: 'react',
    title: 'React 타이핑',
    fromExperience: 'React로 웹/앱을 만들어 봤다',
    description: 'PropTypes를 대체하는 props 타입, 훅, 이벤트 핸들러.',
  },
  {
    id: 'redux',
    title: 'Redux와 비동기',
    fromExperience: 'Redux로 상태를 관리해 봤다',
    description: '액션·리듀서의 판별 유니온, Redux Toolkit 설정, API 응답과 요청 상태.',
  },
  {
    id: 'native',
    title: 'React Native와 실전 전환',
    fromExperience: 'RN 앱을 CodePush·스토어로 배포해 봤다',
    description: '스타일과 내비게이션 params, 그리고 기존 JS 프로젝트를 배포 흐름을 유지한 채 옮기는 방법.',
  },
];

export const lessons: Lesson[] = [
  inference,
  objects,
  unions,
  generics,
  utility,
  reactProps,
  reactHooks,
  reactEvents,
  reduxActions,
  reduxToolkit,
  asyncApi,
  reactNative,
  migration,
];

export function lessonsOf(chapter: ChapterId): Lesson[] {
  return lessons.filter((lesson) => lesson.chapter === chapter);
}

export function findLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

/** 이전/다음 레슨. 처음과 끝에서는 undefined입니다. */
export function neighbors(id: string): { prev?: Lesson; next?: Lesson } {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return { prev: lessons[index - 1], next: lessons[index + 1] };
}
