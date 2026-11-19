import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'unions',
  chapter: 'basics',
  title: '유니온과 좁히기: TS의 핵심 기술',
  summary: '"A 또는 B"를 타입으로 적고, 조건문으로 범위를 좁혀 가는 방식입니다. React와 Redux 타이핑의 대부분이 여기서 나옵니다.',
  minutes: 15,
  steps: [
    {
      id: 'unions-1',
      title: '리터럴 유니온: 오타 없는 상태 문자열',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '이미 쓰던 패턴',
          text: "`status === 'loading'`이면 스피너, `'error'`면 에러 화면. `action.type`으로 `switch`. **문자열로 상태를 구분하는 코드**를 수없이 짜 봤을 겁니다. 유니온 타입은 그 \"가능한 값의 목록\"을 타입으로 적어 두는 것입니다.",
        },
        {
          kind: 'p',
          text: "1행의 `|`는 \"또는\"입니다. `Status`에는 네 문자열 중 하나만 들어갈 수 있습니다. `string`보다 훨씬 좁은 타입이라, 목록에 없는 값은 대입도 비교도 오류가 됩니다.",
        },
        {
          kind: 'p',
          text: "5행은 `'sucess'`와 비교하고 13행은 `'eror'`를 대입합니다. 타입 검사는 둘 다 잡았습니다. 콘솔을 보세요. 크래시는 없지만 `success`인데 `대기 중`이 찍혔습니다. 완료 화면이 영영 나오지 않는, JS에서는 **아무 경고 없이** 지나가던 버그입니다.",
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '상수 객체가 필요 없습니다',
          text: "JS에서는 오타가 무서워서 `STATUS.LOADING` 같은 상수 객체를 만들었습니다. TS에서는 문자열을 그대로 써도 오타가 잡히고, 따옴표 안에서 `Ctrl+Space`를 누르면 가능한 값이 자동완성됩니다.",
        },
      ],
      code: `type Status = 'idle' | 'loading' | 'success' | 'error';

function label(status: Status): string {
  if (status === 'loading') return '불러오는 중';
  if (status === 'sucess') return '완료';
  if (status === 'error') return '실패';
  return '대기 중';
}

let current: Status = 'success';
console.log(current, '→', label(current));

current = 'eror';
console.log(current, '→', label(current));
`,
      mission: {
        text: '5행과 13행의 오타를 고쳐서 타입 오류를 없애세요. 콘솔에 `success → 완료`와 `error → 실패`가 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['success → 완료', 'error → 실패'] },
        hint: "`Status`에 적힌 철자 그대로 `'success'`, `'error'`로 고칩니다.",
        answer: `type Status = 'idle' | 'loading' | 'success' | 'error';

function label(status: Status): string {
  if (status === 'loading') return '불러오는 중';
  if (status === 'success') return '완료';
  if (status === 'error') return '실패';
  return '대기 중';
}

let current: Status = 'success';
console.log(current, '→', label(current));

current = 'error';
console.log(current, '→', label(current));
`,
      },
    },
    {
      id: 'unions-2',
      title: '좁히기: typeof로 둘 중 무엇인지 확인하기',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: "유니온은 서로 다른 타입도 묶습니다. RN 스타일의 `width`는 `120`도 되고 `'50%'`도 되죠. 이런 값은 `number | string`입니다.",
        },
        {
          kind: 'p',
          text: '유니온 값은 "둘 중 무엇인지 아직 모르는" 상태라서 **양쪽에 모두 있는 기능**만 쓸 수 있습니다. 3행의 `endsWith`는 문자열에만 있어서 오류입니다. 콘솔에서도 8행의 `describeWidth(120)`이 `width.endsWith is not a function`으로 멈췄습니다.',
        },
        {
          kind: 'p',
          text: '해결책은 새 문법이 아니라 **평범한 JS 조건문**입니다. `typeof`로 확인하면 TS가 그 뒤의 타입을 자동으로 좁힙니다. 이것을 좁히기(narrowing)라고 합니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `if (typeof width === 'number') {
  width; // 여기서는 number
} else {
  width; // 여기서는 string
}`,
        },
      ],
      code: `// RN 스타일의 width: 120 또는 '50%'
