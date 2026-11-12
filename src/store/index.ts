import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import progressReducer, { save } from './progressSlice';
import { lessons } from '../content';
import type { Lesson } from '../content/types';

export const store = configureStore({
  reducer: { progress: progressReducer },
});

store.subscribe(() => save(store.getState().progress));

// 스토어에서 타입을 "뽑아냅니다". 손으로 다시 적지 않으니 리듀서가 바뀌어도 항상 맞습니다.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 앱 전체에서 useDispatch/useSelector 대신 이 둘만 씁니다.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// ── 셀렉터 ──────────────────────────────────────────────

export interface LessonProgress {
  exerciseDone: boolean;
  quizCorrect: number;
  quizTotal: number;
  done: boolean;
}

export function selectLessonProgress(state: RootState, lesson: Lesson): LessonProgress {
  const exerciseDone = state.progress.exercises[lesson.exercise.id] === true;
  const quizCorrect = lesson.quiz.filter((q) => state.progress.quiz[q.id] === q.answer).length;
  const quizTotal = lesson.quiz.length;
  return { exerciseDone, quizCorrect, quizTotal, done: exerciseDone && quizCorrect === quizTotal };
}

export function selectDoneCount(state: RootState): number {
  return lessons.filter((lesson) => selectLessonProgress(state, lesson).done).length;
}
