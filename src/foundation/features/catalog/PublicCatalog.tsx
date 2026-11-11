import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useInRouterContext } from "react-router-dom";
import { inauguralWorks } from "../../data/inaugural";
import type { Work } from "../../data/works";
import {
  createPublicWorksRepository,
  getPublicClient,
  type PublishedWork,
  type PublicWorksRepository,
} from "./repository";
import { publicCatalogEvent } from "./events";
interface State {
  published: Work[];
  loading: boolean;
  error: string;
  version: number;
  refresh: () => void;
  repository: PublicWorksRepository | null;
}
const empty: State = {
  published: [],
  loading: false,
  error: "",
  version: 0,
  refresh: () => {},
  repository: null,
};
const Context = createContext<State>(empty);
export function PublicCatalogProvider({
  children,
  repository: injected,
}: {
  children: ReactNode;
  repository?: PublicWorksRepository;
}) {
  const inRouter = useInRouterContext();
  const repository = useMemo(
    () =>
      injected ??
      (getPublicClient()
        ? createPublicWorksRepository(getPublicClient())
        : null),
    [injected],
  );
  const [published, setPublished] = useState<Work[]>([]);
  const [loading, setLoading] = useState(Boolean(repository));
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const changed = (event: Event) => {
      const removed = (event as CustomEvent<{ removedId?: string }>).detail
        ?.removedId;
      if (removed)
        setPublished((items) => items.filter((work) => work.id !== removed));
      refresh();
    };
    const focus = () => refresh();
    window.addEventListener(publicCatalogEvent, changed);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener(publicCatalogEvent, changed);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    if (!repository) return;
    let current = true;
    setLoading(true);
    setError("");
    repository.list().then(
      (works) => {
        if (current) {
          setPublished(works);
          setLoading(false);
        }
      },
      (error) => {
        if (current) {
          setPublished([]);
          setError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar catálogo.",
          );
          setLoading(false);
        }
      },
    );
    return () => {
      current = false;
    };
  }, [repository, version]);
  return (
    <Context.Provider
      value={{ published, loading, error, version, refresh, repository }}
    >
      {inRouter && <NavigationRefresh />}
      {children}
    </Context.Provider>
  );
}
function NavigationRefresh() {
  const { pathname } = useLocation();
  const { refresh } = useContext(Context);
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    // The reader revalidates its own snapshot; do not reload discovery previews.
    if (!pathname.includes("/capitulos/") && !pathname.includes("/paginas/"))
      refresh();
  }, [pathname, refresh]);
  return null;
}
export function usePublicCatalog() {
  const state = useContext(Context);
  return {
    ...state,
    works: useMemo(
      () => [...inauguralWorks, ...state.published],
      [state.published],
    ),
  };
}
export function usePublishedWork(id: string, live = false) {
  const [renewal, setRenewal] = useState(0);
  const cachedWork = useRef<PublishedWork | null>(null);
  useEffect(() => {
    if (!live) return;
    const refresh = () => {
      if (document.visibilityState !== "hidden")
        setRenewal((value) => value + 1);
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [live]);
  const location = useLocation();
  const { repository, version } = useContext(Context);
  const [state, setState] = useState<{
    id: string;
    work: PublishedWork | null;
    loading: boolean;
    error: string;
  }>({ id, work: null, loading: Boolean(repository), error: "" });
  cachedWork.current = state.id === id ? state.work : null;
  useEffect(() => {
    if (!repository) {
      setState({
        id,
        work: null,
        loading: false,
        error: "O catálogo de autores não está configurado neste ambiente.",
      });
      return;
    }
    let current = true;
    setState((previous) =>
      previous.id === id && previous.work
        ? { ...previous, loading: false, error: "" }
        : { id, work: null, loading: true, error: "" },
    );
    const cached = cachedWork.current;
    const request =
      live && renewal > 0 && cached && repository.check
        ? repository
            .check(id)
            .then((check) =>
              !check
                ? null
                : Date.parse(check.lastPublishedAt) ===
                    Date.parse(cached.lastPublishedAt)
                  ? cached
                  : repository.find(id),
            )
        : repository.find(id);
    request.then(
      (work) => {
        if (current) setState({ id, work, loading: false, error: "" });
      },
      (error) => {
        if (current)
          setState({
            id,
            work: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Erro ao carregar publicação.",
          });
      },
    );
    return () => {
      current = false;
    };
  }, [id, repository, version, location.pathname, renewal, live]);
  return state.id === id ? state : { id, work: null, loading: true, error: "" };
}
