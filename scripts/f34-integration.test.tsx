import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import React from "react";

import { Cover, WorkCard } from "../src/foundation/components/WorkCard";
import { WorkCover } from "../src/foundation/components/WorkCover";
import {
  EDITORIAL_COVER_PALETTE,
  COVER_STYLES,
  getCoverContrastTheme,
} from "../src/foundation/data/covers";
import { getGenresForFormat } from "../src/foundation/data/genres";
import { inauguralWorks } from "./fixtures/editorial-fixture";
import { WorkMetadataForm } from "../src/foundation/features/studio/WorkMetadataForm";
import type { StudioWork } from "../src/foundation/features/studio/types";
import type { Work } from "../src/foundation/data/works";

function renderComponent(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const stream = new PassThrough();
    stream.on("data", (chunk) => {
      html += chunk.toString("utf8");
    });
    stream.on("end", () => resolve(html));
    stream.on("error", reject);

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(stream);
      },
      onError(err) {
        reject(err);
      },
    });
  });
}

test("public covers: Cover never revives artwork for a former editorial ID", async () => {
  const inaugural = inauguralWorks[0];
  const work: Work = {
    id: inaugural.id,
    title: inaugural.title,
    author: inaugural.author,
    authorId: inaugural.authorId,
    format: inaugural.format,
    genre: inaugural.genre,
    tags: inaugural.tags,
    synopsis: inaugural.synopsis,
    createdAt: inaugural.preparedAt,
    cover: inaugural.cover,
  };

  const html = await renderComponent(<Cover work={work} />);
  assert.ok(!html.includes("editorial-cover-asset"));
  assert.ok(!html.includes(inaugural.coverAsset));
  assert.ok(html.includes("ag-work-cover"));
});

test("public covers: Cover renders WorkCover with real coverAccentColor and legacy style for user publications", async () => {
  const publishedWork: Work = {
    id: "pub-12345",
    title: "Vozes do Zambeze",
    subtitle: "Contos Fluviais",
    author: "Mia Couto",
    authorId: "user-mia",
    format: "Conto",
    genre: "Realismo mágico",
    tags: ["rio", "moçambique", "memória"],
    synopsis: "Histórias que fluem com o rio.",
    createdAt: "2026-03-01T10:00:00Z",
    cover: 1,
    coverAccentColor: "#064E3B", // Esmeralda Noturna
    origin: "user-publication",
  };

  const html = await renderComponent(<Cover work={publishedWork} />);
  assert.ok(html.includes("Vozes do Zambeze"), "Must render title");
  assert.ok(html.includes("Mia Couto"), "Must render author");
  assert.ok(html.includes("Contos Fluviais"), "Must render subtitle");
  assert.ok(html.includes("#064E3B"), "Must use real coverAccentColor");
  assert.ok(
    html.includes("OBRA PUBLICADA"),
    "Must show published edition label",
  );
});

import { MemoryRouter } from "react-router-dom";

test("public covers: WorkCard integrates Cover seamlessly", async () => {
  const customWork: Work = {
    id: "work-custom-99",
    title: "A Dança das Estrelas",
    author: "Paulina Chiziane",
    authorId: "paulina",
    format: "Romance",
    genre: "Ficção especulativa",
    tags: ["astros", "moçambique"],
    synopsis: "Uma odisseia poética.",
    createdAt: "2026-04-01T12:00:00Z",
    cover: 2,
    coverAccentColor: "#581C87", // Vinho Tinto
    origin: "user-publication",
  };

  const html = await renderComponent(
    <MemoryRouter>
      <WorkCard work={customWork} />
    </MemoryRouter>,
  );
  assert.ok(html.includes("A Dança das Estrelas"));
  assert.ok(html.includes("Paulina Chiziane"));
  assert.ok(html.includes("#581C87"));
});

test("creation and editing: getGenresForFormat provides contextual suggestions without losing all genres", () => {
  const mangaGenres = getGenresForFormat("Mangá");
  assert.ok(
    mangaGenres.recommended.some(
      (g) =>
        g.toLowerCase().includes("shonen") ||
        g.toLowerCase().includes("visual") ||
        g.toLowerCase().includes("fantasia"),
    ),
  );
  assert.ok(mangaGenres.all.length > mangaGenres.recommended.length);

  const poetryGenres = getGenresForFormat("Poesia");
  assert.ok(
    poetryGenres.recommended.some((g) => g.toLowerCase().includes("poesia")),
  );
});

test("palette: 28 editorial colors cover diverse groups and validate WCAG AA contrast", () => {
  assert.equal(
    EDITORIAL_COVER_PALETTE.length,
    28,
    "Must contain exactly 28 editorial colors",
  );

  const lightColors = EDITORIAL_COVER_PALETTE.filter(
    (c) => getCoverContrastTheme(c.hex) === "light",
  );
  const darkColors = EDITORIAL_COVER_PALETTE.filter(
    (c) => getCoverContrastTheme(c.hex) === "dark",
  );

  assert.ok(
    lightColors.length >= 3,
    "Must have accessible light background colors",
  );
  assert.ok(darkColors.length >= 20, "Must have dark background colors");
});

test("WorkMetadataForm: renders LanguageCombobox, contextual genres, 28-color palette, styles and live preview", async () => {
  const mockWork: StudioWork = {
    id: "studio-work-1",
    ownerId: "author-1",
    title: "O Luar de Sofala",
    subtitle: "Memórias da Baía",
    synopsis: "Uma narrativa sobre as marés da infância.",
    format: "Romance",
    mode: "prose",
    genre: "Realismo mágico",
    language: "Português",
    tags: ["mar", "beira"],
    ageRating: "Livre",
    contentWarnings: [],
    coverAccentColor: "#14243B",
    status: "draft",
    visibility: "private",
    revision: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    chapters: [],
  };

  const html = await renderComponent(
    <WorkMetadataForm work={mockWork} onDirtyChange={() => {}} />,
  );

  // Accessible inputs
  assert.ok(html.includes("Editar metadados"), "Must have form heading");
  assert.ok(html.includes("O Luar de Sofala"), "Must display initial title");
  assert.ok(
    html.includes('role="combobox"'),
    "Must render accessible LanguageCombobox",
  );
  assert.ok(html.includes("Português"), "Must have selected language");

  // Contextual genres
  assert.ok(
    html.includes("Sugeridos para Romance"),
    "Must group recommended genres for format",
  );
  assert.ok(
    html.includes("Todos os géneros"),
    "Must keep all genres accessible",
  );

  // 28 colors
  assert.ok(
    html.includes("Cor da Capa (28 Cores ou Personalizada)"),
    "Must render 28-color palette section",
  );
  assert.ok(html.includes("#14243B"), "Must reflect selected color");

  // Style experimenter and persistence disclaimer
  assert.ok(
    html.includes("Experimentar Estilos Gráficos"),
    "Must render style experimenter",
  );
  assert.ok(
    html.includes("Persistência de estilo na próxima fase"),
    "Must clearly identify persistence limitation",
  );

  // Live cover preview
  assert.ok(html.includes("Pré-visualização Viva"), "Must render live preview");
  assert.ok(
    html.includes("Memórias da Baía"),
    "Live preview must reflect subtitle",
  );
});
