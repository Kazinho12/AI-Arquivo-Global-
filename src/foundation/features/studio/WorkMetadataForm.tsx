import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Select, Modal } from "../../components/ui";
import type { StudioWork, WorkFormat, AgeRating } from "./types";
import { useRemoteWorks } from "./RemoteWorksProvider";
export function WorkMetadataForm({
  work,
  onDirtyChange,
}: {
  work: StudioWork;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const remote = useRemoteWorks();
  const [baseline, setBaseline] = useState(work);
  const [recoverConfirm, setRecoverConfirm] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [subtitle, setSubtitle] = useState(work.subtitle ?? "");
  const [synopsis, setSynopsis] = useState(work.synopsis);
  const [format, setFormat] = useState(work.format);
  const [language, setLanguage] = useState(work.language);
  const [genre, setGenre] = useState(work.genre);
  const [tags, setTags] = useState(work.tags.join(", "));
  const [ageRating, setAgeRating] = useState(work.ageRating);
  const [warnings, setWarnings] = useState(work.contentWarnings.join(", "));
  const [color, setColor] = useState(work.coverAccentColor);
  const [saved, setSaved] = useState(false);
  const split = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    const result = await remote.controller?.update(baseline, {
      title,
      subtitle,
      synopsis,
      format,
      language,
      genre,
      tags: split(tags),
      ageRating,
      contentWarnings: split(warnings),
      coverAccentColor: color,
    });
    if (result) {
      apply(result);
      setSaved(true);
    }
  }
  const dirty =
    title !== baseline.title ||
    subtitle !== (baseline.subtitle ?? "") ||
    synopsis !== baseline.synopsis ||
    format !== baseline.format ||
    language !== baseline.language ||
    genre !== baseline.genre ||
    tags !== baseline.tags.join(", ") ||
    ageRating !== baseline.ageRating ||
    warnings !== baseline.contentWarnings.join(", ") ||
    color !== baseline.coverAccentColor;
  function apply(latest: StudioWork) {
    setBaseline(latest);
    setTitle(latest.title);
    setSubtitle(latest.subtitle ?? "");
    setSynopsis(latest.synopsis);
    setFormat(latest.format);
    setLanguage(latest.language);
    setGenre(latest.genre);
    setTags(latest.tags.join(", "));
    setAgeRating(latest.ageRating);
    setWarnings(latest.contentWarnings.join(", "));
    setColor(latest.coverAccentColor);
  }
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const links = (event: MouseEvent) => {
      if (
        (event.target as Element)?.closest?.("a[href]") &&
        !window.confirm(
          "Existem metadados não guardados. Queres sair e descartá-los?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", links, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", links, true);
    };
  }, [dirty]);
  return (
    <section className="studio-section mt-5" aria-label="Editar metadados">
      <h2>Editar metadados</h2>
      {dirty && <p role="status">Metadados não guardados</p>}
      <form onSubmit={submit} onChange={() => setSaved(false)}>
        <fieldset disabled={remote.saving || Boolean(work.archivedAt)}>
          <Field
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
          <Field
            label="Subtítulo"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
          />
          <label className="field">
            <span>Sinopse</span>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              maxLength={10000}
            />
          </label>
          <Select
            label="Formato"
            value={format}
            disabled={work.chapters.length > 0}
            title={
              work.chapters.length
                ? "O formato fica protegido enquanto existirem entradas."
                : undefined
            }
            onChange={(e) => setFormat(e.target.value as WorkFormat)}
          >
            {["Romance", "Conto", "Poesia", "HQ / Comic", "Mangá"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </Select>
          <Field
            label="Idioma"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            maxLength={60}
          />
          <Field
            label="Género"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            maxLength={100}
          />
          <Field
            label="Tags (separadas por vírgulas)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={1000}
          />
          <Select
            label="Classificação etária"
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value as AgeRating)}
          >
            {["Livre", "+12", "+14", "+16", "+18"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
          <Field
            label="Avisos de conteúdo (separados por vírgulas)"
            value={warnings}
            onChange={(e) => setWarnings(e.target.value)}
            maxLength={1000}
          />
          <Field
            label="Cor da capa"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Button type="submit" disabled={remote.saving || !remote.enabled}>
            {remote.saving ? "A guardar…" : "Guardar alterações"}
          </Button>
        </fieldset>
        {saved && <p role="status">Alterações guardadas na tua conta.</p>}
        <p className="text-muted">
          Rascunho privado. A propriedade técnica não define autoria pública nem
          publicação editorial.
        </p>
      </form>
      <Button
        variant="ghost"
        disabled={remote.saving}
        onClick={() => setRecoverConfirm(true)}
      >
        Repor metadados persistidos
      </Button>
      {recoverConfirm && (
        <Modal
          open
          title="Repor metadados?"
          onClose={() => setRecoverConfirm(false)}
        >
          <p>
            As alterações deste formulário serão substituídas pelos dados do
            servidor.
          </p>
          <Button variant="ghost" onClick={() => setRecoverConfirm(false)}>
            Cancelar
          </Button>
          <Button
            disabled={remote.saving}
            onClick={async () => {
              const latest = await remote.controller?.recover(work.id);
              if (latest) {
                apply(latest);
                setSaved(false);
                setRecoverConfirm(false);
              }
            }}
          >
            Confirmar reposição
          </Button>
        </Modal>
      )}
    </section>
  );
}
