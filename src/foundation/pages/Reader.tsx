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
  const { id, capituloId } = useParams<{ id: string; capituloId: string }>();
  const work = worksRepository.find(id ?? "");

  const readingData = getWorkReadingData(
    id ?? "",
    work?.format,
    work?.title,
    work?.author,
  );

  const currentChapter =
    readingData.chapters.find((c) => c.id === capituloId) ||
    readingData.chapters[0];

  if (!currentChapter) {
    return <NotFound />;
  }

  if (readingData.mode === "poetry") {
    return (
      <PoetryReader
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

  const currentChapter =
    readingData.chapters.find((c) => c.id === capituloId) ||
    readingData.chapters[0];

  if (!currentChapter) {
    return <NotFound />;
  }

  if (readingData.mode === "manga") {
    return (
      <MangaReader
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

const initialDemoComments: Record<string, CommentItem[]> = {
  "atlas-das-mares": [
    {
      id: "c-1",
      authorName: "Tomás Nilo",
      authorUsername: "tomas_nilo",
      createdAt: "Há 2 dias",
      text: "A cadência da prosa é deslumbrante. A descrição da maré a recuar e a revelar os arcos de pedra submersos cria uma sensação de mistério muito tangível.",
      chapterRef: "Capítulo 1",
      likes: 14,
    },
    {
      id: "c-2",
      authorName: "Íris Vale",
      authorUsername: "iris_vale",
      createdAt: "Ontem",
      text: "Gostei particularmente do rigor dos instrumentos náuticos. O compasso de latão e o sextante de bolso ancoram a ficção numa realidade concreta.",
      chapterRef: "Capítulo 2",
      likes: 8,
    },
  ],
  "silencio-orbita": [
    {
      id: "c-3",
      authorName: "Lia Mavume",
      authorUsername: "lia-mavume",
      createdAt: "Há 4 dias",
      text: "A imagem da luz a cansar-se de atravessar a sala deserta é magnífica. A métrica livre preserva uma respiração muito controlada.",
      chapterRef: "I. Equinócio",
      likes: 19,
    },
  ],
};

// 3. Comments Page: /obras/:id/comentarios
export function CommentsPage() {
  const { id } = useParams<{ id: string }>();
  const work = worksRepository.find(id ?? "");

  const [comments, setComments] = useState<CommentItem[]>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return initialDemoComments[id ?? ""] || [];
    }
    try {
      const stored = localStorage.getItem(`ag_comments_${id}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return initialDemoComments[id ?? ""] || [];
  });

  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      localStorage.setItem(`ag_comments_${id}`, JSON.stringify(comments));
    } catch {
      // ignore
    }
  }, [comments, id]);

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

  const toggleLike = (commentId: string) => {
    const isLiked = likedMap[commentId];
    setLikedMap({ ...likedMap, [commentId]: !isLiked });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1 }
          : c,
      ),
    );
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
            Os comentários são guardados no teu navegador durante a
            demonstração. Mantém as tuas respostas construtivas e identifica
            avisos de revelação de enredo (spoilers).
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
              <Send size={15} className="inline mr-1" /> Publicar comentário
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
                  <button
                    type="button"
                    className={`comment-like-btn ${likedMap[comment.id] ? "liked" : ""}`}
                    onClick={() => toggleLike(comment.id)}
                    aria-label={`Gostar deste comentário (${comment.likes} gostos)`}
                  >
                    <Heart
                      size={14}
                      className={likedMap[comment.id] ? "fill-current" : ""}
                    />
                    <span>{comment.likes}</span>
                  </button>
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

const initialDemoReviews: Record<string, ReviewItem[]> = {
  "atlas-das-mares": [
    {
      id: "r-1",
      reviewerName: "Rui Alentejo",
      reviewerHandle: "rui_critica",
      createdAt: "Há 1 semana",
      headline: "Cartografia lírica e precisão atmosférica",
      body: "Uma narrativa rara no panorama contemporâneo: combina o rigor técnico da navegação costeira com uma sensibilidade quase arqueológica. A cada recuo da água, a cidade submersa ganha densidade física e moral.",
      facets: ["Construção de mundo", "Prosa evocativa", "Rigor histórico"],
      recommend: true,
    },
    {
      id: "r-2",
      reviewerName: "Clara Sampaio",
      reviewerHandle: "clara_livros",
      createdAt: "Há 3 dias",
      headline: "O mar enquanto protagonista silencioso",
      body: "O trabalho com o vocabulário das marés e das correntes marítimas é sublime. Uma leitura que exige tempo e recompensa com imagens indeléveis.",
      facets: ["Linguagem apurada", "Atmosfera imersiva"],
      recommend: true,
    },
  ],
};

export function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const work = worksRepository.find(id ?? "");

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return initialDemoReviews[id ?? ""] || [];
    }
    try {
      const stored = localStorage.getItem(`ag_reviews_${id}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return initialDemoReviews[id ?? ""] || [];
  });

  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [recommend, setRecommend] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      localStorage.setItem(`ag_reviews_${id}`, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews, id]);

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
      facets: ["Leitura demonstrativa"],
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
          <h2>Escrever uma avaliação</h2>
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
              <Sparkles size={15} className="inline mr-1" /> Publicar avaliação
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
            <p>Ainda não há avaliações publicadas para esta obra.</p>
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
