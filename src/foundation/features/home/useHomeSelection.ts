import { useEffect, useState } from "react";
import { usePublicCatalog } from "../catalog/PublicCatalog";
import { loadHomeSelection, type HomeSelection } from "./selection";

export function useHomeSelection() {
  const { repository, version } = usePublicCatalog();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    selection: HomeSelection;
    loading: boolean;
    error: string;
  }>({ selection: { hero: null, recent: [] }, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    // Never keep an old highlight visible while revalidating publication status.
    setState({
      selection: { hero: null, recent: [] },
      loading: true,
      error: "",
    });
    loadHomeSelection(repository).then(
      (selection) => {
        if (active) setState({ selection, loading: false, error: "" });
      },
      () => {
        if (active)
          setState({
            selection: { hero: null, recent: [] },
            loading: false,
            error: "Não foi possível carregar as publicações. Tenta novamente.",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [repository, version, retry]);
  return { ...state, retry: () => setRetry((value) => value + 1) };
}
