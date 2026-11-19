import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'react-hooks',
  chapter: 'react',
  title: 'Hooks 타이핑: 대부분은 추론됩니다',
  summary: 'useState, useRef, 커스텀 훅, Context. 꺾쇠(<...>)를 언제 채워야 하는지만 알면 됩니다.',
  minutes: 14,
  steps: [
    {
      id: 'react-hooks-1',
      title: 'useState는 초기값에서 추론됩니다',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '좋은 소식',
          text: '지금까지 쓰던 훅 코드의 대부분은 **한 글자도 안 바꿔도** 타입이 붙습니다. 파일을 `.tsx`로 바꾸는 순간 `useState(1)`은 이미 `number` 상태입니다.',
        },
        {
          kind: 'p',
          text: '에디터에서 `qty`, `memo`, `gift`와 각 setter 위에 마우스를 올려 보세요. 초기값 `1`, `\'\'`, `false`에서 `number`, `string`, `boolean`이 추론되었고, setter도 그 타입만 받습니다.',
        },
        {
          kind: 'p',
          text: '11행에 빨간 줄이 있습니다. `e.target.value`는 **항상 문자열**인데 숫자 상태에 넣었기 때문입니다. 미리보기에서 수량을 지우고 `2`를 입력한 뒤 `+1`을 눌러 보세요. `3`이 아니라 `21`이 되고 합계가 252,000원이 됩니다. JS에서 한 번쯤 겪어 본 그 버그를 타입 검사가 먼저 짚은 것입니다.',
        },
      ],
      code: `import { useState } from 'react';

export default function App() {
  const [qty, setQty] = useState(1);
  const [memo, setMemo] = useState('');
  const [gift, setGift] = useState(false);

  return (
    <div className="stack">
      <div className="row">
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <button onClick={() => setQty(qty + 1)}>+1</button>
      </div>
      <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="배송 메모" />
      <label>
        <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} /> 선물 포장
      </label>
      <p>합계 {(qty * 12000).toLocaleString('ko-KR')}원{gift ? ' · 선물 포장' : ''}</p>
    </div>
  );
}
`,
      mission: {
        text: '11행에서 문자열을 숫자로 바꿔 넣어 타입 오류를 없애세요. `any`는 쓰지 않습니다. 고친 뒤 `2`를 입력하고 `+1`을 누르면 이번에는 `3`이 됩니다.',
        goal: { noTypeErrors: true, codeExcludes: ['any'] },
        hint: '`setQty(Number(e.target.value))`',
        answer: `import { useState } from 'react';

export default function App() {
  const [qty, setQty] = useState(1);
  const [memo, setMemo] = useState('');
  const [gift, setGift] = useState(false);

  return (
    <div className="stack">
      <div className="row">
        <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <button onClick={() => setQty(qty + 1)}>+1</button>
      </div>
      <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="배송 메모" />
      <label>
        <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} /> 선물 포장
      </label>
      <p>합계 {(qty * 12000).toLocaleString('ko-KR')}원{gift ? ' · 선물 포장' : ''}</p>
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-hooks-2',
      title: '빈 값으로 시작하면 꺾쇠를 채웁니다',
      runner: 'react',
      errors: 3,
      body: [
        {
          kind: 'p',
          text: '추론에는 근거가 필요합니다. 초기값이 `null`이나 `[]`이면 "나중에 무엇이 들어올지" 알 수 없습니다. 9행과 10행의 `user`, `todos` 위에 마우스를 올려 보세요. `null`과 `never[]`(아무것도 넣을 수 없는 배열)로 추론되어 있습니다.',
        },
        {
          kind: 'p',
          text: '그래서 `user.name`을 읽는 14행, `setUser`에 객체를 넣는 16행, 배열에 문자열을 넣는 17행이 모두 오류입니다. 버튼을 눌러 보면 실행은 잘 됩니다. 이번 빨간 줄은 버그가 아니라 **TS에게 정보가 부족하다**는 신호입니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '나중에 담길 타입을 꺾쇠에 적습니다',
          code: `const [product, setProduct] = useState<Product | null>(null);
const [products, setProducts] = useState<Product[]>([]);`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '| null은 확인을 강제합니다',
          text: '`User | null`로 적으면 `user.name`을 바로 읽을 수 없고, 14행처럼 `user ? ... : ...`로 확인한 쪽에서만 읽을 수 있습니다. 로그인 전 화면에서 `Cannot read properties of null`로 죽는 일을 막아 줍니다.',
        },
      ],
      code: `import { useState } from 'react';

interface User {
  id: number;
  name: string;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);

  return (
    <div className="stack">
      <p>{user ? user.name + '님, 안녕하세요' : '로그인이 필요합니다'}</p>
      <div className="row">
        <button onClick={() => setUser({ id: 1, name: '김코딩' })}>로그인</button>
        <button onClick={() => setTodos([...todos, '할 일 ' + (todos.length + 1)])}>할 일 추가</button>
      </div>
      <p className="muted">할 일 {todos.length}개 {todos.join(', ')}</p>
    </div>
  );
}
`,
      mission: {
        text: '9행과 10행의 `useState`에 꺾쇠를 채워 오류 세 곳을 없애세요. `user`는 `User` 또는 `null`, `todos`는 문자열 배열입니다. `any`는 쓰지 않습니다.',
        goal: { noTypeErrors: true, codeExcludes: ['any'] },
        hint: '`useState<User | null>(null)` 과 `useState<string[]>([])`',
        answer: `import { useState } from 'react';

