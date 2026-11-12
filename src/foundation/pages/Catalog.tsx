import { usePublicCatalog } from "../features/catalog/PublicCatalog";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, PageIntro } from "../components/Discovery";
import { WorkCollection } from "../components/WorkCollection";
export default function Catalog() {
  const catalog = usePublicCatalog();
  return (
    <div className="container catalog-page">
      <PageIntro
        eyebrow="O ARQUIVO, À TUA MANEIRA"
        title="Um mundo de histórias."
        description="Todas as formas de imaginar, num só lugar. Percorre o catálogo ou deixa os filtros guiar a descoberta."
      />
      <div className="catalog-context">
        <DemoNotice />
        <Link className="text-link" to="/pesquisa">
          Pesquisa avançada <ArrowUpRight size={16} />
        </Link>
      </div>
      <section aria-label="Publicações de autores">
        <h2>Publicações de autores e conteúdo editorial</h2>
        <p>
          As obras de autores são publicações reais; a conteúdo editorial é
          conteúdo editorial local, sem proprietário de conta atribuído.
        </p>
        {catalog.loading && <p role="status">A carregar publicações…</p>}
        {catalog.error && <p role="alert">{catalog.error}</p>}
        {!catalog.repository?.search &&
          !catalog.loading &&
          !catalog.error &&
          !catalog.published.length && (
            <p>Sem publicações de autores disponíveis.</p>
          )}
        {!catalog.repository && (
          <p>O catálogo de autores não está configurado neste ambiente.</p>
        )}
        <button
          className="button secondary"
          disabled={catalog.loading}
          onClick={catalog.refresh}
        >
          Atualizar catálogo
        </button>
      </section>
      <WorkCollection works={catalog.works} />
      <div className="notice">
        As obras editoriais mantêm datas de preparação local. Nas obras de
        autores, a data indica a última publicação confirmada.
      </div>
    </div>
  );
}
