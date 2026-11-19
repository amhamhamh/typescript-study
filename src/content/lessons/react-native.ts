import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'react-native',
  chapter: 'native',
  title: 'React Native: 스타일, 리스트, 내비게이션',
  summary: 'RN에서 타입이 가장 큰 효과를 내는 곳들입니다. StyleSheet, 밖에서 받는 style, FlatList, 그리고 화면 사이의 params.',
  minutes: 15,
  steps: [
    {
      id: 'react-native-1',
      title: 'StyleSheet: 없는 값은 화면이 깨지기 전에 잡힙니다',
      runner: 'native',
      errors: 2,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: '화면을 열어 봐야 보이던 스타일 오타',
          text: 'JS로 쓴 RN 스타일은 값에 오타가 있어도 그 화면을 기기에서 직접 열어 보기 전에는 알 수 없습니다. 속성이 조용히 무시되어 레이아웃만 깨져 있는 경우도 많죠. props와 훅 타이핑은 웹 React에서 배운 그대로이고, 이 레슨은 **RN에서만 만나는 것**을 다룹니다. 오른쪽 미리보기는 휴대폰 화면입니다.',
        },
        {
          kind: 'p',
          text: '미리보기를 보세요. 상품 이름과 가격이 한 줄에 나란히 있어야 하는데 **세로로 쌓였고**, 제목 `장바구니`는 굵지 않습니다. 23행의 `\'horizontal\'`과 21행의 `\'blod\'`가 없는 값이라 무시됐기 때문입니다. 타입 검사는 정확히 그 두 줄을 지목합니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '값을 외울 필요가 없습니다',
          text: '`flexDirection`은 `\'row\' | \'column\' | \'row-reverse\' | \'column-reverse\'` 유니온입니다. 따옴표 안에서 `Ctrl+Space`를 누르면 쓸 수 있는 값이 목록으로 나옵니다. `StyleSheet.create`에 넘긴 객체는 속성 이름과 값이 모두 이렇게 검사됩니다.',
        },
      ],
      code: `import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.header}>장바구니</Text>
      <View style={styles.row}>
        <Text style={styles.name}>기계식 키보드</Text>
        <Text style={styles.price}>129,000원</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.name}>무선 마우스</Text>
        <Text style={styles.price}>49,000원</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  header: { fontSize: 22, fontWeight: 'blod', marginBottom: 12 },
  row: {
    flexDirection: 'horizontal',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  name: { fontSize: 16 },
  price: { fontSize: 16, fontWeight: '700', color: '#2b68b5' },
});
`,
      mission: {
        text: '21행과 23행을 올바른 값으로 고쳐서, 이름과 가격이 한 줄에 나란히 놓이고 제목이 굵게 보이게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['장바구니', '129,000원'] },
        hint: '가로 배치는 `flexDirection: \'row\'`, 굵은 글씨는 `fontWeight: \'700\'`(또는 `\'bold\'`)입니다.',
        answer: `import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.header}>장바구니</Text>
      <View style={styles.row}>
        <Text style={styles.name}>기계식 키보드</Text>
        <Text style={styles.price}>129,000원</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.name}>무선 마우스</Text>
        <Text style={styles.price}>49,000원</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  name: { fontSize: 16 },
  price: { fontSize: 16, fontWeight: '700', color: '#2b68b5' },
});
`,
      },
    },
    {
      id: 'react-native-2',
      title: '밖에서 받는 style: StyleProp',
      runner: 'native',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '공용 컴포넌트는 대개 `style`을 props로 받습니다. "뷰 스타일이니까 `ViewStyle`"이라고 적기 쉬운데, 그러면 22행과 23행에 빨간 줄이 생깁니다. 두 오류는 성격이 다릅니다.',
        },
        {
          kind: 'list',
          items: [
            '**22행: 타입 선언이 좁습니다.** 실행에는 문제가 없어서 둘째 카드에 파란 테두리가 잘 나옵니다. RN의 `style`은 객체뿐 아니라 배열 `[a, b]`와 `조건 && 스타일`의 `false`도 받는데, `ViewStyle`은 객체 하나만 뜻합니다.',
            '**23행: 진짜 버그입니다.** `fontSize`는 글자 스타일이라 `View`에서는 무시됩니다. 셋째 카드의 글자는 커지지 않았습니다. 웹의 CSS와 달리 RN에서는 `View`에 준 글자 스타일이 안쪽 `Text`로 상속되지 않습니다.',
          ],
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: 'style을 받는 props',
          code: `interface CardProps {
  title: string;
  style?: StyleProp<ViewStyle>;      // 객체, 배열, false, null
  titleStyle?: StyleProp<TextStyle>; // 글자 스타일은 Text로
}`,
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '글자 스타일 검사는 객체를 바로 적을 때만',
          text: '23행처럼 `style={{ ... }}`에 객체를 직접 적으면 `ViewStyle`에 없는 속성이 잡힙니다. 하지만 `StyleSheet.create`로 만든 스타일은 `padding`처럼 겹치는 속성이 하나라도 있으면 `fontSize`가 섞여 있어도 통과합니다. 글자 스타일은 처음부터 `titleStyle`처럼 따로 받는 편이 안전합니다.',
        },
      ],
      code: `import { StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

interface CardProps {
  title: string;
  style?: ViewStyle;
}

function Card({ title, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export default function App() {
  const selectedId = 'p2';
  return (
    <View style={styles.screen}>
      <Card title="기계식 키보드" />
      <Card title="무선 마우스" style={selectedId === 'p2' && styles.selected} />
      <Card title="오늘의 특가" style={{ backgroundColor: '#fff3cd', fontSize: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  card: { padding: 16, marginBottom: 10, borderRadius: 12, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600' },
  selected: { borderWidth: 2, borderColor: '#2b68b5' },
});
`,
      mission: {
        text: '`style`의 타입을 `StyleProp<ViewStyle>`로 바꾸고, 제목용 `titleStyle?: StyleProp<TextStyle>`을 추가해 `Text`에 적용하세요. 그다음 `오늘의 특가` 카드의 `fontSize: 24`를 `titleStyle`로 옮겨 글자가 실제로 커지게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['무선 마우스', '오늘의 특가'] },
        hint: '`import type { StyleProp, TextStyle, ViewStyle }`, `<Text style={[styles.title, titleStyle]}>`, 그리고 `오늘의 특가` 카드는 `style={{ backgroundColor: \'#fff3cd\' }} titleStyle={{ fontSize: 24 }}`',
        answer: `import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

interface CardProps {
  title: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

function Card({ title, style, titleStyle }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
  );
}

export default function App() {
  const selectedId = 'p2';
  return (
    <View style={styles.screen}>
      <Card title="기계식 키보드" />
      <Card title="무선 마우스" style={selectedId === 'p2' && styles.selected} />
      <Card title="오늘의 특가" style={{ backgroundColor: '#fff3cd' }} titleStyle={{ fontSize: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  card: { padding: 16, marginBottom: 10, borderRadius: 12, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600' },
  selected: { borderWidth: 2, borderColor: '#2b68b5' },
});
`,
      },
    },
    {
      id: 'react-native-3',
      title: '기본 컴포넌트 감싸기: PressableProps',
      runner: 'native',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '미리보기에서 `결제하기`를 눌러 보세요. 장바구니가 비어 있는데도 콘솔에 `결제 요청: 0개`가 찍힙니다. 26행에서 `disabled`를 넘겼지만 `AppButton`은 `label`과 `onPress`만 받아서, 나머지는 `Pressable`까지 전달되지 않습니다. 타입 검사가 26행에 긋는 빨간 줄이 바로 이 버그입니다.',
        },
        {
          kind: 'p',
          text: '`disabled`, `onLongPress`, `testID`, `accessibilityLabel`... 필요할 때마다 하나씩 추가할 수는 없습니다. 웹에서 `ComponentProps<\'button\'>`을 물려받았듯이, RN은 컴포넌트마다 `XxxProps` 타입을 내보냅니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: 'Pressable이 받는 props를 전부 물려받기',
          code: `interface AppButtonProps extends PressableProps {
  label: string;
}

function AppButton({ label, ...rest }: AppButtonProps) {
  return <Pressable {...rest}>...</Pressable>;
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '같은 방식으로',
          text: '`ViewProps`, `TextProps`, `TextInputProps`, `ScrollViewProps`도 모두 `react-native`에서 가져올 수 있습니다. `onPress`는 `PressableProps`에 이미 들어 있으니 따로 적지 않아도 됩니다.',
        },
      ],
      code: `import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppButtonProps {
  label: string;
  onPress: () => void;
}

function AppButton({ label, onPress }: AppButtonProps) {
  return (
    <Pressable style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>장바구니 {count}개</Text>
      <AppButton label="담기" onPress={() => setCount(count + 1)} />
      <AppButton
        label="결제하기"
        onPress={() => console.log('결제 요청:', count + '개')}
        disabled={count === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  btn: { padding: 14, marginBottom: 10, borderRadius: 10, backgroundColor: '#2b68b5', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  off: { opacity: 0.4 },
});
`,
      mission: {
        text: '`AppButtonProps`가 `PressableProps`를 물려받게 하고, 나머지 props를 `...rest`로 `Pressable`에 넘기세요. `disabled`일 때는 미리 만들어 둔 `styles.off`도 적용해 보세요. `결제하기`가 흐려지고, 눌러도 콘솔에 아무것도 찍히지 않으면 성공입니다.',
        goal: { noTypeErrors: true, previewIncludes: ['장바구니 0개', '결제하기'] },
        hint: '`import type { PressableProps } from \'react-native\'`, `{ label, ...rest }: AppButtonProps`, `<Pressable style={[styles.btn, rest.disabled && styles.off]} {...rest}>`',
        answer: `import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PressableProps } from 'react-native';

interface AppButtonProps extends PressableProps {
  label: string;
}

function AppButton({ label, ...rest }: AppButtonProps) {
  return (
    <Pressable style={[styles.btn, rest.disabled && styles.off]} {...rest}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>장바구니 {count}개</Text>
      <AppButton label="담기" onPress={() => setCount(count + 1)} />
      <AppButton
        label="결제하기"
        onPress={() => console.log('결제 요청:', count + '개')}
        disabled={count === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  btn: { padding: 14, marginBottom: 10, borderRadius: 10, backgroundColor: '#2b68b5', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  off: { opacity: 0.4 },
});
`,
      },
    },
    {
      id: 'react-native-4',
      title: 'FlatList: data에서 item 타입이 정해집니다',
      runner: 'native',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '`FlatList`는 제네릭 컴포넌트입니다. `data`에 `Product[]`를 넘기면 `keyExtractor`와 `renderItem`의 `item`이 자동으로 `Product`가 됩니다. 26행의 `(item) => item.id`에서 `item` 위에 마우스를 올려 확인해 보세요.',
        },
        {
          kind: 'p',
          text: '문제는 `renderItem`을 **밖으로 빼낼 때**입니다. 15행의 `renderProduct`는 `FlatList`와 떨어져 있어 추론할 근거가 없고, `item`이 암묵적 `any`가 됩니다. 그래서 17행의 `item.name` 오타에는 빨간 줄이 없고, 미리보기에는 번호만 있고 **상품 이름이 비어** 있습니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '빼낸 renderItem에는 ListRenderItem<T>',
          code: `const renderProduct: ListRenderItem<Product> = ({ item, index }) => (
  // item: Product, index: number
);`,
        },
      ],
      code: `import { FlatList, StyleSheet, Text, View } from 'react-native';

interface Product {
  id: string;
  title: string;
  price: number;
}

const products: Product[] = [
  { id: 'p1', title: '기계식 키보드', price: 129000 },
  { id: 'p2', title: '무선 마우스', price: 49000 },
  { id: 'p3', title: '27인치 모니터', price: 359000 },
];

const renderProduct = ({ item, index }) => (
  <View style={styles.row}>
    <Text style={styles.name}>{index + 1}. {item.name}</Text>
    <Text style={styles.price}>{item.price.toLocaleString()}원</Text>
  </View>
);

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.header}>상품 {products.length}개</Text>
      <FlatList data={products} keyExtractor={(item) => item.id} renderItem={renderProduct} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#fff',
  },
  name: { fontSize: 16 },
  price: { fontSize: 16, fontWeight: '700' },
});
`,
      mission: {
        text: '15행의 `renderProduct`에 `ListRenderItem<Product>` 타입을 붙이세요. 그러면 `item.name`에 빨간 줄이 생깁니다. 고쳐서 미리보기에 상품 이름이 나오게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['1. 기계식 키보드', '3. 27인치 모니터'] },
        hint: '`import type { ListRenderItem } from \'react-native\'`, `const renderProduct: ListRenderItem<Product> = ({ item, index }) => (`, 그리고 `item.name`은 `item.title`로',
        answer: `import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItem } from 'react-native';

interface Product {
  id: string;
  title: string;
  price: number;
}

const products: Product[] = [
  { id: 'p1', title: '기계식 키보드', price: 129000 },
  { id: 'p2', title: '무선 마우스', price: 49000 },
  { id: 'p3', title: '27인치 모니터', price: 359000 },
];

const renderProduct: ListRenderItem<Product> = ({ item, index }) => (
  <View style={styles.row}>
    <Text style={styles.name}>{index + 1}. {item.title}</Text>
    <Text style={styles.price}>{item.price.toLocaleString()}원</Text>
  </View>
);

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.header}>상품 {products.length}개</Text>
      <FlatList data={products} keyExtractor={(item) => item.id} renderItem={renderProduct} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#fff',
  },
  name: { fontSize: 16 },
  price: { fontSize: 16, fontWeight: '700' },
});
`,
      },
    },
    {
      id: 'react-native-5',
      title: 'Platform.OS와 Platform.select',
      runner: 'native',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '`Platform.OS`는 `string`이 아니라 `\'ios\' | \'android\' | \'web\' | ...` 유니온입니다. 그래서 3행의 `\'IOS\'`처럼 대소문자가 틀린 비교는 "두 타입에 겹치는 값이 없다(no overlap)"는 오류로 잡힙니다. JS였다면 아이폰에서도 항상 `false`가 되어, iOS 전용 분기가 한 번도 실행되지 않았을 코드입니다.',
        },
        {
          kind: 'p',
          text: '`Platform.select`에 넘기는 객체의 키도 검사됩니다. 4행은 `default`를 `defualt`로 잘못 썼고, 미리보기에는 `undefined에서 업데이트해 주세요`가 나왔습니다. 맞는 키를 찾지 못한 `select`가 `undefined`를 돌려준 것입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '이 미리보기의 Platform.OS는 web입니다',
          text: '여기서는 RN 코드를 브라우저에서 돌리기 때문에 `Platform.OS`가 `\'web\'`입니다. `ios`, `android` 키는 선택되지 않고 `default`가 쓰입니다. 실제 기기에서는 그 기기의 값이 선택됩니다.',
        },
      ],
      code: `import { Platform, StyleSheet, Text, View } from 'react-native';

const isIOS = Platform.OS === 'IOS';
const store = Platform.select({ ios: 'App Store', android: 'Play 스토어', defualt: '스토어' });

export default function App() {
  return (
    <View style={[styles.screen, isIOS && styles.notch]}>
      <Text style={styles.title}>새 버전이 나왔습니다</Text>
      <Text style={styles.body}>{store + '에서 업데이트해 주세요'}</Text>
      <Text style={styles.meta}>현재 플랫폼: {Platform.OS}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  notch: { paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, marginBottom: 16 },
  meta: { fontSize: 13, color: '#666' },
});
`,
      mission: {
        text: '3행과 4행의 오타를 고쳐서 미리보기에 `스토어에서 업데이트해 주세요`가 나오게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['스토어에서 업데이트해 주세요', '현재 플랫폼: web'] },
        hint: '`Platform.OS === \'ios\'`, 그리고 키 이름은 `default`입니다.',
        answer: `import { Platform, StyleSheet, Text, View } from 'react-native';

const isIOS = Platform.OS === 'ios';
const store = Platform.select({ ios: 'App Store', android: 'Play 스토어', default: '스토어' });

export default function App() {
  return (
    <View style={[styles.screen, isIOS && styles.notch]}>
      <Text style={styles.title}>새 버전이 나왔습니다</Text>
      <Text style={styles.body}>{store + '에서 업데이트해 주세요'}</Text>
      <Text style={styles.meta}>현재 플랫폼: {Platform.OS}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  notch: { paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, marginBottom: 16 },
  meta: { fontSize: 13, color: '#666' },
});
`,
      },
    },
    {
      id: 'react-native-6',
      title: '화면 이동: RootStackParamList',
      runner: 'native',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: 'RN에서 타입 효과가 가장 큰 곳입니다. `navigation.navigate(\'Detail\', { id })`에서 화면 이름 오타, params 누락, `id`인지 `productId`인지 헷갈리던 문제가 전부 빨간 줄로 바뀝니다. **화면 이름 → 그 화면이 받는 params**를 4~7행처럼 한 번만 적어 두면 됩니다. 받는 것이 없는 화면은 `undefined`입니다.',
        },
        {
          kind: 'p',
          text: '에디터에는 `useState`로 만든 아주 작은 내비게이터가 있습니다. 미리보기에서 두 상품을 눌러 보세요. `기계식 키보드`는 **아무 반응이 없고**(14행: 없는 화면 이름), `무선 마우스`는 상세 화면을 그리다 **크래시**합니다(15행: `productId` 대신 `id`). 콘솔의 오류는 터진 곳인 23행을 가리키지만, 타입 검사는 누르기도 전에 원인인 15행을 가리키고 있었습니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '실제 React Navigation에서는',
          code: `const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

function DetailScreen({ route, navigation }: Props) {
  route.params.productId;       // string
  navigation.navigate('Home');  // 이름과 params를 모두 검사
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '같은 타입, 같은 원리',
          text: '에디터의 `RootStackParamList`를 위 코드처럼 React Navigation에 넘기면 `navigation`과 `route`에 타입이 붙습니다. 8행의 `K extends keyof ...`와 `RootStackParamList[K]`가 그 안에서 일어나는 일입니다. 이 레슨의 마지막 실습에서 직접 만들어 봅니다.',
        },
      ],
      code: `import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RootStackParamList = {
  Home: undefined;
  Detail: { productId: string };
};
type Navigate = <K extends keyof RootStackParamList>(name: K, params: RootStackParamList[K]) => void;

function HomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>홈</Text>
      <Text style={styles.link} onPress={() => navigate('Detial', { productId: 'p1' })}>기계식 키보드 ›</Text>
      <Text style={styles.link} onPress={() => navigate('Detail', { id: 'p2' })}>무선 마우스 ›</Text>
    </View>
  );
}