function describeWidth(width: number | string): string {
  if (width.endsWith('%')) return '부모의 ' + width;
  return width + 'px';
}

console.log(describeWidth('50%'));
console.log(describeWidth(120));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '함수 첫 줄에서 `typeof`로 숫자인 경우를 먼저 처리하세요. 콘솔에 `120px`이 찍히고 마지막 줄까지 실행되면 성공입니다. 고친 뒤 각 줄의 `width`에 마우스를 올려 타입이 어떻게 달라지는지도 확인해 보세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['부모의 50%', '120px', '끝까지 실행됨'] },
        hint: "`if (typeof width === 'number') return width + 'px';`를 맨 위에 넣으면, 그 아래에서는 `width`가 `string`입니다.",
        answer: `// RN 스타일의 width: 120 또는 '50%'
function describeWidth(width: number | string): string {
  if (typeof width === 'number') return width + 'px';
  if (width.endsWith('%')) return '부모의 ' + width;
  return width + 'px';
}

console.log(describeWidth('50%'));
console.log(describeWidth(120));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'unions-3',
      title: '좁히기: 없을 수도 있는 값 걸러 내기',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '가장 자주 만나는 유니온은 **`T | undefined`**입니다. 7행의 `found`에 마우스를 올려 보세요. `find`는 못 찾으면 `undefined`를 돌려주므로 타입이 `{ id: number; name: string } | undefined`입니다. 앞 레슨의 `nickname?: string`도 같은 종류였습니다.',
        },
        {
          kind: 'p',
          text: '8행은 확인 없이 `found.name`을 읽습니다. 타입 검사는 `\'found\' is possibly \'undefined\'`라고 하고, 콘솔에서는 없는 id로 호출한 12행에서 `Cannot read properties of undefined (reading \'name\')`로 멈췄습니다. 크래시 리포트에서 가장 많이 보던 바로 그 오류입니다.',
        },
        {
          kind: 'list',
          items: [
            '`if (!found) return ...` → 그 아래에서는 `undefined`가 빠집니다',
            '`if (found) { ... }` → 블록 안에서만 좁혀집니다',
            "`found?.name ?? '기본값'` → 한 줄로 처리",
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '숫자와 문자열은 if (value)를 조심하세요',
          text: "`if (count)`는 `undefined`뿐 아니라 `0`도 걸러 냅니다. `''`도 마찬가지입니다. `0`이나 빈 문자열이 정상 값이라면 `count !== undefined`로 비교하세요.",
        },
      ],
      code: `const users = [
  { id: 1, name: '김코딩' },
  { id: 2, name: '박리덕' },
];

function nameOf(id: number): string {
  const found = users.find((u) => u.id === id);
  return found.name;
}

console.log(nameOf(2));
console.log(nameOf(7));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '`found`가 없을 때는 `(알 수 없음)`을 돌려주도록 `nameOf`를 고치세요. 콘솔에 `박리덕`, `(알 수 없음)`, `끝까지 실행됨`이 차례로 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['박리덕', '(알 수 없음)', '끝까지 실행됨'] },
        hint: "8행 앞에 `if (!found) return '(알 수 없음)';`을 넣으면 그 아래의 `found`는 `undefined`가 아닙니다.",
        answer: `const users = [
  { id: 1, name: '김코딩' },
  { id: 2, name: '박리덕' },
];

function nameOf(id: number): string {
  const found = users.find((u) => u.id === id);
  if (!found) return '(알 수 없음)';
  return found.name;
}

