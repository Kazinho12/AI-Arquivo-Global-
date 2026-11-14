import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applySeo } from "./metadata";
import type { PublishedWork } from "../catalog/repository";
// Loading pages are not prematurely marked noindex; add it only on an actual
// unavailable/error response, so the crawler can finish rendering public data.
export function usePublicationSeo(
  work: PublishedWork | null,
  loading: boolean,
) {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (loading) return;
    applySeo({
      path: work ? `/obras/${work.id}` : pathname,
      title: work
        ? `${work.title} — ${work.author} | Arquivo Global`
        : "Publicação indisponível — Arquivo Global",
      description: work?.synopsis.slice(0, 250),
      index: Boolean(work) && !search,
    });
  }, [work, loading, pathname, search]);
}
