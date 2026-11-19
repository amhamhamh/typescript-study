// 학습 페이지(부모)와 샌드박스 iframe이 주고받는 메시지의 모양.
// 양쪽이 같은 타입을 import 하므로, 한쪽만 바꾸면 컴파일 오류로 드러납니다.

export type Runner = 'console' | 'react' | 'native';

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

/** iframe → 부모 */
export type FromSandbox =
  | { type: 'ready' }
  | { type: 'log'; level: LogLevel; text: string; uncaught?: boolean }
  | { type: 'done'; rendered: boolean }
  | { type: 'dom'; text: string };

/** 부모 → iframe */
export interface RunRequest {
  type: 'run';
  code: string;
  runner: Runner;
}

export const CHANNEL = '__tsl';
