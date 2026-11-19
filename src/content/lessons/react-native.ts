import type { Lesson } from '../types';

// 자리 표시용 임시 레슨입니다.
export const lesson: Lesson = {
  id: 'react-native',
  chapter: 'native',
  title: 'react-native',
  summary: '준비 중',
  minutes: 10,
  steps: [
    {
      id: 'react-native-1',
      title: 'RN 테스트',
      body: [],
      runner: 'native',
      errors: 1,
      code: `import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

interface Item { id: string; title: string }
const items: Item[] = [{ id: '1', title: '키보드' }, { id: '2', title: '마우스' }];

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>장바구니 {count}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => { setCount(count + 1); console.log('담기', item.title); }}>
            <Text>{item.title}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, flexDirection: 'horizontal' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: 1, borderColor: '#ddd' },
});
`,
    },
  ],
  exercise: {
    id: 'ex-react-native',
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
