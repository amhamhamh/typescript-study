import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'inference',
  chapter: 'basics',
  title: '타입 추론: 생각보다 적게 써도 됩니다',
  summary: 'TS는 "JS + 타입 표기"입니다. 어디에 타입을 쓰고, 어디는 맡겨도 되는지부터 잡습니다.',
  minutes: 12,
  steps: [
    {
      id: 'inference-1',
      title: '타입은 실행 전에 버그를 알려 줍니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '이미 겪어 본 문제',
          text: '배포한 뒤에야 `undefined is not a function` 크래시 리포트를 받고 CodePush로 급히 핫픽스를 내보낸 적 있죠. 그런 버그의 상당수는 **코드를 실행하기 전에** 에디터에서 잡을 수 있습니다.',
        },
        {
          kind: 'p',
          text: '오른쪽 화면을 보세요. 왼쪽은 에디터, 오른쪽 위는 코드를 **실제로 실행한 결과(콘솔)**, 아래는 **타입 검사** 결과입니다. 코드를 고치면 둘 다 바로 갱신됩니다.',
        },
        {
          kind: 'p',
          text: '6행은 문자열과 객체를 숫자 자리에 넣었습니다. 콘솔에는 `NaN`이 찍혔고, 타입 검사는 실행하기도 전에 그 줄을 지목하고 있습니다. JS였다면 `NaN`이 화면에 나온 뒤에야 알았을 버그입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '타입 오류가 있어도 코드는 실행됩니다',
          text: 'TS는 빌드할 때 타입 표기를 지우고 평범한 JS를 남깁니다. 타입 검사는 "실행을 막는 장치"가 아니라 "미리 알려 주는 장치"입니다. 그래서 여기서도 오류가 있는 코드가 그대로 실행되어 `NaN`이 찍힙니다. `변환된 JS` 탭에서 타입이 지워진 결과를 확인해 보세요.',
        },
      ],
      code: `function getTotal(price: number, qty: number): number {
  return price * qty;
}

console.log(getTotal(10000, 2));
console.log(getTotal('10000', { qty: 2 }));
`,
      mission: {
        text: '6행의 잘못된 호출을 고쳐서 타입 오류를 없애고, 콘솔에 `30000`이 찍히게 해 보세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['30000'] },
        hint: '`getTotal`은 숫자 두 개를 받습니다. `getTotal(10000, 3)`',
        answer: `function getTotal(price: number, qty: number): number {
  return price * qty;
}

console.log(getTotal(10000, 2));
console.log(getTotal(10000, 3));
`,
      },
    },
    {
      id: 'inference-2',
      title: '변수는 대부분 추론에 맡깁니다',
      runner: 'console',
      errors: 3,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '모든 변수에 타입을 적을 필요는 없습니다. 초기값이 있으면 TS가 타입을 **추론**합니다. 에디터에서 `count`, `title`, `tags` 위에 마우스를 올려 보세요. VS Code와 똑같이 추론된 타입이 보입니다.',
        },
        {
          kind: 'list',
          items: [
            '`let count = 0` → `number`',
            "`const title = 'TS 입문'` → `'TS 입문'` (const는 값이 바뀌지 않으니 값 자체가 타입)",
            "`const tags = ['rn', 'web']` → `string[]`",
          ],
        },
        {
          kind: 'p',
          text: '추론된 타입과 맞지 않는 줄 세 곳에 빨간 줄이 생겼습니다. 그리고 콘솔을 보세요. 10행에서 **타입 검사가 예고한 그대로** `title.toFixed is not a function` 오류가 나며 실행이 멈췄습니다. 마지막 줄은 실행되지 못했습니다.',
        },
      ],
      code: `let count = 0;
const title = 'TS 입문';
const tags = ['rn', 'web'];

count = count + 1;
count = '하나';
tags.push(3);
console.log(count, tags);

console.log(title.toFixed(2));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '타입 오류 세 곳을 고쳐서 마지막 줄까지 실행되게 하세요. 값은 타입에 맞기만 하면 무엇이든 괜찮습니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['끝까지 실행됨'] },
        hint: '`count`에는 숫자를, `tags`에는 문자열을 넣습니다. 문자열에는 `toFixed`가 없으니 `title.toUpperCase()`처럼 문자열 메서드로 바꿔 보세요.',
        answer: `let count = 0;
const title = 'TS 입문';
const tags = ['rn', 'web'];

count = count + 1;
count = 10;
tags.push('redux');
console.log(count, tags);

