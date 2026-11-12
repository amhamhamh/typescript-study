export interface CheatRow {
  before: string;
  after: string;
  note?: string;
}

export interface CheatGroup {
  title: string;
  beforeLabel: string;
  rows: CheatRow[];
}

export const cheatsheet: CheatGroup[] = [
  {
    title: 'JavaScript → TypeScript',
    beforeLabel: 'JS에서 하던 것',
    rows: [
      { before: 'function f(a, b) {}', after: 'function f(a: number, b: string): void {}', note: '매개변수는 반드시, 반환 타입은 선택' },
      { before: 'const list = []', after: 'const list: Item[] = []', note: '빈 배열은 타입을 알려 줘야 함' },
      { before: 'let user = null', after: 'let user: User | null = null' },
      { before: "const STATUS = { LOADING: 'loading', ... }", after: "type Status = 'idle' | 'loading' | 'done'", note: '문자열 리터럴 유니온' },
      { before: "typeof x === 'string' 방어 코드", after: '그대로 — TS가 블록 안에서 타입을 좁혀 줌' },
      { before: 'user && user.name', after: 'user?.name', note: 'JS와 동일. TS가 필요한 곳을 알려 줌' },
      { before: '/** @param {string} id */ JSDoc', after: 'id: string' },
      { before: '객체를 복사해 일부만 바꾸기', after: 'Partial<T> · Pick<T, K> · Omit<T, K>' },
    ],
  },
  {
    title: 'React',
    beforeLabel: 'JS + React',
    rows: [
      { before: 'Comp.propTypes = { title: PropTypes.string.isRequired }', after: 'interface Props { title: string }' },
      { before: 'PropTypes.oneOf([\'sm\', \'lg\'])', after: "size: 'sm' | 'lg'" },
      { before: 'PropTypes.node', after: 'children: ReactNode' },
      { before: 'PropTypes.func', after: 'onPress: () => void', note: '인자가 있으면 (id: number) => void' },
      { before: 'Comp.defaultProps = { size: 40 }', after: 'function Comp({ size = 40 }: Props)' },
      { before: 'useState(null)', after: 'useState<User | null>(null)' },
      { before: 'useRef(null)', after: 'useRef<HTMLInputElement>(null)', note: 'RN: useRef<TextInput>(null)' },
      { before: '(e) => setValue(e.target.value)', after: '(e: ChangeEvent<HTMLInputElement>) => ...', note: '인라인이면 타입 생략 가능' },
      { before: 'createContext()', after: 'createContext<Auth | null>(null)' },
    ],
  },
  {
    title: 'Redux',
    beforeLabel: 'JS + Redux',
    rows: [
      { before: "const ADD = 'todos/add' 상수", after: "{ type: 'todos/added'; payload: Todo } 유니온", note: 'RTK를 쓰면 자동 생성' },
      { before: 'reducer(state = initial, action)', after: 'reducer(state: State, action: Action): State' },
      { before: 'createSlice의 리듀서 (state, action)', after: '(state, action: PayloadAction<Todo>)' },
      { before: 'useSelector((state) => state.todos)', after: 'useAppSelector((state) => state.todos)', note: 'useSelector.withTypes<RootState>()' },
      { before: 'useDispatch()', after: 'useAppDispatch()', note: 'thunk 디스패치까지 타입 지원' },
      { before: 'mapStateToProps(state)', after: 'mapStateToProps(state: RootState)' },
      { before: '{ loading, data, error }', after: "{ status: 'loading' } | { status: 'success'; data: T } | ...", note: '불가능한 조합 제거' },
    ],
  },
  {
    title: 'React Native',
    beforeLabel: 'JS + RN',
    rows: [
      { before: 'style prop 받기', after: 'style?: StyleProp<ViewStyle>' },
      { before: 'TouchableOpacity를 감싼 버튼', after: 'interface Props extends TouchableOpacityProps' },
      { before: "navigation.navigate('Detail', { id })", after: 'RootStackParamList 선언 → 화면 이름과 params 검사' },
      { before: 'route.params.id', after: "NativeStackScreenProps<RootStackParamList, 'Detail'>" },
      { before: 'renderItem={({ item }) => ...}', after: '그대로 — data 타입에서 item이 추론됨' },
      { before: "Platform.OS === 'ios'", after: '그대로 — 오타는 오류' },
      { before: 'NativeModules.MyModule.doIt()', after: '인터페이스를 선언한 래퍼 파일로 감싸기' },
      { before: '타입 없는 라이브러리 import', after: "declare module '라이브러리-이름'", note: '.d.ts 파일에 선언' },
    ],
  },
];
