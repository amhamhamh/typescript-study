import type { Goal } from '../content/types';

/** 미션 달성 여부를 판단할 때 보는 현재 상태 */
export interface Observation {
  /** 타입 오류 개수. 아직 검사 전이면 null */
  typeErrors: number | null;
  /** 콘솔에 찍힌 모든 줄을 이어 붙인 문자열 */
  console: string;
  /** 미리보기 화면의 글자 */
  preview: string;
  /** 에디터에 있는 코드 */
  code: string;
}

/** 주석을 지웁니다. 문자열 안의 `//`까지 완벽히 구분하지는 않지만, 표현을 찾는 용도로는 충분합니다. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const isWord = (char: string | undefined): boolean => char !== undefined && /[\w$]/.test(char);

/**
 * 'Record<Status, string>' 같은 표현을, 띄어쓰기가 달라도 찾을 수 있는 정규식으로 바꿉니다.
 * 단어와 단어 사이는 공백이 꼭 있어야 하고(`as const`), 기호 주변의 공백은 있어도 없어도 됩니다.
 * 양 끝이 단어면 단어 경계를 요구해서 `as User`가 `hasUser`에 걸리지 않게 합니다.
 */
function toPattern(expression: string): RegExp {
  const tokens = expression.match(/[\w$]+|[^\s\w$]/g) ?? [];
  let source = '';
  tokens.forEach((token, index) => {
    const previous = tokens[index - 1];
    if (previous !== undefined) source += isWord(previous.at(-1)) && isWord(token[0]) ? '\\s+' : '\\s*';
    source += token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return new RegExp(`${isWord(first?.[0]) ? '(?<![\\w$])' : ''}${source}${isWord(last?.at(-1)) ? '(?![\\w$])' : ''}`);
}

export function codeHas(code: string, expression: string): boolean {
  return toPattern(expression).test(stripComments(code));
}

export function meetsGoal(goal: Goal, seen: Observation): boolean {
  if (goal.noTypeErrors && seen.typeErrors !== 0) return false;
  if (goal.consoleIncludes && !goal.consoleIncludes.every((text) => seen.console.includes(text))) return false;
  if (goal.previewIncludes && !goal.previewIncludes.every((text) => seen.preview.includes(text))) return false;
  if (goal.codeIncludes && !goal.codeIncludes.every((text) => codeHas(seen.code, text))) return false;
  if (goal.codeExcludes && goal.codeExcludes.some((text) => codeHas(seen.code, text))) return false;
  return true;
}

export interface GoalCheck {
  label: string;
  met: boolean;
}

/** 조건 하나하나를 사람이 읽을 문장과 현재 충족 여부로 풀어 줍니다. */
export function checkGoal(goal: Goal, seen: Observation): GoalCheck[] {
  const checks: GoalCheck[] = [];
  if (goal.noTypeErrors) checks.push({ label: '타입 오류 0개', met: seen.typeErrors === 0 });
  for (const text of goal.consoleIncludes ?? []) {
    checks.push({ label: `콘솔에 "${text}" 출력`, met: seen.console.includes(text) });
  }
  for (const text of goal.previewIncludes ?? []) {
    checks.push({ label: `미리보기에 "${text}" 표시`, met: seen.preview.includes(text) });
  }
  for (const text of goal.codeIncludes ?? []) {
    checks.push({ label: `코드에 \`${text}\` 사용`, met: codeHas(seen.code, text) });
  }
  for (const text of goal.codeExcludes ?? []) {
    checks.push({ label: `코드에서 \`${text}\` 없애기`, met: !codeHas(seen.code, text) });
  }
  return checks;
}
