export type ResourceName =
  | "activity"
  | "collections"
  | "notifications"
  | "followers"
  | "reports"
  | "logs"
  | "services"
  | "monitoring";
export interface Person {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}
export interface Activity {
  id: string;
  type: "obra" | "colecao";
  author: Person;
  title: string;
  workId: string;
  date: string;
}
export interface Collection {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  workIds: string[];
}
export interface Notification {
  id: string;
  type: "leitura" | "colecao" | "conta";
  title: string;
  description: string;
  date: string;
  to: string;
  read: boolean;
}
export interface Report {
  id: string;
  category: "Conteúdo" | "Conduta" | "Direitos";
  status: "Por analisar" | "Em análise" | "Resolvida";
  summary: string;
  date: string;
  history: string[];
}
export interface LogEntry {
  id: string;
  level: "Informação" | "Aviso" | "Erro";
  service: string;
  message: string;
  date: string;
  context: string;
}
export interface ServiceInfo {
  id: string;
  title: string;
  status: string;
  description: string;
}
export interface Metric {
  id: string;
  label: string;
  value: string;
  note: string;
}
export interface ResourceMap {
  activity: Activity[];
  collections: Collection[];
  notifications: Notification[];
  followers: Person[];
  reports: Report[];
  logs: LogEntry[];
  services: ServiceInfo[];
  monitoring: Metric[];
}
export type ReadResult<T> =
  | { status: "ready"; data: T; source: "remote" | "demo" | "editorial" }
  | { status: "unavailable" | "unauthorized"; message: string };
export interface ReadRequest {
  demo: boolean;
  viewerId: string | null;
  subject?: string;
}
/** Future adapters must enforce identity/roles on the server. This port provides no mutations. */
export interface CompletionService {
  read<K extends ResourceName>(
    name: K,
    request: ReadRequest,
  ): Promise<ReadResult<ResourceMap[K]>>;
}
const restricted = new Set<ResourceName>([
  "reports",
  "logs",
  "services",
  "monitoring",
]);
export const completionService: CompletionService = {
  async read(name) {
    const available: Partial<ResourceMap> = {
      collections: [],
    };
    const data = available[name];
    if (data) return { status: "ready", source: "editorial", data };
    return {
      status: restricted.has(name) ? "unauthorized" : "unavailable",
      message: restricted.has(name)
        ? "Acesso não autorizado. O serviço exige autorização validada no servidor; não há dados operacionais disponíveis."
        : "O serviço remoto ainda não está integrado. Nenhuma interação social ou relação de seguidores foi inventada.",
    };
  },
};
export function filterText(value: string, query: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes(
      query
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    );
}
export const reportReasons = [
  "Conteúdo inadequado",
  "Assédio ou conduta",
  "Direitos de autor",
  "Spam",
  "Outro",
] as const;
export function validateReport(
  reason: string,
  description: string,
  reference: string,
) {
  const errors: Partial<
    Record<"reason" | "description" | "reference", string>
  > = {};
  if (!reportReasons.includes(reason as (typeof reportReasons)[number]))
    errors.reason = "Seleciona um motivo.";
  if (description.trim().length < 20 || description.length > 2000)
    errors.description = "Descreve a situação entre 20 e 2000 caracteres.";
  if (
    reference &&
    (!/^\/(obras|utilizadores)\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(
      reference,
    ) ||
      reference.length > 240)
  )
    errors.reference =
      "Indica um caminho interno de obra ou perfil, sem domínio ou parâmetros.";
  return errors;
}
