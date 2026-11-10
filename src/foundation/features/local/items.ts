import { useEffect, useRef, useState } from "react";
/** Per-work demo data stays on its existing key; invalid originals are never overwritten. */
export function useValidatedItems<T>(
  key: string,
  seed: T[],
  valid: (value: unknown) => boolean,
) {
  const [initial] = useState(() => {
    try {
      if (typeof localStorage === "undefined")
        return { items: seed, raw: null, blocked: false, warning: "" };
      const raw = localStorage.getItem(key);
      if (raw === null)
        return { items: seed, raw, blocked: false, warning: "" };
      const value: unknown = JSON.parse(raw);
      if (!valid(value)) throw new Error();
      return { items: value as T[], raw, blocked: false, warning: "" };
    } catch {
      return {
        items: seed,
        raw: null,
        blocked: true,
        warning:
          "Dados anteriores indisponíveis ou inválidos, preservados sem sobrescrita. As alterações ficam apenas nesta sessão.",
      };
    }
  });
  const [items, setItems] = useState<T[]>(initial.items);
  const [warning, setWarning] = useState(initial.warning);
  const baseline = useRef(initial.raw);
  useEffect(() => {
    if (initial.blocked || typeof localStorage === "undefined") return;
    try {
      const encoded = JSON.stringify(items);
      const current = localStorage.getItem(key);
      if (current !== baseline.current) {
        setWarning(
          "Outra aba alterou estes dados. A tua edição continua em memória; exporta uma cópia antes de sair.",
        );
        return;
      }
      if (current !== encoded) localStorage.setItem(key, encoded);
      baseline.current = encoded;
    } catch {
      setWarning(
        "Não foi possível guardar os dados. A edição mantém-se nesta sessão; exporta uma cópia antes de sair.",
      );
    }
  }, [items, key, initial.blocked]);
  const exportCopy = () => {
    let original: string | null = null;
    try {
      original = localStorage.getItem(key);
    } catch {}
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ key, items, original })], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "arquivo-global-interacoes.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { items, setItems, warning, exportCopy };
}
export function validComments(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        ["id", "authorName", "authorUsername", "createdAt", "text"].every(
          (key) => typeof item[key] === "string",
        ) &&
        Number.isFinite(item.likes) &&
        item.likes >= 0 &&
        (item.chapterRef === undefined || typeof item.chapterRef === "string"),
    )
  );
}
export function validReviews(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        [
          "id",
          "reviewerName",
          "reviewerHandle",
          "createdAt",
          "headline",
          "body",
        ].every((key) => typeof item[key] === "string") &&
        typeof item.recommend === "boolean" &&
        Array.isArray(item.facets) &&
        item.facets.every((facet: unknown) => typeof facet === "string"),
    )
  );
}
