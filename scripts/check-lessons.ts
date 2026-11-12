// 모든 실습 문제를 실제 TypeScript 컴파일러로 검증합니다.
//  - 정답 코드: 타입 오류가 0개여야 합니다.
//  - 시작 코드: 타입 오류가 1개 이상 있어야 합니다. (처음부터 통과하면 문제가 아니므로)
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../src/content';
import { buildExerciseCode, grade } from '../src/lib/grade';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, '.tmp-lessons');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const files = new Map<string, { lesson: string; kind: 'starter' | 'solution'; code: string }>();
const ids = new Set<string>();

for (const lesson of lessons) {
  const ex = lesson.exercise;
  for (const id of [lesson.id, ex.id, ...lesson.quiz.map((q) => q.id)]) {
    if (ids.has(id)) throw new Error(`중복된 id: ${id}`);
    ids.add(id);
  }
  for (const q of lesson.quiz) {
    if (q.answer < 0 || q.answer >= q.options.length) throw new Error(`${q.id}: 정답 인덱스가 범위를 벗어났습니다`);
  }
  const ext = ex.jsx ? 'tsx' : 'ts';
  for (const kind of ['starter', 'solution'] as const) {
    const code = buildExerciseCode(ex, ex[kind]);
    const name = `${ex.id}.${kind}.${ext}`;
    files.set(name, { lesson: lesson.id, kind, code });
    writeFileSync(join(dir, name), code);
  }
}

writeFileSync(
  join(dir, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      moduleDetection: 'force',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
    },
    include: ['*.ts', '*.tsx'],
  }),
);

let output = '';
try {
  output = execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', dir, '--pretty', 'false'], { encoding: 'utf8' });
} catch (error) {
  output = (error as { stdout?: string }).stdout ?? '';
}

const errors = new Map<string, string[]>();
for (const line of output.split('\n')) {
  const match = line.match(/([\w.-]+\.(?:starter|solution)\.tsx?)\(\d+,\d+\): error/);
  if (match) errors.set(match[1], [...(errors.get(match[1]) ?? []), line.trim()]);
}

let failed = false;
for (const [name, file] of files) {
  const found = errors.get(name) ?? [];
  if (file.kind === 'solution') {
    const result = grade(lessons.find((l) => l.id === file.lesson)!.exercise, file.code, found.length);
    if (!result.ok) {
      failed = true;
      console.error(`✗ ${name}: 정답이 채점을 통과하지 못합니다\n  ${[...result.reasons, ...found].join('\n  ')}`);
    }
  } else if (found.length === 0) {
    failed = true;
    console.error(`✗ ${name}: 시작 코드에 오류가 없습니다`);
  } else {
    console.log(`✓ ${file.lesson}: 시작 코드 오류 ${found.length}개 → 정답 0개`);
  }
}

rmSync(dir, { recursive: true, force: true });
if (failed) process.exit(1);
console.log(`\n실습 ${lessons.length}개 검증 완료`);
