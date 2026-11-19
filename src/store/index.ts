import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import progressReducer, { save, type Theme } from './progressSlice';
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

/** 저장된 테마가 없으면 시스템 설정을 따릅니다. */
export function selectTheme(state: RootState): Theme {
  if (state.progress.theme) return state.progress.theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface LessonProgress {
  missionsDone: number;
  missionsTotal: number;
  exerciseDone: boolean;
  quizCorrect: number;
  quizTotal: number;
  done: boolean;
}

export function selectLessonProgress(state: RootState, lesson: Lesson): LessonProgress {
  const exerciseDone = state.progress.exercises[lesson.exercise.id] === true;
  const quizCorrect = lesson.quiz.filter((q) => state.progress.quiz[q.id] === q.answer).length;
  const quizTotal = lesson.quiz.length;
  const withMission = lesson.steps.filter((step) => step.mission);
  const missionsDone = withMission.filter((step) => state.progress.missions[step.id] === true).length;
  return {
    missionsDone,
    missionsTotal: withMission.length,
    exerciseDone,
    quizCorrect,
    quizTotal,
    // 레슨 완료 기준은 실습 통과 + 퀴즈 전부 정답입니다. 미션은 과정에서의 연습으로 따로 셉니다.
    done: exerciseDone && quizCorrect === quizTotal,
  };
}

export function selectDoneCount(state: RootState): number {
  return lessons.filter((lesson) => selectLessonProgress(state, lesson).done).length;
}
