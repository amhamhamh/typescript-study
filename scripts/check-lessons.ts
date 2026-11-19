// 모든 레슨의 코드를 실제로 검증합니다.
//
//   npm run check:lessons                 타입 검사 + 브라우저 실행 검증 (전체)
//   npm run check:lessons -- unions       특정 레슨만
//   npm run check:lessons -- --types-only 타입 검사만 (CI용, 브라우저 불필요)
//   npm run check:lessons -- -v unions    각 코드의 콘솔 출력까지 표시
//
// 타입 검사 (tsc)
//   - 단계 코드: 타입 오류가 있는 줄 수가 step.errors 와 같아야 합니다.
//   - 미션 정답 / 실습 정답: 오류 0개.  실습 시작 코드: 오류 1개 이상.
// 실행 검증 (헤드리스 브라우저에서 사이트와 같은 샌드박스 런타임으로 실행)
//   - 단계 코드: 무언가 출력/렌더링되어야 하고, 런타임 오류는 step.throws 일 때만 나야 합니다.
//   - 미션: 처음 코드는 목표 미달, 정답 코드는 목표 달성이어야 합니다.
//   - 실습 정답: 런타임 오류 없이 실행되어야 합니다.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../src/content';
import type { Lesson, Runner } from '../src/content/types';
import { buildExerciseCode, grade } from '../src/lib/grade';
import { checkGoal, meetsGoal } from '../src/lib/goal';
import { compile } from '../src/sandbox/compile';
import { buildDocument } from '../src/sandbox/document';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const typesOnly = args.includes('--types-only');
const verbose = args.includes('-v') || args.includes('--verbose');
const only = args.filter((arg) => !arg.startsWith('-'));
const targets = lessons.filter((lesson) => only.length === 0 || only.includes(lesson.id));

if (targets.length === 0) {
  console.error(`레슨을 찾을 수 없습니다: ${only.join(', ')}\n가능한 id: ${lessons.map((l) => l.id).join(', ')}`);
  process.exit(1);
}

const problems: string[] = [];
const fail = (where: string, message: string) => problems.push(`✗ ${where}: ${message}`);
const ext = (runner: Runner) => (runner === 'console' ? 'ts' : 'tsx');

// ── 0) 구조 검사 ─────────────────────────────────────────

const ids = new Set<string>();
for (const lesson of lessons) {
  const all = [lesson.id, lesson.exercise.id, ...lesson.steps.map((s) => s.id), ...lesson.quiz.map((q) => q.id)];
  for (const id of all) {
    if (ids.has(id)) fail(lesson.id, `중복된 id "${id}"`);
    ids.add(id);
  }
}
for (const lesson of targets) {
  if (lesson.steps.length === 0) fail(lesson.id, '단계가 없습니다');
  for (const q of lesson.quiz) {
    if (q.answer < 0 || q.answer >= q.options.length) fail(q.id, '정답 인덱스가 범위를 벗어났습니다');
  }
  for (const step of lesson.steps) {
    if (!step.id.startsWith(`${lesson.id}-`)) fail(step.id, `단계 id는 "${lesson.id}-"로 시작해야 합니다`);
    if (step.mission && step.mission.answer.trim() === step.code.trim()) fail(step.id, '미션 정답이 처음 코드와 같습니다');
  }
}

// ── 1) 타입 검사 ─────────────────────────────────────────

interface Source {
  name: string;
  where: string;
  runner: Runner;
  code: string;
}

const sources: Source[] = [];
for (const lesson of targets) {
  for (const step of lesson.steps) {
    sources.push({ name: `${step.id}.code.${ext(step.runner)}`, where: step.id, runner: step.runner, code: step.code });
    if (step.mission) {
      sources.push({ name: `${step.id}.answer.${ext(step.runner)}`, where: `${step.id} 미션 정답`, runner: step.runner, code: step.mission.answer });
    }
  }
  const ex = lesson.exercise;
  sources.push({ name: `${ex.id}.starter.${ext(ex.runner)}`, where: `${ex.id} 시작 코드`, runner: ex.runner, code: buildExerciseCode(ex) });
  sources.push({ name: `${ex.id}.solution.${ext(ex.runner)}`, where: `${ex.id} 정답`, runner: ex.runner, code: buildExerciseCode(ex, ex.solution) });
}

