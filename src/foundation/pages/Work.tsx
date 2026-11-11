import { PublishedWorkPage } from "../features/catalog/PublishedPages";
import { Link, useParams } from "react-router-dom";
import { BookOpen, Feather } from "lucide-react";
import { Badge } from "../components/ui";
import { Cover } from "../components/WorkCard";
import { Breadcrumbs, TagLinks, WorkSection } from "../components/Discovery";
import { worksRepository } from "../lib/worksRepository";
import { catalogUrl, formatDemoDate, relatedWorks } from "../lib/discovery";
import { inauguralWorks, editorialIdentity } from "../data/inaugural";
import { getWorkReadingData } from "../features/reader/data";
import { useLibrary } from "../features/library/store";
import { NotFound } from "./States";
export default function WorkDetail() {
  const { id } = useParams();
  return inauguralWorks.some((work) => work.id === id) ? (
    <EditorialWorkDetail />
  ) : (
    <PublishedWorkPage />
  );
}
function EditorialWorkDetail() {
  const { id } = useParams();
  const { entries } = useLibrary();
  const work = inauguralWorks.find((item) => item.id === id);
  if (!work) return <NotFound />;
  const reading = getWorkReadingData(work.id);
  const history = entries.find((entry) => entry.workId === work.id);
  const resume =
    reading?.chapters.find(
      (chapter) => chapter.id === history?.lastReadChapterId,
    ) ?? reading?.chapters[0];
  const path = (chapter: string) =>
    `/obras/${work.id}/${reading?.mode === "comic" || reading?.mode === "manga" ? "paginas" : "capitulos"}/${chapter}`;
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
      <article className="work-presentation">
        <aside className="work-cover-column">
          <Cover work={work} />
          <p className="cover-caption">
            Composição gráfica original · edição inaugural
          </p>
        </aside>
        <div className="work-information">
          <div className="work-classification">
            <Link to={catalogUrl({ formato: work.format })}>{work.format}</Link>
            <Badge>Preparado localmente</Badge>
          </div>
          <h1>{work.title}</h1>
          <div className="work-byline">
            <Feather size={16} />
            <Link
              className="text-link"
              to={`/utilizadores/${editorialIdentity.username}`}
            >
              {work.author}
            </Link>
          </div>
          <section className="synopsis">
            <h2>Uma porta para a leitura</h2>
            <p>{work.synopsis}</p>
          </section>
          <TagLinks names={work.tags} works={inauguralWorks} />
          <dl className="work-facts">
            <div>
              <dt>Estado</dt>
              <dd>Preparado localmente · sem publicação remota</dd>
            </div>
            <div>
              <dt>Preparação editorial</dt>
              <dd>
                <time dateTime={work.preparedAt}>
                  {formatDemoDate(work.preparedAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Autor original</dt>
              <dd>{editorialIdentity.displayName}</dd>
            </div>
            <div>
              <dt>Publicador editorial</dt>
              <dd>{editorialIdentity.displayName}</dd>
            </div>
            <div>
              <dt>Proprietário editorial</dt>
              <dd>
                Organização editorial do projeto · sem conta real associada
              </dd>
            </div>
            <div>
              <dt>Origem</dt>
              <dd>
                Texto/composição original criado para o projeto, em preparação
                editorial
              </dd>
            </div>
          </dl>
          <section className="reading-availability">
            <BookOpen size={23} />
            <div>
              <h2>Leitura nesta versão local</h2>
              <p>
                {reading?.chapters.length ?? 0} unidades preparadas. Nenhum
                capítulo é gerado para preencher ausências.
              </p>
              {resume && (
                <Link className="button primary" to={path(resume.id)}>
                  {history ? "Continuar leitura" : "Iniciar leitura"}
                </Link>
              )}
              <div className="completion-links">
                <Link
                  className="text-link"
                  to={`/obras/${work.id}/comentarios`}
                >
                  Notas locais
                </Link>
                <Link className="text-link" to={`/obras/${work.id}/avaliacoes`}>
                  Avaliações locais
                </Link>
              </div>
            </div>
          </section>
          <section className="editorial-chapters">
            <h2>Conteúdo preparado</h2>
            <ol>
              {reading?.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link to={path(chapter.id)}>
                    <span>{String(chapter.number).padStart(2, "0")}</span>
                    {chapter.title} →
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
      {related.length > 0 && (
        <WorkSection
          title="Outros caminhos de leitura."
          eyebrow="RELAÇÕES EDITORIAIS"
          description="Peças do mesmo catálogo que partilham temas ou formato. Sem ranking de popularidade."
          works={related}
        />
      )}
      <div className="work-context-nav">
        <Link to="/catalogo">← Voltar ao catálogo</Link>
        <Link to="/colecoes">Explorar coleções →</Link>
      </div>
    </div>
  );
}
