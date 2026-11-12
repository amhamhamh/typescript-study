import type { Lesson } from '../types';

export const nativeLessons: Lesson[] = [
  {
    id: 'react-native',
    chapter: 'native',
    title: 'React Native: 스타일, 리스트, 내비게이션',
    summary: 'RN에서 타입이 가장 큰 효과를 내는 세 곳 — StyleSheet, FlatList, 그리고 화면 간 params.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: 'RN은 이미 TS가 기본입니다',
        text: '지금 `npx @react-native-community/cli init`이나 Expo로 새 프로젝트를 만들면 TypeScript 템플릿이 기본으로 생성됩니다. 웹 React에서 배운 props/hooks 타이핑은 그대로 쓰고, 여기서는 RN에서만 만나는 것들을 봅니다.',
      },
      { kind: 'h', text: '스타일: 잘못된 속성을 미리 잡기' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { StyleSheet, View, Text } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',    // 'row' | 'column' | ... 자동완성
    // flexDirection: 'horizontal'  ← 오류
    // fontSize: 14                 ← View 스타일로 쓰면 오류
  },
  title: { fontSize: 18, fontWeight: '700' },
});

// 바깥에서 스타일을 받는 컴포넌트
interface CardProps {
  title: string;
  style?: StyleProp<ViewStyle>;      // 객체, 배열, false 모두 허용
  titleStyle?: StyleProp<TextStyle>;
}

