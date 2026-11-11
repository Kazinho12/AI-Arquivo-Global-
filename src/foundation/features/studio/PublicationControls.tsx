import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal } from "../../components/ui";
import { useRemoteWorks } from "./RemoteWorksProvider";
import type { StudioWork } from "./types";
export function PublicationControls({
  work,
  dirty,
}: {
  work: StudioWork;
  dirty: boolean;
}) {
  const remote = useRemoteWorks();
  const [action, setAction] = useState<"publish" | "withdraw" | null>(null);
  const [error, setError] = useState("");
  const published = work.status === "published";
  const label = published
    ? "Atualizar publicação"
    : work.firstPublishedAt
      ? "Republicar"
      : "Publicar";
  const valid =
    work.title.trim() &&
    work.synopsis.trim() &&
    work.synopsis.trim().toLowerCase() !== "sem sinopse definida." &&
    work.language.trim() &&
    work.chapters.some((entry) => entry.title.trim() && entry.content?.trim());
  async function confirm() {
    if (!action) return;
    const result = await remote.controller?.editorial(work, action);
    if (result?.work) {
      setAction(null);
      setError("");
    } else
      setError(
        remote.controller?.getSnapshot().error ||
          "Não foi possível confirmar a operação. Atualiza as obras antes de tentar novamente.",
      );
  }
  return (
    <section className="studio-section" aria-label="Publicação editorial">
      <h2>Publicação editorial</h2>
      <p>
        {published
          ? "Publicada · edição pública confirmada"
          : work.withdrawnAt
            ? "Publicação retirada · rascunho privado"
            : "Rascunho privado"}
      </p>
      {work.firstPublishedAt && (
        <p>
          Primeira publicação:{" "}
          <time dateTime={work.firstPublishedAt}>
            {new Date(work.firstPublishedAt).toLocaleString("pt-PT")}
          </time>
        </p>
      )}
      {work.lastPublishedAt && (
        <p>
          Última publicação:{" "}
          <time dateTime={work.lastPublishedAt}>
            {new Date(work.lastPublishedAt).toLocaleString("pt-PT")}
          </time>
        </p>
      )}
      {work.withdrawnAt && (
        <p>
          Retirada:{" "}
          <time dateTime={work.withdrawnAt}>
            {new Date(work.withdrawnAt).toLocaleString("pt-PT")}
          </time>
        </p>
      )}
      {published && (
        <p>
          Alterações no Studio ficam privadas até confirmares uma atualização da
          publicação.
          {work.publishedRevision && work.revision! > work.publishedRevision
            ? " Existem alterações posteriores à edição pública."
            : ""}
        </p>
      )}
      <p>
        Apenas entradas com texto válido serão publicadas. Entradas vazias
        continuam privadas.
      </p>
      {Boolean(work.archivedAt) && <p>Desarquiva a obra antes de publicar.</p>}
      {!valid && (
        <p>
          Preenche título, sinopse, idioma e pelo menos uma entrada com texto
          antes de publicar.
        </p>
      )}
      <div className="actions">
        <Button
          disabled={
            remote.saving || dirty || Boolean(work.archivedAt) || !valid
          }
          onClick={() => {
            setError("");
            setAction("publish");
          }}
        >
          {label}
        </Button>
        {published && (
          <Button
            variant="secondary"
            disabled={remote.saving || dirty}
            onClick={() => {
              setError("");
              setAction("withdraw");
            }}
          >
            Retirar publicação
          </Button>
        )}
        {published && work.publicId && (
          <Link className="button secondary" to={`/obras/${work.publicId}`}>
            Consultar página pública
          </Link>
        )}
      </div>
      {action && (
        <Modal
          open
          title={
            action === "publish" ? `${label} a obra?` : "Retirar a publicação?"
          }
          onClose={() => {
            if (!remote.saving) setAction(null);
          }}
        >
          <p>
            {action === "publish"
              ? "Os metadados e as entradas com texto passarão a ser acessíveis a qualquer leitor, incluindo visitantes sem conta. A autoria apresentada utiliza os campos públicos do perfil, quando disponíveis."
              : "A obra e os conteúdos deixarão de estar acessíveis por novos pedidos públicos. Os rascunhos são preservados. Cópias já descarregadas não podem ser recuperadas dos leitores."}
          </p>
          {action === "publish" &&
            ["HQ / Comic", "Mangá"].includes(work.format) && (
              <p>
                Esta publicação disponibiliza apenas o guião textual. Não há
                imagens ou páginas visuais nesta etapa.
              </p>
            )}
          {error && <p role="alert">{error}</p>}
          {remote.saving && <p role="status">A confirmar…</p>}
          <div className="modal-actions">
            <Button
              variant="ghost"
              disabled={remote.saving}
              onClick={() => setAction(null)}
            >
              Cancelar
            </Button>
            <Button disabled={remote.saving} onClick={() => void confirm()}>
              {action === "publish"
                ? "Confirmar publicação"
                : "Confirmar retirada"}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