console.log(nameOf(2));
console.log(nameOf(7));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'unions-4',
      title: '판별 유니온: 꼬리표로 객체 구분하기',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`isLoading`, `items`, `error`를 따로 두면 "로딩 중인데 에러도 있는" 불가능한 조합이 생기고, `items`는 늘 `undefined`일 수 있습니다. 대신 **상태별 객체를 유니온으로** 묶습니다. 모든 멤버에 같은 이름의 속성(`status`)을 두고 값을 서로 다른 리터럴로 적으면, 그 속성이 꼬리표가 됩니다.',
        },
        {
          kind: 'p',
          text: '꼬리표를 검사하면 **나머지 속성까지 한꺼번에** 좁혀집니다. 7행에서 `loading`을 걸러 냈지만 8행에는 아직 `success`와 `error`가 남아 있고, `error`에는 `items`가 없습니다. 그래서 8행이 오류이고, 콘솔에서도 `error` 상태를 넘긴 13행에서 크래시했습니다.',
        },
        {
          kind: 'callout',
          tone: 'bridge',
          title: 'action.type이 바로 이것입니다',
          text: "`switch (action.type)`의 `case 'todos/added':` 안에서 `action.payload`를 꺼내 쓰던 것과 같은 구조입니다. TS에서는 각 `case` 안에서 그 멤버의 속성만 자동완성됩니다.",
        },
      ],
      code: `type FetchState =
  | { status: 'loading' }
  | { status: 'success'; items: string[] }
  | { status: 'error'; message: string };

function render(state: FetchState): string {
  if (state.status === 'loading') return '스피너';
  return '상품 ' + state.items.length + '개';
}

console.log(render({ status: 'loading' }));
console.log(render({ status: 'success', items: ['키보드', '마우스'] }));
console.log(render({ status: 'error', message: '네트워크 오류' }));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '`render`를 `switch (state.status)`로 바꿔 세 상태를 모두 처리하세요. `error`일 때는 `오류: ` 뒤에 `message`를 붙여 돌려줍니다. `case` 안에서 `state.`을 입력해 자동완성이 어떻게 달라지는지 확인해 보세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['스피너', '상품 2개', '오류: 네트워크 오류', '끝까지 실행됨'] },
        hint: "`case 'success': return '상품 ' + state.items.length + '개';` `case 'error': return '오류: ' + state.message;`",
        answer: `type FetchState =
  | { status: 'loading' }
  | { status: 'success'; items: string[] }
  | { status: 'error'; message: string };

function render(state: FetchState): string {
  switch (state.status) {
    case 'loading':
      return '스피너';
    case 'success':
      return '상품 ' + state.items.length + '개';
    case 'error':
      return '오류: ' + state.message;
  }
}

