import { PublishedReaderPage } from "../features/catalog/PublishedPages";
import {
  useValidatedItems,
  validComments,
  validReviews,
} from "../features/local/items";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Send,
  Heart,
  AlertTriangle,
  Info,
} from "lucide-react";
import { worksRepository } from "../lib/worksRepository";
import { getWorkReadingData } from "../features/reader/data";
import { ProseReader } from "../features/reader/ProseReader";
import { PoetryReader } from "../features/reader/PoetryReader";
import { ComicReader } from "../features/reader/ComicReader";
import { MangaReader } from "../features/reader/MangaReader";
import { Button } from "../components/ui";
import { NotFound } from "./States";

// 1. Literary Reader Page: /obras/:id/capitulos/:capituloId
export function LiteraryReaderPage() {
  const { id } = useParams();
  return worksRepository.find(id ?? "") ? (
    <EditorialLiteraryReader />
  ) : (
    <PublishedReaderPage />
  );
}
function EditorialLiteraryReader() {
  const { id, capituloId } = useParams<{ id: string; capituloId: string }>();
  const work = worksRepository.find(id ?? "");

  const readingData = getWorkReadingData(
    id ?? "",
    work?.format,
    work?.title,
    work?.author,
  );

  const currentChapter = readingData?.chapters.find((c) => c.id === capituloId);

  if (
    !readingData ||
    !currentChapter ||
    !["prose", "poetry"].includes(readingData.mode)
  ) {
    return <NotFound />;
  }

  if (readingData.mode === "poetry") {
    return (
      <PoetryReader
        key={`${id}:${capituloId}`}
        trackProgress
        workId={readingData.workId}
        workTitle={readingData.title}
        author={readingData.author}
        chapters={readingData.chapters}
        currentChapter={currentChapter}
      />
    );
  }

  return (
    <ProseReader
      key={`${id}:${capituloId}`}
      trackProgress
      workId={readingData.workId}
      workTitle={readingData.title}
      author={readingData.author}
      chapters={readingData.chapters}
      currentChapter={currentChapter}
    />
  );
}

// 2. Visual Reader Page: /obras/:id/paginas/:capituloId
export function VisualReaderPage() {
  const { id, capituloId } = useParams<{ id: string; capituloId: string }>();
  const work = worksRepository.find(id ?? "");

  const readingData = getWorkReadingData(
    id ?? "",
    work?.format,
    work?.title,
    work?.author,
  );

  const currentChapter = readingData?.chapters.find((c) => c.id === capituloId);

  if (
    !readingData ||
    !currentChapter ||
    !["comic", "manga"].includes(readingData.mode)
  ) {
    return <NotFound />;
  }

  if (readingData.mode === "manga") {
    return (
      <MangaReader
        key={`${id}:${capituloId}`}
        trackProgress
        workId={readingData.workId}
        workTitle={readingData.title}
        author={readingData.author}
        chapters={readingData.chapters}
        currentChapter={currentChapter}
      />
    );
  }

  return (
    <ComicReader
      key={`${id}:${capituloId}`}
      trackProgress
      workId={readingData.workId}
      workTitle={readingData.title}
      author={readingData.author}
      chapters={readingData.chapters}
      currentChapter={currentChapter}
    />
  );
}

// Demo comments structure
interface CommentItem {
  id: string;
  authorName: string;
  authorUsername: string;
  createdAt: string;
  text: string;
  chapterRef?: string;
  likes: number;
}

