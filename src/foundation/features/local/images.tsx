import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { currentScope, notifyLocal } from "./persistence";

const PREFIX = "local-image:";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const allowed = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);
type ImageRecord = { key: string; owner: string; id: string; blob: Blob };
const memory = new Map<string, ImageRecord>();
const imageErrors = new Map<string, string>();
export const imageWarning = () => imageErrors.get(currentScope());
const imageKey = (owner: string, id: string) => `${owner}/${id}`;
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const request = indexedDB.open("arquivo-global-local-v2", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("images", { keyPath: "key" });
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Fecha outras abas antigas e tenta novamente."));
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
async function put(record: ImageRecord) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () =>
        reject(transaction.error ?? new Error("Falha ao guardar imagem"));
    });
  } finally {
    database.close();
  }
}
async function all(owner: string): Promise<ImageRecord[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction("images")
        .objectStore("images")
        .getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as ImageRecord[]).filter(
            (record) => record.owner === owner,
          ),
        );
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}
export async function validateImage(blob: Blob) {
  if (!allowed.has(blob.type) || !blob.size || blob.size > MAX_IMAGE_BYTES)
    throw new Error("Escolhe PNG, JPEG, WebP, GIF ou AVIF até 10 MB.");
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  const valid =
    blob.type === "image/png"
      ? bytes[0] === 137 && ascii(1, 4) === "PNG"
      : blob.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : blob.type === "image/gif"
          ? ["GIF87a", "GIF89a"].includes(ascii(0, 6))
          : blob.type === "image/webp"
            ? ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
            : ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 32));
  if (!valid)
    throw new Error(
      "O conteúdo do ficheiro não corresponde ao tipo de imagem indicado.",
    );
}
export async function storeImage(blob: Blob, owner = currentScope()) {
  await validateImage(blob);
  const id = crypto.randomUUID();
  const record = { key: imageKey(owner, id), owner, id, blob };
  memory.set(record.key, record);
  let persisted = false;
  try {
    await put(record);
    persisted = true;
  } catch {
    imageErrors.set(
      owner,
      "Não foi possível guardar a imagem no dispositivo. Está em memória; exporta uma cópia com imagens antes de sair.",
    );
  }
  notifyLocal();
  return { reference: PREFIX + id, persisted };
}
export async function loadImage(
  reference: string,
  owner = currentScope(),
): Promise<Blob | undefined> {
  if (!reference.startsWith(PREFIX)) return;
  const key = imageKey(owner, reference.slice(PREFIX.length));
  const cached = memory.get(key);
  if (cached) return cached.blob;
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction("images")
        .objectStore("images")
        .get(key);
      request.onsuccess = () =>
        resolve((request.result as ImageRecord | undefined)?.blob);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}
export function LocalImage({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const owner = currentScope();
  const [resolved, setResolved] = useState<{
    reference: string;
    owner: string;
    url: string;
  } | null>(null);
  const local = src?.startsWith(PREFIX);
  useEffect(() => {
    if (!local || !src) return;
    let active = true;
    let url: string | undefined;
    void loadImage(src, owner)
      .then((blob) => {
        if (!active || !blob) return;
        url = URL.createObjectURL(blob);
        setResolved({ reference: src, owner, url });
      })
      .catch(() => {
        /* The placeholder keeps missing files visible. */
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, local, owner]);
  const safeSrc = local
    ? resolved && resolved.reference === src && resolved.owner === owner
      ? resolved.url
      : undefined
    : src;
  if (!safeSrc || safeSrc.startsWith("missing-image:"))
    return (
      <span role="img" aria-label={alt}>
        Imagem local indisponível — volta a selecionar o ficheiro.
      </span>
    );
  return <img src={safeSrc} alt={alt} {...props} />;
}
type ExportedImage = { id: string; type: string; base64: string };
export async function exportImages(
  owner = currentScope(),
): Promise<ExportedImage[]> {
  const records = new Map<string, ImageRecord>();
  try {
    for (const record of await all(owner)) records.set(record.id, record);
  } catch {
    if (![...memory.values()].some((record) => record.owner === owner))
      throw new Error("Imagens inacessíveis");
  }
  for (const record of memory.values())
    if (record.owner === owner) records.set(record.id, record);
  return Promise.all(
    [...records.values()].map(async (record) => {
      const bytes = new Uint8Array(await record.blob.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 8192)
        binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
      return { id: record.id, type: record.blob.type, base64: btoa(binary) };
    }),
  );
}
export async function importImages(input: unknown, owner: string) {
  if (!Array.isArray(input) || input.length > 500)
    throw new Error("Lista de imagens inválida.");
  const records: ImageRecord[] = [];
  for (const value of input) {
    if (
      !value ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(value.id) ||
      typeof value.base64 !== "string" ||
      value.base64.length > MAX_IMAGE_BYTES * 1.4
    )
      throw new Error("Imagem de cópia inválida.");
    const binary = atob(value.base64);
    const blob = new Blob(
      [Uint8Array.from(binary, (character) => character.charCodeAt(0))],
      { type: value.type },
    );
    await validateImage(blob);
    records.push({ key: imageKey(owner, value.id), id: value.id, owner, blob });
  }
  if (owner !== currentScope())
    throw new Error("A sessão mudou. Confirma a importação novamente.");
  for (const record of records) {
    // Existing images are never overwritten by an imported file with the same ID.
    if (await loadImage(PREFIX + record.id, owner)) continue;
    await put(record);
    memory.set(record.key, record);
  }
}
