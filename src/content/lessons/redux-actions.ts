import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'redux-actions',
  chapter: 'redux',
  title: '액션과 리듀서: 판별 유니온의 교과서',
  summary: '손으로 쓰던 액션 타입 상수와 switch 리듀서가 TS에서 어떻게 안전해지는지, 버그를 직접 실행해 보며 확인합니다.',
  minutes: 14,
  steps: [
    {
      id: 'redux-actions-1',
      title: '느슨한 action: 버그 세 개가 그대로 통과합니다',
      runner: 'console',
      throws: true,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '리덕스에서 가장 자주 나던 버그 두 가지',
          text: '`switch (action.type)`으로 분기하고 `action.payload`를 꺼내 쓰는 리듀서. 여기서 나던 버그는 대개 **액션 타입 오타**와 **payload 모양 착각**이었습니다. 유니온 레슨의 판별 유니온이 정확히 이 둘을 잡습니다. `action.type`이 바로 그 "꼬리표"입니다.',
        },
        {
          kind: 'p',
          text: '에디터의 코드는 JS 리듀서를 그대로 옮기고 `TodoAction`만 가장 느슨하게 적은 것입니다(3행). 타입 오류는 0개입니다. 그런데 콘솔을 보세요. 20행은 `toggle` 오타라 **조용히 무시**됐고, 23행은 payload에 문자열을 넣어 목록에 `undefined`가 끼었고, 26행은 payload를 빠뜨려 10행에서 **크래시**가 났습니다.',
        },
        {
          kind: 'compare',
          js: `const ADD_TODO = 'todos/added';
const TOGGLE_TODO = 'todos/toggled';

function reducer(state, action) {
  switch (action.type) {
    case ADD_TODO: // ...
  }
}`,
          ts: `type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  // switch는 그대로
}`,
          caption: '오타를 막으려고 만들던 상수가 필요 없습니다. 문자열 리터럴 자체가 타입이라 오타는 곧 오류입니다.',
        },
      ],
      code: `interface Todo { id: number; title: string; done: boolean }

type TodoAction = { type: string; payload?: any };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    default:
      return state;
  }
}

const show = (todos: Todo[]) => todos.map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

let state: Todo[] = [{ id: 1, title: '타입 붙이기', done: false }];

state = reducer(state, { type: 'todos/toggle', payload: { id: 1 } });
console.log('1.', show(state));

state = reducer(state, { type: 'todos/added', payload: '배포하기' });
console.log('2.', show(state));

state = reducer(state, { type: 'todos/toggled' });
console.log('3.', show(state));
`,
      mission: {
        text: '3행의 `TodoAction`을 위 비교의 TS 쪽처럼 두 액션의 유니온으로 바꾸세요. 아래쪽 세 호출이 모두 빨개집니다. 차례로 고치세요: 1번은 id 1 토글, 2번은 `{ id: 2, title: \'배포하기\', done: false }` 추가, 3번은 id 2 토글.',
        goal: {
          noTypeErrors: true,
          consoleIncludes: ['1. [x] 타입 붙이기', '[ ] 배포하기', '[x] 배포하기'],
          codeExcludes: ['type: string', ': any'],
        },
        hint: '토글 액션은 `{ type: \'todos/toggled\', payload: { id: 1 } }` 모양입니다. 오류 메시지가 틀린 부분(타입 이름, payload)을 짚어 줍니다.',
        answer: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    default:
      return state;
  }
}

const show = (todos: Todo[]) => todos.map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

let state: Todo[] = [{ id: 1, title: '타입 붙이기', done: false }];

state = reducer(state, { type: 'todos/toggled', payload: { id: 1 } });
console.log('1.', show(state));

state = reducer(state, { type: 'todos/added', payload: { id: 2, title: '배포하기', done: false } });
console.log('2.', show(state));

