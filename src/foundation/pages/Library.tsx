import { Modal } from "../components/ui";
import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Heart,
  Search,
  LayoutGrid,
  List as ListIcon,
  Clock,
  BookmarkCheck,
  FolderPlus,
  Trash2,
  ArrowRight,
  Filter,
  Plus,
  Check,
} from "lucide-react";
import { useLibrary } from "../features/library/store";
import type {
  LibraryTab,
  ViewMode,
  SortOption,
  LibraryEntry,
} from "../features/library/types";
import { Button } from "../components/ui";

function getReaderLink(entry: LibraryEntry) {
  const isVisual =
    entry.format === "HQ / Comic" ||
    entry.format === "Mangá" ||
    entry.format === "Obra ilustrada";
  const chapterId = entry.lastReadChapterId || "cap-1";
  return isVisual
    ? `/obras/${entry.workId}/paginas/${chapterId}`
    : `/obras/${entry.workId}/capitulos/${chapterId}`;
}

// 1. Library Overview Page: /biblioteca
export function LibraryOverviewPage() {
  const { entries, store } = useLibrary();
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Tab filter
        if (activeTab === "reading" && entry.status !== "reading") return false;
        if (activeTab === "completed" && entry.status !== "completed")
          return false;
        if (activeTab === "plan_to_read" && entry.status !== "plan_to_read")
          return false;

        // Format filter
        if (selectedFormat !== "all" && entry.format !== selectedFormat)
          return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = entry.title.toLowerCase().includes(q);
          const matchesAuthor = entry.author.toLowerCase().includes(q);
          const matchesGenre = entry.genre.toLowerCase().includes(q);
          if (!matchesTitle && !matchesAuthor && !matchesGenre) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "title") return a.title.localeCompare(b.title);
        if (sortOption === "progress") return b.progress - a.progress;
        return (b.lastReadAtIso ?? "").localeCompare(a.lastReadAtIso ?? "");
      });
  }, [entries, activeTab, selectedFormat, searchQuery, sortOption]);

  const uniqueFormats = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.format));
    return Array.from(set);
  }, [entries]);

  return (
    <div className="container library-page">
      <header className="library-header">
        <div>
          <span className="eyebrow">A TUA COLEÇÃO</span>
          <h1>Biblioteca Pessoal</h1>
          <p className="library-subtitle">
            Acompanha o teu progresso de leitura, retoma capítulos e organiza as
            tuas obras preferidas.
          </p>
        </div>

        <div className="library-header-actions">
          <Link to="/catalogo" className="button secondary">
            <Plus size={16} /> Explorar catálogo
          </Link>
        </div>
      </header>

      {/* Tabs & Toolbar */}
      <div className="library-toolbar-strip">
        {/* Status Filter Tabs */}
        <div
          className="segmented-control"
          role="tablist"
          aria-label="Filtrar por estado"
        >
          {(
            [
              ["all", "Todas"],
              ["reading", "A ler"],
              ["completed", "Concluídas"],
              ["plan_to_read", "Para ler"],
            ] as const
          ).map(([key, label]) => {
            const count =
              key === "all"
                ? entries.length
                : entries.filter((e) => e.status === key).length;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div
          className="view-mode-toggle"
          role="group"
          aria-label="Modo de grelha ou lista"
        >
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
            aria-label="Ver em grelha"
            title="Grelha"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            aria-label="Ver em lista"
            title="Lista"
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {/* Search & Secondary Filter Bar */}
      <div className="library-filter-bar">
        <div className="library-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Pesquisar por título, autor ou género..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="library-search-input"
            aria-label="Pesquisar na biblioteca"
          />
        </div>

        <div className="library-dropdowns">
          <label htmlFor="format-filter" className="sr-only">
            Filtrar por formato
          </label>
          <select
            id="format-filter"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os formatos</option>
            {uniqueFormats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <label htmlFor="sort-select" className="sr-only">
            Ordenar biblioteca
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="recent">Mais recentes</option>
            <option value="title">Título (A-Z)</option>
            <option value="progress">Maior progresso</option>
          </select>
        </div>
      </div>

      {/* Results / Empty State */}
      {filteredEntries.length === 0 ? (
        <div className="library-empty-state">
          <BookOpen size={42} className="empty-icon" />
          <h2>Nenhuma obra encontrada nesta secção</h2>
          <p>
            {searchQuery
              ? `Não foram encontrados resultados para "${searchQuery}". Experimenta outros termos.`
              : "Ainda não guardaste obras com este estado na tua biblioteca."}
          </p>
          <Link to="/catalogo" className="button primary mt-3">
            Explorar histórias no catálogo →
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="library-grid">
          {filteredEntries.map((entry) => (
            <article key={entry.workId} className="library-card">
              <div className="library-card-content">
                <header className="library-card-header">
                  <div className="library-meta-line">
                    <span>{entry.format}</span>
                    <span className="separator" aria-hidden="true">
                      ·
                    </span>
                    <span>{entry.genre}</span>
                  </div>
                  <button
                    type="button"
                    className={`library-favorite-btn ${entry.isFavorite ? "favorited" : ""}`}
                    onClick={() => store.toggleFavorite(entry.workId)}
                    title={
                      entry.isFavorite
                        ? "Remover dos favoritos"
                        : "Guardar nos favoritos"
                    }
                    aria-label={
                      entry.isFavorite
                        ? "Favorito ativo"
                        : "Marcar como favorito"
                    }
                  >
                    <Heart
                      size={16}
                      className={entry.isFavorite ? "fill-current" : ""}
                    />
                  </button>
                </header>

                <h2 className="library-card-title">
                  <Link to={`/obras/${entry.workId}`}>{entry.title}</Link>
                </h2>
                <p className="library-card-author">por {entry.author}</p>

                <p className="library-card-synopsis">{entry.synopsis}</p>

                {/* Progress bar */}
                <div className="library-progress-section">
                  <div className="library-progress-labels">
                    <span className="last-chapter-text">
                      {entry.progress > 0
                        ? entry.lastReadChapterTitle
                        : "Ainda não iniciado"}
                    </span>
                    <span className="progress-percent font-mono">
                      {entry.progress}%
                    </span>
                  </div>
                  <div
                    className="library-progress-bar-bg"
                    role="progressbar"
                    aria-valuenow={entry.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="library-progress-bar-fill"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>

                <footer className="library-card-footer">
                  <Link
                    to={getReaderLink(entry)}
                    className="button primary w-full text-center"
                  >
                    {entry.progress > 0 ? "Continuar leitura" : "Começar a ler"}
                  </Link>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="library-list-view">
          {filteredEntries.map((entry) => (
            <article key={entry.workId} className="library-list-item">
              <div className="library-list-main">
                <div className="library-meta-line">
                  <span>{entry.format}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>{entry.genre}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>Última leitura: {entry.lastReadAt}</span>
                </div>
                <h2 className="library-list-title">
                  <Link to={`/obras/${entry.workId}`}>{entry.title}</Link>
                </h2>
                <p className="library-card-author">por {entry.author}</p>
              </div>

              <div className="library-list-progress-col">
                <div className="progress-label-row">
                  <span className="font-mono text-sm">
                    {entry.progress}% lido
                  </span>
                </div>
                <div
                  className="library-progress-bar-bg"
                  role="progressbar"
                  aria-valuenow={entry.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="library-progress-bar-fill"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              </div>

              <div className="library-list-actions">
                <button
                  type="button"
                  className={`library-favorite-btn ${entry.isFavorite ? "favorited" : ""}`}
                  onClick={() => store.toggleFavorite(entry.workId)}
                  title={entry.isFavorite ? "Favorito" : "Marcar favorito"}
                  aria-label="Alternar favorito"
                >
                  <Heart
                    size={16}
                    className={entry.isFavorite ? "fill-current" : ""}
                  />
                </button>
                <Link to={getReaderLink(entry)} className="button primary">
                  Ler
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Favorites Page: /biblioteca/favoritos
export function FavoritesPage() {
  const { entries, store } = useLibrary();
  const favorites = entries.filter((e) => e.isFavorite);

  return (
    <div className="container library-page">
      <nav className="library-breadcrumb" aria-label="Navegação da biblioteca">
        <Link to="/biblioteca" className="text-link">
          ← Toda a biblioteca
        </Link>
      </nav>

      <header className="library-header">
        <div>
          <span className="eyebrow">FAVORITOS PESSOAIS</span>
          <h1>Obras Favoritas</h1>
          <p className="library-subtitle">
            As histórias e poemas que marcaram o teu percurso e que queres
            revisitar.
          </p>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="library-empty-state">
          <Heart size={42} className="empty-icon" />
          <h2>Ainda não tens obras marcadas como favoritas</h2>
          <p>
            Clica no ícone de coração em qualquer obra da tua biblioteca ou do
            catálogo para destacá-la aqui.
          </p>
          <Link to="/biblioteca" className="button secondary mt-3">
            Ir para a biblioteca →
          </Link>
        </div>
      ) : (
        <div className="library-grid">
          {favorites.map((entry) => (
            <article key={entry.workId} className="library-card">
              <div className="library-card-content">
                <header className="library-card-header">
                  <div className="library-meta-line">
                    <span>{entry.format}</span>
                    <span className="separator" aria-hidden="true">
                      ·
                    </span>
                    <span>{entry.genre}</span>
                  </div>
                  <button
                    type="button"
                    className="library-favorite-btn favorited"
                    onClick={() => store.toggleFavorite(entry.workId)}
                    title="Remover dos favoritos"
                    aria-label="Remover favorito"
                  >
                    <Heart size={16} className="fill-current text-rose-500" />
                  </button>
                </header>

                <h2 className="library-card-title">
                  <Link to={`/obras/${entry.workId}`}>{entry.title}</Link>
                </h2>
                <p className="library-card-author">por {entry.author}</p>

                <p className="library-card-synopsis">{entry.synopsis}</p>

                <div className="library-progress-section">
                  <div className="library-progress-labels">
                    <span className="last-chapter-text">
                      {entry.lastReadChapterTitle}
                    </span>
                    <span className="progress-percent font-mono">
                      {entry.progress}%
                    </span>
                  </div>
                  <div
                    className="library-progress-bar-bg"
                    role="progressbar"
                    aria-valuenow={entry.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="library-progress-bar-fill"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>

                <footer className="library-card-footer">
                  <Link
                    to={getReaderLink(entry)}
                    className="button primary w-full text-center"
                  >
                    Continuar leitura
                  </Link>
                </footer>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// 3. History Page: /biblioteca/historico
export function HistoryPage() {
  const { entries, store } = useLibrary();
  const historyEntries = entries
    .filter((e) => e.lastReadAtIso || e.progress > 0)
    .sort((a, b) =>
      (b.lastReadAtIso ?? "").localeCompare(a.lastReadAtIso ?? ""),
    );

  return (
    <div className="container library-page">
      <nav className="library-breadcrumb" aria-label="Navegação da biblioteca">
        <Link to="/biblioteca" className="text-link">
          ← Toda a biblioteca
        </Link>
      </nav>

      <header className="library-header">
        <div>
          <span className="eyebrow">HISTÓRICO DE SESSÕES</span>
          <h1>Histórico de Leitura</h1>
          <p className="library-subtitle">
            Registo cronológico das histórias iniciadas e capítulos percorridos
            no teu dispositivo.
          </p>
        </div>

        {historyEntries.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm(
                  "Tens a certeza de que desejas repor o teu histórico de leitura?",
                )
              ) {
                store.clearHistory();
              }
            }}
            aria-label="Limpar histórico de leitura"
          >
            <Trash2 size={16} /> Limpar histórico
          </Button>
        )}
      </header>

      {historyEntries.length === 0 ? (
        <div className="library-empty-state">
          <Clock size={42} className="empty-icon" />
          <h2>Ainda não tens leituras registadas no histórico</h2>
          <p>
            Assim que abrires um capítulo de qualquer obra, a tua leitura fica
            guardada aqui para que possas retomar exatamente onde paraste.
          </p>
          <Link to="/catalogo" className="button primary mt-3">
            Descobrir obras no catálogo →
          </Link>
        </div>
      ) : (
        <div className="history-feed">
          {historyEntries.map((entry) => (
            <article key={entry.workId} className="history-item-card">
              <div className="history-item-left">
                <div className="history-date-badge">
                  <Clock size={14} className="inline mr-1" />
                  <span>{entry.lastReadAt}</span>
                </div>
                <h2 className="history-item-title">
                  <Link to={`/obras/${entry.workId}`}>{entry.title}</Link>
                </h2>
                <div className="history-meta-line">
                  <span>por {entry.author}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>{entry.format}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-accent">
                    {entry.lastReadChapterTitle}
                  </span>
                </div>
              </div>

              <div className="history-item-right">
                <div className="history-progress-box">
                  <span className="font-mono text-sm">
                    {entry.progress}% lido
                  </span>
                  <div
                    className="library-progress-bar-bg"
                    role="progressbar"
                    aria-valuenow={entry.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="library-progress-bar-fill"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>

                <Link to={getReaderLink(entry)} className="button primary">
                  Retomar <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. Reading Lists Overview Page: /biblioteca/listas
export function ListsPage() {
  const { lists, store } = useLibrary();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [listDesc, setListDesc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim()) return;
    store.createList(listTitle, listDesc);
    setListTitle("");
    setListDesc("");
    setShowCreateDialog(false);
  };

  return (
    <div className="container library-page">
      <nav className="library-breadcrumb" aria-label="Navegação da biblioteca">
        <Link to="/biblioteca" className="text-link">
          ← Toda a biblioteca
        </Link>
      </nav>

      <header className="library-header">
        <div>
          <span className="eyebrow">ORGANIZAÇÃO TEMÁTICA</span>
          <h1>Listas de Leitura</h1>
          <p className="library-subtitle">
            Cria coleções personalizadas para agrupar obras por tema, objetivo
            ou estado.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateDialog(true)}
          aria-label="Criar nova lista de leitura"
        >
          <FolderPlus size={16} /> Nova lista
        </Button>
      </header>

      {/* Create List Modal */}
      {showCreateDialog && (
        <Modal
          open
          onClose={() => setShowCreateDialog(false)}
          title="Criar nova lista de leitura"
        >
          <form onSubmit={handleCreate}>
            <div className="form-group mt-3">
              <label htmlFor="list-title" className="field-label">
                Nome da lista
              </label>
              <input
                id="list-title"
                type="text"
                placeholder="Ex.: Narrativas Costeiras e Ficção Especulativa"
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="list-desc" className="field-label">
                Descrição (opcional)
              </label>
              <textarea
                id="list-desc"
                rows={3}
                placeholder="Explica o propósito desta seleção de obras..."
                value={listDesc}
                onChange={(e) => setListDesc(e.target.value)}
                className="comment-textarea"
              />
            </div>

            <div className="modal-actions mt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!listTitle.trim()}
              >
                Criar lista
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {lists.length === 0 ? (
        <div className="library-empty-state">
          <FolderPlus size={42} className="empty-icon" />
          <h2>Ainda não tens listas de leitura personalizadas</h2>
          <p>
            Agrupa as tuas obras em coleções como "Favoritas de Poesia",
            "Histórias de Verão" ou "Estudos Literários".
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreateDialog(true)}
            className="mt-3"
          >
            Criar primeira lista
          </Button>
        </div>
      ) : (
        <div className="lists-grid">
          {lists.map((list) => (
            <article key={list.id} className="list-card">
              <header className="list-card-header">
                <span className="list-item-count">
                  {list.workIds.length}{" "}
                  {list.workIds.length === 1 ? "obra" : "obras"}
                </span>
                <span className="list-date">Atualizada a {list.updatedAt}</span>
              </header>

              <h2 className="list-card-title">
                <Link to={`/biblioteca/listas/${list.id}`}>{list.title}</Link>
              </h2>

              <p className="list-card-description">
                {list.description ||
                  "Coleção de obras organizada pelo utilizador."}
              </p>

              <footer className="list-card-footer">
                <Link
                  to={`/biblioteca/listas/${list.id}`}
                  className="text-link text-sm inline-flex items-center gap-1"
                >
                  Ver obras da lista <ArrowRight size={13} />
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// 5. Reading List Detail Page: /biblioteca/listas/:id
export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, entries, store } = useLibrary();

  const list = lists.find((l) => l.id === id);

  if (!list) {
    return (
      <div className="container library-page">
        <div className="library-empty-state">
          <h2>Lista de leitura não encontrada</h2>
          <p>
            A lista que procuras pode ter sido removida ou o endereço está
            incorreto.
          </p>
          <Link to="/biblioteca/listas" className="button secondary mt-3">
            Voltar às listas
          </Link>
        </div>
      </div>
    );
  }

  const listWorks = entries.filter((e) => list.workIds.includes(e.workId));

  return (
    <div className="container library-page">
      <nav className="library-breadcrumb" aria-label="Navegação da lista">
        <Link to="/biblioteca/listas" className="text-link">
          ← Voltar a todas as listas
        </Link>
      </nav>

      <header className="library-header">
        <div>
          <span className="eyebrow">LISTA DE LEITURA</span>
          <h1>{list.title}</h1>
          <p className="library-subtitle">
            {list.description || "Coleção de obras organizada pelo leitor."}
          </p>
          <div className="list-meta-info">
            <span>
              {listWorks.length} {listWorks.length === 1 ? "obra" : "obras"}
            </span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span>Criada em {list.createdAt}</span>
          </div>
        </div>

        <div className="library-header-actions">
          <Button
            variant="ghost"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm(
                  `Tens a certeza de que desejas eliminar a lista "${list.title}"?`,
                )
              ) {
                store.deleteList(list.id);
                navigate("/biblioteca/listas");
              }
            }}
            aria-label="Eliminar lista de leitura"
          >
            <Trash2 size={16} /> Eliminar lista
          </Button>
        </div>
      </header>

      {listWorks.length === 0 ? (
        <div className="library-empty-state">
          <BookOpen size={42} className="empty-icon" />
          <h2>Esta lista ainda não contém obras</h2>
          <p>
            Navega pela biblioteca ou pelo catálogo para adicionar obras a esta
            lista.
          </p>
          <Link to="/biblioteca" className="button primary mt-3">
            Ver a minha biblioteca →
          </Link>
        </div>
      ) : (
        <div className="library-list-view">
          {listWorks.map((entry) => (
            <article key={entry.workId} className="library-list-item">
              <div className="library-list-main">
                <div className="library-meta-line">
                  <span>{entry.format}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>{entry.genre}</span>
                </div>
                <h2 className="library-list-title">
                  <Link to={`/obras/${entry.workId}`}>{entry.title}</Link>
                </h2>
                <p className="library-card-author">por {entry.author}</p>
              </div>

              <div className="library-list-actions">
                <Button
                  variant="ghost"
                  onClick={() => store.toggleWorkInList(list.id, entry.workId)}
                  title="Remover desta lista"
                  aria-label="Remover obra desta lista"
                >
                  <Trash2 size={15} />
                </Button>
                <Link to={getReaderLink(entry)} className="button primary">
                  Ler
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
