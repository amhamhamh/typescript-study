import type { Lesson } from '../types';

export const reactLessons: Lesson[] = [
  {
    id: 'react-props',
    chapter: 'react',
    title: 'Props 타이핑: PropTypes 졸업하기',
    summary: '컴포넌트의 입력을 타입으로 선언합니다. 잘못된 props는 실행 전에, 사용하는 쪽에서 바로 드러납니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '달라지는 점',
        text: 'PropTypes는 화면을 띄워서 그 컴포넌트가 실제로 렌더링돼야 콘솔 경고가 나옵니다. TS는 **컴포넌트를 쓰는 JSX 줄에서 바로** 빨간 줄이 생기고, 필수 props와 가능한 값이 자동완성됩니다. 파일 확장자만 `.jsx` → `.tsx`로 바꾸면 됩니다.',
      },
      {
        kind: 'compare',
        js: `import PropTypes from 'prop-types';

function Avatar({ uri, size, onPress }) {
  return <img src={uri} width={size} onClick={onPress} />;
}

Avatar.propTypes = {
  uri: PropTypes.string.isRequired,
  size: PropTypes.number,
  onPress: PropTypes.func,
};
Avatar.defaultProps = { size: 40 };`,
        ts: `interface AvatarProps {
  uri: string;
  size?: number;
  onPress?: () => void;
}

function Avatar({ uri, size = 40, onPress }: AvatarProps) {
  return <img src={uri} width={size} onClick={onPress} />;
}`,
        caption: '`isRequired`가 기본이고, 선택 사항에만 `?`를 붙입니다. 기본값은 구조 분해에서 줍니다.',
      },
      { kind: 'h', text: '자주 쓰는 props 타입' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;                 // JSX, 문자열, 숫자, null, 배열... 렌더링 가능한 모든 것
  footer?: ReactNode;                  // 선택적인 "슬롯"
  variant?: 'outline' | 'filled';      // 정해진 값 중 하나
  style?: CSSProperties;               // 인라인 스타일 객체
  onClose?: () => void;                // 인자 없는 콜백
  onSelect: (id: number) => void;      // 인자를 넘겨주는 콜백
  renderItem?: (item: string) => ReactNode; // render prop
}`,
      },
      {
        kind: 'playground',
        id: 'react-props-1',
        jsx: true,
        code: `import type { ReactNode } from 'react';

interface BadgeProps {
  tone: 'info' | 'danger';
  count?: number;
  children: ReactNode;
}

function Badge({ tone, count = 0, children }: BadgeProps) {
  return <span className={tone}>{children} {count > 0 && count}</span>;
}

const ok = <Badge tone="info">알림</Badge>;
const e1 = <Badge tone="warn">알림</Badge>;      // ← 오류: 없는 tone
const e2 = <Badge tone="danger" count="3">!</Badge>; // ← 오류: 문자열 "3"
const e3 = <Badge tone="info" />;                // ← 오류: children 누락`,
        caption: '`tone="` 까지 입력하고 Ctrl+Space를 눌러 보세요.',
      },
      { kind: 'h', text: '기존 태그의 props 물려받기' },
      {
        kind: 'p',
        text: '버튼을 감싼 컴포넌트를 만들 때 `disabled`, `type`, `aria-label`을 하나하나 적을 필요가 없습니다. `ComponentProps<\'button\'>`으로 **원래 태그가 받는 props 전부**를 가져올 수 있습니다.',
      },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import type { ComponentProps } from 'react';

interface ButtonProps extends ComponentProps<'button'> {
  loading?: boolean;
}

function Button({ loading, children, ...rest }: ButtonProps) {
  return (
    <button disabled={loading} {...rest}>
      {loading ? '처리 중...' : children}
    </button>
  );
}

// 직접 만든 컴포넌트의 props도 꺼낼 수 있습니다.
type Props = ComponentProps<typeof Button>;`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'React.FC는 꼭 써야 하나요?',
        text: '`const Avatar: React.FC<Props> = ...` 형태도 많이 보이지만, 요즘은 위 예제처럼 **매개변수에 직접 타입을 붙이는 방식**이 기본입니다. 더 짧고 제네릭 컴포넌트를 만들기도 쉽습니다. 기존 코드에서 FC를 만나도 놀라지 않을 정도만 알면 됩니다.',
      },
    ],
    exercise: {
      id: 'ex-react-props',
      title: 'Button의 Props 정의하기',
      prompt: '`ButtonProps`를 완성하세요. `variant`는 `primary` 또는 `ghost`(선택), `disabled`는 불리언(선택), `onPress`는 인자와 반환값이 없는 함수(필수), `children`은 렌더링 가능한 모든 것(필수)입니다.',
      jsx: true,
      starter: `import type { ReactNode } from 'react';

