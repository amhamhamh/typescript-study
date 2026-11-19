import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'generics',
  chapter: 'basics',
  title: '함수와 제네릭: 타입을 인자로 받기',
  summary: 'useState<number>, Promise<User>의 꺾쇠를 읽는 법부터 직접 만드는 법까지 다룹니다.',
  minutes: 15,
  steps: [
    {
      id: 'generics-1',
      title: '선택 매개변수와 기본값',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '이미 쓰고 있던 것',
          text: '`array.map(callback)`은 숫자 배열이든 객체 배열이든 동작하고, 콜백이 돌려주는 값에 따라 결과 배열의 타입이 달라집니다. 이 레슨은 그 둘을 타입으로 적는 법, 곧 **함수의 모양**과 **제네릭**을 다룹니다. 제네릭은 직접 만드는 일보다 **남이 만든 것을 읽는 일**이 훨씬 많습니다.',
        },
        {
          kind: 'p',
          text: 'JS에서는 인자를 덜 넘겨도 조용히 `undefined`가 됩니다. TS에서는 적어 둔 매개변수가 **전부 필수**이고, 생략을 허용하려면 표시해야 합니다.',
        },
        {
          kind: 'list',
          items: [
            '`qty = 1` → 기본값. 생략할 수 있고 타입은 `number`로 추론됩니다.',
            '`coupon?: string` → 선택 매개변수. 함수 안에서는 `string | undefined`입니다.',
          ],
        },
        {
          kind: 'p',
          text: '2행의 빨간 줄은 "`coupon`이 `undefined`일 수 있다"는 뜻입니다. 7행처럼 쿠폰 없이 부르면 실제로 그렇게 되고, 콘솔을 보면 바로 그 2행에서 크래시가 났습니다. `priceLabel()`처럼 필수인 `price`까지 빼면 그 호출에도 빨간 줄이 생깁니다.',
        },
      ],
      code: `function priceLabel(price: number, qty = 1, coupon?: string): string {
  const label = coupon.toUpperCase();
  return price * qty + '원 / 쿠폰: ' + label;
}

console.log(priceLabel(12000, 2, 'welcome'));
console.log(priceLabel(12000));
`,
      mission: {
        text: '쿠폰 없이 불러도 멈추지 않게 2행을 고치세요. 쿠폰이 없으면 `없음`으로 표시해서 7행이 `12000원 / 쿠폰: 없음`을 출력하면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['24000원 / 쿠폰: WELCOME', '12000원 / 쿠폰: 없음'] },
        hint: '`coupon`이 없을 때 쓸 값을 정해 줍니다. `const label = coupon?.toUpperCase() ?? \'없음\';`',
        answer: `function priceLabel(price: number, qty = 1, coupon?: string): string {
  const label = coupon?.toUpperCase() ?? '없음';
  return price * qty + '원 / 쿠폰: ' + label;
}

console.log(priceLabel(12000, 2, 'welcome'));
console.log(priceLabel(12000));
`,
      },
    },
    {
      id: 'generics-2',
      title: '콜백의 모양 적기와 void',
      runner: 'console',
      errors: 2,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '함수를 인자로 받을 때는 5행처럼 `(매개변수) => 반환 타입` 모양으로 적습니다. 자주 쓰는 모양은 1행처럼 `type`으로 이름을 붙입니다. `onPress`, `onChange` 같은 props 타입이 전부 이 표기입니다.',
        },
        {
          kind: 'list',
          items: [
            '`(price: number) => number` → 숫자를 받아 숫자를 돌려주는 함수',
            '`(total: number) => void` → 돌려주는 값을 쓰지 않는 함수',
            '13행, 16행처럼 **타입이 정해진 자리에 넣는 콜백**은 매개변수 타입을 생략해도 됩니다. 그 자리의 타입에서 추론됩니다.',
          ],
        },
        {
          kind: 'p',
          text: '16행의 콜백은 숫자 대신 문자열을 돌려줍니다. 콘솔의 `01000원2000원`이 그 결과입니다. 17행은 `onDone`을 빼먹었고, 9행에서 `onDone is not a function`으로 멈췄습니다. 둘 다 빨간 줄이 먼저 알려 준 버그입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'void 자리에는 값을 돌려주는 함수도 들어갑니다',
          text: '콜백 타입의 `void`는 "아무것도 돌려주면 안 된다"가 아니라 "돌려줘도 **쓰지 않겠다**"는 뜻입니다. 그래서 `ids.forEach((id) => list.push(id))`처럼 숫자를 돌려주는 콜백도 통과합니다.',
        },
      ],
      code: `type OnDone = (total: number) => void;

function checkout(
  prices: number[],
  discount: (price: number) => number,
  onDone: OnDone,
): void {
  const total = prices.map(discount).reduce((sum, p) => sum + p, 0);
  onDone(total);
}

const half = (price: number) => price / 2;
const show: OnDone = (total) => console.log('결제 금액:', total);

checkout([1000, 2000], half, show);
checkout([1000, 2000], (price) => price + '원', show);
checkout([1000, 2000], half);
`,
      mission: {
        text: '16행의 할인 콜백이 숫자를 돌려주도록 `price - 100`으로 고치고, 17행에는 세 번째 인자로 `show`를 넘기세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['결제 금액: 2800'] },
        hint: '16행은 `(price) => price - 100`, 17행은 `checkout([1000, 2000], half, show)`',
        answer: `type OnDone = (total: number) => void;

function checkout(
  prices: number[],
  discount: (price: number) => number,
  onDone: OnDone,
): void {
  const total = prices.map(discount).reduce((sum, p) => sum + p, 0);
  onDone(total);
}

const half = (price: number) => price / 2;
const show: OnDone = (total) => console.log('결제 금액:', total);

checkout([1000, 2000], half, show);
checkout([1000, 2000], (price) => price - 100, show);
checkout([1000, 2000], half, show);
`,
      },
    },
    {
      id: 'generics-3',
      title: '제네릭이 필요한 순간',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '"배열의 첫 요소를 꺼낸다"는 함수를 세 가지 방법으로 적었습니다.',
        },
        {
          kind: 'list',
          items: [
            '`firstNumber`: 타입을 고정했습니다. 문자열 배열에 쓰려면 14행처럼 오류가 나고, 결국 `firstString`을 복붙하게 됩니다.',
            '`firstAny`: 아무 배열이나 받지만 결과도 `any`입니다. 20행은 문자열에 `toFixed`를 불렀는데 빨간 줄이 없고, 콘솔에서 크래시가 났습니다.',
            '`first<T>`: 들어온 배열의 요소 타입을 `T`라고 부르고, **같은 T를 내보낸다**고 적었습니다.',
          ],
        },
        {
          kind: 'p',
          text: '`<T>`는 **타입을 받는 매개변수**입니다. 값 매개변수처럼 호출할 때 채워지는데, 대부분 인자를 보고 자동으로 채워집니다. 17행의 `member`, 18행의 `price`에 마우스를 올려 보세요. 같은 함수인데 `string | undefined`, `number | undefined`로 다르게 나옵니다.',
        },
      ],
      code: `// 1) 타입을 고정하면 다른 배열에는 못 씁니다
function firstNumber(items: number[]): number | undefined {
  return items[0];
}
// 2) any로 풀면 결과의 타입 정보가 사라집니다
function firstAny(items: any[]): any {
  return items[0];
}
// 3) 제네릭: 들어온 타입 T를 그대로 내보냅니다
function first<T>(items: T[]): T | undefined {
  return items[0];
}

console.log(firstNumber(['kim', 'lee']));

const os = firstAny(['ios', 'android']);
const member = first(['kim', 'lee']);
const price = first([1200, 3400]);
console.log(member?.toUpperCase(), price?.toFixed(1));
console.log(os.toFixed(1));
`,
      mission: {
        text: '14행과 16행에서 배열은 그대로 두고 함수만 `first`로 바꾸세요. 14행의 오류가 사라지고, 16행을 바꾸는 순간 20행에 빨간 줄이 생깁니다. 그 줄을 문자열 메서드로 고쳐 콘솔에 `IOS`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['kim', 'IOS'] },
        hint: '`first([\'ios\', \'android\'])`의 결과는 `string | undefined`입니다. 20행은 `os?.toUpperCase()`',
        answer: `// 1) 타입을 고정하면 다른 배열에는 못 씁니다
function firstNumber(items: number[]): number | undefined {
  return items[0];
}
// 2) any로 풀면 결과의 타입 정보가 사라집니다
function firstAny(items: any[]): any {
  return items[0];
}
// 3) 제네릭: 들어온 타입 T를 그대로 내보냅니다
function first<T>(items: T[]): T | undefined {
  return items[0];
}

console.log(first(['kim', 'lee']));

const os = first(['ios', 'android']);
const member = first(['kim', 'lee']);
const price = first([1200, 3400]);
console.log(member?.toUpperCase(), price?.toFixed(1));
console.log(os?.toUpperCase());
`,
      },
    },
    {
      id: 'generics-4',
      title: '꺾쇠 읽기, 그리고 직접 채워야 할 때',
      runner: 'console',
      throws: true,
      body: [
        {
          kind: 'p',
          text: '남이 만든 제네릭은 꺾쇠 안을 "무엇을 담는가"로 읽으면 됩니다.',
        },
        {
          kind: 'list',
          items: [
            '`Map<string, User>` → 키가 string, 값이 User인 Map',
            '`Promise<User[]>` → 끝나면 User 배열을 주는 Promise',
            '`useState<User | null>(null)` → User 또는 null을 담는 state',
            '`Array<string>` → `string[]`과 같은 타입',
          ],
        },
        {
          kind: 'p',
          text: '`T`는 인자에서 추론되지만, **인자가 없거나 정보가 부족하면** 추론할 근거가 없습니다. 6행의 `cache`에 마우스를 올려 보세요. `Map<any, any>`입니다. 그래서 8행에 객체 대신 문자열을 넣어도, 12행에서 그 문자열의 `name`을 읽어도 빨간 줄이 없고, 콘솔에서만 크래시가 납니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '빈 값으로 시작하면 꺾쇠를 채웁니다',
          text: '`new Map()`, `new Set()`, `useState(null)`, `useState([])`처럼 **빈 값으로 시작하는 곳**이 직접 채워야 하는 자리입니다. `useState(null)`만 쓰면 state 타입이 `null`로 굳어서 나중에 유저 객체를 넣을 수 없습니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
}

const cache = new Map();
cache.set('u1', { id: 1, name: 'kim' });
cache.set('u2', 'park');

const found = cache.get('u2');
console.log(cache.size + '명 저장');
console.log(found.id, found.name.toUpperCase());
`,
      mission: {
        text: '6행을 `new Map<string, User>()`로 바꾸세요. 8행과 12행에 빨간 줄이 생깁니다. 8행에는 `{ id: 2, name: \'park\' }`를 넣고, 12행의 `found.`을 `found?.`으로 고쳐 콘솔에 `2 PARK`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['2 PARK'] },
        hint: '`cache.get()`은 키가 없을 수도 있어서 `User | undefined`를 돌려줍니다. 그래서 `found?.id`, `found?.name.toUpperCase()`처럼 확인이 필요합니다.',
        answer: `interface User {
  id: number;
  name: string;
}

const cache = new Map<string, User>();
cache.set('u1', { id: 1, name: 'kim' });
cache.set('u2', { id: 2, name: 'park' });

const found = cache.get('u2');
console.log(cache.size + '명 저장');
console.log(found?.id, found?.name.toUpperCase());
`,
      },
    },
    {
      id: 'generics-5',
      title: '제약 걸기: extends',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '`T`는 "아무 타입"입니다. 그래서 함수 안에서는 `T`에 대해 **아무것도 가정할 수 없습니다.** 2행의 `item.id`에 빨간 줄이 생긴 이유입니다. 숫자나 문자열이 들어올 수도 있으니까요.',
        },
        {
          kind: 'p',
          text: '실제로 11행은 문자열 배열을 넘겼고, 오류 없이 조용히 `undefined`가 찍혔습니다. `<T extends { id: number }>`라고 적으면 "T는 최소한 숫자 `id`를 가진 타입"으로 제한됩니다. 함수 안에서는 `item.id`를 쓸 수 있고, 밖에서는 `id` 없는 배열을 넘기면 오류가 납니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '제네릭 없이 적으면 잃는 것',
          code: `function findById(
  items: { id: number }[],
  id: number,
) { /* ... */ }

findById(users, 2)?.name;
// 오류: 반환 타입이 { id: number }라서
// name을 쓸 수 없습니다`,
        },
        {
          kind: 'p',
          text: '제네릭은 들어온 타입을 통째로 기억합니다. 9행, 10행에서 `name`, `title`이 살아 있는 이유입니다.',
        },
      ],
      code: `function findById<T>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

const users = [{ id: 1, name: '김코딩' }, { id: 2, name: '박리덕' }];
const posts = [{ id: 7, title: '제네릭 입문', likes: 3 }];
const tags = ['react', 'redux'];

console.log(findById(users, 2)?.name);
console.log(findById(posts, 7)?.title);
console.log(findById(tags, 1));
`,
      mission: {
        text: '1행의 `<T>`에 제약을 걸어 2행의 오류를 없애세요. 그러면 11행이 새로 잡힙니다. 11행을 `users`에서 1번을 찾아 이름을 출력하도록 바꿔 `김코딩`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['김코딩'] },
        hint: '1행은 `function findById<T extends { id: number }>(...)`, 11행은 `findById(users, 1)?.name`',
        answer: `function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

const users = [{ id: 1, name: '김코딩' }, { id: 2, name: '박리덕' }];
const posts = [{ id: 7, title: '제네릭 입문', likes: 3 }];
const tags = ['react', 'redux'];

console.log(findById(users, 2)?.name);
console.log(findById(posts, 7)?.title);
console.log(findById(users, 1)?.name);
`,
      },
    },
    {
      id: 'generics-6',
      title: 'keyof와 T[K]: 키 이름까지 검사하기',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`obj[key]`로 속성을 꺼내는 함수입니다. `key: string`이면 어떤 문자열이든 들어오니 TS는 10행에서 "그 키가 있는지 모르겠다"고 하고, 결과는 `any`가 됩니다. 그래서 14행의 오타 `raitng`이 통과했고 콘솔에서 크래시가 났습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'keyof: 키 이름들의 유니온',
          code: `type ProductKey = keyof Product;
// 'id' | 'title' | 'rating'`,
        },
        {
          kind: 'list',
          items: [
            '`key: keyof Product`만 적어도 오타는 잡힙니다. 하지만 반환 타입이 `string | number`로 뭉쳐져서 `toFixed`를 바로 쓸 수 없습니다.',
            '`K extends keyof T` → K는 T의 키 중 **하나**',
            '`T[K]` → T에서 K 속성의 타입. `\'rating\'`을 넘기면 `number`, `\'title\'`을 넘기면 `string`',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '제네릭은 필요해질 때 만드세요',
          text: '처음부터 제네릭으로 짜지 않아도 됩니다. 구체적인 타입으로 먼저 작성하고, **같은 함수를 타입만 바꿔 복붙하게 되는 순간** 제네릭으로 바꾸면 됩니다.',
        },
      ],
      code: `interface Product {
  id: string;
  title: string;
  rating: number;
}

const keyboard: Product = { id: 'p1', title: '기계식 키보드', rating: 4.48 };

function getField(obj: Product, key: string) {
  return obj[key];
}

console.log(getField(keyboard, 'title'));
console.log(getField(keyboard, 'raitng').toFixed(1));
`,
      mission: {
        text: '`getField`를 `<T, K extends keyof T>(obj: T, key: K): T[K]`로 바꾸세요. 10행의 오류가 사라지고 14행의 오타가 잡힙니다. 오타를 고쳐 콘솔에 평점 `4.5`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['4.5'] },
        hint: '`function getField<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }` 그리고 14행은 `\'rating\'`',
        answer: `interface Product {
  id: string;
  title: string;
  rating: number;
}

const keyboard: Product = { id: 'p1', title: '기계식 키보드', rating: 4.48 };

function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

console.log(getField(keyboard, 'title'));
console.log(getField(keyboard, 'rating').toFixed(1));
`,
      },
    },
  ],
  exercise: {
    id: 'ex-generics',
    title: '제네릭 유틸 두 개',
    prompt: '(1) `last`는 어떤 배열이든 받아 마지막 요소(없으면 undefined)를 돌려줍니다. (2) `pluck`은 객체 배열과 키 이름을 받아 그 키의 값들만 모은 배열을 돌려줍니다. 두 함수에 제네릭 타입을 붙여 보세요. 함수 본문은 고치지 않아도 됩니다.',
    runner: 'console',
    starter: `function last(items) {
  return items[items.length - 1];
}

function pluck(items, key) {
  return items.map((item) => item[key]);
}`,
    tests: `const n: number | undefined = last([1, 2, 3]);
const s: string | undefined = last(['a', 'b']);
console.log('last:', n, s);

const members = [{ id: 1, name: 'kim' }, { id: 2, name: 'lee' }];
const ids: number[] = pluck(members, 'id');
const names: string[] = pluck(members, 'name');
console.log('pluck:', ids, names);

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
      '`pluck`은 타입 매개변수가 두 개 필요합니다. 요소 타입 `T`와 키 타입 `K extends keyof T`.',
      '"T의 K 속성 타입"은 `T[K]`로 씁니다. 그 배열은 `T[K][]`입니다.',
    ],
  },
  quiz: [
    {
      id: 'q-generics-1',
      question: '`function wrap<T>(value: T): { value: T }`를 `wrap(42)`로 호출했을 때 반환 타입은?',
      options: ['{ value: any }', '{ value: T }', '{ value: number }', '{ value: unknown }'],
      answer: 2,
      explanation: '인자 42에서 T가 number로 추론되고, 반환 타입의 T 자리에도 number가 채워집니다.',
    },
    {
      id: 'q-generics-2',
      question: '`const selected = new Set()`으로 만든 뒤 숫자 id만 담으려고 합니다. 가장 알맞은 수정은?',
      options: [
        '그대로 둔다. `add(1)`을 하면 number로 추론된다',
        '`new Set<number>()`로 타입 인자를 직접 채운다',
        '`new Set() as any`로 단언한다',
        '`const selected: number = new Set()`으로 적는다',
      ],
      answer: 1,
      explanation: '인자 없이 만들면 T를 추론할 근거가 없습니다. 나중에 `add`를 호출해도 이미 정해진 타입은 바뀌지 않습니다. 빈 값으로 시작하는 곳은 꺾쇠를 직접 채웁니다.',
    },
    {
      id: 'q-generics-3',
      question: '`type Keys = keyof { id: number; title: string }`의 결과는?',
      options: ["'id' | 'title'", 'number | string', 'string[]', "['id', 'title']"],
      answer: 0,
      explanation: 'keyof는 객체 타입의 **키 이름**을 리터럴 유니온으로 만듭니다. 값의 타입(number | string)이 아닙니다.',
    },
  ],
};
