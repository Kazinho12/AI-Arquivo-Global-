import { lazy, Suspense, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  matchPath,
} from "react-router-dom";
import { Providers } from "./providers";
import { productRoutes } from "./routes";
import {
  PublicLayout,
  AuthLayout,
  ReaderLayout,
  StudioLayout,
  AccountLayout,
  ModerationLayout,
  SystemLayout,
} from "./layouts";
import { NotFound } from "../pages/States";
import { LoadingState } from "../components/ui";
const Home = lazy(() => import("../pages/Home"));
const Catalog = lazy(() => import("../pages/Catalog"));
const Explore = lazy(() => import("../pages/Explore"));
const Search = lazy(() => import("../pages/Search"));
const Tags = lazy(() => import("../pages/Tags"));
const TagPage = lazy(() =>
  import("../pages/Tags").then((module) => ({ default: module.TagPage })),
);
const Categories = lazy(() => import("../pages/Categories"));
const Trends = lazy(() => import("../pages/Trends"));
const WorkDetail = lazy(() => import("../pages/Work"));
const discoveryPages = {
  "/": Home,
  "/explorar": Explore,
  "/catalogo": Catalog,
  "/pesquisa": Search,
  "/tags": Tags,
  "/tags/:slug": TagPage,
  "/categorias": Categories,
  "/tendencias": Trends,
  "/obras/:id": WorkDetail,
};
const authPages = {
  "/entrar": lazy(() =>
    import("../pages/Auth").then((module) => ({ default: module.LoginPage })),
  ),
  "/registar": lazy(() =>
    import("../pages/Auth").then((module) => ({
      default: module.RegisterPage,
    })),
  ),
  "/recuperar-senha": lazy(() =>
    import("../pages/Auth").then((module) => ({ default: module.RecoverPage })),
  ),
  "/redefinir-senha": lazy(() =>
    import("../pages/Auth").then((module) => ({ default: module.ResetPage })),
  ),
  "/confirmar-email": lazy(() =>
    import("../pages/Auth").then((module) => ({
      default: module.ConfirmEmailPage,
    })),
  ),
  "/boas-vindas": lazy(() =>
    import("../pages/Auth").then((module) => ({ default: module.WelcomePage })),
  ),
};
const profilePages = {
  "/utilizadores/:username": lazy(() =>
    import("../pages/Profile").then((module) => ({
      default: module.PublicProfilePage,
    })),
  ),
  "/perfil/editar": lazy(() =>
    import("../pages/Profile").then((module) => ({
      default: module.EditProfilePage,
    })),
  ),
  "/utilizadores/:username/seguidores": lazy(() =>
    import("../pages/Community").then((module) => ({
      default: module.FollowersPage,
    })),
  ),
};
const settingsPages = {
  "/definicoes": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsOverviewPage,
    })),
  ),
  "/definicoes/aparencia": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsAppearancePage,
    })),
  ),
  "/definicoes/leitura": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsReadingPage,
    })),
  ),
  "/definicoes/seguranca": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsSecurityPage,
    })),
  ),
  "/definicoes/privacidade": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsPrivacyPage,
    })),
  ),
  "/definicoes/acessibilidade": lazy(() =>
    import("../pages/Settings").then((module) => ({
      default: module.SettingsAccessibilityPage,
    })),
  ),
};
const readerPages = {
  "/obras/:id/capitulos/:capituloId": lazy(() =>
    import("../pages/Reader").then((module) => ({
      default: module.LiteraryReaderPage,
    })),
  ),
  "/obras/:id/paginas/:capituloId": lazy(() =>
    import("../pages/Reader").then((module) => ({
      default: module.VisualReaderPage,
    })),
  ),
  "/obras/:id/comentarios": lazy(() =>
    import("../pages/Reader").then((module) => ({
      default: module.CommentsPage,
    })),
  ),
  "/obras/:id/avaliacoes": lazy(() =>
    import("../pages/Reader").then((module) => ({
      default: module.ReviewsPage,
    })),
  ),
};
const libraryPages = {
  "/biblioteca": lazy(() =>
    import("../pages/Library").then((module) => ({
      default: module.LibraryOverviewPage,
    })),
  ),
  "/biblioteca/favoritos": lazy(() =>
    import("../pages/Library").then((module) => ({
      default: module.FavoritesPage,
    })),
  ),
  "/biblioteca/historico": lazy(() =>
    import("../pages/Library").then((module) => ({
      default: module.HistoryPage,
    })),
  ),
  "/biblioteca/listas": lazy(() =>
    import("../pages/Library").then((module) => ({
      default: module.ListsPage,
    })),
  ),
  "/biblioteca/listas/:id": lazy(() =>
    import("../pages/Library").then((module) => ({
      default: module.ListDetailPage,
    })),
  ),
};
const studioPages = {
  "/estudio": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.StudioDashboardPage,
    })),
  ),
  "/estudio/obras/nova": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.NewWorkWizardPage,
    })),
  ),
  "/estudio/obras/:id": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.WorkManagePage,
    })),
  ),
  "/estudio/obras/:id/capitulos/:capituloId/editar": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.ChapterEditPage,
    })),
  ),
  "/estudio/obras/:id/paginas/:capituloId/editar": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.PagesEditPage,
    })),
  ),
  "/estudio/publicacoes": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.PublicationsPage,
    })),
  ),
  "/estudio/estatisticas": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.StudioStatsPage,
    })),
  ),
  "/estudio/media": lazy(() =>
    import("../pages/Studio").then((module) => ({
      default: module.MediaLibraryPage,
    })),
  ),
};
const completionPages = {
  "/atividade": lazy(() =>
    import("../pages/Community").then((module) => ({
      default: module.ActivityPage,
    })),
  ),
  "/colecoes": lazy(() =>
    import("../pages/Community").then((module) => ({
      default: module.CollectionsPage,
    })),
  ),
  "/notificacoes": lazy(() =>
    import("../pages/Communication").then((module) => ({
      default: module.NotificationsPage,
    })),
  ),
  "/denunciar": lazy(() =>
    import("../pages/Communication").then((module) => ({
      default: module.ReportPage,
    })),
  ),
  "/ajuda": lazy(() =>
    import("../pages/Information").then((module) => ({
      default: module.HelpPage,
    })),
  ),
  "/regras": lazy(() =>
    import("../pages/Information").then((module) => ({
      default: module.RulesPage,
    })),
  ),
  "/privacidade": lazy(() =>
    import("../pages/Information").then((module) => ({
      default: module.PrivacyPage,
    })),
  ),
  "/moderacao": lazy(() =>
    import("../pages/Moderation").then((module) => ({
      default: module.ModerationPage,
    })),
  ),
  "/moderacao/denuncias": lazy(() =>
    import("../pages/Moderation").then((module) => ({
      default: module.ModerationReportsPage,
    })),
  ),
  "/sistema": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemPage,
    })),
  ),
  "/sistema/logs": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemLogsPage,
    })),
  ),
  "/sistema/logs/:id": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemLogDetailPage,
    })),
  ),
  "/sistema/servicos": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemServicesPage,
    })),
  ),
  "/sistema/monitorizacao": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemMonitoringPage,
    })),
  ),
  "/sistema/informacoes": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemInformationPage,
    })),
  ),
  "/sistema/testes": lazy(() =>
    import("../pages/System").then((module) => ({
      default: module.SystemTestsPage,
    })),
  ),
};
const DesignSystem = lazy(() => import("../pages/DesignSystem"));
const layouts = {
  public: PublicLayout,
  auth: AuthLayout,
  reader: ReaderLayout,
  studio: StudioLayout,
  account: AccountLayout,
  moderation: ModerationLayout,
  system: SystemLayout,
};
function RouteEffects() {
  const location = useLocation();
  const previous = useRef(location.pathname);
  useEffect(() => {
    const route = productRoutes.find((r) =>
      matchPath({ path: r.path, end: true }, location.pathname),
    );
    document.title = `${route?.title ?? "Arquivo Global"} — Arquivo Global`;
    if (previous.current !== location.pathname) {
      window.scrollTo(0, 0);
      document.getElementById("conteudo")?.focus();
      previous.current = location.pathname;
    }
  }, [location.pathname]);
  return null;
}
function renderRoute(route: (typeof productRoutes)[number]) {
  const Page =
    discoveryPages[route.path as keyof typeof discoveryPages] ??
    authPages[route.path as keyof typeof authPages] ??
    profilePages[route.path as keyof typeof profilePages] ??
    settingsPages[route.path as keyof typeof settingsPages] ??
    readerPages[route.path as keyof typeof readerPages] ??
    libraryPages[route.path as keyof typeof libraryPages] ??
    studioPages[route.path as keyof typeof studioPages] ??
    completionPages[route.path as keyof typeof completionPages];
  return Page ? <Page /> : <NotFound />;
}
export function ApplicationRoutes() {
  return (
    <Suspense
      fallback={
        <div className="container loading-page">
          <LoadingState />
        </div>
      }
    >
      <RouteEffects />
      <Routes>
        {Object.entries(layouts).map(([name, Layout]) => (
          <Route key={name} element={<Layout />}>
            {productRoutes
              .filter((r) => r.layout === name)
              .map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={renderRoute(route)}
                />
              ))}
          </Route>
        ))}
        <Route element={<PublicLayout />}>
          <Route path="/dev/design-system" element={<DesignSystem />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <ApplicationRoutes />
      </BrowserRouter>
    </Providers>
  );
}
