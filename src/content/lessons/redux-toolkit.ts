import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'redux-toolkit',
  chapter: 'redux',
  title: 'Redux Toolkit: 타입은 스토어에서 뽑아 씁니다',
  summary: 'createSlice, RootState, 타입이 붙은 useSelector/useDispatch. 실무 설정을 직접 돌려 보며 그대로 가져갈 수 있게 익힙니다.',
  minutes: 14,
  steps: [
    {
      id: 'redux-toolkit-1',
      title: 'createSlice: 적는 타입은 state와 payload뿐',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '손으로 쓰던 것을 RTK가 대신 만듭니다',
          text: '액션 타입 상수, 액션 생성 함수, `switch` 리듀서를 따로 적던 Redux에, 앞 레슨에서는 액션 유니온까지 손으로 붙였습니다. `createSlice`는 리듀서만 보고 나머지를 **자동으로** 만듭니다. 우리가 적는 타입은 두 가지뿐입니다. state의 모양(5행)과 payload의 타입인 `PayloadAction<T>`(11, 14행).',
        },
        {
          kind: 'p',
          text: '콘솔 첫 줄이 24행의 `todoToggled(1)`이 만든 액션입니다. 타입 이름 `todos/todoToggled`는 슬라이스 이름과 리듀서 이름으로 지어집니다. 문자열 상수도, 액션 생성 함수도 따로 적지 않았습니다.',
        },
        {
          kind: 'p',
          text: '자동 생성된 함수는 payload 타입까지 검사합니다. 26행은 숫자 자리에 `\'1\'`을, 29행은 `Todo` 자리에 문자열을 넘겼습니다. 콘솔을 보면 1번은 **조용히 무시**됐고(`1 === \'1\'`은 false), 2번은 제목이 `undefined`인 항목이 목록에 끼었습니다. 두 버그 모두 빨간 줄이 먼저 알려 줍니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'action의 타입을 빼먹으면 payload는 any',
          text: '14행을 `todoToggled(state, action)`으로 바꿔 보세요. 오류는 나지 않고 payload가 조용히 `any`가 되어 26행의 빨간 줄이 **사라집니다**. 리듀서의 `action`에는 항상 `PayloadAction<T>`를 붙이세요. payload가 없는 액션은 `action`을 아예 적지 않습니다.',
        },
      ],
      code: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Todo { id: number; title: string; done: boolean }

const initialState: Todo[] = [{ id: 1, title: '타입 붙이기', done: false }];

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoAdded(state, action: PayloadAction<Todo>) {
      state.push(action.payload); // RTK에서는 직접 고쳐도 됩니다 (Immer)
    },
    todoToggled(state, action: PayloadAction<number>) {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
  },
});
const { todoAdded, todoToggled } = todosSlice.actions;
const store = configureStore({ reducer: todosSlice.reducer });
const show = () => store.getState().map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

console.log(todoToggled(1));

store.dispatch(todoToggled('1'));
console.log('1.', show());

store.dispatch(todoAdded('배포하기'));
console.log('2.', show());
`,
      mission: {
        text: '26행과 29행의 payload를 고치세요. 1번 할 일을 토글하고, `{ id: 2, title: \'배포하기\', done: false }`를 추가합니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['1. [x] 타입 붙이기', '[ ] 배포하기'] },
        hint: '`todoToggled(1)`, `todoAdded({ id: 2, title: \'배포하기\', done: false })`',
        answer: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Todo { id: number; title: string; done: boolean }

const initialState: Todo[] = [{ id: 1, title: '타입 붙이기', done: false }];

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoAdded(state, action: PayloadAction<Todo>) {
      state.push(action.payload); // RTK에서는 직접 고쳐도 됩니다 (Immer)
    },
    todoToggled(state, action: PayloadAction<number>) {
      const todo = state.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
  },
});
const { todoAdded, todoToggled } = todosSlice.actions;
const store = configureStore({ reducer: todosSlice.reducer });
const show = () => store.getState().map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

console.log(todoToggled(1));

store.dispatch(todoToggled(1));
console.log('1.', show());

