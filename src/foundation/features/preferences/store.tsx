import { useEffect, useSyncExternalStore } from "react";
import type {
  ReadingPreferences,
  VisualReaderPreferences,
  ReaderMode,
} from "../reader/types";
export type ReaderPreferences = ReadingPreferences & VisualReaderPreferences;
export const defaults: ReaderPreferences = {
  fontSize: "normal",
  lineHeight: "normal",
  measure: "comfortable",
  fontFamily: "serif",
  distractionFree: false,
  theme: "dark",
  fitMode: "width",
  direction: "ltr",
  viewMode: "single",
  zoom: 100,
};
export const preferenceKey = "ag_preferences_v1";
const modes: ReaderMode[] = ["prose", "poetry", "comic", "manga"];
const legacy = [
  "ag_reading_font_size",
  "ag_reading_measure",
  "ag_reading_font_family",
  ...modes.map((mode) => `ag_reader_${mode}_prefs`),
  "ag_reduced_motion",
  "ag_high_contrast",
];
interface PreferenceState {
  version: 1;
  global: ReaderPreferences;
  formats: Partial<Record<ReaderMode, Partial<ReaderPreferences>>>;
  accessibility: {
    reducedMotion: boolean | null;
    highContrast: boolean | null;
  };
  warning: string;
}
const initial: PreferenceState = {
  version: 1,
  global: defaults,
  formats: {
    poetry: {
      fontSize: "medium",
      lineHeight: "relaxed",
      fontFamily: "literary",
    },
    manga: { direction: "rtl", fitMode: "height" },
  },
  accessibility: { reducedMotion: null, highContrast: null },
  warning: "",
};
let state = initial;
let initialized = false,
  damaged = false;
