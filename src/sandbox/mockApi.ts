// 실습용 가짜 서버. 샌드박스 안의 fetch('/api/...') 요청에 미리 정해 둔 JSON을 돌려줍니다.
// 실제 네트워크는 CSP로 막혀 있습니다.

const users = [
  { id: 1, name: '김코딩', email: 'kim@example.com', role: 'admin' },
  { id: 2, name: '박리덕', email: 'park@example.com', role: 'member' },
  { id: 3, name: '이네이티브', email: 'lee@example.com', role: 'member' },
];

const posts = [
  { id: 1, title: 'TypeScript 첫걸음', likes: 12, author: { id: 1, name: '김코딩' } },
  { id: 2, title: 'Redux Toolkit 타입 정리', likes: 30, author: { id: 2, name: '박리덕' } },
  { id: 3, title: 'React Navigation params 타이핑', likes: 7, author: { id: 3, name: '이네이티브' } },
];

const todos = [
  { id: 1, title: 'tsconfig 만들기', done: true },
  { id: 2, title: 'utils부터 .ts로 바꾸기', done: false },
  { id: 3, title: 'RootState 타입 뽑아내기', done: false },
];

const products = [
  { id: 'p1', title: '기계식 키보드', price: 129000, stock: 3 },
  { id: 'p2', title: '무선 마우스', price: 49000, stock: 0 },
  { id: 'p3', title: '27인치 모니터', price: 359000, stock: 12 },
];

const collections: Record<string, Array<{ id: number | string }>> = { users, posts, todos, products };

// 학습자 코드가 window.setTimeout을 바꿔 끼워도 가짜 서버의 응답 지연은 원래 타이머로 잽니다.
const nativeSetTimeout = window.setTimeout.bind(window);

interface Reply {
  status: number;
  body: unknown;
  delay: number;
}

function route(path: string): Reply {
  const [, , name, id] = path.split('/'); // '', 'api', 'posts', '1'
  if (name === 'fail') return { status: 500, body: { message: '서버 오류가 발생했습니다' }, delay: 400 };
  if (name === 'slow') return { status: 200, body: { ok: true }, delay: 2000 };
  if (name === 'me') return { status: 200, body: users[0], delay: 300 };
  // 일부러 타입 선언과 다른 모양을 돌려주는 엔드포인트 (런타임 검증 실습용)
  if (name === 'broken-user') return { status: 200, body: { id: '1', fullName: '김코딩' }, delay: 300 };

  const list = collections[name ?? ''];
  if (!list) return { status: 404, body: { message: `없는 경로입니다: ${path}` }, delay: 300 };
  if (id === undefined) return { status: 200, body: list, delay: 400 };
  const found = list.find((item) => String(item.id) === id);
  return found ? { status: 200, body: found, delay: 300 } : { status: 404, body: { message: '찾을 수 없습니다' }, delay: 300 };
}

export function installMockFetch(): void {
  window.fetch = (input: RequestInfo | URL): Promise<Response> => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = raw.replace(/^https?:\/\/[^/]+/, '').split('?')[0] ?? '';

    if (!path.startsWith('/api/')) {
      return Promise.reject(new TypeError(`실습 환경에서는 실제 네트워크 요청이 막혀 있습니다. /api/... 경로를 사용하세요. (요청: ${raw})`));
    }
    const reply = route(path);
    return new Promise((resolve) => {
      nativeSetTimeout(() => {
        resolve(new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } }));
      }, reply.delay);
    });
  };
}
