let sequence = 0;
export const localId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${++sequence}-${Math.random().toString(36).slice(2)}`;