interface User {
  id: number;
  name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<string[]>([]);

  return (
    <div className="stack">
      <p>{user ? user.name + '님, 안녕하세요' : '로그인이 필요합니다'}</p>
      <div className="row">
        <button onClick={() => setUser({ id: 1, name: '김코딩' })}>로그인</button>
        <button onClick={() => setTodos([...todos, '할 일 ' + (todos.length + 1)])}>할 일 추가</button>
      </div>
      <p className="muted">할 일 {todos.length}개 {todos.join(', ')}</p>
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-hooks-3',
      title: '정해진 문자열만 담는 상태',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '꺾쇠가 필요한 세 번째 경우입니다. 마이페이지가 주문 탭에서 시작해야 하는데 미리보기의 카드가 **비어 있습니다**. `설정` 버튼을 눌러도 비어 있습니다.',
        },
        {
          kind: 'p',
          text: '타입 검사는 25행만 지목합니다. `useState(\'order\')`가 `string`으로 추론되어 "`string`은 `Tab`에 넣을 수 없다"는 것입니다. 뭔가 잘못됐다는 건 알려 주지만, 상태가 `string`인 동안에는 **아무 문자열이나 넣을 수 있어서** 진짜 원인이 어느 줄인지는 짚지 못합니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'as Tab으로 누르지 마세요',
          text: '25행을 `tab={tab as Tab}`으로 바꾸면 빨간 줄은 사라지지만 빈 카드는 그대로입니다. 상태 자체를 `useState<Tab>(...)`으로 좁혀야 초기값과 setter에 넣는 값까지 검사됩니다.',
        },
      ],
      code: `import { useState } from 'react';

type Tab = 'orders' | 'reviews' | 'settings';

const TITLE: Record<Tab, string> = {
  orders: '주문 내역 3건',
  reviews: '작성한 리뷰가 없습니다',
  settings: '알림 설정',
};

function Screen({ tab }: { tab: Tab }) {
  return <div className="card">{TITLE[tab]}</div>;
}

export default function App() {
  const [tab, setTab] = useState('order');

  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setTab('orders')}>주문</button>
        <button onClick={() => setTab('reviews')}>리뷰</button>
        <button onClick={() => setTab('setting')}>설정</button>
      </div>
      <Screen tab={tab} />
    </div>
  );
}
`,
      mission: {
        text: '16행의 `useState`에 `<Tab>`을 붙이세요. 25행의 오류가 사라지고, 대신 오타가 난 두 줄이 정확히 드러납니다. 둘 다 고쳐서 처음 화면에 `주문 내역 3건`이 보이게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['주문 내역 3건'], codeIncludes: ['useState<Tab>'] },
        hint: '`useState<Tab>(\'orders\')`, 그리고 23행은 `setTab(\'settings\')`',
        answer: `import { useState } from 'react';

type Tab = 'orders' | 'reviews' | 'settings';

const TITLE: Record<Tab, string> = {
  orders: '주문 내역 3건',
  reviews: '작성한 리뷰가 없습니다',
  settings: '알림 설정',
};

function Screen({ tab }: { tab: Tab }) {
  return <div className="card">{TITLE[tab]}</div>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setTab('orders')}>주문</button>
        <button onClick={() => setTab('reviews')}>리뷰</button>
        <button onClick={() => setTab('settings')}>설정</button>
      </div>
      <Screen tab={tab} />
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-hooks-4',
      title: 'useRef: 무엇을 가리키는지 알려 주기',
      runner: 'react',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`useRef(null)`도 `useState(null)`과 같은 처지입니다. 어떤 요소를 가리킬지 모르니 `current`가 `null`로만 추론되고, 9행의 `.focus()`는 오류가 됩니다. 요소 타입을 꺾쇠에 적어 줍니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          code: `// 웹: DOM 요소 타입
const inputRef = useRef<HTMLInputElement>(null);
const boxRef = useRef<HTMLDivElement>(null);

// React Native: 컴포넌트 타입
const nameRef = useRef<TextInput>(null);
const listRef = useRef<FlatList<Item>>(null);`,
        },
        {
          kind: 'p',
          text: '꺾쇠를 채워도 9행에는 `possibly \'null\'` 오류가 남습니다. 맞는 지적입니다. 검색창이 열릴 때 포커스를 주려던 코드인데, 미리보기는 **뜨자마자 죽어 있습니다**. 콘솔에 `current: null`이 찍힌 뒤 9행에서 `Cannot read properties of null` 오류가 났습니다. 검색창이 아직 화면에 없는 동안 `current`는 정말 `null`이기 때문입니다. 그래서 `?.`가 필요합니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '!로 덮지 마세요',
          text: '`inputRef.current!.focus()`는 빨간 줄만 지울 뿐, 지금 보이는 크래시는 그대로입니다. `?.`는 `null`일 때 호출을 건너뛰므로 실제로 안전해집니다.',
        },
      ],
      code: `import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log('current:', inputRef.current);
    inputRef.current.focus();
  }, [open]);

  return (
    <div className="stack">
      <button onClick={() => setOpen(!open)}>{open ? '검색 닫기' : '검색 열기'}</button>
      {open && <input ref={inputRef} placeholder="검색어를 입력하세요" />}
    </div>
  );
}
`,
      mission: {
        text: '(1) 5행의 `useRef` 꺾쇠에 input 요소 타입 `HTMLInputElement`를 적고, (2) 9행을 `current`가 `null`이어도 죽지 않게 고치세요. 화면이 살아나면 `검색 열기`를 눌러 검색창에 커서가 들어가는지 확인해 보세요.',
        goal: { noTypeErrors: true, previewIncludes: ['검색 열기'], codeIncludes: ['HTMLInputElement'] },
        hint: '`useRef<HTMLInputElement>(null)` 그리고 `inputRef.current?.focus()`',
        answer: `import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('current:', inputRef.current);
    inputRef.current?.focus();
  }, [open]);

  return (
    <div className="stack">
      <button onClick={() => setOpen(!open)}>{open ? '검색 닫기' : '검색 열기'}</button>
      {open && <input ref={inputRef} placeholder="검색어를 입력하세요" />}
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-hooks-5',
      title: '커스텀 훅: 배열을 돌려줄 땐 as const',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '`useState`처럼 `[값, 함수]`를 돌려주는 커스텀 훅입니다. 화면은 잘 나오는데 14행과 15행에 빨간 줄이 있습니다. `useCounter` 위에 마우스를 올려 반환 타입을 보세요. `(number | (() => void))[]`입니다.',
        },
        {
          kind: 'p',
          text: 'TS는 배열 리터럴을 "숫자 또는 함수가 **순서 없이** 들어 있는 배열"로 추론합니다. 그래서 꺼낸 `count`도 `increase`도 "숫자일 수도, 함수일 수도" 있는 값이 되어, `toFixed`도 `onClick`도 쓸 수 없습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '튜플로 고정하는 방법',
          text: '`return [count, increase] as const;`로 쓰면 "첫째는 `number`, 둘째는 함수"인 **튜플**로 고정됩니다. 반환 타입을 `[number, () => void]`로 직접 적어도 같습니다. `{ count, increase }`처럼 객체로 돌려주는 훅은 이 문제가 없습니다.',
        },
      ],
      code: `import { useState } from 'react';

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increase = () => setCount((c) => c + 1);
  return [count, increase];
}