store.dispatch(todoAdded({ id: 2, title: '배포하기', done: false }));
console.log('2.', show());
`,
      },
    },
    {
      id: 'redux-toolkit-2',
      title: 'initialState에 타입을 붙여야 하는 이유',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: 'state의 타입은 `initialState`에서 정해집니다. JS에서 하던 대로 10행처럼 값만 적으면 TS는 그 값에서 추론합니다. 빈 배열 `[]`은 "아무것도 넣을 수 없는 배열"(`never[]`)로, `\'all\'`은 그냥 `string`으로 추론됩니다.',
        },
        {
          kind: 'p',
          text: '결과가 두 가지로 나타납니다. 17행은 멀쩡한 코드인데 `Todo`를 넣을 수 없다는 **오류가 납니다**. 반대로 20행은 `\'all\'`을 `\'al\'`로 잘못 썼는데 `string`이면 무엇이든 통과라 **오류가 없습니다**. 콘솔의 state에 `filter: \'al\'`이 그대로 들어가 있습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '타입 한 줄이 두 문제를 모두 바로잡습니다',
          text: '10행에 `: TodosState`를 붙이면 17행의 오류는 사라지고, 20행의 오타에 빨간 줄이 생깁니다. 타입을 직접 써야 하는 "빈 값으로 시작하는 변수"가 바로 이런 경우입니다.',
        },
      ],
      code: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Todo { id: number; title: string; done: boolean }

interface TodosState {
  items: Todo[];
  filter: 'all' | 'done';
}

const initialState = { items: [], filter: 'all' };

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoAdded(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload);
    },
    filterReset(state) {
      state.filter = 'al';
    },
  },
});
const { todoAdded, filterReset } = todosSlice.actions;
const store = configureStore({ reducer: todosSlice.reducer });

store.dispatch(todoAdded({ id: 1, title: '타입 붙이기', done: false }));
store.dispatch(filterReset());
console.log(store.getState());
`,
      mission: {
        text: '10행의 `initialState`에 타입 표기 `: TodosState`를 붙이세요. 새로 빨개지는 20행의 오타를 고쳐 콘솔의 state에 `filter: \'all\'`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ["filter: 'all'"], codeIncludes: [': TodosState'] },
        hint: '`const initialState: TodosState = { items: [], filter: \'all\' };`',
        answer: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Todo { id: number; title: string; done: boolean }

interface TodosState {
  items: Todo[];
  filter: 'all' | 'done';
}

const initialState: TodosState = { items: [], filter: 'all' };

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoAdded(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload);
    },
    filterReset(state) {
      state.filter = 'all';
    },
  },
});
const { todoAdded, filterReset } = todosSlice.actions;
const store = configureStore({ reducer: todosSlice.reducer });

store.dispatch(todoAdded({ id: 1, title: '타입 붙이기', done: false }));
store.dispatch(filterReset());
console.log(store.getState());
`,
      },
    },
    {
      id: 'redux-toolkit-3',
      title: 'RootState는 스토어에서 뽑아냅니다',
      runner: 'console',
      errors: 1,
      throws: true,
      body: [
        {
          kind: 'p',
          text: '셀렉터와 `useSelector`에는 **스토어 전체 state의 타입**이 필요합니다. 19~22행처럼 손으로 적으면 슬라이스를 고칠 때마다 두 곳을 맞춰야 하고, 언젠가 어긋납니다. 지금이 그 상태입니다. 15행의 실제 키는 `cart`인데 20행에는 `cartItems`라고 적혀 있습니다.',
        },
        {
          kind: 'p',
          text: '콘솔을 보세요. 실제 state에는 `cart`가 있고, 24행의 `state.cartItems.count`는 `undefined`를 읽다가 크래시했습니다. 타입 검사는 28행에서 "실제 state에는 `cartItems`가 없다"고 알려 줍니다. 틀린 것은 손으로 적은 타입이고, 그 타입을 믿고 쓴 24행의 셀렉터에는 빨간 줄조차 없습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '손으로 적지 않고 값에서 뽑기',
          code: `type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;`,
        },
        {
          kind: 'p',
          text: '유틸리티 타입 레슨의 `typeof`와 `ReturnType`입니다. "`store.getState`가 돌려주는 값의 타입"이라는 뜻이라, 슬라이스를 더하거나 고치면 저절로 따라옵니다. 셀렉터는 매개변수에 `RootState`만 붙이면 반환 타입까지 추론됩니다. `AppDispatch`는 5단계에서 씁니다.',
        },
      ],
      code: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { count: 0 },
  reducers: {
    added(state, action: PayloadAction<number>) {
      state.count += action.payload;
    },
  },
});
const userSlice = createSlice({ name: 'user', initialState: { name: '김코딩' }, reducers: {} });

const store = configureStore({
  reducer: { cart: cartSlice.reducer, user: userSlice.reducer },
});

// 전체 state의 타입을 손으로 적었습니다
interface RootState {
  cartItems: { count: number };
  user: { name: string };
}

const selectCount = (state: RootState) => state.cartItems.count;

store.dispatch(cartSlice.actions.added(2));
console.log(store.getState());
console.log('담은 개수:', selectCount(store.getState()));
`,
      mission: {
        text: '19~22행의 `interface RootState`를 지우고 `ReturnType<typeof store.getState>`로 바꾸세요. 오류가 28행에서 실제로 크래시한 셀렉터로 옮겨 갑니다. 셀렉터를 고쳐 `담은 개수: 2`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['담은 개수: 2'], codeIncludes: ['ReturnType<typeof store.getState>'] },
        hint: '`type RootState = ReturnType<typeof store.getState>;` 그리고 셀렉터는 `state.cart.count`',
        answer: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { count: 0 },
  reducers: {
    added(state, action: PayloadAction<number>) {
      state.count += action.payload;
    },
  },
});
const userSlice = createSlice({ name: 'user', initialState: { name: '김코딩' }, reducers: {} });

