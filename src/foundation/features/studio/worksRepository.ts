import {
  coverStylePersistenceEnabled,
  coverStudioV2Enabled,
  type CoverStyleOptions,
} from "../covers/config";
import {
  isCoverStyle,
  isOriginalCoverStyle,
  isCoverSeed,
  readCoverSeed,
  readCoverStyle,
  type CoverStyle,
} from "../../data/covers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudioWork, WorkFormat, AgeRating } from "./types";

export interface DraftMetadata {
  title: string;
  subtitle?: string;
  synopsis: string;
  format: WorkFormat;
  language: string;
  genre: string;
  tags: string[];
  ageRating: AgeRating;
  contentWarnings: string[];
  coverAccentColor: string;
  coverStyle?: CoverStyle;
  coverSeed?: number;
}
export type EditorialAction =
  | "duplicate_work"
  | "archive"
  | "restore"
  | "delete_work"
  | "add_entry"
  | "save_entry"
  | "duplicate_entry"
  | "delete_entry"
  | "reorder_entries"
  | "publish"
  | "withdraw";
export interface EditorialResult {
  work?: StudioWork;
  deletedId?: string;
}
export interface WorksRepository {
  editorial?(
    work: StudioWork,
    action: EditorialAction,
    payload?: Record<string, unknown>,
  ): Promise<EditorialResult>;
  list(): Promise<StudioWork[]>;
  find(id: string): Promise<StudioWork | null>;
  create(metadata: DraftMetadata): Promise<StudioWork>;
  update(work: StudioWork, metadata: DraftMetadata): Promise<StudioWork>;
  remove(work: StudioWork): Promise<void>;
}
export class WorksError extends Error {}
const columns =
  "id,owner_id,title,slug,description,type,status,visibility,language,subtitle,genre,tags,age_rating,content_warnings,cover_accent_color,revision,created_at,updated_at,archived_at,public_id,first_published_at,last_published_at,withdrawn_at,published_revision";
export const modeForFormat = (format: WorkFormat): StudioWork["mode"] =>
  format === "Poesia"
    ? "poetry"
    : format === "HQ / Comic"
      ? "comic"
      : format === "Mangá"
        ? "manga"
        : "prose";

