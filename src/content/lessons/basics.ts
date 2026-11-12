import type { Lesson } from '../types';

export const basicsLessons: Lesson[] = [
  {
    id: 'inference',
    chapter: 'basics',
    title: '타입 추론: 생각보다 적게 써도 됩니다',
    summary: 'TS는 "JS + 타입 표기"입니다. 어디에 타입을 쓰고, 어디는 맡겨도 되는지부터 잡습니다.',
    minutes: 10,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '이미 겪어 본 문제',
        text: '앱을 배포한 뒤 `undefined is not a function`, `Cannot read property \'name\' of undefined` 크래시 리포트를 받아 본 적 있죠. CodePush로 급하게 핫픽스를 내보내던 그 버그의 상당수는 **코드를 실행하기 전에** 에디터에서 잡을 수 있습니다. 그게 TypeScript가 하는 일의 전부입니다.',
      },
      {
        kind: 'p',
        text: 'TypeScript는 새로운 언어가 아니라 **JavaScript에 타입 표기를 얹은 것**입니다. 빌드할 때 타입은 전부 지워지고 평범한 JS만 남습니다. 그래서 지금 알고 있는 JS 지식은 하나도 버려지지 않습니다.',
      },
      {
        kind: 'compare',
        js: `function getTotal(price, qty) {
  return price * qty;
}

// 실행해 봐야 안다 → NaN
getTotal('10000', { qty: 2 });`,
        ts: `function getTotal(price: number, qty: number): number {
  return price * qty;
}

// 입력하는 순간 빨간 줄
getTotal('10000', { qty: 2 });`,
        caption: '달라진 건 `: number` 표기뿐입니다. 함수 본문은 그대로예요.',
      },
      { kind: 'h', text: '변수는 대부분 추론에 맡깁니다' },
      {
        kind: 'p',
        text: '모든 변수에 타입을 적을 필요는 없습니다. 초기값이 있으면 TS가 알아서 타입을 **추론**합니다. 아래 에디터에서 변수 위에 마우스를 올려 보세요. VS Code와 똑같이 동작합니다.',
      },
      {
        kind: 'playground',
        id: 'inference-1',
        code: `let count = 0;            // number 로 추론
const title = 'TS 입문';   // 'TS 입문' (const는 값 자체가 타입)
const tags = ['rn', 'web']; // string[]

count = count + 1;   // OK
count = '하나';       // ← 오류: string은 number에 넣을 수 없음

tags.push('redux');  // OK
tags.push(3);        // ← 오류

// 추론된 타입 덕분에 메서드 자동완성도 정확해집니다.
title.toUpperCase();
title.toFixed(2);    // ← 오류: string에는 toFixed가 없음`,
        caption: '오류 3개가 보이면 정상입니다. 직접 고쳐 보면서 감을 잡아 보세요.',
      },
      { kind: 'h', text: '타입을 직접 써야 하는 곳' },
      {
        kind: 'list',
        items: [
          '**함수 매개변수** — 추론할 근거가 없어서 반드시 적어야 합니다. (안 적으면 `strict` 모드에서 오류)',
          '**함수 반환 타입** — 추론되지만, 공개 함수는 적어 두면 실수를 빨리 잡습니다.',
          '**빈 값으로 시작하는 변수** — `[]`, `null`처럼 초기값만으로는 정보가 부족할 때.',
        ],
      },
      {
        kind: 'code',
        lang: 'ts',
        title: '기본 타입 한눈에',
        code: `const name: string = '김코딩';
const age: number = 29;          // 정수/실수 구분 없음
const isAdmin: boolean = false;
const scores: number[] = [90, 85]; // Array<number> 와 같음
const point: [number, number] = [37.5, 127.0]; // 튜플: 길이와 순서가 고정

let selectedId: string | null = null; // 유니온: "문자열 또는 null"`,
      },
      { kind: 'h', text: 'any는 스위치를 끄는 것, unknown은 잠가 두는 것' },
      {
        kind: 'p',
        text: '`any`는 "이 값은 검사하지 마"라는 뜻입니다. 한번 any가 되면 그 값에서 파생된 모든 것이 any로 번져 TS를 쓰는 의미가 사라집니다. 타입을 정말 모르겠다면 `unknown`을 쓰세요. unknown은 **확인하기 전에는 아무것도 못 하게** 막아 줍니다.',
      },
      {
        kind: 'playground',
        id: 'inference-2',
        code: `const a: any = JSON.parse('{"count": 3}');
a.cout.toFixed(); // 오타인데도 오류 없음 → 런타임에 크래시

const u: unknown = JSON.parse('{"count": 3}');
u.count; // ← 오류: 확인 전에는 접근 불가

if (typeof u === 'object' && u !== null && 'count' in u) {
  u.count; // 확인했으니 OK
}`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '오류 메시지는 영어로 나옵니다',
        text: '실제 프로젝트에서도 마찬가지입니다. 대부분 `Type \'A\' is not assignable to type \'B\'`(A를 B 자리에 넣을 수 없다) 형태이니, 이 문장 하나만 익숙해지면 절반은 읽을 수 있습니다.',
      },
    ],
    exercise: {
      id: 'ex-inference',
      title: '첫 타입 붙이기',
      prompt: 'JS로 작성된 함수 두 개입니다. 매개변수와 반환 타입을 붙여 타입 오류를 모두 없애 보세요. 함수 본문은 고치지 않아도 됩니다.',
      starter: `function formatPrice(price, currency) {
  return currency + price.toLocaleString();
}

function average(scores) {
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
}`,
      tests: `const label: string = formatPrice(12000, '₩');
const avg: number = average([90, 80, 100]);

// @ts-expect-error 숫자 자리에 문자열을 넣으면 오류가 나야 합니다
formatPrice('12000', '₩');
// @ts-expect-error 숫자 배열이 아니면 오류가 나야 합니다
average(['a', 'b']);`,
      solution: `function formatPrice(price: number, currency: string): string {
  return currency + price.toLocaleString();
}

function average(scores: number[]): number {
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
}`,
      hints: [
        '매개변수 이름 뒤에 `: 타입`을 붙입니다. 예) `price: number`',
        '숫자 배열은 `number[]` 입니다.',
        '반환 타입은 매개변수 괄호 뒤에 적습니다. 예) `function f(a: number): string { ... }`',
      ],
    },
    quiz: [
      {
        id: 'q-inference-1',
        question: '다음 중 타입을 **직접 적지 않아도** 되는 경우는?',
        options: [
          '함수의 매개변수',
          '초기값이 있는 변수 `const total = price * qty`',
          '빈 배열로 시작하는 `const items = []`',
          'JSON.parse의 결과를 담는 변수',
        ],
        answer: 1,
        explanation: '초기값에서 타입을 추론할 수 있으면 적지 않아도 됩니다. 매개변수, 빈 배열, any를 돌려주는 JSON.parse 결과는 정보가 부족해서 직접 알려 줘야 합니다.',
      },
      {
        id: 'q-inference-2',
        question: '`any`와 `unknown`의 차이로 옳은 것은?',
        options: [
          '둘은 이름만 다르고 동작은 같다',
          'unknown은 아무 값이나 넣을 수 없다',
          'unknown은 타입을 확인(좁히기)하기 전에는 속성 접근이나 호출을 막는다',
          'any가 unknown보다 안전하다',
        ],
        answer: 2,
        explanation: '둘 다 아무 값이나 담을 수 있지만, any는 검사를 꺼 버리고 unknown은 확인을 강제합니다. 모르는 값은 unknown으로 받는 습관이 좋습니다.',
      },
    ],
  },

  {
    id: 'objects',
    chapter: 'basics',
    title: '객체의 모양: type과 interface',
    summary: 'API 응답, props, state — 앱에서 다루는 건 대부분 객체입니다. 객체의 모양을 타입으로 적는 법을 익힙니다.',
    minutes: 10,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '이미 하고 있던 일',
        text: '`PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })` 를 적어 본 적 있다면 이미 객체 타입을 써 본 겁니다. 차이는 PropTypes가 **실행 중에 콘솔 경고**를 띄우는 반면, TS는 **작성 중에 빨간 줄**을 긋는다는 것뿐입니다.',
      },
      {
        kind: 'code',
        lang: 'ts',
        title: '객체 타입을 선언하는 두 가지 방법',
        code: `// 방법 1: type 별칭
type User = {
  id: number;
  name: string;
};

// 방법 2: interface
interface Product {
  id: number;
  title: string;
}

const me: User = { id: 1, name: '김코딩' };`,
      },
      {
        kind: 'p',
        text: '객체 모양을 적을 때 둘은 거의 똑같이 동작합니다. 실무에서 통하는 간단한 규칙: **객체 모양은 `interface`나 `type` 아무거나 팀에서 하나로 통일**하고, 유니온(`A | B`)처럼 interface로 표현할 수 없는 건 `type`을 씁니다. 이 사이트의 코드는 객체는 `interface`, 그 외는 `type`으로 적었습니다.',
      },
      { kind: 'h', text: '없을 수도 있는 속성: ?' },
      {
        kind: 'playground',
        id: 'objects-1',
        code: `interface User {
  id: number;
  name: string;
  nickname?: string;        // 있을 수도, 없을 수도 (string | undefined)
  readonly createdAt: Date; // 읽기 전용
}

const user: User = { id: 1, name: '김코딩', createdAt: new Date() };

user.nickname.toUpperCase();   // ← 오류: undefined일 수 있음
user.nickname?.toUpperCase();  // OK: 옵셔널 체이닝
(user.nickname ?? user.name).toUpperCase(); // OK: 기본값

user.createdAt = new Date();   // ← 오류: readonly
user.emial;                    // ← 오류: 오타까지 잡아 줌`,
        caption: '옵셔널 체이닝(`?.`)과 `??`는 JS에서 쓰던 그대로입니다. TS는 "여기서 써야 한다"는 걸 알려 줄 뿐입니다.',
      },
      { kind: 'h', text: '중첩과 배열' },
      {
        kind: 'code',
        lang: 'ts',
        code: `interface Address {
  city: string;
  zip: string;
}

interface Order {
  id: string;
  items: { productId: number; qty: number }[]; // 객체의 배열
  shipTo: Address;                             // 다른 타입 재사용
  memo?: string;
}

// 키가 정해지지 않은 "사전" 형태는 Record를 씁니다.
const stockById: Record<string, number> = { p1: 3, p2: 0 };`,
      },
      { kind: 'h', text: '확장하기' },
      {
        kind: 'compare',
        jsLabel: 'interface',
        tsLabel: 'type',
        js: `interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}`,
        ts: `type Animal = {
  name: string;
};

type Dog = Animal & {
  bark(): void;
};`,
        caption: '`extends`와 `&`(인터섹션)는 결과가 같습니다. 문법만 다릅니다.',
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'TS는 "모양"만 봅니다',
        text: '클래스 이름이나 선언한 타입 이름이 아니라 **속성이 맞는지**만 확인합니다(구조적 타이핑). 그래서 서버에서 받은 평범한 객체도 모양만 맞으면 `User` 자리에 그대로 넣을 수 있습니다.',
      },
    ],
    exercise: {
      id: 'ex-objects',
      title: 'User 타입 설계하기',
      prompt: '빈 객체로 되어 있는 `User` 타입을 채워 보세요. `id`는 숫자, `name`은 문자열, `nickname`은 **없을 수도 있는** 문자열, `tags`는 문자열 배열입니다.',
      starter: `// TODO: User 타입을 완성하세요.
type User = {};

function getDisplayName(user: User): string {
  return user.nickname ?? user.name;
}`,
      tests: `const a: User = { id: 1, name: '김코딩', tags: ['rn'] };
const b: User = { id: 2, name: '박리덕', nickname: 'redux-park', tags: [] };
const names: string[] = [getDisplayName(a), getDisplayName(b)];

// @ts-expect-error id는 숫자여야 합니다
const c: User = { id: '3', name: '이타입', tags: [] };
// @ts-expect-error tags는 필수입니다
const d: User = { id: 4, name: '최필수' };`,
      solution: `type User = {
  id: number;
  name: string;
  nickname?: string;
  tags: string[];
};

function getDisplayName(user: User): string {
  return user.nickname ?? user.name;
}`,
      hints: [
        '속성은 `이름: 타입;` 형태로 한 줄씩 적습니다.',
        '없을 수도 있는 속성은 이름 뒤에 `?`를 붙입니다. 예) `nickname?: string;`',
        '문자열 배열은 `string[]` 입니다.',
      ],
    },
    quiz: [
      {
        id: 'q-objects-1',
        question: '`nickname?: string` 으로 선언된 속성의 실제 타입은?',
        options: ['string', 'string | null', 'string | undefined', 'any'],
        answer: 2,
        explanation: '`?`는 "속성이 없을 수 있다"는 뜻이고, 없는 속성을 읽으면 undefined이므로 `string | undefined`가 됩니다. null은 포함되지 않습니다.',
      },
      {
        id: 'q-objects-2',
        question: '다음 중 `interface`로는 표현할 수 **없고** `type`을 써야 하는 것은?',
        options: [
          '객체의 모양',
          '다른 타입을 확장한 객체',
          "`'sm' | 'md' | 'lg'` 같은 유니온",
          '메서드를 가진 객체',
        ],
        answer: 2,
        explanation: 'interface는 객체 모양 전용입니다. 유니온, 튜플, 원시 타입의 별칭은 type으로만 만들 수 있습니다.',
      },
    ],
  },

  {
    id: 'unions',
    chapter: 'basics',
    title: '유니온과 좁히기: TS의 핵심 기술',
    summary: '"A 또는 B"를 표현하고, 조건문으로 범위를 좁혀 가는 방식. React와 Redux 타이핑의 80%가 여기서 나옵니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '이미 쓰던 패턴',
        text: '`status === \'loading\'`이면 스피너, `\'error\'`면 에러 화면. 이렇게 **문자열 상수로 상태를 구분**하는 코드를 수없이 짜 봤을 겁니다. 유니온 타입은 그 "가능한 값의 목록"을 타입으로 적어 두는 것입니다.',
      },
      { kind: 'h', text: '리터럴 유니온: 오타 없는 문자열 상수' },
      {
        kind: 'playground',
        id: 'unions-1',
        code: `type Status = 'idle' | 'loading' | 'success' | 'error';

let status: Status = 'idle';
status = 'loading';   // OK
status = 'loadding';  // ← 오류: 오타를 잡아 줍니다

function label(s: Status): string {
  if (s === 'sucess') return '완료'; // ← 오류: 겹치는 값이 없는 비교
  return s;
}`,
        caption: '따옴표 안에서 Ctrl+Space를 눌러 보세요. 가능한 값이 자동완성됩니다.',
      },
      { kind: 'h', text: '좁히기(narrowing)' },
      {
        kind: 'p',
        text: '유니온 타입의 값은 "둘 중 뭔지 모르는" 상태입니다. `if`, `typeof`, `===` 같은 **평범한 JS 조건문**을 쓰면 TS가 그 블록 안에서 타입을 자동으로 좁혀 줍니다. 새로운 문법이 아니라, 원래 써야 했던 방어 코드를 TS가 이해하는 겁니다.',
      },
      {
        kind: 'playground',
        id: 'unions-2',
        code: `function printId(id: number | string) {
  id.toUpperCase(); // ← 오류: number일 수도 있음

  if (typeof id === 'string') {
    id.toUpperCase(); // 이 안에서는 string
  } else {
    id.toFixed(0);    // 이 안에서는 number
  }
}

// null/undefined 도 같은 방식으로 좁힙니다.
const users = [{ id: 1, name: '김코딩' }];
const found = users.find((u) => u.id === 2); // { id, name } | undefined

found.name;            // ← 오류: 못 찾았을 수도 있음
if (found) found.name; // OK
found?.name;           // OK`,
      },
      { kind: 'h', text: '판별 유니온: 객체를 구분하는 꼬리표' },
      {
        kind: 'p',
        text: '객체 여러 종류를 유니온으로 묶을 때는 **공통 속성 하나에 리터럴 값**을 넣어 구분합니다. 이 꼬리표(보통 `type`, `kind`, `status`)를 검사하면 나머지 속성까지 한꺼번에 좁혀집니다. Redux의 `action.type`이 정확히 이 패턴입니다.',
      },
      {
        kind: 'playground',
        id: 'unions-3',
        code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  shape.radius; // ← 오류: rect일 수도 있음

  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2; // radius 사용 가능
    case 'rect':
      return shape.width * shape.height;  // width/height 사용 가능
  }
}`,
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: 'as로 우기지 않기',
        text: '`value as string`(타입 단언)은 TS에게 "내가 책임질 테니 믿어"라고 하는 것입니다. 검사가 아니라 **우기는 것**이라 틀려도 오류가 나지 않습니다. 좁히기로 해결할 수 있다면 항상 좁히기를 쓰세요.',
      },
    ],
    exercise: {
      id: 'ex-unions',
      title: '유니온으로 범위 정하기',
      prompt: '(1) `Size`를 `sm`, `md`, `lg` 세 가지만 허용하는 타입으로 바꾸고, (2) `normalizeId`가 숫자와 문자열을 모두 받아 문자열을 돌려주도록 타입과 본문을 고쳐 보세요. 숫자는 `String(id)`로, 문자열은 대문자로 바꿔 돌려줍니다.',
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
const id1: string = normalizeId(42);
const id2: string = normalizeId('abc');

// @ts-expect-error 정해지지 않은 사이즈입니다
toPixels('xl');
// @ts-expect-error boolean은 받을 수 없습니다
normalizeId(true);`,
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
        '`typeof id === \'number\'` 로 좁힌 뒤 각각 다르게 처리하세요. number에는 toUpperCase가 없습니다.',
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
        explanation: '이름은 무엇이든 상관없습니다. 모든 멤버가 같은 이름의 속성을 갖고, 그 값이 `\'circle\'` / `\'rect\'`처럼 겹치지 않는 리터럴이면 TS가 구분에 사용합니다.',
      },
    ],
  },

  {
    id: 'generics',
    chapter: 'basics',
    title: '함수와 제네릭: 타입을 인자로 받기',
    summary: '`useState<number>`, `Promise<User>`의 꺾쇠가 무엇인지, 직접 만들 땐 어떻게 하는지 알아봅니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '이미 쓰고 있던 것',
        text: '`array.map()`은 숫자 배열이든 객체 배열이든 동작하죠. "어떤 타입이 들어오든 그 타입에 맞춰 동작하는 함수" — 이걸 타입으로 표현한 것이 제네릭입니다. 직접 만드는 일보다 **남이 만든 제네릭을 쓰는 일**이 훨씬 많으니 읽는 법부터 익히면 됩니다.',
      },
      { kind: 'h', text: '함수 타입 적기' },
      {
        kind: 'code',
        lang: 'ts',
        code: `// 선택 매개변수(?)와 기본값
function greet(name: string, greeting = '안녕하세요', suffix?: string): string {
  return greeting + ', ' + name + (suffix ?? '');
}

// 화살표 함수
const add = (a: number, b: number): number => a + b;

// "함수를 받는" 매개변수: 콜백의 모양을 적습니다.
function fetchWithRetry(run: () => Promise<void>, onFail: (error: Error, attempt: number) => void) {
  // ...
}

// 반환값이 없으면 void
function logEvent(name: string): void {
  console.log(name);
}`,
      },
      { kind: 'h', text: '제네릭이 필요한 순간' },
      {
        kind: 'playground',
        id: 'generics-1',
        code: `// 타입을 고정하면 재사용할 수 없고...
function firstNumber(items: number[]): number | undefined {
  return items[0];
}

// any를 쓰면 타입 정보가 사라집니다.
function firstAny(items: any[]): any {
  return items[0];
}
firstAny(['a', 'b']).toFixed(); // 오류가 안 남 → 런타임 크래시

// 제네릭: "들어온 타입 T를 그대로 내보낸다"
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const s = first(['a', 'b']); // T는 string으로 추론 → string | undefined
const n = first([1, 2, 3]);  // T는 number로 추론 → number | undefined
s?.toFixed();                // ← 오류: string에는 toFixed가 없음`,
        caption: '`<T>`는 "타입용 매개변수"입니다. 호출할 때 인자를 보고 자동으로 채워집니다.',
      },
      { kind: 'h', text: '꺾쇠를 직접 채워야 할 때' },
      {
        kind: 'code',
        lang: 'ts',
        code: `// 인자만으로는 추론할 수 없을 때 직접 알려 줍니다.
const [user, setUser] = useState<User | null>(null);
const cache = new Map<string, User>();
const res: Promise<User[]> = api.get('/users');

// 읽는 법: "User를 담는 Promise", "string 키와 User 값을 가진 Map"`,
      },
      { kind: 'h', text: '제약 걸기: extends와 keyof' },
      {
        kind: 'playground',
        id: 'generics-2',
        code: `// T는 아무거나가 아니라 "id를 가진 객체"여야 한다
function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

const users = [{ id: 1, name: '김코딩' }];
findById(users, 1)?.name; // 반환 타입에 name이 살아 있음
findById(['a', 'b'], 1);  // ← 오류: string에는 id가 없음

// keyof: 객체의 "키 이름들"을 유니온으로
type User = { id: number; name: string };
type UserKey = keyof User; // 'id' | 'name'

function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
getField(users[0], 'name');  // string
getField(users[0], 'email'); // ← 오류: 없는 키`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '제네릭은 필요해질 때 만드세요',
        text: '처음부터 제네릭으로 짜려고 하지 마세요. 구체적인 타입으로 먼저 작성하고, **같은 함수를 다른 타입으로 복붙하게 되는 순간** 제네릭으로 바꾸면 됩니다.',
      },
    ],
    exercise: {
      id: 'ex-generics',
      title: '제네릭 유틸 두 개',
      prompt: '(1) `last`는 어떤 배열이든 받아 마지막 요소(없으면 undefined)를 돌려줍니다. (2) `pluck`은 객체 배열과 키 이름을 받아 그 키의 값들만 모은 배열을 돌려줍니다. 두 함수에 제네릭 타입을 붙여 보세요.',
      starter: `function last(items) {
  return items[items.length - 1];
}

function pluck(items, key) {
  return items.map((item) => item[key]);
}`,
      tests: `const n: number | undefined = last([1, 2, 3]);
const s: string | undefined = last(['a', 'b']);

const members = [{ id: 1, name: 'kim' }, { id: 2, name: 'lee' }];
const ids: number[] = pluck(members, 'id');
const names: string[] = pluck(members, 'name');

// @ts-expect-error 없는 키입니다
pluck(members, 'email');
// @ts-expect-error 숫자 배열의 마지막 요소는 문자열 변수에 담을 수 없습니다
const wrong: string | undefined = last([1, 2, 3]);`,
      solution: `function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}`,
      hints: [
        '함수 이름 뒤에 `<T>`를 선언하고, 매개변수를 `items: T[]`로 적어 보세요.',
        '`pluck`은 타입 매개변수가 두 개 필요합니다: 요소 타입 `T`와 키 타입 `K extends keyof T`.',
        '"T의 K 속성 타입"은 `T[K]`로 씁니다. 그 배열은 `T[K][]` 입니다.',
      ],
    },
    quiz: [
      {
        id: 'q-generics-1',
        question: '`function wrap<T>(value: T): { value: T }` 를 `wrap(42)`로 호출했을 때 반환 타입은?',
        options: ['{ value: any }', '{ value: T }', '{ value: number }', '{ value: unknown }'],
        answer: 2,
        explanation: '인자 42에서 T가 number로 추론되고, 반환 타입의 T 자리에도 number가 채워집니다.',
      },
      {
        id: 'q-generics-2',
        question: '`type Keys = keyof { id: number; title: string }` 의 결과는?',
        options: ["'id' | 'title'", 'number | string', 'string[]', "['id', 'title']"],
        answer: 0,
        explanation: 'keyof는 객체 타입의 **키 이름**을 리터럴 유니온으로 만듭니다. 값의 타입(number | string)이 아닙니다.',
      },
    ],
  },

  {
    id: 'utility',
    chapter: 'basics',
    title: '타입 재활용: 유틸리티 타입과 as const',
    summary: '타입을 복붙하지 않고 기존 타입에서 새 타입을 만들어 냅니다. 타입 하나를 고치면 나머지가 따라옵니다.',
    minutes: 10,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '익숙한 상황',
        text: '"수정 API는 생성 API와 필드가 같은데 전부 선택 사항", "목록 화면에는 상세 데이터 중 일부만 필요". 이럴 때 타입을 새로 적지 않고 **기존 타입을 변형**해서 씁니다. 객체 스프레드로 `{ ...user, name }` 하던 것의 타입 버전이라고 생각하면 됩니다.',
      },
      {
        kind: 'playground',
        id: 'utility-1',
        code: `interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
}

// 전부 선택 속성으로
type ProductPatch = Partial<Product>;

// 일부만 고르기 / 일부만 빼기
type ProductCard = Pick<Product, 'id' | 'title' | 'price'>;
type NewProduct = Omit<Product, 'id'>;

// 키-값 사전
type PriceTable = Record<string, number>;

const patch: ProductPatch = { price: 9900 };          // OK
const card: ProductCard = { id: 1, title: '키보드' }; // ← 오류: price 누락
const draft: NewProduct = { id: 1, title: 'x', price: 1, description: '' }; // ← 오류: id는 없어야 함`,
        caption: '타입 이름 위에 마우스를 올리면 변형된 결과를 볼 수 있습니다.',
      },
      { kind: 'h', text: 'typeof: 값에서 타입 뽑아내기' },
      {
        kind: 'p',
        text: '이미 값이 있다면 타입을 따로 적지 말고 `typeof`로 뽑아내세요. 값이 바뀌면 타입도 자동으로 따라옵니다. Redux의 `RootState`를 만들 때 쓰는 바로 그 기법입니다.',
      },
      {
        kind: 'code',
        lang: 'ts',
        code: `const defaultSettings = {
  theme: 'light',
  fontSize: 14,
  pushEnabled: true,
};

type Settings = typeof defaultSettings;
// { theme: string; fontSize: number; pushEnabled: boolean }

function loadSettings() {
  return { ...defaultSettings };
}
type Loaded = ReturnType<typeof loadSettings>; // 함수의 반환 타입 뽑기`,
      },
      { kind: 'h', text: 'as const: 상수를 "진짜 상수"로' },
      {
        kind: 'playground',
        id: 'utility-2',
        code: `// 그냥 쓰면 string[] 으로 넓게 추론됩니다.
const loose = ['all', 'active', 'done'];

// as const 를 붙이면 값 그대로 고정됩니다.
const TABS = ['all', 'active', 'done'] as const;

// 배열의 요소들을 유니온 타입으로 뽑기
type Tab = (typeof TABS)[number]; // 'all' | 'active' | 'done'

const current: Tab = 'done';
const wrong: Tab = 'archived'; // ← 오류

// 객체에도 쓸 수 있습니다. (액션 타입 상수, 라우트 이름 등)
const ROUTES = { home: '/', detail: '/products/:id' } as const;
type RouteName = keyof typeof ROUTES; // 'home' | 'detail'`,
        caption: '값(TABS)을 한 곳에만 적고 타입(Tab)은 거기서 파생시키는 패턴입니다. 탭이 추가되면 타입도 자동으로 늘어납니다.',
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '이 정도만 알면 충분합니다',
        text: '`Partial`, `Pick`, `Omit`, `Record`, `ReturnType` + `typeof`, `keyof`, `as const`. 실무 코드의 대부분은 이 조합으로 해결됩니다. 조건부 타입이나 `infer` 같은 고급 기능은 라이브러리를 만들 때나 필요합니다.',
      },
    ],
    exercise: {
      id: 'ex-utility',
      title: 'Todo 타입에서 파생시키기',
      prompt: '`Todo` 하나에서 필요한 타입을 모두 만들어 보세요. (1) `TodoInput`: 생성 폼 입력값 — `id`와 `createdAt` 제외. (2) `TodoPatch`: 수정값 — `id`를 제외한 나머지가 모두 선택 사항. (3) `TABS`를 고정된 상수로 만들고 `Tab`을 거기서 뽑아내세요.',
      starter: `interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

// TODO 1
type TodoInput = Todo;

// TODO 2
type TodoPatch = Todo;

function updateTodo(todo: Todo, patch: TodoPatch): Todo {
  return { ...todo, ...patch };
}

// TODO 3
const TABS = ['all', 'active', 'done'];
type Tab = string;`,
      tests: `const input: TodoInput = { title: 'TS 공부', done: false };
const todo: Todo = { id: 1, createdAt: new Date(), ...input };
updateTodo(todo, { done: true });
updateTodo(todo, {});
const tab: Tab = TABS[1];

// @ts-expect-error 입력값에는 id를 넣을 수 없습니다
const bad1: TodoInput = { id: 1, title: 'x', done: false };
// @ts-expect-error id는 수정할 수 없습니다
updateTodo(todo, { id: 2 });
// @ts-expect-error 없는 탭입니다
const bad2: Tab = 'archived';`,
      solution: `interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

type TodoInput = Omit<Todo, 'id' | 'createdAt'>;

type TodoPatch = Partial<Omit<Todo, 'id'>>;

function updateTodo(todo: Todo, patch: TodoPatch): Todo {
  return { ...todo, ...patch };
}

const TABS = ['all', 'active', 'done'] as const;
type Tab = (typeof TABS)[number];`,
      hints: [
        '`Omit<Todo, \'id\' | \'createdAt\'>` 처럼 뺄 키를 유니온으로 나열합니다.',
        '유틸리티 타입은 겹쳐 쓸 수 있습니다: `Partial<Omit<Todo, \'id\'>>`',
        '배열 뒤에 `as const`를 붙이고, `(typeof TABS)[number]` 로 요소 타입을 뽑으세요.',
      ],
    },
    quiz: [
      {
        id: 'q-utility-1',
        question: '`Pick<User, \'id\' | \'name\'>` 과 같은 결과를 내는 것은? (User는 id, name, email 세 속성을 가짐)',
        options: ["Omit<User, 'email'>", "Partial<User>", "Record<'id' | 'name', User>", "keyof User"],
        answer: 0,
        explanation: 'Pick은 고른 것만 남기고, Omit은 고른 것만 뺍니다. 세 속성 중 email을 빼면 id와 name이 남으니 결과가 같습니다.',
      },
      {
        id: 'q-utility-2',
        question: '`const COLORS = [\'red\', \'blue\'] as const` 에서 `as const`를 빼면 `(typeof COLORS)[number]`는 무엇이 될까요?',
        options: ["'red' | 'blue'", 'string', "readonly ['red', 'blue']", 'never'],
        answer: 1,
        explanation: 'as const가 없으면 배열이 `string[]`으로 넓게 추론되므로 요소 타입은 그냥 string입니다. 리터럴 유니온을 얻으려면 as const가 필요합니다.',
      },
    ],
  },
];
