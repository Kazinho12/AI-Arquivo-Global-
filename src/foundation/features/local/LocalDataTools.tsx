import { useEffect, useState, type ChangeEvent } from "react";
import { Button, Modal } from "../../components/ui";
import {
  currentScope,
  exportLocal,
  importLocal,
  legacySnapshot,
  localWarnings,
  parseLegacy,
  useLocalRevision,
  validateImport,
  retryLocal,
  hasLocalConflict,
  acceptRemoteLocal,
  flushLocal,
  localCopies,
  localSnapshot,
  legacyKeys,
  recoverLocalCopy,
} from "./persistence";
import { exportImages, importImages, imageWarning } from "./images";
// Ensure both contracts are registered, including on a direct visit to either area.
import "../studio/store";
import "../library/store";

function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function LocalDataTools() {
  useLocalRevision();
  const [pending, setPending] = useState<{
    data: Record<string, unknown[]>;
    owner: string;
    images?: Awaited<ReturnType<typeof exportImages>>;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [copies, setCopies] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const owner = currentScope();
  for (const key of legacyKeys) localSnapshot(key);
  const warnings = [
    ...localWarnings(),
    ...(imageWarning() ? [imageWarning()!] : []),
  ];
  useEffect(() => {
    if (!warnings.length) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [warnings.length]);
  async function exportData() {
    try {
      const snapshot = exportLocal(owner);
      const images = await exportImages(owner);
      if (owner !== currentScope()) return;
      download({ ...snapshot, images }, "arquivo-global-copia-local.json");
      setMessage("Cópia exportada. Conserva este ficheiro num local privado.");
    } catch {
      if (owner !== currentScope()) return;
      download(exportLocal(owner), "arquivo-global-rascunhos-sem-imagens.json");
      setMessage(
        "Os textos foram exportados. Não foi possível incluir todas as imagens; mantém esta sessão aberta.",
      );
    }
  }
  async function readImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 80 * 1024 * 1024) throw new Error();
      const parsed = JSON.parse(await file.text());
      if (
        currentScope() !== owner ||
        parsed.version !== 2 ||
        !validateImport(parsed.data)
      )
        throw new Error();
      setConfirmed(false);
      setPending({ data: parsed.data, owner, images: parsed.images });
    } catch {
      setMessage(
        "Não foi possível ler esta cópia. Nenhum dado atual foi substituído.",
      );
    }
  }
  async function confirmImport() {
    if (!pending || !confirmed || pending.owner !== currentScope()) return;
    setBusy(true);
    try {
      // Validate and persist files before linking imported metadata to them.
      await importImages(pending.images ?? [], pending.owner);
      const count = importLocal(pending.data, confirmed, pending.owner);
      flushLocal();
      setMessage(
        `${count} registos recuperados. Identificadores já existentes foram preservados; os originais continuam disponíveis na cópia.`,
      );
      setPending(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível importar os dados.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="panel" aria-label="Dados guardados neste dispositivo">
      <p>
        <strong>
          Dados deste dispositivo ·{" "}
          {owner === "guest" ? "Visitante" : "Conta atual"}
        </strong>
      </p>
      {warnings.map((warning) => (
        <p role="alert" key={warning}>
          {warning}
        </p>
      ))}
      {warnings.length > 0 && (
        <Button variant="secondary" onClick={() => retryLocal(owner)}>
          Tentar guardar novamente os textos
        </Button>
      )}
      {hasLocalConflict() && (
        <Button
          variant="secondary"
          onClick={() => {
            if (
              window.confirm(
                "A tua versão será conservada nas cópias de recuperação. Carregar a versão da outra aba?",
              )
            )
              acceptRemoteLocal(owner);
          }}
        >
          Carregar versão da outra aba
        </Button>
      )}
      <details>
        <summary>Cópias e recuperação de dados locais</summary>
        <p>
          Estas cópias locais não sincronizam entre dispositivos. Os dados
          antigos não têm proprietário conhecido e só são importados com a tua
          confirmação. Usa esta opção apenas se os dados te pertencem. Nenhuma
          chave antiga será apagada.
        </p>
        <Button
          variant="ghost"
          onClick={() => setCopies(Object.keys(localCopies(owner)))}
        >
          Ver cópias de recuperação deste espaço
        </Button>
        {copies.map((key, index) => (
          <Button
            variant="ghost"
            key={key}
            onClick={() => {
              try {
                setConfirmed(false);
                setPending({ data: recoverLocalCopy(key, owner), owner });
              } catch {
                setMessage(
                  "Esta cópia não pode ser importada automaticamente; os originais foram preservados.",
                );
              }
            }}
          >
            Recuperar cópia {index + 1} (
            {key.includes("studio_works")
              ? "obras"
              : key.includes("library")
                ? "biblioteca"
                : "dados locais"}
            )
          </Button>
        ))}
        <div className="actions">
          <Button variant="secondary" onClick={exportData}>
            Exportar rascunhos e biblioteca
          </Button>
          <label className="field">
            Importar cópia JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={readImport}
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              try {
                setConfirmed(false);
                setPending({ data: parseLegacy(legacySnapshot()), owner });
              } catch {
                setMessage(
                  "Não existem dados antigos recuperáveis. Podes exportar os originais para revisão.",
                );
              }
            }}
          >
            Recuperar dados antigos
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              download(
                legacySnapshot(),
                "arquivo-global-originais-legados.json",
              )
            }
          >
            Exportar originais antigos
          </Button>
        </div>
      </details>
      {message && <p role="status">{message}</p>}
      <Modal
        open={!!pending}
        onClose={() => {
          if (!busy) setPending(null);
        }}
        title="Confirmar recuperação local"
      >
        <p>
          Destino: {owner === "guest" ? "espaço de visitante" : "conta atual"}.{" "}
          {pending &&
            Object.values(pending.data).reduce(
              (sum, rows) => sum + rows.length,
              0,
            )}{" "}
          registos na cópia. Obras em conflito são recuperadas como cópias. Nos
          restantes registos, identificadores já existentes mantêm a versão do
          destino. A cópia original é preservada.
        </p>
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          Confirmo que estes dados me pertencem e quero importá-los neste
          espaço.
        </label>
        <Button disabled={!confirmed || busy} onClick={confirmImport}>
          Importar neste espaço
        </Button>
      </Modal>
    </aside>
  );
}
