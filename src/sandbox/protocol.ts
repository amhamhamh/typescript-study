// 학습 페이지(부모)와 샌드박스 iframe이 주고받는 메시지의 모양.
// 양쪽이 같은 타입을 import 하므로, 한쪽만 바꾸면 컴파일 오류로 드러납니다.

export type Runner = 'console' | 'react' | 'native';

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

/** iframe → 부모 */
export type FromSandbox =
  | { type: 'ready' }
  /** 실행이 오래 걸려도(긴 await 등) 스크립트가 멈춘 게 아님을 알리는 신호 */
  | { type: 'alive' }
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

/** 반복문 본문 맨 앞에 끼워 넣는 보호 함수의 이름. compile.ts가 호출을 넣고, runtime.ts가 함수를 넘겨줍니다. */
export const LOOP_GUARD = '__tslLoop';
