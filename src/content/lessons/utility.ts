import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'utility',
  chapter: 'basics',
  title: '타입 재활용: 유틸리티 타입과 as const',
  summary: '타입을 복붙하지 않고 기존 타입과 값에서 새 타입을 만들어 냅니다. 한 곳을 고치면 나머지가 따라옵니다.',
  minutes: 15,
  steps: [
    {
      id: 'utility-1',
      title: 'Partial: 전부 선택 속성으로',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '스프레드의 타입 버전',
          text: '`{ ...user, name }`처럼 기존 객체를 펼쳐서 새 객체를 만들죠. 타입도 똑같이 합니다. "수정 API는 필드가 같은데 전부 선택 사항", "목록에는 상세 데이터의 일부만 필요" 같은 상황에서 타입을 새로 적지 않고 **기존 타입을 변형**해서 씁니다.',
        },
        {
          kind: 'p',
          text: '14행은 가격만 바꾸려는 호출입니다. 콘솔을 보면 잘 동작하는데 빨간 줄이 있습니다. 10행에서 `patch`를 `Product`로 적어서 네 속성을 전부 요구하기 때문입니다. 타입이 실제 쓰임과 맞지 않습니다.',
        },
        {
          kind: 'p',
          text: '`?`를 붙인 `ProductPatch`를 따로 복붙하면 `Product`에 필드가 추가될 때마다 두 곳을 고쳐야 합니다. `Partial<Product>`는 **Product의 모든 속성을 선택으로 바꾼 타입**을 만들어 줍니다.',
        },
        {
          kind: 'p',
          text: '15행은 다른 문제입니다. `stock`을 `stcok`으로 잘못 썼고, 콘솔을 보면 재고는 3 그대로인 채 엉뚱한 `stcok: 0`이 붙었습니다. `Partial`은 "생략해도 된다"일 뿐이라서 **없는 키는 여전히 잡습니다.**',
        },
      ],
      code: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

const keyboard: Product = { id: 1, title: '기계식 키보드', price: 129000, stock: 3 };

function updateProduct(product: Product, patch: Product): Product {
  return { ...product, ...patch };
}

console.log(updateProduct(keyboard, { price: 99000 }));
console.log(updateProduct(keyboard, { stcok: 0 }));
`,
      mission: {
        text: '10행의 `patch` 타입을 `Partial<Product>`로 바꿔 14행의 오류를 없애고, 15행의 오타를 고쳐 재고가 0으로 바뀌게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['price: 99000', 'stock: 0'] },
        hint: '`patch: Partial<Product>` 그리고 15행은 `{ stock: 0 }`',
        answer: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

const keyboard: Product = { id: 1, title: '기계식 키보드', price: 129000, stock: 3 };

function updateProduct(product: Product, patch: Partial<Product>): Product {
  return { ...product, ...patch };
}

console.log(updateProduct(keyboard, { price: 99000 }));
console.log(updateProduct(keyboard, { stock: 0 }));
`,
      },
    },
    {
      id: 'utility-2',
      title: 'Pick과 Omit: 고르기와 빼기',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '같은 `Product`에서 타입이 두 개 더 필요합니다. 목록 카드는 `id`, `title`, `price`만 쓰고, 등록 폼은 `id`가 없어야 합니다(서버가 붙이니까요). 지금은 8~9행에서 둘 다 `Product`를 그대로 쓰고 있습니다.',
        },
        {
          kind: 'list',
          items: [
            '11행: 카드에 필요 없는 `stock`이 없다고 오류가 납니다.',
            '15행: `\'id\' is specified more than once, so this usage will be overwritten`. 콘솔을 보세요. 새 상품의 id가 100이 아니라 **1**입니다. 18행에서 넘긴 `id`가 서버가 발급한 id를 덮어썼습니다.',
          ],
        },
        {
          kind: 'code',
          lang: 'ts',
          code: `// 고른 것만 남기기
type ProductCard = Pick<Product, 'id' | 'title' | 'price'>;
// 고른 것만 빼기
type NewProduct = Omit<Product, 'id'>;`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '어느 쪽을 쓸까',
          text: '`Product`에 필드가 추가되면 `Omit`으로 만든 타입에는 자동으로 따라 들어가고, `Pick`으로 만든 타입은 그대로입니다. "원본과 거의 같다"면 `Omit`, "일부만 필요하다"면 `Pick`이 맞습니다.',
        },
      ],
      code: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

