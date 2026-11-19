// 학습 콘텐츠의 "모양"을 정의하는 파일입니다.
// 이 사이트 자체가 TypeScript로 만들어져 있으니, 레슨에서 배운 내용이
// 실제 코드에서 어떻게 쓰이는지 여기서 확인해 보세요. (판별 유니온, 선택 속성 등)
import type { Runner } from '../sandbox/protocol';

export type { Runner };

export type ChapterId = 'basics' | 'react' | 'redux' | 'native';

export interface Chapter {
  id: ChapterId;
  title: string;
  /** "이미 알고 있는 것"과 연결해 주는 한 줄 */
  fromExperience: string;
  description: string;
}

export type CodeLang = 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'bash';

/** 설명 영역을 이루는 블록. `kind`로 구분되는 판별 유니온입니다. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; code: string; lang?: CodeLang; title?: string }
  | { kind: 'compare'; js: string; ts: string; jsLabel?: string; tsLabel?: string; caption?: string }
  | { kind: 'callout'; tone: 'tip' | 'warn' | 'bridge'; title: string; text: string };

/** 미션의 달성 조건. 적힌 조건을 모두 만족해야 합니다. */
export interface Goal {
  /** 타입 오류가 하나도 없어야 함 */
  noTypeErrors?: boolean;
  /** 콘솔 출력에 이 문자열들이 모두 들어 있어야 함 */
  consoleIncludes?: string[];
  /** 미리보기 화면의 글자에 이 문자열들이 모두 들어 있어야 함 */
  previewIncludes?: string[];
  /**
   * 코드에 이 표현들이 모두 들어 있어야 함. 화면이나 콘솔로는 구분되지 않는 "어떻게 고쳤는가"를 확인합니다.
   * 주석은 빼고, 띄어쓰기 차이는 무시하고 비교합니다. 예: 'Record<Status, string>', 'as const'
   */
  codeIncludes?: string[];
  /** 코드에 이 표현들이 남아 있으면 안 됨. 예: 'as User', ': any' */
  codeExcludes?: string[];
}

export interface Mission {
  text: string;
  goal: Goal;
  hint?: string;
  /** 미션을 달성하는 코드 전체. "정답 적용"에 쓰이고, 검증 스크립트가 실제로 실행해 봅니다. */
  answer: string;
}

/** 레슨의 한 단계: 짧은 설명 + 오른쪽 에디터에 올라가는 코드 */
export interface Step {
  id: string;
  title: string;
  body: Block[];
  /** console: 콘솔 출력만 / react: 웹 미리보기 / native: 휴대폰 화면 미리보기 */
  runner: Runner;
  code: string;
  /** 일부러 넣어 둔 타입 오류가 있는 "줄"의 수 (기본 0) */
  errors?: number;
  /** 실행하면 일부러 런타임 오류가 나는 예제인지 (기본 false) */
  throws?: boolean;
  mission?: Mission;
}

export interface Exercise {
  id: string;
  title: string;
  prompt: string;
  runner: Runner;
  /** 학습자가 고치는 부분 */
  starter: string;
  /** 채점용 코드. 에디터 아래쪽에 붙고, 수정하면 채점되지 않습니다. */
  tests: string;
  solution: string;
  hints: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  code?: string;
  options: string[];
  /** options의 인덱스 */
  answer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  chapter: ChapterId;
  title: string;
  summary: string;
  minutes: number;
  steps: Step[];
  exercise: Exercise;
  quiz: QuizQuestion[];
}