const dir = mkdtempSync(join(root, '.tmp-lessons-'));
/** 파일 이름 → 오류가 난 줄 번호 → 메시지 */
const typeErrors = new Map<string, Map<number, string>>();
try {
  for (const source of sources) writeFileSync(join(dir, source.name), source.code);
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
  for (const line of output.split('\n')) {
    const match = line.match(/([\w.-]+\.(?:code|answer|starter|solution)\.tsx?)\((\d+),\d+\): error (TS\d+: .*)$/);
    if (!match) continue;
    const [, name, lineNo, message] = match;
    if (!name || !lineNo || !message) continue;
    const found = typeErrors.get(name) ?? new Map<number, string>();
    if (!found.has(Number(lineNo))) found.set(Number(lineNo), message);
    typeErrors.set(name, found);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const errorLines = (name: string) => typeErrors.get(name) ?? new Map<number, string>();
const listErrors = (name: string) => [...errorLines(name)].map(([line, message]) => `\n      ${line}행 ${message}`).join('');

for (const lesson of targets) {
  for (const step of lesson.steps) {
    const name = `${step.id}.code.${ext(step.runner)}`;
    const expected = step.errors ?? 0;
    if (errorLines(name).size !== expected) {
      fail(step.id, `타입 오류가 있는 줄이 ${expected}개여야 하는데 ${errorLines(name).size}개입니다${listErrors(name)}`);
    }
    if (step.mission) {
      const answer = `${step.id}.answer.${ext(step.runner)}`;
      if (errorLines(answer).size > 0) fail(`${step.id} 미션 정답`, `타입 오류가 있습니다${listErrors(answer)}`);
    }
  }
  const ex = lesson.exercise;
  const starter = `${ex.id}.starter.${ext(ex.runner)}`;
  const solution = `${ex.id}.solution.${ext(ex.runner)}`;
  if (errorLines(starter).size === 0) fail(`${ex.id} 시작 코드`, '타입 오류가 없습니다 (처음부터 통과하는 문제)');
  const graded = grade(ex, buildExerciseCode(ex, ex.solution), errorLines(solution).size);
  if (!graded.ok) fail(`${ex.id} 정답`, `채점을 통과하지 못합니다: ${graded.reasons.join(' / ')}${listErrors(solution)}`);
}

// ── 2) 실행 검증 ─────────────────────────────────────────

// Playwright에서 실제로 쓰는 부분만 적어 둔 최소한의 타입입니다.
interface RouteLike {
  fulfill(response: { contentType: string; body: string }): Promise<void>;
}
interface PageLike {
  exposeFunction(name: string, callback: (raw: string) => void): Promise<void>;
  addInitScript(script: () => void): Promise<void>;
  route(url: string, handler: (route: RouteLike) => Promise<void>): Promise<void>;
  goto(url: string): Promise<unknown>;
  evaluate<T>(fn: (arg: T) => void, arg: T): Promise<void>;
  close(): Promise<void>;
}
interface BrowserLike {
  newPage(options: { viewport: { width: number; height: number } }): Promise<PageLike>;
  close(): Promise<void>;
}

interface RunResult {
  logs: Array<{ level: string; text: string; uncaught?: boolean }>;
  rendered: boolean;
  dom: string;
  timedOut: boolean;
}

if (!typesOnly) {
  const runtimePath = join(root, 'src/generated/sandbox-runtime.js');
  // 런타임 소스가 번들보다 새로우면 다시 묶습니다.
  const sandboxDir = join(root, 'src/sandbox');
  const newestSource = Math.max(...readdirSync(sandboxDir).map((name) => statSync(join(sandboxDir, name)).mtimeMs));
  if (!existsSync(runtimePath) || statSync(runtimePath).mtimeMs < newestSource) {
    execFileSync('npx', ['tsx', 'scripts/prebuild.ts'], { cwd: root, stdio: 'inherit' });
  }
  const runtime = readFileSync(runtimePath, 'utf8');

  const require = createRequire(import.meta.url);
  // 이 프로젝트는 Playwright를 의존성으로 두지 않습니다. 로컬에 설치된 것을 씁니다.
  const { chromium } = require('playwright') as { chromium: { launch(): Promise<BrowserLike> } };
  const browser = await chromium.launch();

  const run = async (code: string, runner: Runner): Promise<RunResult> => {
    const result: RunResult = { logs: [], rendered: false, dom: '', timedOut: false };
    const compiled = compile(code, runner !== 'console');
    if (!compiled.ok) {
      result.logs.push({ level: 'error', text: compiled.message, uncaught: true });
      return result;
    }
    const page = await browser.newPage({ viewport: { width: 420, height: 720 } });
    let lastMessageAt = Date.now();
    let done = false;
    try {
      await page.exposeFunction('__tslReport', (raw: string) => {
        lastMessageAt = Date.now();
        const message = JSON.parse(raw) as { type: string; level?: string; text?: string; uncaught?: boolean; rendered?: boolean };
        if (message.type === 'ready') {
          void page.evaluate((request) => window.postMessage(request, '*'), { type: 'run', code: compiled.code, runner });
        } else if (message.type === 'log') {
          result.logs.push({ level: message.level ?? 'log', text: message.text ?? '', uncaught: message.uncaught });
        } else if (message.type === 'dom') {
          result.dom = message.text ?? '';
        } else if (message.type === 'done') {
          result.rendered = message.rendered === true;
          done = true;
        }
      });
      await page.addInitScript(() => {
        window.addEventListener('message', (event) => {
          const data = event.data as Record<string, unknown> | null;
          if (data && data.__tsl === true) {
            void (window as unknown as { __tslReport(raw: string): Promise<void> }).__tslReport(JSON.stringify(data));
          }
        });
      });
      await page.route('http://sandbox.test/', (route) =>
        route.fulfill({ contentType: 'text/html; charset=utf-8', body: buildDocument(runtime, runner, 'light') }),
      );
      await page.goto('http://sandbox.test/');
      const startedAt = Date.now();
      // 완료 신호 뒤에도 비동기 출력(가짜 fetch 응답 등)이 잦아들 때까지 기다립니다.
      while (Date.now() - startedAt < 8000) {
        if (done && Date.now() - lastMessageAt > 700) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      result.timedOut = !done;
    } finally {
      await page.close();
    }
    return result;
  };

  const show = (label: string, result: RunResult) => {
    if (!verbose) return;
    console.log(`  ┌ ${label}`);
    for (const log of result.logs) console.log(`  │ [${log.level}${log.uncaught ? '!' : ''}] ${log.text.replace(/\n/g, '\n  │   ')}`);
    if (result.rendered) console.log(`  │ (화면) ${result.dom.replace(/\s+/g, ' ').slice(0, 300)}`);
    console.log('  └');
  };

  const observe = (result: RunResult, typeErrorCount: number, code: string) => ({
    typeErrors: typeErrorCount,
    console: result.logs.map((log) => log.text).join('\n'),
    preview: result.dom,
    code,
  });

  const checkLesson = async (lesson: Lesson) => {
    for (const step of lesson.steps) {
      const result = await run(step.code, step.runner);
      show(step.id, result);
      const uncaught = result.logs.filter((log) => log.uncaught);
      if (result.timedOut) fail(step.id, '실행이 끝나지 않았습니다');
      if (step.throws && uncaught.length === 0) fail(step.id, 'throws: true 인데 런타임 오류가 나지 않았습니다');
      if (!step.throws && uncaught.length > 0) fail(step.id, `예상하지 못한 런타임 오류: ${uncaught.map((log) => log.text).join(' | ')}`);
      if (result.logs.length === 0 && !result.rendered) fail(step.id, '콘솔 출력도 화면 렌더링도 없습니다');
      if (step.runner !== 'console' && !step.throws && !result.rendered) fail(step.id, '미리보기에 렌더링된 컴포넌트가 없습니다 (export default 필요)');

      if (step.mission) {
        const initial = observe(result, errorLines(`${step.id}.code.${ext(step.runner)}`).size, step.code);
        if (meetsGoal(step.mission.goal, initial)) fail(`${step.id} 미션`, '처음 코드가 이미 목표를 달성합니다');

        const answer = await run(step.mission.answer, step.runner);
        show(`${step.id} 미션 정답`, answer);
        const answerSeen = observe(answer, errorLines(`${step.id}.answer.${ext(step.runner)}`).size, step.mission.answer);
        if (!meetsGoal(step.mission.goal, answerSeen)) {
          const unmet = checkGoal(step.mission.goal, answerSeen).filter((check) => !check.met).map((check) => check.label);
          fail(`${step.id} 미션 정답`, `목표를 달성하지 못합니다 (${unmet.join(', ')}). 콘솔: ${JSON.stringify(answerSeen.console)} / 화면: ${JSON.stringify(answerSeen.preview.slice(0, 200))}`);
        }
        const bad = answer.logs.filter((log) => log.uncaught);
        if (bad.length > 0) fail(`${step.id} 미션 정답`, `런타임 오류: ${bad.map((log) => log.text).join(' | ')}`);
      }
    }

    const ex = lesson.exercise;
    const solved = await run(buildExerciseCode(ex, ex.solution), ex.runner);
    show(`${ex.id} 정답`, solved);
    const bad = solved.logs.filter((log) => log.uncaught);
    if (solved.timedOut) fail(`${ex.id} 정답`, '실행이 끝나지 않았습니다');
    if (bad.length > 0) fail(`${ex.id} 정답`, `런타임 오류: ${bad.map((log) => log.text).join(' | ')}`);
    if (solved.logs.length === 0 && !solved.rendered) fail(`${ex.id} 정답`, '콘솔 출력도 화면 렌더링도 없습니다');
    if (verbose) show(`${ex.id} 시작 코드`, await run(buildExerciseCode(ex), ex.runner));
  };

  try {
    for (const lesson of targets) {
      if (verbose) console.log(`\n■ ${lesson.id}`);
      await checkLesson(lesson);
    }
  } finally {
    await browser.close();
  }
}

// ── 결과 ─────────────────────────────────────────────────

const stepCount = targets.reduce((sum, lesson) => sum + lesson.steps.length, 0);
const missionCount = targets.reduce((sum, lesson) => sum + lesson.steps.filter((s) => s.mission).length, 0);
if (problems.length > 0) {
  console.error(`\n${problems.join('\n')}\n\n문제 ${problems.length}건`);
  process.exit(1);
}
console.log(
  `✓ 레슨 ${targets.length}개 · 단계 ${stepCount}개 · 미션 ${missionCount}개 · 실습 ${targets.length}개 검증 완료 (${typesOnly ? '타입 검사만' : '타입 검사 + 실행'})`,
);