export default function App() {
  const [count, increase] = useCounter(3);

  return (
    <div className="row">
      <span className="badge info">{count.toFixed(1)}</span>
      <button onClick={increase}>+1</button>
    </div>
  );
}
`,
      mission: {
        text: '6행을 고쳐 `useCounter`가 튜플을 돌려주게 하세요. 14, 15행은 건드리지 않고, `any`도 쓰지 않습니다.',
        goal: { noTypeErrors: true, codeExcludes: ['any'] },
        hint: '`return [count, increase] as const;`',
        answer: `import { useState } from 'react';

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increase = () => setCount((c) => c + 1);
  return [count, increase] as const;
}

export default function App() {
  const [count, increase] = useCounter(3);

  return (
    <div className="row">
      <span className="badge info">{count.toFixed(1)}</span>
      <button onClick={increase}>+1</button>
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-hooks-6',
      title: 'Context: null 확인은 훅에서 한 번만',
      runner: 'react',
      errors: 2,
      throws: true,
      body: [
        {
          kind: 'p',
          text: 'Context도 "빈 값으로 시작"합니다. Provider 밖에서는 줄 값이 없으니 `createContext<Auth | null>(null)`로 만듭니다. 그러면 `useContext`의 결과는 `Auth | null`이고, 14, 15행처럼 바로 쓰면 `possibly \'null\'` 오류가 납니다.',
        },
        {
          kind: 'p',
          text: '이번에도 예고대로입니다. 27행의 `Greeting`은 Provider 밖에 있어서 `auth`가 `null`입니다. 콘솔에는 `Cannot read properties of null (reading \'name\')` 오류가 14행을 가리키고 있고, 미리보기는 화면 전체가 죽었습니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '꺼내 쓰는 훅에서 한 번만 확인하기',
          code: `function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) throw new Error('ThemeProvider가 없습니다');
  return theme; // 여기부터는 null이 아닙니다
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'useReducer는요?',
          text: '리듀서 함수의 `state`와 `action` 매개변수에 타입을 붙이면 끝입니다. `useReducer(reducer, 초기값)`이 돌려주는 `state`와 `dispatch`의 타입은 거기서 추론됩니다. 액션 타입을 유니온으로 적는 방법은 다음 챕터(Redux)에서 다룹니다.',
        },
      ],
      code: `import { createContext, useContext } from 'react';

interface Auth {
  name: string;
  logout: () => void;
}

const AuthContext = createContext<Auth | null>(null);

function Greeting() {
  const auth = useContext(AuthContext);
  return (
    <div className="row">
      <strong>{auth.name}님</strong>
      <button onClick={auth.logout}>로그아웃</button>
    </div>
  );
}

export default function App() {
  const auth: Auth = { name: '김코딩', logout: () => console.log('로그아웃') };
  return (
    <div className="stack">
      <AuthContext.Provider value={auth}>
        <Greeting />
      </AuthContext.Provider>
      <Greeting />
    </div>
  );
}
`,
      mission: {
        text: '`useAuth` 훅을 만들어 `null`이면 알아보기 쉬운 오류를 던지고 아니면 `Auth`를 돌려주게 하세요. `Greeting`은 `useAuth()`를 쓰고, Provider 밖에 있는 27행의 `<Greeting />`은 지웁니다.',
        goal: { noTypeErrors: true, previewIncludes: ['김코딩님'] },
        hint: '`function useAuth(): Auth { const auth = useContext(AuthContext); if (auth === null) throw new Error(\'...\'); return auth; }`',
        answer: `import { createContext, useContext } from 'react';

interface Auth {
  name: string;
  logout: () => void;
}

const AuthContext = createContext<Auth | null>(null);

function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (auth === null) throw new Error('AuthContext.Provider 안에서만 쓸 수 있습니다');
  return auth;
}

function Greeting() {
  const auth = useAuth();
  return (
    <div className="row">
      <strong>{auth.name}님</strong>
      <button onClick={auth.logout}>로그아웃</button>
    </div>
  );
}

export default function App() {
  const auth: Auth = { name: '김코딩', logout: () => console.log('로그아웃') };
  return (
    <div className="stack">
      <AuthContext.Provider value={auth}>
        <Greeting />
      </AuthContext.Provider>
    </div>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-react-hooks',
    title: '훅에 타입 정보 채워 주기',
    prompt: '세 군데를 고쳐 보세요. (1) `user` 상태는 처음엔 null이고 로그인하면 `User`가 됩니다. (2) `inputRef`는 input 요소를 가리킵니다. (3) `useToggle`은 `[boolean, 함수]` 튜플을 돌려줘야 합니다. 타입은 실행 전에 지워지므로 미리보기는 처음부터 동작합니다. 목표는 빨간 줄 0개입니다.',
    runner: 'react',
    starter: `import { useRef, useState } from 'react';

interface User {
  id: number;
  name: string;
}

function LoginBox() {
  const [user, setUser] = useState(null); // TODO 1
  const inputRef = useRef(null); // TODO 2

  const login = () => {
    setUser({ id: 1, name: inputRef.current?.value ?? '' });
    inputRef.current?.blur();
  };

  return (
    <div className="row">
      <input ref={inputRef} placeholder="이름" />
      <button className="primary" onClick={login}>로그인</button>
      <span>{user ? user.name + '님' : '로그인해 주세요'}</span>
    </div>
  );
}

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle]; // TODO 3
}`,
    tests: `export default function Demo() {
  const [open, toggle] = useToggle();
  const flag: boolean = open;
  console.log('Demo 렌더링, open =', flag);
  return (
    <div className="stack">
      <button onClick={toggle}>{flag ? '로그인 창 닫기' : '로그인 창 열기'}</button>
      {flag && <LoginBox />}
    </div>
  );
}`,
    solution: `import { useRef, useState } from 'react';

interface User {
  id: number;
  name: string;
}

function LoginBox() {
  const [user, setUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const login = () => {
    setUser({ id: 1, name: inputRef.current?.value ?? '' });
    inputRef.current?.blur();
  };

  return (
    <div className="row">
      <input ref={inputRef} placeholder="이름" />
      <button className="primary" onClick={login}>로그인</button>
      <span>{user ? user.name + '님' : '로그인해 주세요'}</span>
    </div>
  );
}

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle] as const;
}`,
    hints: [
      '`useState<User | null>(null)` 처럼 꺾쇠 안에 상태의 타입을 적습니다.',
      'input 요소의 타입은 `HTMLInputElement` 입니다: `useRef<HTMLInputElement>(null)`',
      '배열 리터럴 뒤에 `as const`를 붙이면 튜플로 고정됩니다.',
    ],
  },
  quiz: [
    {
      id: 'q-react-hooks-1',
      question: '다음 중 꺾쇠(제네릭)를 **적지 않아도** 되는 것은?',
      options: [
        'useState(null) — 나중에 User가 들어감',
        'useState([]) — 나중에 Todo가 쌓임',
        'useState(false)',
        'useRef(null) — input을 가리킴',
      ],
      answer: 2,
      explanation: '`useState(false)`는 초기값에서 boolean이 추론됩니다. 나머지는 초기값(null, [])만으로 실제 담길 타입을 알 수 없습니다.',
    },
    {
      id: 'q-react-hooks-2',
      question: '`inputRef.current.focus()` 대신 `inputRef.current?.focus()`를 써야 하는 이유는?',
      options: [
        'TS 문법 규칙이라서',
        '요소가 화면에 붙어 있지 않은 동안에는 current가 null이라서',
        'focus가 비동기 함수라서',
        'ref는 항상 undefined라서',
      ],
      answer: 1,
      explanation: '`useRef<HTMLInputElement>(null)`의 current 타입은 `HTMLInputElement | null`입니다. 첫 렌더링 중이거나 조건부 렌더링으로 요소가 없을 때는 실제로 null이므로, TS가 확인을 요구하는 것이 맞습니다.',
    },
    {
      id: 'q-react-hooks-3',
      question: '커스텀 훅이 `return [count, increase];`로 끝나면 반환 타입은 어떻게 추론될까요?',
      options: [
        '`[number, () => void]` 튜플',
        '`(number | (() => void))[]` 배열',
        '`any[]`',
        '`never[]`',
      ],
      answer: 1,
      explanation: '배열 리터럴은 "요소 타입들의 유니온 배열"로 추론되어 순서 정보가 사라집니다. `as const`를 붙이거나 반환 타입을 튜플로 적어야 "첫째는 숫자, 둘째는 함수"가 유지됩니다.',
    },
  ],
};