// TODO: ButtonProps를 완성하세요.
type ButtonProps = {};

function Button({ variant = 'primary', disabled, onPress, children }: ButtonProps) {
  return (
    <button className={variant} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  );
}`,
      tests: `const ok1 = <Button onPress={() => {}}>저장</Button>;
const ok2 = (
  <Button variant="ghost" disabled onPress={() => console.log('취소')}>
    <b>취소</b>
  </Button>
);

// @ts-expect-error onPress는 필수입니다
const bad1 = <Button>저장</Button>;
// @ts-expect-error 없는 variant입니다
const bad2 = <Button variant="danger" onPress={() => {}}>삭제</Button>;`,
      solution: `import type { ReactNode } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
};

function Button({ variant = 'primary', disabled, onPress, children }: ButtonProps) {
  return (
    <button className={variant} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  );
}`,
      hints: [
        '선택 props는 이름 뒤에 `?`를 붙입니다.',
        '인자와 반환값이 없는 함수의 타입은 `() => void` 입니다.',
        'children에는 이미 import 되어 있는 `ReactNode`를 쓰세요.',
      ],
    },
    quiz: [
      {
        id: 'q-react-props-1',
        question: '`children`의 타입으로 가장 일반적으로 쓰는 것은?',
        options: ['string', 'JSX.Element', 'ReactNode', 'any'],
        answer: 2,
        explanation: 'ReactNode는 JSX, 문자열, 숫자, null, 배열 등 렌더링 가능한 모든 값을 포함합니다. JSX.Element는 문자열이나 null을 받지 못해 너무 좁습니다.',
      },
      {
        id: 'q-react-props-2',
        question: 'PropTypes의 `defaultProps`에 해당하는 TS 방식은?',
        options: [
          'interface에 기본값을 적는다',
          '선택 속성(`?`)으로 선언하고 구조 분해에서 기본값을 준다',
          '`as` 로 단언한다',
          'TS에서는 기본값을 줄 수 없다',
        ],
        answer: 1,
        explanation: '타입에는 값이 들어갈 수 없습니다. `size?: number`로 선택 사항임을 알리고, `{ size = 40 }`처럼 JS의 기본 매개변수 문법으로 값을 줍니다.',
      },
    ],
  },

  {
    id: 'react-hooks',
    chapter: 'react',
    title: 'Hooks 타이핑: 대부분은 추론됩니다',
    summary: 'useState, useRef, 커스텀 훅. 꺾쇠를 언제 채워야 하는지만 알면 됩니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '좋은 소식',
        text: '지금까지 쓰던 훅 코드의 대부분은 **한 글자도 안 바꿔도** 타입이 붙습니다. `useState(0)`은 이미 number 상태입니다. 타입을 직접 적어야 하는 건 "초기값만으로는 알 수 없는" 몇 가지 경우뿐입니다.',
      },
      { kind: 'h', text: 'useState: 꺾쇠가 필요한 세 가지 경우' },
      {
        kind: 'playground',
        id: 'react-hooks-1',
        jsx: true,
        code: `import { useState } from 'react';

interface User { id: number; name: string }