type ProductCard = Product; // 목록 카드: id, title, price만 필요
type NewProduct = Product; // 등록 폼: id는 서버가 붙임

const card: ProductCard = { id: 1, title: '기계식 키보드', price: 129000 };

let nextId = 100;
function createProduct(input: NewProduct): Product {
  return { id: nextId++, ...input };
}

const created = createProduct({ id: 1, title: '무선 마우스', price: 49000, stock: 10 });
console.log(card.title, card.price);
console.log('새 상품 id:', created.id);
`,
      mission: {
        text: '8행은 `Pick`, 9행은 `Omit`으로 바꾸세요. 11행과 15행의 오류가 사라지고, 18행의 `id: 1`이 새로 잡힙니다. 그것을 지워 콘솔에 `새 상품 id: 100`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['새 상품 id: 100'] },
        hint: '`Pick<Product, \'id\' | \'title\' | \'price\'>`와 `Omit<Product, \'id\'>`',
        answer: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

type ProductCard = Pick<Product, 'id' | 'title' | 'price'>; // 목록 카드: id, title, price만 필요
type NewProduct = Omit<Product, 'id'>; // 등록 폼: id는 서버가 붙임

const card: ProductCard = { id: 1, title: '기계식 키보드', price: 129000 };

let nextId = 100;
function createProduct(input: NewProduct): Product {
  return { id: nextId++, ...input };
}

const created = createProduct({ title: '무선 마우스', price: 49000, stock: 10 });
console.log(card.title, card.price);
console.log('새 상품 id:', created.id);
`,
      },
    },
    {
      id: 'utility-3',
      title: 'Record: 키마다 값이 하나씩',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '필드 이름을 화면용 라벨로 바꾸는 표입니다. `stock`의 라벨을 빠뜨렸고, 콘솔에는 `undefined: 3`이 찍혔습니다. 화면이었다면 라벨 자리에 "undefined"가 보였을 겁니다.',
        },
        {
          kind: 'p',
          text: 'TS도 15행에서 잡긴 했습니다. 하지만 오류 위치가 **쓰는 곳**이고 메시지도 길어서 원인을 찾기 어렵습니다. `Record<키, 값>`은 "이 키들 **전부**에 대해 이 타입의 값이 있는 객체"입니다. 표에 이 타입을 붙이면 오류가 **표를 정의한 곳**으로 옮겨 가고, 빠진 키 이름을 알려 줍니다.',
        },
        {
          kind: 'list',
          items: [
            '`Record<keyof Product, string>` → Product의 모든 필드에 라벨이 있어야 합니다. 필드가 추가되면 이 표에서 오류가 납니다.',
            '`Record<\'pending\' | \'paid\', string>` → 상태별 라벨·색상 표에 자주 씁니다.',
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '키를 string으로 열면 이 검사가 사라집니다',
          text: '객체 레슨에서 본 `Record<string, number>`는 어떤 키든 있다고 믿는 "사전"이라 빠진 키를 알려 주지 못합니다. 키가 정해져 있다면 유니온이나 `keyof`로 적으세요.',
        },
      ],
      code: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

const LABELS = {
  id: '번호',
  title: '상품명',
  price: '가격',
};

function describe(product: Product, field: keyof Product): string {
  return LABELS[field] + ': ' + product[field];
}

