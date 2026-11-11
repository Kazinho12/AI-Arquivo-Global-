import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthClient } from "../auth/client";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "../../components/ui";
import type { UserProfile } from "./types";
import {
  avatarInitials,
  avatarLocation,
  publicAvatarUrl,
  readPrivateAvatar,
  uploadAvatar,
  removeAvatar,
  safeAvatarUrl,
  validateAvatar,
} from "./avatar";
export function ProfileAvatar({
  name,
  url,
  small = false,
  publicProfile = false,
  client,
  onLoadError,
}: {
  name: string;
  url: string | null;
  small?: boolean;
  publicProfile?: boolean;
  client?: SupabaseClient | null;
  onLoadError?: (message: string) => void;
}) {
  const { state: auth } = useAuth();
  const viewer = auth.status === "authenticated" ? auth.user?.id : undefined;
  const [image, setImage] = useState<{
    reference: string;
    viewer: string;
    src: string;
  } | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  const publicSource = publicProfile ? publicAvatarUrl(url) : null;
  const publicReady =
    publicSource && broken !== publicSource ? publicSource : null;
  const location = avatarLocation(url),
    safe = safeAvatarUrl(url);
  useEffect(() => {
    if (
      publicReady ||
      !location ||
      !url ||
      !viewer ||
      location.owner.toLowerCase() !== viewer.toLowerCase()
    )
      return;
    let active = true,
      objectUrl = "";
    const abort = new AbortController();
    readPrivateAvatar(
      url,
      client === undefined ? getAuthClient() : client,
      fetch,
      abort.signal,
    ).then(
      (blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ reference: url, viewer, src: objectUrl });
      },
      (error) => {
        if (active && error?.name !== "AbortError")
          onLoadError?.(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a fotografia privada.",
          );
      },
    );
    return () => {
      active = false;
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, viewer, client, onLoadError, publicReady]);
  const src =
    publicReady ??
    (location
      ? image?.reference === url && image.viewer === viewer
        ? image.src
        : null
      : safe);
  return src && broken !== src ? (
    <img
      src={src}
      alt={`Fotografia de ${name}`}
      className="profile-avatar-img"
      style={small ? { width: 50, height: 50 } : undefined}
      crossOrigin={publicReady ? "anonymous" : undefined}
      referrerPolicy="no-referrer"
      onError={() => {
        setBroken(src);
        onLoadError?.(
          "Não foi possível apresentar a fotografia. As tuas iniciais foram mantidas.",
        );
      }}
    />
  ) : (
    <div
      className={`profile-avatar-monogram ${small ? "small" : ""}`}
      aria-label={`Avatar de ${name}`}
      title={
        location && !publicProfile
          ? "Fotografia privada: visível apenas ao proprietário autenticado."
          : undefined
      }
    >
      <span>{avatarInitials(name)}</span>
    </div>
  );
}

export function AvatarEditor({
  profile,
  onChange,
  client,
}: {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  client?: SupabaseClient | null;
}) {
  const [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function select(file?: File) {
    const current = ++generation.current;
    setError("");
    setMessage("");
    setPreview("");
    setSelected(null);
    if (!file) return;
    try {
      await validateAvatar(file);
      const image = await createImageBitmap(file);
      const valid =
        image.width > 0 &&
        image.height > 0 &&
        image.width <= 4096 &&
        image.height <= 4096;
      image.close();
      if (!valid) throw Error("A imagem deve ter até 4096 × 4096 píxeis.");
      if (generation.current !== current) return;
      setSelected(file);
      setPreview(URL.createObjectURL(file));
      setMessage(
        "Pré-visualização local pronta. A fotografia ainda não foi enviada nem guardada.",
      );
    } catch (err) {
      if (generation.current === current)
        setError(err instanceof Error ? err.message : "Imagem inválida.");
    }
  }
  return (
    <div className="avatar-info-panel">
      <div
        className="avatar-preview"
        style={{ flexWrap: "wrap", alignItems: "flex-start" }}
      >
        {preview ? (
          <img
            src={preview}
            className="profile-avatar-img"
            alt="Pré-visualização local, ainda não guardada"
          />
        ) : (
          <ProfileAvatar
            name={profile.displayName}
            url={profile.avatarUrl}
            small
            client={client}
            onLoadError={setError}
          />
        )}
        <div>
          <strong>Fotografia de perfil</strong>
          <p>
            A fotografia guardada destina-se à apresentação no teu perfil
            público. Selecionar uma imagem não a guarda automaticamente.
          </p>
          <label className="field">
            Escolher fotografia para pré-visualizar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                void select(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <small>JPEG, PNG ou WebP · até 2 MB e 4096 × 4096 píxeis.</small>
          <div className="actions">
            <Button
              type="button"
              disabled={busy || !selected}
              onClick={async () => {
                if (!selected) return;
                setBusy(true);
                setError("");
                setMessage("");
                const current = generation.current;
                try {
                  const next = await uploadAvatar(
                    profile,
                    selected,
                    client === undefined ? getAuthClient() : client,
                  );
                  if (current !== generation.current) return;
                  setSelected(null);
                  setPreview("");
                  onChange(next);
                  setMessage("Fotografia guardada na tua conta.");
                } catch (error) {
                  if (current === generation.current)
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Falha ao guardar fotografia.",
                    );
                } finally {
                  if (current === generation.current) setBusy(false);
                }
              }}
            >
              {busy ? "A guardar…" : "Guardar fotografia"}
            </Button>
            {profile.avatarUrl && (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Remover fotografia
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && !confirm && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Modal
        open={confirm}
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        title="Remover fotografia de perfil?"
      >
        <p>O perfil passará a apresentar as tuas iniciais.</p>
        {error && <p role="alert">{error}</p>}
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => setConfirm(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const next = await removeAvatar(
                profile,
                client === undefined ? getAuthClient() : client,
              );
              generation.current++;
              setPreview("");
              setSelected(null);
              onChange(next);
              setConfirm(false);
              setMessage("Fotografia removida do perfil.");
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Falha ao remover fotografia.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "A remover…" : "Confirmar remoção"}
        </Button>
      </Modal>
    </div>
  );
}