function Example() {
  // 추론으로 충분한 경우
  const [count, setCount] = useState(0);        // number
  const [keyword, setKeyword] = useState('');   // string

  // 1) null로 시작하는 경우
  const [user, setUser] = useState<User | null>(null);
  // 2) 빈 배열로 시작하는 경우
  const [items, setItems] = useState<User[]>([]);
  // 3) 정해진 문자열 중 하나인 경우
  const [tab, setTab] = useState<'home' | 'my'>('home');

  setCount('1');      // ← 오류
  setTab('settings'); // ← 오류
  user.name;          // ← 오류: 아직 null일 수 있음

  return <p>{user?.name ?? '로그인 필요'} {count} {keyword} {items.length} {tab}</p>;
}`,
        caption: '`useState<User | null>(null)` 에서 꺾쇠를 지워 보세요. `setUser(...)`가 어떻게 되는지 확인할 수 있습니다.',
      },
      { kind: 'h', text: 'useRef: 무엇을 가리키는지 알려 주기' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { useRef, useEffect } from 'react';

function SearchInput() {
  // DOM 요소를 가리키는 ref: 요소 타입을 적고 null로 시작
  const inputRef = useRef<HTMLInputElement>(null);

  // 렌더링과 무관한 값을 담는 ref (타이머 id 등)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus(); // 마운트 전에는 null이므로 ?. 필요
  }, []);

  return <input ref={inputRef} />;
}

// React Native에서는 요소 타입만 달라집니다.
// const inputRef = useRef<TextInput>(null);
// const listRef = useRef<FlatList<Item>>(null);`,
      },
      { kind: 'h', text: '커스텀 훅: 배열을 돌려줄 땐 as const' },
      {
        kind: 'playground',
        id: 'react-hooks-2',
        jsx: true,
        code: `import { useState } from 'react';

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increase = () => setCount((c) => c + 1);

  // 그냥 배열로 돌려주면 (number | (() => void))[] 로 추론됩니다.
  return [count, increase];
}

function Demo() {
  const [count, increase] = useCounter();
  count.toFixed(); // ← 오류: 함수일 수도 있다고 판단
  increase();      // ← 오류: 숫자일 수도 있다고 판단
  return null;
}`,
        caption: '`return [count, increase] as const;` 로 바꾸면 "첫째는 number, 둘째는 함수"인 튜플로 고정됩니다. 직접 고쳐 보세요.',
      },
      { kind: 'h', text: 'useReducer와 Context' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { createContext, useContext, useReducer } from 'react';

// useReducer: 리듀서 함수에 타입을 붙이면 state와 dispatch가 자동으로 정해집니다.
type Action = { type: 'increased' } | { type: 'reset'; to: number };

function reducer(state: number, action: Action): number {
  return action.type === 'increased' ? state + 1 : action.to;
}
// const [state, dispatch] = useReducer(reducer, 0);

// Context: 기본값이 없으면 null을 허용하고, 꺼내 쓰는 훅에서 한 번만 확인합니다.
interface Auth { userId: string; logout: () => void }
const AuthContext = createContext<Auth | null>(null);

function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider 안에서만 쓸 수 있습니다');
  return auth; // 여기서부터는 null이 아님이 보장됩니다
}`,
      },
    ],
    exercise: {
      id: 'ex-react-hooks',
      title: '훅에 타입 정보 채워 주기',
      prompt: '세 군데를 고쳐 보세요. (1) `user` 상태는 처음엔 null이고 로그인하면 `User`가 됩니다. (2) `inputRef`는 input 요소를 가리킵니다. (3) `useToggle`은 `[boolean, 함수]` 튜플을 돌려줘야 합니다.',
      jsx: true,
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
    <div>
      <input ref={inputRef} />
      <button onClick={login}>로그인</button>
      <p>{user ? user.name : '로그인해 주세요'}</p>
    </div>
  );
}

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle]; // TODO 3
}`,
      tests: `function Demo() {
  const [open, toggle] = useToggle();
  const flag: boolean = open;
  return (
    <div>
      <LoginBox />
      <button onClick={toggle}>{flag ? '닫기' : '열기'}</button>
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
    <div>
      <input ref={inputRef} />
      <button onClick={login}>로그인</button>
      <p>{user ? user.name : '로그인해 주세요'}</p>
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
          '컴포넌트가 마운트되기 전에는 current가 null이라서',
          'focus가 비동기 함수라서',
          'ref는 항상 undefined라서',
        ],
        answer: 1,
        explanation: '`useRef<HTMLInputElement>(null)`의 current 타입은 `HTMLInputElement | null`입니다. 실제로 첫 렌더링 중에는 null이므로 TS가 확인을 요구하는 것이 맞습니다.',
      },
    ],
  },

  {
    id: 'react-events',
    chapter: 'react',
    title: '이벤트와 폼: e의 타입은 무엇인가',
    summary: '`e.target.value`에 빨간 줄이 생기는 이유와, 이벤트 타입을 외우지 않고 찾는 방법.',
    minutes: 8,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: 'TS로 옮길 때 가장 먼저 막히는 곳',
        text: '`const handleChange = (e) => ...` — JS에서는 아무 문제 없던 이 한 줄에서 "Parameter \'e\' implicitly has an \'any\' type" 오류를 만나게 됩니다. 해결법은 두 가지이고 둘 다 간단합니다.',
      },
      { kind: 'h', text: '방법 1: 인라인으로 쓰면 추론됩니다' },
      {
        kind: 'playground',
        id: 'react-events-1',
        jsx: true,
        code: `import { useState } from 'react';

