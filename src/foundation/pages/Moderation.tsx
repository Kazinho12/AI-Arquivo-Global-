import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchField, Select } from "../components/ui";
import {
  CompletionPage,
  ResourceState,
  useResource,
} from "../features/completion/ui";
function ModerationNav() {
  return (
    <nav className="completion-links" aria-label="Áreas de moderação">
      <Link className="button secondary" to="/moderacao">
        Visão geral
      </Link>
      <Link className="button secondary" to="/moderacao/denuncias">
        Fila de denúncias
      </Link>
    </nav>
  );
}
export function ModerationPage() {
  const { result, retry } = useResource("reports", false);
  return (
    <CompletionPage
      compact
      eyebrow="CUIDADO E REVISÃO"
      title="Moderação"
      description="Um espaço de análise responsável, dependente de autorização validada no servidor."
    >
      <ModerationNav />
      <ResourceState
        result={result}
        retry={retry}
        empty={result.status === "ready" && !result.data.length}
        emptyTitle="Sem denúncias disponíveis"
      >
        <p>
          O adaptador de moderação terá de fornecer dados autorizados antes de
          apresentar decisões.
        </p>
      </ResourceState>
      <p className="completion-footnote">
        Nenhum conteúdo foi removido, conta sancionada ou denúncia resolvida
        nesta interface.
      </p>
    </CompletionPage>
  );
}
export function ModerationReportsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const { result, retry } = useResource("reports", false);
  return (
    <CompletionPage
      compact
      eyebrow="MODERAÇÃO · REVISÃO"
      title="Gestão de denúncias"
      description="A fila real ficará disponível após integração do serviço e validação de permissões."
    >
      <ModerationNav />
      <div className="completion-toolbar">
        <SearchField
          label="Pesquisar denúncias"
          placeholder="Referência ou resumo…"
          value={query}
          onChange={setQuery}
        />
        <Select
          label="Estado da denúncia"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option>Por analisar</option>
          <option>Em análise</option>
          <option>Resolvida</option>
        </Select>
        <Select
          label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          <option>Conteúdo</option>
          <option>Conduta</option>
          <option>Direitos</option>
        </Select>
      </div>
      <ResourceState
        result={result}
        retry={retry}
        empty
        emptyTitle="Sem denúncias disponíveis"
      >
        <p>Nenhuma denúncia disponível.</p>
      </ResourceState>
      <p className="completion-footnote">
        Filtros preparados para integração. Dados e ações de moderação
        indisponíveis; a navegação não concede privilégios.
      </p>
    </CompletionPage>
  );
}
