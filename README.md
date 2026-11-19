# TS 건너가기 — 고치면 바로 보이는 TypeScript 실습

JavaScript로 React / React Native / Redux를 써 본 사람이 **이미 아는 코드에서 출발해** TypeScript를 익히는 실습형 학습 사이트입니다.

배포 주소: https://amhamhamh.github.io/typescript-study/

## 무엇이 다른가

레슨은 읽는 글이 아니라 **작업 화면**입니다. 왼쪽에 짧은 설명과 미션, 오른쪽에 에디터가 있고 그 옆에 결과가 실시간으로 나옵니다.

| 영역 | 내용 |
| --- | --- |
| 에디터 | VS Code와 같은 Monaco 엔진. React 19, Redux Toolkit, react-redux, React Native의 **실제 타입 선언**이 들어 있어 자동완성과 오류 메시지가 실제 프로젝트와 같습니다. |
| 콘솔 | 코드를 실제로 실행한 결과. `console.log` 출력과 런타임 오류(줄 번호 포함)가 찍힙니다. |
| 미리보기 | `export default` 한 React 컴포넌트를 바로 렌더링합니다. React Native 예제는 휴대폰 화면 안에 그립니다(react-native-web). |
| 타입 검사 | 어느 줄이 왜 위험한지. 타입 오류가 있어도 코드는 실행되므로, **타입 오류가 예고한 버그가 콘솔·미리보기에서 실제로 터지는 것**을 나란히 볼 수 있습니다. |
| 미션 | 단계마다 하나. 코드를 고쳐 목표(타입 오류 0개, 특정 출력 등)를 달성하면 자동으로 체크됩니다. |

구성: 레슨 13개 (JS→TS 기초 5 · React 3 · Redux/비동기 3 · React Native/실전 전환 2). 각 레슨은 단계 4~6개 → 실습 과제 → 퀴즈 순서이며, 진도는 브라우저(localStorage)에 저장됩니다.

## 개발

```bash
npm install
npm run dev            # 개발 서버 (샌드박스 런타임을 먼저 빌드합니다)
npm run build          # 타입 검사 + dist/ 생성
npm run check:lessons  # 모든 레슨 코드를 타입 검사하고, 헤드리스 브라우저에서 실제로 실행해 검증
```

`check:lessons`의 실행 검증은 로컬에 설치된 Playwright를 사용합니다. 브라우저 없이 타입 검사만 하려면 `npm run check:lessons -- --types-only`, 특정 레슨만 보려면 `npm run check:lessons -- -v unions` 처럼 씁니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/content/lessons/` | 레슨 하나당 파일 하나. 형식은 `src/content/types.ts` 참고 |
| `src/components/Workbench.tsx` | 에디터 + 미리보기 + 콘솔 + 타입 검사 화면 |
| `src/sandbox/` | 코드 실행 환경. `compile.ts`(TS→JS 변환), `host.ts`(iframe 관리), `runtime.ts`(iframe 안에서 도는 런타임), `mockApi.ts`(실습용 가짜 API) |
| `src/editor/` | Monaco 설정, 타입 검사/JS 변환 헬퍼 |
| `src/store/` | Redux Toolkit 스토어 — 레슨 10의 실제 예제 |
| `src/lib/` | 미션 목표 판정(`goal.ts`), 실습 채점(`grade.ts`), 라우터 |
| `scripts/prebuild.ts` | 에디터용 타입 선언 묶음과 샌드박스 런타임 번들을 `src/generated/`에 생성 |
| `scripts/check-lessons.ts` | 레슨 검증 스크립트 |

### 코드 실행 방식

학습자가 쓴 코드는 sucrase로 타입만 지워 JS로 바꾼 뒤(Metro·Vite와 같은 방식), `sandbox="allow-scripts"`만 준 iframe 안에서 실행합니다. 이 iframe은 페이지의 저장소·쿠키·DOM에 접근할 수 없고, CSP로 실제 네트워크도 막혀 있습니다. `fetch('/api/...')`는 런타임에 들어 있는 가짜 API가 응답합니다. 실행할 때마다 iframe을 새로 만들기 때문에 이전 실행의 상태가 남지 않습니다.

이 사이트의 소스 자체도 학습 자료입니다. 판별 유니온(`Block`, `Route`, `SandboxEvent`), 타입이 붙은 Redux 훅, `never`를 이용한 누락 검사 등 레슨에서 다루는 패턴을 그대로 사용했습니다.

## 배포

`main`에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 레슨 타입 검증 → 타입 검사 → 빌드 후 GitHub Pages에 배포합니다.
