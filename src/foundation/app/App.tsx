import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import { DevelopmentPage, NotFound, WorkDetail } from "../pages/States";
import { LoadingState } from "../components/ui";
const Home = lazy(() => import("../pages/Home"));
const Catalog = lazy(() => import("../pages/Catalog"));
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
    const route = productRoutes.find((r) => r.path === location.pathname);
    document.title = `${route?.title ?? "Arquivo Global"} — Arquivo Global`;
    if (previous.current !== location.pathname) {
      window.scrollTo(0, 0);
      document.getElementById("conteudo")?.focus();
      previous.current = location.pathname;
    }
  }, [location.pathname]);
  return null;
}
export function App() {
  return (
    <Providers>
      <BrowserRouter>
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
                      element={
                        route.path === "/" ? (
                          <Home />
                        ) : ["/catalogo", "/pesquisa"].includes(route.path) ? (
                          <Catalog />
                        ) : route.path === "/obras/:id" ? (
                          <WorkDetail />
                        ) : (
                          <DevelopmentPage route={route} />
                        )
                      }
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
      </BrowserRouter>
    </Providers>
  );
}