let listening = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const enums: Record<string, readonly unknown[]> = {
  fontSize: ["small", "normal", "medium", "large", "xlarge"],
  lineHeight: ["compact", "normal", "relaxed"],
  measure: ["compact", "comfortable", "wide"],
  fontFamily: ["serif", "sans", "literary"],
  theme: ["dark", "light", "sepia", "system"],
  fitMode: ["width", "height", "original"],
  direction: ["ltr", "rtl"],
  viewMode: ["single", "vertical"],
};
export function cleanPreferences(value: unknown): Partial<ReaderPreferences> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      enums[key]?.includes(item) ||
      (key === "distractionFree" && typeof item === "boolean") ||
      (key === "zoom" &&
        typeof item === "number" &&
        Number.isFinite(item) &&
        item >= 75 &&
        item <= 175)
    )
      clean[key] = item;
  }
  return clean;
}
function validPartial(value: unknown) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(cleanPreferences(value)).length === Object.keys(value).length
  );
}
function persist() {
  try {
    if (damaged) throw new Error();
    localStorage.setItem(
      preferenceKey,
      JSON.stringify({ ...state, warning: undefined }),
    );
  } catch {
    state = {
      ...state,
      warning:
        "Preferências apenas em memória. Os dados anteriores foram preservados; exporta uma cópia antes de sair.",
    };
  }
  emit();
}
export function preferenceOriginals() {
  const data: Record<string, string> = {};
  for (const key of [preferenceKey, ...legacy]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = raw;
    } catch {}
  }
  return data;
}
export function initializePreferences() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  if (!listening && typeof window.addEventListener === "function") {
    listening = true;
    window.addEventListener("storage", (event) => {
      if (event.key === preferenceKey) {
        initialized = false;
        damaged = false;
        initializePreferences();
      }
    });
  }
  try {
    const raw = localStorage.getItem(preferenceKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        parsed.version !== 1 ||
        !validPartial(parsed.global) ||
        Object.keys(parsed.global).length !== Object.keys(defaults).length ||
        !parsed.formats ||
        typeof parsed.formats !== "object" ||
        Array.isArray(parsed.formats) ||
        !Object.keys(parsed.formats).every(
          (mode) =>
            modes.includes(mode as ReaderMode) &&
            validPartial(parsed.formats[mode]),
        ) ||
        !parsed.accessibility ||
        ![
          parsed.accessibility.reducedMotion,
          parsed.accessibility.highContrast,
        ].every((value) => value === null || typeof value === "boolean")
      )
        throw new Error();
      const formats: PreferenceState["formats"] = {};
      for (const mode of modes)
        formats[mode] = cleanPreferences(parsed.formats[mode]);
      state = {
        version: 1,
        global: { ...defaults, ...cleanPreferences(parsed.global) },
        formats,
        accessibility: {
          reducedMotion:
            typeof parsed.accessibility.reducedMotion === "boolean"
              ? parsed.accessibility.reducedMotion
              : null,
          highContrast:
            typeof parsed.accessibility.highContrast === "boolean"
              ? parsed.accessibility.highContrast
              : null,
        },
        warning: "",
      };
      emit();
      return;
    }
    const formats = structuredClone(initial.formats);
    let warning = "";
    for (const mode of modes) {
      try {
        const old = localStorage.getItem(`ag_reader_${mode}_prefs`);
        if (old) {
          const parsed = JSON.parse(old);
          if (!validPartial(parsed))
            warning =
              "Preferências antigas inválidas foram preservadas; só os campos válidos foram recuperados.";
          formats[mode] = { ...formats[mode], ...cleanPreferences(parsed) };
        }
      } catch {
        warning =
          "Algumas preferências antigas são inválidas e foram preservadas para recuperação.";
      }
    }
    const global: ReaderPreferences = { ...defaults };
    for (const [field, key] of [
      ["fontSize", "ag_reading_font_size"],
      ["measure", "ag_reading_measure"],
      ["fontFamily", "ag_reading_font_family"],
    ] as const) {
      const item = cleanPreferences({ [field]: localStorage.getItem(key) });
      if (item[field]) {
        Object.assign(global, item);
        for (const mode of modes) delete formats[mode]?.[field];
      }
    }
    state = {
      ...initial,
      global,
      formats,
      warning,
      accessibility: {
        reducedMotion: legacyBool("ag_reduced_motion"),
        highContrast: legacyBool("ag_high_contrast"),
      },
    };
    persist();
  } catch {
    damaged = true;
    state = {
      ...initial,
      warning:
        "Preferências indisponíveis ou corrompidas. O original foi preservado; podes exportá-lo para recuperação.",
    };
    emit();
  }
}
function legacyBool(key: string) {
  const value = localStorage.getItem(key);
  return value === "true" ? true : value === "false" ? false : null;
}
export function updateReadingPreferences(
  patch: Partial<ReaderPreferences>,
  mode?: ReaderMode,
) {
  initializePreferences();
  const clean = cleanPreferences(patch);
  if (mode)
    state = {
      ...state,
      formats: {
        ...state.formats,
        [mode]: { ...state.formats[mode], ...clean },
      },
    };
  else {
    const formats = structuredClone(state.formats);
    for (const value of Object.values(formats))
      for (const key of Object.keys(clean))
        delete value[key as keyof ReaderPreferences];
    state = { ...state, global: { ...state.global, ...clean }, formats };
  }
  persist();
}
export function updateAccessibility(
  patch: Partial<PreferenceState["accessibility"]>,
) {
  initializePreferences();
  state = { ...state, accessibility: { ...state.accessibility, ...patch } };
  persist();
}
export const preferenceSnapshot = () => state;
export function usePreferences() {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    preferenceSnapshot,
    () => initial,
  );
  useEffect(initializePreferences, []);
  return value;
}
export function useReadingPreferences(mode: ReaderMode) {
  const state = usePreferences();
  const prefs = { ...state.global, ...state.formats[mode] };
  const setPrefs = (
    value:
      | ReaderPreferences
      | ((previous: ReaderPreferences) => ReaderPreferences),
  ) => {
    const next = typeof value === "function" ? value(prefs) : value;
    const changed = Object.fromEntries(
      Object.entries(next).filter(
        ([key, item]) => prefs[key as keyof ReaderPreferences] !== item,
      ),
    );
    updateReadingPreferences(changed, mode);
  };
  return [prefs, setPrefs] as const;
}
export function PreferenceEffects() {
  const { accessibility, warning } = usePreferences();
  useEffect(() => {
    const reduced =
      typeof matchMedia === "undefined"
        ? null
        : matchMedia("(prefers-reduced-motion: reduce)");
    const contrast =
      typeof matchMedia === "undefined"
        ? null
        : matchMedia("(prefers-contrast: more)");
    const apply = () => {
      document.documentElement.classList.toggle(
        "prefers-reduced-motion",
        accessibility.reducedMotion === true || !!reduced?.matches,
      );
      document.documentElement.classList.toggle(
        "high-contrast",
        accessibility.highContrast ?? !!contrast?.matches,
      );
    };
    apply();
    reduced?.addEventListener?.("change", apply);
    contrast?.addEventListener?.("change", apply);
    return () => {
      reduced?.removeEventListener?.("change", apply);
      contrast?.removeEventListener?.("change", apply);
    };
  }, [accessibility.reducedMotion, accessibility.highContrast]);
  return warning ? (
    <p role="status" className="notice">
      {warning} <a href="/definicoes/leitura">Rever preferências</a>
    </p>
  ) : null;
}
