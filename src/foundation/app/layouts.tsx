import { QuickSearch } from "../features/catalog/QuickSearch";
import { LocalDataTools } from "../features/local/LocalDataTools";
import { AuthHeaderLinks } from "../features/auth/components";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Globe2, Menu, Moon, Sun, X, PenLine } from "lucide-react";
import { useTheme } from "./providers";
import { Button } from "../components/ui";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Arquivo Global — início">
      <span className="brand-mark" aria-hidden="true" />
      <span>
        ARQUIVO
        <span>
          GLOBAL<span className="brand-dot">.</span>
        </span>
      </span>
    </Link>
  );
}
const publicLinks = [
  ["/explorar", "Explorar"],
  ["/catalogo", "Catálogo"],
  ["/categorias", "Categorias"],
  ["/tendencias", "Tendências"],
];
function Header() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Saltar para o conteúdo
      </a>
      <header className="header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegação principal">
            {publicLinks.map(([to, label]) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <QuickSearch />
            <Button
              variant="ghost"
              onClick={toggle}
              aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
            <div className="auth-desktop">
              <AuthHeaderLinks />
            </div>
            <Link className="button secondary publish-link" to="/estudio">
              <PenLine size={16} /> Começar a publicar
            </Link>
            <Button
              id="navigation-toggle"
              className="mobile-menu"
              variant="ghost"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? "Fechar navegação" : "Abrir navegação"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-navigation"
            aria-label="Navegação móvel"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                document.getElementById("navigation-toggle")?.focus();
              }
            }}
          >
            {[
              ...publicLinks,
              ["/biblioteca", "Biblioteca"],
              ["/estudio", "Estúdio"],
            ].map(([to, label]) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
            <AuthHeaderLinks mobile />
          </nav>
        )}
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer>
      <div className="container footer-main">
        <div>
          <Brand />
          <p>
            Um lugar para todas as histórias.
            <br />
            Um mundo para a tua imaginação.
          </p>
        </div>
        <div>
          <span className="eyebrow">DESCOBRIR</span>
          <Link to="/catalogo">Catálogo de obras</Link>
          <Link to="/categorias">Formatos e categorias</Link>
          <Link to="/tags">Explorar tags</Link>
        </div>
        <div>
          <span className="eyebrow">FAZER PARTE</span>
          <Link to="/registar">Criar conta</Link>
          <Link to="/estudio">Estúdio de criação</Link>
          <Link to="/ajuda">Centro de ajuda</Link>
        </div>
        <div>
          <span className="eyebrow">ARQUIVO GLOBAL</span>
          <Link to="/regras">Regras da comunidade</Link>
          <Link to="/privacidade">Privacidade</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Arquivo Global</span>
        <span>Aberto à imaginação. Livre para criar.</span>
      </div>
    </footer>
  );
}
export function PublicLayout() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
function Workspace({
  name,
  links,
  restricted = false,
}: {
  name: string;
  links: string[][];
  restricted?: boolean;
}) {
  return (
    <>
      <Header />
      <div className="container workspace">
        <aside aria-label={`Navegação — ${name}`}>
          <span className="eyebrow">{name}</span>
          {links.map(([to, label]) => (
            <NavLink end key={to} to={to}>
              {label}
            </NavLink>
          ))}
          {restricted && (
            <small>Acesso depende de autorização no servidor.</small>
          )}
        </aside>
        <main id="conteudo" tabIndex={-1}>
          {(name === "Estúdio" || name === "A tua conta") && <LocalDataTools />}
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
export function AuthLayout() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1} className="auth-shell">
        <div className="auth-aside">
          <BookOpen size={42} />
          <h2>Há um mundo à espera da tua história.</h2>
          <p>Ler, criar e descobrir. Um arquivo de possibilidades.</p>
        </div>
        <div>
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
}
export function ReaderLayout() {
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Saltar para o conteúdo
      </a>
      <header className="reader-header">
        <Brand />
        <Link to="/catalogo">← Voltar ao catálogo</Link>
      </header>
      <main className="container reader-shell" id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
export function StudioLayout() {
  return (
    <Workspace
      name="Estúdio"
      links={[
        ["/estudio", "Visão geral"],
        ["/estudio/obras/nova", "Nova obra"],
        ["/estudio/publicacoes", "Publicações"],
        ["/estudio/estatisticas", "Estatísticas"],
        ["/estudio/media", "Media"],
      ]}
    />
  );
}
export function AccountLayout() {
  return (
    <Workspace
      name="A tua conta"
      links={[
        ["/biblioteca", "Biblioteca"],
        ["/biblioteca/favoritos", "Favoritos"],
        ["/biblioteca/historico", "Histórico"],
        ["/biblioteca/listas", "Listas"],
        ["/notificacoes", "Notificações"],
        ["/definicoes", "Definições"],
        ["/definicoes/aparencia", "Aparência"],
        ["/definicoes/acessibilidade", "Acessibilidade"],
      ]}
    />
  );
}
export function ModerationLayout() {
  return (
    <Workspace
      name="Moderação"
      restricted
      links={[
        ["/moderacao", "Visão geral"],
        ["/moderacao/denuncias", "Denúncias"],
      ]}
    />
  );
}
export function SystemLayout() {
  return (
    <Workspace
      name="Sistema"
      restricted
      links={[
        ["/sistema", "Visão geral"],
        ["/sistema/logs", "Registos"],
        ["/sistema/servicos", "Serviços"],
        ["/sistema/monitorizacao", "Monitorização"],
        ["/sistema/informacoes", "Informações"],
        ["/sistema/testes", "Testes"],
      ]}
    />
  );
}
