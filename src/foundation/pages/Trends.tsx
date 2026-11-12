import { Link } from "react-router-dom";
import { PageIntro } from "../components/Discovery";
import { EmptyState } from "../components/ui";
export default function Trends() {
  return (
    <div className="container discovery-page">
      <PageIntro
        eyebrow="DESCOBERTA"
        title="O que nos move a imaginar."
        description="Encontra novas leituras no catálogo de publicações dos autores."
      />
      <EmptyState title="Ainda não há tendências disponíveis">
        <p>Não existem métricas ou seleções confirmadas para apresentar.</p>
        <Link className="button secondary" to="/catalogo">
          Explorar obras publicadas →
        </Link>
      </EmptyState>
    </div>
  );
}
