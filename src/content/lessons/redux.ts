import type { Lesson } from '../types';

export const reduxLessons: Lesson[] = [
  {
    id: 'redux-actions',
    chapter: 'redux',
    title: '액션과 리듀서: 판별 유니온의 교과서',
    summary: '손으로 쓰던 액션 타입 상수와 switch 리듀서가 TS에서 어떻게 안전해지는지 봅니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '리덕스를 써 봤다면 유리합니다',
        text: '`switch (action.type)`으로 분기하고 `action.payload`를 꺼내 쓰는 리듀서. 여기서 자주 나던 버그는 **액션 타입 오타**와 **payload 모양 착각**이었죠. 레슨 3의 판별 유니온이 정확히 이 두 가지를 잡습니다. `action.type`이 바로 그 "꼬리표"입니다.',
      },
      {
        kind: 'compare',
        js: `const ADD_TODO = 'todos/added';
const TOGGLE_TODO = 'todos/toggled';

function reducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    case TOGGLE_TODO:
      // payload가 id였나? { id }였나?
      return state.map((t) =>
        t.id === action.payload.id
          ? { ...t, done: !t.done }
          : t
      );
    default:
      return state;
  }
}`,
        ts: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[] = [], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload]; // payload는 Todo
    case 'todos/toggled':
      return state.map((t) =>
        t.id === action.payload.id       // payload는 { id }
          ? { ...t, done: !t.done }
          : t
      );
    default:
      return state;
  }
}`,
        caption: '상수를 따로 만들 필요가 없습니다. 문자열 리터럴 자체가 타입이라 오타는 곧 오류입니다.',
      },
      {
        kind: 'playground',
        id: 'redux-actions-1',
        code: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } }
  | { type: 'todos/cleared' };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    case 'todos/cleared':
      return [];
    case 'todos/remove': // ← 오류: 존재하지 않는 액션
      return state;
  }
}

declare function dispatch(action: TodoAction): void;

dispatch({ type: 'todos/toggled', payload: { id: 1 } }); // OK
dispatch({ type: 'todos/toggled', payload: 1 });         // ← 오류: payload 모양이 다름
dispatch({ type: 'todos/add' });                         // ← 오류: 오타`,
        caption: '`case` 안에서 `action.payload.` 을 입력해 자동완성이 분기마다 달라지는 걸 확인해 보세요.',
      },
      { kind: 'h', text: '빠뜨린 case 잡아내기: never' },
      {
        kind: 'p',
        text: '액션이 늘어났는데 리듀서에 case를 추가하는 걸 잊는 실수도 잡을 수 있습니다. 모든 case를 처리하고 나면 `default`에 도달하는 action은 "있을 수 없는 값", 즉 `never` 타입이 됩니다. never 변수에 대입해 두면 **새 액션이 추가되는 순간 여기서 오류**가 납니다.',
      },
      {
        kind: 'code',
        lang: 'ts',
        code: `function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map(/* ... */);
    default: {
      // TodoAction에 'todos/cleared'를 추가하면 이 줄이 빨개집니다.
      const unreachable: never = action;
      return state;
    }
  }
}`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'useReducer에도 그대로',
        text: '이 패턴은 Redux 전용이 아닙니다. `useReducer`, 상태 머신, 웹소켓 메시지 처리 등 "종류에 따라 내용물이 다른 데이터"를 다루는 모든 곳에 똑같이 씁니다.',
      },
    ],
    exercise: {
      id: 'ex-redux-actions',
      title: '장바구니 액션 유니온 만들기',
      prompt: '`CartAction`이 너무 느슨해서 리듀서가 payload를 믿지 못하고 있습니다. 세 가지 액션의 판별 유니온으로 바꿔 보세요: `cart/added`(payload: CartItem), `cart/removed`(payload: `{ id: string }`), `cart/cleared`(payload 없음).',
      starter: `interface CartItem {
  id: string;
  name: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

// TODO: 세 가지 액션의 판별 유니온으로 바꾸세요.
type CartAction = { type: string; payload?: unknown };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'cart/added':
      return { items: [...state.items, action.payload] };
    case 'cart/removed':
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    case 'cart/cleared':
      return { items: [] };
    default: {
      const unreachable: never = action;
      return state;
    }
  }
}`,
      tests: `const empty: CartState = { items: [] };
const one = cartReducer(empty, { type: 'cart/added', payload: { id: 'a', name: '키보드', qty: 1 } });
cartReducer(one, { type: 'cart/removed', payload: { id: 'a' } });
cartReducer(one, { type: 'cart/cleared' });

// @ts-expect-error 오타가 난 액션 타입입니다
cartReducer(one, { type: 'cart/add' });
// @ts-expect-error payload 모양이 다릅니다
cartReducer(one, { type: 'cart/removed', payload: 'a' });`,
      solution: `interface CartItem {
  id: string;
  name: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'cart/added'; payload: CartItem }
  | { type: 'cart/removed'; payload: { id: string } }
  | { type: 'cart/cleared' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'cart/added':
      return { items: [...state.items, action.payload] };
    case 'cart/removed':
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    case 'cart/cleared':
      return { items: [] };
    default: {
      const unreachable: never = action;
      return state;
    }
  }
}`,
      hints: [
        '유니온의 각 멤버는 `{ type: \'cart/added\'; payload: CartItem }` 같은 객체 타입입니다.',
        '멤버들을 `|` 로 이어 붙입니다. 첫 줄 앞에도 `|`를 써도 됩니다.',
        'payload가 없는 액션은 `{ type: \'cart/cleared\' }` 처럼 type만 적습니다.',
      ],
    },
    quiz: [
      {
        id: 'q-redux-actions-1',
        question: '리듀서의 `default`에서 `const x: never = action` 을 쓰는 목적은?',
        options: [
          '성능을 높이기 위해',
          '런타임에 에러를 던지기 위해',
          '처리하지 않은 액션 종류가 생기면 컴파일 오류로 알려 주기 위해',
          'action을 삭제하기 위해',
        ],
        answer: 2,
        explanation: '모든 case를 처리했다면 default의 action은 never입니다. 새 액션이 추가돼 처리되지 않은 종류가 남으면 never에 대입할 수 없어 오류가 납니다.',
      },
      {
        id: 'q-redux-actions-2',
        question: '`case \'todos/toggled\':` 블록 안에서 `action.payload`의 타입이 `{ id: number }`로 정해지는 이유는?',
        options: [
          'TS가 리덕스를 특별히 지원해서',
          'action.type을 검사했기 때문에 유니온에서 해당 멤버로 좁혀져서',
          'payload라는 이름이 예약어라서',
          'switch문 안에서는 모든 타입이 any가 돼서',
        ],
        answer: 1,
        explanation: '리덕스와는 무관한 TS의 일반 기능(좁히기)입니다. 꼬리표 속성을 검사하면 그 값을 가진 멤버만 남습니다.',
      },
    ],
  },

  {
    id: 'redux-toolkit',
    chapter: 'redux',
    title: 'Redux Toolkit: 타입은 스토어에서 뽑아 씁니다',
    summary: 'createSlice, RootState, 타입이 붙은 useSelector/useDispatch. 실무 설정을 그대로 가져갈 수 있게 정리했습니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '손으로 쓰던 유니온은 RTK가 대신 만듭니다',
        text: '앞 레슨의 액션 유니온을 매번 손으로 적지는 않습니다. Redux Toolkit의 `createSlice`가 리듀서 함수의 시그니처를 보고 **액션 생성 함수와 타입을 자동으로** 만들어 줍니다. 우리가 적는 건 state의 모양과 payload의 타입 두 가지뿐입니다.',
      },
      {
        kind: 'code',
        lang: 'ts',
        title: 'features/todos/todosSlice.ts',
        code: `import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Todo { id: number; title: string; done: boolean }

interface TodosState {
  items: Todo[];
  filter: 'all' | 'active' | 'done';
}

// initialState에 타입을 붙이는 것이 핵심입니다. state의 타입이 여기서 결정됩니다.
const initialState: TodosState = { items: [], filter: 'all' };

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // PayloadAction<T>: "payload가 T인 액션"
    todoAdded(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload); // Immer 덕분에 직접 수정 OK
    },
    todoToggled(state, action: PayloadAction<number>) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    filterChanged(state, action: PayloadAction<TodosState['filter']>) {
      state.filter = action.payload;
    },
  },
});

export const { todoAdded, todoToggled, filterChanged } = todosSlice.actions;
export default todosSlice.reducer;

// 자동 생성된 액션 생성 함수도 타입이 붙어 있습니다.
// todoToggled(1)        → OK
// todoToggled('1')      → 오류
// filterChanged('archived') → 오류`,
      },
      { kind: 'h', text: '스토어에서 타입 뽑아내기' },
      {
        kind: 'code',
        lang: 'ts',
        title: 'app/store.ts',
        code: `import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import todosReducer from '../features/todos/todosSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: { todos: todosReducer, auth: authReducer },
});

// 전체 state의 타입을 손으로 적지 않고, 스토어에서 뽑아냅니다. (레슨 5의 typeof + ReturnType)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 타입이 미리 채워진 훅. 앱에서는 useSelector/useDispatch 대신 이 둘만 씁니다.
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();`,
      },
      {
        kind: 'compare',
        jsLabel: '타입 없는 훅',
        tsLabel: '타입이 붙은 훅',
        js: `// state가 무엇인지 모릅니다.
const filter = useSelector(
  (state) => state.todo.filter // 오타여도 모름
);

const dispatch = useDispatch();
dispatch(todoToggled('1')); // 런타임에 조용히 실패`,
        ts: `// state는 RootState. 자동완성이 됩니다.
const filter = useAppSelector(
  (state) => state.todos.filter // 'all' | 'active' | 'done'
);

const dispatch = useAppDispatch();
dispatch(todoToggled(1)); // payload 타입까지 검사`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '이 사이트의 소스가 예제입니다',
        text: '지금 보고 있는 학습 진도(완료 체크, 퀴즈 답)가 정확히 이 구조로 저장됩니다. 저장소의 `src/store/progressSlice.ts`와 `src/store/index.ts`를 열어 보세요. 60줄 남짓한 실제 동작 코드입니다.',
      },
      { kind: 'h', text: '셀렉터와 mapState' },
      {
        kind: 'code',
        lang: 'ts',
        code: `import type { RootState } from '../../app/store';

// 셀렉터는 매개변수에 RootState만 붙이면 반환 타입은 추론됩니다.
export const selectVisibleTodos = (state: RootState) => {
  const { items, filter } = state.todos;
  if (filter === 'all') return items;
  return items.filter((t) => (filter === 'done' ? t.done : !t.done));
};

// 예전 connect() 방식 코드를 옮길 때도 같습니다.
const mapState = (state: RootState) => ({ todos: selectVisibleTodos(state) });`,
      },
    ],
    exercise: {
      id: 'ex-redux-toolkit',
      title: '미니 createAction 만들기',
      prompt: 'RTK 내부에서 벌어지는 일을 작게 재현해 봅니다. (1) `createAction`에 제네릭을 붙여, payload 타입 `P`를 받아 `PayloadAction<P>`를 만드는 함수를 돌려주게 하세요. (2) `RootState`를 손으로 다시 적지 말고 `initialState` 값에서 뽑아내세요.',
      starter: `interface PayloadAction<P> {
  type: string;
  payload: P;
}

// TODO 1: 제네릭 P를 추가하세요.
function createAction(type) {
  return (payload) => ({ type, payload });
}

const initialState = {
  todos: ['TS 공부하기'],
  filter: 'all' as 'all' | 'done',
};

// TODO 2: initialState에서 타입을 뽑아내세요.
type RootState = {};

const selectCount = (state: RootState) => state.todos.length;`,
      tests: `const todoAdded = createAction<{ id: number; title: string }>('todos/added');
const filterChanged = createAction<'all' | 'done'>('filter/changed');

const a1: PayloadAction<{ id: number; title: string }> = todoAdded({ id: 1, title: 'TS' });
const a2 = filterChanged('done');
const picked: 'all' | 'done' = a2.payload;
const total: number = selectCount(initialState);

// @ts-expect-error title이 빠졌습니다
todoAdded({ id: 2 });
// @ts-expect-error 없는 필터입니다
filterChanged('archived');`,
      solution: `interface PayloadAction<P> {
  type: string;
  payload: P;
}

function createAction<P>(type: string) {
  return (payload: P): PayloadAction<P> => ({ type, payload });
}

const initialState = {
  todos: ['TS 공부하기'],
  filter: 'all' as 'all' | 'done',
};

type RootState = typeof initialState;

const selectCount = (state: RootState) => state.todos.length;`,
      hints: [
        '`function createAction<P>(type: string)` 처럼 함수 이름 뒤에 `<P>`를 선언합니다.',
        '안쪽 화살표 함수는 `(payload: P): PayloadAction<P> => ...` 입니다.',
        '값에서 타입을 뽑는 연산자는 `typeof` 입니다: `type RootState = typeof initialState;`',
      ],
    },
    quiz: [
      {
        id: 'q-redux-toolkit-1',
        question: '`RootState`를 `ReturnType<typeof store.getState>`로 정의하는 가장 큰 이유는?',
        options: [
          '번들 크기가 줄어서',
          '슬라이스가 추가되거나 바뀌어도 타입이 자동으로 따라와서',
          'RTK가 다른 방식을 허용하지 않아서',
          '실행 속도가 빨라져서',
        ],
        answer: 1,
        explanation: '타입을 손으로 적으면 리듀서를 고칠 때마다 두 곳을 맞춰야 합니다. 스토어에서 뽑아내면 실제 코드가 유일한 기준이 됩니다. 타입은 빌드 때 지워지므로 번들이나 속도와는 무관합니다.',
      },
      {
        id: 'q-redux-toolkit-2',
        question: '`todoToggled(state, action: PayloadAction<number>)` 로 선언한 리듀서의 액션을 올바르게 디스패치한 것은?',
        options: [
          "dispatch(todoToggled({ id: 1 }))",
          "dispatch(todoToggled('1'))",
          'dispatch(todoToggled(1))',
          "dispatch({ type: 'todoToggled' })",
        ],
        answer: 2,
        explanation: 'PayloadAction<number>는 payload가 number라는 뜻이고, 자동 생성된 액션 생성 함수는 그 payload를 인자로 받습니다.',
      },
    ],
  },

  {
    id: 'async',
    chapter: 'redux',
    title: '비동기와 API: 서버 응답에 타입 입히기',
    summary: 'fetch 결과는 any입니다. 응답 타입을 선언하고, 로딩/성공/실패 상태를 "불가능한 조합 없이" 표현합니다.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '익숙한 state 모양',
        text: '`{ loading: false, data: null, error: null }` — thunk나 saga로 API를 붙일 때 늘 만들던 모양입니다. 그런데 이 구조는 `loading: true`이면서 `error`도 있는 **말이 안 되는 상태**를 막지 못합니다. 판별 유니온으로 바꾸면 그런 조합 자체가 타입 오류가 됩니다.',
      },
      { kind: 'h', text: 'API 함수: 반환 타입을 약속하기' },
      {
        kind: 'code',
        lang: 'ts',
        code: `interface Post {
  id: number;
  title: string;
  author: { id: number; name: string };
}

// res.json()은 Promise<any>를 돌려줍니다. 반환 타입을 적어 "이 모양일 것"이라고 선언합니다.
async function fetchPosts(page: number): Promise<Post[]> {
  const res = await fetch('/api/posts?page=' + page);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// axios는 제네릭으로 받습니다.
// const { data } = await axios.get<Post[]>('/api/posts');

const posts = await fetchPosts(1);
posts[0].author.name; // 자동완성 + 오타 검사`,
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: '타입은 서버를 검사하지 않습니다',
        text: '`Promise<Post[]>`는 **약속**일 뿐, 서버가 실제로 그 모양을 보내는지는 확인하지 않습니다. 타입은 빌드 때 지워지니까요. 백엔드와 타입을 공유(OpenAPI 등으로 생성)하거나, 중요한 응답은 zod 같은 라이브러리로 런타임 검증을 더합니다.',
      },
      { kind: 'h', text: '요청 상태를 판별 유니온으로' },
      {
        kind: 'playground',
        id: 'async-1',
        code: `interface Post { id: number; title: string }

// Before: 불가능한 조합을 막지 못함
interface LooseState {
  loading: boolean;
  data: Post[] | null;
  error: string | null;
}
const weird: LooseState = { loading: true, data: [], error: '실패' }; // 통과해 버림

// After: 상태마다 가질 수 있는 데이터가 정해짐
type PostsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Post[] }
  | { status: 'error'; message: string };

function view(state: PostsState): string {
  state.data; // ← 오류: 성공 상태인지 아직 모름

  switch (state.status) {
    case 'idle':
      return '';
    case 'loading':
      return '불러오는 중';
    case 'success':
      return state.data.length + '개'; // data가 반드시 있음 (null 체크 불필요)
    case 'error':
      return state.message;
  }
}

const bad: PostsState = { status: 'loading', data: [] }; // ← 오류`,
        caption: '`if (data && !loading && !error)` 같은 방어 코드가 사라집니다.',
      },
      { kind: 'h', text: 'createAsyncThunk' },
      {
        kind: 'code',
        lang: 'ts',
        code: `import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// 반환 타입(Post[])과 인자 타입(number)은 함수에서 추론됩니다.
export const loadPosts = createAsyncThunk('posts/load', async (page: number) => {
  return fetchPosts(page);
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: { status: 'idle' } as PostsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPosts.pending, () => ({ status: 'loading' }))
      .addCase(loadPosts.fulfilled, (_state, action) => ({
        status: 'success',
        data: action.payload, // Post[] 로 추론됨
      }))
      .addCase(loadPosts.rejected, (_state, action) => ({
        status: 'error',
        message: action.error.message ?? '알 수 없는 오류',
      }));
  },
});

// dispatch(loadPosts(1))    → OK
// dispatch(loadPosts('1'))  → 오류`,
      },
      { kind: 'h', text: 'catch의 error는 unknown' },
      {
        kind: 'code',
        lang: 'ts',
        code: `try {
  await fetchPosts(1);
} catch (error) {
  // JS에서는 무엇이든 throw할 수 있으므로 error의 타입은 unknown입니다.
  // error.message  ← 오류

  const message = error instanceof Error ? error.message : String(error);
  console.log(message);
}`,
      },
    ],
    exercise: {
      id: 'ex-async',
      title: '요청 상태 다시 설계하기',
      prompt: '(1) `RequestState`를 네 가지 상태의 판별 유니온으로 바꾸세요: `idle`, `loading`, `success`(data: Post[]), `error`(error: string). (2) `fetchPosts`가 `Post[]`를 담은 Promise를 돌려준다고 반환 타입을 선언하세요.',
      starter: `interface Post {
  id: number;
  title: string;
}

// TODO 1: 판별 유니온으로 바꾸세요.
type RequestState = { status: string; data?: Post[]; error?: string };

// TODO 2: 반환 타입을 적으세요.
async function fetchPosts() {
  const res = await fetch('/api/posts');
  return res.json();
}

function render(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return '대기 중';
    case 'loading':
      return '불러오는 중...';
    case 'success':
      return state.data.length + '개의 글';
    case 'error':
      return '실패: ' + state.error.toUpperCase();
  }
}`,
      tests: `render({ status: 'idle' });
render({ status: 'success', data: [{ id: 1, title: '첫 글' }] });
render({ status: 'error', error: 'timeout' });

fetchPosts().then((posts) => {
  const title: string = posts[0].title;
  // @ts-expect-error Post에는 body가 없습니다
  posts[0].body;
});

// @ts-expect-error success에는 data가 반드시 있어야 합니다
render({ status: 'success' });
// @ts-expect-error loading 상태에는 data가 없습니다
render({ status: 'loading', data: [] });`,
      solution: `interface Post {
  id: number;
  title: string;
}

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Post[] }
  | { status: 'error'; error: string };

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  return res.json();
}

function render(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return '대기 중';
    case 'loading':
      return '불러오는 중...';
    case 'success':
      return state.data.length + '개의 글';
    case 'error':
      return '실패: ' + state.error.toUpperCase();
  }
}`,
      hints: [
        '`status`가 꼬리표입니다. 상태마다 `{ status: \'idle\' }` 같은 객체 타입을 만들어 `|`로 묶으세요.',
        'success에만 `data: Post[]`, error에만 `error: string`을 넣습니다. `?`는 필요 없습니다.',
        'async 함수의 반환 타입은 `Promise<...>` 로 감쌉니다: `Promise<Post[]>`',
      ],
    },
    quiz: [
      {
        id: 'q-async-1',
        question: '`async function getUser(): Promise<User>` 라고 선언했는데 서버가 다른 모양의 JSON을 보내면?',
        options: [
          '컴파일 오류가 난다',
          'TS가 런타임에 자동으로 예외를 던진다',
          '아무 오류 없이 진행되다가, 없는 속성을 쓰는 지점에서 런타임 문제가 생긴다',
          'fetch가 실패한다',
        ],
        answer: 2,
        explanation: '타입은 빌드 때 지워지므로 런타임 데이터를 검사하지 않습니다. 외부에서 들어오는 데이터의 타입은 "약속"이며, 확실히 하려면 런타임 검증이 필요합니다.',
      },
      {
        id: 'q-async-2',
        question: '`{ loading, data, error }` 대신 판별 유니온으로 상태를 표현할 때의 장점이 **아닌** 것은?',
        options: [
          '로딩 중인데 에러도 있는 불가능한 조합을 만들 수 없다',
          'success 분기에서 data의 null 체크가 필요 없다',
          '새 상태를 추가하면 처리하지 않은 곳을 컴파일러가 알려 준다',
          'API 호출 속도가 빨라진다',
        ],
        answer: 3,
        explanation: '타입은 실행 성능에 영향을 주지 않습니다. 나머지 셋이 판별 유니온으로 얻는 실질적인 이점입니다.',
      },
    ],
  },
];