function DetailScreen({ params, navigate }: { params: RootStackParamList['Detail']; navigate: Navigate }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>상품 {params.productId.toUpperCase()}</Text>
      <Text style={styles.link} onPress={() => navigate('Home', undefined)}>‹ 홈으로</Text>
    </View>
  );
}

export default function App() {
  const [route, setRoute] = useState<{ name: keyof RootStackParamList; params: unknown }>({ name: 'Home', params: undefined });
  const navigate: Navigate = (name, params) => setRoute({ name, params });
  if (route.name === 'Detail') {
    return <DetailScreen params={route.params as RootStackParamList['Detail']} navigate={navigate} />;
  }
  return <HomeScreen navigate={navigate} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  link: { padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#fff', fontSize: 16 },
});
`,
      mission: {
        text: '14행의 화면 이름과 15행의 params를 고치세요. 그다음 홈에 `27인치 모니터 ›` 링크를 하나 더 추가해 `p3` 상세 화면으로 이동하게 하세요. 세 링크를 눌렀을 때 `상품 P1`, `상품 P2`, `상품 P3`이 나오면 성공입니다.',
        goal: { noTypeErrors: true, previewIncludes: ['기계식 키보드', '무선 마우스', '27인치 모니터'] },
        hint: '`navigate(\'Detail\', { productId: \'p2\' })`. 새 링크는 15행을 복사해 `productId: \'p3\'`으로 바꾸면 됩니다.',
        answer: `import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RootStackParamList = {
  Home: undefined;
  Detail: { productId: string };
};
type Navigate = <K extends keyof RootStackParamList>(name: K, params: RootStackParamList[K]) => void;

function HomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>홈</Text>
      <Text style={styles.link} onPress={() => navigate('Detail', { productId: 'p1' })}>기계식 키보드 ›</Text>
      <Text style={styles.link} onPress={() => navigate('Detail', { productId: 'p2' })}>무선 마우스 ›</Text>
      <Text style={styles.link} onPress={() => navigate('Detail', { productId: 'p3' })}>27인치 모니터 ›</Text>
    </View>
  );
}

function DetailScreen({ params, navigate }: { params: RootStackParamList['Detail']; navigate: Navigate }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>상품 {params.productId.toUpperCase()}</Text>
      <Text style={styles.link} onPress={() => navigate('Home', undefined)}>‹ 홈으로</Text>
    </View>
  );
}

export default function App() {
  const [route, setRoute] = useState<{ name: keyof RootStackParamList; params: unknown }>({ name: 'Home', params: undefined });
  const navigate: Navigate = (name, params) => setRoute({ name, params });
  if (route.name === 'Detail') {
    return <DetailScreen params={route.params as RootStackParamList['Detail']} navigate={navigate} />;
  }
  return <HomeScreen navigate={navigate} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f4f5f7' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  link: { padding: 14, marginBottom: 8, borderRadius: 10, backgroundColor: '#fff', fontSize: 16 },
});
`,
      },
    },
  ],
  exercise: {
    id: 'ex-react-native',
    title: '타입 안전한 navigate 만들기',
    prompt: 'React Navigation이 내부에서 하는 일을 직접 구현해 봅니다. `navigate`가 화면 이름에 따라 **그 화면의 params 타입만** 받도록 제네릭을 붙여 보세요. 제네릭 레슨의 `K extends keyof T`와 `T[K]`를 그대로 쓰면 됩니다. 지금은 잘못된 호출도 통과하기 때문에, 채점용 코드의 `@ts-expect-error` 줄마다 "오류가 나야 하는데 안 났다"는 오류가 떠 있습니다.',
    runner: 'console',
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

// 아래 호출들은 실행되지 않습니다. 잘못된 사용이 타입 오류로 잡히는지만 확인합니다.
function wrongUsage() {
  // @ts-expect-error 없는 화면입니다
  navigate('Cart', undefined);
  // @ts-expect-error productId가 빠졌습니다
  navigate('Detail', {});
  // @ts-expect-error 없는 탭입니다
  navigate('Settings', { tab: 'theme' });
}`,
    solution: `type RootStackParamList = {
  Home: undefined;
  Detail: { productId: string };
  Settings: { tab: 'profile' | 'push' };
};

function navigate<K extends keyof RootStackParamList>(screen: K, params: RootStackParamList[K]): void {
  console.log('이동:', screen, params);
}`,
    hints: [
      '화면 이름의 타입은 `keyof RootStackParamList`입니다. 이걸 제네릭 `K`로 받으세요.',
      '`function navigate<K extends keyof RootStackParamList>(screen: K, ...)`',
      '`params`의 타입은 "RootStackParamList의 K번째 값", 즉 `RootStackParamList[K]`입니다.',
    ],
  },
  quiz: [
    {
      id: 'q-react-native-1',
      question: '밖에서 `style` prop을 받는 View 기반 컴포넌트에 가장 알맞은 타입은?',
      options: ['object', 'ViewStyle', 'StyleProp<ViewStyle>', 'StyleSheet'],
      answer: 2,
      explanation: 'RN의 style에는 객체뿐 아니라 배열(`[a, b]`)이나 `cond && style` 같은 falsy 값도 들어옵니다. StyleProp<ViewStyle>이 이 모두를 허용합니다.',
    },
    {
      id: 'q-react-native-2',
      question: '`renderItem` 함수를 `FlatList` 밖으로 빼냈더니 `item`이 암묵적 any가 되었습니다. 가장 알맞은 해결책은?',
      options: [
        '`item: any`라고 직접 적는다',
        '함수에 `ListRenderItem<Product>` 타입을 붙인다',
        '`FlatList`의 `data`에 `as Product[]`를 붙인다',
        '`keyExtractor`를 지운다',
      ],
      answer: 1,
      explanation: 'FlatList 안에 직접 적은 함수는 data에서 item 타입이 추론되지만, 밖으로 빼낸 함수는 근거가 없습니다. ListRenderItem<Product>를 붙이면 item과 index의 타입이 한 번에 정해집니다.',
    },
    {
      id: 'q-react-native-3',
      question: '`RootStackParamList`에서 `Home: undefined`의 의미는?',
      options: [
        'Home 화면이 아직 구현되지 않았다',
        'Home 화면은 params를 받지 않는다',
        'Home 화면은 어떤 params든 받는다',
        'Home 화면으로는 이동할 수 없다',
      ],
      answer: 1,
      explanation: 'params가 없는 화면은 undefined로 적습니다. React Navigation에서는 `navigation.navigate(\'Home\')`처럼 params 없이 이동할 수 있습니다.',
    },
  ],
};
