import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { formats } from "../data/works";
import { worksRepository, filterWorks } from "../lib/worksRepository";
import { WorkCard } from "../components/WorkCard";
import {
  Button,
  EmptyState,
  Pagination,
  SearchField,
  Select,
} from "../components/ui";
export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const format = params.get("formato") ?? "";
  const genre = params.get("genero") ?? "";
  const sort = params.get("ordem") ?? "recentes";
  const results = filterWorks(worksRepository.list(), {
    query,
    format,
    genre,
    sort,
  });
  const pages = Math.max(1, Math.ceil(results.length / 4));
  const raw = Number(params.get("pagina") ?? 1);
  const page = Number.isInteger(raw) ? Math.min(pages, Math.max(1, raw)) : 1;
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    setParams(next, { replace: key === "q" });
  }
  const active = Boolean(query || format || genre);
  return (
    <div className="container catalog-page">
      <div className="page-intro">
        <span className="eyebrow">DESCOBRIR É SÓ O COMEÇO</span>
        <h1>Um mundo de histórias.</h1>
        <p>Encontra uma voz, um traço, um universo que te acompanha.</p>
      </div>
      <div className="catalog-toolbar">
        <div className="toolbar-title">
          <SlidersHorizontal size={17} /> Explora à tua maneira
        </div>
        <div className="catalog-filters">
          <SearchField value={query} onChange={(value) => update("q", value)} />
          <Select
            label="Formato"
            value={format}
            onChange={(e) => update("formato", e.target.value)}
          >
            <option value="">Todos os formatos</option>
            {formats.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
          <Select
            label="Género"
            value={genre}
            onChange={(e) => update("genero", e.target.value)}
          >
            <option value="">Todos os géneros</option>
            {Array.from(new Set(worksRepository.list().map((w) => w.genre)))
              .sort()
              .map((g) => (
                <option key={g}>{g}</option>
              ))}
          </Select>
          <Select
            label="Ordenação"
            value={sort}
            onChange={(e) => update("ordem", e.target.value)}
          >
            <option value="recentes">Mais recentes (demo)</option>
            <option value="titulo">Título: A–Z</option>
            <option value="autor">Autor: A–Z</option>
          </Select>
        </div>
      </div>
      <div className="results-heading">
        <p role="status">
          {results.length}{" "}
          {results.length === 1 ? "obra demonstrativa" : "obras demonstrativas"}{" "}
          · autores fictícios
        </p>
        {active && (
          <Button variant="ghost" onClick={() => setParams({})}>
            <X size={15} /> Limpar filtros
          </Button>
        )}
      </div>
      {results.length ? (
        <>
          <div className="work-grid">
            {results.slice((page - 1) * 4, page * 4).map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              onChange={(p) => update("pagina", String(p))}
            />
          )}
        </>
      ) : (
        <EmptyState title="Nenhuma história encontrada">
          Experimenta outro título ou remove os filtros para continuar a
          explorar.
        </EmptyState>
      )}
      <div className="notice">
        Este catálogo utiliza apenas dados locais de demonstração. Ainda não
        existem publicações reais nesta versão.
      </div>
    </div>
  );
}
