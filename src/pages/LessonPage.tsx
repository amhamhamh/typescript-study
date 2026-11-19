import { useCallback, useRef, useState } from 'react';
import { chapters, lessons, neighbors } from '../content';
import type { Exercise, Lesson, Step } from '../content/types';
import { describeGoal, meetsGoal, type Observation } from '../lib/goal';
import { buildExerciseCode, grade, type GradeResult } from '../lib/grade';
import { href, lessonHref, type LessonPart } from '../lib/router';
import { selectLessonProgress, useAppDispatch, useAppSelector } from '../store';
import { exercisePassed, missionCompleted } from '../store/progressSlice';
import { BlockView } from '../components/Blocks';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowLeft, ArrowRight, CheckIcon } from '../components/Icons';
import { Quiz } from '../components/Quiz';
import { RichText } from '../components/RichText';
import { Workbench, type BenchReport, type WorkbenchApi } from '../components/Workbench';

interface LessonPageProps {
  lesson: Lesson;
  part: LessonPart;
}

/** 레슨을 이루는 화면 순서: 단계 1..n → 실습 → 퀴즈 */
function partsOf(lesson: Lesson): LessonPart[] {
  return [...lesson.steps.map((_, index) => index + 1), 'exercise', 'quiz'];
}

function partLabel(part: LessonPart): string {
  return part === 'exercise' ? '실습' : part === 'quiz' ? '퀴즈' : String(part);
}

// ── 위쪽 단계 표시 ───────────────────────────────────────

