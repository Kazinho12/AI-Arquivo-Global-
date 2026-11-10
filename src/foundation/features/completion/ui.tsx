import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { BookOpen, ShieldCheck, UsersRound } from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui";
import {
  completionService,
  type CompletionService,
  type Person,
  type ReadResult,
  type ResourceMap,
  type ResourceName,
} from "./data";
import { useAuth } from "../auth/AuthProvider";
export const CompletionContext =
  createContext<CompletionService>(completionService);
export function useResource<K extends ResourceName>(
  name: K,
  demo: boolean,
  subject?: string,
) {
  const service = useContext(CompletionContext);
  const { state: auth } = useAuth();
  const viewerId =
    auth.status === "authenticated" ? (auth.user?.id ?? null) : null;
  const key = JSON.stringify([name, demo, subject, viewerId]);
  type State =
    | ReadResult<ResourceMap[K]>
    | { status: "loading" }
    | { status: "error"; message: string };
  const [snapshot, setSnapshot] = useState<{ key: string; result: State }>({
    key,
    result: { status: "loading" },
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setSnapshot({ key, result: { status: "loading" } });
    Promise.resolve()
      .then(() => service.read(name, { demo, viewerId, subject }))
      .then((result) => {
        if (active) setSnapshot({ key, result });
      })
      .catch(() => {
        if (active)
          setSnapshot({
            key,
            result: {
              status: "error",
              message: "Não foi possível carregar os dados. Tenta novamente.",
            },
          });
      });
    return () => {
      active = false;
    };
  }, [service, key, retry, name, demo, viewerId, subject]);
  return {
    result:
      snapshot.key === key ? snapshot.result : ({ status: "loading" } as State),
    retry: () => setRetry((n) => n + 1),
  };
}
export function CompletionPage({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`completion-page ${compact ? "" : "container"}`}>
      <header className="completion-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}
export function ResourceState<T>({
  result,
  retry,
  empty = false,
  emptyTitle,
  children,
}: {
  result:
    | ReadResult<T>
    | { status: "loading" }
    | { status: "error"; message: string };
  retry: () => void;
  empty?: boolean;
  emptyTitle?: string;
  children: ReactNode;
}) {
  if (result.status === "loading") return <LoadingState />;
  if (result.status === "error")
    return (
      <>
        <ErrorState>{result.message}</ErrorState>
        <Button variant="secondary" onClick={retry}>
          Tentar novamente
        </Button>
      </>
    );
  if (result.status === "unauthorized")
    return (
      <div className="completion-access" role="status">
        <ShieldCheck aria-hidden="true" />
        <div>
          <h2>Acesso não autorizado</h2>
          <p>{result.message}</p>
          <Link className="text-link" to="/ajuda">
            Consultar ajuda
          </Link>
        </div>
      </div>
    );
  if (result.status === "unavailable")
    return (
      <EmptyState title="Serviço ainda indisponível">
        <p>{result.message}</p>
      </EmptyState>
    );
  if (empty)
    return (
      <EmptyState title={emptyTitle ?? "Nenhum resultado"}>
        <p>Ajusta a pesquisa ou os filtros para voltar a ver os itens.</p>
      </EmptyState>
    );
  return <>{children}</>;
}
export function PersonAvatar({ person }: { person: Person }) {
  return (
    <span className="completion-avatar" aria-hidden="true">
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" />
      ) : (
        person.displayName
          .split(/\s+/)
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}
export function PortalNav({ system = false }: { system?: boolean }) {
  return (
    <nav
      className="completion-links"
      aria-label={system ? "Áreas do sistema" : "Comunidade"}
    >
      {(system
        ? [
            ["/sistema", "Visão geral"],
            ["/sistema/logs", "Registos"],
            ["/sistema/servicos", "Serviços"],
            ["/sistema/monitorizacao", "Monitorização"],
            ["/sistema/informacoes", "Informações"],
            ["/sistema/testes", "Testes"],
          ]
        : [
            ["/atividade", "Atividade"],
            ["/colecoes", "Coleções"],
            ["/catalogo", "Catálogo"],
          ]
      ).map(([to, label]) => (
        <Link className="button secondary" to={to} key={to}>
          {system ? <BookOpen size={16} /> : <UsersRound size={16} />}
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function DateLabel({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Date(value).toLocaleDateString("pt-PT", {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </time>
  );
}
