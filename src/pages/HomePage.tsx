import { chapters, lessons, lessonsOf } from '../content';
import { href, lessonHref } from '../lib/router';
import { selectDoneCount, selectLessonProgress, useAppDispatch, useAppSelector } from '../store';
import { progressReset } from '../store/progressSlice';
import { Workbench } from '../components/Workbench';
import { ArrowRight, CheckIcon } from '../components/Icons';

// 첫 화면에서 바로 만져 볼 수 있는 예제. 일부러 타입 오류 하나를 넣어 두었습니다.
const demoCode = `import { useState } from 'react';

interface LikeButtonProps {
  label: string;
  initial?: number;
}

function LikeButton({ label, initial = 0 }: LikeButtonProps) {
  const [count, setCount] = useState(initial);
  return (
    <button className="primary" onClick={() => setCount(count + 1)}>
      {label} {count}
    </button>
  );
}

export default function App() {
  return (
    <div className="stack">
      <h3>버튼을 눌러 보세요</h3>
      <div className="row">
        <LikeButton label="좋아요" />
        <LikeButton label="응원해요" initial="10" />
      </div>
      <p className="muted">"응원해요"는 11이 아니라 101이 됩니다.</p>
    </div>
  );
}
`;

export function HomePage() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s);
  const doneCount = selectDoneCount(state);
  const nextLesson = lessons.find((lesson) => !selectLessonProgress(state, lesson).done) ?? lessons[0];
  const { exercises, missions, quiz } = state.progress;
  const started = [exercises, missions, quiz].some((record) => Object.keys(record).length > 0);
  const stepCount = lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
  const missionCount = lessons.reduce((sum, lesson) => sum + lesson.steps.filter((step) => step.mission).length, 0);

  const reset = () => {
    if (window.confirm('학습 기록을 모두 지울까요?')) dispatch(progressReset());
  };

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">React · React Native · Redux 경험자를 위한</p>
        <h1>
          고치면 바로 보이는<br />TypeScript 실습
        </h1>
        <p className="hero__lead">
          읽기만 하는 강의가 아닙니다. 에디터에서 코드를 고치면 <strong>미리보기와 콘솔</strong>이 즉시 바뀌고,
          타입 검사가 어느 줄이 왜 위험한지 알려 줍니다. PropTypes, <code>useState</code>, 리듀서, <code>navigation.navigate</code>처럼
          이미 손에 익은 코드에서 출발합니다.
        </p>
        <div className="hero__actions">
          {nextLesson && (
            <a className="btn btn--primary btn--lg" href={lessonHref(nextLesson.id)}>
              {started ? '이어서 학습하기' : '첫 레슨 시작하기'} <ArrowRight />
            </a>
          )}
          <span className="hero__meta">
            레슨 {lessons.length}개 · 실습 단계 {stepCount}개 · 미션 {missionCount}개 · 설치 없음
          </span>
        </div>
      </section>

      <section className="demo" aria-labelledby="demo-title">
        <div className="demo__head">
          <h2 id="demo-title">지금 바로 고쳐 보세요</h2>
          <p>
            23행의 <code>initial="10"</code>은 숫자 자리에 문자열을 넣은 버그입니다. 타입 검사는 이미 알고 있고, 미리보기에서 버튼을 눌러 보면
            실제로 어떻게 망가지는지 보입니다. <code>{'initial={10}'}</code>으로 고치면 둘 다 해결됩니다.
          </p>
        </div>
        <div className="demo__bench">
          <Workbench id="home-demo" code={demoCode} runner="react" />
        </div>
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
                      <a className="lesson-row" href={lessonHref(lesson.id)}>
                        <span className={`lesson-row__mark${progress.done ? ' is-done' : ''}`}>
                          {progress.done ? <CheckIcon width={12} height={12} /> : lessons.indexOf(lesson) + 1}
                        </span>
                        <span className="lesson-row__title">{lesson.title}</span>
                        <span className="lesson-row__time">
                          {progress.missionsTotal > 0 && `미션 ${progress.missionsDone}/${progress.missionsTotal} · `}
                          {lesson.minutes}분
                        </span>
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
        <h2>레슨은 이렇게 진행됩니다</h2>
        <ol className="how__steps">
          <li>
            <strong>짧게 읽고</strong>
            <span>한 단계에 개념 하나. 익숙한 JS 코드와 나란히 놓고 달라지는 부분만 봅니다.</span>
          </li>
          <li>
            <strong>바로 고쳐 보고</strong>
            <span>단계마다 미션이 있습니다. 에디터에서 고치면 콘솔·미리보기·타입 검사가 즉시 반응하고, 목표를 달성하면 자동으로 체크됩니다.</span>
          </li>
          <li>
            <strong>과제로 확인</strong>
            <span>레슨 끝의 실습 과제와 퀴즈로 마무리합니다. 진도는 이 브라우저에 저장됩니다.</span>
          </li>
        </ol>
        <p className="how__link">
          빠르게 찾아볼 때는 <a href={href({ name: 'cheatsheet' })}>JS → TS 치트시트</a>를 이용하세요.
        </p>
      </section>
    </div>
  );
}
