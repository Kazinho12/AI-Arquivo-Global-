import { limitText } from "./discovery";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Modal, SearchField } from "../../components/ui";
import { usePublicCatalog } from "./PublicCatalog";
import {
  discoveryQuery,
  localDiscovery,
  type DiscoveryPage,
} from "./discovery";
import { inauguralWorks } from "../../data/inaugural";
export function QuickSearch() {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [value, setValue] = useState(""),
    [result, setResult] = useState<DiscoveryPage | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const catalog = usePublicCatalog();
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => setValue(limitText(input, 200)), 300);
    return () => clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    let current = true;
    setResult(null);
    setError("");
    if (!open || !value.trim() || !catalog.repository?.search) {
      setLoading(false);
      return;
    }
    setLoading(true);
    catalog.repository
      .search({ ...discoveryQuery(new URLSearchParams({ q: value })), size: 5 })
      .then(
        (page) => {
          if (current) {
            setResult(page);
            setLoading(false);
          }
        },
        () => {
          if (current) {
            setError("Não foi possível pesquisar publicações.");
            setLoading(false);
          }
        },
      );
    return () => {
      current = false;
    };
  }, [value, open, catalog.repository, catalog.version]);
  const path = `/pesquisa?q=${encodeURIComponent(limitText(input, 200))}`;
  return (
    <>
      <Button
        variant="ghost"
        aria-label="Abrir pesquisa global"
        onClick={() => setOpen(true)}
      >
        Pesquisar
      </Button>
      {open && (
        <Modal open title="Pesquisa global" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              navigate(path);
            }}
          >
            <SearchField
              label="Pesquisa global de obras"
              value={input}
              onChange={(value) => setInput(limitText(value, 200))}
              placeholder="Título, autor ou tags…"
            />
            <Button type="submit">Ver todos os resultados</Button>
          </form>
          {loading && <p role="status">A pesquisar…</p>}
          {error && <p role="alert">{error}</p>}
          {result && input === value && (
            <>
              <p role="status">{result.total} publicações encontradas</p>
              <ul>
                {result.items.map((work) => (
                  <li key={work.id}>
                    <Link
                      onClick={() => setOpen(false)}
                      to={`/obras/${work.id}`}
                    >
                      {work.title} — {work.author}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {value.trim() && (
            <>
              <h3>Conteúdo editorial · local</h3>
              <ul>
                {localDiscovery(
                  inauguralWorks,
                  discoveryQuery(new URLSearchParams({ q: value })),
                ).map((work) => (
                  <li key={work.id}>
                    <Link
                      onClick={() => setOpen(false)}
                      to={`/obras/${work.id}`}
                    >
                      {work.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
