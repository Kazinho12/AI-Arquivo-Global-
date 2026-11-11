import { DiscoveryCollection } from "../features/catalog/DiscoveryCollection";
import { usePublicCatalog } from "../features/catalog/PublicCatalog";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Button, EmptyState, Pagination, SearchField, Select } from "./ui";
import { WorkGrid } from "./Discovery";
import { formats, type Work } from "../data/works";
import { filterWorks } from "../lib/worksRepository";
import { getGenres, getTags, paginate, readFilters } from "../lib/discovery";
function LocalWorkCollection({
  works,
  advanced = false,
  fixedTag,
}: {
  works: readonly Work[];
  advanced?: boolean;
  fixedTag?: string;
}) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const tags = getTags(works);
  const genres = getGenres(works);
  const selectedTags = [
    ...new Set([...filters.tags, ...(fixedTag ? [fixedTag] : [])]),
  ];
  const filtered = filterWorks(works, { ...filters, tags: selectedTags });
  const result = paginate(filtered, Number(params.get("pagina") ?? 1));
  function update(key: string, value: string | string[]) {
    const next = new URLSearchParams(params);
    next.delete(key);
    for (const item of Array.isArray(value) ? value : [value])
      if (item) next.append(key, item);
    if (key !== "pagina") next.delete("pagina");
    setParams(next, { replace: key === "q" });
  }
  const active = Boolean(
    filters.query ||
      filters.format ||
      filters.genre ||
      filters.tags.length ||
      filters.scope !== "todos" ||
      filters.sort !== "recentes",
  );
  const unknownTags = filters.tags.filter(
    (slug) => !tags.some((t) => t.slug === slug),
  );
  return (
    <div className={`collection ${advanced ? "advanced-collection" : ""}`}>
      <div className="catalog-toolbar">
        <div className="toolbar-title">
          <SlidersHorizontal size={17} />
          {advanced
            ? "Combina pistas para encontrar a tua próxima leitura"
            : "Afina a tua descoberta"}
        </div>
        <div className="catalog-filters">
          <SearchField
            value={filters.query}
            onChange={(value) => update("q", value)}
            label={
              advanced ? "Termos de pesquisa avançada" : "Pesquisar no catálogo"
            }
            placeholder="Título, autor, sinopse…"
          />
          {advanced && (
            <Select
              label="Pesquisar em"
              value={filters.scope}
              onChange={(e) => update("campo", e.target.value)}
            >
              <option value="todos">Todos os campos</option>
              <option value="titulo">Apenas título</option>
              <option value="autor">Apenas autor</option>
              <option value="sinopse">Apenas sinopse</option>
            </Select>
          )}
          <Select
            label="Formato"
            value={filters.format}
            onChange={(e) => update("formato", e.target.value)}
          >
            <option value="">Todos os formatos</option>
            {filters.format && !formats.some((f) => f === filters.format) && (
              <option value={filters.format}>
                Desconhecido: {filters.format}
              </option>
            )}
            {formats.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
          <Select
            label="Género"
            value={filters.genre}
            onChange={(e) => update("genero", e.target.value)}
          >
            <option value="">Todos os géneros</option>
            {filters.genre && !genres.some((g) => g.name === filters.genre) && (
              <option value={filters.genre}>
                Desconhecido: {filters.genre}
              </option>
            )}
            {genres.map((g) => (
              <option key={g.slug}>{g.name}</option>
            ))}
          </Select>
          <Select
            label="Ordenação"
            value={filters.sort}
            onChange={(e) => update("ordem", e.target.value)}
          >
            <option value="recentes">Preparação mais recente</option>
            <option value="antigas">Preparação mais antiga</option>
            <option value="titulo">Título: A–Z</option>
            <option value="autor">Autor: A–Z</option>
          </Select>
        </div>
        <details className="tag-filter" open={advanced ? true : undefined}>
          <summary>
            Filtrar por tags{" "}
            <span>
              {selectedTags.length
                ? `${selectedTags.length} selecionadas`
                : "Todas as tags"}
            </span>
          </summary>
          <fieldset>
            <legend className="sr-only">
              Tags obrigatórias — todas as selecionadas devem existir na obra
            </legend>
            <p className="filter-help">
              A obra deve incluir todas as tags selecionadas. As contagens
              referem-se ao catálogo apresentado.
            </p>
            <div className="tag-options">
              {tags.map((tag) => (
                <label key={tag.slug} className="check">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.slug)}
                    disabled={fixedTag === tag.slug}
                    onChange={(e) =>
                      update(
                        "tag",
                        e.target.checked
                          ? [...filters.tags, tag.slug]
                          : filters.tags.filter((t) => t !== tag.slug),
                      )
                    }
                  />
                  <span>
                    {tag.name}{" "}
                    <small>
                      ({tag.count})
                      {fixedTag === tag.slug ? " · tag desta página" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {unknownTags.length > 0 && (
              <div className="unknown-filters">
                <p>Tags desconhecidas no URL:</p>
                {unknownTags.map((slug) => (
                  <Button
                    key={slug}
                    variant="secondary"
                    onClick={() =>
                      update(
                        "tag",
                        filters.tags.filter((t) => t !== slug),
                      )
                    }
                  >
                    {slug} <X size={13} />
                    <span className="sr-only">Remover filtro</span>
                  </Button>
                ))}
              </div>
            )}
          </fieldset>
        </details>
        <p className="filter-help">
          Os resultados atualizam automaticamente. O endereço preserva os
          filtros para partilhar esta pesquisa.
        </p>
      </div>
      <div className="results-heading">
        <p role="status" aria-live="polite">
          {result.total === 0
            ? "Nenhuma obra encontrada"
            : `${result.start}–${result.end} de ${result.total} ${result.total === 1 ? "obra" : "obras"}`}
        </p>
        {active && (
          <Button variant="ghost" onClick={() => setParams({})}>
            <X size={15} />
            Limpar filtros
          </Button>
        )}
      </div>
      {result.total ? (
        <>
          <WorkGrid works={result.items} />
          {result.pages > 1 && (
            <Pagination
              page={result.page}
              pages={result.pages}
              onChange={(page) => update("pagina", String(page))}
            />
          )}
        </>
      ) : (
        <EmptyState title="Nenhuma história encontrada">
          Experimenta remover uma tag, escolher outro formato ou usar menos
          palavras.
          <div className="empty-action">
            <Button variant="secondary" onClick={() => setParams({})}>
              Repor pesquisa
            </Button>
          </div>
        </EmptyState>
      )}
    </div>
  );
}

export function WorkCollection(props: {
  works: readonly Work[];
  advanced?: boolean;
  fixedTag?: string;
}) {
  const catalog = usePublicCatalog();
  return catalog.repository?.search ? (
    <DiscoveryCollection fixedTag={props.fixedTag} />
  ) : (
    <LocalWorkCollection {...props} />
  );
}
