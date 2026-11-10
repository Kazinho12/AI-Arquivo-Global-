import { Link, useParams } from "react-router-dom";
import { BookOpen, ArrowRight, Feather } from "lucide-react";
import { Badge, Button } from "../components/ui";
import { Cover } from "../components/WorkCard";
import {
  Breadcrumbs,
  DemoNotice,
  TagLinks,
  WorkSection,
} from "../components/Discovery";
import { worksRepository } from "../lib/worksRepository";
import { catalogUrl, formatDemoDate, relatedWorks } from "../lib/discovery";
import { NotFound } from "./States";
export default function WorkDetail() {
  const { id } = useParams();
  const work = worksRepository.find(id ?? "");
  if (!work) return <NotFound />;
  const related = relatedWorks(worksRepository.list(), work);
  return (
    <div className="container discovery-page work-page">
      <Breadcrumbs
        items={[
          { label: "Início", to: "/" },
          { label: "Catálogo", to: "/catalogo" },
          { label: work.title },
        ]}
      />
      <DemoNotice />
      <article className="work-presentation">
        <aside className="work-cover-column">
          <Cover work={work} />
          <div className="cover-caption">
            Capa gráfica de demonstração
            <br />
            Criada para este protótipo
          </div>
        </aside>
        <div className="work-information">
          <div className="work-classification">
            <Link to={catalogUrl({ formato: work.format })}>{work.format}</Link>
            <Badge>Amostra demonstrativa</Badge>
          </div>
          <h1>{work.title}</h1>
          <div className="work-byline">
            <Feather size={16} />
            <span>
              por{" "}
              <Link
                to={catalogUrl({ q: work.author, campo: "autor" }, "/pesquisa")}
              >
                {work.author}
              </Link>{" "}
              <small>· autor fictício</small>
            </span>
          </div>
          <div className="work-genre">
            <Link to={catalogUrl({ genero: work.genre })}>
              {work.genre}
              <ArrowRight size={13} />
            </Link>
          </div>
          <section className="synopsis">
            <h2>Uma porta para a história</h2>
            <p>{work.synopsis}</p>
          </section>
          <section className="work-tag-section">
            <h2>Entre temas e universos</h2>
            <TagLinks names={work.tags} works={worksRepository.list()} />
          </section>
          <dl className="work-facts">
            <div>
              <dt>Estado da publicação</dt>
              <dd>Demonstração · sem publicação real</dd>
            </div>
            <div>
              <dt>Data fictícia do exemplo</dt>
              <dd>
                <time dateTime={work.createdAt}>
                  {formatDemoDate(work.createdAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Formato</dt>
              <dd>{work.format}</dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>Apenas apresentação e sinopse</dd>
            </div>
          </dl>
          <div className="reading-availability">
            <BookOpen size={23} />
            <div>
              <h2>Leitura disponível no Arquivo Global</h2>
              <p>
                Acede aos capítulos e páginas demonstrativas com o novo leitor
                adaptado ao formato desta obra.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Link
                  to={
                    work.format === "HQ / Comic" ||
                    work.format === "Mangá" ||
                    work.format === "Obra ilustrada"
                      ? `/obras/${work.id}/paginas/cap-1`
                      : `/obras/${work.id}/capitulos/cap-1`
                  }
                  className="button primary"
                >
                  <BookOpen size={15} /> Iniciar leitura
                </Link>
                <Link
                  to={`/obras/${work.id}/comentarios`}
                  className="button secondary"
                >
                  Comentários
                </Link>
                <Link
                  to={`/obras/${work.id}/avaliacoes`}
                  className="button secondary"
                >
                  Avaliações
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
      {related.length > 0 ? (
        <WorkSection
          title="Histórias que partilham um fio."
          eyebrow="RELAÇÕES NO CATÁLOGO DEMO"
          description="Obras que partilham género, formato ou tags. Uma associação por conteúdo, sem personalização ou métricas de popularidade."
          works={related}
        />
      ) : (
        <div className="notice">
          Ainda não há exemplos com género, formato ou tags em comum.{" "}
          <Link className="text-link" to="/catalogo">
            Explorar todo o catálogo →
          </Link>
        </div>
      )}
      <div className="work-context-nav">
        <Link to="/catalogo">← Voltar ao catálogo</Link>
        <Link to="/explorar">Continuar a explorar →</Link>
      </div>
    </div>
  );
}
