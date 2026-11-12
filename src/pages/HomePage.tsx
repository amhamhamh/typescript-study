import { chapters, lessons, lessonsOf } from '../content';
import { href } from '../lib/router';
import { selectDoneCount, selectLessonProgress, useAppDispatch, useAppSelector } from '../store';
import { progressReset } from '../store/progressSlice';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowRight, CheckIcon } from '../components/Icons';

const heroJs = `function Profile({ user, onFollow }) {
  return (
    <Button onPress={() => onFollow(user.id)}>
      {user.nickname.toUpperCase()}
    </Button>
  );
}
// nickname이 없는 유저 → 배포 후 크래시`;

const heroTs = `interface Props {
  user: { id: number; nickname?: string };
  onFollow: (id: number) => void;
}

function Profile({ user, onFollow }: Props) {
  return (
    <Button onPress={() => onFollow(user.id)}>
      {user.nickname.toUpperCase()}
    </Button> // ↑ 작성 중에 빨간 줄: undefined일 수 있음
  );
}`;

export function HomePage() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s);
  const doneCount = selectDoneCount(state);
  const nextLesson = lessons.find((lesson) => !selectLessonProgress(state, lesson).done) ?? lessons[0];
  const started = doneCount > 0 || Object.keys(state.progress.quiz).length > 0 || Object.keys(state.progress.exercises).length > 0;

  const reset = () => {
    if (window.confirm('학습 기록을 모두 지울까요?')) dispatch(progressReset());
  };

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">React · React Native · Redux 경험자를 위한</p>
        <h1>
          아는 것에서 출발하는<br />TypeScript
        </h1>
        <p className="hero__lead">
          변수와 반복문부터 다시 배우지 않습니다. PropTypes, <code>useState</code>, 리듀서, <code>navigation.navigate</code>처럼
          이미 손에 익은 코드가 TypeScript에서 어떻게 달라지는지를 브라우저에서 직접 고쳐 보며 익힙니다.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href={href({ name: 'lesson', lessonId: nextLesson.id })}>
            {started ? '이어서 학습하기' : '첫 레슨 시작하기'} <ArrowRight />
          </a>
          <span className="hero__meta">
            레슨 {lessons.length}개 · 약 {lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)}분 · 설치 없음
          </span>
        </div>
      </section>

      <section className="hero-compare" aria-label="JavaScript와 TypeScript 비교">
        <CodeBlock code={heroJs} lang="jsx" title="지금까지 — JavaScript" tone="js" />
        <CodeBlock code={heroTs} lang="tsx" title="앞으로 — TypeScript" tone="ts" />
      </section>

      <section className="map" aria-labelledby="map-title">
        <div className="map__head">
          <h2 id="map-title">학습 지도</h2>
          <div className="map__progress">
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={doneCount} aria-label="완료한 레슨">
              <span style={{ width: `${(doneCount / lessons.length) * 100}%` }} />
            </div>
            <span>{doneCount} / {lessons.length} 완료</span>
            {started && <button className="link-btn" onClick={reset}>기록 지우기</button>}
          </div>
        </div>

        <ol className="chapters">
          {chapters.map((chapter, index) => (
            <li className="chapter" key={chapter.id}>
              <div className="chapter__info">
                <p className="chapter__from">{chapter.fromExperience}</p>
                <h3>
                  <span className="chapter__no">{index + 1}</span>
                  {chapter.title}
                </h3>
                <p>{chapter.description}</p>
              </div>
              <ol className="chapter__lessons">
                {lessonsOf(chapter.id).map((lesson) => {
                  const progress = selectLessonProgress(state, lesson);
                  return (
                    <li key={lesson.id}>
                      <a className="lesson-row" href={href({ name: 'lesson', lessonId: lesson.id })}>
                        <span className={`lesson-row__mark${progress.done ? ' is-done' : ''}`}>
                          {progress.done ? <CheckIcon width={12} height={12} /> : lessons.indexOf(lesson) + 1}
                        </span>
                        <span className="lesson-row__title">{lesson.title}</span>
                        <span className="lesson-row__time">{lesson.minutes}분</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </section>

      <section className="how">
        <h2>이렇게 진행됩니다</h2>
        <ol className="how__steps">
          <li>
            <strong>비교해서 읽기</strong>
            <span>같은 코드를 JS와 TS로 나란히 봅니다. 달라지는 부분만 눈에 들어옵니다.</span>
          </li>
          <li>
            <strong>에디터에서 고치기</strong>
            <span>VS Code와 같은 엔진이 브라우저에서 실제 타입 검사를 합니다. 자동완성과 오류 메시지도 동일합니다.</span>
          </li>
          <li>
            <strong>실습과 퀴즈로 확인</strong>
            <span>레슨마다 실습 1개, 퀴즈 2개. 진도는 이 브라우저에 저장됩니다.</span>
          </li>
        </ol>
      </section>
    </div>
  );
}
