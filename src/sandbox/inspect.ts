// console.log 인자를 사람이 읽기 좋은 문자열로 바꿉니다. (Node의 util.inspect 축약판)

const MAX_DEPTH = 4;
const LINE_WIDTH = 64;

function isPlainObject(value: object): boolean {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function nameOf(value: object): string {
  const ctor = (value as { constructor?: { name?: string } }).constructor;
  return ctor?.name ?? 'Object';
}

function wrap(open: string, items: string[], close: string, indent: string): string {
  if (items.length === 0) return `${open}${close}`;
  const oneLine = `${open} ${items.join(', ')} ${close}`;
  if (oneLine.length <= LINE_WIDTH && !oneLine.includes('\n')) {
    return open === '[' ? `[${items.join(', ')}]` : oneLine;
  }
  const inner = `${indent}  `;
  return `${open}\n${items.map((item) => inner + item).join(',\n')}\n${indent}${close}`;
}

function format(value: unknown, depth: number, indent: string, seen: Set<object>): string {
  switch (typeof value) {
    case 'string':
      return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'bigint':
      return `${value}n`;
    case 'symbol':
      return value.toString();
    case 'function': {
      const source = Function.prototype.toString.call(value);
      const kind = source.startsWith('class') ? 'class' : 'Function';
      return `[${kind}: ${value.name || '(anonymous)'}]`;
    }
  }
  if (value === null) return 'null';

  try {
    return formatObject(value as object, depth, indent, seen);
  } catch {
    // 다른 출처의 창(window.parent)처럼 속성을 읽는 것만으로 예외가 나는 값이 있습니다.
    return '[읽을 수 없는 값]';
  }
}

/** React 내부 구현용 속성. 찍어 봐야 수천 줄의 잡음이라 건너뜁니다. */
const INTERNAL_KEY = /^(_react|__react|_targetInst$|_owner$|_store$|_debug)/;
const MAX_KEYS = 60;

function isWindow(object: object): boolean {
  return object === globalThis || Object.prototype.toString.call(object) === '[object Window]';
}

function formatObject(object: object, depth: number, indent: string, seen: Set<object>): string {
  if (isWindow(object)) return '[Window]';
  if (object instanceof Error) return `${object.name}: ${object.message}`;
  if (object instanceof Date) return Number.isNaN(object.getTime()) ? 'Invalid Date' : object.toISOString();
  if (object instanceof RegExp) return object.toString();
  if (object instanceof Promise) return 'Promise { … }';
  if (typeof Node !== 'undefined' && object instanceof Node) {
    return object instanceof Element ? `<${object.tagName.toLowerCase()}>` : object.nodeName;
  }
  if ('$$typeof' in object && 'props' in object) {
    const type = (object as { type?: unknown }).type;
    const name = typeof type === 'string' ? type : typeof type === 'function' ? type.name || 'Component' : 'Fragment';
    return `<${name} />`;
  }
  // 이벤트 객체(브라우저 Event, React의 합성 이벤트)는 핵심만 보여 줍니다.
  const isDomEvent = typeof Event !== 'undefined' && object instanceof Event;
  if (isDomEvent || ('nativeEvent' in object && 'currentTarget' in object && 'type' in object)) {
    const event = object as { type?: unknown; target?: unknown };
    const label = isDomEvent ? nameOf(object) : 'SyntheticEvent';
    return `${label} { type: ${format(event.type, depth + 1, indent, seen)}, target: ${format(event.target, depth + 1, indent, seen)} }`;
  }

  if (seen.has(object)) return '[Circular]';
  if (depth > MAX_DEPTH) return Array.isArray(object) ? '[Array]' : `[${nameOf(object)}]`;
  seen.add(object);

  try {
    if (Array.isArray(object)) {
      const items = object.slice(0, 100).map((item) => format(item, depth + 1, `${indent}  `, seen));
      if (object.length > 100) items.push(`… ${object.length - 100}개 더`);
      return wrap('[', items, ']', indent);
    }
    if (object instanceof Map) {
      const items = [...object.entries()].map(
        ([key, item]) => `${format(key, depth + 1, `${indent}  `, seen)} => ${format(item, depth + 1, `${indent}  `, seen)}`,
      );
      return `Map(${object.size}) ${wrap('{', items, '}', indent)}`;
    }
    if (object instanceof Set) {
      const items = [...object.values()].map((item) => format(item, depth + 1, `${indent}  `, seen));
      return `Set(${object.size}) ${wrap('{', items, '}', indent)}`;
    }
    const keys = Object.keys(object).filter((key) => !INTERNAL_KEY.test(key));
    const items = keys.slice(0, MAX_KEYS).map((key) => {
      const label = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`;
      let item: string;
      try {
        item = format((object as Record<string, unknown>)[key], depth + 1, `${indent}  `, seen);
      } catch {
        item = '[읽을 수 없는 값]';
      }
      return `${label}: ${item}`;
    });
    if (keys.length > MAX_KEYS) items.push(`… ${keys.length - MAX_KEYS}개 더`);
    const body = wrap('{', items, '}', indent);
    return isPlainObject(object) ? body : `${nameOf(object)} ${body}`;
  } finally {
    seen.delete(object);
  }
}

const MAX_OUTPUT = 8000;

function show(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  try {
    return format(arg, 0, '', new Set());
  } catch {
    return '[출력할 수 없는 값]';
  }
}

/**
 * console.log('%s님, %d개', name, count) 같은 printf 형식을 풀어 줍니다.
 * React의 개발용 경고가 이 형식을 쓰기 때문에, 처리하지 않으면 "%s"가 그대로 보입니다.
 */
function substitute(template: string, rest: unknown[]): string {
  return template.replace(/%([sdifoOc%])/g, (match, kind: string) => {
    if (kind === '%') return '%';
    if (rest.length === 0) return match;
    const value = rest.shift();
    switch (kind) {
      case 'c':
        return ''; // 스타일 지정은 버립니다
      case 'd':
      case 'i':
        return typeof value === 'number' ? String(Math.trunc(value)) : String(parseInt(String(value), 10));
      case 'f':
        return String(Number(value));
      case 's':
        return typeof value === 'string' ? value : show(value);
      default:
        return show(value);
    }
  });
}

/** console.log(a, b, c) 한 번의 호출을 한 줄(또는 여러 줄)의 문자열로 만듭니다. */
export function formatArgs(args: unknown[]): string {
  const rest = [...args];
  const parts: string[] = [];
  const first = rest[0];
  if (typeof first === 'string' && rest.length > 1 && first.includes('%')) {
    rest.shift();
    parts.push(substitute(first, rest));
  }
  for (const arg of rest) parts.push(show(arg));
  const text = parts.join(' ');
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\n… (출력이 길어 ${text.length - MAX_OUTPUT}자를 생략했습니다)` : text;
}
