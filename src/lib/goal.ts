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

const isWord = (char: string | undefined): boolean => char !== undefined && /[\w$]/.test(char);

/** 바로 뒤에 값이 오는 단어들. 이 뒤의 `/`는 나눗셈이 아니라 정규식이고, `<`는 비교가 아니라 JSX입니다. */
const BEFORE_VALUE = /^(?:return|case|throw|typeof|instanceof|in|of|new|delete|void|do|else|yield|await)$/;

/**
 * `<` 뒤가 JSX 태그 이름(또는 `<>`)인지 봅니다.
 * `<T,>`, `<T extends U>`, `<T = U>`는 화살표 함수의 제네릭이므로 JSX로 보지 않습니다.
 */
const JSX_OPEN = /<(?:>|([A-Za-z_$][\w$.:-]*)(?![\w$.:-])(?!\s*(?:,|=|extends\b)))/y;

/** JSX 닫는 태그(`</a>`, `</A.B>`, `</>`). 1번 그룹이 태그 이름이고, `</>`에는 이름이 없습니다. */
const JSX_CLOSE = /<\/\s*(?:([A-Za-z_$][\w$.:-]*)|>)/g;

/** `${ }`, `{ }`, JSX 요소가 겹칠 수 있는 깊이. 사람이 쓴 코드는 여기에 한참 못 미칩니다. */
const MAX_NESTING = 200;

/**
 * 주석을 지운 코드를 돌려줍니다. 주석으로 막아 둔 코드가 "쓴 것"으로 잡히지 않게 하려는 것입니다.
 *
 * 정규식으로 한꺼번에 지우면 문자열 안의 `//`(`'https://…'` 같은 주소)나 `/*`를 주석으로 잘못 읽어서
 * 뒤에 있는 진짜 코드까지 지워 버립니다. 그래서 코드를 앞에서부터 한 번 훑으면서 지금 읽는 곳이
 * 문자열인지, 템플릿 리터럴인지, 정규식인지, JSX 태그 사이의 글자인지를 구분합니다.
 * 컴파일러처럼 문법 전체를 보는 것은 아니고, 레슨에 나올 만한 코드를 구분할 수 있을 만큼만 봅니다.
 */
