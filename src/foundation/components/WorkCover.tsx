import React from "react";
import {
  type CoverStyle,
  getCoverThemeColors,
  normalizeHexColor,
} from "../data/covers";

export interface WorkCoverProps {
  title: string;
  author?: string;
  subtitle?: string;
  color?: string;
  style?: CoverStyle;
  format?: string;
  editionLabel?: string;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  aspectRatio?: "3/4" | "2/3";
  showNumber?: boolean;
}

/**
 * Motor de capas gráficas por código puro (SVG + CSS).
 * Renderiza 5 estilos distintos + fallback legado, com cálculo de contraste WCAG AA
 * e adaptação para títulos longos.
 */
export function WorkCover({
  title,
  author = "Autor do Arquivo",
  subtitle,
  color = "#14243B",
  style = "geometric",
  format,
  editionLabel,
  size = "responsive",
  className = "",
  aspectRatio = "3/4",
  showNumber = true,
}: WorkCoverProps) {
  const safeColor = normalizeHexColor(color, "#14243B");
  const theme = getCoverThemeColors(safeColor);

  // Escalonamento tipográfico adaptativo para títulos longos
  const titleLength = title.trim().length;
  const titleSizeClass =
    titleLength > 60
      ? "text-xs md:text-sm font-medium leading-tight"
      : titleLength > 32
        ? "text-sm md:text-base font-semibold leading-snug"
        : titleLength > 18
          ? "text-base md:text-lg font-bold leading-tight"
          : "text-lg md:text-2xl font-bold leading-tight";

  const sizeStyle =
    size === "sm"
      ? { width: "130px", height: "180px" }
      : size === "md"
        ? { width: "220px", height: "305px" }
        : size === "lg"
          ? { width: "320px", height: "445px" }
          : { width: "100%", aspectRatio: aspectRatio === "2/3" ? "2 / 3" : "3 / 4" };

  return (
    <div
      className={`ag-work-cover relative overflow-hidden select-none flex flex-col justify-between rounded shadow-md ${className}`}
      style={{
        ...sizeStyle,
        backgroundColor: safeColor,
        color: theme.textPrimary,
        boxShadow: `0 8px 24px ${theme.shadowColor}, inset 0 0 0 1px ${theme.frameBorder}`,
      }}
      aria-hidden="true"
    >
      {/* 1. Camada de Arte Gráfica em SVG de acordo com o estilo */}
      <CoverArtwork style={style} theme={theme} />

      {/* 2. Topo da Capa: Identificação Editorial / Formato */}
      <div
        className="relative z-10 px-4 pt-3.5 flex justify-between items-center text-[8px] font-mono tracking-widest uppercase opacity-85"
        style={{ color: theme.textSecondary }}
      >
        <span className="truncate max-w-[70%]">
          {editionLabel || (format ? `AG · ${format}` : "ARQUIVO GLOBAL")}
        </span>
        <span className="font-bold">AG</span>
      </div>

      {/* 3. Centro / Bloco Tipográfico */}
      <div
        className="relative z-10 px-4 py-3 my-auto flex flex-col justify-center"
        style={{
          textAlign: style === "monolith" || style === "lyric" ? "center" : "left",
        }}
      >
        {author && (
          <span
            className="text-[9px] uppercase tracking-[0.2em] font-medium mb-1.5 opacity-90 truncate"
            style={{ color: theme.textSecondary }}
          >
            {author}
          </span>
        )}

        <h3
          className={`${titleSizeClass} tracking-tight break-words`}
          style={{
            fontFamily: "var(--font-literary, Georgia, serif)",
            color: theme.textPrimary,
            textShadow: theme.isLightBg
              ? "none"
              : "0 2px 10px rgba(0, 0, 0, 0.4)",
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            className="text-[10px] tracking-normal font-sans line-clamp-2 mt-1 opacity-80"
            style={{ color: theme.textMuted }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 4. Rodapé da Capa: Monograma e Selo de Acervo */}
      <div
        className="relative z-10 px-4 pb-3 flex justify-between items-end text-[7px] font-mono tracking-widest opacity-75"
        style={{ color: theme.textMuted }}
      >
        <span className="truncate max-w-[65%]">PUBLICAÇÃO OFICIAL</span>
        {showNumber && <span>ED · 2.0</span>}
      </div>
    </div>
  );
}

/**
 * Renderizador das composições visuais geométricas/líricas em SVG puro.
 */
function CoverArtwork({
  style,
  theme,
}: {
  style: CoverStyle;
  theme: ReturnType<typeof getCoverThemeColors>;
}) {
  const strokeColor = theme.frameBorder;
  const glowColor = theme.accentGlow;

  switch (style) {
    case "minimalist":
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Moldura dupla fina */}
          <rect
            x="14"
            y="14"
            width="272"
            height="372"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />
          <rect
            x="20"
            y="20"
            width="260"
            height="360"
            stroke={strokeColor}
            strokeWidth="0.75"
          />
          {/* Eixo horizontal sutil */}
          <line
            x1="20"
            y1="200"
            x2="280"
            y2="200"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeDasharray="2 4"
            opacity="0.5"
          />
        </svg>
      );

    case "geometric":
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
        >
          {/* Círculos matemáticos concêntricos e diagonais */}
          <circle
            cx="220"
            cy="110"
            r="120"
            stroke={strokeColor}
            strokeWidth="1.2"
            opacity="0.7"
          />
          <circle
            cx="220"
            cy="110"
            r="70"
            stroke={strokeColor}
            strokeWidth="0.8"
            fill={glowColor}
          />
          <circle
            cx="220"
            cy="110"
            r="24"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1="0"
            y1="340"
            x2="300"
            y2="140"
            stroke={strokeColor}
            strokeWidth="1"
            opacity="0.6"
          />
          <line
            x1="60"
            y1="400"
            x2="60"
            y2="0"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        </svg>
      );

    case "lyric":
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Ondas fluídicas e arcos poéticos */}
          <path
            d="M -20 180 C 80 120, 180 260, 320 190"
            stroke={strokeColor}
            strokeWidth="1.5"
            opacity="0.75"
          />
          <path
            d="M -20 220 C 70 160, 190 300, 320 230"
            stroke={strokeColor}
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M -20 260 C 90 200, 210 340, 320 270"
            stroke={strokeColor}
            strokeWidth="0.75"
            opacity="0.35"
          />
          <ellipse
            cx="150"
            cy="90"
            rx="90"
            ry="45"
            fill={glowColor}
            stroke={strokeColor}
            strokeWidth="0.5"
            opacity="0.8"
          />
        </svg>
      );

    case "bold":
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Bloco de corte diagonal de cartaz */}
          <polygon
            points="0,0 300,0 300,130 0,220"
            fill={glowColor}
            opacity="0.9"
          />
          <line
            x1="0"
            y1="220"
            x2="300"
            y2="130"
            stroke={strokeColor}
            strokeWidth="2"
          />
          <rect
            x="24"
            y="280"
            width="40"
            height="5"
            fill={theme.textPrimary}
            opacity="0.8"
          />
          <rect
            x="70"
            y="280"
            width="12"
            height="5"
            fill={strokeColor}
            opacity="0.5"
          />
        </svg>
      );

    case "monolith":
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
        >
          {/* Coluna / Monólito central */}
          <rect
            x="80"
            y="0"
            width="140"
            height="400"
            fill={glowColor}
            stroke={strokeColor}
            strokeWidth="0.75"
          />
          <circle
            cx="150"
            cy="90"
            r="38"
            stroke={strokeColor}
            strokeWidth="1"
            opacity="0.8"
          />
          <line
            x1="150"
            y1="20"
            x2="150"
            y2="380"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        </svg>
      );

    case "legacy":
    default:
      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          fill="none"
        >
          {/* Arcos orbitais concêntricos clássicos do Arquivo Global */}
          <ellipse
            cx="150"
            cy="360"
            rx="190"
            ry="75"
            stroke={strokeColor}
            strokeWidth="1"
            transform="rotate(-15 150 360)"
            opacity="0.7"
          />
          <ellipse
            cx="150"
            cy="330"
            rx="190"
            ry="75"
            stroke={strokeColor}
            strokeWidth="1"
            transform="rotate(-15 150 330)"
            opacity="0.5"
          />
          <ellipse
            cx="150"
            cy="300"
            rx="190"
            ry="75"
            stroke={strokeColor}
            strokeWidth="1"
            transform="rotate(-15 150 300)"
            opacity="0.35"
          />
          <ellipse
            cx="210"
            cy="90"
            rx="60"
            ry="60"
            fill={glowColor}
            opacity="0.6"
          />
        </svg>
      );
  }
}
