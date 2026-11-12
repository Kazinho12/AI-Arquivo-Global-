import { limitText } from "./discovery";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { usePublicCatalog } from "./PublicCatalog";
import { discoveryQuery, emptyFacets } from "./discovery";
import { getTags, normalizeText, slugify } from "../../lib/discovery";
import { SearchField, Button } from "../../components/ui";
import { PageIntro, WorkSection } from "../../components/Discovery";
import { DiscoveryCollection } from "./DiscoveryCollection";
import type { Work } from "../../data/works";
export function RemoteTags() {
  const [params, setParams] = useSearchParams();
  const q = limitText(params.get("q") ?? "", 100);
  const [input, setInput] = useState(q);
  const [data, setData] = useState(emptyFacets);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const catalog = usePublicCatalog();
  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    if (input === q) return;
    const timer = setTimeout(
      () =>
        setParams(input ? { q: limitText(input, 100) } : {}, { replace: true }),
      300,
    );
    return () => clearTimeout(timer);
  }, [input, q, setParams]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    catalog.repository?.facets?.(q).then(
      (value) => {
        if (active) {
          setData(value);
          setLoading(false);
        }
      },
      () => {
        if (active) {
          setData(emptyFacets);
          setError("Não foi possível carregar as tags públicas.");
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [catalog.repository, q, catalog.version, retry]);
  return (
    <div className="container discovery-page">
      <PageIntro
        eyebrow="TAGS PÚBLICAS"
        title="Todas as histórias têm pistas."
        description="Pesquisa tags de publicações autorizadas. As grafias dos autores são preservadas."
      />
      <SearchField
        label="Pesquisar tags"
        value={input}
        onChange={(value) => setInput(limitText(value, 100))}
      />
      {loading && <p role="status">A carregar tags…</p>}
      {error && (
        <p role="alert">
          {error}
          <Button onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </Button>
        </p>
      )}
      <h2>Tags de publicações</h2>
      {!loading && !error && !data.tags.length && (
        <p role="status">Nenhuma tag pública encontrada.</p>
      )}
      <div className="tag-options">
        {data.tags.map((tag) => (
          <Link key={tag.key} to={`/tags/${encodeURIComponent(tag.key)}`}>
            {tag.name} ({tag.count})
          </Link>
        ))}
      </div>
      <p>Até 100 tags por pesquisa. Refina o termo para encontrar outras.</p>
    </div>
  );
}
export function RemoteTagPage() {
  const { slug = "" } = useParams();
  const catalog = usePublicCatalog();
  const [name, setName] = useState(slug.replace(/-/g, " "));
  useEffect(() => {
    let current = true;
    setName(slug.replace(/-/g, " "));
    catalog.repository?.facets?.(slug).then(
      (facets) => {
        const match = facets.tags.find((tag) => tag.key === slugify(slug));
        if (current && match) setName(match.name);
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [slug, catalog.repository, catalog.version]);
  return (
    <div className="container discovery-page">
      <PageIntro
        eyebrow="EXPLORAR TAG"
        title={name}
        description="Resultados para esta tag, combináveis com os restantes filtros. Uma tag inexistente apresenta zero resultados."
      />
      <Link to="/tags">Voltar ao diretório de tags</Link>
      <DiscoveryCollection fixedTag={slug} />
    </div>
  );
}
export function DiscoveryShelves() {
  const catalog = usePublicCatalog();
  const [recent, setRecent] = useState<Work[]>([]),
    [updated, setUpdated] = useState<Work[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!catalog.repository?.search) return;
    const query = discoveryQuery(new URLSearchParams());
    Promise.all([
      catalog.repository.search({ ...query, size: 4 }),
      catalog.repository.search({ ...query, size: 4, sort: "atualizadas" }),
    ]).then(
      ([a, b]) => {
        if (active) {
          setRecent(a.items);
          setUpdated(b.items);
          setError("");
        }
      },
      () => {
        if (active) {
          setRecent([]);
          setUpdated([]);
          setError("Não foi possível carregar as publicações recentes.");
        }
      },
    );
    return () => {
      active = false;
    };
  }, [catalog.repository, catalog.version]);
  if (!catalog.repository?.search) return null;
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <WorkSection
        eyebrow="PUBLICAÇÕES REAIS"
        title="Publicadas recentemente"
        description="Ordenadas pela primeira publicação autorizada."
        works={recent}
        to="/catalogo?ordem=recentes"
      />
      <WorkSection
        eyebrow="PUBLICAÇÕES REAIS"
        title="Atualizadas recentemente"
        description="Ordenadas pela última edição pública confirmada, sem incluir edições privadas."
        works={updated}
        to="/catalogo?ordem=atualizadas"
      />
    </>
  );
}