function Form() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}
      // JSX 안에 직접 쓰면 e의 타입을 TS가 압니다. e 위에 마우스를 올려 보세요.
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}`,
      },
      { kind: 'h', text: '방법 2: 핸들러를 따로 빼면 타입을 적습니다' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import type { ChangeEvent, KeyboardEvent, MouseEvent, SubmitEvent } from 'react';

// 형태: 이벤트종류<이벤트가 발생한 요소>
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
  console.log(e.target.value);
};

const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') { /* ... */ }
};

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};

const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
};`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '타입 이름을 외우지 마세요',
        text: '일단 JSX에 인라인으로 `onChange={(e) => {}}`를 쓰고 **`e` 위에 마우스를 올리면** 정확한 타입이 보입니다. 그걸 복사해서 쓰면 됩니다. 참고로 React 18 이하 프로젝트에서는 폼 제출 이벤트를 `FormEvent<HTMLFormElement>`로 적습니다.',
      },
      { kind: 'h', text: 'React Native는 더 단순합니다' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { TextInput, Pressable } from 'react-native';
import type { GestureResponderEvent, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// onChangeText는 이벤트 객체가 아니라 문자열을 바로 줍니다.
<TextInput onChangeText={(text) => setName(text)} />

// 대부분의 onPress는 이벤트를 쓰지 않으므로 () => void 로 충분합니다.
const handlePress = (e: GestureResponderEvent) => {
  console.log(e.nativeEvent.locationX);
};

const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  console.log(e.nativeEvent.contentOffset.y);
};`,
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: 'e.target과 e.currentTarget',
        text: '`currentTarget`은 **핸들러를 붙인 요소**라 타입이 정확합니다. `target`은 실제로 이벤트가 발생한 요소(자식일 수도 있음)라서 `onClick` 등에서는 `value` 같은 속성에 접근할 수 없습니다. 클릭/키보드 이벤트에서는 `currentTarget`을 쓰세요.',
      },
    ],
    exercise: {
      id: 'ex-react-events',
      title: '검색창 핸들러 타이핑',
      prompt: '따로 빼 둔 두 핸들러의 `e`에 타입이 없습니다. 알맞은 이벤트 타입을 import 해서 붙여 보세요.',
      jsx: true,
      starter: `import { useState } from 'react';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
}

function SearchBox({ onSearch }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');

  const handleChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch(keyword.trim());
  };

  return <input value={keyword} onChange={handleChange} onKeyDown={handleKeyDown} />;
}`,
      tests: `const box = <SearchBox onSearch={(keyword) => console.log(keyword.length)} />;`,
      solution: `import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
}

function SearchBox({ onSearch }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch(keyword.trim());
  };

  return <input value={keyword} onChange={handleChange} onKeyDown={handleKeyDown} />;
}`,
      hints: [
        '`import type { ChangeEvent, KeyboardEvent } from \'react\';` 를 추가하세요.',
        'onChange 핸들러는 `(e: ChangeEvent<HTMLInputElement>)` 입니다.',
        'onKeyDown 핸들러는 `(e: KeyboardEvent<HTMLInputElement>)` 입니다.',
      ],
    },
    quiz: [
      {
        id: 'q-react-events-1',
        question: '`<select onChange={handleChange}>`의 핸들러 매개변수 타입은?',
        options: [
          'ChangeEvent<HTMLInputElement>',
          'ChangeEvent<HTMLSelectElement>',
          'SelectEvent',
          'MouseEvent<HTMLSelectElement>',
        ],
        answer: 1,
        explanation: '꺾쇠 안에는 이벤트가 발생하는 요소의 타입이 들어갑니다. select 요소는 HTMLSelectElement입니다.',
      },
      {
        id: 'q-react-events-2',
        question: '이벤트 타입 이름이 기억나지 않을 때 가장 빠른 방법은?',
        options: [
          '`e: any`로 적는다',
          '핸들러를 JSX에 인라인으로 쓰고 e 위에 마우스를 올려 추론된 타입을 확인한다',
          '`// @ts-ignore`를 붙인다',
          '이벤트를 쓰지 않는다',
        ],
        answer: 1,
        explanation: 'JSX 속성에 직접 쓴 함수는 TS가 문맥에서 매개변수 타입을 추론합니다. 그 타입을 그대로 가져다 쓰면 됩니다.',
      },
    ],
  },
];