function stripComments(code: string): string {
  const end = code.length;
  let out = '';
  let at = 0;

  /** 지금 위치부터 `to` 앞까지를 그대로 남깁니다. */
  const keep = (to: number): void => {
    out += code.slice(at, to);
    at = Math.min(to, end);
  };

  /**
   * 안쪽으로 한 겹 더 들어가서 읽습니다. 엉뚱한 글자가 수천 겹으로 붙여 넣어져도
   * 호출 스택이 넘치지 않게, 한도를 넘으면 남은 글자를 그대로 두고 끝냅니다.
   */
  let nesting = 0;
  const deeper = (read: () => void): void => {
    if (nesting >= MAX_NESTING) return keep(end);
    nesting += 1;
    read();
    nesting -= 1;
  };

  /** 지금 위치가 주석의 시작이면 건너뛰고 true를 돌려줍니다. */
  const skipComment = (): boolean => {
    if (code.startsWith('//', at)) {
      const lineEnd = code.indexOf('\n', at);
      at = lineEnd === -1 ? end : lineEnd;
      return true;
    }
    if (code.startsWith('/*', at)) {
      const close = code.indexOf('*/', at + 2);
      at = close === -1 ? end : close + 2;
      out += ' '; // 주석 양쪽의 단어가 붙어 버리지 않게 합니다.
      return true;
    }
    return false;
  };

  /** 따옴표 문자열. 닫는 따옴표가 없으면 줄 끝에서 멈춰서, 아래 줄까지 문자열로 삼키지 않습니다. */
  const string = (): void => {
    const quote = code.charAt(at);
    let to = at + 1;
    while (to < end && code[to] !== quote && code[to] !== '\n') to += code[to] === '\\' ? 2 : 1;
    keep(code[to] === quote ? to + 1 : to);
  };

  /** 정규식 리터럴. `[...]` 안의 `/`는 끝이 아닙니다. 따옴표나 `//`가 들어 있어도 그대로 남깁니다. */
  const regex = (): void => {
    let to = at + 1;
    let inClass = false;
    while (to < end && code[to] !== '\n' && (inClass || code[to] !== '/')) {
      if (code[to] === '\\') to += 1;
      else if (code[to] === '[') inClass = true;
      else if (code[to] === ']') inClass = false;
      to += 1;
    }
    keep(code[to] === '/' ? to + 1 : to);
  };

  /** 템플릿 리터럴. 글자는 그대로 남기고, `${ }` 안은 다시 코드로 읽습니다. */
  const template = (): void => {
    keep(at + 1);
    while (at < end) {
      if (code[at] === '`') return keep(at + 1);
      if (code.startsWith('${', at)) {
        keep(at + 2);
        braced();
      } else {
        keep(at + (code[at] === '\\' ? 2 : 1));
      }
    }
  };

  /** 지금 위치가 JSX 여는 태그의 시작이면 그 일치 결과(1번 그룹이 태그 이름)를 돌려줍니다. */
  const jsxOpenAt = (): RegExpExecArray | null => {
    JSX_OPEN.lastIndex = at;
    return JSX_OPEN.exec(code);
  };

  /**
   * 지금 위치보다 뒤에 이 이름의 닫는 태그가 있는지 봅니다. 이름이 통째로 같아야 합니다.
   * (`<T>`의 짝으로 `</Text>`를 세면, 제네릭 `<T>(item: T) => T`를 JSX로 읽어서 그 뒤의 주석을 지우지 못합니다)
   * 여는 태그를 만날 때마다 코드 끝까지 다시 찾으면 `<a>`만 수만 번 붙여 넣은 코드에서 화면이 멈추므로,
   * 이름마다 마지막 닫는 태그의 위치를 처음 필요할 때 한 번만 훑어서 적어 둡니다.
   */
  let lastClose: Map<string, number> | undefined;
  const closesLater = (name = ''): boolean => {
    if (lastClose === undefined) {
      lastClose = new Map();
      for (const match of code.matchAll(JSX_CLOSE)) lastClose.set(match[1] ?? '', match.index);
    }
    return (lastClose.get(name) ?? -1) >= at;
  };

  /**
   * `<`에서 시작하는 태그 하나(`<a b={c}>`, `<a />`, `</a>`)를 읽습니다.
   * 뒤에 자식이 이어지는 여는 태그였을 때만 true를 돌려줍니다.
   */
  const tag = (): boolean => {
    const closing = code[at + 1] === '/';
    keep(at + (closing ? 2 : 1));
    while (at < end) {
      const char = code.charAt(at);
      if (char === '>') {
        keep(at + 1);
        return !closing;
      }
      if (code.startsWith('/>', at)) {
        keep(at + 2);
        return false;
      }
      if (char === '{') {
        keep(at + 1);
        braced();
      } else if (char === '"' || char === "'") {
        string();
      } else if (skipComment()) {
        // 태그 안에서 속성 한 줄을 주석으로 막아 둔 경우입니다.
      } else if (/[\w$\s.:=-]/.test(char)) {
        keep(at + 1);
      } else {
        return false; // 태그에 올 수 없는 글자입니다. JSX가 아니었으니 코드로 돌아갑니다.
      }
    }
    return false;
  };

  /**
   * JSX 요소 하나를 닫는 태그까지 읽습니다. 태그와 `{ }` 안은 코드로 읽고,
   * 태그 사이의 글자는 `//`나 따옴표가 들어 있어도(`<p>https://… Don't</p>`) 그대로 남깁니다.
   */
  const element = (name: string | undefined): void => {
    if (!tag()) return;
    // 짝이 되는 닫는 태그가 뒤에 없으면 JSX가 아니라 `<T>(item: T) => item` 같은 제네릭입니다.
    if (!closesLater(name)) return;
    while (at < end) {
      if (code.startsWith('</', at)) {
        tag();
        return;
      }
      if (code[at] === '{') {
        keep(at + 1);
        braced();
      } else {
        const child = jsxOpenAt();
        if (child) deeper(() => element(child[1]));
        else keep(at + 1);
      }
    }
  };

  /** 코드를 읽습니다. `untilBrace`면 짝이 맞는 `}`까지만(그 `}` 포함) 읽고 돌아갑니다. */
  const script = (untilBrace: boolean): void => {
    let depth = 0;
    // 다음 자리에 값이 올 수 있는지. `a / b`와 `= /정규식/`, `a < b`와 `= <태그>`를 이것으로 가릅니다.
    let valueNext = true;
    while (at < end) {
      const char = code.charAt(at);
      if (/\s/.test(char)) {
        keep(at + 1);
      } else if (skipComment()) {
        // 건너뛰었습니다.
      } else if (isWord(char)) {
        let to = at + 1;
        while (isWord(code[to])) to += 1;
        // `a.in`, `a.of` 같은 속성 이름은 값입니다.
        valueNext = code[at - 1] !== '.' && BEFORE_VALUE.test(code.slice(at, to));
        keep(to);
      } else if (char === '"' || char === "'") {
        string();
        valueNext = false;
      } else if (char === '`') {
        template();
        valueNext = false;
      } else if (char === '/' && valueNext) {
        regex();
        valueNext = false;
      } else if (char === '}' && untilBrace && depth === 0) {
        return keep(at + 1);
      } else {
        const jsx = char === '<' && valueNext ? jsxOpenAt() : null;
        if (jsx) {
          deeper(() => element(jsx[1]));
          valueNext = false;
          continue;
        }
        // 값 바로 뒤에 붙는 `!`(non-null), `++`, `--`는 값을 끝내는 기호입니다. 그 뒤의 `/`는 여전히 나눗셈입니다.
        // (`a != b`의 `!`는 연산자의 일부이므로 여기에 들지 않습니다)
        if (!valueNext && (code.startsWith('++', at) || code.startsWith('--', at) || (char === '!' && code[at + 1] !== '='))) {
          keep(at + (char === '!' ? 1 : 2));
          continue;
        }
        if (char === '{') depth += 1;
        else if (char === '}') depth -= 1;
        valueNext = !')]}'.includes(char);
        keep(at + 1);
      }
    }
  };

  /** `{`나 `${` 바로 다음부터 짝이 맞는 `}`까지를 코드로 읽습니다. */
  const braced = (): void => deeper(() => script(true));

  script(false);
  return out;
}

