import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient, type User } from "@supabase/supabase-js";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import {
  createWorksRepository,
  metadataPayload,
  type DraftMetadata,
} from "../src/foundation/features/studio/worksRepository";
import { WorksController } from "../src/foundation/features/studio/worksController";
import { createPublicWorksRepository } from "../src/foundation/features/catalog/repository";
import { Cover } from "../src/foundation/components/WorkCard";
import { inauguralWorks } from "../src/foundation/data/inaugural";
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});
const owner = "10000000-0000-0000-0000-000000000001",
  id = "20000000-0000-0000-0000-000000000001";
const metadata: DraftMetadata = {
  title: "Obra",
  subtitle: "Subtítulo",
  synopsis: "Sinopse",
  format: "Romance",
  language: "pt",
  genre: "Fantasia",
  tags: [],
  ageRating: "Livre",
  contentWarnings: [],
  coverAccentColor: "#14243B",
};
function backend(installed = true) {
  let fail = false;
  const rows = new Map<string, Record<string, any>>();
  const requests: { path: string; body: any; select: string | null }[] = [];
  const client = createClient("https://fixture.invalid", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        if (fail) throw Error("offline");
        const url = new URL(String(input)),
          body = init?.body ? JSON.parse(String(init.body)) : null;
        requests.push({
          path: url.pathname,
          body,
          select: url.searchParams.get("select"),
        });
        const headers = { "content-type": "application/json" };
        const response = (value: unknown, status = 200) =>
          new Response(JSON.stringify(value), { status, headers });
        if (
          !installed &&
          ((url.searchParams.get("select") ?? "").includes("cover_style") ||
            (body && "cover_style" in body))
        )
          return response({ code: "PGRST204", message: "missing column" }, 400);
        if (url.pathname.endsWith("read_private_work"))
          return response(rows.get(body.p_work_id) ?? null);
        const values = [...rows.values()];
        let result = values;
        if (init?.method === "POST") {
          const now = "2026-11-11T10:00:00Z";
          const row = {
            ...body,
            id: crypto.randomUUID(),
            owner_id: owner,
            status: "draft",
            visibility: "private",
            revision: 1,
            created_at: now,
            updated_at: now,
            entries: [],
            ...(installed ? { cover_style: body.cover_style ?? "legacy" } : {}),
          };
          rows.set(row.id, row);
          result = [row];
        } else if (init?.method === "PATCH") {
          result = values
            .filter(
              (r) =>
                url.searchParams.get("id") === "eq." + r.id &&
                url.searchParams.get("revision") === "eq." + r.revision,
            )
            .map((r) => ({ ...r, ...body, revision: r.revision + 1 }));
          result.forEach((r) => rows.set(r.id, r));
        } else {
          const offset = Number(url.searchParams.get("offset") ?? 0);
          result = values.slice(offset, offset + 100);
        }
        return response(
          (new Headers(init?.headers).get("accept") ?? "").includes(
            "vnd.pgrst.object",
          )
            ? (result[0] ?? null)
            : result,
        );
      },
    },
  });
  client.auth.getSession = async () => ({
    data: { session: { access_token: "validated-token" } as any },
    error: null,
  });
  client.auth.getUser = async () => ({
    data: { user: { id: owner } as User },
    error: null,
  });
  return {
    client,
    rows,
    requests,
    setFail: (value: boolean) => {
      fail = value;
    },
  };
}
test("cover styles: validated allowlist and disabled rollout never silently loses a style", () => {
  for (const style of [
    "legacy",
    "minimalist",
    "geometric",
    "lyric",
    "bold",
    "monolith",
  ] as const)
    assert.equal(
      metadataPayload({ ...metadata, coverStyle: style }, true).cover_style,
      style,
    );
  for (const coverStyle of ["bad", "", null, {}, "LEGACY"])
    assert.throws(
      () => metadataPayload({ ...metadata, coverStyle } as any, true),
      /inválido/,
    );
  assert.throws(
    () => metadataPayload({ ...metadata, coverStyle: "bold" }, false),
    /ativada/,
  );
  assert.throws(
    () => metadataPayload({ ...metadata, coverStyle: "legacy" }, false),
    /ativada/,
  );
  assert.equal("cover_style" in metadataPayload(metadata, false), false);
});
test("cover styles: create, reload, revision update, recovery and controller ACK preserve the persisted style", async () => {
  const fixture = backend(),
    repo = createWorksRepository(fixture.client, owner, {
      coverStyleEnabled: true,
    });
  const controller = new WorksController(repo);
  await controller.load();
  let work = (await controller.create({ ...metadata, coverStyle: "lyric" }))!;
  assert.equal(work.coverStyle, "lyric");
  const fresh = createWorksRepository(fixture.client, owner, {
    coverStyleEnabled: true,
  });
  assert.equal((await fresh.find(work.id))?.coverStyle, "lyric");
  assert.equal((await fresh.list())[0].coverStyle, "lyric");
  const original = work;
  work = (await controller.update(work, {
    ...metadata,
    coverStyle: "monolith",
  }))!;
  assert.equal(work.coverStyle, "monolith");
  assert.equal(work.revision, 2);
  await assert.rejects(
    fresh.update(original, { ...metadata, coverStyle: "bold" }),
    /alterada/,
  );
  // Missing style in a metadata-only caller must preserve it, not reset to legacy.
  work = await fresh.update(work, { ...metadata, title: "Novo título" });
  assert.equal(work.coverStyle, "monolith");
  await controller.load();
  assert.equal((await controller.recover(work.id))?.coverStyle, "monolith");
  fixture.setFail(true);
  assert.equal(
    await controller.update(work, { ...metadata, coverStyle: "bold" }),
    null,
  );
  assert.equal(controller.getSnapshot().works[0].coverStyle, "monolith");
  fixture.setFail(false);
  controller.stop();
});
test("cover styles: default/disabled frontend remains compatible with a database without the new columns", async () => {
  const fixture = backend(false),
    repo = createWorksRepository(fixture.client, owner, {
      coverStyleEnabled: false,
    });
  let work = await repo.create(metadata);
  assert.equal(work.coverStyle, "legacy");
  work = await repo.update(work, { ...metadata, title: "Compatível" });
  assert.equal(work.coverStyle, "legacy");
  assert.equal((await repo.find(work.id))?.title, "Compatível");
  assert.equal((await repo.list()).length, 1);
  assert.ok(
    fixture.requests.every(
      (r) =>
        !r.select?.includes("cover_style") &&
        !(r.body && "cover_style" in r.body),
    ),
  );
  const enabled = createWorksRepository(fixture.client, owner, {
    coverStyleEnabled: true,
  });
  await assert.rejects(
    enabled.create({ ...metadata, coverStyle: "bold" }),
    /migração/,
  );
  assert.equal(
    fixture.rows.size,
    1,
    "No retry/duplicate writes on schema mismatch",
  );
});
test("cover styles: public list, detail and search map the snapshot style only after activation", async () => {
  const row = {
    id,
    title: "Pública",
    subtitle: "",
    slug: "publica",
    type: "Romance",
    description: "Sinopse",
    genre: "Fantasia",
    language: "pt",
    age_rating: "Livre",
    tags: [],
    content_warnings: [],
    cover_accent_color: "#14243B",
    cover_style: "bold",
    first_published_at: "2026-11-11",
    last_published_at: "2026-11-11",
    entries: [],
  };
  const selects: string[] = [];
  const client = createClient("https://fixture.invalid", "public-test-key", {
    accessToken: async () => null,
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        assert.ok(!url.pathname.includes("private"));
        if (url.pathname.endsWith("read_public_work"))
          return Response.json(row);
        if (url.pathname.endsWith("search_public_works"))
          return Response.json({ items: [row], total: 1, page: 1, size: 12 });
        selects.push(url.searchParams.get("select")!);
        return Response.json([row]);
      },
    },
  });
  const { discoveryQuery } = await import(
    "../src/foundation/features/catalog/discovery"
  );
  const enabled = createPublicWorksRepository(client, {
    coverStyleEnabled: true,
  });
  assert.equal((await enabled.list())[0].coverStyle, "bold");
  assert.equal((await enabled.find(id))?.coverStyle, "bold");
  assert.equal(
    (await enabled.search!(discoveryQuery(new URLSearchParams()))).items[0]
      .coverStyle,
    "bold",
  );
  assert.ok(selects[0].includes("cover_style"));
  const disabled = createPublicWorksRepository(client, {
    coverStyleEnabled: false,
  });
  assert.equal((await disabled.list())[0].coverStyle, "legacy");
  assert.equal((await disabled.find(id))?.coverStyle, "legacy");
  assert.ok(!selects[1].includes("cover_style"));
});
test("cover styles: public covers use the selected style and keep inaugural images", () => {
  const work = {
    id,
    title: "Pública",
    author: "Autora",
    authorId: "autora",
    format: "Romance" as const,
    genre: "Fantasia",
    tags: [],
    synopsis: "",
    createdAt: "2026-11-11",
    cover: 1,
    coverStyle: "bold" as const,
  };
  const html = renderToStaticMarkup(
    <StaticRouter location="/">
      <Cover work={work} />
      <Cover work={inauguralWorks[0]} />
    </StaticRouter>,
  );
  assert.ok(html.includes(inauguralWorks[0].coverAsset));
  assert.ok(html.includes("ag-work-cover"));
  assert.ok(html.includes('data-cover-style="bold"'));
});
test("cover styles: replacement RPC bodies retain all previous logic except explicit style transport", () => {
  const dir = "supabase/migrations/";
  const migration = readFileSync(
    dir + "20261111040000_persist_cover_styles.sql",
    "utf8",
  );
  function extract(source: string, name: string) {
    const match = source.match(
      new RegExp(
        "CREATE(?: OR REPLACE)? FUNCTION public\\." +
          name +
          "\\([\\s\\S]*?\\n\\$\\$;",
      ),
    );
    assert.ok(match);
    return match[0].replace("CREATE OR REPLACE FUNCTION", "CREATE FUNCTION");
  }
  for (const [file, name] of [
    ["20261111010000_private_editorial_entries.sql", "mutate_private_work"],
    ["20261111020000_publication_catalog.sql", "publish_private_work"],
    ["20261111020000_publication_catalog.sql", "read_public_work"],
    ["20261111030000_public_discovery.sql", "search_public_works"],
  ]) {
    const prior = extract(readFileSync(dir + file, "utf8"), name);
    let current = extract(migration, name);
    current = current
      .replaceAll("cover_style=EXCLUDED.cover_style,", "")
      .replaceAll(",source.cover_style", "")
      .replaceAll(",cover_style", "")
      .replaceAll("'cover_style',p.cover_style,", "")
      .replaceAll(",p.cover_style", "");
    assert.equal(current, prior, name);
  }
});
test("Cover Studio V2: SDK create/edit/reload persists seed; schema gates reject new writes and preserve older contracts", async () => {
  const fixture = backend();
  const repo = createWorksRepository(fixture.client, owner, {
    coverStyleEnabled: true,
    coverStudioV2Enabled: true,
  });
  let w = await repo.create({
    ...metadata,
    coverStyle: "arcane",
    coverSeed: 4,
  });
  assert.equal(w.coverSeed, 4);
  assert.equal(w.coverStyle, "arcane");
  w = (await createWorksRepository(fixture.client, owner, {
    coverStyleEnabled: true,
    coverStudioV2Enabled: true,
  }).find(w.id))!;
  assert.equal(w.coverSeed, 4);
  w = await repo.update(w, {
    ...metadata,
    coverStyle: "holographic",
    coverSeed: 9,
  });
  assert.equal(w.coverSeed, 9);
  assert.equal(w.coverStyle, "holographic");
  w = await repo.update(w, metadata);
  assert.equal(w.coverSeed, 9);
  for (const coverSeed of [-1, 1.5, 2147483648])
    assert.throws(() =>
      metadataPayload({ ...metadata, coverSeed }, true, true),
    );
  assert.throws(
    () => metadataPayload({ ...metadata, coverStyle: "arcane" }, true, false),
    /pré-visualização/,
  );
  assert.throws(
    () => metadataPayload({ ...metadata, coverSeed: 0 }, true, false),
    /pré-visualização/,
  );
  const older = createWorksRepository(fixture.client, owner, {
    coverStyleEnabled: true,
    coverStudioV2Enabled: false,
  });
  assert.equal((await older.find(w.id))?.coverSeed, 0);
  assert.equal((await older.find(w.id))?.coverStyle, "legacy");
  const compatibilityWork = (await older.find(w.id))!;
  assert.equal(compatibilityWork.coverAppearanceLocked, true);
  await assert.rejects(
    older.update(compatibilityWork, { ...metadata, coverStyle: "legacy" }),
  );
  await older.update(compatibilityWork, metadata);
  const retained = (await repo.find(w.id))!;
  assert.equal(retained.coverStyle, "holographic");
  assert.equal(retained.coverSeed, 9);

  assert.ok(
    !fixture.requests
      .filter((r) => r.select && !r.select.includes("cover_seed"))
      .some((r) => r.body?.cover_seed !== undefined),
  );
});
test("Cover Studio V2: public SDK list/detail/search use seed only after V2 activation", async () => {
  const row = {
    id,
    title: "Snapshot",
    type: "Conto",
    tags: [],
    content_warnings: [],
    first_published_at: "2026-11-11",
    last_published_at: "2026-11-11",
    cover_style: "classic",
    cover_seed: 17,
  };
  const selects: string[] = [];
  const client = createClient("https://fixture.invalid", "public-test-key", {
    accessToken: async () => null,
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        assert.ok(!url.pathname.includes("private"));
        if (url.pathname.endsWith("read_public_work"))
          return Response.json(row);
        if (url.pathname.endsWith("search_public_works"))
          return Response.json({ items: [row], total: 1, page: 1, size: 12 });
        selects.push(url.searchParams.get("select") ?? "");
        return Response.json([row]);
      },
    },
  });
  const active = createPublicWorksRepository(client, {
    coverStyleEnabled: true,
    coverStudioV2Enabled: true,
  });
  assert.equal((await active.list())[0].coverSeed, 17);
  assert.equal((await active.find(id))?.coverStyle, "classic");
  const { discoveryQuery } = await import(
    "../src/foundation/features/catalog/discovery"
  );
  assert.equal(
    (await active.search!(discoveryQuery(new URLSearchParams()))).items[0]
      .coverSeed,
    17,
  );
  assert.ok(selects[0].includes("cover_seed"));
  const old = createPublicWorksRepository(client, {
    coverStyleEnabled: true,
    coverStudioV2Enabled: false,
  });
  assert.equal((await old.list())[0].coverStyle, "legacy");
  assert.equal((await old.find(id))?.coverSeed, 0);
  assert.ok(!selects[1].includes("cover_seed"));
});
