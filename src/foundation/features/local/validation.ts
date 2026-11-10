type Row = Record<string, unknown>;
const row = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown) =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
const text = (v: Row, keys: string[]) =>
  keys.every((key) => typeof v[key] === "string");
const optionalText = (v: Row, keys: string[]) =>
  keys.every((key) => v[key] === undefined || typeof v[key] === "string");
function chapter(v: unknown): boolean {
  return (
    row(v) &&
    text(v, ["id", "title"]) &&
    Number.isInteger(v.number) &&
    Number(v.number) > 0 &&
    (v.alignment === undefined ||
      v.alignment === "left" ||
      v.alignment === "center") &&
    (v.content === undefined || typeof v.content === "string") &&
    (v.stanzas === undefined ||
      (Array.isArray(v.stanzas) && v.stanzas.every(strings))) &&
    (v.pages === undefined ||
      (Array.isArray(v.pages) &&
        v.pages.every(
          (p) =>
            row(p) &&
            text(p, [
              "id",
              "title",
              "description",
              "accentColor",
              "aspectRatio",
            ]) &&
            Number.isInteger(p.number) &&
            Number(p.number) > 0 &&
            optionalText(p, ["imageUrl", "caption"]),
        )))
  );
}
export function validCollection(kind: string, value: unknown): boolean {
  return (
    Array.isArray(value) &&
    new Set(
      value.map((item) =>
        row(item) ? item[kind === "entries" ? "workId" : "id"] : undefined,
      ),
    ).size === value.length &&
    value.every((v) => {
      if (
        !row(v) ||
        typeof v[kind === "entries" ? "workId" : "id"] !== "string" ||
        !(v[kind === "entries" ? "workId" : "id"] as string).length
      )
        return false;
      if (kind === "works")
        return (
          text(v, [
            "id",
            "title",
            "synopsis",
            "genre",
            "language",
            "coverAccentColor",
            "createdAt",
            "updatedAt",
          ]) &&
          ["prose", "poetry", "comic", "manga"].includes(String(v.mode)) &&
          ["Romance", "Conto", "Poesia", "HQ / Comic", "Mangá"].includes(
            String(v.format),
          ) &&
          ["draft", "in_review", "published", "archived"].includes(
            String(v.status),
          ) &&
          ["Livre", "+12", "+14", "+16", "+18"].includes(String(v.ageRating)) &&
          optionalText(v, ["subtitle", "coverStyle"]) &&
          strings(v.tags) &&
          strings(v.contentWarnings) &&
          Array.isArray(v.chapters) &&
          v.chapters.every(chapter) &&
          new Set(v.chapters.map((chapter) => (chapter as Row).id)).size ===
            v.chapters.length
        );
      if (kind === "entries")
        return (
          text(v, [
            "workId",
            "title",
            "author",
            "format",
            "genre",
            "synopsis",
            "lastReadChapterId",
            "lastReadChapterTitle",
            "lastReadAt",
          ]) &&
          typeof v.progress === "number" &&
          Number.isFinite(v.progress) &&
          v.progress >= 0 &&
          v.progress <= 100 &&
          ["reading", "completed", "plan_to_read"].includes(String(v.status)) &&
          typeof v.isFavorite === "boolean" &&
          strings(v.readingListIds) &&
          optionalText(v, ["lastReadAtIso"]) &&
          (v.lastReadPosition === undefined ||
            (typeof v.lastReadPosition === "number" &&
              Number.isFinite(v.lastReadPosition) &&
              v.lastReadPosition >= 0 &&
              v.lastReadPosition <= 1))
        );
      if (kind === "lists")
        return (
          text(v, ["id", "title", "description", "createdAt", "updatedAt"]) &&
          strings(v.workIds)
        );
      if (kind === "activities")
        return (
          [
            "chapter_edit",
            "metadata_update",
            "draft_created",
            "page_added",
            "chapter_added",
          ].includes(String(v.type)) &&
          text(v, [
            "id",
            "workId",
            "workTitle",
            "type",
            "description",
            "timestamp",
          ])
        );
      if (kind === "media")
        return (
          ["cover", "page", "illustration"].includes(String(v.type)) &&
          optionalText(v, ["workId", "workTitle"]) &&
          (v.isLocalObjectUrl === undefined ||
            typeof v.isLocalObjectUrl === "boolean") &&
          text(v, [
            "id",
            "name",
            "type",
            "url",
            "size",
            "dimensions",
            "createdAt",
          ])
        );
      return false;
    })
  );
}
