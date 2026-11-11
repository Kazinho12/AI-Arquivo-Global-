import { useLibrary } from "../library/store";
import { resumeChapter } from "../reader/progress";
import { Link, useParams } from "react-router-dom";
import { Badge, Button } from "../../components/ui";
import { Cover } from "../../components/WorkCard";
import { usePublishedWork, usePublicCatalog } from "./PublicCatalog";
import { ProseReader } from "../reader/ProseReader";
import { PoetryReader } from "../reader/PoetryReader";
import { NotFound } from "../../pages/States";
export function PublishedWorkPage() {
  const { id = "" } = useParams();
  const state = usePublishedWork(id);
  const { entries } = useLibrary();
  const catalog = usePublicCatalog();
  if (state.loading)
    return (
      <div className="container">
        <p role="status">A carregar publicação…</p>
      </div>
    );
  if (state.error)
    return (
      <div className="container">
        <p role="alert">{state.error}</p>
        <Button onClick={catalog.refresh}>Tentar novamente</Button>
      </div>
    );
  if (!state.work) return <NotFound />;
  const work = state.work;
  const previous = entries.find((entry) => entry.workId === work.id);
  const resume = resumeChapter(work.chapters, previous?.lastReadChapterId);
  const visual = work.format === "HQ / Comic" || work.format === "Mangá";
  return (
    <div className="container discovery-page work-page">
      <nav>
        <Link to="/catalogo">← Catálogo público</Link>
      </nav>
      <article className="work-presentation">
        <aside className="work-cover-column">
          <Cover work={work} />
          <p>Composição tipográfica · sem capa enviada</p>
        </aside>
        <div className="work-information">
          <Badge>Publicada pelo autor</Badge>
          <Badge>{work.format}</Badge>
          <h1>{work.title}</h1>
          <p>
            {work.authorUsername ? (
              <Link to={`/utilizadores/${work.authorUsername}`}>
                {work.author}
              </Link>
            ) : (
              work.author
            )}
          </p>
          <section className="synopsis">
            <h2>Sinopse</h2>
            <p>{work.synopsis}</p>
          </section>
          <dl className="work-facts">
            <div>
              <dt>Género</dt>
              <dd>{work.genre || "Não indicado"}</dd>
            </div>
            <div>
              <dt>Idioma</dt>
              <dd>{work.language}</dd>
            </div>
            <div>
              <dt>Classificação etária</dt>
              <dd>{work.ageRating}</dd>
            </div>
            <div>
              <dt>Primeira publicação</dt>
              <dd>
                <time dateTime={work.firstPublishedAt}>
                  {new Date(work.firstPublishedAt).toLocaleString("pt-PT")}
                </time>
              </dd>
            </div>
            <div>
              <dt>Última publicação</dt>
              <dd>
                <time dateTime={work.lastPublishedAt}>
                  {new Date(work.lastPublishedAt).toLocaleString("pt-PT")}
                </time>
              </dd>
            </div>
          </dl>
          <div className="work-tags">
            {work.tags.map((tag) => (
              <Link key={tag} to={`/catalogo?tag=${encodeURIComponent(tag)}`}>
                {tag}
              </Link>
            ))}
          </div>
          {work.contentWarnings.length > 0 && (
            <p>Avisos de conteúdo: {work.contentWarnings.join(", ")}</p>
          )}
          {visual && (
            <p className="notice">
              Publicação do guião textual. Esta edição não contém páginas de
              imagens.
            </p>
          )}
          {resume && (
            <div className="reader-resume">
              <Link
                className="button primary"
                to={`/obras/${work.id}/capitulos/${resume.id}`}
              >
                {previous?.lastReadChapterId === resume.id
                  ? "Retomar leitura"
                  : "Começar leitura"}
                : {resume.title}
              </Link>
              {previous && previous.lastReadChapterId !== resume.id && (
                <p>
                  O capítulo guardado já não está nesta edição. Podes começar
                  pela primeira entrada disponível.
                </p>
              )}
              <p>
                A continuidade fica apenas neste navegador, no contexto local
                atual. Não é enviada ao Supabase.
              </p>
            </div>
          )}
          <section className="editorial-chapters">
            <h2>
              {work.format === "Poesia"
                ? "Poemas publicados"
                : visual
                  ? "Guião publicado"
                  : "Capítulos publicados"}
            </h2>
            <ol>
              {work.chapters.map((entry) => (
                <li key={entry.id}>
                  <Link to={`/obras/${work.id}/capitulos/${entry.id}`}>
                    {entry.number}. {entry.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </div>
  );
}
export function PublishedReaderPage() {
  const { id = "", capituloId } = useParams();
  const state = usePublishedWork(id, true);
  const catalog = usePublicCatalog();
  if (state.loading)
    return (
      <div className="container">
        <p role="status">A carregar conteúdo publicado…</p>
      </div>
    );
  if (state.error)
    return (
      <div className="container">
        <p role="alert">{state.error}</p>
        <Button onClick={catalog.refresh}>Tentar novamente</Button>
      </div>
    );
  const work = state.work;
  const chapter = work?.chapters.find((entry) => entry.id === capituloId);
  if (!work || !chapter) return <NotFound />;
  const props = {
    workId: work.id,
    workTitle: work.title,
    author: work.author,
    chapters: work.chapters,
    currentChapter: chapter,
    trackProgress: true,
    showCommunityLinks: false,
  };
  if (work.format === "Poesia")
    return <PoetryReader key={`${id}:${capituloId}`} {...props} />;
  return (
    <>
      {["HQ / Comic", "Mangá"].includes(work.format) && (
        <p className="notice container">
          Leitura do guião textual · sem imagens nesta edição
        </p>
      )}
      <ProseReader key={`${id}:${capituloId}`} {...props} />
    </>
  );
}
