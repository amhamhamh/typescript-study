import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'objects',
  chapter: 'basics',
  title: '객체의 모양: type과 interface',
  summary: 'API 응답, props, state. 앱에서 다루는 건 대부분 객체입니다. 객체의 모양을 타입으로 적고, 그 타입이 어떤 버그를 미리 잡는지 확인합니다.',
  minutes: 15,
  steps: [
    {
      id: 'objects-1',
      title: '객체의 모양을 타입으로 적습니다',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '이미 하고 있던 일',
          text: '`PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })`를 적어 봤다면 객체 타입을 이미 써 본 것입니다. PropTypes는 **실행 중에 콘솔 경고**를 띄우고, TS는 **작성 중에 빨간 줄**을 긋는다는 점만 다릅니다.',
        },
        {
          kind: 'compare',
          jsLabel: 'PropTypes',
          tsLabel: 'TypeScript',
          js: `const userShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
});`,
          ts: `interface User {
  id: number;
  name: string;
}`,
          caption: '속성마다 `이름: 타입;`을 한 줄씩 적습니다. 따로 표시하지 않으면 전부 필수입니다.',
        },
        {
          kind: 'p',
          text: '11행은 `name`이 빠진 객체를 넘겼습니다. 타입 검사는 `Property \'name\' is missing`이라며 그 줄을 지목하고, 콘솔에서는 7행의 `user.name.toUpperCase()`가 `undefined`를 만나 실제로 크래시했습니다. 마지막 줄은 실행되지 못했습니다.',
        },
        {
          kind: 'p',
          text: '`interface User { ... }` 대신 `type User = { ... }`로 적어도 똑같이 동작합니다. 둘의 차이는 5단계에서 정리합니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return user.name.toUpperCase() + '님 (#' + user.id + ')';
}

console.log(greet({ id: 1, name: 'kim' }));
console.log(greet({ id: 2 }));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '11행의 객체를 `User` 모양에 맞게 채워서 타입 오류를 없애고, 콘솔에 `LEE님 (#2)`가 찍히게 해 보세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['LEE님 (#2)', '끝까지 실행됨'] },
        hint: "빠진 속성을 채웁니다. `greet({ id: 2, name: 'lee' })`",
        answer: `interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return user.name.toUpperCase() + '님 (#' + user.id + ')';
}

console.log(greet({ id: 1, name: 'kim' }));
console.log(greet({ id: 2, name: 'lee' }));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'objects-2',
      title: '없을 수도 있는 속성: ?',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '속성 이름 뒤에 `?`를 붙이면 **없어도 되는 속성**이 됩니다. 그래서 `nickname`이 없는 12행은 타입 오류가 아닙니다.',
        },
        {
          kind: 'p',
          text: '대신 읽을 때 대가를 치릅니다. `nickname?: string`을 읽으면 타입이 `string | undefined`입니다. 8행의 `\'user.nickname\' is possibly \'undefined\'`가 그 뜻이고, 콘솔을 보면 12행의 호출에서 예고대로 `Cannot read properties of undefined`로 멈췄습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'JS에서 쓰던 방어 코드 그대로',
          code: `user.nickname?.toUpperCase(); // 없으면 undefined
user.nickname ?? user.name;   // 없으면 기본값
if (user.nickname) {
  user.nickname.toUpperCase(); // 이 안에서는 string
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '?.만으로는 부족할 때',
          text: '8행을 `user.nickname?.toUpperCase()`로 바꿔 보세요. 크래시는 사라지지만 결과가 `undefined`일 수 있어서, 반환 타입 `string`과 맞지 않는다는 새 오류가 납니다. "없을 때 무엇을 보여 줄지"까지 정해야 끝납니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
  nickname?: string;
}

function displayName(user: User): string {
  return user.nickname.toUpperCase();
}

console.log(displayName({ id: 1, name: 'kim', nickname: 'coding-kim' }));
console.log(displayName({ id: 2, name: 'park' }));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '`nickname`이 없으면 `name`을 대신 쓰도록 8행을 고치세요. 콘솔에 `CODING-KIM`과 `PARK`가 모두 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['CODING-KIM', 'PARK', '끝까지 실행됨'] },
        hint: '`??`로 기본값을 정한 뒤 대문자로 바꿉니다. `(user.nickname ?? user.name).toUpperCase()`',
        answer: `interface User {
  id: number;
  name: string;
  nickname?: string;
}

function displayName(user: User): string {
  return (user.nickname ?? user.name).toUpperCase();
}

console.log(displayName({ id: 1, name: 'kim', nickname: 'coding-kim' }));
console.log(displayName({ id: 2, name: 'park' }));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'objects-3',
      title: 'readonly: 직접 고치면 안 되는 값',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: 'props와 Redux state는 "직접 수정하지 말고 새 객체를 만들라"고 배웠죠. 그 규칙을 타입에 적는 것이 `readonly`입니다. 속성 앞에 붙이면 대입이 막히고, 배열 타입 앞에 붙이면 `push`, `sort`처럼 원본을 바꾸는 메서드가 타입에서 사라집니다.',
        },
        {
          kind: 'p',
          text: '9행과 10행은 받은 객체를 그 자리에서 고칩니다. 타입 검사는 두 줄을 모두 지목했고, 콘솔 둘째 줄을 보면 그 결과가 보입니다. 관리자용 설정을 만들었을 뿐인데 **모두가 함께 쓰는 `defaults`까지** `dark`로 바뀌었습니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'readonly는 실행 중에 값을 얼리지 않습니다',
          text: '`Object.freeze`와 달리 `readonly`는 타입 검사에만 쓰이고 빌드하면 지워집니다. 그래서 이 코드도 그대로 실행되어 원본이 오염됐습니다. 빨간 줄을 무시하면 아무도 막아 주지 않습니다.',
        },
      ],
      code: `interface Settings {
  readonly theme: string;
  readonly tabs: readonly string[];
}

const defaults: Settings = { theme: 'light', tabs: ['home', 'my'] };

function forAdmin(settings: Settings): Settings {
  settings.theme = 'dark';
  settings.tabs.push('admin');
  return settings;
}

const admin = forAdmin(defaults);
console.log('admin:', admin.theme, admin.tabs.join(', '));
console.log('defaults:', defaults.theme, defaults.tabs.join(', '));
`,
      mission: {
        text: '`forAdmin`이 받은 객체를 고치지 않고 **새 객체**를 만들어 돌려주게 하세요. `admin`은 `dark`에 탭 3개, `defaults`는 `light`에 탭 2개 그대로여야 합니다.',
        goal: {
          noTypeErrors: true,
          consoleIncludes: ['admin: dark home, my, admin', 'defaults: light home, my'],
        },
        hint: "리듀서에서 하던 것처럼 스프레드로 복사합니다. `return { ...settings, theme: 'dark', tabs: [...settings.tabs, 'admin'] }`",
        answer: `interface Settings {
  readonly theme: string;
  readonly tabs: readonly string[];
}

const defaults: Settings = { theme: 'light', tabs: ['home', 'my'] };

function forAdmin(settings: Settings): Settings {
  return { ...settings, theme: 'dark', tabs: [...settings.tabs, 'admin'] };
}

const admin = forAdmin(defaults);
console.log('admin:', admin.theme, admin.tabs.join(', '));
console.log('defaults:', defaults.theme, defaults.tabs.join(', '));
`,
      },
    },
    {
      id: 'objects-4',
      title: '중첩 객체, 배열, Record',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '실제 API 응답은 객체 안에 객체와 배열이 들어 있습니다. 타입도 같은 모양으로 겹쳐 적습니다.',
        },
        {
          kind: 'list',
          items: [
            '`shipTo: Address` → 다른 타입을 이름으로 재사용',
            '`items: { ... }[]` → 객체의 **배열**. `OrderItem[]`처럼 이름을 붙여도 됩니다',
            '`Record<string, number>` → 키가 미리 정해지지 않은 "사전". 키는 문자열, 값은 숫자',
          ],
        },
        {
          kind: 'p',
          text: '20행과 22행은 서버 문서를 대충 보고 속성 이름을 짐작해서 쓴 코드입니다. 타입 검사는 `quantity`와 `zipCode`가 없다고 알려 주고, 콘솔에는 그 결과인 `NaN`과 `undefined`가 찍혔습니다. 크래시가 아니라서 JS였다면 화면에서 발견할 때까지 몰랐을 버그입니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'Record는 없는 키도 있다고 믿습니다',
          text: '`Record<string, number>`는 "어떤 문자열 키를 넣어도 숫자가 나온다"는 타입입니다. 그래서 없는 키 `p9`를 읽는 23행에는 빨간 줄이 없는데, 콘솔에는 `undefined`가 찍혔습니다. 없을 수 있는 키는 `?? 0`처럼 기본값을 정해서 읽으세요.',
        },
      ],
      code: `interface Address {
  city: string;
  zip: string;
}

interface Order {
  id: string;
  items: { productId: string; qty: number }[];
  shipTo: Address;
}

const stockById: Record<string, number> = { p1: 3, p2: 0 };

const order: Order = {
  id: 'o-1',
  items: [{ productId: 'p1', qty: 2 }, { productId: 'p2', qty: 1 }],
  shipTo: { city: '서울', zip: '04524' },
};

const total = order.items.reduce((sum, item) => sum + item.quantity, 0);
console.log('총 수량:', total);
console.log('배송지:', order.shipTo.city, order.shipTo.zipCode);
console.log('p9 재고:', stockById['p9']);
`,
      mission: {
        text: '(1) 20행과 22행의 속성 이름을 타입 선언에 맞게 고치고, (2) 23행에 `?? 0`을 붙여 없는 키의 기본값을 정하세요. 콘솔에 `총 수량: 3`, 우편번호 `04524`, `p9 재고: 0`이 찍히면 성공입니다. `item.` 뒤에서 자동완성을 열면 쓸 수 있는 이름이 보입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['총 수량: 3', '배송지: 서울 04524', 'p9 재고: 0'] },
        hint: "`Order`의 `items` 요소에는 `qty`가, `Address`에는 `zip`이 있습니다. 23행은 `stockById['p9'] ?? 0`",
        answer: `interface Address {
  city: string;
  zip: string;
}

interface Order {
  id: string;
  items: { productId: string; qty: number }[];
  shipTo: Address;
}

const stockById: Record<string, number> = { p1: 3, p2: 0 };

const order: Order = {
  id: 'o-1',
  items: [{ productId: 'p1', qty: 2 }, { productId: 'p2', qty: 1 }],
  shipTo: { city: '서울', zip: '04524' },
};

const total = order.items.reduce((sum, item) => sum + item.qty, 0);
console.log('총 수량:', total);
console.log('배송지:', order.shipTo.city, order.shipTo.zip);
console.log('p9 재고:', stockById['p9'] ?? 0);
`,
      },
    },
    {
      id: 'objects-5',
      title: '확장하기: extends와 &',
      runner: 'console',
      errors: 4,
      body: [
        {
          kind: 'p',
          text: '이번에는 콘솔이 멀쩡합니다. 값은 올바른데 **타입이 덜 적힌** 경우입니다. `Admin`에는 `permissions`만, `CartItem`에는 `qty`만 선언되어 있어서 `name`, `title`을 읽는 15행과 19행, `id`를 넘기는 22행과 23행이 모두 오류입니다. 타입 오류는 "코드가 틀렸다"일 수도, "타입이 틀렸다"일 수도 있습니다.',
        },
        {
          kind: 'p',
          text: '`User`의 속성을 `Admin`에 복사해 적는 대신, 기존 타입을 **확장**합니다.',
        },
        {
          kind: 'compare',
          jsLabel: 'interface는 extends',
          tsLabel: 'type은 &',
          js: `interface Admin extends User {
  permissions: string[];
}`,
          ts: `type CartItem = Product & {
  qty: number;
};`,
          caption: '둘 다 "앞 타입의 속성 전부 + 추가 속성"입니다. `User`에 속성이 늘면 `Admin`도 따라 늘어납니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'type과 interface, 실무 규칙',
          text: '객체 모양을 적을 때 둘은 거의 같습니다. **객체 모양은 팀에서 하나로 통일**하고, `\'sm\' | \'md\'` 같은 유니온처럼 interface로 표현할 수 없는 것은 `type`을 씁니다. 이 강의의 예제는 대부분 객체는 `interface`, 나머지는 `type`으로 적습니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
}

interface Admin {
  permissions: string[];
}

type Product = { id: string; title: string };

type CartItem = { qty: number };

function adminLabel(admin: Admin): string {
  return admin.name + ' 권한 ' + admin.permissions.length + '개';
}

function cartLine(item: CartItem): string {
  return item.title + ' x ' + item.qty;
}

console.log(adminLabel({ id: 1, name: '김코딩', permissions: ['ban', 'notice'] }));
console.log(cartLine({ id: 'p1', title: '키보드', qty: 2 }));
`,
      mission: {
        text: '값이 아니라 **타입 선언**을 고쳐서 오류 네 곳을 한 번에 없애세요. `Admin`은 `User`를 `extends`로, `CartItem`은 `Product`를 `&`로 확장합니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['김코딩 권한 2개', '키보드 x 2'] },
        hint: '`interface Admin extends User { ... }` 그리고 `type CartItem = Product & { qty: number };`',
        answer: `interface User {
  id: number;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}

type Product = { id: string; title: string };

type CartItem = Product & { qty: number };

function adminLabel(admin: Admin): string {
  return admin.name + ' 권한 ' + admin.permissions.length + '개';
}

function cartLine(item: CartItem): string {
  return item.title + ' x ' + item.qty;
}

console.log(adminLabel({ id: 1, name: '김코딩', permissions: ['ban', 'notice'] }));
console.log(cartLine({ id: 'p1', title: '키보드', qty: 2 }));
`,
      },
    },
    {
      id: 'objects-6',
      title: 'TS는 모양만 봅니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: 'TS는 타입의 이름이 아니라 **필요한 속성이 들어 있는지**만 확인합니다(구조적 타이핑). 12행의 `fromApi`는 `User`라고 선언한 적도 없고 `role`이라는 여분의 속성도 있지만, `id`와 `name`이 맞으니 13행을 그대로 통과합니다. 서버에서 받은 평범한 객체를 그대로 넘길 수 있는 이유입니다.',
        },
        {
          kind: 'p',
          text: '단, **객체 리터럴을 그 자리에 직접 적을 때**는 더 엄격합니다. 타입에 없는 속성이 있으면 오타로 보고 막습니다. 15행의 `emial`이 그렇게 잡혔고, 콘솔 둘째 줄에는 그 오타 때문에 `(주소 없음)`이 찍혔습니다.',
        },
        {
          kind: 'p',
          text: '17행의 `draft`에도 같은 오타가 있습니다. 그런데 17행에도, 그것을 넘기는 18행에도 빨간 줄이 **없고**, 콘솔에는 똑같이 `(주소 없음)`이 찍혔습니다. 변수에 담았다가 넘기면 13행처럼 "여분의 속성이 있는 객체"로 보고 통과시키기 때문입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '객체를 만드는 자리에 타입을 붙이세요',
          text: '`const draft: User = { ... }`처럼 만드는 자리에 타입을 적으면 그 리터럴이 바로 검사됩니다. 선택 속성의 오타는 크래시도 내지 않고 조용히 틀린 결과만 만들기 때문에, 이렇게 미리 잡아 두는 수밖에 없습니다.',
        },
      ],
      code: `interface User {
  id: number;
  name: string;
  email?: string;
}

function sendMail(user: User): void {
  console.log(user.name + ' →', user.email ?? '(주소 없음)');
}

// 서버 응답처럼 속성이 더 많은 평범한 객체
const fromApi = { id: 1, name: '김코딩', email: 'kim@example.com', role: 'admin' };
sendMail(fromApi);

sendMail({ id: 2, name: '박리덕', emial: 'park@example.com' });

const draft = { id: 3, name: '이네이티브', emial: 'lee@example.com' };
sendMail(draft);
`,
      mission: {
        text: '(1) 15행의 오타를 고치고, (2) 17행의 `draft`에 `: User`를 붙여 숨어 있던 오타를 드러낸 뒤 고치세요. 세 사람의 메일 주소가 모두 찍히면 성공입니다.',
        goal: {
          noTypeErrors: true,
          consoleIncludes: ['kim@example.com', 'park@example.com', 'lee@example.com'],
        },
        hint: '`const draft: User = { ... }`로 바꾸면 `emial`에 빨간 줄이 생깁니다. 두 곳 모두 `email`로 고칩니다.',
        answer: `interface User {
  id: number;
  name: string;
  email?: string;
}

function sendMail(user: User): void {
  console.log(user.name + ' →', user.email ?? '(주소 없음)');
}

// 서버 응답처럼 속성이 더 많은 평범한 객체
const fromApi = { id: 1, name: '김코딩', email: 'kim@example.com', role: 'admin' };
sendMail(fromApi);

sendMail({ id: 2, name: '박리덕', email: 'park@example.com' });

const draft: User = { id: 3, name: '이네이티브', email: 'lee@example.com' };
sendMail(draft);
`,
      },
    },
  ],
  exercise: {
    id: 'ex-objects',
    title: 'User 타입 설계하기',
    prompt: '빈 객체로 되어 있는 `User` 타입을 채워 보세요. `id`는 숫자, `name`은 문자열, `nickname`은 **없을 수도 있는** 문자열, `tags`는 문자열 배열입니다. 콘솔에는 이미 결과가 찍힙니다. 코드는 맞고 타입만 비어 있는 상태입니다.',
    runner: 'console',
    starter: `// TODO: User 타입을 완성하세요.
type User = {};

function getDisplayName(user: User): string {
  return user.nickname ?? user.name;
}`,
    tests: `const a: User = { id: 1, name: '김코딩', tags: ['rn'] };
const b: User = { id: 2, name: '박리덕', nickname: 'redux-park', tags: [] };
const names: string[] = [getDisplayName(a), getDisplayName(b)];
console.log('표시 이름:', names.join(', '));

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
      question: '`nickname?: string` 으로 선언된 속성을 읽었을 때의 타입은?',
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
    {
      id: 'q-objects-3',
      question: '아래 코드에서 타입 오류가 나는 줄은?',
      code: `interface Point { x: number; y: number }

const a = { x: 1, y: 2, z: 3 };
const p1: Point = a;                    // (A)
const p2: Point = { x: 1, y: 2, z: 3 }; // (B)`,
      options: ['(A)만', '(B)만', '둘 다', '둘 다 오류가 아니다'],
      answer: 1,
      explanation: '(A)는 변수를 거쳤으므로 필요한 속성(x, y)만 있으면 통과합니다. (B)처럼 객체 리터럴을 타입이 정해진 자리에 직접 적을 때만 "타입에 없는 속성"을 오타로 보고 막습니다.',
    },
  ],
};
