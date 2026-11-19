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

  const object = value as object;
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
    const items = Object.entries(object).map(([key, item]) => {
      const label = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`;
      return `${label}: ${format(item, depth + 1, `${indent}  `, seen)}`;
    });
    const body = wrap('{', items, '}', indent);
    return isPlainObject(object) ? body : `${nameOf(object)} ${body}`;
  } finally {
    seen.delete(object);
  }
}

/** console.log(a, b, c) 한 번의 호출을 한 줄(또는 여러 줄)의 문자열로 만듭니다. */
export function formatArgs(args: unknown[]): string {
  return args.map((arg) => (typeof arg === 'string' ? arg : format(arg, 0, '', new Set()))).join(' ');
}
