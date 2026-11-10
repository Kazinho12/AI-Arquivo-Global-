import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, SearchField, Select } from "../components/ui";
import {
  CompletionPage,
  PortalNav,
  ResourceState,
  useResource,
} from "../features/completion/ui";
import { productRoutes } from "../app/routes";
import { inauguralWorks } from "../data/inaugural";
function SystemShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <CompletionPage
      compact
      eyebrow="SISTEMA"
      title={title}
      description={description}
    >
      <PortalNav system />
      {children}
    </CompletionPage>
  );
}
function Restricted({ name }: { name: "services" | "logs" | "monitoring" }) {
  const { result, retry } = useResource(name, false);
  return (
    <ResourceState
      result={result}
      retry={retry}
      empty
      emptyTitle="Sem dados disponíveis"
    >
      <p>Sem dados disponíveis.</p>
    </ResourceState>
  );
}
export function SystemPage() {
  return (
    <SystemShell
      title="Visão geral do sistema"
      description="Áreas de consulta operacional, sem inventar audiência, saúde do serviço ou contagens de utilizadores."
    >
      <Restricted name="services" />
      <div className="completion-two-columns">
        <article className="completion-card">
          <h2>Referência do frontend</h2>
          <p>
            Informações públicas da aplicação e verificações locais do
            manifesto.
          </p>
          <Link className="text-link" to="/sistema/informacoes">
            Consultar informações →
          </Link>
        </article>
        <article className="completion-card">
          <h2>Verificações locais</h2>
          <p>
            Integridade das rotas e identificadores. Não substitui testes ou
            monitorização de produção.
          </p>
          <Link className="text-link" to="/sistema/testes">
            Abrir verificações →
          </Link>
        </article>
      </div>
    </SystemShell>
  );
}
export function SystemLogsPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  return (
    <SystemShell
      title="Registos de atividade"
      description="Os registos operacionais exigem uma fonte autorizada; não há eventos fictícios."
    >
      <div className="completion-toolbar">
        <SearchField
          label="Pesquisar registos"
          placeholder="Evento, serviço ou referência…"
          value={query}
          onChange={setQuery}
        />
        <Select
          label="Nível do evento"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="">Todos os níveis</option>
          <option>Informação</option>
          <option>Aviso</option>
          <option>Erro</option>
        </Select>
      </div>
      <Restricted name="logs" />
    </SystemShell>
  );
}
export function SystemLogDetailPage() {
  const { id } = useParams();
  return (
    <SystemShell
      title="Detalhe do registo"
      description="A consulta de um evento requer permissão e confirmação do serviço."
    >
      <Link className="text-link" to="/sistema/logs">
        ← Voltar aos registos
      </Link>
      <p className="completion-footnote">Referência solicitada: {id}</p>
      <Restricted name="logs" />
    </SystemShell>
  );
}
export function SystemServicesPage() {
  const [query, setQuery] = useState("");
  return (
    <SystemShell
      title="Serviços"
      description="Sem health checks ou estado remoto certificado. Esta tela não consulta configuração privada."
    >
      <SearchField
        label="Pesquisar serviços"
        placeholder="Nome do serviço…"
        value={query}
        onChange={setQuery}
      />
      <Restricted name="services" />
    </SystemShell>
  );
}
export function SystemMonitoringPage() {
  const [period, setPeriod] = useState("15");
  return (
    <SystemShell
      title="Monitorização"
      description="Latência, pedidos, erros e disponibilidade permanecem desconhecidos até existir telemetria autorizada."
    >
      <Select
        label="Janela de consulta futura"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
      >
        <option value="15">15 minutos</option>
        <option value="60">1 hora</option>
        <option value="1440">24 horas</option>
      </Select>
      <Restricted name="monitoring" />
    </SystemShell>
  );
}
export function SystemInformationPage() {
  return (
    <SystemShell
      title="Informações do sistema"
      description="Características públicas confirmadas do frontend; sem ambiente, segredos ou dados pessoais."
    >
      <div className="completion-two-columns">
        <article className="completion-card">
          <h2>Arquivo Global 2.0</h2>
          <dl className="completion-definition">
            <dt>Interface</dt>
            <dd>React 19, TypeScript e Vite</dd>
            <dt>Navegação</dt>
            <dd>57 rotas canónicas e sete layouts</dd>
            <dt>Catálogo</dt>
            <dd>Edição inaugural preparada localmente</dd>
            <dt>Autoria</dt>
            <dd>Rascunhos locais separados do catálogo editorial</dd>
          </dl>
        </article>
        <article className="completion-card">
          <h2>Fronteiras dos dados</h2>
          <p>
            Supabase é utilizado pelo código Auth/perfis, condicionado à
            configuração do serviço. Obras e coleções editoriais são dados
            locais; rascunhos e biblioteca pertencem ao espaço do navegador. R2
            não está integrado.
          </p>
          <Link className="text-link" to="/privacidade">
            Consultar descrição técnica dos dados →
          </Link>
        </article>
      </div>
    </SystemShell>
  );
}
export function SystemTestsPage() {
  const [results, setResults] = useState<
    { name: string; ok: boolean }[] | null
  >(null);
  return (
    <SystemShell
      title="Testes da interface"
      description="Verificações públicas, determinísticas e locais. Não executam CI, SQL ou comandos administrativos."
    >
      <article className="completion-card">
        <h2>Integridade do frontend</h2>
        <Button
          onClick={() =>
            setResults([
              {
                name: "57 rotas únicas no manifesto",
                ok:
                  productRoutes.length === 57 &&
                  new Set(productRoutes.map((r) => r.path)).size === 57,
              },
              {
                name: "Sete layouts registados",
                ok: new Set(productRoutes.map((r) => r.layout)).size === 7,
              },
              {
                name: "Obras editoriais com IDs únicos",
                ok:
                  new Set(inauguralWorks.map((w) => w.id)).size ===
                  inauguralWorks.length,
              },
              {
                name: "Rotas de sistema no layout restrito",
                ok: productRoutes
                  .filter((r) => r.path.startsWith("/sistema"))
                  .every((r) => r.layout === "system"),
              },
            ])
          }
        >
          Executar verificações locais
        </Button>
        <div aria-live="polite">
          {results ? (
            <ul className="completion-list">
              {results.map((r) => (
                <li key={r.name}>
                  {r.ok ? "Aprovado" : "Falhou"} · {r.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma verificação executada nesta página.</p>
          )}
        </div>
      </article>
    </SystemShell>
  );
}
