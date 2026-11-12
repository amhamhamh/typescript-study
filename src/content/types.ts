// 학습 콘텐츠의 "모양"을 정의하는 파일입니다.
// 이 사이트 자체가 TypeScript로 만들어져 있으니, 레슨에서 배운 내용이
// 실제 코드에서 어떻게 쓰이는지 여기서 확인해 보세요. (판별 유니온, 선택 속성 등)

export type ChapterId = 'basics' | 'react' | 'redux' | 'native';

export interface Chapter {
  id: ChapterId;
  title: string;
  /** "이미 알고 있는 것"과 연결해 주는 한 줄 */
  fromExperience: string;
  description: string;
}

export type CodeLang = 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'bash';

/** 레슨 본문을 이루는 블록. `kind`로 구분되는 판별 유니온입니다. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; code: string; lang?: CodeLang; title?: string }
  | { kind: 'compare'; js: string; ts: string; jsLabel?: string; tsLabel?: string; caption?: string }
  | { kind: 'callout'; tone: 'tip' | 'warn' | 'bridge'; title: string; text: string }
  | { kind: 'playground'; id: string; code: string; jsx?: boolean; caption?: string };

export interface Exercise {
  id: string;
  title: string;
  prompt: string;
  /** 학습자가 고치는 부분 */
  starter: string;
  /** 채점용 코드. 에디터 아래쪽에 붙고, 수정하면 채점되지 않습니다. */
  tests: string;
  solution: string;
  hints: string[];
  jsx?: boolean;
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
  blocks: Block[];
  exercise: Exercise;
  quiz: QuizQuestion[];
}
