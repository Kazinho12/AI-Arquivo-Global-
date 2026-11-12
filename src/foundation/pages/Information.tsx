import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, PenLine, Shield } from "lucide-react";
import { SearchField } from "../components/ui";
import { filterText } from "../features/completion/data";
import { CompletionPage } from "../features/completion/ui";

export const institutionalEmail = "arquivoglobal.org@gmail.com";
export function contactHref(subject: string) {
  return `mailto:${institutionalEmail}?subject=${encodeURIComponent(subject)}`;
}
const related = [
  ["/ajuda", "Central de Ajuda"],
  ["/regras", "Regras da Comunidade"],
  ["/privacidade", "Política de Privacidade"],
  ["/contacto", "Contacto Institucional"],
];
function InstitutionalNav() {
  return (
    <nav className="institutional-links" aria-label="Páginas institucionais">
      {related.map(([to, label]) => (
        <Link key={to} to={to}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
type Section = { title: string; paragraphs: string[] };
function DocumentPage({
  title,
  description,
  sections,
  note,
}: {
  title: string;
  description: string;
  sections: Section[];
  note?: string;
}) {
  return (
    <CompletionPage
      eyebrow="ARQUIVO GLOBAL · UM ESPAÇO PARA CRIAR"
      title={title}
      description={description}
    >
      <InstitutionalNav />
      <div className="completion-document institutional-document">
        <nav aria-label={`Índice: ${title}`}>
          <h2>Nesta página</h2>
          {sections.map((s, i) => (
            <a href={`#section-${i}`} key={s.title}>
              {s.title}
            </a>
          ))}
        </nav>
        <article>
          {sections.map((s, i) => (
            <section id={`section-${i}`} key={s.title}>
              <h2>{s.title}</h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <section>
            <h2>Estamos à escuta</h2>
            <p>
              Para dúvidas, sugestões ou pedidos, escreve para{" "}
              <a className="text-link" href={contactHref(title)}>
                {institutionalEmail}
              </a>
              . Inclui apenas os dados necessários para compreender o assunto.
            </p>
          </section>
          {note && (
            <aside className="notice" role="note">
              {note}
            </aside>
          )}
        </article>
      </div>
    </CompletionPage>
  );
}
export function RulesPage() {
  return (
    <DocumentPage
      title="Regras da Comunidade"
      description="Liberdade para imaginar. Respeito para partilhar. Um compromisso que construímos contigo."
      sections={[
        {
          title: "Respeito e convivência",
          paragraphs: [
            "Respeita as pessoas, mesmo quando discordas das suas ideias. Não publiques ameaças, assédio, exposição de dados pessoais de terceiros ou incentivos à violência contra pessoas.",
          ],
        },
        {
          title: "Autoria e propriedade intelectual",
          paragraphs: [
            "Publica apenas textos e imagens para os quais tens os direitos ou autorizações necessários. Identifica a autoria com rigor e não te faças passar por outra pessoa. Os autores mantêm os direitos sobre as suas obras; poder ler uma obra não significa ter autorização para a reutilizar.",
            "Ao publicar, permites o alojamento e a apresentação do conteúdo necessários à sua disponibilização na plataforma. Isso não transfere a tua autoria. Obras de fãs também podem envolver direitos de terceiros: identifica o contexto e verifica as autorizações necessárias.",
          ],
        },
        {
          title: "Liberdade criativa e responsabilidade",
          paragraphs: [
            "Há lugar para diferentes vozes, géneros e experiências literárias. A publicação não depende de aprovação editorial prévia. Essa liberdade acompanha a responsabilidade pelo conteúdo que escolhes tornar público. A plataforma é gratuita na sua versão atual.",
          ],
        },
        {
          title: "Classificação etária e avisos",
          paragraphs: [
            "Preenche a classificação etária e os avisos de conteúdo com cuidado. Ajuda quem lê a fazer escolhas informadas, sem disfarçar temas sensíveis. Os filtros não substituem essa responsabilidade nem garantem uma verificação independente de cada obra.",
          ],
        },
        {
          title: "Publicação e retirada de obras",
          paragraphs: [
            "Guardar um rascunho não o publica. A publicação e a atualização da versão pública exigem confirmação no Estúdio. Podes continuar a trabalhar em privado sem mudar a versão que os leitores veem.",
            "Podes retirar uma publicação sem eliminar o rascunho. Isso impede novas consultas públicas pela aplicação, mas não elimina cópias anteriormente obtidas por terceiros.",
          ],
        },
        {
          title: "Denúncias e proteção da comunidade",
          paragraphs: [
            "Comunica problemas pelo email institucional. Indica a ligação do conteúdo e explica o motivo, evitando reproduzir dados sensíveis. O formulário de denúncia disponível na aplicação não envia pedidos; usa o email até existir um sistema de envio.",
          ],
        },
        {
          title: "Consequências de violações",
          paragraphs: [
            "Uma violação destas regras pode exigir análise e uma resposta adequada ao caso. Não existe um sistema automatizado de sanções ou um procedimento formal de recurso implementado. Não prometemos medidas automáticas nem prazos de resolução; esclarecimentos podem ser pedidos pelo email institucional.",
          ],
        },
        {
          title: "Compromisso comunitário",
          paragraphs: [
            "Ajuda-nos a manter um espaço onde a diversidade literária e o cuidado com as pessoas possam coexistir. Classifica com honestidade, respeita a autoria e comunica problemas com clareza.",
          ],
        },
      ]}
    />
  );
}
export function PrivacyPage() {
  return (
    <DocumentPage
      title="Política de Privacidade"
      description="Queremos que compreendas o que partilhas, o que permanece privado e quais os controlos ao teu alcance."
      note="A identificação completa do responsável, os fundamentos jurídicos, os prazos de conservação e as condições de transferências de dados ainda requerem revisão humana. Este texto não é uma certificação jurídica."
      sections={[
        {
          title: "A tua conta e o teu perfil",
          paragraphs: [
            "Os dados de conta permitem iniciar sessão e associar-te às tuas obras. O nome de utilizador, nome apresentado, biografia e fotografia fazem parte do perfil público. Não incluas informação confidencial nesses campos.",
          ],
        },
        {
          title: "Rascunhos e publicações",
          paragraphs: [
            "As obras e entradas guardadas no Estúdio ficam associadas à tua conta. Os rascunhos privados destinam-se ao proprietário; só a versão cuja publicação confirmas fica disponível aos leitores. Editar em privado não altera automaticamente a versão publicada.",
            "Retirar uma publicação remove o acesso público pela aplicação. Não podemos garantir a eliminação de cópias já obtidas por terceiros.",
          ],
        },
        {
          title: "Serviços que tornam isto possível",
          paragraphs: [
            "O Supabase processa autenticação, perfis e conteúdos guardados. Se escolheres iniciar sessão com Google, esse fornecedor também participa na autenticação. O serviço de fotografias utiliza Cloudflare Workers e R2 para receber e alojar imagens de perfil.",
            "A fotografia atual do perfil pode ser vista por visitantes. Substituir ou remover essa fotografia no perfil não significa que o ficheiro anterior seja imediatamente eliminado do armazenamento.",
          ],
        },
        {
          title: "O que fica no navegador",
          paragraphs: [
            "A sessão, preferências e dados de leitura podem permanecer neste navegador. As preferências do leitor e a continuidade da leitura são locais e não exigem conta. Dados locais antigos e cópias de recuperação também podem permanecer no dispositivo.",
            "Limpar o armazenamento pode eliminar esses dados. Terminar sessão não os apaga todos. Protege o acesso ao dispositivo e guarda com cuidado exportações que contenham textos privados.",
          ],
        },
        {
          title: "Segurança e controlos disponíveis",
          paragraphs: [
            "A aplicação distingue o acesso a dados privados e a conteúdos publicados, mas nenhum serviço pode prometer segurança absoluta. Podes editar o perfil, substituir ou remover a fotografia, gerir rascunhos e retirar publicações nos controlos disponíveis.",
            "Estas ações não equivalem a eliminar a conta nem todos os registos dos fornecedores. Não existe um mecanismo completo de eliminação de conta nesta interface.",
          ],
        },
        {
          title: "Pedidos sobre os teus dados",
          paragraphs: [
            "Envia pedidos de esclarecimento, acesso, correção ou eliminação para o contacto institucional, indicando o pedido e a conta a que se refere. Não envies passwords ou códigos de acesso. Pode ser necessário esclarecer a identidade e o âmbito do pedido antes de qualquer ação; este contacto não promete eliminação automática ou prazos não definidos.",
          ],
        },
      ]}
    />
  );
}
const questions = [
  {
    category: "Conta e perfil",
    title: "Como criar uma conta?",
    answer:
      "Abre Criar conta e preenche os dados pedidos. Segue as instruções apresentadas para concluir o registo e, quando solicitado, confirmar o email.",
    to: "/registar",
  },
  {
    category: "Conta e perfil",
    title: "Como iniciar sessão com Google?",
    answer:
      "Na página de entrada, escolhe Google e conclui a autorização no fornecedor. Se a operação falhar, verifica a mensagem apresentada e comunica o problema sem enviar credenciais.",
    to: "/entrar",
  },
  {
    category: "Conta e perfil",
    title: "Como atualizar o perfil?",
    answer:
      "Nas definições do perfil podes alterar o nome apresentado, a biografia e a fotografia. O perfil e a fotografia atual são públicos; evita informação confidencial.",
    to: "/perfil/editar",
  },
  {
    category: "Escrita e publicação",
    title: "Como publicar uma obra?",
    answer:
      "Cria a obra no Estúdio, preenche os metadados e guarda pelo menos uma entrada com conteúdo válido. Escolhe Publicar e confirma. A obra precisa de título, sinopse, formato, idioma e classificação etária válidos.",
    to: "/estudio",
  },
  {
    category: "Escrita e publicação",
    title: "Qual é a diferença entre rascunho e publicação?",
    answer:
      "O rascunho guardado é privado. Publicar cria uma versão para os leitores; alterações posteriores no rascunho só ficam públicas quando confirmas a atualização da publicação.",
    to: "/estudio",
  },
  {
    category: "Escrita e publicação",
    title: "Como editar ou retirar uma publicação?",
    answer:
      "Edita e guarda no Estúdio. Para mostrar as mudanças aos leitores, confirma a atualização pública. Para deixar de disponibilizar a obra, retira a publicação; o rascunho mantém-se e pode ser republicado.",
    to: "/estudio",
  },
  {
    category: "Leitura e comunidade",
    title: "Como funcionam as classificações?",
    answer:
      "A classificação etária e os avisos são indicados pelo autor e ajudam a escolher leituras. Os destaques gerais excluem conteúdo adulto e certas sinalizações; não são uma certificação de cada obra.",
    to: "/regras",
  },
  {
    category: "Leitura e comunidade",
    title: "Como retomar uma leitura?",
    answer:
      "O leitor guarda a continuidade localmente, neste navegador. Usa a opção de retomar disponível na obra. Limpar o armazenamento ou mudar de dispositivo pode tornar esse registo indisponível.",
    to: "/catalogo",
  },
  {
    category: "Contacto",
    title: "Como comunicar um problema técnico ou de conteúdo?",
    answer:
      "Escreve para o email institucional com a ligação da página, uma descrição e, para erros técnicos, os passos que levaram ao problema. Não envies passwords. O formulário de denúncia não transmite pedidos.",
    to: "/contacto",
  },
  {
    category: "Contacto",
    title: "Como contactar a plataforma ou fazer um pedido de privacidade?",
    answer:
      "Escolhe o assunto na página de contacto ou escreve para arquivoglobal.org@gmail.com. Inclui apenas a informação necessária para compreender o pedido.",
    to: "/contacto",
  },
];
export function HelpPage() {
  const [query, setQuery] = useState("");
  const items = questions.filter((q) =>
    filterText(`${q.category} ${q.title} ${q.answer}`, query),
  );
  return (
    <CompletionPage
      eyebrow="ESTAMOS AQUI PARA AJUDAR"
      title="Central de Ajuda"
      description="Respostas simples para começares a ler, criar e partilhar."
    >
      <InstitutionalNav />
      <div className="completion-quick-links">
        {[
          [BookOpen, "Ler e descobrir", "/catalogo"],
          [PenLine, "Criar e publicar", "/estudio"],
          [Shield, "Dados e privacidade", "/privacidade"],
        ].map(([Icon, title, to]) => {
          const Symbol = Icon as typeof BookOpen;
          return (
            <Link className="completion-card" key={String(to)} to={String(to)}>
              <Symbol size={24} aria-hidden="true" />
              <h2>{String(title)}</h2>
              <span>Explorar →</span>
            </Link>
          );
        })}
      </div>
      <SearchField
        label="Pesquisar na ajuda"
        placeholder="Conta, publicação, privacidade…"
        value={query}
        onChange={setQuery}
      />
      <p role="status" className="completion-footnote">
        {items.length} perguntas encontradas
      </p>
      {[...new Set(items.map((q) => q.category))].map((category) => (
        <section className="institutional-faq-group" key={category}>
          <h2>{category}</h2>
          <div className="completion-faq">
            {items
              .filter((q) => q.category === category)
              .map((q) => (
                <details key={q.title}>
                  <summary>{q.title}</summary>
                  <p>{q.answer}</p>
                  <Link className="text-link" to={q.to}>
                    Saber mais →
                  </Link>
                </details>
              ))}
          </div>
        </section>
      ))}
      {!items.length && (
        <div className="empty">
          <h2>Nenhuma resposta encontrada</h2>
          <p>Experimenta outro termo ou visita a página de contacto.</p>
          <Link to="/contacto">Contactar →</Link>
        </div>
      )}
    </CompletionPage>
  );
}
export function ContactPage() {
  const subjects = [
    "Dúvidas e sugestões",
    "Problemas técnicos",
    "Privacidade e dados pessoais",
    "Direitos de autor",
    "Denúncias de conteúdo",
    "Outros assuntos institucionais",
  ];
  return (
    <CompletionPage
      eyebrow="VAMOS CONVERSAR"
      title="Contacto Institucional"
      description="Uma dúvida, uma ideia ou algo que precisa da nossa atenção? Escreve-nos."
    >
      <InstitutionalNav />
      <div className="notice">
        <Mail aria-hidden="true" size={22} />
        <p>
          O nosso endereço oficial é{" "}
          <a className="text-link" href={contactHref("Contacto institucional")}>
            {institutionalEmail}
          </a>
          . Escolhe um assunto para abrir a tua aplicação de email.
        </p>
      </div>
      <div className="completion-quick-links">
        {subjects.map((subject) => (
          <a
            className="completion-card"
            key={subject}
            href={contactHref(subject)}
          >
            <h2>{subject}</h2>
            <span>Escrever email →</span>
          </a>
        ))}
      </div>
      <aside className="notice">
        <p>
          Para problemas técnicos, indica a página e os passos para reproduzir o
          erro. Para denúncias e direitos de autor, inclui a ligação do conteúdo
          e explica a situação. Não envies passwords, códigos de acesso ou dados
          sensíveis desnecessários. O formulário de denúncia da aplicação não
          envia pedidos; utiliza este email.
        </p>
      </aside>
    </CompletionPage>
  );
}
