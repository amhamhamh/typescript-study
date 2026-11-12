import type { Exercise } from '../content/types';

export const TEST_MARKER = '// ─────── 여기부터는 채점용 코드입니다. 수정하지 마세요 ───────';

/** 에디터에 처음 채워 넣을 전체 코드 */
export function buildExerciseCode(exercise: Exercise, body: string = exercise.starter): string {
  return `${body.trim()}\n\n${TEST_MARKER}\n${exercise.tests.trim()}\n`;
}

// 채점 결과도 판별 유니온입니다. ok가 false일 때만 reasons가 존재합니다.
export type GradeResult = { ok: true } | { ok: false; reasons: string[] };

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

export function grade(exercise: Exercise, code: string, errorCount: number): GradeResult {
  const reasons: string[] = [];
  const markerAt = code.indexOf(TEST_MARKER);

  if (markerAt === -1 || !squash(code.slice(markerAt)).includes(squash(exercise.tests))) {
    return { ok: false, reasons: ['채점용 코드가 바뀌었어요. "처음으로"를 눌러 되돌린 뒤 위쪽 코드만 고쳐 주세요.'] };
  }

  const mine = stripComments(code.slice(0, markerAt));
  if (/\bany\b/.test(mine)) {
    reasons.push('any를 쓰면 타입 검사가 꺼집니다. any 없이 정확한 타입을 적어 보세요.');
  }
  if (/@ts-(ignore|nocheck|expect-error)/.test(code.slice(0, markerAt))) {
    reasons.push('@ts-ignore / @ts-expect-error로 오류를 숨기지 말고 타입으로 해결해 보세요.');
  }
  if (errorCount > 0) {
    reasons.push(`아직 타입 오류가 ${errorCount}개 남아 있어요. 아래 오류 목록을 확인해 보세요.`);
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