function Stepper({ lesson, part }: LessonPageProps) {
  const state = useAppSelector((s) => s);
  const progress = selectLessonProgress(state, lesson);

  const isDone = (target: LessonPart): boolean => {
    if (target === 'exercise') return progress.exerciseDone;
    if (target === 'quiz') return progress.quizTotal > 0 && progress.quizCorrect === progress.quizTotal;
    const step = lesson.steps[target - 1];
    return step !== undefined && state.progress.missions[step.id] === true;
  };

  return (
    <ol className="stepper" aria-label="레슨 진행 단계">
      {partsOf(lesson).map((target) => {
        const current = target === part;
        const done = isDone(target);
        const title = typeof target === 'number' ? lesson.steps[target - 1]?.title : partLabel(target);
        return (
          <li key={target}>
            <a
              className={`stepper__item${current ? ' is-current' : ''}${done ? ' is-done' : ''}${typeof target === 'number' ? '' : ' is-wide'}`}
              href={lessonHref(lesson.id, target)}
              aria-current={current ? 'step' : undefined}
              title={title}
            >
              {done && !current ? <CheckIcon width={12} height={12} /> : partLabel(target)}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function GuideHead({ lesson, part }: LessonPageProps) {
  const chapter = chapters.find((c) => c.id === lesson.chapter);
  const number = lessons.indexOf(lesson) + 1;
  return (
    <header className="guide__head">
      <p className="eyebrow">
        레슨 {number} / {lessons.length} · {chapter?.title}
      </p>
      <p className="guide__lesson">{lesson.title}</p>
      <Stepper lesson={lesson} part={part} />
    </header>
  );
}

function GuideNav({ lesson, part }: LessonPageProps) {
  const parts = partsOf(lesson);
  const index = parts.indexOf(part);
  const prevPart = parts[index - 1];
  const nextPart = parts[index + 1];
  const { prev, next } = neighbors(lesson.id);

  return (
    <footer className="guide__nav">
      {prevPart !== undefined ? (
        <a className="btn" href={lessonHref(lesson.id, prevPart)}>
          <ArrowLeft /> 이전
        </a>
      ) : prev ? (
        <a className="btn" href={lessonHref(prev.id, 'quiz')}>
          <ArrowLeft /> 이전 레슨
        </a>
      ) : (
        <span />
      )}
      {nextPart !== undefined ? (
        <a className="btn btn--primary" href={lessonHref(lesson.id, nextPart)}>
          {nextPart === 'exercise' ? '실습 과제로' : nextPart === 'quiz' ? '퀴즈로' : '다음'} <ArrowRight />
        </a>
      ) : next ? (
        <a className="btn btn--primary" href={lessonHref(next.id)}>
          다음 레슨: {next.title.split(':')[0]} <ArrowRight />
        </a>
      ) : (
        <a className="btn btn--primary" href={href({ name: 'cheatsheet' })}>
          치트시트로 정리하기 <ArrowRight />
        </a>
      )}
    </footer>
  );
}

// ── 단계: 설명 + 미션 ────────────────────────────────────

const emptyReport: BenchReport = { typeErrors: null, console: '', preview: '', edited: false };

/** 목표의 각 조건이 지금 충족됐는지 한 줄씩 보여 주기 위한 계산 */
function goalChecks(step: Step, seen: Observation): Array<{ label: string; met: boolean }> {
  const goal = step.mission?.goal ?? {};
  const labels = describeGoal(goal);
  const single = [
    ...(goal.noTypeErrors ? [{ noTypeErrors: true }] : []),
    ...(goal.consoleIncludes ?? []).map((text) => ({ consoleIncludes: [text] })),
    ...(goal.previewIncludes ?? []).map((text) => ({ previewIncludes: [text] })),
  ];
  return labels.map((label, index) => ({ label, met: meetsGoal(single[index] ?? {}, seen) }));
}

function StepView({ lesson, step, part }: { lesson: Lesson; step: Step; part: number }) {
  const dispatch = useAppDispatch();
  const completed = useAppSelector((state) => state.progress.missions[step.id] === true);
  const apiRef = useRef<WorkbenchApi | null>(null);
  const [report, setReport] = useState<BenchReport>(emptyReport);
  const [showHint, setShowHint] = useState(false);
  const mission = step.mission;

  const onReport = useCallback(
    (next: BenchReport) => {
      setReport(next);
      // 코드를 실제로 고쳤고, 목표를 모두 만족하면 미션 완료로 기록합니다.
      if (mission && next.edited && meetsGoal(mission.goal, next)) dispatch(missionCompleted(step.id));
    },
    [dispatch, mission, step.id],
  );

  return (
    <div className="ws">
      <aside className="guide">
        <GuideHead lesson={lesson} part={part} />
        <div className="guide__body">
          <h1 className="guide__title">{step.title}</h1>
          <div className="prose">
            {step.body.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}
          </div>

          {mission && (
            <section className={`mission${completed ? ' is-done' : ''}`} aria-live="polite">
              <header className="mission__head">
                <span className="mission__tag">{completed ? <><CheckIcon width={12} height={12} /> 미션 완료</> : '미션'}</span>
                <span className="mission__where">오른쪽 에디터에서 직접 고쳐 보세요</span>
              </header>
              <p className="mission__text"><RichText text={mission.text} /></p>
              <ul className="mission__goals">
                {goalChecks(step, report).map((check) => {
                  const met = check.met && report.edited;
                  return (
                    <li key={check.label} className={met ? 'is-met' : ''}>
                      <span className="mission__box" aria-hidden="true">{met && <CheckIcon width={11} height={11} />}</span>
                      <RichText text={check.label} />
                    </li>
                  );
                })}
              </ul>
              <div className="mission__actions">
                {mission.hint && (
                  <button className="btn btn--small" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
                    {showHint ? '힌트 숨기기' : '힌트'}
                  </button>
                )}
                <button className="btn btn--small btn--quiet" onClick={() => apiRef.current?.setValue(mission.answer)}>
                  정답 코드 넣기
                </button>
              </div>
              {showHint && mission.hint && <p className="mission__hint"><RichText text={mission.hint} /></p>}
            </section>
          )}
        </div>
        <GuideNav lesson={lesson} part={part} />
      </aside>

      <section className="bench">
        <Workbench key={step.id} id={step.id} code={step.code} runner={step.runner} fill apiRef={apiRef} onReport={onReport} />
      </section>
    </div>
  );
}

// ── 실습 과제 ────────────────────────────────────────────

function ExerciseView({ lesson, exercise }: { lesson: Lesson; exercise: Exercise }) {
  const dispatch = useAppDispatch();
  const alreadyPassed = useAppSelector((state) => state.progress.exercises[exercise.id] === true);
  const apiRef = useRef<WorkbenchApi | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    const api = apiRef.current;
    if (!api) return;
    setChecking(true);
    const diagnostics = await api.diagnose();
    const graded = grade(exercise, api.getValue(), diagnostics.length);
    setResult(graded);
    setChecking(false);
    if (graded.ok) dispatch(exercisePassed(exercise.id));
  };

  // 코드를 고치면 이전 채점 결과는 더 이상 맞지 않으므로 지웁니다.
  const onEdit = useCallback(() => setResult(null), []);
  const hasMoreHints = hintCount < exercise.hints.length;

  return (
    <div className="ws">
      <aside className="guide">
        <GuideHead lesson={lesson} part="exercise" />
        <div className="guide__body">
          <p className="eyebrow">실습 과제</p>
          <h1 className="guide__title">
            {exercise.title}
            {alreadyPassed && <span className="done-tag"><CheckIcon width={12} height={12} /> 통과함</span>}
          </h1>
          <div className="prose">
            <p><RichText text={exercise.prompt} /></p>
            <p className="muted">
              에디터 아래쪽의 <strong>채점용 코드</strong>는 고치지 마세요. <code>@ts-expect-error</code>가 붙은 줄은 "여기는 반드시 타입 오류가 나야 한다"는 검사입니다.
            </p>
          </div>

          <div className="exercise__actions">
            <button className="btn btn--primary" onClick={check} disabled={checking}>
              {checking ? '채점 중…' : '채점하기'}
            </button>
            {hasMoreHints && (
              <button className="btn" onClick={() => setHintCount((n) => n + 1)}>
                힌트 ({hintCount}/{exercise.hints.length})
              </button>
            )}
            <button className="btn btn--quiet" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>
              {showSolution ? '정답 숨기기' : '정답 보기'}
            </button>
          </div>

          <div aria-live="polite">
            {result?.ok && (
              <div className="result result--good">
                <strong>통과했습니다.</strong> 올바른 사용은 허용하고 잘못된 사용은 막는 타입을 만들었습니다.
              </div>
            )}
            {result && !result.ok && (
              <div className="result result--bad">
                <strong>아직 통과하지 못했어요.</strong>
                <ul>
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {hintCount > 0 && (
            <ol className="hints">
              {exercise.hints.slice(0, hintCount).map((hint) => (
                <li key={hint}><RichText text={hint} /></li>
              ))}
            </ol>
          )}
          {showSolution && <CodeBlock code={exercise.solution} lang={exercise.runner === 'console' ? 'ts' : 'tsx'} title="정답 예시" />}
        </div>
        <GuideNav lesson={lesson} part="exercise" />
      </aside>

      <section className="bench">
        <Workbench
          key={exercise.id}
          id={exercise.id}
          code={buildExerciseCode(exercise)}
          runner={exercise.runner}
          fill
          apiRef={apiRef}
          onEdit={onEdit}
        />
      </section>
    </div>
  );
}

// ── 퀴즈 ─────────────────────────────────────────────────

function QuizView({ lesson }: { lesson: Lesson }) {
  const state = useAppSelector((s) => s);
  const progress = selectLessonProgress(state, lesson);

  return (
    <div className="ws ws--single">
      <div className="guide guide--wide">
        <GuideHead lesson={lesson} part="quiz" />
        <div className="guide__body">
          <p className="eyebrow">확인 퀴즈</p>
          <h1 className="guide__title">이해했는지 점검하기</h1>
          <Quiz questions={lesson.quiz} />

          <div className={`lesson-status${progress.done ? ' is-done' : ''}`}>
            {progress.done ? (
              <><CheckIcon /> 이 레슨을 완료했습니다</>
            ) : (
              <>
                완료 조건 — 실습 과제 {progress.exerciseDone ? '통과' : '미통과'} · 퀴즈 {progress.quizCorrect}/{progress.quizTotal}
                {!progress.exerciseDone && <> · <a href={lessonHref(lesson.id, 'exercise')}>실습 과제로 가기</a></>}
              </>
            )}
            {progress.missionsTotal > 0 && (
              <span className="lesson-status__extra">미션 {progress.missionsDone}/{progress.missionsTotal}</span>
            )}
          </div>
        </div>
        <GuideNav lesson={lesson} part="quiz" />
      </div>
    </div>
  );
}

export function LessonPage({ lesson, part }: LessonPageProps) {
  if (part === 'quiz') return <QuizView lesson={lesson} />;
  if (part === 'exercise') return <ExerciseView lesson={lesson} exercise={lesson.exercise} />;

  // 범위를 벗어난 단계 번호는 마지막 단계로 맞춥니다.
  const index = Math.min(part, lesson.steps.length) - 1;
  const step = lesson.steps[index];
  if (!step) return <QuizView lesson={lesson} />;
  return <StepView key={step.id} lesson={lesson} step={step} part={index + 1} />;
}