console.log(render({ status: 'loading' }));
console.log(render({ status: 'success', items: ['키보드', '마우스'] }));
console.log(render({ status: 'error', message: '네트워크 오류' }));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'unions-5',
      title: '빠뜨린 case를 TS가 찾아 줍니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '푸시 알림을 누르면 종류에 따라 다른 화면으로 보내는 코드입니다. 처음에는 `chat`과 `order`뿐이었는데, 나중에 4행의 `notice`가 추가됐습니다. 그런데 `switch`를 고치는 것을 잊었습니다.',
        },
        {
          kind: 'p',
          text: '콘솔 둘째 줄의 `이동: undefined`가 그 결과입니다. 공지 알림을 눌러도 아무 화면도 열리지 않는 버그입니다. 타입 검사는 6행에서 `Function lacks ending return statement`라고 알려 줍니다. 반환 타입을 `string`이라고 적어 뒀는데, `notice`일 때는 아무것도 반환하지 않고 함수가 끝나기 때문입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '유니온에 멤버를 추가하면 고칠 곳이 빨갛게 됩니다',
          text: '`case`마다 값을 `return`하고 **반환 타입을 적어 둔** 함수라면, 멤버를 추가하는 순간 그 멤버를 처리하지 않은 `switch`가 전부 오류로 표시됩니다. 반환 타입을 생략하면 `string | undefined`로 추론될 뿐 오류가 나지 않습니다. 알림 종류, 액션 종류를 늘릴 때 "어디를 고쳐야 하지?"를 TS가 대신 찾아 줍니다.',
        },
      ],
      code: `type Push =
  | { kind: 'chat'; roomId: number }
  | { kind: 'order'; orderId: string }
  | { kind: 'notice'; title: string };

function screenFor(push: Push): string {
  switch (push.kind) {
    case 'chat':
      return 'ChatRoom/' + push.roomId;
    case 'order':
      return 'OrderDetail/' + push.orderId;
  }
}

console.log('이동:', screenFor({ kind: 'chat', roomId: 7 }));
console.log('이동:', screenFor({ kind: 'notice', title: '점검 안내' }));
`,
      mission: {
        text: '`notice`를 처리하는 `case`를 추가해 `Notice/` 뒤에 `title`을 붙여 돌려주세요. 콘솔에 `이동: Notice/점검 안내`가 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['이동: ChatRoom/7', '이동: Notice/점검 안내'] },
        hint: "`case 'notice': return 'Notice/' + push.title;`",
        answer: `type Push =
  | { kind: 'chat'; roomId: number }
  | { kind: 'order'; orderId: string }
  | { kind: 'notice'; title: string };

function screenFor(push: Push): string {
  switch (push.kind) {
    case 'chat':
      return 'ChatRoom/' + push.roomId;
    case 'order':
      return 'OrderDetail/' + push.orderId;
    case 'notice':
      return 'Notice/' + push.title;
  }
}

console.log('이동:', screenFor({ kind: 'chat', roomId: 7 }));
console.log('이동:', screenFor({ kind: 'notice', title: '점검 안내' }));
`,
      },
    },
    {
      id: 'unions-6',
      title: 'as로 우기지 않기',
      runner: 'console',
      throws: true,
      body: [
        {
          kind: 'p',
          text: '3단계의 `nameOf`와 같은 코드인데 타입 오류가 **0개**입니다. 고친 것이 아닙니다. 12행 끝의 `as User`가 "이 값은 `User`가 맞으니 믿어"라고 우긴 것입니다. 이것을 타입 단언이라고 합니다.',
        },
        {
          kind: 'p',
          text: '콘솔을 보세요. 17행의 호출에서 **똑같은 크래시**가 났습니다. `as`는 값을 검사하지도 변환하지도 않고, 빌드하면 지워집니다. 버그는 그대로 두고 경고만 끈 것입니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '경고를 끄는 세 가지',
          text: '`as 타입`, `found!.name`의 `!`(null/undefined가 아니라고 우기기), 그리고 `any`. 급할 때 손이 가지만 셋 다 타입 검사가 예고한 버그를 그대로 배포하게 만듭니다. 좁히기로 해결할 수 있으면 항상 좁히기를 쓰세요.',
        },
        {
          kind: 'p',
          text: '`as`가 정당한 경우는 TS가 알 방법이 없는 사실을 내가 **확실히** 알 때뿐입니다. 드뭅니다. 코드 리뷰에서 `as`가 보이면 "왜 좁히기가 아니지?"부터 물어보면 됩니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: '김코딩' },
  { id: 2, name: '박리덕' },
];

function nameOf(id: number): string {
  const found = users.find((u) => u.id === id) as User;
  return found.name;
}

console.log(nameOf(2));
console.log(nameOf(7));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '12행의 `as User`를 지우세요. 숨어 있던 오류가 13행에 다시 나타납니다. 이번에는 좁히기로 해결해서, 못 찾았을 때 `(탈퇴한 사용자)`를 돌려주세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['박리덕', '(탈퇴한 사용자)', '끝까지 실행됨'] },
        hint: "`as User`를 지운 뒤 `return found?.name ?? '(탈퇴한 사용자)';` 또는 `if (!found) return '(탈퇴한 사용자)';`",
        answer: `interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: '김코딩' },
  { id: 2, name: '박리덕' },
];

function nameOf(id: number): string {
  const found = users.find((u) => u.id === id);
  if (!found) return '(탈퇴한 사용자)';
  return found.name;
}

console.log(nameOf(2));
console.log(nameOf(7));
console.log('끝까지 실행됨');
`,
      },
    },
  ],
  exercise: {
    id: 'ex-unions',
    title: '유니온으로 범위 정하기',
    prompt: '(1) `Size`를 `sm`, `md`, `lg` 세 가지만 허용하는 타입으로 바꾸고, (2) `normalizeId`가 숫자와 문자열을 모두 받아 문자열을 돌려주도록 타입과 본문을 고쳐 보세요. 숫자는 `String(id)`로, 문자열은 대문자로 바꿔 돌려줍니다. 지금은 콘솔에서 `normalizeId(42)`가 크래시합니다.',
    runner: 'console',
    starter: `// TODO 1: 'sm' | 'md' | 'lg' 만 허용하세요.
type Size = string;

function toPixels(size: Size): number {
  if (size === 'sm') return 12;
  if (size === 'md') return 16;
  return 20;
}

// TODO 2: 숫자와 문자열을 모두 받을 수 있게 하세요.
function normalizeId(id) {
  return id.toUpperCase();
}`,
    tests: `const px: number = toPixels('md');
console.log('toPixels:', px, toPixels('lg'));
const id1: string = normalizeId(42);
const id2: string = normalizeId('abc');
console.log('normalizeId:', id1, id2);

// 아래 함수는 실행되지 않습니다. 잘못된 호출이 오류로 잡히는지만 확인합니다.
function mustBeRejected() {
  // @ts-expect-error 정해지지 않은 사이즈입니다
  toPixels('xl');
  // @ts-expect-error boolean은 받을 수 없습니다
  normalizeId(true);
}`,
    solution: `type Size = 'sm' | 'md' | 'lg';

function toPixels(size: Size): number {
  if (size === 'sm') return 12;
  if (size === 'md') return 16;
  return 20;
}

function normalizeId(id: number | string): string {
  if (typeof id === 'number') return String(id);
  return id.toUpperCase();
}`,
    hints: [
      "리터럴 유니온은 `'a' | 'b' | 'c'` 처럼 값을 `|`로 나열합니다.",
      '매개변수 타입은 `id: number | string` 입니다.',
      "`typeof id === 'number'` 로 좁힌 뒤 각각 다르게 처리하세요. number에는 toUpperCase가 없습니다.",
    ],
  },
  quiz: [
    {
      id: 'q-unions-1',
      question: '아래 코드에서 `value.length`가 오류 없이 통과하는 위치는?',
      code: `function f(value: string | null) {
  // (A)
  if (value !== null) {
    // (B)
  }
  // (C)
}`,
      options: ['(A)', '(B)', '(C)', '어디서도 안 된다'],
      answer: 1,
      explanation: '`value !== null` 조건 블록 안에서만 string으로 좁혀집니다. 블록을 벗어나면 다시 `string | null`입니다.',
    },
    {
      id: 'q-unions-2',
      question: '판별 유니온에서 "꼬리표" 속성이 갖춰야 할 조건은?',
      options: [
        '이름이 반드시 `type`이어야 한다',
        '모든 멤버에 공통으로 있고, 값이 서로 다른 리터럴 타입이어야 한다',
        '숫자여야 한다',
        '선택 속성(`?`)이어야 한다',
      ],
      answer: 1,
      explanation: "이름은 무엇이든 상관없습니다. 모든 멤버가 같은 이름의 속성을 갖고, 그 값이 `'loading'` / `'success'`처럼 겹치지 않는 리터럴이면 TS가 구분에 사용합니다.",
    },
    {
      id: 'q-unions-3',
      question: '`const user = data as User`에 대한 설명으로 옳은 것은?',
      options: [
        '실행 중에 `data`가 `User` 모양인지 검사한다',
        '`data`를 `User` 모양으로 변환한다',
        '검사 없이 타입만 `User`로 취급하게 하며, 실행되는 코드에는 아무 흔적도 남지 않는다',
        '모양이 다르면 실행 중에 오류를 던진다',
      ],
      answer: 2,
      explanation: '`as`는 타입 검사기에게 하는 "믿어 달라"는 말일 뿐입니다. 빌드하면 지워지므로 값이 실제로 다르면 방금 본 것처럼 그대로 크래시합니다.',
    },
  ],
};