const store = configureStore({
  reducer: { cart: cartSlice.reducer, user: userSlice.reducer },
});

// 전체 state의 타입을 스토어에서 뽑아냅니다
type RootState = ReturnType<typeof store.getState>;

const selectCount = (state: RootState) => state.cart.count;

store.dispatch(cartSlice.actions.added(2));
console.log(store.getState());
console.log('담은 개수:', selectCount(store.getState()));
`,
      },
    },
    {
      id: 'redux-toolkit-4',
      title: 'useAppSelector: state를 아는 useSelector',
      runner: 'react',
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`useSelector`는 우리 스토어의 모양을 모릅니다. 타입 없이 `(state) => ...`라고 쓰면 `state`는 `unknown`이라 아무것도 꺼낼 수 없습니다. 급한 마음에 16행처럼 `any`를 붙이면 오류는 사라지지만 검사도 함께 꺼집니다.',
        },
        {
          kind: 'p',
          text: '16행은 `state.todos`를 `state.todo`로 잘못 썼습니다. 타입 오류는 **0개**인데 미리보기는 크래시했습니다. `todos`가 `undefined`라 19행의 `.map`에서 멈춘 것입니다. `any`가 아래로 번져서 19행의 `t`에도 타입을 다시 적어야 했습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'RootState를 미리 채운 훅',
          code: `const useAppSelector = useSelector.withTypes<RootState>();

// state는 RootState, 결과 타입도 추론됩니다
const todos = useAppSelector((state) => state.todos);`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '앱 전체에서 이 훅만 씁니다',
          text: '`useAppSelector`는 스토어 파일에서 한 번 만들어 export 합니다. 컴포넌트에서는 `useSelector` 대신 이것만 import 하면 `state.`에서 자동완성이 되고, 오타는 빨간 줄이 됩니다.',
        },
      ],
      code: `import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useSelector } from 'react-redux';

interface Todo { id: number; title: string; done: boolean }

const initialState: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];
const todosSlice = createSlice({ name: 'todos', initialState, reducers: {} });

