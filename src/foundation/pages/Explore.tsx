import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, Frame } from "lucide-react";
import {
  DemoNotice,
  PageIntro,
  TagLinks,
  WorkSection,
} from "../components/Discovery";
import { editorialSelections, selectEditorialWorks } from "../data/editorial";
import { worksRepository, filterWorks } from "../lib/worksRepository";
import { catalogUrl, getFormatCounts, getGenres } from "../lib/discovery";
export default function Explore() {
  const works = worksRepository.list();
  const selection = editorialSelections[0];
  return (
    <div className="container discovery-page">
      <div className="explore-intro">
        <PageIntro
          eyebrow="SEGUE A TUA CURIOSIDADE"
          title="Há mais de um caminho."
          description="Começa por uma forma, atravessa um género ou segue uma palavra. A próxima história pode estar onde ainda não procuraste."
        />
        <Compass className="intro-orbit" size={130} strokeWidth={0.6} />
      </div>
      <DemoNotice />
      <section className="section discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PALAVRAS OU TRAÇOS?</span>
            <h2>Escolhe uma forma de entrar.</h2>
          </div>
          <Link className="text-link" to="/categorias">
            Ver categorias <ArrowRight size={16} />
          </Link>
        </div>
        <div className="discovery-format-grid">
          {getFormatCounts(works).map((format) => (
            <Link
              key={format.name}
              to={catalogUrl({ formato: format.name })}
              className="discovery-format-card"
            >
              {format.family === "visual" ? (
                <Frame size={22} />
              ) : (
                <BookOpen size={22} />
              )}
              <span>
                <strong>{format.name}</strong>
                <small>{format.count} obra preparada</small>
              </span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
      <WorkSection
        title={selection.title}
        eyebrow="PERCURSO EDITORIAL"
        description={selection.description}
        works={selectEditorialWorks(works, selection)}
        to={`/tendencias#${selection.id}`}
        linkLabel="Conhecer as seleções"
      />
      <section className="section discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UMA ATMOSFERA PARA CADA MOMENTO</span>
            <h2>Por onde te leva a imaginação?</h2>
          </div>
        </div>
        <div className="genre-links">
          {getGenres(works).map((genre) => (
            <Link key={genre.slug} to={catalogUrl({ genero: genre.name })}>
              <span>{genre.name}</span>
              <small>
                {genre.count}{" "}
                {genre.count === 1 ? "obra local" : "obras locais"}
              </small>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
      <WorkSection
        title="As primeiras páginas do Arquivo."
        eyebrow="EDIÇÃO INAUGURAL"
        description="Conteúdo original preparado pela Equipa Editorial. A data indica preparação local, não publicação."
        works={filterWorks(works, {
          query: "",
          format: "",
          genre: "",
          sort: "recentes",
        }).slice(0, 4)}
        to="/catalogo?ordem=recentes"
      />
      <section className="section discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              PEQUENAS PALAVRAS, GRANDES UNIVERSOS
            </span>
            <h2>Segue uma tag.</h2>
          </div>
          <Link className="text-link" to="/tags">
            Diretório completo <ArrowRight size={16} />
          </Link>
        </div>
        <TagLinks works={works} />
      </section>
    </div>
  );
}
