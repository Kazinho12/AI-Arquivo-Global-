import { UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Work } from "../../data/works";
import { WorkCard } from "../../components/WorkCard";
import { Button, EmptyState, ActionLink } from "../../components/ui";
import { fetchFollowerCount, fetchProfileWorks } from "./publicData";
import { publicCatalogEvent } from "../catalog/events";
export function FollowerCount({ id }: { id: string }) {
  const [count, setCount] = useState<number | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => {
      setCount(null);
      setError("");
      fetchFollowerCount(id).then(
        (value) => {
          if (active) setCount(value);
        },
        (err) => {
          if (active) setError(err.message);
        },
      );
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [id]);
  return (
    <span
      className="profile-followers-link"
      title={error || undefined}
      aria-live="polite"
    >
      <UserCheck size={13} aria-hidden="true" />
      Seguidores ({count !== null ? count : error ? "indisponível" : "…"})
    </span>
  );
}
export function ProfilePublications({ id }: { id: string }) {
  const [works, setWorks] = useState<Work[]>([]),
    [total, setTotal] = useState<number | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const refresh = () => setRetry((value) => value + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener(publicCatalogEvent, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener(publicCatalogEvent, refresh);
    };
  }, [id]);
  useEffect(() => {
    const current = ++generation.current;
    setWorks([]);
    setTotal(null);
    setLoading(true);
    setError("");
    fetchProfileWorks(id).then(
      (result) => {
        if (generation.current === current) {
          setWorks(result.works);
          setTotal(result.total);
          setLoading(false);
        }
      },
      (err) => {
        if (generation.current === current) {
          setError(err.message);
          setLoading(false);
        }
      },
    );
    return () => {
      generation.current++;
    };
  }, [id, retry]);
  return (
    <section className="profile-works-section" aria-labelledby="obras-heading">
      <div className="profile-works-header">
        <h2 id="obras-heading">
          Obras publicadas{" "}
          <span className="profile-works-count">
            ({total ?? (error ? "indisponível" : "…")})
          </span>
        </h2>
        <span className="eyebrow">CATÁLOGO DO AUTOR</span>
      </div>
      {loading && <p role="status">A carregar obras publicadas…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button type="button" onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      <div className="work-grid">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
      {!loading && !error && total === 0 && (
        <EmptyState title="Nenhuma obra publicada">
          <p>Este autor ainda não tem obras disponíveis no catálogo público.</p>
          <ActionLink to="/catalogo">Explorar outras histórias</ActionLink>
        </EmptyState>
      )}
      {total !== null && works.length < total && !error && (
        <Button
          type="button"
          disabled={loading}
          onClick={async () => {
            const current = generation.current;
            setLoading(true);
            try {
              const result = await fetchProfileWorks(id, works.length);
              if (generation.current === current) {
                setWorks((previous) => [
                  ...new Map(
                    [...previous, ...result.works].map((w) => [w.id, w]),
                  ).values(),
                ]);
                setTotal(result.total);
              }
            } catch (err) {
              if (generation.current === current)
                setError(
                  err instanceof Error
                    ? err.message
                    : "Falha ao carregar obras.",
                );
            } finally {
              if (generation.current === current) setLoading(false);
            }
          }}
        >
          Carregar mais obras
        </Button>
      )}
    </section>
  );
}
