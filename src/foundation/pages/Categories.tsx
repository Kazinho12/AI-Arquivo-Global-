import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Frame, ArrowUpRight } from "lucide-react";
import { DemoNotice, PageIntro, WorkGrid } from "../components/Discovery";
import { Button, Pagination, Select } from "../components/ui";
import {
  catalogUrl,
  getCategoryWorks,
  getFormatCounts,
  getGenres,
  paginate,
} from "../lib/discovery";
import { worksRepository } from "../lib/worksRepository";
export default function Categories() {
  const works = worksRepository.list();
  const [params, setParams] = useSearchParams();
  const family = params.get("familia") ?? "";
  const genre = params.get("genero") ?? "";
  const genres = getGenres(works);
  const categories = getFormatCounts(works);
  const matches = getCategoryWorks(works, genre, family);
  const result = paginate(matches, Number(params.get("pagina") ?? 1));
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    setParams(next);
  }
  return (
    <div className="container discovery-page">
      <PageIntro
        eyebrow="O MAPA DO ARQUIVO"
        title="Muitas formas. Infinitos mundos."
        description="Categorias organizam a forma de contar. Géneros ajudam a encontrar a atmosfera. Combina os dois para descobrir algo teu."
      />
      <DemoNotice />
      <section className="category-families">
        <div className="category-family">
          <BookOpen size={30} strokeWidth={1} />
          <h2>Literatura</h2>
          <p>Da brevidade de um poema à continuidade de uma série.</p>
          <div className="category-format-links">
            {categories
              .filter((c) => c.family === "literaria")
              .map((c) => (
                <Link key={c.name} to={catalogUrl({ formato: c.name })}>
                  <span>{c.name}</span>
                  <span>
                    {c.count}
                    <span className="sr-only"> obras locais</span>
                  </span>
                </Link>
              ))}
          </div>
          <button
            className="text-link"
            onClick={() => update("familia", "literaria")}
          >
            Ver obras literárias →
          </button>
        </div>
        <div className="category-family">
          <Frame size={30} strokeWidth={1} />
          <h2>Narrativas visuais</h2>
          <p>O encontro entre a imagem, o ritmo e a imaginação.</p>
          <div className="category-format-links">
            {categories
              .filter((c) => c.family === "visual")
              .map((c) => (
                <Link key={c.name} to={catalogUrl({ formato: c.name })}>
                  <span>{c.name}</span>
                  <span>
                    {c.count}
                    <span className="sr-only"> obras locais</span>
                  </span>
                </Link>
              ))}
          </div>
          <button
            className="text-link"
            onClick={() => update("familia", "visual")}
          >
            Ver obras visuais →
          </button>
        </div>
      </section>
      <section className="section discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AMBIENTES PARA HABITAR</span>
            <h2>Encontra o teu género.</h2>
          </div>
        </div>
        <div className="genre-card-grid">
          {genres.map((g) => (
            <Link
              key={g.slug}
              to={catalogUrl(
                { genero: g.name, familia: family },
                "/categorias",
              )}
              className={`genre-card ${genre === g.name ? "is-selected" : ""}`}
              aria-current={genre === g.name ? "true" : undefined}
            >
              <span className="eyebrow">
                {g.count} {g.count === 1 ? "OBRA DEMO" : "OBRAS DEMO"}
              </span>
              <h3>{g.name}</h3>
              <p>{g.description}</p>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="section discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CRUZA OS CAMINHOS</span>
            <h2>Obras relacionadas com a tua escolha.</h2>
          </div>
        </div>
        <div className="category-controls">
          <Select
            label="Categoria"
            value={family}
            onChange={(e) => update("familia", e.target.value)}
          >
            <option value="">Todas as categorias</option>
            <option value="literaria">Literatura</option>
            <option value="visual">Narrativas visuais</option>
            {family && !["literaria", "visual"].includes(family) && (
              <option value={family}>Desconhecida: {family}</option>
            )}
          </Select>
          <Select
            label="Género"
            value={genre}
            onChange={(e) => update("genero", e.target.value)}
          >
            <option value="">Todos os géneros</option>
            {genres.map((g) => (
              <option key={g.slug}>{g.name}</option>
            ))}
            {genre && !genres.some((g) => g.name === genre) && (
              <option value={genre}>Desconhecido: {genre}</option>
            )}
          </Select>
          {(genre || family) && (
            <Button variant="secondary" onClick={() => setParams({})}>
              Limpar seleção
            </Button>
          )}
        </div>
        <p className="directory-count" role="status">
          {result.total}{" "}
          {result.total === 1
            ? "obra localnstrativa encontrada"
            : "obras locaisnstrativas encontradas"}
          {result.total > 0 ? ` · ${result.start}–${result.end}` : ""}
        </p>
        <WorkGrid works={result.items} />
        {result.pages > 1 && (
          <Pagination
            page={result.page}
            pages={result.pages}
            onChange={(p) => update("pagina", String(p))}
          />
        )}
      </section>
    </div>
  );
}