state = reducer(state, { type: 'todos/toggled', payload: { id: 2 } });
console.log('3.', show(state));
`,
      },
    },
    {
      id: 'redux-actions-2',
      title: 'case 안에서는 payload 타입이 달라집니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '이제 `action`은 세 가지 모양 중 하나입니다. `switch (action.type)`으로 꼬리표를 확인하면 각 `case` 안에서 TS가 **그 모양 하나로 좁혀** 줍니다. 11, 13, 15행의 `payload` 위에 마우스를 올려 보세요. 줄마다 `Todo`, `{ id: number }`, `number`로 다릅니다.',
        },
        {
          kind: 'p',
          text: '"payload가 id였나, `{ id }`였나?" 15행이 그 실수입니다. `todos/removed`의 payload는 숫자인데 `.id`를 꺼냈습니다. 콘솔을 보면 1번 할 일이 **지워지지 않았습니다**. `(1).id`가 `undefined`라서 모든 항목이 필터를 통과했기 때문입니다. 크래시도 경고도 없어 찾기 어려운 버그인데, 타입 검사는 15행을 정확히 지목합니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '리덕스 전용 기능이 아닙니다',
          text: 'TS가 리덕스를 특별히 아는 것이 아닙니다. 유니온 레슨에서 배운 좁히기 그대로입니다. `if (action.type === \'todos/removed\')`로 써도 똑같이 좁혀집니다.',
        },
      ],
      code: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } }
  | { type: 'todos/removed'; payload: number };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    case 'todos/removed':
      return state.filter((t) => t.id !== action.payload.id);
    default:
      return state;
  }
}

const show = (todos: Todo[]) => todos.map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

let state: Todo[] = [
  { id: 1, title: '타입 붙이기', done: false },
  { id: 2, title: '배포하기', done: false },
];
state = reducer(state, { type: 'todos/toggled', payload: { id: 2 } });
state = reducer(state, { type: 'todos/removed', payload: 1 });
console.log('삭제 후:', show(state));
`,
      mission: {
        text: '15행을 고쳐 1번 할 일이 실제로 지워지게 하세요. 콘솔에 `삭제 후: [x] 배포하기`만 남으면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['삭제 후: [x] 배포하기'] },
        hint: '`todos/removed`의 payload는 숫자 그 자체입니다. `t.id !== action.payload`',
        answer: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } }
  | { type: 'todos/removed'; payload: number };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    case 'todos/removed':
      return state.filter((t) => t.id !== action.payload);
    default:
      return state;
  }
}

const show = (todos: Todo[]) => todos.map((t) => (t.done ? '[x] ' : '[ ] ') + t.title).join(', ');

let state: Todo[] = [
  { id: 1, title: '타입 붙이기', done: false },
  { id: 2, title: '배포하기', done: false },
];
state = reducer(state, { type: 'todos/toggled', payload: { id: 2 } });
state = reducer(state, { type: 'todos/removed', payload: 1 });
console.log('삭제 후:', show(state));
`,
      },
    },
    {
      id: 'redux-actions-3',
      title: '빠뜨린 case 잡기: default의 never',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '"전체 삭제" 액션을 새로 만들려 합니다. 24행에서 먼저 보내 봤는데, 유니온에 없는 타입이라 오류가 나고 실행 결과도 `남은 할 일: 2` 그대로입니다.',
        },
        {
          kind: 'p',
          text: '그럼 유니온에는 추가하고 리듀서의 `case`를 잊으면 어떻게 될까요? 그것을 잡는 장치가 14행입니다. 모든 `case`를 처리했다면 `default`에 도달하는 `action`은 "있을 수 없는 값", 즉 **`never`** 타입입니다. `never` 변수에 대입해 두면, 처리하지 않은 액션이 생기는 순간 이 줄이 빨개집니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '반환 타입만으로는 안 되는 이유',
          text: '유니온 레슨에서는 반환 타입을 적어 두면 빠진 `case`가 잡혔습니다. 리듀서는 모르는 액션이 오면 state를 그대로 돌려줘야 해서 `default`가 꼭 있고, 그래서 그 방법이 통하지 않습니다. 대신 `default` 안에서 `never`로 확인합니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '"쓰지 않는 변수" 오류가 난다면',
          text: '`noUnusedLocals`를 켠 프로젝트(Vite 기본 템플릿 등)에서는 14행의 `unreachable`이 쓰지 않는 변수로 걸립니다. 그때는 변수 없이 `action satisfies never;`라고 적으면 같은 검사를 합니다.',
        },
      ],
      code: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    default: {
      const unreachable: never = action;
      return state;
    }
  }
}

