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
      "As coleções e a biblioteca ajudam a organizar leituras. Os perfis apresentam as obras publicadas dos autores.",
    to: "/atividade",
    link: "Explorar comunidade",
  },
  {
    title: "Como encontrar uma obra?",
    answer:
      "Abre o catálogo ou a pesquisa. Podes combinar formato, género e tags; os resultados incluem obras publicadas e conteúdo editorial identificado.",
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
      "As obras e entradas guardadas no Estúdio são persistidas no Supabase na tua conta. A publicação exige confirmação e cria uma versão pública separada; alterações privadas só ficam públicas após nova atualização confirmada. Dados locais antigos permanecem no navegador.",
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
          Não existe serviço de suporte/contacto integrado. Consulta as regras e
          a descrição do tratamento de dados disponível nesta versão.
        </p>
        <Link className="text-link" to="/regras">
          Ver regras da comunidade →
        </Link>
      </aside>
    </CompletionPage>
  );
}
export function RulesPage() {
  return (
    <CompletionPage
      eyebrow="CONVIVÊNCIA E CRIAÇÃO"
      title="Regras da comunidade"
      description="Orientações para partilhar histórias com respeito pela autoria e pelas pessoas."
    >
      <div className="completion-document">
        <article>
          <section>
            <h2>Respeito e privacidade</h2>
            <p>
              Não publiques ameaças, assédio, exposição de dados pessoais de
              terceiros ou conteúdos que promovam violência contra pessoas.
              Respeita quem lê e quem cria.
            </p>
          </section>
          <section>
            <h2>Autoria e direitos</h2>
            <p>
              Partilha apenas textos e imagens que tens direito de publicar.
              Identifica a autoria com rigor e não te faças passar por outra
              pessoa. A disponibilização de uma obra não concede, por si só,
              autorização para a reutilizar.
            </p>
          </section>
          <section>
            <h2>Classificação e publicação</h2>
            <p>
              Preenche título, sinopse, formato, idioma, classificação etária e
              avisos de conteúdo de forma fiel. A classificação e os filtros
              ajudam a escolher leituras; não constituem uma verificação
              independente de cada obra.
            </p>
            <p>
              Guardar um rascunho não o publica. Publicar ou atualizar a
              publicação exige confirmação. Podes retirar a publicação no
              Estúdio sem eliminar o rascunho. Retirar uma obra impede novas
              consultas públicas pela aplicação, mas não apaga cópias já obtidas
              por leitores.
            </p>
          </section>
          <section>
            <h2>Limites de atendimento</h2>
            <p>
              O formulário de denúncia ainda não transmite pedidos. Não existe
              um canal de atendimento integrado, prazo de resposta ou
              procedimento automatizado de sanção ou recurso. Não o uses para
              comunicar uma urgência.
            </p>
            <Link className="text-link" to="/ajuda">
              Consultar ajuda →
            </Link>
          </section>
        </article>
      </div>
    </CompletionPage>
  );
}
export function PrivacyPage() {
  return (
    <CompletionPage
      eyebrow="TRANSPARÊNCIA"
      title="Privacidade e dados"
      description="Descrição do tratamento técnico de dados nas funcionalidades atuais do Arquivo Global."
    >
      <div className="completion-document">
        <article>
          <section>
            <h2>Conta e perfil público</h2>
            <p>
              O Supabase processa a autenticação, a sessão e os dados do perfil.
              O login Google, quando utilizado, envolve também esse fornecedor.
              O nome de utilizador, nome apresentado, biografia e fotografia do
              perfil podem ser consultados publicamente. Não coloques informação
              confidencial nesses campos.
            </p>
          </section>
          <section>
            <h2>Obras e versões públicas</h2>
            <p>
              O Estúdio guarda obras, metadados e entradas no Supabase. As
              regras de acesso distinguem dados privados do proprietário e
              versões publicadas. A publicação confirmada disponibiliza uma
              cópia pública; editar o rascunho não atualiza essa cópia
              automaticamente. A retirada de publicação remove o acesso público
              pela aplicação, sem garantir a eliminação de cópias feitas por
              terceiros.
            </p>
          </section>
          <section>
            <h2>Fotografia e serviços externos</h2>
            <p>
              As fotografias de perfil são enviadas ao serviço de media em
              Cloudflare Workers e armazenadas no Cloudflare R2. O envio utiliza
              a sessão autenticada. A rota pública verifica a referência atual
              do perfil antes de servir a imagem. Substituir ou remover a
              referência no perfil não significa que o ficheiro anterior seja
              imediatamente eliminado do armazenamento.
            </p>
          </section>
          <section>
            <h2>Dados neste navegador</h2>
            <p>
              A sessão, preferências e dados de leitura podem persistir no
              navegador. Preferências do leitor e continuidade de leitura são
              locais e não exigem login. Dados locais antigos e cópias de
              recuperação também podem permanecer no dispositivo. Limpar o
              armazenamento pode eliminá-los; terminar sessão não equivale a
              apagar todos os dados locais.
            </p>
            <p>
              Quem tem acesso ao perfil do navegador pode ter acesso a esses
              dados. Uma cópia exportada pode conter textos privados: guarda-a
              com cuidado.
            </p>
          </section>
          <section>
            <h2>Controlos e limites</h2>
            <p>
              Podes editar o perfil, substituir ou remover a fotografia, gerir
              rascunhos e retirar publicações através dos controlos disponíveis.
              Estas ações não representam um processo completo de eliminação da
              conta ou de todos os registos dos fornecedores.
            </p>
            <Link className="text-link" to="/definicoes/privacidade">
              Consultar opções de dados locais →
            </Link>
          </section>
          <section>
            <h2>Informação institucional pendente</h2>
            <p>
              A identificação e o contacto do responsável pelo tratamento, os
              fundamentos jurídicos aplicáveis, os prazos de conservação, a
              localização e as transferências de dados, e os canais para exercer
              direitos ainda necessitam de definição e revisão humana. Esta
              descrição técnica não substitui essa informação nem promete prazos
              ou garantias não implementados.
            </p>
          </section>
        </article>
      </div>
    </CompletionPage>
  );
}
