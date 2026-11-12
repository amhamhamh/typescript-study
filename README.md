# TS 건너가기 — React 개발자를 위한 TypeScript

JavaScript로 React / React Native / Redux를 써 본 사람이 **이미 아는 코드에서 출발해** TypeScript를 익히는 실습형 학습 사이트입니다.

- 레슨 13개 (JS→TS 기초 5 · React 3 · Redux/비동기 3 · React Native/실전 전환 2)
- 브라우저 안에서 실제 TypeScript 타입 검사 (VS Code와 같은 Monaco 엔진, React 타입 포함)
- 레슨마다 자동 채점 실습 1개 + 퀴즈 2개, 진도는 localStorage에 저장
- JS → TS 치트시트

## 개발

```bash
npm install
npm run dev            # 개발 서버
npm run typecheck      # 타입 검사
npm run check:lessons  # 모든 실습의 시작 코드/정답을 tsc로 검증
npm run build          # dist/ 생성
```

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/content/` | 레슨·퀴즈·치트시트 데이터 (`types.ts`에 콘텐츠 타입 정의) |
| `src/store/` | Redux Toolkit 스토어 — 레슨 10의 실제 예제 |
| `src/editor/` | Monaco 설정과 타입 검사/JS 변환 헬퍼 |
| `src/lib/grade.ts` | 실습 채점 로직 |
| `scripts/check-lessons.ts` | 실습 검증 스크립트 (CI에서 실행) |

이 사이트의 소스 자체가 학습 자료입니다. 판별 유니온(`Block`, `Route`, `GradeResult`), 타입이 붙은 Redux 훅, `never`를 이용한 누락 검사 등 레슨에서 다루는 패턴을 그대로 사용했습니다.

## 배포

배포 주소: https://amhamhamh.github.io/typescript-study/

`main`에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 실습 검증 → 타입 검사 → 빌드 후 GitHub Pages에 배포합니다.
