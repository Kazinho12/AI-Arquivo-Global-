import {
  COVER_STYLES,
  coverStyleDefinitions,
  nextCoverSeed,
  type CoverStyle,
} from "../data/covers";
import { coverStudioV2Enabled } from "../features/covers/config";
import { WorkCover } from "./WorkCover";
export function CoverStudioGallery({
  title,
  author = "Autor do Arquivo",
  subtitle,
  color,
  format,
  style,
  seed,
  onStyle,
  onSeed,
}: {
  title: string;
  author?: string;
  subtitle?: string;
  color: string;
  format: string;
  style: CoverStyle;
  seed: number;
  onStyle: (style: CoverStyle) => void;
  onSeed: (seed: number) => void;
}) {
  return (
    <section
      className="cover-studio"
      aria-label="Biblioteca de estilos de capa"
    >
      <p className="text-muted">
        {coverStudioV2Enabled
          ? "Seleciona uma composição e confirma as alterações para guardar. A capa pública só muda após atualização explícita da publicação."
          : "Biblioteca em pré-visualização. Os novos estilos e variações só podem ser guardados após ativação do Estúdio de Capas 2.0."}
      </p>
      <div
        className="cover-style-gallery"
        role="group"
        aria-label="Estilos gráficos"
      >
        {[...COVER_STYLES, "legacy" as const].map((id) => (
          <button
            key={id}
            type="button"
            className="cover-style-option"
            aria-pressed={style === id}
            aria-label={`Estilo de capa ${coverStyleDefinitions[id].label}`}
            onClick={() => onStyle(id)}
          >
            <WorkCover
              title={title || "Título da Obra"}
              author={author}
              subtitle={subtitle}
              color={color}
              style={id}
              seed={seed}
              format={format}
            />
            <span>{coverStyleDefinitions[id].label}</span>
          </button>
        ))}
      </div>
      <div className="cover-variation-controls">
        <button
          className="button secondary"
          type="button"
          onClick={() => onSeed(nextCoverSeed(seed))}
        >
          Gerar outra variação
        </button>
        <span role="status" aria-live="polite">
          Variação {seed} · pré-visualização sem gravação automática
        </span>
      </div>
    </section>
  );
}
