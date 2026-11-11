import { usePublicCatalog } from "../features/catalog/PublicCatalog";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { DemoNotice, PageIntro } from "../components/Discovery";
import { WorkCollection } from "../components/WorkCollection";
export default function Search() {
  return (
    <div className="container discovery-page">
      <div className="search-intro">
        <SearchIcon size={30} strokeWidth={1} />
        <PageIntro
          eyebrow="ENCONTRA O FIO DA HISTÓRIA"
          title="Pesquisa avançada."
          description="Lembras-te de um título, de uma voz ou de uma frase? Escolhe onde procurar e combina formato, género e tags."
        />
      </div>
      <DemoNotice />
      <WorkCollection works={usePublicCatalog().works} advanced />
      <aside className="search-tips panel">
        <h2>Uma boa pista muda tudo.</h2>
        <p>
          A pesquisa ignora acentos e maiúsculas. Várias palavras têm de estar
          presentes no campo escolhido; várias tags são combinadas entre si.
        </p>
        <div className="actions">
          <Link className="text-link" to="/pesquisa?q=cartografa&campo=sinopse">
            Experimentar “cartógrafa” na sinopse →
          </Link>
          <Link className="text-link" to="/tags">
            Descobrir por tags →
          </Link>
        </div>
      </aside>
    </div>
  );
}
