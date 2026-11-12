import { useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { buildExerciseCode, grade, type GradeResult } from '../lib/grade';
import { useAppDispatch, useAppSelector } from '../store';
import { exercisePassed } from '../store/progressSlice';
import { Playground, type PlaygroundApi } from './Playground';
import { RichText } from './RichText';
import { CodeBlock } from './CodeBlock';
import { CheckIcon } from './Icons';

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const dispatch = useAppDispatch();
  const alreadyPassed = useAppSelector((state) => state.progress.exercises[exercise.id] === true);

  const apiRef = useRef<PlaygroundApi | null>(null);
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

  const reset = () => {
    apiRef.current?.setValue(buildExerciseCode(exercise));
    setResult(null);
  };

  const hasMoreHints = hintCount < exercise.hints.length;

  return (
    <section className="exercise" aria-labelledby={`${exercise.id}-title`}>
      <header className="exercise__head">
        <span className="eyebrow">실습</span>
        <h2 id={`${exercise.id}-title`}>{exercise.title}</h2>
        {alreadyPassed && (
          <span className="done-tag"><CheckIcon /> 통과함</span>
        )}
      </header>
      <p className="exercise__prompt"><RichText text={exercise.prompt} /></p>

      <Playground
        id={exercise.id}
        code={buildExerciseCode(exercise)}
        jsx={exercise.jsx}
        apiRef={apiRef}
        onEdit={() => setResult(null)}
      />

      <div className="exercise__actions">
        <button className="btn btn--primary" onClick={check} disabled={checking}>
          {checking ? '채점 중…' : '채점하기'}
        </button>
        {hasMoreHints && (
          <button className="btn" onClick={() => setHintCount((n) => n + 1)}>
            힌트 보기 ({hintCount}/{exercise.hints.length})
          </button>
        )}
        <button className="btn" onClick={reset}>처음으로</button>
        <button className="btn btn--quiet" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>
          {showSolution ? '정답 숨기기' : '정답 보기'}
        </button>
      </div>

      <div aria-live="polite">
        {result?.ok && (
          <div className="result result--good">
            <strong>통과했습니다.</strong> 채점 코드의 <code>@ts-expect-error</code> 줄들은 "여기는 오류가 나야 한다"는 검사였습니다. 잘못된 사용까지 정확히 막아 냈다는 뜻입니다.
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

      {showSolution && <CodeBlock code={exercise.solution} lang={exercise.jsx ? 'tsx' : 'ts'} title="정답 예시" />}
    </section>
  );
}
