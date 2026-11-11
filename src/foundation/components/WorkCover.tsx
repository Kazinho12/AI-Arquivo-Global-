import type { CSSProperties } from "react";
import {
  LegacyWorkCover,
  type WorkCoverProps as LegacyProps,
} from "./LegacyWorkCover";
import {
  getCoverThemeColors,
  normalizeHexColor,
  readCoverSeed,
  readCoverStyle,
  type CoverStyle,
} from "../data/covers";
export interface WorkCoverProps extends LegacyProps {
  seed?: number;
}

/** Pure deterministic composition: no random values, network, fonts or SVG IDs. */
export function coverComposition(style: CoverStyle, seed = 0) {
  const value = readCoverSeed(seed);
  return { variant: value % 5, turn: Math.floor(value / 5) % 4, style };
}
const serif = "Georgia, 'Times New Roman', serif";
const mono = "'Courier New', monospace";
const sans = "Arial, Helvetica, sans-serif";
const fonts: Partial<Record<CoverStyle, string>> = {
  cyberpunk: mono,
  manga: sans,
  bold: sans,
  monolith: sans,
  noir: mono,
  retro: sans,
  experimental_type: mono,
  swiss_editorial: sans,
  webtoon_pop: sans,
  holographic: sans,
  conceptual: sans,
  risograph: mono,
};
export function WorkCover(props: WorkCoverProps) {
  const {
    title,
    author = "Autor do Arquivo",
    subtitle,
    color = "#14243B",
    format,
    editionLabel,
    size = "responsive",
    className = "",
    aspectRatio = "3/4",
    seed = 0,
  } = props;
  const style = readCoverStyle(props.style ?? "geometric");
  if (style === "legacy" && readCoverSeed(seed) === 0)
    return <LegacyWorkCover {...props} style="legacy" />;
  const background = normalizeHexColor(color);
  const theme = getCoverThemeColors(background);
  const { variant, turn } = coverComposition(style, seed);
  const dimensions: CSSProperties =
    size === "sm"
      ? { width: 130, height: 180 }
      : size === "md"
        ? { width: 220, height: 305 }
        : size === "lg"
          ? { width: 320, height: 445 }
          : {
              width: "100%",
              aspectRatio: aspectRatio === "2/3" ? "2/3" : "3/4",
            };
  const layouts: CSSProperties[] = [
    { left: "7%", right: "7%", bottom: "12%", textAlign: "left" },
    { left: "7%", right: "7%", top: "13%", textAlign: "center" },
    {
      left: "13%",
      right: "13%",
      top: "34%",
      textAlign: "center",
      border: `1px solid ${theme.textPrimary}`,
    },
    { left: "32%", right: "5%", bottom: "15%", textAlign: "right" },
    {
      left: "5%",
      right: "20%",
      top: "20%",
      textAlign: "left",
      borderLeft: `4px solid ${theme.textPrimary}`,
    },
  ];
  const length = Array.from(title).length;
  return (
    <div
      className={`ag-work-cover ag-cover-v2 ${className}`}
      data-cover-style={style}
      data-cover-seed={readCoverSeed(seed)}
      data-cover-variant={variant}
      style={{
        ...dimensions,
        position: "relative",
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: background,
        color: theme.textPrimary,
        borderRadius: 3,
        boxShadow: `0 8px 24px ${theme.shadowColor}`,
      }}
      aria-hidden="true"
    >
      <svg
        className="ag-cover-art"
        viewBox="0 0 300 400"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          color: theme.textPrimary,
        }}
      >
        <g
          transform={
            [
              "translate(0 -80)",
              "translate(0 150)",
              "translate(0 0)",
              "translate(-100 0)",
              "translate(70 85)",
            ][variant]
          }
        >
          <g transform={`rotate(${turn * 90} 150 200)`}>
            <Artwork style={style} />
          </g>
        </g>
      </svg>
      <div
        className="ag-cover-edition"
        style={{
          position: "absolute",
          top: "4%",
          left: "7%",
          right: "7%",
          fontSize: "clamp(5px,2.4cqw,10px)",
          fontFamily: mono,
          backgroundColor: background,
          color: theme.textSecondary,
          letterSpacing: ".14em",
          overflowWrap: "anywhere",
        }}
      >
        {editionLabel || (format ? `AG · ${format}` : "ARQUIVO GLOBAL")}
      </div>
      <div
        className="ag-cover-type"
        style={{
          ...layouts[variant],
          position: "absolute",
          padding: "5%",
          backgroundColor: background,
          fontFamily: fonts[style] ?? serif,
        }}
      >
        {author && (
          <p
            style={{
              fontSize: "clamp(5px,3cqw,12px)",
              color: theme.textSecondary,
              marginBottom: ".8em",
              overflowWrap: "anywhere",
              letterSpacing: ".08em",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {author}
          </p>
        )}
        <h3
          style={{
            fontSize: `clamp(6px,${length > 120 ? 4 : length > 60 ? 5.3 : length > 30 ? 7 : 10}cqw,44px)`,
            lineHeight: 1.08,
            fontWeight: [
              "bold",
              "monolith",
              "swiss_editorial",
              "manga",
            ].includes(style)
              ? 900
              : 500,
            letterSpacing: style === "experimental_type" ? ".08em" : "-.02em",
            overflowWrap: "anywhere",
            color: theme.textPrimary,
            margin: 0,
            fontStyle: ["lyric", "illustrated_romance", "ethereal"].includes(
              style,
            )
              ? "italic"
              : "normal",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: "clamp(5px,3cqw,12px)",
              marginTop: ".8em",
              overflowWrap: "anywhere",
              color: theme.textMuted,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span
        style={{
          position: "absolute",
          left: "7%",
          bottom: "4%",
          fontFamily: mono,
          fontSize: "clamp(5px,2.2cqw,10px)",
          backgroundColor: background,
          color: theme.textMuted,
        }}
      >
        ARQUIVO GLOBAL · {format || "LEITURA"}
      </span>
    </div>
  );
}

function Artwork({ style }: { style: CoverStyle }) {
  const line = { stroke: "currentColor", strokeWidth: 1.5 };
  switch (style) {
    case "legacy":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx="150"
              cy={300 + i * 30}
              rx="190"
              ry="75"
              stroke="currentColor"
              transform="rotate(-15 150 330)"
            />
          ))}
          <circle cx="210" cy="90" r="60" fill="currentColor" opacity=".2" />
        </>
      );
    case "minimalist":
      return (
        <>
          <rect x="28" y="38" width="244" height="324" {...line} />
          <circle cx="150" cy="150" r="7" fill="currentColor" />
          <path d="M150 72V125M130 150H170" {...line} />
        </>
      );
    case "geometric":
      return (
        <>
          <circle cx="210" cy="145" r="110" fill="currentColor" opacity=".2" />
          <path d="M25 280L155 35L285 280Z" {...line} />
          <rect
            x="50"
            y="90"
            width="130"
            height="130"
            {...line}
            transform="rotate(30 115 155)"
          />
        </>
      );
    case "lyric":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M-30 ${110 + i * 26}Q70 ${30 + i * 22} 160 ${160 + i * 18}T330 ${100 + i * 28}`}
              {...line}
            />
          ))}
        </>
      );
    case "bold":
      return (
        <>
          <path d="M-20 15H220L50 280H-20Z" fill="currentColor" />
          <path
            d="M90 335L300 30V120L150 335Z"
            fill="currentColor"
            opacity=".3"
          />
        </>
      );
    case "monolith":
      return (
        <>
          <rect
            x="100"
            y="20"
            width="100"
            height="350"
            fill="currentColor"
            opacity=".26"
          />
          <rect x="85" y="50" width="130" height="290" {...line} />
          <circle cx="150" cy="98" r="25" {...line} />
        </>
      );
    case "classic":
      return (
        <>
          <rect x="20" y="20" width="260" height="360" {...line} />
          <rect x="29" y="29" width="242" height="342" {...line} />
          {[35, 265].map((x) => (
            <path
              key={x}
              d={`M${x} 50q-25 30 0 60q25 30 0 60q-25 30 0 60q25 30 0 60`}
              {...line}
            />
          ))}
        </>
      );
    case "cyberpunk":
      return (
        <>
          <path
            d="M-10 120H80V40H200V180H310M30 330V220H120V150H240V370"
            {...line}
            strokeWidth="8"
          />
          <path d="M0 65H300M0 300H300" {...line} strokeDasharray="9 8" />
          {[50, 150, 250].map((x) => (
            <rect
              key={x}
              x={x}
              y="100"
              width="20"
              height="20"
              fill="currentColor"
            />
          ))}
        </>
      );
    case "ethereal":
      return (
        <>
          {[75, 115, 155, 195, 235].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={150 + i * 12}
              rx="65"
              ry="120"
              {...line}
              opacity={0.15 + i * 0.12}
              transform={`rotate(${i * 20} ${x} 180)`}
            />
          ))}
        </>
      );
    case "noir":
      return (
        <>
          <path d="M0 0H300L0 330Z" fill="currentColor" opacity=".18" />
          {[60, 100, 140, 180, 220].map((y) => (
            <path
              key={y}
              d={`M0 ${y}L300 ${y - 50}`}
              {...line}
              strokeWidth="12"
            />
          ))}
          <circle cx="230" cy="280" r="36" {...line} />
        </>
      );
    case "collage":
      return (
        <>
          <path
            d="M20 40L180 20L165 240L15 260Z"
            fill="currentColor"
            opacity=".3"
          />
          <path
            d="M110 80L280 120L230 340L70 300Z"
            {...line}
            strokeDasharray="3 2"
          />
          <circle cx="230" cy="70" r="45" {...line} />
          <path
            d="M0 280L300 230V340L0 380Z"
            fill="currentColor"
            opacity=".14"
          />
        </>
      );
    case "botanical":
      return (
        <>
          <path d="M70 400Q180 250 140 20" {...line} />
          {[70, 130, 190, 250, 310].map((y, i) => (
            <g key={y}>
              <ellipse
                cx={110 + i * 7}
                cy={y}
                rx="20"
                ry="43"
                transform={`rotate(-50 ${110 + i * 7} ${y})`}
                {...line}
              />
              <ellipse
                cx={170 - i * 5}
                cy={y + 20}
                rx="18"
                ry="38"
                transform={`rotate(45 ${170 - i * 5} ${y + 20})`}
                {...line}
              />
            </g>
          ))}
        </>
      );
    case "manga":
      return (
        <>
          <path
            d="M15 20H285V180H15ZM15 195H160V380H15ZM175 195H285V380H175Z"
            {...line}
            strokeWidth="5"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M150 145L${i * 25 - 20} ${i % 2 ? 0 : 310}`}
              {...line}
            />
          ))}
        </>
      );
    case "surrealist":
      return (
        <>
          <ellipse cx="150" cy="140" rx="115" ry="55" {...line} />
          <circle cx="150" cy="140" r="35" fill="currentColor" />
          <path d="M70 350V280H110V245H150V210H190" {...line} strokeWidth="8" />
          <ellipse cx="210" cy="290" rx="40" ry="14" {...line} />
        </>
      );
    case "gothic":
      return (
        <>
          <path
            d="M40 380V155Q40 60 150 15Q260 60 260 155V380M75 380V160Q75 95 150 55Q225 95 225 160V380"
            {...line}
            strokeWidth="3"
          />
          <path d="M150 55V380M40 190H260M75 300H225" {...line} />
          <circle cx="150" cy="135" r="28" {...line} />
        </>
      );
    case "retro":
      return (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${25 + i * 18} 380V150a${125 - i * 18} ${125 - i * 18} 0 0 1 ${250 - i * 36} 0V380`}
              {...line}
              strokeWidth="8"
              opacity={0.3 + i * 0.1}
            />
          ))}
        </>
      );
    case "illustrated_romance":
      return (
        <>
          <path
            d="M55 290Q20 130 120 100Q150 140 180 100Q280 130 245 290"
            {...line}
            strokeWidth="4"
          />
          <path
            d="M150 270C30 180 80 100 150 160C220 100 270 180 150 270Z"
            fill="currentColor"
            opacity=".22"
          />
          <circle cx="65" cy="90" r="18" {...line} />
          <circle cx="235" cy="90" r="18" {...line} />
        </>
      );
    case "painterly":
      return (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${-40 + i * 12} ${60 + i * 50}Q150 ${130 + i * 23} ${310 - i * 8} ${35 + i * 52}`}
              stroke="currentColor"
              strokeWidth={15 + i * 5}
              opacity={0.12 + i * 0.1}
              strokeLinecap="round"
            />
          ))}
        </>
      );
    case "experimental_type":
      return (
        <>
          <text
            x="-15"
            y="210"
            fill="currentColor"
            fontFamily={sans}
            fontSize="240"
            fontWeight="900"
            transform="rotate(-20 150 200)"
          >
            A
          </text>
          <text
            x="170"
            y="350"
            fill="currentColor"
            opacity=".35"
            fontFamily={mono}
            fontSize="180"
          >
            G
          </text>
        </>
      );
    case "cinematic":
      return (
        <>
          <path
            d="M0 20H300V65H0ZM0 335H300V380H0Z"
            fill="currentColor"
            opacity=".3"
          />
          <path d="M40 330L150 90L260 330" {...line} />
          <circle cx="150" cy="155" r="45" {...line} />
          <path d="M0 280Q150 200 300 280" {...line} />
        </>
      );
    case "conceptual":
      return (
        <>
          <circle cx="150" cy="150" r="82" {...line} strokeDasharray="2 8" />
          <path d="M150 68V232M68 150H232" {...line} />
          <rect x="131" y="131" width="38" height="38" fill="currentColor" />
          <path d="M150 245V350" {...line} />
        </>
      );
    case "celestial_luxury":
      return (
        <>
          <rect x="22" y="22" width="256" height="356" {...line} />
          <circle cx="150" cy="155" r="93" {...line} />
          <circle cx="150" cy="155" r="75" {...line} />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M150 42V59M146 50H154"
              {...line}
              transform={`rotate(${i * 30} 150 155)`}
            />
          ))}
        </>
      );
    case "dark_academia":
      return (
        <>
          <path
            d="M20 380V130Q20 30 150 30Q280 30 280 130V380M65 380V130Q65 70 150 70Q235 70 235 130V380"
            {...line}
          />
          {[50, 110, 170, 230].map((x) => (
            <rect key={x} x={x} y="190" width="28" height="160" {...line} />
          ))}
          <path d="M30 355H270" {...line} strokeWidth="6" />
        </>
      );
    case "mystic_tarot":
      return (
        <>
          <rect x="35" y="25" width="230" height="350" rx="90" {...line} />
          <path d="M150 65L230 195L150 325L70 195Z" {...line} />
          <circle cx="150" cy="195" r="42" {...line} />
          <path
            d="M140 165Q190 195 140 225Q160 195 140 165"
            fill="currentColor"
          />
        </>
      );
    case "arcane":
      return (
        <>
          <circle cx="150" cy="190" r="125" {...line} />
          <path d="M150 65L259 252H41ZM150 315L41 128H259Z" {...line} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d="M150 34v18m-5-9h10"
              {...line}
              transform={`rotate(${i * 60} 150 190)`}
            />
          ))}
        </>
      );
    case "swiss_editorial":
      return (
        <>
          <rect x="18" y="30" width="85" height="200" fill="currentColor" />
          <circle cx="205" cy="180" r="72" fill="currentColor" opacity=".3" />
          <path d="M18 260H282M118 30V370" {...line} strokeWidth="3" />
          <text
            x="170"
            y="345"
            fill="currentColor"
            fontFamily={sans}
            fontSize="90"
            fontWeight="900"
          >
            01
          </text>
        </>
      );
    case "holographic":
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <ellipse
              key={i}
              cx="150"
              cy="190"
              rx={30 + i * 16}
              ry={115 - i * 6}
              {...line}
              transform={`rotate(${i * 18} 150 190)`}
            />
          ))}
          <path d="M30 30L270 350" {...line} strokeWidth="15" opacity=".2" />
        </>
      );
    case "sumi_e":
      return (
        <>
          <path
            d="M220 100C120 20 10 100 60 210C110 330 280 250 230 145"
            stroke="currentColor"
            strokeWidth="23"
            strokeLinecap="round"
          />
          <path d="M40 350Q170 240 200 40" {...line} strokeWidth="4" />
          <rect x="230" y="300" width="30" height="40" {...line} />
        </>
      );
    case "risograph":
      return (
        <>
          <circle cx="115" cy="145" r="90" fill="currentColor" opacity=".22" />
          <path d="M110 50H260V300H110Z" fill="currentColor" opacity=".22" />
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={`M20 ${50 + i * 18}H280`}
              {...line}
              strokeDasharray="2 6"
            />
          ))}
        </>
      );
    case "bl_romance":
      return (
        <>
          <path
            d="M40 330Q35 170 110 170Q155 170 150 330M150 330Q145 170 220 170Q265 170 260 330"
            {...line}
            strokeWidth="3"
          />
          <circle cx="100" cy="135" r="30" {...line} />
          <circle cx="210" cy="135" r="30" {...line} />
          <path
            d="M155 90C115 55 140 30 155 55C175 30 200 55 155 90Z"
            fill="currentColor"
            opacity=".4"
          />
        </>
      );
    case "fairytale":
      return (
        <>
          <path
            d="M60 340V180H100V95L125 45L150 95V180H200V130L225 80L250 130V340Z"
            {...line}
          />
          <path
            d="M15 380Q150 245 285 380M40 140Q0 220 45 310M270 60Q220 180 280 290"
            {...line}
          />
          <circle cx="55" cy="65" r="18" {...line} />
        </>
      );
    case "symbolic_romance":
      return (
        <>
          <circle cx="115" cy="170" r="70" {...line} strokeWidth="6" />
          <circle cx="185" cy="170" r="70" {...line} strokeWidth="6" />
          <path d="M150 245V350M135 330H165" {...line} />
          <path d="M35 65L65 35M235 65L265 35" {...line} />
        </>
      );
    case "webtoon_pop":
      return (
        <>
          <path
            d="M20 35H220V160H100L50 205V160H20ZM90 225H280V340H240L250 375L200 340H90Z"
            {...line}
            strokeWidth="5"
          />
          <path
            d="M240 35L255 65L285 70L263 90L268 120L240 105L215 120L218 90L198 70L228 65Z"
            fill="currentColor"
            opacity=".4"
          />
        </>
      );
    default:
      return null;
  }
}
