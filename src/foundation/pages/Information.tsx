import { institutionalContent } from "../data/inaugural";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, HelpCircle, PenLine, Shield } from "lucide-react";
import { SearchField } from "../components/ui";
import { filterText } from "../features/completion/data";
import { CompletionPage } from "../features/completion/ui";
const questions = [
  {
    title: "Onde explorar a comunidade?",
    answer:
      "A atividade apresenta um anúncio editorial local. As coleções reúnem as peças inaugurais ou as tuas listas privadas do navegador. Não são inventados seguidores ou interações sociais.",
    to: "/atividade",
    link: "Explorar comunidade",
  },
  {
    title: "Como encontrar uma obra?",
    answer:
      "Abre o catálogo ou a pesquisa. Podes combinar formato, género e tags; os resultados atuais pertencem ao catálogo inaugural.",
    to: "/catalogo",
    link: "Explorar catálogo",
  },
  {
    title: "Como retomar uma leitura?",
    answer:
      "Os leitores públicos registam a última posição na biblioteca deste navegador. Abre o histórico para retomar; as pré-visualizações do Estúdio não escrevem histórico.",
    to: "/biblioteca/historico",
    link: "Abrir histórico",
  },
  {
    title: "Onde ficam os meus rascunhos?",
    answer:
      "O Estúdio guarda textos localmente e imagens em IndexedDB, separados por conta ou visitante. Não existe sincronização entre dispositivos nem publicação pública.",
    to: "/estudio",
    link: "Abrir Estúdio",
  },
  {
    title: "Como fazer uma cópia dos dados?",
    answer:
      "Usa Cópias e recuperação de dados locais no Estúdio ou na conta. Exporta antes de limpar o navegador. Se houver falha de gravação, mantém a aba aberta e exporta o conteúdo em memória.",
    to: "/definicoes/privacidade",
    link: "Ver ferramentas de dados",
  },
  {
    title: "Como ajustar o conforto de leitura?",
    answer:
      "As definições globais são partilhadas pelos quatro leitores. Um ajuste no leitor pode criar uma preferência específica desse formato. Movimento reduzido do sistema é respeitado.",
    to: "/definicoes/leitura",
    link: "Preferências de leitura",
  },
  {
    title: "O login Google está disponível?",
    answer:
      "A interface usa Supabase Auth. Google depende da configuração do fornecedor e dos redirecionamentos no projeto. Não é possível certificar essa configuração pela presença da tela de login.",
    to: "/entrar",
    link: "Abrir entrada",
  },
  {
    title: "Como enviar uma denúncia?",
    answer:
      "O formulário permite preparar e verificar os campos, mas o envio está desativado porque ainda não existe um serviço remoto de denúncias. Não é um canal de atendimento ativo.",
    to: "/denunciar",
    link: "Ver formulário demonstrativo",
  },
];
export function HelpPage() {
  const [query, setQuery] = useState("");
  const items = questions.filter((q) =>
    filterText(q.title + " " + q.answer, query),
  );
  return (
    <CompletionPage
      eyebrow="UM GUIA PARA EXPLORAR"
      title="Como podemos ajudar?"
      description="Orientações sobre o que já funciona e os limites atuais do Arquivo Global."
    >
      <div className="completion-quick-links">
        {[
          [BookOpen, "Ler e descobrir", "/catalogo"],
          [PenLine, "Criar e preservar", "/estudio"],
          [Shield, "Dados e privacidade", "/definicoes/privacidade"],
        ].map(([Icon, title, to]) => {
          const Symbol = Icon as typeof BookOpen;
          return (
            <Link className="completion-card" key={String(to)} to={String(to)}>
              <Symbol size={24} />
              <h2>{String(title)}</h2>
              <span>Consultar →</span>
            </Link>
          );
        })}
      </div>
      <SearchField
        label="Pesquisar ajuda"
        placeholder="Leitura, rascunhos, conta…"
        value={query}
        onChange={setQuery}
      />
      <p role="status" className="completion-footnote">
        {items.length} tópicos encontrados
      </p>
      <div className="completion-faq">
        {items.map((q) => (
          <details key={q.title}>
            <summary>{q.title}</summary>
            <p>{q.answer}</p>
            <Link className="text-link" to={q.to}>
              {q.link} →
            </Link>
          </details>
        ))}
        {!items.length && (
          <div className="empty">
            <HelpCircle aria-hidden="true" />
            <h2>Nenhum tópico encontrado</h2>
            <p>Experimenta outro termo ou limpa a pesquisa.</p>
          </div>
        )}
      </div>
      <aside className="completion-demo">
        <p>
          Não existe serviço de suporte/contacto integrado. As páginas de regras
          e privacidade são rascunhos para revisão.
        </p>
        <Link className="text-link" to="/regras">
          Ver regras propostas →
        </Link>
      </aside>
    </CompletionPage>
  );
}
export function RulesPage() {
  return (
    <CompletionPage
      eyebrow="DOCUMENTO PARA REVISÃO"
      title="Regras da comunidade"
      description="Estrutura editorial proposta para uma comunidade de leitura e criação respeitosa."
    >
      <DraftNotice />
      <div className="completion-document">
        <nav aria-label="Índice das regras">
          <h2>Neste rascunho</h2>
          <a href="#rules-respect">Respeito e convivência</a>
          <a href="#rules-authorship">Autoria e contexto</a>
          <a href="#rules-safety">Sinalização de problemas</a>
          <a href="#rules-review">Revisão e aplicação</a>
        </nav>
        <article>
          <section id="rules-respect">
            <h2>Respeito e convivência</h2>
            <p>
              Proposta: promover diálogo respeitoso e evitar assédio,
              intimidação ou exposição de informação privada. O objetivo é
              tornar a descoberta e a criação confortáveis para pessoas com
              diferentes experiências.
            </p>
          </section>
          <section id="rules-authorship">
            <h2>Autoria e contexto</h2>
            <p>
              Proposta: identificar a autoria, descrever o contexto da obra e
              usar os campos de classificação e avisos de conteúdo disponíveis
              no Estúdio. A verificação de direitos e o processo editorial ainda
              precisam de definição e aprovação.
            </p>
          </section>
          <section id="rules-safety">
            <h2>Sinalização de problemas</h2>
            <p>
              O formulário de denúncia é demonstrativo e não transmite pedidos.
              Não há fila de atendimento ativa, prazos de resposta ou sistema de
              sanções implementado.
            </p>
            <Link className="text-link" to="/denunciar">
              Conhecer o formulário →
            </Link>
          </section>
          <section id="rules-review">
            <h2>Revisão e aplicação</h2>
            <p>
              Estes princípios não constituem termos oficiais em vigor.
              Categorias, decisões, revisão de medidas e canais de contacto
              precisam de aprovação editorial e de suporte técnico antes da
              publicação.
            </p>
            <Link className="text-link" to="/ajuda">
              Consultar ajuda sobre a versão atual →
            </Link>
          </section>
        </article>
      </div>
    </CompletionPage>
  );
}
function DraftNotice() {
  return (
    <div className="completion-draft" role="note">
      <strong>{institutionalContent.rulesStatus}</strong>
      <p>
        Esta interface apresenta uma estrutura para revisão. Não constitui
        política oficial, contrato ou garantia de serviço.
      </p>
    </div>
  );
}
export function PrivacyPage() {
  return (
    <CompletionPage
      eyebrow="TRANSPARÊNCIA · DOCUMENTO PARA REVISÃO"
      title="Privacidade e dados"
      description="O comportamento técnico atual e os temas que uma futura política aprovada deverá esclarecer."
    >
      <DraftNotice />
      <div className="completion-document">
        <nav aria-label="Índice de privacidade">
          <h2>Neste rascunho</h2>
          <a href="#privacy-local">Dados no navegador</a>
          <a href="#privacy-account">Conta e serviços externos</a>
          <a href="#privacy-control">Cópias e controlo</a>
          <a href="#privacy-pending">Antes de publicar</a>
        </nav>
        <article>
          <section id="privacy-local">
            <h2>Dados no navegador</h2>
            <p>
              Rascunhos, biblioteca e imagens são guardados localmente,
              separados por conta ou visitante. Preferências pertencem ao
              navegador. Comentários e avaliações são notas locais por obra. Não
              existe encriptação desses dados pela aplicação nem sincronização
              entre dispositivos.
            </p>
            <p>
              Limpar o armazenamento ou perder o perfil do navegador pode apagar
              dados. Quem controla esse perfil pode aceder ao armazenamento
              diretamente.
            </p>
          </section>
          <section id="privacy-account">
            <h2>Conta e serviços externos</h2>
            <p>
              Quando configurados e utilizados, Supabase Auth e o serviço de
              perfis processam operações de conta. O SDK gere a persistência e
              renovação da sessão. Google OAuth depende da configuração do
              fornecedor. O Estúdio não faz upload para R2 nem publica obras num
              backend.
            </p>
            <p>
              Não foram certificados nesta interface os serviços remotos,
              retenção, localização de processamento ou políticas dos
              fornecedores.
            </p>
          </section>
          <section id="privacy-control">
            <h2>Cópias e controlo</h2>
            <p>
              As ferramentas locais permitem exportar e recuperar cópias com
              confirmação. Uma exportação pode conter textos e imagens privados;
              guarda-a num local apropriado. Terminar a sessão não apaga
              automaticamente os rascunhos guardados.
            </p>
            <Link className="text-link" to="/definicoes/privacidade">
              Abrir opções e recuperação de dados →
            </Link>
          </section>
          <section id="privacy-pending">
            <h2>O que falta aprovar</h2>
            <p>
              Identificação do responsável, contactos, finalidades, fundamentos
              aplicáveis, retenção, direitos e pedidos, fornecedores e
              transferências necessitam de revisão pelo responsável antes de uma
              política oficial. Esta página não inventa compromissos ou
              garantias sobre esses temas.
            </p>
            <Link className="text-link" to="/ajuda">
              Consultar capacidades atuais →
            </Link>
          </section>
        </article>
      </div>
    </CompletionPage>
  );
}
