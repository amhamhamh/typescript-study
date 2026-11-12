import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 레슨 10 "Redux Toolkit"에서 배우는 패턴 그대로입니다.
// 1) 상태의 모양을 interface로 선언하고
// 2) 리듀서의 action에는 PayloadAction<페이로드 타입>을 붙입니다.

export type Theme = 'light' | 'dark';

export interface ProgressState {
  /** 통과한 실습 id → true */
  exercises: Record<string, true>;
  /** 퀴즈 문항 id → 고른 보기의 인덱스 */
  quiz: Record<string, number>;
  theme: Theme | null;
}

const STORAGE_KEY = 'ts-for-react-devs/v1';

function load(): ProgressState {
  const empty: ProgressState = { exercises: {}, quiz: {}, theme: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    // JSON.parse의 결과는 any입니다. 그대로 믿지 않고 필요한 만큼만 확인합니다. (레슨 11)
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return empty;
    const saved = data as Partial<ProgressState>;
    return {
      exercises: saved.exercises ?? {},
      quiz: saved.quiz ?? {},
      theme: saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : null,
    };
  } catch {
    return empty;
  }
}

export function save(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 시크릿 모드 등 저장이 막힌 환경에서는 조용히 넘어갑니다.
  }
}

const progressSlice = createSlice({
  name: 'progress',
  initialState: load,
  reducers: {
    exercisePassed(state, action: PayloadAction<string>) {
      state.exercises[action.payload] = true;
    },
    quizAnswered(state, action: PayloadAction<{ questionId: string; choice: number }>) {
      state.quiz[action.payload.questionId] = action.payload.choice;
    },
    themeChanged(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    progressReset(state) {
      state.exercises = {};
      state.quiz = {};
    },
  },
});

export const { exercisePassed, quizAnswered, themeChanged, progressReset } = progressSlice.actions;
export default progressSlice.reducer;
