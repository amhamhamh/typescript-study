let pending: Promise<string> | null = null;

/** 샌드박스 런타임 번들(문자열)을 필요할 때 한 번만 불러옵니다. */
export function loadRuntime(): Promise<string> {
  pending ??= import('../generated/sandbox-runtime.js?raw').then((module) => module.default);
  return pending;
}
