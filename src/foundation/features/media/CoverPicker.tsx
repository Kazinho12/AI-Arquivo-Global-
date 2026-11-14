import { useEffect, useState } from "react";
import { Button, Modal } from "../../components/ui";
import { CoverFrame, CustomCover } from "./CustomCover";
import { customCoversEnabled, type CoverImage } from "./covers";
import { validateCover, uploadCover, coverRequest } from "./coverService";
export interface CoverDraft {
  file: File | null;
  image: CoverImage | null;
  x: number;
  y: number;
  zoom: number;
}
export const coverDraft = (image?: CoverImage | null): CoverDraft => ({
  file: null,
  image: image ?? null,
  x: image?.x ?? 50,
  y: image?.y ?? 50,
  zoom: image?.zoom ?? 1,
});
export function resolvedCover(value: CoverDraft): CoverImage | null {
  return value.image
    ? { assetId: value.image.assetId, x: value.x, y: value.y, zoom: value.zoom }
    : null;
}
export async function persistCover(
  value: CoverDraft,
  workId: string,
  ownerId: string,
) {
  const assetId = value.file
    ? await uploadCover(workId, ownerId, value.file)
    : value.image?.assetId;
  return assetId ? { assetId, x: value.x, y: value.y, zoom: value.zoom } : null;
}
export function CoverPicker({
  value,
  onChange,
  workId,
  ownerId,
  enabled = customCoversEnabled,
}: {
  value: CoverDraft;
  onChange: (value: CoverDraft) => void;
  workId?: string;
  ownerId?: string;
  enabled?: boolean;
}) {
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!value.file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);
  const imageMode = Boolean(value.file || value.image);
  return (
    <section className="cover-picker" aria-label="Capa personalizada">
      <h3>Origem da capa</h3>
      <div className="actions">
        <Button
          type="button"
          variant={imageMode ? "secondary" : "primary"}
          onClick={() => onChange(coverDraft())}
        >
          Cover Studio
        </Button>
        <label className="button secondary">
          Enviar imagem
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!enabled || checking}
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              setError("");
              setChecking(true);
              try {
                await validateCover(file);
                const bitmap = await createImageBitmap(file);
                const pixels = bitmap.width * bitmap.height;
                bitmap.close();
                if (pixels > 40000000)
                  throw Error("A imagem excede 40 megapixels.");
                onChange({ ...coverDraft(), file });
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Não foi possível abrir a imagem.",
                );
              } finally {
                setChecking(false);
              }
            }}
          />
        </label>
      </div>
      {!enabled && (
        <p role="status">
          O upload de capas aguarda a instalação e validação do serviço de
          media. O Cover Studio continua disponível.
        </p>
      )}
      <p>
        JPEG, PNG ou WebP até 5 MB. Enquadramento 2:3. Selecionar não envia nem
        guarda automaticamente.
      </p>
      {checking && <p role="status">A verificar imagem…</p>}
      {error && <p role="alert">{error}</p>}
      {imageMode && (
        <>
          <div className="cover-picker-preview">
            {preview ? (
              <CoverFrame src={preview} image={value} />
            ) : (
              <CustomCover
                image={resolvedCover(value)}
                workId={workId}
                ownerId={ownerId}
              >
                <p>
                  Pré-visualização indisponível; a capa gráfica será usada como
                  fallback.
                </p>
              </CustomCover>
            )}
          </div>
          {(
            [
              ["x", "Posição horizontal", 0, 100, 0.5],
              ["y", "Posição vertical", 0, 100, 0.5],
              ["zoom", "Zoom", 1, 3, 0.05],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label className="field" key={key}>
              <span>{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value[key]}
                onChange={(e) =>
                  onChange({ ...value, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange(coverDraft())}
          >
            Remover imagem e usar capa gráfica
          </Button>
          <p>
            A remoção só é guardada ao confirmar. A versão publicada mantém a
            capa até atualizares a publicação.
          </p>
        </>
      )}
      {enabled && ownerId && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirmCleanup(true)}
        >
          Limpar uploads antigos não utilizados
        </Button>
      )}
      {confirmCleanup && ownerId && (
        <Modal
          open
          title="Eliminar uploads antigos não utilizados?"
          onClose={() => setConfirmCleanup(false)}
        >
          <p>
            Apenas ficheiros com mais de 24 horas e sem referências podem ser
            eliminados. A eliminação é permanente; capas usadas por rascunhos ou
            publicações são preservadas.
          </p>
          <div className="actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmCleanup(false)}
            >
              Cancelar limpeza
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setConfirmCleanup(false);
                setMessage("");
                setError("");
                try {
                  const r = await coverRequest(
                    "/media/cover/cleanup",
                    { method: "POST" },
                    ownerId,
                  );
                  const data = await r.json();
                  setMessage(
                    `${data.removed} uploads antigos não utilizados removidos.`,
                  );
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Limpeza indisponível.",
                  );
                }
              }}
            >
              Confirmar limpeza
            </Button>
          </div>
        </Modal>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