let state: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];
state = reducer(state, { type: 'todos/cleared' });
console.log('남은 할 일:', state.length);
`,
      mission: {
        text: '(1) 유니온에 `{ type: \'todos/cleared\' }`를 추가하세요. 아래쪽 호출의 오류가 사라지고 **`never` 줄로 옮겨 갑니다**. 메시지에 빠뜨린 액션의 모양이 그대로 나옵니다. (2) `never` 줄은 지우지 말고, 빈 배열을 돌려주는 `case`를 추가해 콘솔에 `남은 할 일: 0`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['남은 할 일: 0'], codeIncludes: ['never'] },
        hint: '유니온 마지막 줄에 `| { type: \'todos/cleared\' };`, 리듀서에 `case \'todos/cleared\': return [];`',
        answer: `interface Todo { id: number; title: string; done: boolean }

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
    default: {
      const unreachable: never = action;
      return state;
    }
  }
}

let state: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];
state = reducer(state, { type: 'todos/cleared' });
console.log('남은 할 일:', state.length);
`,
      },
    },
    {
      id: 'redux-actions-4',
      title: '액션 생성 함수에는 반환 타입을 적습니다',
      runner: 'console',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '액션 객체를 매번 손으로 쓰는 대신 `addTodo()` 같은 **액션 생성 함수**를 만들어 써 왔을 겁니다. 그대로 옮기면 25, 26행처럼 리듀서에 넘기는 곳에서 오류가 납니다. 내용이 맞는 `addTodo`까지 거부당합니다.',
        },
        {
          kind: 'p',
          text: '원인은 추론입니다. 함수가 돌려주는 객체의 `type`은 `\'todos/added\'`가 아니라 그냥 **`string`**으로 추론됩니다. 객체의 속성은 나중에 바뀔 수 있기 때문입니다. `addTodo` 위에 마우스를 올려 확인해 보세요. `string`은 유니온의 어느 꼬리표와도 맞지 않습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '반환 타입을 적으면 유니온에 맞춰 검사합니다',
          code: `const addTodo = (id: number, title: string): TodoAction => ({
  type: 'todos/added',
  payload: { id, title, done: false },
});`,
        },
        {
          kind: 'p',
          text: '그런데 콘솔의 `done: false`를 보세요. 26행의 토글이 무시됐습니다. 진짜 버그가 하나 숨어 있습니다. 반환 타입을 적으면 오류가 호출하는 곳에서 **함수 안의 틀린 글자**로 옮겨 가서 그 위치를 알려 줍니다.',
        },
      ],
      code: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    default:
      return state;
  }
}

const addTodo = (id: number, title: string) => ({
  type: 'todos/added',
  payload: { id, title, done: false },
});
const toggleTodo = (id: number) => ({ type: 'todos/toggeld', payload: { id } });

