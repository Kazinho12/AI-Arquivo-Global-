import { limitText } from "./discovery";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePublicCatalog } from "./PublicCatalog";
import {
  discoveryQuery,
  emptyFacets,
  discoveryFormats,
  discoveryAges,
  type DiscoveryPage,
} from "./discovery";
import { WorkGrid } from "../../components/Discovery";
import { SearchField, Select, Button, Pagination } from "../../components/ui";
import { slugify } from "../../lib/discovery";
export function DiscoveryCollection({ fixedTag }: { fixedTag?: string }) {
  const navigate = useNavigate();
  const [responseKey, setResponseKey] = useState("");
  const [facetError, setFacetError] = useState("");
  const [params, setParams] = useSearchParams();
  const catalog = usePublicCatalog();
  const query = discoveryQuery(params, fixedTag);
  const key = JSON.stringify(query);
  const [input, setInput] = useState(query.query);
  const [page, setPage] = useState<DiscoveryPage | null>(null),
    [facets, setFacets] = useState(emptyFacets),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => setInput(query.query), [query.query]);
  useEffect(() => {
    if (input.trim() === query.query) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      input.trim()
        ? next.set("q", limitText(input.trim(), 200))
        : next.delete("q");
      next.delete("pagina");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, query.query, params, setParams]);
  useEffect(() => {
    let current = true;
    setPage(null);
    setLoading(true);
    setError("");
    if (!catalog.repository?.search) {
      setLoading(false);
      return;
    }
    catalog.repository.search(query).then(
      (result) => {
        if (current) {
          setResponseKey(key);
          setPage(result);
          setLoading(false);
        }
      },
      (err) => {
        if (current) {
          setError(
            err instanceof Error ? err.message : "Não foi possível pesquisar.",
          );
          setLoading(false);
        }
      },
    );
    return () => {
      current = false;
    };
  }, [catalog.repository, key, catalog.version, retry]);
  useEffect(() => {
    let current = true;
    catalog.repository?.facets?.().then(
      (value) => {
        if (current) {
          setFacets(value);
          setFacetError("");
        }
      },
      () => {
        if (current)
          setFacetError("Não foi possível carregar as opções dos filtros.");
      },
    );
    return () => {
      current = false;
    };
  }, [catalog.repository, catalog.version, retry]);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete("pagina");
    setParams(next);
  }
  const tags = [
    ...facets.tags,
    ...query.tags
      .filter((t) => !facets.tags.some((f) => f.key === t))
      .map((t) => ({ key: t, name: t, count: 0 })),
  ];
  const pending =
    loading ||
    input.trim() !== query.query ||
    (page !== null && responseKey !== key);
  const pages = Math.max(1, Math.ceil((page?.total ?? 0) / query.size));
  const select = (
    label: string,
    key: string,
    value: string,
    options: string[],
  ) => (
    <Select
      label={label}
      value={value}
      onChange={(e) => update(key, e.target.value)}
    >
      <option value="">Todos</option>
      {[...new Set([...options, ...(value ? [value] : [])])].map((o) => (
        <option key={o}>{o}</option>
      ))}
    </Select>
  );
  return (
    <div className="collection">
      <div className="catalog-toolbar">
        <SearchField
          label="Pesquisar publicações"
          value={input}
          onChange={(value) => setInput(limitText(value, 200))}
          placeholder="Título, subtítulo, autor, sinopse ou tags…"
        />
        <div className="catalog-filters">
          {select("Formato", "formato", query.format, discoveryFormats)}
          {select("Género", "genero", query.genre, facets.genres)}
          {select("Idioma", "idioma", query.language, facets.languages)}
          {select("Classificação etária", "idade", query.age, discoveryAges)}
          <Select
            label="Pesquisar em"
            value={query.scope}
            onChange={(e) => update("campo", e.target.value)}
          >
            {[
              ["todos", "Todos os campos"],
              ["titulo", "Título"],
              ["subtitulo", "Subtítulo"],
              ["autor", "Autor e utilizador"],
              ["sinopse", "Sinopse"],
              ["tags", "Tags"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            label="Ordenação"
            value={query.sort}
            onChange={(e) => update("ordem", e.target.value)}
          >
            {[
              ["recentes", "Publicações recentes"],
              ["atualizadas", "Atualizações recentes"],
              ["titulo", "Título: A–Z"],
              ["antigas", "Publicações antigas"],
              ["autor", "Autor: A–Z"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <details className="tag-filter">
          <summary>Tags e avisos de conteúdo</summary>
          <fieldset>
            <legend>Exigir todas as tags selecionadas</legend>
            {tags.map((tag) => (
              <label className="check" key={tag.key}>
                <input
                  type="checkbox"
                  checked={query.tags.includes(tag.key)}
                  disabled={Boolean(fixedTag) && slugify(fixedTag!) === tag.key}
                  onChange={(e) => {
                    const next = new URLSearchParams(params);
                    next.delete("tag");
                    const values = e.target.checked
                      ? [...query.tags, tag.key]
                      : query.tags.filter((t) => t !== tag.key);
                    values.forEach((t) => next.append("tag", t));
                    next.delete("pagina");
                    setParams(next);
                  }}
                />
                {tag.name}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Avisos de conteúdo presentes na obra</legend>
            {[...new Set([...facets.warnings, ...query.warnings])].map((w) => (
              <label className="check" key={w}>
                <input
                  type="checkbox"
                  checked={query.warnings.includes(w)}
                  onChange={(e) => {
                    const next = new URLSearchParams(params);
                    next.delete("aviso");
                    (e.target.checked
                      ? [...query.warnings, w]
                      : query.warnings.filter((t) => t !== w)
                    ).forEach((v) => next.append("aviso", v));
                    next.delete("pagina");
                    setParams(next);
                  }}
                />
                {w}
              </label>
            ))}
          </fieldset>
          <p>
            Opções públicas limitadas a 100 por grupo. Usa o diretório para
            pesquisar outras tags.
          </p>
        </details>
        <Button
          variant="ghost"
          onClick={() => {
            setInput("");
            fixedTag ? navigate("/catalogo") : setParams({});
          }}
        >
          Limpar filtros
        </Button>
      </div>
      {facetError && (
        <p role="alert">
          {facetError}
          <Button onClick={() => setRetry((v) => v + 1)}>
            Recarregar filtros
          </Button>
        </p>
      )}
      <section aria-label="Resultados de publicações" aria-busy={pending}>
        <h2>Publicações de autores</h2>
        {pending && <p role="status">A pesquisar publicações…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button onClick={() => setRetry((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        )}
        {!pending && !error && page && (
          <>
            <p role="status">
              {page.total}{" "}
              {page.total === 1
                ? "publicação encontrada"
                : "publicações encontradas"}{" "}
              · página {page.page} de {pages}
            </p>
            <WorkGrid works={page.items} />
            {pages > 1 && (
              <Pagination
                page={page.page}
                pages={pages}
                onChange={(n) => {
                  const next = new URLSearchParams(params);
                  next.set("pagina", String(n));
                  setParams(next);
                }}
              />
            )}
          </>
        )}
        {!catalog.repository && (
          <p>Pesquisa pública não configurada neste ambiente.</p>
        )}
      </section>
    </div>
  );
}
