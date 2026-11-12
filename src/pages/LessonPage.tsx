import { chapters, lessons, neighbors } from '../content';
import type { Lesson } from '../content/types';
import { href } from '../lib/router';
import { selectLessonProgress, useAppSelector } from '../store';
import { BlockView } from '../components/Blocks';
import { ExerciseCard } from '../components/ExerciseCard';
import { Quiz } from '../components/Quiz';
import { RichText } from '../components/RichText';
import { ArrowLeft, ArrowRight, CheckIcon } from '../components/Icons';

export function LessonPage({ lesson }: { lesson: Lesson }) {
  const progress = useAppSelector((state) => selectLessonProgress(state, lesson));
  const chapter = chapters.find((c) => c.id === lesson.chapter);
  const { prev, next } = neighbors(lesson.id);
  const number = lessons.indexOf(lesson) + 1;

  return (
    <article className="lesson">
      <header className="lesson__head">
        <p className="eyebrow">
          레슨 {number} / {lessons.length} · {chapter?.title} · 약 {lesson.minutes}분
        </p>
        <h1>{lesson.title}</h1>
        <p className="lesson__summary"><RichText text={lesson.summary} /></p>
      </header>

      <div className="prose">
        {lesson.blocks.map((block, index) => (
          <BlockView key={index} block={block} />
        ))}
      </div>

      <ExerciseCard key={lesson.exercise.id} exercise={lesson.exercise} />
      <Quiz questions={lesson.quiz} />

      <footer className="lesson__foot">
        <div className={`lesson__status${progress.done ? ' is-done' : ''}`}>
          {progress.done ? (
            <><CheckIcon /> 이 레슨을 완료했습니다</>
          ) : (
            <>
              완료 조건: 실습 {progress.exerciseDone ? '통과' : '미통과'} · 퀴즈 {progress.quizCorrect}/{progress.quizTotal}
            </>
          )}
        </div>
        <div className="lesson__nav">
          {prev ? (
            <a className="btn" href={href({ name: 'lesson', lessonId: prev.id })}>
              <ArrowLeft /> {prev.title.split(':')[0]}
            </a>
          ) : <span />}
          {next ? (
            <a className="btn btn--primary" href={href({ name: 'lesson', lessonId: next.id })}>
              다음: {next.title.split(':')[0]} <ArrowRight />
            </a>
          ) : (
            <a className="btn btn--primary" href={href({ name: 'cheatsheet' })}>
              치트시트로 정리하기 <ArrowRight />
            </a>
          )}
        </div>
      </footer>
    </article>
  );
}
