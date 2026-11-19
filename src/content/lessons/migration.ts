import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'migration',
  chapter: 'native',
  title: '실전: 기존 JS 프로젝트를 TS로 옮기기',
  summary: '한 번에 다 바꾸지 않습니다. 배포 파이프라인, 설정, 옮기는 순서, 타입 없는 모듈, 그리고 as any의 함정까지 직접 옮기면서 익힙니다.',
  minutes: 15,
  steps: [
    {
      id: 'migration-1',
      title: '배포 과정은 달라지지 않습니다',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '번들러는 타입을 지우기만 합니다',
          text: 'RN의 Metro(Babel)와 웹의 Vite는 TS 파일에서 **타입 표기를 지울 뿐, 검사는 하지 않습니다.** 그래서 번들 결과물은 JS일 때와 같고, CodePush 번들을 올리거나 iOS 빌드를 스토어에 제출하는 과정도 그대로입니다. 바뀌는 것은 하나, 타입 검사를 **직접 돌려야** 한다는 점입니다.',
        },
        {
          kind: 'p',
          text: '에디터의 코드가 그 증거입니다. 12행에 타입 오류가 있는데도 그대로 실행되어 7행에서 크래시했습니다. `변환된 JS` 탭을 열어 보세요. `interface`와 타입 표기만 사라지고, 12행의 잘못된 호출은 고스란히 남아 있습니다. 이것이 그대로 번들에 들어갑니다. 타입 검사는 원인인 12행을, 런타임 오류는 터진 곳인 7행을 가리킵니다.',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'package.json — 배포 앞에 타입 검사를 끼워 넣기',
          code: `{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "release": "npm run typecheck && ./scripts/release.sh"
  }
}`,
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '에디터의 빨간 줄은 배포를 막지 못합니다',
          text: '빨간 줄이 있어도 번들은 만들어집니다. 타입 오류가 있는 코드가 사용자 기기까지 가지 않게 하려면, CodePush 릴리스 스크립트와 CI의 맨 앞에 `tsc --noEmit`을 넣어 **오류가 있으면 멈추게** 해야 합니다.',
        },
      ],
      code: `interface UpdateInfo {
  version: string;
  mandatory: boolean;
}

function describeUpdate(update: UpdateInfo): string {
  const [major, minor] = update.version.split('.');
  return 'v' + major + '.' + minor + (update.mandatory ? ' (필수 업데이트)' : '');
}

console.log(describeUpdate({ version: '2.1.0', mandatory: true }));
console.log(describeUpdate({ version: 2.2, mandatory: false }));
console.log('끝까지 실행됨');
`,
      mission: {
        text: '`tsc --noEmit`이 통과하도록 12행을 고쳐 보세요. 콘솔에 `v2.2`가 찍히고 마지막 줄까지 실행되면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['v2.2', '끝까지 실행됨'] },
        hint: '`version`은 문자열입니다. `version: \'2.2.0\'`',
        answer: `interface UpdateInfo {
  version: string;
  mandatory: boolean;
}

function describeUpdate(update: UpdateInfo): string {
  const [major, minor] = update.version.split('.');
  return 'v' + major + '.' + minor + (update.mandatory ? ' (필수 업데이트)' : '');
}

console.log(describeUpdate({ version: '2.1.0', mandatory: true }));
console.log(describeUpdate({ version: '2.2.0', mandatory: false }));
console.log('끝까지 실행됨');
`,
      },
    },
    {
      id: 'migration-2',
      title: 'JS와 TS가 섞여 살게 하기',
      runner: 'console',
      errors: 3,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '전환은 파일 하나씩 합니다. 그러려면 아직 옮기지 않은 `.js`와 새로 옮긴 `.ts`가 한 프로젝트에서 서로 import할 수 있어야 합니다.',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'tsconfig.json — 점진적 전환용',
          code: `{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`,
        },
        {
          kind: 'list',
          items: [
            '`allowJs` — `.ts`에서 아직 옮기지 않은 `.js` 파일을 import할 수 있습니다.',
            '`checkJs: false` — `.js` 파일은 검사하지 않습니다. **옮긴 파일만** 빨간 줄이 생깁니다.',
            '`noEmit` — 변환은 번들러가 하므로 `tsc`는 검사만 합니다.',
            '`strict` — 처음부터 켭니다. 나중에 켜면 그동안 옮긴 파일 전체에서 오류가 한꺼번에 쏟아집니다.',
            'RN 프로젝트는 `"extends": "@react-native/typescript-config"`에서 시작하면 됩니다. `allowJs`, `noEmit`, `strict`가 이미 켜져 있습니다.',
          ],
        },
        {
          kind: 'p',
          text: '에디터는 `format.js`의 확장자만 `.ts`로 바꾼 직후입니다. 매개변수 세 줄에 암묵적 `any` 오류가 생겼습니다. 그리고 콘솔을 보세요. 16행은 JS 시절부터 날짜를 **문자열로** 넘기고 있었고, 11행에서 크래시합니다. 지금은 16행에 빨간 줄이 없지만, `date`에 타입을 붙이는 순간 드러납니다.',
        },
      ],
      code: `// utils/format.ts (format.js에서 확장자만 바꾼 상태)
function formatDistance(meters) {
  return meters < 1000 ? meters + 'm' : (meters / 1000).toFixed(1) + 'km';
}

function truncate(text, max = 10) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function formatDate(date) {
  return date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
}

console.log(formatDistance(350), formatDistance(2400));
console.log(truncate('React Navigation params 타이핑'));
console.log(formatDate('2026-11-19T09:00:00'));
`,
      mission: {
        text: '세 함수의 매개변수에 타입을 붙이세요. `date: Date`를 붙이면 16행에 새 오류가 나타납니다. 그 호출이 `Date` 객체를 넘기도록 고쳐 콘솔에 `2026.11.19`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['2.4km', '2026.11.19'] },
        hint: '`meters: number`, `text: string`, `date: Date`. `max`는 기본값 `10`에서 `number`로 추론되니 그대로 둡니다. 16행은 문자열을 `new Date(...)`로 감싸면 됩니다.',
        answer: `// utils/format.ts (format.js에서 확장자만 바꾼 상태)
function formatDistance(meters: number) {
  return meters < 1000 ? meters + 'm' : (meters / 1000).toFixed(1) + 'km';
}

function truncate(text: string, max = 10) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function formatDate(date: Date) {
  return date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
}

console.log(formatDistance(350), formatDistance(2400));
console.log(truncate('React Navigation params 타이핑'));
console.log(formatDate(new Date('2026-11-19T09:00:00')));
`,
      },
    },
    {
      id: 'migration-3',
      title: '옮기는 순서: 데이터 모델 타입이 먼저입니다',
      runner: 'console',
      errors: 6,
      body: [
        {
          kind: 'p',
          text: '다른 파일에 덜 의존하는 것부터 옮깁니다. 앞 단계에서 만든 타입이 뒤 단계의 작업을 쉽게 만듭니다.',
        },
        {
          kind: 'list',
          items: [
            '**1. 상수와 유틸** — 앞 단계처럼 확장자를 바꾸고 빨간 줄을 없앱니다.',
            '**2. 데이터 모델 타입** — 서버 응답과 도메인 객체(`User`, `Product`, `CartItem`)를 `types/`에 선언합니다.',
            '**3. 스토어** — 슬라이스에 타입을 붙이고 `RootState`, `useAppSelector`를 만듭니다.',
            '**4. 공용 컴포넌트** — `Button`, `Card`. props 타입을 붙이면 쓰는 쪽의 실수가 드러납니다.',
            '**5. 화면** — 마지막에. RN이라면 `RootStackParamList`부터 만들고 화면을 하나씩 `.tsx`로 바꿉니다.',
          ],
        },
        {
          kind: 'p',
          text: '에디터의 파일은 빨간 줄이 여섯 곳이지만 원인은 하나입니다. 세 함수 모두 `items`가 어떻게 생겼는지 **머릿속으로만** 알고 있습니다. 콘솔의 `NaN` 두 개도 같은 원인입니다. 16행의 데이터가 그 "머릿속 모양"과 다른데 아무도 알려 주지 않았습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '오류가 많은 파일을 만나면',
          text: '빨간 줄을 하나씩 지우기 전에, 그 파일이 다루는 **데이터의 타입부터** 선언하세요. 타입 하나가 여러 함수의 오류를 한 번에 없애고, 숨어 있던 데이터 버그까지 찾아 줍니다.',
        },
      ],
      code: `// 장바구니 유틸 (cart.js에서 확장자만 바꾼 상태)
function getTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function countItems(items) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

function getSoldOut(items) {
  return items.filter((item) => item.stock === 0).map((item) => item.title);
}

const cart = [
  { id: 'p1', title: '기계식 키보드', price: 129000, qty: 1, stock: 3 },
  { id: 'p2', title: '무선 마우스', price: '49000', quantity: 2, stock: 0 },
];

console.log('합계:', getTotal(cart));
console.log('수량:', countItems(cart));
console.log('품절:', getSoldOut(cart));
`,
      mission: {
        text: '`CartItem` 인터페이스를 하나 선언하고, 세 함수의 `items`와 `cart`에 `CartItem[]`을 붙이세요. 그러면 `cart`의 둘째 상품에 새 오류가 나타납니다. 데이터를 고쳐 콘솔에 `합계: 227000`, `수량: 3`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['합계: 227000', '수량: 3'] },
        hint: '`interface CartItem { id: string; title: string; price: number; qty: number; stock: number }`, `items: CartItem[]`, `const cart: CartItem[] = [...]`. 둘째 상품은 `price: 49000, qty: 2`',
        answer: `// 장바구니 유틸 (cart.js에서 확장자만 바꾼 상태)
interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  stock: number;
}

function getTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function countItems(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

function getSoldOut(items: CartItem[]) {
  return items.filter((item) => item.stock === 0).map((item) => item.title);
}

const cart: CartItem[] = [
  { id: 'p1', title: '기계식 키보드', price: 129000, qty: 1, stock: 3 },
  { id: 'p2', title: '무선 마우스', price: 49000, qty: 2, stock: 0 },
];

console.log('합계:', getTotal(cart));
console.log('수량:', countItems(cart));
console.log('품절:', getSoldOut(cart));
`,
      },
    },
    {
      id: 'migration-4',
      title: '타입이 없는 모듈을 만났을 때',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '오래된 라이브러리나 직접 만든 네이티브 모듈에는 타입이 없을 수 있습니다. 먼저 `npm i -D @types/패키지이름`으로 커뮤니티가 만든 타입이 있는지 확인하고, 없으면 프로젝트의 `.d.ts` 파일에 직접 선언합니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'src/types/declarations.d.ts',
          code: `// 쓰는 부분만 적어도 충분합니다
declare module 'legacy-analytics' {
  export function track(event: string, params?: Record<string, string | number>): void;
}

// 급할 때: 통째로 any로 두고 나중에 채우기
declare module 'some-old-module';`,
        },
        {
          kind: 'p',
          text: '이 에디터는 파일이 하나라 `.d.ts`를 만들 수 없으니, 같은 원리의 다른 방법을 연습합니다. RN의 `NativeModules.아무이름`은 `any`입니다. 화면 코드에서 직접 쓰면 오타가 그대로 배포됩니다. 그래서 **인터페이스를 선언한 래퍼 파일**을 하나 두고, 화면은 래퍼만 쓰게 합니다. `any`는 10행 한 줄에서 끝납니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '선언은 약속일 뿐입니다',
          text: '14행의 오타는 래퍼 덕분에 잡혔고, 콘솔의 크래시가 그 예고대로입니다. 하지만 인터페이스를 네이티브 구현과 **다르게** 적으면 TS는 알 방법이 없습니다. 직접 적는 선언은 실제 구현을 보고 정확히 옮겨야 합니다.',
        },
      ],
      code: `// 네이티브 모듈을 흉내 낸 값입니다. RN의 NativeModules도 타입이 이렇게 선언되어 있습니다.
const NativeModules: { [moduleName: string]: any } = {
  AppInfo: { getVersion: () => '2.1.0', getBuildNumber: () => 87 },
};

// native/appInfo.ts (래퍼 파일)
interface AppInfoModule {
  getVersion(): string;
}
const AppInfo: AppInfoModule = NativeModules.AppInfo;

// 화면 코드
console.log('버전', AppInfo.getVersion());
console.log('빌드', AppInfo.getBuildNumbr());
`,
      mission: {
        text: '화면에서 빌드 번호도 쓸 수 있게 `AppInfoModule`에 `getBuildNumber(): number`를 추가하고, 마지막 줄의 오타를 고치세요. 콘솔에 `빌드 87`이 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['버전 2.1.0', '빌드 87'] },
        hint: '인터페이스에 `getBuildNumber(): number;` 한 줄을 추가하고, 마지막 줄은 `AppInfo.getBuildNumber()`',
        answer: `// 네이티브 모듈을 흉내 낸 값입니다. RN의 NativeModules도 타입이 이렇게 선언되어 있습니다.
const NativeModules: { [moduleName: string]: any } = {
  AppInfo: { getVersion: () => '2.1.0', getBuildNumber: () => 87 },
};

// native/appInfo.ts (래퍼 파일)
interface AppInfoModule {
  getVersion(): string;
  getBuildNumber(): number;
}
const AppInfo: AppInfoModule = NativeModules.AppInfo;

// 화면 코드
console.log('버전', AppInfo.getVersion());
console.log('빌드', AppInfo.getBuildNumber());
`,
      },
    },
    {
      id: 'migration-5',
      title: 'as any와 @ts-ignore: 확장자만 .ts인 JS',
      runner: 'react',
      throws: true,
      body: [
        {
          kind: 'p',
          text: '전환 일정이 급하면 빨간 줄을 **덮고** 넘어가고 싶어집니다. 에디터의 코드가 그렇게 옮긴 결과입니다. 타입 오류는 0개인데 미리보기는 크래시했습니다.',
        },
        {
          kind: 'list',
          items: [
            '17행 `as any` — 서버 응답의 모양이 `Product`와 다르다는 오류를 껐습니다. 실제로는 `title`이 없고 `price`가 문자열입니다.',
            '23행 `@ts-ignore` — **다음 한 줄**의 오류를 전부 숨깁니다. 24행은 `product` 대신 `item`을 넘기고 있고, 10행에서 크래시하는 원인이 바로 이 줄입니다.',
          ],
        },
        {
          kind: 'p',
          text: '두 가지 모두 TS에게 "여기는 보지 마"라고 말하는 것입니다. 오류는 사라진 것이 아니라 **실행할 때로 미뤄졌을 뿐**입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '정말 지금 못 고친다면',
          text: '`@ts-ignore` 대신 `// @ts-expect-error 이유`를 쓰세요. 나중에 그 줄의 오류가 없어지면 "쓸모없는 주석"이라는 오류가 나서, 덮어 둔 곳이 영원히 남지 않습니다. `TODO`와 이유를 함께 적어 두면 검색해서 하나씩 갚을 수 있습니다.',
        },
      ],
      code: `interface Product {
  id: string;
  title: string;
  price: number;
}

function ProductRow({ product }: { product: Product }) {
  return (
    <div className="card">
      <strong>{product.title}</strong>
      <div className="muted">{product.price.toLocaleString()}원</div>
    </div>
  );
}

// 빨간 줄이 생기자 "일단" 덮어 둔 코드
const fromServer = { id: 'p1', name: '기계식 키보드', price: '129000' } as any;

export default function App() {
  return (
    <div className="stack">
      <ProductRow product={fromServer} />
      {/* @ts-ignore 나중에 고치기 */}
      <ProductRow item={{ id: 'p2', title: '무선 마우스', price: 49000 }} />
    </div>
  );
}
`,
      mission: {
        text: '`as any`와 `@ts-ignore` 주석을 지우세요. 숨어 있던 오류가 나타나면 제대로 고쳐서, 미리보기에 두 상품의 이름과 가격이 모두 나오게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['기계식 키보드', '129,000원', '무선 마우스', '49,000원'] },
        hint: '서버 데이터는 `{ id: \'p1\', title: \'기계식 키보드\', price: 129000 }`이어야 하고, 둘째 줄은 `item`이 아니라 `product`로 넘겨야 합니다.',
        answer: `interface Product {
  id: string;
  title: string;
  price: number;
}

function ProductRow({ product }: { product: Product }) {
  return (
    <div className="card">
      <strong>{product.title}</strong>
      <div className="muted">{product.price.toLocaleString()}원</div>
    </div>
  );
}

const fromServer = { id: 'p1', title: '기계식 키보드', price: 129000 };

export default function App() {
  return (
    <div className="stack">
      <ProductRow product={fromServer} />
      <ProductRow product={{ id: 'p2', title: '무선 마우스', price: 49000 }} />
    </div>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-migration',
    title: '레거시 유틸 파일 옮기기',
    prompt: '앱 업데이트 확인에 쓰던 JS 유틸 파일을 `.ts`로 이름만 바꾼 상태입니다. 타입을 붙여 오류를 모두 없애 보세요. `getStorageKey`는 `STORAGE_KEYS`에 **실제로 있는 키만** 받아야 합니다.',
    runner: 'console',
    starter: `const STORAGE_KEYS = {
  token: '@app/token',
  theme: '@app/theme',
  lastSync: '@app/lastSync',
};

function getStorageKey(name) {
  return STORAGE_KEYS[name];
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function isUpdateRequired(current, minimum) {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  if (c.major !== m.major) return c.major < m.major;
  if (c.minor !== m.minor) return c.minor < m.minor;
  return c.patch < m.patch;
}`,
    tests: `const key: string = getStorageKey('token');
const version: { major: number; minor: number; patch: number } = parseVersion('2.0.1');
const required: boolean = isUpdateRequired('1.2.3', '1.3.0');
console.log('저장 키:', key);
console.log('버전:', version);
console.log('1.2.3 → 최소 1.3.0, 업데이트 필요?', required);

// 아래 호출들은 실행되지 않습니다. 잘못된 사용이 타입 오류로 잡히는지만 확인합니다.
function wrongUsage() {
  // @ts-expect-error STORAGE_KEYS에 없는 키입니다
  getStorageKey('user');
  // @ts-expect-error 버전은 문자열이어야 합니다
  isUpdateRequired(1.2, 1.3);
}`,
    solution: `const STORAGE_KEYS = {
  token: '@app/token',
  theme: '@app/theme',
  lastSync: '@app/lastSync',
};

function getStorageKey(name: keyof typeof STORAGE_KEYS): string {
  return STORAGE_KEYS[name];
}

function parseVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function isUpdateRequired(current: string, minimum: string): boolean {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  if (c.major !== m.major) return c.major < m.major;
  if (c.minor !== m.minor) return c.minor < m.minor;
  return c.patch < m.patch;
}`,
    hints: [
      '`version`, `current`, `minimum`은 모두 `string`입니다.',
      '"STORAGE_KEYS 객체의 키들"은 두 연산자를 이어서 만듭니다: `keyof typeof STORAGE_KEYS`',
      '`parseVersion`의 반환 타입은 적지 않아도 추론됩니다.',
    ],
  },
  quiz: [
    {
      id: 'q-migration-1',
      question: 'CodePush로 나가는 번들에 타입 오류가 있는 코드가 섞이지 않게 하려면 무엇이 필요할까요?',
      options: [
        '아무것도 필요 없다. Metro가 타입 오류를 만나면 번들을 만들지 않는다',
        '릴리스 스크립트와 CI에서 `tsc --noEmit`을 먼저 실행해, 오류가 있으면 멈추게 한다',
        '`tsconfig.json`에서 `noEmit`을 끈다',
        '모든 파일의 확장자를 `.ts`로 바꾼다',
      ],
      answer: 1,
      explanation: '번들러는 타입을 지우기만 하고 검사하지 않아서, 타입 오류가 있어도 번들은 만들어집니다. 타입 검사는 배포 전에 CI나 릴리스 스크립트에서 `tsc --noEmit`으로 따로 돌려야 합니다.',
    },
    {
      id: 'q-migration-2',
      question: '기존 JS 프로젝트를 파일 하나씩 옮길 때 가장 먼저 필요한 tsconfig 옵션은?',
      options: ['"allowJs": true', '"strict": false', '"declaration": true', '"outDir": "dist"'],
      answer: 0,
      explanation: 'allowJs가 있어야 .ts 파일에서 아직 옮기지 않은 .js 파일을 import할 수 있어, 두 언어가 한 프로젝트에 공존할 수 있습니다.',
    },
    {
      id: 'q-migration-3',
      question: '옮긴 파일 하나에 빨간 줄이 수십 개 생겼습니다. 가장 먼저 할 일은?',
      options: [
        '오류가 나는 값마다 `as any`를 붙인다',
        '파일 맨 위에 `// @ts-nocheck`를 적는다',
        '그 파일이 다루는 데이터의 타입(모델)을 먼저 선언한다',
        '`strict`를 끈다',
      ],
      answer: 2,
      explanation: '오류가 많은 파일은 대개 데이터 모델 타입이 없어서입니다. 모델 타입 하나가 여러 오류를 한 번에 없애고, 숨어 있던 데이터 버그도 찾아 줍니다. 나머지 셋은 오류를 실행할 때로 미룰 뿐입니다.',
    },
  ],
};
