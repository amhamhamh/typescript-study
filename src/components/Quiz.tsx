import type { QuizQuestion } from '../content/types';
import { useAppDispatch, useAppSelector } from '../store';
import { quizAnswered } from '../store/progressSlice';
import { RichText } from './RichText';
import { CodeBlock } from './CodeBlock';

function Question({ question, index }: { question: QuizQuestion; index: number }) {
  const dispatch = useAppDispatch();
  // 고르지 않았으면 undefined. Record<string, number>라도 없는 키일 수 있다는 걸 타입에 적어 둡니다.
  const chosen: number | undefined = useAppSelector((state) => state.progress.quiz[question.id]);
  const answered = chosen !== undefined;
  const correct = chosen === question.answer;

  return (
    <fieldset className="question">
      <legend>
        <span className="question__no">Q{index + 1}</span>
        <RichText text={question.question} />
      </legend>
      {question.code && <CodeBlock code={question.code} />}
      <div className="question__options">
        {question.options.map((option, optionIndex) => {
          const isChosen = chosen === optionIndex;
          const state = !isChosen ? '' : correct ? ' is-correct' : ' is-wrong';
          return (
            <label key={option} className={`option${state}`}>
              <input
                type="radio"
                name={question.id}
                checked={isChosen}
                onChange={() => dispatch(quizAnswered({ questionId: question.id, choice: optionIndex }))}
              />
              <span><RichText text={option} /></span>
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <p className={`question__feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
            <strong>{correct ? '정답입니다.' : '다시 생각해 보세요.'}</strong>{' '}
            {correct && <RichText text={question.explanation} />}
          </p>
        )}
      </div>
    </fieldset>
  );
}

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <header className="exercise__head">
        <span className="eyebrow">확인 퀴즈</span>
        <h2 id="quiz-title">이해했는지 점검하기</h2>
      </header>
      {questions.map((question, index) => (
        <Question key={question.id} question={question} index={index} />
      ))}
    </section>
  );
}
