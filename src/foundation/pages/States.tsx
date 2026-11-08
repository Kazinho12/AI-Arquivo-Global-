import { Link, useParams } from "react-router-dom";
import { Construction, LockKeyhole, ArrowLeft } from "lucide-react";
import type { RouteDefinition } from "../app/routes";
import { ActionLink, Badge, Button } from "../components/ui";
import { useTheme } from "../app/providers";
import { worksRepository } from "../lib/worksRepository";
import { Cover } from "../components/WorkCard";
export function DevelopmentPage({ route }: { route: RouteDefinition }) {
  const params = useParams();
  const { theme, toggle } = useTheme();
  const restricted = route.layout === "moderation" || route.layout === "system";
  const account = ["account", "studio", "auth"].includes(route.layout);
  return (
    <section className="development-page">
      <div className="state-icon">
        {restricted || account ? (
          <LockKeyhole size={28} />
        ) : (
          <Construction size={28} />
        )}
      </div>
      <Badge>{restricted ? "Acesso indisponível" : "Em desenvolvimento"}</Badge>
      <h1>{route.title}</h1>
      <p>
        {restricted
          ? "Esta área exige autenticação e autorização verificadas no servidor. Nenhuma ferramenta administrativa, registo ou informação operacional está disponível neste protótipo."
          : account
            ? "Esta área está preparada para uma próxima etapa. A autenticação, os dados da conta e as operações de publicação ainda não estão ligados a um backend."
            : "Esta página faz parte da fundação do Arquivo Global. O conteúdo e as funcionalidades serão construídos numa etapa futura."}
      </p>
      {!restricted && Object.values(params).length > 0 && (
        <p className="route-context">
          Referência: {Object.values(params).join(" / ")}
        </p>
      )}
      {route.path === "/definicoes/aparencia" && (
        <Button variant="secondary" onClick={toggle}>
          Tema atual: {theme === "dark" ? "escuro" : "claro"} · Alternar
        </Button>
      )}
      <div className="actions">
        <ActionLink to="/catalogo">Explorar demonstração</ActionLink>
        <Link to="/" className="text-link">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
export function NotFound() {
  return (
    <section className="container not-found">
      <span className="eyebrow">PÁGINA NÃO ENCONTRADA</span>
      <div className="error-number">
        404<span>✧</span>
      </div>
      <h1>Esta página ainda não foi escrita.</h1>
      <p>O endereço pode ter mudado. Há outras histórias à tua espera.</p>
      <ActionLink to="/">Voltar ao início</ActionLink>
    </section>
  );
}
export function WorkDetail() {
  const { id } = useParams();
  const work = worksRepository.find(id ?? "");
  if (!work) return <NotFound />;
  return (
    <section className="container work-preview">
      <div>
        <Cover work={work} />
      </div>
      <div>
        <Link className="text-link" to="/catalogo">
          <ArrowLeft size={16} /> Catálogo
        </Link>
        <p>
          <Badge>Obra e autor fictícios · Demonstração</Badge>
        </p>
        <h1>{work.title}</h1>
        <p>
          {work.author} · {work.format} · {work.genre}
        </p>
        <p className="literary">{work.synopsis}</p>
        <div className="work-tags">
          {work.tags.map((tag) => (
            <Link
              key={tag}
              to={`/tags/${encodeURIComponent(tag.toLocaleLowerCase("pt"))}`}
            >
              {tag}
            </Link>
          ))}
        </div>
        <div className="notice">
          Pré-visualização demonstrativa. A página completa, os capítulos e as
          funções de biblioteca serão desenvolvidos numa próxima etapa.
        </div>
      </div>
    </section>
  );
}
