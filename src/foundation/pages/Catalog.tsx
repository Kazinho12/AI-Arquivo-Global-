import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { worksRepository } from "../lib/worksRepository";
import { DemoNotice, PageIntro } from "../components/Discovery";
import { WorkCollection } from "../components/WorkCollection";
export default function Catalog() {
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
      <WorkCollection works={worksRepository.list()} />
      <div className="notice">
        As datas e os conteúdos pertencem a exemplos fictícios. Ainda não
        existem publicações reais nesta versão.
      </div>
    </div>
  );
}