console.log(title.toUpperCase());
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'inference-3',
      title: '타입을 직접 써야 하는 곳: 함수 매개변수',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '추론에는 근거가 필요합니다. 함수 매개변수는 "어떤 값이 들어올지" 알 근거가 없어서 **직접 적어야** 합니다. 적지 않으면 `any`(아무거나)가 되는데, 엄격 모드에서는 이것 자체가 오류입니다. 1행의 `Parameter \'price\' implicitly has an \'any\' type`이 그 오류입니다.',
        },
        {
          kind: 'compare',
          js: `function formatPrice(price, currency) {
  return currency + price.toLocaleString();
}`,
          ts: `function formatPrice(price: number, currency: string): string {
  return currency + price.toLocaleString();
}`,
          caption: '매개변수 뒤에 `: 타입`, 괄호 뒤에 반환 타입. 함수 본문은 그대로입니다.',
        },
        {
          kind: 'p',
          text: '지금은 6행의 `formatPrice(\'공짜\', \'₩\')`에 빨간 줄이 **없습니다**. 매개변수 타입이 없어서 검사할 기준이 없기 때문입니다. 타입을 붙이는 순간 그 줄이 잡힙니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '직접 써야 하는 곳은 세 군데뿐',
          text: '**함수 매개변수**, **빈 값으로 시작하는 변수**(`[]`, `null`), 그리고 공개 함수의 **반환 타입**(선택이지만 권장). 나머지는 추론에 맡겨도 됩니다.',
        },
      ],
      code: `function formatPrice(price, currency) {
  return currency + price.toLocaleString();
}

console.log(formatPrice(12000, '₩'));
console.log(formatPrice('공짜', '₩'));
`,
      mission: {
        text: '매개변수와 반환 타입을 붙이세요. 그러면 6행에 새 오류가 나타납니다. 그 호출을 숫자 `0`으로 고쳐 콘솔에 `₩0`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['₩12,000', '₩0'] },
        hint: '`price: number, currency: string` 그리고 괄호 뒤에 `: string`. 6행은 `formatPrice(0, \'₩\')`',
        answer: `function formatPrice(price: number, currency: string): string {
  return currency + price.toLocaleString();
}

console.log(formatPrice(12000, '₩'));
console.log(formatPrice(0, '₩'));
`,
      },
    },
    {
      id: 'inference-4',
      title: 'any는 스위치를 끄는 것, unknown은 잠가 두는 것',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`JSON.parse`, `fetch().json()`처럼 **바깥에서 들어오는 데이터**는 TS가 모양을 알 수 없어서 `any`가 됩니다. `any`는 "이 값은 검사하지 마"라는 뜻입니다.',
        },
        {
          kind: 'p',
          text: '5행을 보세요. `count`를 `cout`으로 잘못 썼는데 빨간 줄이 없습니다. 그리고 콘솔에서는 `Cannot read properties of undefined` 오류로 멈췄습니다. **any는 TS를 쓰지 않는 것과 같습니다.**',
        },
        {
          kind: 'p',
          text: '`unknown`은 반대입니다. 아무 값이나 담을 수 있지만 **확인하기 전에는 아무것도 못 하게** 막습니다. 8행의 오류가 그것입니다. `typeof`, `in` 같은 평범한 조건문으로 확인하고 나면 그 블록 안에서는 쓸 수 있습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '확인한 뒤에 쓰기',
          code: `if (typeof u === 'object' && u !== null && 'count' in u) {
  u.count; // 이 안에서는 count가 있다는 걸 TS도 압니다
}`,
        },
      ],
      code: `const json = '{"count": 3}';

const a: any = JSON.parse(json);
console.log('any:', a.count + 1);
console.log(a.cout.toFixed());

const u: unknown = JSON.parse(json);
console.log('unknown:', u.count + 1);
`,
      mission: {
        text: '(1) 오타가 난 5행을 지우고, (2) 8행을 조건문으로 감싸 `u`에 숫자 `count`가 있는지 확인한 뒤 출력하세요. 콘솔에 `unknown: 4`가 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['any: 4', 'unknown: 4'] },
        hint: "`if (typeof u === 'object' && u !== null && 'count' in u && typeof u.count === 'number') { ... }`",
        answer: `const json = '{"count": 3}';

const a: any = JSON.parse(json);
console.log('any:', a.count + 1);

const u: unknown = JSON.parse(json);
if (typeof u === 'object' && u !== null && 'count' in u && typeof u.count === 'number') {
  console.log('unknown:', u.count + 1);
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-inference',
    title: '첫 타입 붙이기',
    prompt: 'JS로 작성된 함수 두 개입니다. 매개변수와 반환 타입을 붙여 타입 오류를 모두 없애 보세요. 함수 본문은 고치지 않아도 됩니다.',
    runner: 'console',
    starter: `function formatPrice(price, currency) {
  return currency + price.toLocaleString();
}

function average(scores) {
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
}`,
    tests: `const label: string = formatPrice(12000, '₩');
const avg: number = average([90, 80, 100]);
console.log(label, '/ 평균', avg);

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
      question: '타입 오류가 있는 TS 코드를 번들러(Metro, Vite)로 빌드하면 어떻게 될까요?',
      options: [
        '빌드가 실패한다',
        '오류가 있는 줄만 빠진 채 빌드된다',
        '타입만 지워진 JS가 그대로 만들어지고 실행된다',
        '브라우저가 실행을 거부한다',
      ],
      answer: 2,
      explanation: '방금 실습 화면에서 본 그대로입니다. 타입 표기는 지워질 뿐이고 실행을 막지 않습니다. 그래서 배포 전에 `tsc --noEmit`으로 타입 검사를 따로 돌려야 합니다.',
    },
    {
      id: 'q-inference-3',
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
};
