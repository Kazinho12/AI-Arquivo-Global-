import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CoverPicker,
  coverDraft,
} from "../src/foundation/features/media/CoverPicker";
import { metadataPayload } from "../src/foundation/features/studio/worksRepository";
import {
  readCoverImage,
  publicCoverUrl,
} from "../src/foundation/features/media/covers";
import {
  validateCover,
  uploadCover,
} from "../src/foundation/features/media/coverService";
import type { SupabaseClient } from "@supabase/supabase-js";
const owner = "10000000-0000-0000-0000-000000000001",
  other = "10000000-0000-0000-0000-000000000002",
  work = "20000000-0000-0000-0000-000000000001",
  pub = "30000000-0000-0000-0000-000000000001",
  asset = "40000000-0000-0000-0000-000000000001";
const png = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jgGkAAAAASUVORK5CYII=",
    "base64",
  ),
);
const workerSource = readFileSync("docs/cloudflare-cover-media.js", "utf8");
function fixture() {
  const objects = new Map<
      string,
      { bytes: Uint8Array | string; mime: string }
    >(),
    assets = new Map<string, any>();
  const state = {
    reference: null as string | null,
    published: null as string | null,
    failPut: false,
    failed: false,
  };
  let sequence = 0;
  const calls: { path: string; headers: Headers }[] = [];
  const sandbox: any = {
    Request,
    Response,
    Headers,
    URL,
    AbortSignal,
    Uint8Array,
    DataView,
    Date,
    atob,
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    workerSource +
      "\nglobalThis.handle=handleAgCoverMedia;globalThis.validate=validateCoverBytes;",
    sandbox,
  );
  const env = {
    SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    COVER_MEDIA_TOKEN: "cover-worker-test-00000000000000000000000000000000",
    AG_MEDIA: {
      async put(key: string, data: Uint8Array | string, options: any) {
        if (state.failPut && key.startsWith("cover-index/"))
          throw Error("offline");
        objects.set(key, {
          bytes: data,
          mime: options.httpMetadata.contentType,
        });
      },
      async get(key: string) {
        const row = objects.get(key);
        return row
          ? {
              body: row.bytes,
              httpMetadata: { contentType: row.mime },
              json: async () => JSON.parse(String(row.bytes)),
            }
          : null;
      },
      async delete(key: string) {
        objects.delete(key);
      },
    },
  };
  const fetcher = async (input: URL, init: any) => {
    const url = new URL(String(input));
    const headers = new Headers(init.headers);
    calls.push({ path: url.pathname, headers });
    assert.equal(init.redirect, "manual");
    assert.equal(headers.get("apikey"), "sb_publishable_test");
    assert.equal(url.origin, env.SUPABASE_URL);
    if (state.failed)
      return Response.json(
        { code: "XX000", message: "secret internal" },
        { status: 500 },
      );
    const actor =
      headers.get("authorization") === "Bearer owner-token"
        ? owner
        : headers.get("authorization") === "Bearer other-token"
          ? other
          : null;
    if (url.pathname === "/auth/v1/user")
      return actor
        ? Response.json({ id: actor })
        : Response.json({ message: "bad" }, { status: 401 });
    if (url.pathname === "/rest/v1/published_works") {
      assert.equal(headers.has("authorization"), false);
      return Response.json(
        url.searchParams.get("id") === "eq." + pub && state.published
          ? [{ cover_image: { assetId: state.published } }]
          : [],
      );
    }
    if (url.pathname === "/rest/v1/works")
      return Response.json(
        actor === owner && url.searchParams.get("id") === "eq." + work
          ? [{ id: work, owner_id: owner }]
          : [],
      );
    if (url.pathname === "/rest/v1/cover_assets") {
      let rows = [...assets.values()].filter(
        (a) => a.owner_id === actor && a.state !== "deleted",
      );
      const id = url.searchParams.get("id")?.slice(3);
      if (id) rows = rows.filter((a) => a.id === id);
      return Response.json(rows);
    }
    const body = JSON.parse(init.body || "{}"),
      name = url.pathname.split("/").at(-1);
    if (name === "read_private_work")
      return Response.json(
        actor === owner && body.p_work_id === work
          ? { id: work, owner_id: owner }
          : null,
      );
    if (name === "reserve_cover_upload") {
      const id = `40000000-0000-0000-0000-${String(++sequence).padStart(12, "0")}`;
      const row = {
        id,
        owner_id: actor,
        object_key: `covers/${actor}/${work}/${id}.png`,
        mime: body.p_mime,
        state: "pending",
        created_at: "2026-01-01",
      };
      assets.set(id, row);
      return Response.json(row);
    }
    if (name === "list_unused_cover_assets")
      return Response.json(
        [...assets.values()]
          .filter(
            (a) =>
              a.owner_id === actor &&
              a.state !== "deleted" &&
              !a.pinned &&
              state.reference !== a.id &&
              state.published !== a.id,
          )
          .slice(0, 50)
          .map((a) => ({ id: a.id })),
      );
    const row = assets.get(body.p_asset_id);
    if (!row || row.owner_id !== actor)
      return Response.json({ code: "42501" }, { status: 403 });
    if (name === "finish_cover_upload") {
      row.state = "ready";
      return Response.json(row);
    }
    if (name === "begin_delete_cover") {
      if (
        row.pinned ||
        state.reference === row.id ||
        state.published === row.id
      )
        return Response.json({ code: "23503" }, { status: 400 });
      row.state = "deleting";
      return Response.json(row);
    }
    if (name === "finish_delete_cover") {
      row.state = "deleted";
      return Response.json(null);
    }
    throw Error("Unexpected request " + name);
  };
  const request = (
    path: string,
    method = "GET",
    body?: Uint8Array,
    token: string | null = "owner-token",
    type = "image/png",
    origin = "https://arquivoglobal.vercel.app",
  ) =>
    sandbox.handle(
      new Request("https://worker.example" + path, {
        method,
        headers: {
          ...(token ? { Authorization: "Bearer " + token } : {}),
          "Content-Type": type,
          Origin: origin,
        },
        ...(body ? { body } : {}),
      }),
      env,
      fetcher,
    );
  return {
    state,
    assets,
    objects,
    calls,
    request,
    validate: sandbox.validate,
    env,
  };
}
test("F4.2-A Worker: raw upload, authenticated private read, public snapshot pin and withdrawal", async () => {
  const f = fixture();
  const uploaded = await f.request("/media/cover/works/" + work, "POST", png);
  assert.equal(uploaded.status, 201);
  const { assetId } = await uploaded.json();
  assert.equal(
    (await f.request(`/media/cover/private/${work}/${assetId}`)).status,
    200,
  );
  assert.equal(
    (
      await f.request(
        `/media/cover/public/${pub}/${assetId}`,
        "GET",
        undefined,
        null,
      )
    ).status,
    404,
  );
  f.state.reference = assetId;
  f.state.published = assetId;
  let response = await f.request(
    `/media/cover/public/${pub}/${assetId}`,
    "GET",
    undefined,
    null,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
  const newer = await (
    await f.request("/media/cover/works/" + work, "POST", png)
  ).json();
  f.state.reference = newer.assetId;
  assert.equal(
    (
      await f.request(
        `/media/cover/public/${pub}/${newer.assetId}`,
        "GET",
        undefined,
        null,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        `/media/cover/public/${pub}/${assetId}`,
        "GET",
        undefined,
        null,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/media/cover/assets/" + assetId, "DELETE")).status,
    409,
  );
  f.state.published = null;
  assert.equal(
    (
      await f.request(
        `/media/cover/public/${pub}/${assetId}`,
        "GET",
        undefined,
        null,
      )
    ).status,
    404,
  );
  assert.equal(
    (await f.request("/media/cover/assets/" + assetId, "DELETE")).status,
    200,
  );
  assert.equal(
    (await f.request("/media/cover/assets/" + assetId, "DELETE")).status,
    200,
  );
  assert.ok(!f.objects.has("cover-index/" + assetId + ".json"));
});
test("F4.2-A Worker: owner checks, CORS and private namespaces cannot be bypassed", async () => {
  const f = fixture();
  assert.equal(
    (await f.request("/media/cover/works/" + work, "POST", png, null)).status,
    401,
  );
  assert.equal(
    (await f.request("/media/cover/works/" + work, "POST", png, "other-token"))
      .status,
    404,
  );
  assert.equal(
    (
      await f.request(
        "/media/cover/works/" + work,
        "POST",
        png,
        "owner-token",
        "image/png",
        "https://evil.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.request("/media/cover/works/" + work, "OPTIONS")).status,
    204,
  );
  assert.equal(
    (await f.request("/media/cover/raw/covers/private.png")).status,
    404,
  );
  assert.equal(
    (await f.request(`/media/cover/public/${pub}/${asset}?key=avatars/private`))
      .status,
    404,
  );
  assert.equal(f.objects.size, 0);
});
test("F4.2-A Worker: interrupted uploads remain pending and explicit cleanup never removes pinned files", async () => {
  const f = fixture();
  f.state.failPut = true;
  assert.equal(
    (await f.request("/media/cover/works/" + work, "POST", png)).status,
    503,
  );
  const row = [...f.assets.values()][0];
  assert.equal(row.state, "pending");
  assert.ok(f.objects.has(row.object_key));
  f.state.failPut = false;
  const result = await f.request("/media/cover/cleanup", "POST");
  assert.equal(result.status, 200);
  assert.equal((await result.json()).removed, 1);
  assert.equal(row.state, "deleted");
  const saved = await (
    await f.request("/media/cover/works/" + work, "POST", png)
  ).json();
  f.state.published = saved.assetId;
  const cleanup = await f.request("/media/cover/cleanup", "POST");
  assert.equal((await cleanup.json()).removed, 0);
});
test("F4.2-A validation: MIME/signature, streaming byte limits and unavailable service fail visibly", async () => {
  const f = fixture();
  assert.ok(f.validate(png, "image/png"));
  assert.equal(f.validate(png.slice(0, 30), "image/png"), false);
  assert.equal(f.validate(png, "image/jpeg"), false);
  assert.equal(
    (
      await f.request(
        "/media/cover/works/" + work,
        "POST",
        png,
        "owner-token",
        "image/svg+xml",
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await f.request(
        "/media/cover/works/" + work,
        "POST",
        new Uint8Array(5242881),
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await f.request(
        "/media/cover/works/" + work,
        "POST",
        new Uint8Array([1, 2, 3]),
      )
    ).status,
    415,
  );
  f.state.failed = true;
  const response = await f.request("/media/cover/works/" + work, "POST", png);
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("secret internal"));
});
const metadata = {
  title: "Obra",
  synopsis: "Sinopse",
  format: "Romance" as const,
  language: "pt",
  genre: "Fantasia",
  tags: [],
  ageRating: "Livre" as const,
  contentWarnings: [],
  coverAccentColor: "#14243B",
};
test("F4.2-A contracts: opt-in writes only; crop validation and default legacy schema compatibility", () => {
  const image = { assetId: asset, x: 50, y: 25, zoom: 1.5 };
  assert.deepEqual(readCoverImage(image), image);
  assert.throws(() => readCoverImage({ ...image, assetId: "../other" }));
  assert.throws(() => readCoverImage({ ...image, zoom: 4 }));
  assert.throws(() =>
    metadataPayload({ ...metadata, coverImage: image }, false, false, false),
  );
  assert.equal(
    "cover_image" in metadataPayload(metadata, false, false, false),
    false,
  );
  assert.deepEqual(
    metadataPayload({ ...metadata, coverImage: image }, false, false, true)
      .cover_image,
    image,
  );
  assert.equal(
    metadataPayload({ ...metadata, coverImage: null }, false, false, true)
      .cover_image,
    null,
  );
  assert.ok(!publicCoverUrl(pub, asset).includes(owner));
});
test("F4.2-A UI: inactive service cannot pretend uploads succeed; preview controls are explicit", () => {
  const html = renderToStaticMarkup(
    <CoverPicker value={coverDraft()} onChange={() => {}} enabled={false} />,
  );
  assert.ok(html.includes("disabled"));
  assert.ok(html.includes("aguarda a instalação"));
  assert.ok(!html.includes("guardada com sucesso"));
  const image = coverDraft({ assetId: asset, x: 50, y: 50, zoom: 1 });
  const active = renderToStaticMarkup(
    <CoverPicker value={image} onChange={() => {}} enabled />,
  );
  assert.ok(active.includes("Posição horizontal"));
  assert.ok(active.includes("Zoom"));
  assert.ok(active.includes("até atualizares a publicação"));
});
test("F4.2-A frontend: no session refuses uploads and server confirmation is mandatory", async () => {
  await assert.rejects(
    validateCover(new Blob(["<svg/>"], { type: "image/svg+xml" })),
  );
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as unknown as SupabaseClient;
  const file = new Blob([png], { type: "image/png" }) as File;
  await assert.rejects(
    uploadCover(work, owner, file, client, async () => {
      assert.fail("Unexpected upload");
    }),
  );
  const authed = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: owner }, access_token: "test-token" } },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
  assert.equal(
    await uploadCover(work, owner, file, authed, async (_input, init) => {
      assert.equal(init?.body, file);
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer test-token",
      );
      return Response.json({ assetId: asset });
    }),
    asset,
  );
  await assert.rejects(
    uploadCover(work, owner, file, authed, async () =>
      Response.json({ key: "private-key" }),
    ),
  );
});
test("F4.2-A SQL replacements preserve every previous RPC body except explicit cover transport", () => {
  const previous = readFileSync(
    "supabase/migrations/20261111050000_cover_studio_v2.sql",
    "utf8",
  );
  const next = readFileSync(
    "supabase/migrations/20261114000000_custom_cover_media.sql",
    "utf8",
  );
  for (const name of [
    "mutate_private_work",
    "publish_private_work",
    "read_public_work",
    "search_public_works",
  ]) {
    const body = (sql: string) =>
      sql
        .slice(sql.indexOf("CREATE OR REPLACE FUNCTION public." + name))
        .split("$$;")[0];
    const stripped = body(next)
      .replaceAll(
        "cover_seed=EXCLUDED.cover_seed,cover_image=EXCLUDED.cover_image",
        "cover_seed=EXCLUDED.cover_seed",
      )
      .replaceAll("cover_seed,cover_image", "cover_seed")
      .replaceAll("source.cover_seed,source.cover_image", "source.cover_seed")
      .replaceAll(
        "cover_seed=EXCLUDED.cover_seed,cover_image=EXCLUDED.cover_image",
        "cover_seed=EXCLUDED.cover_seed",
      )
      .replaceAll(
        "'cover_seed',p.cover_seed,'cover_image',p.cover_image",
        "'cover_seed',p.cover_seed",
      )
      .replaceAll("p.cover_seed,p.cover_image", "p.cover_seed");
    assert.equal(stripped, body(previous), name);
  }
});

test("F4.2-A Worker: missing internal proof blocks writes while avatar handlers are untouched", async () => {
  const f = fixture();
  (f.env as any).COVER_MEDIA_TOKEN = undefined;
  assert.equal(
    (await f.request("/media/cover/works/" + work, "POST", png)).status,
    503,
  );
  assert.equal(f.objects.size, 0);
  assert.equal(
    await f.request("/media/avatar/public/" + owner + "/avatar.png"),
    null,
  );
});

test("F4.2-A cleanup: fifty pinned files cannot starve a later orphan", async () => {
  const f = fixture();
  for (let n = 1; n <= 50; n++) {
    const id = `50000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
    f.assets.set(id, { id, owner_id: owner, state: "ready", pinned: true });
  }
  const object_key = `covers/${owner}/${work}/${asset}.png`;
  f.assets.set(asset, {
    id: asset,
    owner_id: owner,
    state: "ready",
    object_key,
  });
  f.objects.set(object_key, { bytes: png, mime: "image/png" });
  const response = await f.request("/media/cover/cleanup", "POST");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).removed, 1);
  assert.equal(f.assets.get(asset).state, "deleted");
  assert.equal(
    [...f.assets.values()].filter((a) => a.pinned && a.state === "ready")
      .length,
    50,
  );
});