const keyboard: Product = { id: 1, title: '기계식 키보드', price: 129000, stock: 3 };
console.log(describe(keyboard, 'price'));
console.log(describe(keyboard, 'stock'));
`,
      mission: {
        text: '8행의 `LABELS`에 `Record<keyof Product, string>` 타입을 붙이세요. 오류가 8행으로 옮겨 가며 빠진 키를 알려 줍니다. `stock: \'재고\'`를 추가해 콘솔에 `재고: 3`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['재고: 3'] },
        hint: '`const LABELS: Record<keyof Product, string> = { ... }`',
        answer: `interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
}

const LABELS: Record<keyof Product, string> = {
  id: '번호',
  title: '상품명',
  price: '가격',
  stock: '재고',
};

function describe(product: Product, field: keyof Product): string {
  return LABELS[field] + ': ' + product[field];
}

const keyboard: Product = { id: 1, title: '기계식 키보드', price: 129000, stock: 3 };
console.log(describe(keyboard, 'price'));
console.log(describe(keyboard, 'stock'));
`,
      },
    },
    {
      id: 'utility-4',
      title: 'typeof와 ReturnType: 값에서 타입 뽑기',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '지금까지는 타입에서 타입을 만들었습니다. 이번에는 **이미 있는 값**에서 타입을 뽑습니다. 타입 자리에 쓰는 `typeof 값`은 JS의 `typeof`(`\'object\'` 같은 문자열)와 달리 그 값의 TS 타입 전체를 돌려줍니다.',
        },
        {
          kind: 'p',
          text: '7~10행은 손으로 따로 적은 타입입니다. 값은 `fontSize: 14`(숫자)로 바뀌었는데 타입은 예전 그대로 `string`입니다. 23행의 빨간 줄이 그 어긋남이고, 콘솔에서는 13행이 숫자에 `toUpperCase`를 부르다 멈췄습니다. 값에서 타입을 뽑으면 둘이 어긋날 수 없습니다.',
        },
        {
          kind: 'p',
          text: '19행의 `ReturnType<typeof loadSettings>`는 "이 함수가 돌려주는 값의 타입"입니다. `Loaded`에 마우스를 올려 보세요. 반환 타입을 적은 적이 없는데 `loadedAt`까지 들어 있습니다.',
        },
        {
          kind: 'callout',
          tone: 'bridge',
          title: 'Redux에서 곧 다시 만납니다',
          text: '`type RootState = ReturnType<typeof store.getState>`가 바로 이 조합입니다. 리듀서를 추가하면 `RootState`가 저절로 늘어나는 이유입니다. 슬라이스의 state 타입도 `typeof initialState`로 뽑곤 합니다.',
        },
      ],
      code: `const defaultSettings = {
  theme: 'light',
  fontSize: 14,
  pushEnabled: true,
};

interface Settings {
  theme: string;
  fontSize: string;
}

function describe(settings: Settings): string {
  return settings.theme + ' / ' + settings.fontSize.toUpperCase();
}

function loadSettings() {
  return { ...defaultSettings, loadedAt: '09:30' };
}
type Loaded = ReturnType<typeof loadSettings>;

const loaded: Loaded = loadSettings();
console.log(loaded.loadedAt, loaded.pushEnabled);
console.log(describe(defaultSettings));
`,
      mission: {
        text: '7~10행의 `interface Settings`를 지우고 `type Settings = typeof defaultSettings;` 한 줄로 바꾸세요. 오류가 `describe` 안의 `toUpperCase`로 옮겨 갑니다. 그 부분을 `settings.fontSize + \'px\'`로 고쳐 콘솔에 `light / 14px`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['light / 14px'] },
        hint: '`typeof defaultSettings`는 `{ theme: string; fontSize: number; pushEnabled: boolean }`입니다. 숫자에는 `toUpperCase`가 없습니다.',
        answer: `const defaultSettings = {
  theme: 'light',
  fontSize: 14,
  pushEnabled: true,
};

type Settings = typeof defaultSettings;

function describe(settings: Settings): string {
  return settings.theme + ' / ' + settings.fontSize + 'px';
}

function loadSettings() {
  return { ...defaultSettings, loadedAt: '09:30' };
}
type Loaded = ReturnType<typeof loadSettings>;

const loaded: Loaded = loadSettings();
console.log(loaded.loadedAt, loaded.pushEnabled);
console.log(describe(defaultSettings));
`,
      },
    },
    {
      id: 'utility-5',
      title: 'as const: 상수 배열에서 유니온 뽑기',
      runner: 'console',
      body: [
        {
          kind: 'p',
          text: '탭, 필터, 라우트 이름 같은 상수 목록은 값(배열)과 타입(유니온)을 두 번 적지 않고 배열에서 타입을 뽑습니다. 2행의 `(typeof TABS)[number]`는 "TABS의 요소 타입"이라는 뜻입니다.',
        },
        {
          kind: 'p',
          text: '그런데 2행의 `Tab`에 마우스를 올려 보면 그냥 `string`입니다. 배열은 내용이 바뀔 수 있어서 TS가 `string[]`으로 넓게 추론하기 때문입니다. 그래서 18행의 오타 `actvie`에 **빨간 줄이 없습니다.** 콘솔의 `actvie: 3`을 보세요. 어느 조건에도 걸리지 않아 "전체" 분기로 빠졌습니다. 크래시도 없어서 가장 찾기 어려운 종류의 버그입니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'as const를 붙이면',
          code: `const TABS = ['all', 'active', 'done'] as const;
// readonly ['all', 'active', 'done']

type Tab = (typeof TABS)[number];
// 'all' | 'active' | 'done'`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '값은 한 곳에만',
          text: '`as const`는 "이 값은 바뀌지 않으니 적힌 그대로를 타입으로 삼아라"는 표시입니다. 읽기 전용이 되므로 `TABS.push()`는 오류가 됩니다. 탭을 추가할 때는 배열만 고치면 `Tab`이 따라 늘어납니다.',
        },
      ],
      code: `const TABS = ['all', 'active', 'done'];
type Tab = (typeof TABS)[number];

const todos = [
  { title: 'tsconfig 만들기', done: true },
  { title: 'utils를 .ts로 바꾸기', done: false },
  { title: 'RootState 뽑아내기', done: false },
];

function visibleTodos(tab: Tab) {
  if (tab === 'active') return todos.filter((todo) => !todo.done);
  if (tab === 'done') return todos.filter((todo) => todo.done);
  return todos;
}

console.log(TABS.join(' | '));
console.log('done:', visibleTodos('done').length);
console.log('actvie:', visibleTodos('actvie').length);
`,
      mission: {
        text: '1행의 배열 뒤에 `as const`를 붙이세요. 18행의 오타가 드디어 잡힙니다. 오타 두 곳을 `active`로 고쳐 콘솔에 `active: 2`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['active: 2'] },
        hint: '`const TABS = [\'all\', \'active\', \'done\'] as const;`',
        answer: `const TABS = ['all', 'active', 'done'] as const;
type Tab = (typeof TABS)[number];

const todos = [
  { title: 'tsconfig 만들기', done: true },
  { title: 'utils를 .ts로 바꾸기', done: false },
  { title: 'RootState 뽑아내기', done: false },
];

function visibleTodos(tab: Tab) {
  if (tab === 'active') return todos.filter((todo) => !todo.done);
  if (tab === 'done') return todos.filter((todo) => todo.done);
  return todos;
}

console.log(TABS.join(' | '));
console.log('done:', visibleTodos('done').length);
console.log('active:', visibleTodos('active').length);
`,
      },
    },
    {
      id: 'utility-6',
      title: 'keyof typeof: 설정 객체의 키 이름',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '색상표, 라우트 경로, 환경별 URL처럼 **객체로 된 설정값**도 같은 방식으로 다룹니다. 7행은 `color: string`이라 아무 문자열이나 받습니다. TS는 8행에서 "그 키가 있는지 알 수 없다"고 하고, 12행의 `\'warning\'`은 콘솔에 `주의 → undefined`를 남겼습니다. RN이었다면 배경색 없는 배지가 그려졌을 겁니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '안쪽부터 읽습니다',
          code: `type ColorName = keyof typeof COLORS;
// typeof COLORS → 이 객체의 타입
// keyof ...     → 그 타입의 키 이름들
// 'primary' | 'danger' | 'muted'`,
        },
        {
          kind: 'p',
          text: '3단계의 `Record`와는 방향이 반대입니다. `Record<키, 값>`은 **키 목록이 먼저** 있고 객체가 거기에 맞춰야 합니다. `keyof typeof`는 **객체가 먼저** 있고 키 목록이 따라옵니다. 객체에 색을 추가하면 `ColorName`도 늘어납니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '이 정도만 알면 충분합니다',
          text: '`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`에 `typeof`, `keyof`, `as const`. 앱 코드의 대부분은 이 조합으로 해결됩니다. 조건부 타입이나 `infer` 같은 고급 기능은 라이브러리를 만들 때나 필요합니다.',
        },
      ],
      code: `const COLORS = {
  primary: '#2b68b5',
  danger: '#b0281f',
  muted: '#666257',
};

function badge(text: string, color: string): string {
  return text + ' → ' + COLORS[color];
}

console.log(badge('품절', 'danger'));
console.log(badge('주의', 'warning'));
`,
      mission: {
        text: '`type ColorName = keyof typeof COLORS;`를 만들어 7행 `color`의 타입으로 쓰세요. 8행의 오류가 사라지고 12행의 `\'warning\'`이 잡힙니다. 이번에는 호출을 고치지 말고 `COLORS`에 `warning: \'#f5a623\'`을 추가해 보세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['주의 → #f5a623'] },
        hint: '`function badge(text: string, color: ColorName): string`. 객체에 키를 추가하면 `ColorName`에 `\'warning\'`이 저절로 들어갑니다.',
        answer: `const COLORS = {
  primary: '#2b68b5',
  danger: '#b0281f',
  muted: '#666257',
  warning: '#f5a623',
};
type ColorName = keyof typeof COLORS;

function badge(text: string, color: ColorName): string {
  return text + ' → ' + COLORS[color];
}

console.log(badge('품절', 'danger'));
console.log(badge('주의', 'warning'));
`,
      },
    },
  ],
  exercise: {
    id: 'ex-utility',
    title: 'Todo 타입에서 파생시키기',
    prompt: '`Todo` 하나에서 필요한 타입을 모두 만들어 보세요. (1) `TodoInput`: 생성 폼 입력값. `id`와 `createdAt`을 뺍니다. (2) `TodoPatch`: 수정값. `id`를 뺀 나머지가 모두 선택 사항입니다. (3) `TABS`를 고정된 상수로 만들고 `Tab`을 거기서 뽑아내세요.',
    runner: 'console',
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
const updated = updateTodo(todo, { done: true });
updateTodo(todo, {});
const tab: Tab = TABS[1];
console.log(updated.id, updated.title, '/ done:', updated.done, '/ 탭:', tab);

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
      '`Omit<Todo, \'id\' | \'createdAt\'>`처럼 뺄 키를 유니온으로 나열합니다.',
      '유틸리티 타입은 겹쳐 쓸 수 있습니다. `Partial<Omit<Todo, \'id\'>>`',
      '배열 뒤에 `as const`를 붙이고, `(typeof TABS)[number]`로 요소 타입을 뽑으세요.',
    ],
  },
  quiz: [
    {
      id: 'q-utility-1',
      question: '`Pick<User, \'id\' | \'name\'>`과 같은 결과를 내는 것은? (User는 id, name, email 세 속성을 가짐)',
      options: ["Omit<User, 'email'>", 'Partial<User>', "Record<'id' | 'name', User>", 'keyof User'],
      answer: 0,
      explanation: 'Pick은 고른 것만 남기고, Omit은 고른 것만 뺍니다. 세 속성 중 email을 빼면 id와 name이 남으니 결과가 같습니다.',
    },
    {
      id: 'q-utility-2',
      question: '`const COLORS = [\'red\', \'blue\'] as const`에서 `as const`를 빼면 `(typeof COLORS)[number]`는 무엇이 될까요?',
      options: ["'red' | 'blue'", 'string', "readonly ['red', 'blue']", 'never'],
      answer: 1,
      explanation: 'as const가 없으면 배열이 `string[]`으로 넓게 추론되므로 요소 타입은 그냥 string입니다. 방금 본 것처럼 오타가 난 값도 그대로 통과합니다.',
    },
    {
      id: 'q-utility-3',
      question: '`const ROUTES = { home: \'/\', cart: \'/cart\' }`에 `detail: \'/products/:id\'`를 추가했습니다. `type RouteName = keyof typeof ROUTES`는 어떻게 될까요?',
      options: [
        '직접 고치기 전까지 `\'home\' | \'cart\'` 그대로다',
        '자동으로 `\'home\' | \'cart\' | \'detail\'`이 된다',
        '`string`이 된다',
        '`as const`가 없어서 오류가 난다',
      ],
      answer: 1,
      explanation: '타입을 값에서 뽑았기 때문에 값을 고치면 타입이 따라옵니다. 키 이름은 as const 없이도 그대로 뽑힙니다.',
    },
  ],
};
