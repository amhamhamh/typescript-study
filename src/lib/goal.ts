import type { Goal } from '../content/types';

/** 미션 달성 여부를 판단할 때 보는 현재 상태 */
export interface Observation {
  /** 타입 오류 개수. 아직 검사 전이면 null */
  typeErrors: number | null;
  /** 콘솔에 찍힌 모든 줄을 이어 붙인 문자열 */
  console: string;
  /** 미리보기 화면의 글자 */
  preview: string;
}

export function meetsGoal(goal: Goal, seen: Observation): boolean {
  if (goal.noTypeErrors && seen.typeErrors !== 0) return false;
  if (goal.consoleIncludes && !goal.consoleIncludes.every((text) => seen.console.includes(text))) return false;
  if (goal.previewIncludes && !goal.previewIncludes.every((text) => seen.preview.includes(text))) return false;
  return true;
}

/** 조건을 사람이 읽을 수 있는 문장 목록으로 바꿉니다. */
export function describeGoal(goal: Goal): string[] {
  const lines: string[] = [];
  if (goal.noTypeErrors) lines.push('타입 오류 0개');
  for (const text of goal.consoleIncludes ?? []) lines.push(`콘솔에 "${text}" 출력`);
  for (const text of goal.previewIncludes ?? []) lines.push(`미리보기에 "${text}" 표시`);
  return lines;
}