/**
 * 표현의 맨 앞(before)이나 맨 뒤(after)가 연산자 기호일 때, 코드에서 그 기호 바로 옆에 붙어 있으면
 * 더 긴 다른 연산자가 되어 버리는 글자들입니다. `&`가 `&&`에, `| undefined`가 `|| undefined`에,
 * `=`가 `==`나 `=>`에, `.value`가 `...value`에 걸리지 않게 합니다.
 * `<`와 `>`는 일부러 넣지 않았습니다. 넣으면 `Record<string, Map<string, User>>` 안의
 * `Map<string, User>`를 찾지 못합니다. 괄호류도 같은 이유로(`style={{...a}}` 안의 `{...`) 뺐습니다.
 */
const LONGER_OPERATOR = new Map<string, { before: string; after: string }>([
  ['&', { before: '&', after: '&=' }],
  ['|', { before: '|', after: '|=' }],
  ['?', { before: '?', after: '?.' }],
  ['.', { before: '.', after: '.' }],
  ['=', { before: '=!<>+\\-*/%&|^?', after: '=>' }],
  ['!', { before: '', after: '=' }],
]);

/** 표현의 맨 앞(before) 또는 맨 뒤(after) 토큰에 붙일 경계 조건을 만듭니다. */
function boundary(token: string, side: 'before' | 'after'): string {
  const look = side === 'before' ? '?<!' : '?!';
  if (isWord(side === 'before' ? token[0] : token.at(-1))) return `(${look}[\\w$])`;
  const joins = LONGER_OPERATOR.get(token)?.[side];
  return joins ? `(${look}[${joins}])` : '';
}

/**
 * 'Record<Status, string>' 같은 표현을, 띄어쓰기가 달라도 찾을 수 있는 정규식으로 바꿉니다.
 * - 단어와 단어 사이는 공백이 꼭 있어야 하고(`as const`), 기호 주변의 공백은 있어도 없어도 됩니다.
 * - 다만 `?.`, `??`, `...`처럼 붙여 쓴 연산자는 코드에서도 붙어 있어야 합니다. (`a ? .5 : 1`은 `?.`가 아닙니다)
 * - 양 끝이 단어면 단어 경계를 요구해서 `as User`가 `hasUser`에 걸리지 않게 하고,
 *   양 끝이 연산자 기호면 더 긴 연산자의 일부가 아니어야 합니다. (LONGER_OPERATOR)
 * - 따옴표는 종류를 가리지 않습니다. `'ios'`라고 적어 두면 `"ios"`로 쓴 코드도 찾습니다.
 * 찾을 것이 없는 빈 표현이면 null을 돌려줍니다.
 */
function toPattern(expression: string): RegExp | null {
  const tokens = [...expression.matchAll(/[\w$]+|[^\s\w$]/g)];
  const first = tokens[0]?.[0];
  const last = tokens.at(-1)?.[0];
  if (first === undefined || last === undefined) return null;

  let source = '';
  tokens.forEach((match, index) => {
    const token = match[0];
    const previous = tokens[index - 1];
    if (previous !== undefined) {
      const glued = previous.index + previous[0].length === match.index;
      if (isWord(previous[0].at(-1)) && isWord(token[0])) source += '\\s+';
      else if (!(glued && LONGER_OPERATOR.has(previous[0]) && LONGER_OPERATOR.has(token))) source += '\\s*';
    }
    source += /^['"`]$/.test(token) ? '[\'"`]' : token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(`${boundary(first, 'before')}${source}${boundary(last, 'after')}`);
}

/** 주석을 뺀 코드에 표현이 들어 있는지 봅니다. 빈 표현은 어떤 코드에도 들어 있지 않은 것으로 칩니다. */
export function codeHas(code: string, expression: string): boolean {
  return toPattern(expression)?.test(stripComments(code)) ?? false;
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