export function metadataPayload(
  input: DraftMetadata,
  styleEnabled = coverStylePersistenceEnabled,
  v2Enabled = coverStudioV2Enabled,
) {
  if (input.coverStyle !== undefined && !isCoverStyle(input.coverStyle))
    throw new WorksError("Estilo de capa inválido.");
  if (!styleEnabled && input.coverStyle !== undefined)
    throw new WorksError(
      "A persistência do estilo ainda não está ativada neste ambiente.",
    );
  if (input.coverSeed !== undefined && !isCoverSeed(input.coverSeed))
    throw new WorksError("Variação de capa inválida.");
  if (
    (!styleEnabled || !v2Enabled) &&
    (input.coverSeed !== undefined ||
      (input.coverStyle !== undefined &&
        !isOriginalCoverStyle(input.coverStyle)))
  )
    throw new WorksError(
      "Os novos estilos e variações estão disponíveis apenas para pré-visualização até à ativação do Estúdio de Capas 2.0.",
    );
  const title = input.title.trim();
  const language = input.language.trim();
  const lists = [input.tags, input.contentWarnings];
  if (
    !title ||
    title.length > 200 ||
    !language ||
    language.length > 60 ||
    input.synopsis.length > 10000 ||
    (input.subtitle?.length ?? 0) > 200 ||
    input.genre.length > 100 ||
    !["Romance", "Conto", "Poesia", "HQ / Comic", "Mangá"].includes(
      input.format,
    ) ||
    !["Livre", "+12", "+14", "+16", "+18"].includes(input.ageRating) ||
    !/^#[0-9a-f]{6}$/i.test(input.coverAccentColor) ||
    lists.some(
      (items) =>
        items.length > 20 ||
        items.some((item) => typeof item !== "string") ||
        items.join(",").length > 1000,
    )
  ) {
    throw new WorksError(
      "Revê os metadados: título até 200 caracteres, sinopse até 10 000 e até 20 tags/avisos.",
    );
  }
  // Explicit allowlist: owner, status, visibility, chapters and editorial attribution are never sent.
  return {
    title,
    subtitle: input.subtitle?.trim() ?? "",
    description: input.synopsis.trim(),
    type: input.format,
    language,
    genre: input.genre.trim(),
    tags: input.tags.map((s) => s.trim()).filter(Boolean),
    age_rating: input.ageRating,
    content_warnings: input.contentWarnings
      .map((s) => s.trim())
      .filter(Boolean),
    cover_accent_color: input.coverAccentColor,
    ...(styleEnabled && input.coverStyle !== undefined
      ? { cover_style: input.coverStyle }
      : {}),
    ...(styleEnabled && v2Enabled && input.coverSeed !== undefined
      ? { cover_seed: input.coverSeed }
      : {}),
  };
}
function mapRow(
  row: Record<string, any>,
  ownerId: string,
  styleEnabled = false,
  v2Enabled = false,
): StudioWork {
  if (
    row.owner_id !== ownerId ||
    !(
      (row.status === "draft" && row.visibility === "private") ||
      (row.status === "published" && row.visibility === "public")
    )
  )
    throw new WorksError("A resposta não corresponde às tuas obras.");
  return {
    id: row.id,
    ownerId: row.owner_id,
    archivedAt: row.archived_at ?? null,
    publicId: row.public_id,
    visibility: row.visibility,
    firstPublishedAt: row.first_published_at ?? null,
    lastPublishedAt: row.last_published_at ?? null,
    withdrawnAt: row.withdrawn_at ?? null,
    publishedRevision: row.published_revision ?? null,
    slug: row.slug,
    persistence: "supabase",
    revision: row.revision,
    title: row.title,
    subtitle: row.subtitle,
    synopsis: row.description,
    format: row.type,
    mode: modeForFormat(row.type),
    language: row.language,
    genre: row.genre,
    tags: row.tags,
    ageRating: row.age_rating,
    contentWarnings: row.content_warnings,
    coverAccentColor: row.cover_accent_color,
    coverStyle:
      styleEnabled && (v2Enabled || isOriginalCoverStyle(row.cover_style))
        ? readCoverStyle(row.cover_style)
        : "legacy",
    coverSeed: styleEnabled && v2Enabled ? readCoverSeed(row.cover_seed) : 0,
    ...(styleEnabled &&
    !v2Enabled &&
    isCoverStyle(row.cover_style) &&
    (!isOriginalCoverStyle(row.cover_style) ||
      readCoverSeed(row.cover_seed) !== 0)
      ? { coverAppearanceLocked: true }
      : {}),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.entries ?? []).map((entry: Record<string, any>) => ({
      id: entry.id,
      number: entry.position,
      title: entry.title,
      content: entry.content,
      entryType: entry.entry_type,
      revision: entry.revision,
      alignment: entry.alignment,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      ...(entry.entry_type === "poem"
        ? {
            stanzas: entry.content
              .split(/\n\s*\n/)
              .map((stanza: string) => stanza.split("\n"))
              .filter((stanza: string[]) =>
                stanza.some((verse) => verse.trim()),
              ),
          }
        : {}),
    })),
  };
}
function failure(error: { code?: string } | null): never {
  if (error?.code === "40001")
    throw new WorksError(
      "A obra ou a entrada mudou noutro dispositivo. Copia as tuas alterações e recupera a última versão antes de tentar novamente.",
    );
  if (error?.code === "55000")
    throw new WorksError(
      "Desarquiva a obra antes de editar ou publicar. Retira a publicação antes de arquivar.",
    );
  if (["23514", "23502", "22023", "22P02"].includes(error?.code ?? ""))
    throw new WorksError(
      "Revê título, sinopse, idioma, classificação e entradas com texto válido. A operação não foi aplicada.",
    );
  if (error?.code === "42501")
    throw new WorksError(
      "Sem permissão para esta operação. Confirma a sessão e tenta novamente.",
    );
  if (["42P01", "PGRST205", "PGRST204", "PGRST202"].includes(error?.code ?? ""))
    throw new WorksError(
      "O serviço de obras ainda não está preparado. A migração precisa de instalação e validação.",
    );
  if (error?.code === "23505")
    throw new WorksError(
      "Já existe uma obra com este identificador. Atualiza a lista antes de tentar novamente.",
    );
  throw new WorksError(
    "Não foi possível comunicar com o serviço de obras. Os dados do formulário foram preservados; verifica a ligação.",
  );
}
export function createWorksRepository(
  client: SupabaseClient | null,
  ownerId: string,
  options: CoverStyleOptions = {},
): WorksRepository {
  const styleEnabled =
    options.coverStyleEnabled ?? coverStylePersistenceEnabled;
  const v2Enabled =
    styleEnabled && (options.coverStudioV2Enabled ?? coverStudioV2Enabled);
  const selectedColumns =
    columns +
    (styleEnabled ? ",cover_style" : "") +
    (v2Enabled ? ",cover_seed" : "");
  async function authenticated() {
    if (!client)
      throw new WorksError("O serviço de obras não está configurado.");
    let result;
    let token: string;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) failure(null);
      if (!data.session?.access_token)
        throw new WorksError(
          "Inicia sessão novamente antes de aceder às obras.",
        );
      token = data.session.access_token;
      result = await client.auth.getUser(token);
    } catch (error) {
      if (error instanceof WorksError) throw error;
      failure(null);
    }
    if (result.error?.name === "AuthRetryableFetchError") failure(null);
    if (result.error || !result.data.user || result.data.user.id !== ownerId)
      throw new WorksError("Inicia sessão novamente antes de aceder às obras.");
    // Pin this request to the validated token. A shared SDK session may change
    // accounts between the Auth check and the PostgREST fetch.
    return { db: client, token };
  }
  function owned(work: StudioWork) {
    if (work.persistence !== "supabase" || work.ownerId !== ownerId)
      throw new WorksError(
        "Esta operação aceita apenas os teus rascunhos remotos.",
      );
  }
  async function request<T>(
    operation: () => PromiseLike<{ data: T; error: { code?: string } | null }>,
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      if (error) failure(error);
      return data;
    } catch (error) {
      if (error instanceof WorksError) throw error;
      failure(null);
    }
  }
  const pendingOperations = new Map<string, string>();
  async function read(id: string, db: SupabaseClient, token: string) {
    const row = await request(() =>
      db
        .rpc("read_private_work", { p_work_id: id })
        .setHeader("Authorization", `Bearer ${token}`),
    );
    return row ? mapRow(row, ownerId, styleEnabled, v2Enabled) : null;
  }
  async function editorial(
    work: StudioWork,
    action: EditorialAction,
    payload: Record<string, unknown> = {},
  ): Promise<EditorialResult> {
    owned(work);
    const { db, token } = await authenticated();
    const key = JSON.stringify([work.id, work.revision, action, payload]);
    const operationId =
      pendingOperations.get(key) ?? globalThis.crypto.randomUUID();
    pendingOperations.set(key, operationId);
    const publication = action === "publish" || action === "withdraw";
    const response = await request(() =>
      db
        .rpc(publication ? "publish_private_work" : "mutate_private_work", {
          p_work_id: work.id,
          p_revision: work.revision,
          p_action: action,
          p_operation_id: operationId,
          ...(!publication ? { p_payload: payload } : {}),
        })
        .setHeader("Authorization", `Bearer ${token}`),
    );
    if (!response) failure(null);
    if (response.work) {
      pendingOperations.delete(key);
      return { work: mapRow(response.work, ownerId, styleEnabled, v2Enabled) };
    }
    if (response.deleted_id) {
      pendingOperations.delete(key);
      return { deletedId: response.deleted_id };
    }
    throw new WorksError(
      "A operação já foi aplicada mas a obra deixou de estar disponível. Atualiza a lista.",
    );
  }
  return {
    editorial,
    async list() {
      const { db, token } = await authenticated();
      const works: StudioWork[] = [];
      for (let start = 0; ; ) {
        const rows = await request(() =>
          db
            .from("works")
            .select<string, Record<string, any>>(selectedColumns)
            .eq("owner_id", ownerId)
            .order("created_at")
            .order("id")
            .range(start, start + 99)
            .setHeader("Authorization", `Bearer ${token}`),
        );
        if (!rows?.length) return works;
        for (const row of rows) {
          const work = await read(row.id, db, token);
          if (work) works.push(work);
        }
        start += rows.length;
      }
    },
    async find(id) {
      const { db, token } = await authenticated();
      return read(id, db, token);
    },
    async create(input) {
      const payload = metadataPayload(input, styleEnabled, v2Enabled);
      const { db, token } = await authenticated();
      const base =
        payload.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 180)
          .replace(/-$/, "") || "obra";
      const slug = `${base}-${globalThis.crypto.randomUUID()}`;
      const row = await request(() =>
        db
          .from("works")
          .insert({ ...payload, slug })
          .select<string, Record<string, any>>(selectedColumns)
          .single()
          .setHeader("Authorization", `Bearer ${token}`),
      );
      if (!row) failure(null);
      return mapRow(row, ownerId, styleEnabled, v2Enabled);
    },
    async update(work, input) {
      if (
        work.coverAppearanceLocked &&
        (input.coverStyle !== undefined || input.coverSeed !== undefined)
      )
        throw new WorksError(
          "A capa guardada usa uma versão mais recente. Mantém a capa atual até ativar o Estúdio de Capas 2.0.",
        );
      owned(work);
      const payload = metadataPayload(input, styleEnabled, v2Enabled);
      const { db, token } = await authenticated();
      const row = await request(() =>
        db
          .from("works")
          .update(payload)
          .eq("owner_id", ownerId)
          .eq("id", work.id)
          .eq("revision", work.revision!)
          .select<string, Record<string, any>>(selectedColumns)
          .maybeSingle()
          .setHeader("Authorization", `Bearer ${token}`),
      );
      if (!row)
        throw new WorksError(
          "A obra foi alterada noutro dispositivo, eliminada ou deixou de estar acessível. Atualiza a lista; mantém uma cópia das tuas alterações.",
        );
      return mapRow(
        {
          ...row,
          entries: work.chapters.map((entry) => ({
            id: entry.id,
            position: entry.number,
            title: entry.title,
            content: entry.content ?? "",
            entry_type: entry.entryType,
            revision: entry.revision,
            alignment: entry.alignment,
            created_at: entry.createdAt,
            updated_at: entry.updatedAt,
          })),
        },
        ownerId,
        styleEnabled,
        v2Enabled,
      );
    },
    async remove(work) {
      const result = await editorial(work, "delete_work");
      if (result.deletedId !== work.id)
        throw new WorksError("Não foi possível confirmar a eliminação.");
    },
  };
}