const store = configureStore({ reducer: { todos: todosSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;

function TodoList() {
  const todos = useSelector((state: any) => state.todo);
  return (
    <ul>
      {todos.map((t: Todo) => (
        <li key={t.id}>{t.done ? '완료' : '진행 중'} · {t.title}</li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <TodoList />
    </Provider>
  );
}
`,
      mission: {
        text: '`useAppSelector`를 만들어 16행의 `useSelector`와 `any`를 대체하세요. 그러면 오타에 빨간 줄이 생깁니다. 고쳐서 미리보기에 할 일 목록이 나오게 하세요. 19행의 `: Todo`도 이제 필요 없습니다.',
        goal: { noTypeErrors: true, previewIncludes: ['타입 붙이기', '배포하기'], codeIncludes: ['useAppSelector'], codeExcludes: ['any'] },
        hint: '`const useAppSelector = useSelector.withTypes<RootState>();` 를 13행 아래에 두고, `useAppSelector((state) => state.todos)`',
        answer: `import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useSelector } from 'react-redux';

interface Todo { id: number; title: string; done: boolean }

const initialState: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];
const todosSlice = createSlice({ name: 'todos', initialState, reducers: {} });

const store = configureStore({ reducer: { todos: todosSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
const useAppSelector = useSelector.withTypes<RootState>();

function TodoList() {
  const todos = useAppSelector((state) => state.todos);
  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>{t.done ? '완료' : '진행 중'} · {t.title}</li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <TodoList />
    </Provider>
  );
}
`,
      },
    },
    {
      id: 'redux-toolkit-5',
      title: 'useAppDispatch: thunk를 아는 dispatch',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '`dispatch`도 같은 문제가 있습니다. 평범한 `useDispatch()`가 돌려주는 함수는 **액션 객체만** 받는다고 알고 있습니다. 그래서 `dispatch(added(1))`은 통과하지만, 함수를 디스패치하는 thunk(19행)를 넘긴 32행은 오류입니다.',
        },
        {
          kind: 'p',
          text: '미리보기에서 "0.5초 뒤 +10"을 눌러 보세요. **잘 동작합니다.** `configureStore`가 thunk 미들웨어를 기본으로 넣어 주기 때문입니다. 이번 빨간 줄은 버그가 아니라 타입 정보가 모자라다는 신호입니다. 이 스토어의 dispatch가 thunk도 받는다는 사실은 스토어에서 뽑아낸 `AppDispatch`(17행)에 들어 있습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '스토어의 dispatch 타입을 채운 훅',
          code: `const useAppDispatch = useDispatch.withTypes<AppDispatch>();`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '이 사이트의 소스가 예제입니다',
          text: '지금 보고 있는 학습 진도(미션 달성, 퀴즈 답)가 정확히 이 구조로 저장됩니다. GitHub 저장소의 `src/store/progressSlice.ts`와 `src/store/index.ts`를 열어 보세요. `RootState`, `AppDispatch`, 그리고 두 훅이 그대로 있습니다. 스토어 파일에 이 네 줄을 두는 것이 RTK + TS의 표준 설정입니다.',
        },
      ],
      code: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    added(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});
const { added } = counterSlice.actions;

const store = configureStore({ reducer: { counter: counterSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

const addLater = (amount: number) => (dispatch: AppDispatch) => {
  setTimeout(() => dispatch(added(amount)), 500);
};

const useAppSelector = useSelector.withTypes<RootState>();

function Counter() {
  const value = useAppSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  return (
    <div className="row">
      <span className="badge info">값: {value}</span>
      <button onClick={() => dispatch(added(1))}>+1</button>
      <button onClick={() => dispatch(addLater(10))}>0.5초 뒤 +10</button>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
`,
      mission: {
        text: '23행 아래에 `useAppDispatch`를 만들고, 27행의 `useDispatch()`를 `useAppDispatch()`로 바꿔 오류를 없애세요. 32행의 `dispatch(addLater(10))`은 그대로 두고, `any`로 덮지도 않습니다. 그런 다음 버튼 두 개를 눌러 보세요.',
        goal: { noTypeErrors: true, previewIncludes: ['0.5초 뒤 +10'], codeIncludes: ['dispatch(addLater(10))'], codeExcludes: ['any'] },
        hint: '`const useAppDispatch = useDispatch.withTypes<AppDispatch>();`',
        answer: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    added(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});
const { added } = counterSlice.actions;

const store = configureStore({ reducer: { counter: counterSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

const addLater = (amount: number) => (dispatch: AppDispatch) => {
  setTimeout(() => dispatch(added(amount)), 500);
};

const useAppSelector = useSelector.withTypes<RootState>();
const useAppDispatch = useDispatch.withTypes<AppDispatch>();

function Counter() {
  const value = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();
  return (
    <div className="row">
      <span className="badge info">값: {value}</span>
      <button onClick={() => dispatch(added(1))}>+1</button>
      <button onClick={() => dispatch(addLater(10))}>0.5초 뒤 +10</button>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-redux-toolkit',
    title: '장바구니 슬라이스에 타입 입히기',
    prompt: 'JS로 쓰던 장바구니 슬라이스를 그대로 옮겨 왔습니다. (1) state의 모양을 타입으로 선언해 `initialState`에 붙이고, (2) 두 리듀서의 `action`에 `PayloadAction<...>`을 붙이고, (3) `RootState`를 손으로 적지 말고 스토어에서 뽑아내세요. 리듀서 본문과 셀렉터는 고치지 않아도 됩니다.',
    runner: 'console',
    starter: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  title: string;
  qty: number;
}

// TODO 1: state의 모양을 타입으로 선언해 initialState에 붙이세요.
const initialState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // TODO 2: 두 action에 PayloadAction<...>을 붙이세요.
    // itemAdded의 payload는 CartItem, qtyChanged의 payload는 { id, qty } 입니다.
    itemAdded(state, action) {
      state.items.push(action.payload);
    },
    qtyChanged(state, action) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.qty = action.payload.qty;
    },
  },
});
const { itemAdded, qtyChanged } = cartSlice.actions;

const store = configureStore({ reducer: { cart: cartSlice.reducer } });

// TODO 3: 스토어에서 뽑아내세요.
type RootState = {};

const selectTotalQty = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.qty, 0);`,
    tests: `store.dispatch(itemAdded({ id: 'p1', title: '기계식 키보드', qty: 1 }));
store.dispatch(itemAdded({ id: 'p2', title: '무선 마우스', qty: 2 }));
store.dispatch(qtyChanged({ id: 'p1', qty: 3 }));

const total: number = selectTotalQty(store.getState());
console.log(store.getState().cart.items);
console.log('총 수량:', total);

// @ts-expect-error title이 빠졌습니다
itemAdded({ id: 'p3', qty: 1 });
// @ts-expect-error qty는 숫자여야 합니다
qtyChanged({ id: 'p1', qty: '3' });
// @ts-expect-error cart 슬라이스에 item이라는 속성은 없습니다
store.getState().cart.item;`,
    solution: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  title: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded(state, action: PayloadAction<CartItem>) {
      state.items.push(action.payload);
    },
    qtyChanged(state, action: PayloadAction<{ id: string; qty: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.qty = action.payload.qty;
    },
  },
});
const { itemAdded, qtyChanged } = cartSlice.actions;

const store = configureStore({ reducer: { cart: cartSlice.reducer } });

type RootState = ReturnType<typeof store.getState>;

const selectTotalQty = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.qty, 0);`,
    hints: [
      '`interface CartState { items: CartItem[] }`를 만들고 `const initialState: CartState = { items: [] };`',
      '`itemAdded(state, action: PayloadAction<CartItem>)`, `qtyChanged(state, action: PayloadAction<{ id: string; qty: number }>)`',
      '`type RootState = ReturnType<typeof store.getState>;`',
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
      explanation: '타입을 손으로 적으면 리듀서를 고칠 때마다 두 곳을 맞춰야 하고, 3단계에서 본 것처럼 어긋나면 오류가 엉뚱한 곳에 납니다. 스토어에서 뽑아내면 실제 코드가 유일한 기준이 됩니다. 타입은 빌드 때 지워지므로 번들이나 속도와는 무관합니다.',
    },
    {
      id: 'q-redux-toolkit-2',
      question: '`todoToggled(state, action: PayloadAction<number>)`로 선언한 리듀서의 액션을 올바르게 디스패치한 것은?',
      options: [
        'dispatch(todoToggled({ id: 1 }))',
        "dispatch(todoToggled('1'))",
        'dispatch(todoToggled(1))',
        "dispatch({ type: 'todoToggled' })",
      ],
      answer: 2,
      explanation: '`PayloadAction<number>`는 payload가 number라는 뜻이고, 자동 생성된 액션 생성 함수는 그 payload를 인자로 받습니다. 액션의 실제 type은 `todos/todoToggled`처럼 슬라이스 이름이 앞에 붙습니다.',
    },
    {
      id: 'q-redux-toolkit-3',
      question: '`useSelector((state: any) => state.todo.items)`에서 `todo`가 오타(`todos`가 맞음)일 때 일어나는 일은?',
      options: [
        '타입 오류가 나서 빌드 전에 알 수 있다',
        '타입 오류 없이 통과하고, 실행하면 undefined를 읽다가 크래시한다',
        'react-redux가 자동으로 올바른 키를 찾아 준다',
        'any 덕분에 런타임에서도 안전하게 무시된다',
      ],
      answer: 1,
      explanation: '`any`는 검사를 끄는 스위치입니다. 4단계의 미리보기 크래시가 바로 이 경우였습니다. `useSelector.withTypes<RootState>()`로 만든 `useAppSelector`를 쓰면 같은 오타가 빨간 줄이 됩니다.',
    },
  ],
};