let state: Todo[] = [];
state = reducer(state, addTodo(1, '타입 붙이기'));
state = reducer(state, toggleTodo(1));
console.log(state);
`,
      mission: {
        text: '두 액션 생성 함수에 반환 타입 `: TodoAction`을 붙이세요. 25행의 오류는 사라지고, 26행의 오류는 22행의 오타로 옮겨 갑니다. 오타를 고쳐 콘솔에 `done: true`가 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['done: true'], codeIncludes: ['): TodoAction'] },
        hint: '`(id: number): TodoAction => ({ ... })` 처럼 매개변수 괄호 뒤에 적습니다. 22행의 타입 이름은 `\'todos/toggled\'`',
        answer: `interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/added'; payload: Todo }
  | { type: 'todos/toggled'; payload: { id: number } };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload];
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    default:
      return state;
  }
}

const addTodo = (id: number, title: string): TodoAction => ({
  type: 'todos/added',
  payload: { id, title, done: false },
});
const toggleTodo = (id: number): TodoAction => ({ type: 'todos/toggled', payload: { id } });

let state: Todo[] = [];
state = reducer(state, addTodo(1, '타입 붙이기'));
state = reducer(state, toggleTodo(1));
console.log(state);
`,
      },
    },
    {
      id: 'redux-actions-5',
      title: 'useReducer에도 그대로',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '`useReducer`에 넘기는 리듀서도 같은 함수입니다. 타입을 붙인 리듀서를 넘기면 `dispatch`가 **`TodoAction`만 받는 함수**로 추론됩니다. 26행의 `dispatch` 위에 마우스를 올리면 `React.ActionDispatch<[action: TodoAction]>`이 보입니다.',
        },
        {
          kind: 'p',
          text: '미리보기에서 체크박스와 "전체 삭제"를 눌러 보세요. 둘 다 **아무 반응이 없습니다**. 27행은 payload 모양이 틀렸고 28행은 액션 타입이 오타입니다. 1단계에서 콘솔로 본 두 버그가 화면에서는 "눌러도 안 되는 버튼"으로 나타납니다. 타입 검사는 그 두 줄을 정확히 지목하고 있습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '종류에 따라 내용물이 다른 데이터라면 어디든',
          text: '이 패턴은 Redux 전용이 아닙니다. `useReducer`, 웹소켓 메시지, 푸시 알림처럼 **종류에 따라 내용물이 다른 데이터**는 모두 판별 유니온과 `switch`로 다룹니다. 다음 레슨의 Redux Toolkit은 지금 손으로 쓴 액션 타입과 액션 생성 함수를 자동으로 만들어 줍니다.',
        },
      ],
      code: `import { useReducer } from 'react';

interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/toggled'; payload: { id: number } }
  | { type: 'todos/cleared' };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    case 'todos/cleared':
      return [];
    default:
      return state;
  }
}

const initialTodos: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];

export default function TodoApp() {
  const [todos, dispatch] = useReducer(reducer, initialTodos);
  const toggle = (id: number) => dispatch({ type: 'todos/toggled', payload: id });
  const clear = () => dispatch({ type: 'todos/clear' });

  return (
    <div className="stack">
      {todos.map((t) => (
        <label key={t.id}>
          <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
          {t.title}
        </label>
      ))}
      <button onClick={clear}>전체 삭제</button>
      <p className="muted">남은 할 일 {todos.filter((t) => !t.done).length}개</p>
    </div>
  );
}
`,
      mission: {
        text: '27행과 28행의 `dispatch` 호출을 고치세요. 그다음 미리보기에서 체크박스와 "전체 삭제"가 이제 동작하는지 눌러서 확인해 보세요.',
        goal: { noTypeErrors: true, codeExcludes: ['payload: id', 'todos/clear'] },
        hint: '토글의 payload는 `{ id }` 모양이고, 전체 삭제의 타입 이름은 `\'todos/cleared\'`입니다.',
        answer: `import { useReducer } from 'react';

interface Todo { id: number; title: string; done: boolean }

type TodoAction =
  | { type: 'todos/toggled'; payload: { id: number } }
  | { type: 'todos/cleared' };

function reducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'todos/toggled':
      return state.map((t) => (t.id === action.payload.id ? { ...t, done: !t.done } : t));
    case 'todos/cleared':
      return [];
    default:
      return state;
  }
}

const initialTodos: Todo[] = [
  { id: 1, title: '타입 붙이기', done: true },
  { id: 2, title: '배포하기', done: false },
];

export default function TodoApp() {
  const [todos, dispatch] = useReducer(reducer, initialTodos);
  const toggle = (id: number) => dispatch({ type: 'todos/toggled', payload: { id } });
  const clear = () => dispatch({ type: 'todos/cleared' });

  return (
    <div className="stack">
      {todos.map((t) => (
        <label key={t.id}>
          <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
          {t.title}
        </label>
      ))}
      <button onClick={clear}>전체 삭제</button>
      <p className="muted">남은 할 일 {todos.filter((t) => !t.done).length}개</p>
    </div>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-redux-actions',
    title: '장바구니 액션 유니온 만들기',
    prompt: '`CartAction`이 너무 느슨해서 리듀서가 payload를 믿지 못하고 있습니다. 세 가지 액션의 판별 유니온으로 바꿔 보세요: `cart/added`(payload: CartItem), `cart/removed`(payload: `{ id: string }`), `cart/cleared`(payload 없음). 리듀서는 고치지 않아도 됩니다.',
    runner: 'console',
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
console.log('담은 뒤:', one.items);
const removed = cartReducer(one, { type: 'cart/removed', payload: { id: 'a' } });
console.log('뺀 뒤:', removed.items);
const cleared = cartReducer(one, { type: 'cart/cleared' });
console.log('비운 뒤:', cleared.items);

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
        '처리하지 않은 액션 종류가 생기면 타입 오류로 알려 주기 위해',
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
    {
      id: 'q-redux-actions-3',
      question: '아래 `toggleTodo(1)`을 `TodoAction`을 받는 리듀서에 넘기면 타입 오류가 납니다. 이유는?',
      code: `const toggleTodo = (id: number) => ({ type: 'todos/toggled', payload: { id } });`,
      options: [
        '화살표 함수는 액션을 만들 수 없어서',
        '반환 타입을 적지 않아 `type`이 리터럴이 아닌 `string`으로 추론돼서',
        'payload에 id를 줄여 써서',
        '액션 생성 함수는 Redux Toolkit에서만 쓸 수 있어서',
      ],
      answer: 1,
      explanation: '객체 속성의 문자열은 `string`으로 넓게 추론됩니다. 반환 타입을 `: TodoAction`으로 적으면 유니온에 맞춰 검사되고, 오타가 있으면 함수 안에서 바로 잡힙니다.',
    },
  ],
};
