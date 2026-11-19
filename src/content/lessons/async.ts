import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'async',
  chapter: 'redux',
  title: '비동기와 API: 서버 응답에 타입 입히기',
  summary: 'fetch 결과는 any입니다. 응답 타입을 약속하고, 그 약속이 깨질 때를 대비하고, 로딩/성공/실패를 "불가능한 조합 없이" 표현합니다.',
  minutes: 15,
  steps: [
    {
      id: 'async-1',
      title: 'res.json()은 any: 반환 타입으로 약속하기',
      runner: 'console',
      throws: true,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '화면에 뜨던 undefined와 NaN',
          text: 'API 응답의 필드 이름을 잘못 써서 화면에 `undefined`나 `NaN`이 뜬 적 있죠. 서버 응답은 TS가 들여다볼 수 없는 바깥 세계라서 `res.json()`의 결과는 `any`입니다. 첫 레슨에서 본 `JSON.parse`와 같습니다.',
        },
        {
          kind: 'p',
          text: '에디터의 코드는 실습용 가짜 서버의 `/api/posts`를 호출합니다. 14행의 `posts` 위에 마우스를 올리면 `any`입니다. 그래서 16행의 `like`(정답은 `likes`)와 17행의 `writer`(정답은 `author`)가 오타인데도 타입 오류는 **0개**입니다. 콘솔에는 `NaN`이 찍혔고 17행에서 크래시했습니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '반환 타입으로 "이 모양이 온다"고 약속하기',
          code: `async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  return res.json();
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'async 함수의 반환 타입은 Promise<...>',
          text: '`any`는 어떤 타입 자리에도 들어가므로 `return res.json()`은 그대로 둡니다. 이 한 줄로 `fetchPosts`를 쓰는 모든 곳에 자동완성과 오타 검사가 생깁니다. axios라면 `axios.get<Post[]>(url)`처럼 제네릭으로 넘깁니다.',
        },
      ],
      code: `interface Post {
  id: number;
  title: string;
  likes: number;
  author: { id: number; name: string };
}

async function fetchPosts() {
  const res = await fetch('/api/posts');
  return res.json();
}

async function main() {
  const posts = await fetchPosts();
  console.log('첫 글:', posts[0].title);
  console.log('좋아요:', posts[0].like + 1);
  console.log('작성자:', posts[0].writer.name);
}

main();
`,
      mission: {
        text: '8행의 `fetchPosts`에 반환 타입 `Promise<Post[]>`를 붙이세요. 16행과 17행의 오타에 빨간 줄이 생깁니다. 둘을 고쳐 `좋아요: 13`과 `작성자: 김코딩`이 찍히게 하세요.',
        goal: { noTypeErrors: true, consoleIncludes: ['좋아요: 13', '작성자: 김코딩'], codeIncludes: ['Promise<Post[]>'] },
        hint: '`async function fetchPosts(): Promise<Post[]> {` 그리고 `posts[0].likes`, `posts[0].author.name`',
        answer: `interface Post {
  id: number;
  title: string;
  likes: number;
  author: { id: number; name: string };
}

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  return res.json();
}

async function main() {
  const posts = await fetchPosts();
  console.log('첫 글:', posts[0].title);
  console.log('좋아요:', posts[0].likes + 1);
  console.log('작성자:', posts[0].author.name);
}

main();
`,
      },
    },
    {
      id: 'async-2',
      title: '타입은 서버를 검사하지 않습니다',
      runner: 'console',
      throws: true,
      body: [
        {
          kind: 'p',
          text: '`Promise<User>`는 **약속**일 뿐입니다. 타입은 빌드할 때 지워지므로 서버가 실제로 그 모양을 보내는지는 아무도 확인하지 않습니다. `/api/me`는 약속대로 오지만 `/api/broken-user`는 일부러 `{ id: \'1\', fullName: \'김코딩\' }`을 돌려줍니다. 타입 오류는 0개인데 콘솔에는 `이름: undefined`가 찍혔고 17행에서 크래시했습니다.',
        },
        {
          kind: 'p',
          text: '확실히 하려면 **런타임에 확인**해야 합니다. 3행의 `isUser`가 그 일을 합니다. 반환 타입 `data is User`는 "이 함수가 `true`를 돌려주면 `data`는 `User`다"라고 TS에 알려 주는 표기입니다. 본문은 첫 레슨에서 `unknown`을 좁히던 조건문 그대로입니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'unknown으로 받아서 확인한 뒤에 돌려주기',
          code: `async function fetchUser(path: string): Promise<User | null> {
  const res = await fetch(path);
  const data: unknown = await res.json();
  return isUser(data) ? data : null;
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '모든 응답을 손으로 검사하지는 않습니다',
          text: '실무에서는 백엔드의 OpenAPI 스펙에서 타입을 생성해 약속을 맞추고, 결제나 로그인처럼 중요한 응답만 zod 같은 검증 라이브러리로 확인합니다. 기억할 것은 하나입니다. **바깥에서 온 데이터의 타입은 검사 결과가 아니라 약속입니다.**',
        },
      ],
      code: `interface User { id: number; name: string }

function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null
    && 'id' in data && typeof data.id === 'number'
    && 'name' in data && typeof data.name === 'string';
}

async function fetchUser(path: string): Promise<User> {
  const res = await fetch(path);
  return res.json();
}

async function showUser(path: string) {
  const user = await fetchUser(path);
  console.log(path, '→ 이름:', user.name);
  console.log('이니셜:', user.name.charAt(0));
}

async function main() {
  await showUser('/api/me');
  await showUser('/api/broken-user');
}

main();
`,
      mission: {
        text: '`fetchUser`를 설명에 있는 코드처럼 바꿔 `Promise<User | null>`을 돌려주게 하세요. 그러면 `showUser`에서 `user`가 null일 수 있다는 오류가 납니다. null이면 `응답이 User 모양이 아닙니다`를 출력하고 `return` 하도록 고치세요. `/api/me`는 그대로 통과하고 `/api/broken-user`만 걸러지면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['이니셜: 김', '응답이 User 모양이 아닙니다'], codeIncludes: ['Promise<User | null>'] },
        hint: '`showUser` 안에서 `if (!user) { console.log(path, \'→ 응답이 User 모양이 아닙니다\'); return; }` 로 먼저 걸러 내면 그 아래에서는 `user`가 `User`입니다.',
        answer: `interface User { id: number; name: string }

function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null
    && 'id' in data && typeof data.id === 'number'
    && 'name' in data && typeof data.name === 'string';
}

async function fetchUser(path: string): Promise<User | null> {
  const res = await fetch(path);
  const data: unknown = await res.json();
  return isUser(data) ? data : null;
}

async function showUser(path: string) {
  const user = await fetchUser(path);
  if (!user) {
    console.log(path, '→ 응답이 User 모양이 아닙니다');
    return;
  }
  console.log(path, '→ 이름:', user.name);
  console.log('이니셜:', user.name.charAt(0));
}

async function main() {
  await showUser('/api/me');
  await showUser('/api/broken-user');
}

main();
`,
      },
    },
    {
      id: 'async-3',
      title: 'catch의 error는 unknown입니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '요청은 실패하기도 합니다. JS에서는 `Error`뿐 아니라 문자열이든 객체든 **무엇이든 throw** 할 수 있어서, 엄격 모드의 TS는 `catch (error)`의 `error`를 `unknown`으로 봅니다. 13행의 `error.message`에 난 `\'error\' is of type \'unknown\'`이 그 뜻입니다.',
        },
        {
          kind: 'p',
          text: '괜한 걱정이 아닙니다. 콘솔의 셋째 줄을 보세요. `실패: undefined`입니다. 2행이 `Error`가 아니라 문자열을 던졌고, 문자열에는 `message`가 없기 때문입니다. 오래된 코드나 라이브러리에서 실제로 만나는 상황입니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: 'instanceof로 좁힌 뒤에 꺼내기',
          code: `const message =
  error instanceof Error ? error.message : String(error);`,
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '.catch((e) => ...)의 e는 any입니다',
          text: 'Promise의 `.catch` 콜백이 받는 값은 `unknown`이 아니라 `any`라서 `e.message`를 써도 빨간 줄이 생기지 않습니다. 위험은 똑같으니 같은 방법으로 확인하세요.',
        },
      ],
      code: `async function getJson(url: string): Promise<unknown> {
  if (!url.startsWith('/api/')) throw '잘못된 주소: ' + url;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function load(url: string) {
  try {
    await getJson(url);
    console.log(url, '→ 성공');
  } catch (error) {
    console.log(url, '→ 실패:', error.message);
  }
}

async function main() {
  await load('/api/posts');
  await load('/api/fail');
  await load('/posts');
}

main();
`,
      mission: {
        text: '`catch` 블록에서 `error instanceof Error`로 확인해 메시지를 꺼내고, 아니면 `String(error)`를 쓰도록 고치세요. 셋째 줄이 `/posts → 실패: 잘못된 주소: /posts`로 바뀌면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ['실패: HTTP 500', '실패: 잘못된 주소: /posts'], codeIncludes: ['instanceof Error'] },
        hint: '13행 위에 `const message = error instanceof Error ? error.message : String(error);` 를 두고 `message`를 출력합니다.',
        answer: `async function getJson(url: string): Promise<unknown> {
  if (!url.startsWith('/api/')) throw '잘못된 주소: ' + url;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function load(url: string) {
  try {
    await getJson(url);
    console.log(url, '→ 성공');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(url, '→ 실패:', message);
  }
}

async function main() {
  await load('/api/posts');
  await load('/api/fail');
  await load('/posts');
}

main();
`,
      },
    },
    {
      id: 'async-4',
      title: '요청 상태: 불가능한 조합을 없애기',
      runner: 'react',
      errors: 6,
      body: [
        {
          kind: 'p',
          text: '`{ loading, data, error }`. API를 붙일 때마다 만들던 state입니다. 미리보기의 아래 카드를 보세요. `/api/fail` 요청은 이미 실패했는데 **영원히 "불러오는 중..."**입니다. 24행이 실패를 기록하면서 `loading: true`를 그대로 뒀기 때문입니다.',
        },
        {
          kind: 'compare',
          jsLabel: '익숙한 모양',
          tsLabel: '판별 유니온',
          js: `interface LooseState {
  loading: boolean;
  data: Post[] | null;
  error: string | null;
}
// 통과: 로딩 중인데 에러도 있음
{ loading: true, data: null, error: 'HTTP 500' }`,
          ts: `type PostsState =
  | { status: 'loading' }
  | { status: 'success'; data: Post[] }
  | { status: 'error'; message: string };
// 오류: loading에는 message가 없음
{ status: 'loading', message: 'HTTP 500' }`,
          caption: '상태마다 가질 수 있는 데이터가 정해집니다. 말이 안 되는 조합은 적을 수조차 없습니다.',
        },
        {
          kind: 'p',
          text: '에디터의 코드는 **state의 타입만** 판별 유니온으로 바꿔 둔 상태입니다(5~8, 19행). 나머지는 옛 모양 그대로라 고칠 곳 여섯 줄이 모두 빨갛습니다. 타입을 먼저 바꾸고 빨간 줄을 따라가는 것이 TS에서 리팩터링하는 방법입니다.',
        },
      ],
      code: `import { useEffect, useState } from 'react';

interface Post { id: number; title: string; likes: number }

type PostsState =
  | { status: 'loading' }
  | { status: 'success'; data: Post[] }
  | { status: 'error'; message: string };

const toMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function fetchPosts(url: string): Promise<Post[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function PostList({ url }: { url: string }) {
  const [state, setState] = useState<PostsState>({ loading: true, data: null, error: null });

  useEffect(() => {
    fetchPosts(url)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((e) => setState({ loading: true, data: null, error: toMessage(e) }));
  }, [url]);

  if (state.loading) return <p className="muted">불러오는 중...</p>;
  if (state.error) return <p>요청 실패: {state.error}</p>;
  return <ul>{state.data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

export default function App() {
  return (
    <div className="stack">
      <div className="card"><PostList url="/api/posts" /></div>
      <div className="card"><PostList url="/api/fail" /></div>
    </div>
  );
}
`,
      mission: {
        text: '빨간 줄을 위에서부터 고치세요. 19행은 `{ status: \'loading\' }`, 23~24행은 `success`와 `error` 상태, 27~28행은 `state.status`로 분기합니다. 29행은 손대지 않아도 오류가 사라집니다. 앞의 두 `if`가 loading과 error를 걸러 내서 남은 것이 success뿐이기 때문입니다.',
        goal: { noTypeErrors: true, previewIncludes: ['TypeScript 첫걸음', '요청 실패: HTTP 500'], codeIncludes: ['state.status'] },
        hint: '`setState({ status: \'success\', data })`, `setState({ status: \'error\', message: toMessage(e) })`, `if (state.status === \'error\') return <p>요청 실패: {state.message}</p>;`',
        answer: `import { useEffect, useState } from 'react';

interface Post { id: number; title: string; likes: number }

type PostsState =
  | { status: 'loading' }
  | { status: 'success'; data: Post[] }
  | { status: 'error'; message: string };

const toMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function fetchPosts(url: string): Promise<Post[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function PostList({ url }: { url: string }) {
  const [state, setState] = useState<PostsState>({ status: 'loading' });

  useEffect(() => {
    fetchPosts(url)
      .then((data) => setState({ status: 'success', data }))
      .catch((e) => setState({ status: 'error', message: toMessage(e) }));
  }, [url]);

  if (state.status === 'loading') return <p className="muted">불러오는 중...</p>;
  if (state.status === 'error') return <p>요청 실패: {state.message}</p>;
  return <ul>{state.data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

export default function App() {
  return (
    <div className="stack">
      <div className="card"><PostList url="/api/posts" /></div>
      <div className="card"><PostList url="/api/fail" /></div>
    </div>
  );
}
`,
      },
    },
    {
      id: 'async-5',
      title: 'createAsyncThunk: 타입은 함수에서 따라옵니다',
      runner: 'console',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '요청마다 `REQUEST / SUCCESS / FAILURE` 액션 세 개를 손으로 만들던 일은 `createAsyncThunk`가 대신합니다. 타입을 적는 곳은 11행의 비동기 함수 하나입니다. **매개변수 타입**(`id: number`)이 `loadPost(...)`의 인자 타입이 되고, **반환 타입**(`Promise<Post>`)이 fulfilled의 `action.payload` 타입이 됩니다. 29행의 `action.payload` 위에 마우스를 올려 보세요. `Post`입니다.',
        },
        {
          kind: 'p',
          text: '40행은 숫자 자리에 `{ id: 2 }`를 넘겼습니다. 12행에서 요청 주소가 `/api/posts/[object Object]`가 되어 버렸고, 콘솔에는 `HTTP 404`로 실패한 state가 찍혔습니다. state는 앞 단계의 판별 유니온이라 `loading` 다음에 `error`로 넘어가는 과정이 그대로 찍힙니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '17행이 request로 한 번 감싼 이유',
          text: '`const initialState: PostState = { status: \'idle\' }`처럼 유니온 자체를 state로 두면 TS가 초기값을 보고 타입을 `idle` 하나로 좁혀 버려서, 다른 상태로 바꾸는 리듀서에서 오류가 납니다. 속성 안에 넣으면 좁혀지지 않습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '컴포넌트에서는 useAppDispatch로',
          text: '`loadPost(2)`가 만드는 것은 액션 객체가 아니라 thunk(함수)입니다. 그래서 컴포넌트에서는 앞 레슨의 `useAppDispatch`가 필요합니다. 평범한 `useDispatch()`로는 `dispatch(loadPost(2))`에 빨간 줄이 생깁니다.',
        },
      ],
      code: `import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface Post { id: number; title: string; likes: number }

type PostState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Post }
  | { status: 'error'; message: string };

const loadPost = createAsyncThunk('post/load', async (id: number): Promise<Post> => {
  const res = await fetch('/api/posts/' + id);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
});

const initialState: { request: PostState } = { request: { status: 'idle' } };

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPost.pending, (state) => {
        state.request = { status: 'loading' };
      })
      .addCase(loadPost.fulfilled, (state, action) => {
        state.request = { status: 'success', data: action.payload };
      })
      .addCase(loadPost.rejected, (state, action) => {
        state.request = { status: 'error', message: action.error.message ?? '알 수 없는 오류' };
      });
  },
});

const store = configureStore({ reducer: postSlice.reducer });
store.subscribe(() => console.log(store.getState().request));

store.dispatch(loadPost({ id: 2 }));
`,
      mission: {
        text: '40행의 인자를 고쳐 2번 글을 불러오세요. 콘솔에 `status: \'success\'`와 글 제목이 찍히면 성공입니다.',
        goal: { noTypeErrors: true, consoleIncludes: ["status: 'success'", 'Redux Toolkit 타입 정리'] },
        hint: '`loadPost`는 숫자 하나를 받습니다. `store.dispatch(loadPost(2));`',
        answer: `import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface Post { id: number; title: string; likes: number }

type PostState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Post }
  | { status: 'error'; message: string };

const loadPost = createAsyncThunk('post/load', async (id: number): Promise<Post> => {
  const res = await fetch('/api/posts/' + id);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
});

const initialState: { request: PostState } = { request: { status: 'idle' } };

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPost.pending, (state) => {
        state.request = { status: 'loading' };
      })
      .addCase(loadPost.fulfilled, (state, action) => {
        state.request = { status: 'success', data: action.payload };
      })
      .addCase(loadPost.rejected, (state, action) => {
        state.request = { status: 'error', message: action.error.message ?? '알 수 없는 오류' };
      });
  },
});

const store = configureStore({ reducer: postSlice.reducer });
store.subscribe(() => console.log(store.getState().request));

store.dispatch(loadPost(2));
`,
      },
    },
  ],
  exercise: {
    id: 'ex-async',
    title: '요청 상태 다시 설계하기',
    prompt: '(1) `RequestState`를 네 가지 상태의 판별 유니온으로 바꾸세요: `idle`, `loading`, `success`(data: Post[]), `error`(error: string). (2) `fetchPosts`가 `Post[]`를 담은 Promise를 돌려준다고 반환 타입을 선언하세요. `render` 함수는 고치지 않아도 됩니다.',
    runner: 'console',
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
    tests: `console.log(render({ status: 'idle' }));
console.log(render({ status: 'loading' }));
console.log(render({ status: 'error', error: 'timeout' }));

fetchPosts().then((posts) => {
  const title: string = posts[0].title;
  console.log(render({ status: 'success', data: posts }), '/ 첫 글:', title);
  // @ts-expect-error Post에는 body가 없습니다
  posts[0].body;
});

// @ts-expect-error success에는 data가 반드시 있어야 합니다
const noData: RequestState = { status: 'success' };
// @ts-expect-error loading 상태에는 data가 없습니다
const loadingWithData: RequestState = { status: 'loading', data: [] };`,
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
      'async 함수의 반환 타입은 `Promise<...>`로 감쌉니다: `async function fetchPosts(): Promise<Post[]>`',
    ],
  },
  quiz: [
    {
      id: 'q-async-1',
      question: '`async function getUser(): Promise<User>`라고 선언했는데 서버가 다른 모양의 JSON을 보내면?',
      options: [
        '컴파일 오류가 난다',
        'TS가 런타임에 자동으로 예외를 던진다',
        '아무 오류 없이 진행되다가, 없는 속성을 쓰는 지점에서 런타임 문제가 생긴다',
        'fetch가 실패한다',
      ],
      answer: 2,
      explanation: '2단계의 `/api/broken-user`에서 본 그대로입니다. 타입은 빌드 때 지워지므로 런타임 데이터를 검사하지 않습니다. 바깥에서 들어오는 데이터의 타입은 "약속"이며, 확실히 하려면 런타임 검증이 필요합니다.',
    },
    {
      id: 'q-async-2',
      question: '`{ loading, data, error }` 대신 판별 유니온으로 요청 상태를 표현할 때의 장점이 **아닌** 것은?',
      options: [
        '로딩 중인데 에러도 있는 불가능한 조합을 만들 수 없다',
        'success 분기에서 data의 null 체크가 필요 없다',
        '새 상태를 추가하면 처리하지 않은 곳을 컴파일러가 알려 준다',
        'API 호출 속도가 빨라진다',
      ],
      answer: 3,
      explanation: '타입은 실행 성능에 영향을 주지 않습니다. 나머지 셋이 판별 유니온으로 얻는 실질적인 이점입니다.',
    },
    {
      id: 'q-async-3',
      question: 'strict 모드에서 `catch (error) { console.log(error.message); }`에 타입 오류가 나는 이유는?',
      options: [
        'catch 블록 안에서는 console.log를 쓸 수 없어서',
        'JS에서는 Error가 아닌 값도 throw 할 수 있어서 error의 타입이 unknown이기 때문에',
        'Error 객체에는 message 속성이 없어서',
        'async 함수 안에서는 try/catch를 쓸 수 없어서',
      ],
      answer: 1,
      explanation: '문자열이나 평범한 객체도 throw 할 수 있으므로 TS는 `error`를 `unknown`으로 둡니다. `error instanceof Error`로 좁힌 뒤에 `message`를 꺼내고, 아니면 `String(error)`로 바꿔 씁니다.',
    },
  ],
};
