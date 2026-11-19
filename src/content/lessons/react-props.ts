import type { Lesson } from '../types';

// 자리 표시용 임시 레슨입니다.
export const lesson: Lesson = {
  id: 'react-props',
  chapter: 'react',
  title: 'react-props',
  summary: '준비 중',
  minutes: 10,
  steps: [
    { id: 'react-props-1', title: '준비 중', body: [], runner: 'console', code: "console.log('준비 중');" },
  ],
  exercise: {
    id: 'ex-react-props',
    title: '준비 중',
    prompt: '준비 중',
    runner: 'console',
    starter: 'const value = 1;',
    tests: "// @ts-expect-error 준비 중\nconst text: string = value;\nconsole.log(text);",
    solution: "const value = 'a';",
    hints: [],
  },
  quiz: [],
};
