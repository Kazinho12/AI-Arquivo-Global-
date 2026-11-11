import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { CoverStudioGallery } from "../src/foundation/components/CoverStudioGallery";
import { WorkCover } from "../src/foundation/components/WorkCover";
import {
  COVER_STYLES,
  coverStyleDefinitions,
  type CoverStyle,
} from "../src/foundation/data/covers";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!,
  root = createRoot(fixture);
const pause = () => new Promise((resolve) => setTimeout(resolve, 30));
let driverId = 0;
function drive(input: object) {
  return new Promise<void>((resolve) => {
    const id = ++driverId;
    const done = (event: Event) => {
      if ((event as CustomEvent).detail === id) {
        window.removeEventListener("test-driver-done", done);
        resolve();
      }
    };
    window.addEventListener("test-driver-done", done);
    (
      window as typeof window & { testDriver: (message: string) => void }
    ).testDriver(JSON.stringify({ ...input, id }));
  });
}
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
function Gallery() {
  const [style, setStyle] = useState<CoverStyle>("geometric"),
    [seed, setSeed] = useState(0);
  return (
    <CoverStudioGallery
      title="Entre o céu e a memória"
      author="Autora de teste"
      color="#14243B"
      format="Romance"
      style={style}
      seed={seed}
      onStyle={setStyle}
      onSeed={setSeed}
    />
  );
}
const styles = [...COVER_STYLES, "legacy"] as const;
async function atlas(seed: number) {
  await act(async () => {
    root.render(
      <div
        style={{
          maxWidth: 900,
          margin: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(8,minmax(0,1fr))",
          gap: 10,
        }}
      >
        {styles.map((style) => (
          <article key={style}>
            <WorkCover
              title="Entre o céu e a memória"
              author="Autora de teste"
              style={style}
              seed={seed}
              color="#14243B"
            />
            <p style={{ fontSize: 10 }}>{coverStyleDefinitions[style].label}</p>
          </article>
        ))}
      </div>,
    );
    await pause();
  });
}
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, task: () => Promise<void>) {
  try {
    await task();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    await act(async () => root.render(null));
  }
}
await run(
  "Cover Studio V2: thumbnail selection and five generated compositions are local previews",
  async () => {
    await act(async () => {
      root.render(<Gallery />);
      await pause();
    });
    check(
      fixture.querySelectorAll(".cover-style-option").length === 33,
      "Faltam miniaturas",
    );
    const classic = fixture.querySelector<HTMLButtonElement>(
      '[aria-label="Estilo de capa Clássico"]',
    )!;
    await act(async () => {
      classic.click();
      await pause();
    });
    check(classic.getAttribute("aria-pressed") === "true", "Seleção falhou");
    const generate = [...fixture.querySelectorAll("button")].find((el) =>
      el.textContent?.includes("Gerar outra variação"),
    )!;
    const variants = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const cover = classic.querySelector(".ag-work-cover")!;
      variants.add(
        cover.querySelector("svg")!.outerHTML +
          cover.querySelector<HTMLElement>(".ag-cover-type")!.style.cssText,
      );
      await act(async () => {
        generate.click();
        await pause();
      });
    }
    check(variants.size === 5, "Composições repetidas");
    check(
      fixture.textContent?.includes("sem gravação automática"),
      "Falta aviso de pré-visualização",
    );
  },
);
await run(
  "Cover Studio V2: all 33 styles have five actual artwork/layout variations",
  async () => {
    const fingerprints = new Map<string, Set<string>>();
    for (let seed = 0; seed < 5; seed++) {
      await atlas(seed);
      for (const cover of fixture.querySelectorAll<HTMLElement>(
        ".ag-work-cover",
      )) {
        const style = cover.dataset.coverStyle!;
        const fingerprintsForStyle =
          fingerprints.get(style) ?? new Set<string>();
        fingerprintsForStyle.add(
          cover.querySelector("svg")!.outerHTML +
            (cover.querySelector<HTMLElement>(".ag-cover-type")?.style
              .cssText ?? "legacy"),
        );
        fingerprints.set(style, fingerprintsForStyle);
      }
    }
    for (const [style, variants] of fingerprints)
      check(variants.size === 5, "Sem diversidade: " + style);
    await atlas(0);
    window.scrollTo(0, 0);
    await drive({ kind: "viewport", width: 1280 });
    await drive({ kind: "screenshot", label: "cover-studio-v2-atlas" });
  },
);
await run(
  "Cover Studio V2: keyboard selection and responsive gallery in light/dark themes",
  async () => {
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      await act(async () => {
        root.render(<Gallery />);
        await pause();
      });
      for (const width of [320, 375, 768]) {
        await act(async () => {
          await drive({ kind: "viewport", width });
          await pause();
        });
        check(
          document.documentElement.scrollWidth <= innerWidth + 2,
          "Overflow",
        );
      }
      const button = fixture.querySelector<HTMLButtonElement>(
        '[aria-label="Estilo de capa Tarot Místico"]',
      )!;
      button.focus();
      check(document.activeElement === button, "Sem foco");
      await act(async () => {
        button.click();
        await pause();
      });
      check(
        button.getAttribute("aria-pressed") === "true",
        "Seleção acessível falhou",
      );
    }
    await act(async () => {
      await drive({ kind: "viewport", width: 1280 });
      await pause();
    });
  },
);
await run(
  "Cover Studio V2: maximum-length titles fit all styles and compositions",
  async () => {
    for (let seed = 0; seed < 5; seed++) {
      await act(async () => {
        root.render(
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,200px)",
              gap: 12,
            }}
          >
            {styles.map((style) => (
              <WorkCover
                key={style}
                title={"Uma história extraordinária de memória e encontros "
                  .repeat(5)
                  .slice(0, 200)}
                author="Autora de teste"
                subtitle="Edição de teste"
                style={style}
                seed={seed}
              />
            ))}
          </div>,
        );
        await pause();
      });
      for (const cover of fixture.querySelectorAll<HTMLElement>(
        ".ag-work-cover",
      )) {
        const title = cover.querySelector<HTMLElement>("h3")!,
          outer = cover.getBoundingClientRect(),
          rect = title.getBoundingClientRect();
        check(
          rect.top >= outer.top - 1 &&
            rect.bottom <= outer.bottom + 1 &&
            rect.left >= outer.left - 1 &&
            rect.right <= outer.right + 1,
          "Título fora da capa: " + cover.dataset.coverStyle + " / " + seed,
        );
        check(
          title.scrollWidth <= title.clientWidth + 2,
          "Título longo com overflow",
        );
      }
    }
  },
);

document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
