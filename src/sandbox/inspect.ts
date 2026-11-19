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

/**
 * React 내부 구현용 속성. 찍어 봐야 수천 줄의 잡음이라 건너뜁니다.
 * React만 만드는 이름으로 좁혀 둡니다. `_store`, `_owner`처럼 학습자가 쓸 법한 이름까지 숨기면 안 됩니다.
 */
const INTERNAL_KEY = /^(_reactName$|_reactInternals$|_reactInternalInstance$|_targetInst$|__react[A-Z][A-Za-z]*\$)/;
const MAX_KEYS = 60;

/** "이름: 메시지"에 이미 들어 있거나 따로 보여 주는 속성 */
const ERROR_BUILTIN_KEYS = new Set(['name', 'message', 'stack', 'cause', 'errors']);

/** 첫머리는 항상 "이름: 메시지"이고, 직접 붙인 필드(code, status …)·errors·cause가 있으면 그 뒤에 덧붙입니다. */
function formatError(error: Error, depth: number, indent: string, seen: Set<object>): string {
  const head = `${error.name}: ${error.message}`;
  if (seen.has(error) || depth > MAX_DEPTH) return head;
  seen.add(error);
  try {
    const fields = error as unknown as Record<string, unknown>;
    const inner = `${indent}  `;
    // 덧붙이는 필드 하나를 읽지 못해도(예외를 던지는 getter) 첫머리와 나머지 필드는 그대로 보여 줍니다.
    const peek = (key: string): unknown => {
      try {
        return fields[key];
      } catch {
        return undefined;
      }
    };
    const read = (key: string): string => {
      try {
        return format(fields[key], depth + 1, inner, seen);
      } catch {
        return '[읽을 수 없는 값]';
      }
    };
    // errors는 배열일 때만(AggregateError) 따로 보여 줍니다. 직접 붙인 객체라면 다른 필드처럼 보여 줍니다.
    const hasErrorList = Array.isArray(peek('errors'));
    const items = Object.keys(error)
      .filter((key) => !ERROR_BUILTIN_KEYS.has(key) || (key === 'errors' && !hasErrorList))
      .slice(0, MAX_KEYS)
      .map((key) => `${key}: ${read(key)}`);
    if (hasErrorList) items.push(`[errors]: ${read('errors')}`);
    if (peek('cause') !== undefined) items.push(`[cause]: ${read('cause')}`);
    return items.length === 0 ? head : `${head} ${wrap('{', items, '}', indent)}`;
  } catch {
    // 필드 목록조차 읽을 수 없는 값(ownKeys 트랩이 던지는 Proxy)은 첫머리만 보여 줍니다.
    return head;
  } finally {
    seen.delete(error);
  }
}

function isWindow(object: object): boolean {
  return object === globalThis || Object.prototype.toString.call(object) === '[object Window]';
}

function formatObject(object: object, depth: number, indent: string, seen: Set<object>): string {
  if (isWindow(object)) return '[Window]';
  if (object instanceof Error) return formatError(object, depth, indent, seen);
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
  // 합성 이벤트인지는 preventDefault 메서드까지 확인합니다. 키 이름만 같은 평범한 객체는 그대로 펼쳐 보여야 합니다.
  const isSyntheticEvent =
    'nativeEvent' in object && 'type' in object && typeof (object as { preventDefault?: unknown }).preventDefault === 'function';
  if (isDomEvent || isSyntheticEvent) {
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
