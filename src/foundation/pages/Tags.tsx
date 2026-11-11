import { RemoteTags, RemoteTagPage } from "../features/catalog/RemoteTags";
import { usePublicCatalog } from "../features/catalog/PublicCatalog";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Hash, ArrowRight } from "lucide-react";
import {
  Breadcrumbs,
  DemoNotice,
  PageIntro,
  TagLinks,
} from "../components/Discovery";
import { Button, EmptyState, SearchField, Select } from "../components/ui";
import { WorkCollection } from "../components/WorkCollection";
import {
  getTags,
  normalizeText,
  slugify,
  type TagGroup,
} from "../lib/discovery";
const groups: TagGroup[] = ["Mundos", "Temas", "Criação"];
function LocalTags() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const group = params.get("grupo") ?? "";
  const tags = getTags(usePublicCatalog().works);
  const results = tags.filter(
    (tag) =>
      (!group || tag.group === group) &&
      normalizeText(`${tag.name} ${tag.description}`).includes(
        normalizeText(query),
      ),
  );
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === "q" });
  }
  return (
    <div className="container discovery-page">
      <PageIntro
        eyebrow="UM ÍNDICE PARA A IMAGINAÇÃO"
        title="Todas as histórias têm pistas."
        description="As tags ligam temas, lugares e ideias. Descobre palavras que aproximam obras diferentes."
      />
      <DemoNotice />
      <div className="directory-toolbar">
        <SearchField
          value={query}
          onChange={(value) => update("q", value)}
          label="Pesquisar tags"
          placeholder="Pesquisar nome ou descrição da tag…"
        />
        <Select
          label="Agrupar por tema"
          value={group}
          onChange={(e) => update("grupo", e.target.value)}
        >
          <option value="">Todos os grupos</option>
          {group && !groups.includes(group as TagGroup) && (
            <option value={group}>Grupo desconhecido: {group}</option>
          )}
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
        {(query || group) && (
          <Button variant="secondary" onClick={() => setParams({})}>
            Limpar
          </Button>
        )}
      </div>
      <p className="directory-count" role="status">
        {results.length} de {tags.length} tags editoriais · Contagens derivadas
        das oito obras
      </p>
      {results.length ? (
        groups.map((name) => {
          const entries = results.filter((t) => t.group === name);
          return entries.length ? (
            <section className="tag-directory-group" key={name}>
              <h2>{name}</h2>
              <div className="tag-directory-grid">
                {entries.map((tag) => (
                  <Link
                    className="tag-directory-card"
                    key={tag.slug}
                    to={`/tags/${tag.slug}`}
                  >
                    <div>
                      <Hash size={18} />
                      <span>
                        {tag.count} {tag.count === 1 ? "obra" : "obras"}
                      </span>
                    </div>
                    <h3>{tag.name}</h3>
                    <p>{tag.description}</p>
                    <span className="text-link">
                      Explorar tag <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })
      ) : (
        <EmptyState title="Nenhuma tag encontrada">
          Tenta outra palavra ou limpa os filtros para voltar ao diretório.
        </EmptyState>
      )}
    </div>
  );
}
function LocalTagPage() {
  const { slug } = useParams();
  const works = usePublicCatalog().works;
  const tag = getTags(works).find((t) => t.slug === slugify(slug ?? ""));
  if (!tag)
    return (
      <div className="container discovery-page">
        <Breadcrumbs
          items={[
            { label: "Início", to: "/" },
            { label: "Tags", to: "/tags" },
            { label: "Tag desconhecida" },
          ]}
        />
        <PageIntro
          eyebrow="PISTA NÃO ENCONTRADA"
          title="Esta tag ainda não faz parte do arquivo."
          description="Não encontramos uma tag com este endereço no catálogo. Explora as palavras disponíveis para seguir outro caminho."
        />
        <Link className="button secondary" to="/tags">
          Voltar ao diretório
        </Link>
        <section className="section">
          <h2>Outras pistas para explorar</h2>
          <TagLinks works={works} />
        </section>
      </div>
    );
  return (
    <div className="container discovery-page">
      <Breadcrumbs
        items={[
          { label: "Início", to: "/" },
          { label: "Tags", to: "/tags" },
          { label: tag.name },
        ]}
      />
      <div className="tag-page-heading">
        <Hash size={45} strokeWidth={1} />
        <PageIntro
          eyebrow={`TAG / ${tag.group.toLocaleUpperCase("pt")}`}
          title={tag.name}
          description={tag.description}
        />
      </div>
      <div className="catalog-context">
        <DemoNotice />
        <span className="count-label">
          {tag.count} {tag.count === 1 ? "obra associada" : "obras associadas"}{" "}
          no catálogo
        </span>
      </div>
      <WorkCollection works={works} fixedTag={tag.slug} />
      <aside className="section">
        <div className="section-heading">
          <h2>Continua a explorar.</h2>
          <Link className="text-link" to="/tags">
            Todas as tags →
          </Link>
        </div>
        <TagLinks
          works={works.filter((w) =>
            w.tags.some((t) => slugify(t) === tag.slug),
          )}
          names={[
            ...new Set(
              works
                .filter((w) => w.tags.some((t) => slugify(t) === tag.slug))
                .flatMap((w) => w.tags),
            ),
          ].filter((name) => slugify(name) !== tag.slug)}
        />
      </aside>
    </div>
  );
}

export default function Tags() {
  const catalog = usePublicCatalog();
  return catalog.repository?.facets ? <RemoteTags /> : <LocalTags />;
}
export function TagPage() {
  const catalog = usePublicCatalog();
  return catalog.repository?.search ? <RemoteTagPage /> : <LocalTagPage />;
}
