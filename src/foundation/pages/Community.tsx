import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, FolderOpen, Plus } from "lucide-react";
import {
  Button,
  Field,
  Modal,
  Pagination,
  SearchField,
  Select,
} from "../components/ui";
import { useAuth } from "../features/auth/AuthProvider";
import {
  inauguralWorks,
  institutionalContent,
  editorialIdentity,
} from "../data/inaugural";
import { filterText, type Collection } from "../features/completion/data";
import {
  CompletionPage,
  DateLabel,
  PersonAvatar,
  PortalNav,
  ResourceState,
  useResource,
} from "../features/completion/ui";
import { useLibrary } from "../features/library/store";
import { LocalDataTools } from "../features/local/LocalDataTools";
export function ActivityPage() {
  const announcement = institutionalContent.announcement;
  return (
    <CompletionPage
      eyebrow="ATUALIZAÇÕES EDITORIAIS"
      title="Histórias em movimento"
      description="Notícias da preparação do Arquivo Global, sem simular atividade entre leitores."
    >
      <PortalNav />
      <article className="completion-card editorial-announcement">
        <span className="badge">Preparação local · não publicado</span>
        <DateLabel value={announcement.preparedAt + "T12:00:00Z"} />
        <h2>{announcement.title}</h2>
        <p>{announcement.description}</p>
        <Link
          className="text-link"
          to={`/utilizadores/${editorialIdentity.username}`}
        >
          {editorialIdentity.displayName}
        </Link>
        <div className="completion-links">
          {inauguralWorks.map((work) => (
            <Link key={work.id} to={`/obras/${work.id}`}>
              {work.title} →
            </Link>
          ))}
        </div>
      </article>
      <div className="completion-footnote">
        A atividade da comunidade depende de um serviço remoto. Não há
        publicações, seguidores ou interações fictícias nesta lista.
      </div>
    </CompletionPage>
  );
}
export function CollectionsPage() {
  const { state } = useAuth();
  return <CollectionsContent key={state.user?.id ?? "guest"} />;
}
function CollectionsContent() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("editorial");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const { lists, store } = useLibrary();
  const { result, retry } = useResource("collections", false);
  const local: Collection[] = lists.map((list) => ({
    ...list,
    visibility: "private",
  }));
  const all =
    scope === "private" ? local : result.status === "ready" ? result.data : [];
  const items = all.filter((c) =>
    filterText(c.title + " " + c.description, query),
  );
  const display =
    scope === "private"
      ? { status: "ready" as const, source: "editorial" as const, data: items }
      : result;
  return (
    <CompletionPage
      eyebrow="PERCURSOS DE LEITURA"
      title="Coleções que abrem caminhos"
      description="Seleções editoriais preparadas localmente e as tuas listas privadas, sem publicação comunitária."
    >
      <PortalNav />
      <div className="completion-toolbar">
        <SearchField
          label="Pesquisar coleções"
          placeholder="Nome ou descrição…"
          value={query}
          onChange={setQuery}
        />
        <Select
          label="Visibilidade"
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setSelected(null);
          }}
        >
          <option value="editorial">Coleções editoriais</option>
          <option value="private">As minhas listas privadas locais</option>
        </Select>
        <Button
          onClick={() => {
            setTitle("");
            setError("");
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Criar lista privada
        </Button>
      </div>
      {scope === "private" && <LocalDataTools />}
      <ResourceState
        result={display}
        retry={retry}
        empty={!items.length}
        emptyTitle="Nenhuma coleção encontrada"
      >
        <div className="completion-grid">
          {items.map((c) => (
            <article className="completion-card" key={c.id}>
              <FolderOpen aria-hidden="true" size={26} />
              <span className="badge">
                {c.visibility === "private"
                  ? "Privada · neste navegador"
                  : "Editorial · preparação local"}
              </span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <p>{c.workIds.length} obras selecionadas</p>
              <Button variant="secondary" onClick={() => setSelected(c)}>
                Ver coleção
              </Button>
              {c.visibility === "private" && (
                <Link className="text-link" to={`/biblioteca/listas/${c.id}`}>
                  Gerir na biblioteca →
                </Link>
              )}
            </article>
          ))}
        </div>
      </ResourceState>
      <Modal
        open={open}
        title="Criar lista privada local"
        onClose={() => setOpen(false)}
      >
        <p>
          Esta lista pertence ao espaço atual do navegador. Não será publicada
          nem sincronizada com um servidor.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim().length < 3 || title.trim().length > 80) {
              setError("Usa um nome entre 3 e 80 caracteres.");
              return;
            }
            store.createList(
              title.trim(),
              "Lista privada criada neste navegador.",
            );
            setScope("private");
            setOpen(false);
          }}
        >
          <Field
            label="Nome da lista"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "collection-error" : undefined}
          />
          {error && (
            <p id="collection-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar lista neste navegador</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!selected}
        title={selected?.title ?? "Coleção"}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <p>{selected.description}</p>
            <ul className="completion-list">
              {selected.workIds.map((id) => {
                const work = inauguralWorks.find((w) => w.id === id);
                return (
                  <li key={id}>
                    {work ? (
                      <Link
                        to={`/obras/${id}`}
                        onClick={() => setSelected(null)}
                      >
                        <BookOpen size={16} /> {work.title}
                      </Link>
                    ) : (
                      <span>
                        Referência anterior preservada: {id} · fora do catálogo
                        ativo
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {!selected.workIds.length && (
              <p>Ainda sem obras. Abre a biblioteca para gerir esta lista.</p>
            )}
          </>
        )}
      </Modal>
    </CompletionPage>
  );
}
export function FollowersPage() {
  const { username = "" } = useParams();
  return <FollowersContent key={username} username={username} />;
}
function FollowersContent({ username }: { username: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { result, retry } = useResource(
    "followers",
    false,
    username.trim().toLowerCase(),
  );
  const items =
    result.status === "ready"
      ? result.data.filter((p) =>
          filterText(p.displayName + " " + p.username, query),
        )
      : [];
  return (
    <CompletionPage
      eyebrow="COMUNIDADE"
      title={`Seguidores de @${username}`}
      description="Esta área só apresentará relações confirmadas por um serviço autorizado."
    >
      <Link
        className="text-link"
        to={`/utilizadores/${encodeURIComponent(username)}`}
      >
        ← Voltar ao perfil
      </Link>
      <div className="completion-toolbar">
        <SearchField
          label="Pesquisar seguidores"
          placeholder="Nome ou username…"
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
        />
      </div>
      <ResourceState
        result={result}
        retry={retry}
        empty={!items.length}
        emptyTitle="Nenhum seguidor encontrado"
      >
        <ul className="completion-people">
          {items.slice((page - 1) * 6, page * 6).map((person) => (
            <li key={person.id}>
              <PersonAvatar person={person} />
              <div>
                <Link to={`/utilizadores/${person.username}`}>
                  {person.displayName}
                </Link>
                <p>@{person.username}</p>
              </div>
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          pages={Math.max(1, Math.ceil(items.length / 6))}
          onChange={setPage}
        />
      </ResourceState>
    </CompletionPage>
  );
}