function Card({ title, style, titleStyle }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
  );
}`,
      },
      { kind: 'h', text: '기본 컴포넌트의 props 물려받기' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { Pressable, Text } from 'react-native';
import type { PressableProps } from 'react-native';

// 웹의 ComponentProps<'button'>과 같은 역할. RN은 컴포넌트마다 XxxProps를 내보냅니다.
interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'ghost';
}

function AppButton({ label, variant = 'primary', ...rest }: AppButtonProps) {
  return (
    <Pressable accessibilityRole="button" {...rest}>
      <Text>{label}</Text>
    </Pressable>
  );
}`,
      },
      { kind: 'h', text: 'FlatList: 제네릭 컴포넌트' },
      {
        kind: 'code',
        lang: 'tsx',
        code: `import { FlatList, Text } from 'react-native';
import type { ListRenderItem } from 'react-native';

interface Product { id: string; title: string; price: number }

// data의 타입에서 item의 타입이 자동으로 추론됩니다.
<FlatList
  data={products}                     // Product[]
  keyExtractor={(item) => item.id}    // item: Product
  renderItem={({ item }) => <Text>{item.title}</Text>}
/>

// renderItem을 따로 뺄 때
const renderItem: ListRenderItem<Product> = ({ item, index }) => (
  <Text>{index + 1}. {item.title}</Text>
);`,
      },
      { kind: 'h', text: 'React Navigation: 화면별 params 타입' },
      {
        kind: 'p',
        text: 'RN에서 타입 효과가 가장 큰 곳입니다. `navigation.navigate(\'Detail\', { id })`에서 화면 이름 오타, params 누락, `route.params.productId`인지 `id`인지 헷갈리던 문제가 전부 컴파일 오류로 바뀝니다. **화면 이름 → params** 지도를 한 번만 적어 두면 됩니다.',
      },
      {
        kind: 'code',
        lang: 'tsx',
        title: 'navigation/types.ts + 화면',
        code: `import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// 화면 이름: 받는 params (없으면 undefined)
export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  Review: { productId: string; rating?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 화면 컴포넌트: navigation과 route의 타입이 한 번에 붙습니다.
type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params; // string

  navigation.navigate('Review', { productId });      // OK
  // navigation.navigate('Reviews', { productId });  ← 오류: 화면 이름 오타
  // navigation.navigate('Review');                  ← 오류: params 누락
  return null;
}`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: '플랫폼 분기와 네이티브 모듈',
        text: '`Platform.OS`는 `\'ios\' | \'android\' | \'web\' | ...` 유니온이라 오타가 잡힙니다. `Platform.select({ ios: 12, android: 8 })`의 결과 타입도 추론됩니다. 직접 만든 네이티브 모듈은 `NativeModules.MyModule`이 any이므로, 인터페이스를 선언해 감싸는 래퍼 파일을 하나 두는 것이 일반적입니다.',
      },
    ],
    exercise: {
      id: 'ex-react-native',
      title: '타입 안전한 navigate 만들기',
      prompt: 'React Navigation이 내부에서 하는 일을 직접 구현해 봅니다. `navigate`가 화면 이름에 따라 **그 화면의 params 타입만** 받도록 제네릭을 붙여 보세요. 레슨 4의 `K extends keyof T`와 `T[K]`를 그대로 쓰면 됩니다.',
      starter: `type RootStackParamList = {
  Home: undefined;
  Detail: { productId: string };
  Settings: { tab: 'profile' | 'push' };
};

// TODO: screen에 따라 params의 타입이 결정되게 하세요.
function navigate(screen: string, params?: object): void {
  console.log('이동:', screen, params);
}`,
      tests: `navigate('Home', undefined);
navigate('Detail', { productId: 'p1' });
navigate('Settings', { tab: 'push' });

// @ts-expect-error 없는 화면입니다
navigate('Cart', undefined);
// @ts-expect-error productId가 빠졌습니다
navigate('Detail', {});
// @ts-expect-error 없는 탭입니다
navigate('Settings', { tab: 'theme' });`,
      solution: `type RootStackParamList = {
  Home: undefined;
  Detail: { productId: string };
  Settings: { tab: 'profile' | 'push' };
};

function navigate<K extends keyof RootStackParamList>(screen: K, params: RootStackParamList[K]): void {
  console.log('이동:', screen, params);
}`,
      hints: [
        '화면 이름의 타입은 `keyof RootStackParamList` 입니다. 이걸 제네릭 `K`로 받으세요.',
        '`function navigate<K extends keyof RootStackParamList>(screen: K, ...)`',
        '`params`의 타입은 "RootStackParamList의 K번째 값", 즉 `RootStackParamList[K]` 입니다.',
      ],
    },
    quiz: [
      {
        id: 'q-react-native-1',
        question: '외부에서 `style` prop을 받는 View 기반 컴포넌트에서 가장 알맞은 타입은?',
        options: ['object', 'ViewStyle', 'StyleProp<ViewStyle>', 'StyleSheet'],
        answer: 2,
        explanation: 'RN의 style에는 객체뿐 아니라 배열(`[a, b]`)이나 `cond && style` 같은 falsy 값도 들어옵니다. StyleProp<ViewStyle>이 이 모두를 허용합니다.',
      },
      {
        id: 'q-react-native-2',
        question: '`RootStackParamList`에서 `Home: undefined`의 의미는?',
        options: [
          'Home 화면이 아직 구현되지 않았다',
          'Home 화면은 params를 받지 않는다',
          'Home 화면은 어떤 params든 받는다',
          'Home 화면으로는 이동할 수 없다',
        ],
        answer: 1,
        explanation: 'params가 없는 화면은 undefined로 적습니다. 그러면 `navigate(\'Home\')`처럼 params 없이 이동할 수 있습니다.',
      },
    ],
  },

  {
    id: 'migration',
    chapter: 'native',
    title: '실전: 기존 JS 프로젝트를 TS로 옮기기',
    summary: '한 번에 다 바꾸지 않습니다. 설정, 순서, 타입 없는 라이브러리 대처, 배포 파이프라인까지.',
    minutes: 12,
    blocks: [
      {
        kind: 'callout',
        tone: 'bridge',
        title: '배포 과정은 달라지지 않습니다',
        text: 'RN의 Metro(Babel)와 웹의 Vite는 TS 파일에서 **타입을 지우기만** 하고 검사는 하지 않습니다. 그래서 번들 결과물은 JS일 때와 같고, CodePush 번들이나 iOS 빌드/배포 과정은 그대로입니다. 대신 타입 검사는 `tsc --noEmit`을 CI나 커밋 훅에서 따로 돌려야 합니다.',
      },
      { kind: 'h', text: '1단계: JS와 TS가 섞여 살게 하기' },
      {
        kind: 'code',
        lang: 'bash',
        code: `# 웹 (React)
npm i -D typescript @types/react @types/react-dom

# React Native (0.71+ 는 타입이 react-native 패키지에 포함)
npm i -D typescript @types/react @react-native/typescript-config`,
      },
      {
        kind: 'code',
        lang: 'json',
        title: 'tsconfig.json — 점진적 전환용',
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "allowJs": true,        // .js 파일을 그대로 둔 채 import 가능
    "checkJs": false,       // .js 파일은 아직 검사하지 않음
    "noEmit": true,         // 타입 검사만. 변환은 번들러가 담당
    "skipLibCheck": true,

    "strict": true          // 처음부터 켜는 것을 권장 (아래 참고)
  },
  "include": ["src"]
}`,
      },
      { kind: 'h', text: '2단계: 옮기는 순서' },
      {
        kind: 'list',
        items: [
          '**의존성이 없는 것부터** — 상수, 유틸 함수, API 클라이언트. 확장자를 `.ts`로 바꾸고 빨간 줄을 지웁니다.',
          '**타입 정의 모으기** — 서버 응답 모델(`User`, `Product`)을 `types/`에 선언합니다. 이후 모든 작업이 쉬워집니다.',
          '**스토어** — 슬라이스/리듀서에 타입을 붙이고 `RootState`, `useAppSelector`를 만듭니다. (레슨 10)',
          '**공용 컴포넌트** — Button, Input처럼 여러 곳에서 쓰는 것. props 타입을 붙이면 사용하는 쪽 실수가 드러납니다.',
          '**화면** — 마지막에. RN이라면 `RootStackParamList`를 먼저 만들고 화면을 하나씩 `.tsx`로 바꿉니다.',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'strict는 처음부터 켜세요',
        text: '`strict: false`로 시작하면 null 검사와 암묵적 any 검사가 빠져서, 나중에 켤 때 수백 개의 오류를 한꺼번에 만납니다. 파일을 하나씩 옮기는 방식이라면 처음부터 strict로 두고 **옮기는 파일만** 제대로 고치는 편이 훨씬 수월합니다. 당장 못 고치는 곳은 `// TODO` 주석과 함께 `any`로 표시해 두고 넘어가도 됩니다.',
      },
      { kind: 'h', text: '타입이 없는 라이브러리 만났을 때' },
      {
        kind: 'code',
        lang: 'ts',
        title: 'src/types/declarations.d.ts',
        code: `// 1) 먼저 DefinitelyTyped에 타입이 있는지 확인합니다.
//    npm i -D @types/lodash

// 2) 없다면 직접 선언합니다. 쓰는 부분만 적어도 충분합니다.
declare module 'legacy-analytics' {
  export function track(event: string, params?: Record<string, string | number>): void;
  export function setUserId(id: string): void;
}

// 3) 급할 땐 한 줄로 통째로 any 처리 (나중에 채우기)
declare module 'some-old-native-module';

// 이미지/SVG 등 코드가 아닌 파일 import
declare module '*.png' {
  const source: number; // RN에서는 require 결과가 숫자 id
  export default source;
}`,
      },
      { kind: 'h', text: '환경 변수와 전역 값' },
      {
        kind: 'code',
        lang: 'ts',
        code: `// react-native-config, Vite의 import.meta.env 등은 선언을 보강해서 자동완성을 얻습니다.
declare module 'react-native-config' {
  interface NativeConfig {
    API_URL: string;
    CODEPUSH_KEY_IOS: string;
    CODEPUSH_KEY_ANDROID: string;
  }
  const Config: NativeConfig;
  export default Config;
}`,
      },
      { kind: 'h', text: '3단계: 검사를 파이프라인에 넣기' },
      {
        kind: 'code',
        lang: 'json',
        title: 'package.json',
        code: `{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "release:codepush": "npm run typecheck && npm run lint && ./scripts/codepush-release.sh"
  }
}`,
      },
      {
        kind: 'p',
        text: '에디터에 빨간 줄이 있어도 번들은 만들어진다는 점을 기억하세요. **타입 오류가 있는 코드가 배포되지 않게 하려면** 배포 스크립트나 CI 앞단에 `typecheck`를 반드시 넣어야 합니다. 이 사이트도 GitHub Actions에서 타입 검사를 통과해야만 배포됩니다.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: '옮길 때 흔한 함정',
        text: '`as any`와 `// @ts-ignore`로 오류를 덮으며 빠르게 전환하면 "확장자만 .ts인 JS"가 됩니다. 오류가 많이 나는 파일은 대개 **데이터 모델 타입이 없어서**입니다. 그 파일을 고치기 전에 그 파일이 다루는 데이터의 타입부터 선언하세요.',
      },
    ],
    exercise: {
      id: 'ex-migration',
      title: '레거시 유틸 파일 옮기기',
      prompt: '앱 업데이트 체크에 쓰던 JS 유틸 파일을 `.ts`로 이름만 바꾼 상태입니다. 타입을 붙여 오류를 모두 없애 보세요. `getStorageKey`는 `STORAGE_KEYS`에 **실제로 있는 키만** 받아야 합니다.',
      starter: `const STORAGE_KEYS = {
  token: '@app/token',
  theme: '@app/theme',
  lastSync: '@app/lastSync',
};

function getStorageKey(name) {
  return STORAGE_KEYS[name];
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function isUpdateRequired(current, minimum) {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  if (c.major !== m.major) return c.major < m.major;
  if (c.minor !== m.minor) return c.minor < m.minor;
  return c.patch < m.patch;
}`,
      tests: `const key: string = getStorageKey('token');
const version: { major: number; minor: number; patch: number } = parseVersion('2.0.1');
const required: boolean = isUpdateRequired('1.2.3', '1.3.0');

// @ts-expect-error STORAGE_KEYS에 없는 키입니다
getStorageKey('user');
// @ts-expect-error 버전은 문자열이어야 합니다
isUpdateRequired(1.2, 1.3);`,
      solution: `const STORAGE_KEYS = {
  token: '@app/token',
  theme: '@app/theme',
  lastSync: '@app/lastSync',
};

function getStorageKey(name: keyof typeof STORAGE_KEYS): string {
  return STORAGE_KEYS[name];
}

function parseVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function isUpdateRequired(current: string, minimum: string): boolean {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  if (c.major !== m.major) return c.major < m.major;
  if (c.minor !== m.minor) return c.minor < m.minor;
  return c.patch < m.patch;
}`,
      hints: [
        '`version`, `current`, `minimum`은 모두 `string` 입니다.',
        '"STORAGE_KEYS 객체의 키들"은 두 연산자를 이어서 만듭니다: `keyof typeof STORAGE_KEYS`',
        '`parseVersion`의 반환 타입은 적지 않아도 추론됩니다.',
      ],
    },
    quiz: [
      {
        id: 'q-migration-1',
        question: 'Metro나 Vite로 번들할 때 타입 오류가 있는 TS 코드는 어떻게 될까요?',
        options: [
          '번들이 실패한다',
          '타입만 지워지고 그대로 번들된다. 타입 검사는 tsc로 따로 해야 한다',
          '오류가 있는 파일만 제외된다',
          '자동으로 any로 바뀐다',
        ],
        answer: 1,
        explanation: 'Babel/esbuild 기반 번들러는 타입을 지우기만 합니다. 그래서 배포 전에 `tsc --noEmit`을 CI나 스크립트에서 반드시 실행해야 합니다.',
      },
      {
        id: 'q-migration-2',
        question: '기존 JS 프로젝트를 점진적으로 옮길 때 가장 먼저 필요한 tsconfig 옵션은?',
        options: ['"allowJs": true', '"strict": false', '"declaration": true', '"outDir": "dist"'],
        answer: 0,
        explanation: 'allowJs가 있어야 .ts 파일에서 아직 옮기지 않은 .js 파일을 import할 수 있어, 두 언어가 한 프로젝트에 공존할 수 있습니다.',
      },
    ],
  },
];