// 3. Comments Page: /obras/:id/comentarios
export function CommentsPage() {
  const { id } = useParams<{ id: string }>();
  return worksRepository.find(id ?? "") ? (
    <CommentsForWork key={id} />
  ) : (
    <NotFound />
  );
}
function CommentsForWork() {
  const { id } = useParams<{ id: string }>();
  const work = worksRepository.find(id ?? "");

  const {
    items: comments,
    setItems: setComments,
    warning,
    exportCopy,
  } = useValidatedItems<CommentItem>(`ag_comments_${id}`, [], validComments);

  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: CommentItem = {
      id: `c-local-${Date.now()}`,
      authorName: authorName.trim() || "Leitor Anónimo",
      authorUsername: (authorName.trim() || "leitor")
        .toLowerCase()
        .replace(/\s+/g, "_"),
      createdAt: "Agora mesmo",
      text: newComment.trim(),
      likes: 0,
    };

    setComments([item, ...comments]);
    setNewComment("");
  };

  const isVisual =
    work?.format === "HQ / Comic" ||
    work?.format === "Mangá" ||
    work?.format === "Obra ilustrada";
  const readerPath = isVisual
    ? `/obras/${id}/paginas/cap-1`
    : `/obras/${id}/capitulos/cap-1`;

  return (
    <div className="container comments-container">
      {warning && (
        <p role="alert">
          {warning}
          <Button variant="ghost" onClick={exportCopy}>
            Exportar uma cópia
          </Button>
        </p>
      )}
      <nav className="comments-nav" aria-label="Navegação dos comentários">
        <Link to={`/obras/${id}`} className="text-link">
          <ArrowLeft size={15} className="inline mr-1" /> Voltar à obra
        </Link>
        <span className="separator" aria-hidden="true">
          ·
        </span>
        <Link to={readerPath} className="text-link">
          Abrir no leitor
        </Link>
      </nav>

      <header className="comments-header">
        <span className="eyebrow">CONVERSA & ANÁLISE</span>
        <h1>{`Comentários sobre ${work ? work.title : "esta obra"}`}</h1>
        <p className="comments-intro">
          Espaço para partilhar impressões de leitura, análise de texto e debate
          respeitoso entre autores e leitores.
        </p>
      </header>

      {/* Comment Form */}
      <section className="comment-form-section">
        <div className="form-info-callout">
          <Info size={16} />
          <span>
            Estas notas são guardadas apenas neste navegador, sem publicação ou
            identidade verificada. Mantém as tuas respostas construtivas e
            identifica avisos de revelação de enredo (spoilers).
          </span>
        </div>

        <form onSubmit={handleSubmit} className="comment-submit-form">
          <div className="comment-form-row">
            <label htmlFor="comment-author" className="sr-only">
              O teu nome ou pseudónimo
            </label>
            <input
              id="comment-author"
              type="text"
              placeholder="O teu nome ou pseudónimo (opcional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="comment-author-input"
            />
          </div>

          <div className="comment-form-row">
            <label htmlFor="comment-text" className="sr-only">
              O teu comentário
            </label>
            <textarea
              id="comment-text"
              rows={3}
              placeholder="Partilha a tua reflexão sobre a história, estilo ou personagens..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-textarea"
              required
            />
          </div>

          <div className="comment-form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={!newComment.trim()}
            >
              <Send size={15} className="inline mr-1" /> Guardar nota local
            </Button>
          </div>
        </form>
      </section>

      {/* Comments List */}
      <section
        className="comments-list-section"
        aria-label="Lista de comentários"
      >
        <h2>
          {comments.length}{" "}
          {comments.length === 1 ? "comentário" : "comentários"}
        </h2>

        {comments.length === 0 ? (
          <div className="empty-comments-state">
            <MessageSquare size={36} className="empty-icon" />
            <p>Ainda não há comentários registados nesta obra.</p>
            <small>
              Sê a primeira pessoa a partilhar uma reflexão de leitura.
            </small>
          </div>
        ) : (
          <div className="comments-feed">
            {comments.map((comment) => (
              <article key={comment.id} className="comment-card">
                <header className="comment-card-header">
                  <div className="comment-author-meta">
                    <span className="comment-author-name">
                      {comment.authorName}
                    </span>
                    <span className="comment-author-handle">
                      @{comment.authorUsername}
                    </span>
                    <span className="separator" aria-hidden="true">
                      ·
                    </span>
                    <time className="comment-date">{comment.createdAt}</time>
                  </div>
                  {comment.chapterRef && (
                    <span className="comment-chapter-ref">
                      {comment.chapterRef}
                    </span>
                  )}
                </header>

                <div className="comment-card-body">
                  <p>{comment.text}</p>
                </div>

                <footer className="comment-card-footer">
                  <small>Nota local · sem contagem pública de gostos</small>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// 4. Reviews Page: /obras/:id/avaliacoes
interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerHandle: string;
  createdAt: string;
  headline: string;
  body: string;
  facets: string[]; // e.g. ["Construção de mundo", "Prosa poética"]
  recommend: boolean;
}

export function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  return worksRepository.find(id ?? "") ? (
    <ReviewsForWork key={id} />
  ) : (
    <NotFound />
  );
}
function ReviewsForWork() {
  const { id } = useParams<{ id: string }>();
  const work = worksRepository.find(id ?? "");

  const {
    items: reviews,
    setItems: setReviews,
    warning,
    exportCopy,
  } = useValidatedItems<ReviewItem>(`ag_reviews_${id}`, [], validReviews);

  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [recommend, setRecommend] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !body.trim()) return;

    const newRev: ReviewItem = {
      id: `r-local-${Date.now()}`,
      reviewerName: reviewerName.trim() || "Crítico Anónimo",
      reviewerHandle: (reviewerName.trim() || "critico")
        .toLowerCase()
        .replace(/\s+/g, "_"),
      createdAt: "Hoje",
      headline: headline.trim(),
      body: body.trim(),
      facets: ["Nota local de leitura"],
      recommend,
    };

    setReviews([newRev, ...reviews]);
    setHeadline("");
    setBody("");
  };

  const isVisual =
    work?.format === "HQ / Comic" ||
    work?.format === "Mangá" ||
    work?.format === "Obra ilustrada";
  const readerPath = isVisual
    ? `/obras/${id}/paginas/cap-1`
    : `/obras/${id}/capitulos/cap-1`;

  return (
    <div className="container reviews-container">
      {warning && (
        <p role="alert">
          {warning}
          <Button variant="ghost" onClick={exportCopy}>
            Exportar uma cópia
          </Button>
        </p>
      )}
      <nav className="comments-nav" aria-label="Navegação das avaliações">
        <Link to={`/obras/${id}`} className="text-link">
          <ArrowLeft size={15} className="inline mr-1" /> Voltar à obra
        </Link>
        <span className="separator" aria-hidden="true">
          ·
        </span>
        <Link to={readerPath} className="text-link">
          Iniciar leitura
        </Link>
      </nav>

      <header className="reviews-header">
        <span className="eyebrow">AVALIAÇÕES QUALITATIVAS</span>
        <h1>Avaliações e impressões críticas</h1>
        <p className="reviews-intro">
          No Arquivo Global, valorizamos a crítica literária fundamentada e
          impressões qualitativas em vez de pontuações mecânicas.
        </p>
      </header>

      {/* Review Submission Section */}
      <section className="review-form-section">
        <form onSubmit={handleSubmit} className="review-submit-form">
          <h2>Escrever uma avaliação local</h2>
          <p>
            Guardada neste navegador. Não é enviada ao autor nem publicada na
            plataforma.
          </p>
          <div className="review-form-grid">
            <div>
              <label htmlFor="rev-author" className="field-label">
                O teu nome ou assinatura
              </label>
              <input
                id="rev-author"
                type="text"
                placeholder="Ex.: Marta Fonseca"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="rev-headline" className="field-label">
                Título ou síntese da impressão
              </label>
              <input
                id="rev-headline"
                type="text"
                placeholder="Ex.: Uma exploração comovente sobre a memória"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="rev-body" className="field-label">
              Texto detalhado da avaliação
            </label>
            <textarea
              id="rev-body"
              rows={4}
              placeholder="Desenvolve a tua perspetiva sobre a obra: o ritmo, as escolhas de linguagem, os temas abordados..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="comment-textarea"
              required
            />
          </div>

          <div className="review-recommend-check">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={recommend}
                onChange={(e) => setRecommend(e.target.checked)}
              />
              Recomendo esta obra a outros leitores
            </label>
          </div>

          <div className="mt-3">
            <Button
              variant="primary"
              type="submit"
              disabled={!headline.trim() || !body.trim()}
            >
              <Sparkles size={15} className="inline mr-1" /> Guardar avaliação
              local
            </Button>
          </div>
        </form>
      </section>

      {/* Reviews Feed */}
      <section
        className="reviews-list-section"
        aria-label="Avaliações existentes"
      >
        <h2>
          {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
        </h2>

        {reviews.length === 0 ? (
          <div className="empty-reviews-state">
            <Sparkles size={36} className="empty-icon" />
            <p>Ainda não há avaliações locais para esta obra.</p>
            <small>Depois de ler, contribui com a tua análise.</small>
          </div>
        ) : (
          <div className="reviews-feed">
            {reviews.map((rev) => (
              <article key={rev.id} className="review-card">
                <header className="review-card-header">
                  <div>
                    <h3 className="review-headline">{rev.headline}</h3>
                    <div className="review-author-line">
                      <span>{rev.reviewerName}</span>
                      <span className="separator" aria-hidden="true">
                        ·
                      </span>
                      <span className="review-handle">
                        @{rev.reviewerHandle}
                      </span>
                      <span className="separator" aria-hidden="true">
                        ·
                      </span>
                      <time className="review-date">{rev.createdAt}</time>
                    </div>
                  </div>
                  {rev.recommend && (
                    <span className="recommendation-badge">
                      ✓ Recomenda a leitura
                    </span>
                  )}
                </header>

                <div className="review-card-body">
                  <p>{rev.body}</p>
                </div>

                {rev.facets && rev.facets.length > 0 && (
                  <footer className="review-card-facets">
                    {rev.facets.map((facet, idx) => (
                      <span key={idx} className="facet-text">
                        {facet}
                        {idx < rev.facets.length - 1 ? (
                          <span className="separator" aria-hidden="true">
                            ·
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </footer>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
