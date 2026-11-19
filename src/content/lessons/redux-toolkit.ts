import type { Lesson } from '../types';

// 자리 표시용 임시 레슨입니다.
export const lesson: Lesson = {
  id: 'redux-toolkit',
  chapter: 'redux',
  title: 'redux-toolkit',
  summary: '준비 중',
  minutes: 10,
  steps: [
    {
      id: 'redux-toolkit-1',
      title: 'RTK 테스트',
      body: [],
      runner: 'react',
      errors: 2,
      code: `import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    added(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});
const { added } = counterSlice.actions;
const store = configureStore({ reducer: { counter: counterSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
const useAppSelector = useSelector.withTypes<RootState>();
const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();

store.subscribe(() => console.log('state', store.getState()));
store.dispatch(added(5));
store.dispatch(added('5'));

function Counter() {
  const value = useAppSelector((state) => state.counter.value);
  const typo = useAppSelector((state) => state.count.value);
  const dispatch = useAppDispatch();
  return <button onClick={() => dispatch(added(1))}>값: {value}</button>;
}

export default function App() {
  return <Provider store={store}><Counter /></Provider>;
}
`,
      throws: true,
    },
  ],
  exercise: {
    id: 'ex-redux-toolkit',
    title: '준비 중',
    prompt: '준비 중',
    runner: 'console',
    starter: 'const value = 1;',
    tests: "// @ts-expect-error 준비 중\nconst text: string = value;\nconsole.log(text);",
    solution: "const value = 'a';",
    hints: [],
  },
  quiz: [],
};
