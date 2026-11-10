import { useSyncExternalStore } from "react";

export const legacyKeys = [
  "ag_studio_works_v1",
  "ag_studio_activities_v1",
  "ag_studio_media_v1",
  "ag_library_entries_v1",
  "ag_library_lists_v1",
] as const;
type Definition = { seed: unknown[]; valid: (value: unknown) => boolean };
const definitions = new Map<string, Definition>();
const memory = new Map<string, unknown[]>();
const failures = new Map<string, string>();
const damaged = new Set<string>();
const listeners = new Set<() => void>();
let scope = "guest";
let override: string | undefined;
let revision = 0;
const baselines = new Map<string, string | null>();
const conflicts = new Set<string>();
const ownWrites = new Set<string>();
const alternatives = new Map<string, string>();
const pending = new Map<
  string,
  { base: string; owner: string; timer: ReturnType<typeof setTimeout> }
>();
const writer =
  globalThis.crypto?.randomUUID?.() ??
  `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let sequence = 0;
export const persistenceMetrics = { serializations: 0 };
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const ak = Object.keys(a),
    bk = Object.keys(b);
  return (
    ak.length === bk.length &&
    ak.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        same(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
    )
  );
}
function decode(raw: string, definition?: Definition): unknown[] {
  const parsed: unknown = JSON.parse(raw);
  const value = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        (parsed as { version?: unknown }).version === 3 &&
        typeof (parsed as { revision?: unknown }).revision === "string"
      ? (parsed as { data?: unknown }).data
      : undefined;
  if (!Array.isArray(value) || (definition && !definition.valid(value)))
    throw new Error("invalid-data");
  return value;
}
function definitionForKey(key: string) {
  return [...definitions.entries()].find(([base]) => key.endsWith(`:${base}`));
}
function preserveConflict(key: string) {
  if (!memory.has(key)) return;
  const archive = `${key}:conflict:${writer}:${++sequence}`;
  const encoded = JSON.stringify({
    version: 3,
    revision: `${writer}:${sequence}`,
    data: memory.get(key),
  });
  alternatives.set(archive, encoded);
  try {
    localStorage.setItem(archive, encoded);
  } catch {
    /* Still included in memory export. */
  }
}
function markConflict(key: string) {
  if (!conflicts.has(key)) preserveConflict(key);
  conflicts.add(key);
  report(
    key,
    "Conflito com outra aba. A tua versão foi conservada; exporta uma cópia ou escolhe carregar a versão da outra aba.",
  );
}

const clone = <T>(value: T): T => structuredClone(value);
export const currentScope = () => override ?? scope;
export const scopeForUser = (id?: string) => (id ? `user:${id}` : "guest");
export const scopedKey = (base: string, owner = currentScope()) =>
  `ag:v2:${encodeURIComponent(owner)}:${base}`;
export const subscribeLocal = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function notifyLocal() {
  revision++;
  listeners.forEach((listener) => listener());
}
export function selectScope(next: string) {
  if (scope === next) return;
  flushLocal();
  scope = next;
  notifyLocal();
}
export function inScope<T>(owner: string, action: () => T): T {
  const previous = override;
  override = owner;
  try {
    return action();
  } finally {
    override = previous;
  }
}
export function bindScope<T extends object>(store: T, owner: string): T {
  return new Proxy(store, {
    get(target, key) {
      const value = Reflect.get(target, key);
      return typeof value === "function"
        ? (...args: unknown[]) =>
            inScope(owner, () =>
              Reflect.apply(
                value as (...parameters: unknown[]) => unknown,
                target,
                args,
              ),
            )
        : value;
    },
  });
}
export function registerLocal(
  base: string,
  seed: unknown[],
  valid: Definition["valid"],
) {
  definitions.set(base, { seed: clone(seed), valid });
}
function report(key: string, message: string) {
  failures.set(key, message);
}
export function readLocal<T>(base: string): T[] {
  const key = scopedKey(base);
  if (memory.has(key)) return clone(memory.get(key)) as T[];
  const definition = definitions.get(base);
  let value: unknown[] = clone(
    currentScope() === "guest" ? (definition?.seed ?? []) : [],
  );
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      baselines.set(key, raw);
      if (raw !== null) {
        value = decode(raw, definition);
      }
    }
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === "invalid-data")
    ) {
      damaged.add(key);
      report(
        key,
        "Dados locais inválidos preservados. Exporta uma cópia antes de recuperar.",
      );
    } else {
      report(
        key,
        "O armazenamento não está disponível. As alterações ficam apenas em memória; exporta uma cópia.",
      );
    }
  }
  memory.set(key, value);
  return clone(value) as T[];
}
function commitLocal(base: string, owner: string): boolean {
  return inScope(owner, () => {
    const key = scopedKey(base);
    const value = memory.get(key);
    if (!value) return false;
    let saved = false;
    try {
      if (damaged.has(key)) throw new Error("invalid-data");
      if (conflicts.has(key)) {
        markConflict(key);
        return false;
      }
      if (typeof localStorage === "undefined") throw new Error("unavailable");
      const current = localStorage.getItem(key);
      if (current !== (baselines.get(key) ?? null)) {
        markConflict(key);
        return false;
      }
      // Keep an untouched v2 array before the first envelope write.
      if (
        current !== null &&
        current.trimStart().startsWith("[") &&
        localStorage.getItem(`${key}:backup:v2`) === null
      )
        localStorage.setItem(`${key}:backup:v2`, current);
      const encoded = JSON.stringify(
        {
          version: 3,
          writer,
          revision: `${writer}:${++sequence}`,
          data: value,
        },
        (field, item) =>
          (field === "imageUrl" || field === "url") &&
          typeof item === "string" &&
          item.startsWith("blob:")
            ? "missing-image:legacy"
            : item,
      );
      persistenceMetrics.serializations++;
      // A per-tab durable draft conserves candidates even if two processes race.
      localStorage.setItem(`${key}:draft:${writer}`, encoded);
      if (localStorage.getItem(key) !== current) {
        markConflict(key);
        return false;
      }
      localStorage.setItem(key, encoded);
      baselines.set(key, encoded);
      ownWrites.add(key);
      failures.delete(key);
      saved = true;
    } catch {
      report(
        key,
        damaged.has(key)
          ? "Os dados originais inválidos foram preservados. A edição está apenas em memória; exporta-a."
          : "Não foi possível guardar no dispositivo (quota ou acesso). A edição está apenas em memória; exporta-a antes de sair.",
      );
    } finally {
      notifyLocal();
    }
    return saved;
  });
}
export function writeLocal<T>(base: string, value: T[]): boolean {
  const key = scopedKey(base);
  const definition = definitions.get(base);
  if (definition && !definition.valid(value)) {
    report(
      key,
      "Alteração inválida recusada. Os dados anteriores foram preservados.",
    );
    notifyLocal();
    return false;
  }
  if (same(memory.get(key), value) && !failures.has(key))
    return !pending.has(key);
  memory.set(key, clone(value));
  const previous = pending.get(key);
  if (previous) clearTimeout(previous.timer);
  if (
    typeof window !== "undefined" &&
    (base === "ag_studio_works_v1" || base === "ag_studio_activities_v1") &&
    !damaged.has(key) &&
    !failures.has(key)
  ) {
    const owner = currentScope();
    const timer = setTimeout(() => {
      pending.delete(key);
      commitLocal(base, owner);
    }, 300);
    pending.set(key, { base, owner, timer });
    notifyLocal();
    return false;
  }
  pending.delete(key);
  return commitLocal(base, currentScope());
}
export function flushLocal() {
  for (const [key, job] of pending) {
    clearTimeout(job.timer);
    pending.delete(key);
    commitLocal(job.base, job.owner);
  }
}
export function localPending(owner = currentScope()) {
  return [...pending.keys()].some((key) =>
    key.startsWith(`ag:v2:${encodeURIComponent(owner)}:`),
  );
}
export function hasLocalConflict(owner = currentScope()) {
  return [...conflicts].some((key) =>
    key.startsWith(`ag:v2:${encodeURIComponent(owner)}:`),
  );
}
export function acceptRemoteLocal(owner = currentScope()) {
  inScope(owner, () => {
    for (const [base] of definitions) {
      const key = scopedKey(base);
      if (!conflicts.has(key)) continue;
      preserveConflict(key);
      memory.delete(key);
      baselines.delete(key);
      ownWrites.delete(key);
      conflicts.delete(key);
      failures.delete(key);
      damaged.delete(key);
    }
  });
  notifyLocal();
}
export function localSnapshot<T>(base: string): T[] {
  const key = scopedKey(base);
  if (!memory.has(key)) readLocal(base);
  return memory.get(key) as T[];
}
export function useLocalCollection<T>(base: string): T[] {
  return useSyncExternalStore(
    subscribeLocal,
    () => localSnapshot<T>(base),
    () => localSnapshot<T>(base),
  );
}
export const useLocalRevision = () =>
  useSyncExternalStore(
    subscribeLocal,
    () => revision,
    () => 0,
  );
export const useLocalScope = () =>
  useSyncExternalStore(
    subscribeLocal,
    () => scope,
    () => "guest",
  );
export function localWarnings(owner = currentScope()) {
  const prefix = `ag:v2:${encodeURIComponent(owner)}:`;
  return [
    ...new Set(
      [...failures]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, value]) => value),
    ),
  ];
}
export function retryLocal(owner = currentScope()) {
  inScope(owner, () => {
    for (const base of definitions.keys()) {
      const key = scopedKey(base);
      if (failures.has(key) && memory.has(key))
        writeLocal(base, memory.get(key)!);
    }
  });
}
export function exportLocal(owner = currentScope()) {
  flushLocal();
  return inScope(owner, () => {
    const data: Record<string, unknown[]> = {};
    for (const key of definitions.keys()) data[key] = readLocal(key);
    const originals: Record<string, string> = {};
    for (const key of definitions.keys()) {
      try {
        const raw = localStorage.getItem(scopedKey(key));
        if (raw !== null && damaged.has(scopedKey(key))) originals[key] = raw;
      } catch {
        /* The memory copy is still exportable. */
      }
    }
    return {
      version: 2,
      owner,
      exportedAt: new Date().toISOString(),
      data,
      originals,
      alternatives: localCopies(owner),
    };
  });
}
export function localCopies(owner = currentScope()) {
  const copies: Record<string, string> = {};
  const prefix = `ag:v2:${encodeURIComponent(owner)}:`;
  for (const [key, value] of alternatives)
    if (key.startsWith(prefix)) copies[key] = value;
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith(prefix) && /:(draft|conflict|backup):/.test(key)) {
        const value = localStorage.getItem(key);
        if (value) copies[key] = value;
      }
    }
  } catch {}
  return copies;
}
export function recoverLocalCopy(key: string, owner = currentScope()) {
  const copies = localCopies(owner);
  const raw = copies[key];
  const base = [...definitions.keys()].find((base) =>
    key.startsWith(`${scopedKey(base, owner)}:`),
  );
  if (!base || !raw || owner !== currentScope())
    throw new Error("Cópia local inválida para este espaço.");
  return { [base]: decode(raw, definitions.get(base)) };
}
export function legacySnapshot(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of legacyKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) result[key] = raw;
    } catch {
      /* No access. */
    }
  }
  return result;
}
export function validateImport(
  data: unknown,
): data is Record<string, unknown[]> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const entries = Object.entries(data);
  return (
    entries.length > 0 &&
    entries.every(([key, value]) => {
      const definition = definitions.get(key);
      return definition && Array.isArray(value) && definition.valid(value);
    })
  );
}
export function parseLegacy(snapshot: Record<string, string>) {
  const data = Object.fromEntries(
    Object.entries(snapshot).map(([key, raw]) => [key, JSON.parse(raw)]),
  );
  if (!validateImport(data))
    throw new Error(
      "Os dados antigos não têm um formato recuperável. Exporta os originais para revisão.",
    );
  return data;
}
export function importLocal(data: unknown, confirmed: boolean, owner: string) {
  if (!confirmed || owner !== currentScope())
    throw new Error("Confirma novamente o espaço de destino.");
  if (!validateImport(data)) throw new Error("Formato de importação inválido.");
  data = clone(data);
  // Preserve both edited legacy drafts and existing destination works on ID collision.
  const rows = data as Record<string, Record<string, unknown>[]>;
  const workIds = new Set(
    readLocal<Record<string, unknown>>("ag_studio_works_v1").map(
      (work) => work.id,
    ),
  );
  const renamed = new Map<string, string>();
  for (const work of rows.ag_studio_works_v1 ?? []) {
    const id = String(work.id);
    if (workIds.has(id)) {
      const next = `${id}-recuperado-${crypto.randomUUID()}`;
      work.id = next;
      renamed.set(id, next);
    }
    workIds.add(work.id);
  }
  for (const key of ["ag_studio_activities_v1", "ag_studio_media_v1"]) {
    for (const row of rows[key] ?? [])
      if (renamed.has(String(row.workId)))
        row.workId = renamed.get(String(row.workId));
  }
  let added = 0;
  inScope(owner, () => {
    for (const [key, incoming] of Object.entries(rows)) {
      const existing = readLocal<Record<string, unknown>>(key);
      const idKey = key === "ag_library_entries_v1" ? "workId" : "id";
      const ids = new Set(existing.map((item) => item[idKey]));
      const extra = (incoming as Record<string, unknown>[]).filter((item) => {
        if (ids.has(item[idKey])) return false;
        ids.add(item[idKey]);
        return true;
      });
      if (extra.length) {
        writeLocal(key, [...existing, ...extra]);
        added += extra.length;
      }
    }
  });
  return added;
}

// Events are notifications; reread the current value rather than trusting stale event payloads.
export function handleLocalStorageChange(key: string | null) {
  const keys = key ? [key] : [...memory.keys()];
  for (const key of keys) {
    const definition = definitionForKey(key);
    if (!definition) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw === baselines.get(key)) continue;
      if (pending.has(key) || ownWrites.has(key) || failures.has(key)) {
        if (raw !== null && same(memory.get(key), decode(raw, definition[1]))) {
          baselines.set(key, raw);
          continue;
        }
        markConflict(key);
      } else {
        memory.delete(key);
        baselines.delete(key);
        damaged.delete(key);
      }
    } catch {
      markConflict(key);
    }
  }
  notifyLocal();
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) =>
    handleLocalStorageChange(event.key),
  );
  window.addEventListener("pagehide", flushLocal);
  window.addEventListener("beforeunload", (event) => {
    flushLocal();
    if (localWarnings().length) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}
