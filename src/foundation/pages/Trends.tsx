import { usePublicCatalog } from "../features/catalog/PublicCatalog";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Info } from "lucide-react";
import { DemoNotice, PageIntro, WorkSection } from "../components/Discovery";
import { EmptyState } from "../components/ui";
import { editorialSelections, selectEditorialWorks } from "../data/editorial";
export default function Trends() {
  const [params] = useSearchParams();
  const selection = params.get("selecao") ?? "";
  const entries = selection
    ? editorialSelections.filter((s) => s.id === selection)
    : editorialSelections;
  const works = usePublicCatalog().works;
  return (
    <div className="container discovery-page">
      <div className="trends-intro">
        <PageIntro
          eyebrow="SELEÇÕES / CONTEÚDO EDITORIAL"
          title="O que nos move a imaginar."
          description="Uma montra de afinidades, encontros e possibilidades. Percursos editoriais para descobrir o catálogo com outro olhar."
        />
        <Sparkles size={70} strokeWidth={0.7} />
      </div>
      <div className="editorial-transparency">
        <Info size={22} />
        <div>
          <h2>Seleções editoriais, sem rankings.</h2>
          <p>
            Ainda não existem métricas reais de leitura, avaliações ou
            popularidade. Estas seleções são preparadas pela Equipa Editorial
            com peças originais criadas para o projeto. A ordem não representa
            desempenho nem preferência de utilizadores.
          </p>
        </div>
      </div>
      <DemoNotice />
      <nav className="discovery-tabs" aria-label="Seleções editoriais">
        <Link to="/tendencias" aria-current={!selection ? "page" : undefined}>
          Todas as seleções
        </Link>
        {editorialSelections.map((s) => (
          <Link
            key={s.id}
            to={`/tendencias?selecao=${s.id}`}
            aria-current={selection === s.id ? "page" : undefined}
          >
            {s.title}
          </Link>
        ))}
      </nav>
      {entries.length ? (
        entries.map((s) => (
          <div id={s.id} key={s.id}>
            <WorkSection
              title={s.title}
              eyebrow={s.label}
              description={`${s.description}`}
              works={selectEditorialWorks(works, s)}
              to="/explorar"
              linkLabel="Outros caminhos"
            />
          </div>
        ))
      ) : (
        <EmptyState title="Seleção editorial desconhecida">
          Escolhe uma das seleções acima para continuar a explorar.
        </EmptyState>
      )}
      <div className="editorial-closing">
        <span className="eyebrow">A DESCOBERTA NÃO TERMINA AQUI</span>
        <h2>O teu próximo caminho pode ser uma palavra.</h2>
        <Link className="button secondary" to="/tags">
          Explorar o diretório de tags →
        </Link>
      </div>
    </div>
  );
}
