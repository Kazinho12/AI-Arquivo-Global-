import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";
import {
  createWorksRepository,
  metadataPayload,
  type DraftMetadata,
  type WorksRepository,
} from "../src/foundation/features/studio/worksRepository";
import { WorksController } from "../src/foundation/features/studio/worksController";
import {
  studioStore,
  getStoredWorks,
} from "../src/foundation/features/studio/store";
import { selectScope } from "../src/foundation/features/local/persistence";
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});
const a = "10000000-0000-0000-0000-000000000001";
const b = "10000000-0000-0000-0000-000000000002";
const metadata: DraftMetadata = {
  title: "Uma obra",
  synopsis: "Sinopse",
  format: "Romance",
  language: "Português",
  genre: "Ficção",
  tags: ["teste"],
  ageRating: "Livre",
  contentWarnings: [],
  coverAccentColor: "#14243B",
};
// HTTP fixture exercises the real Supabase/PostgREST client, not a production server.
function backend() {
  const rows = new Map<string, Record<string, any>>();
  const requests: { method: string; body: Record<string, unknown> | null }[] =
    [];
  let fail = false;
  let loseResponse = false;
  const receipts = new Map<
    string,
    { fingerprint: string; result: Record<string, any> }
  >();
  function session(owner: string | null) {
    let user = owner;
    const client = createClient("https://fixture.invalid", "public-test-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: async (input, init) => {
          if (fail) throw new Error("network unavailable");
          const url = new URL(String(input));
          const method = init?.method ?? "GET";
          const body = init?.body ? JSON.parse(String(init.body)) : null;
          requests.push({ method, body });
          const requestOwner =
            new Headers(init?.headers)
              .get("Authorization")
              ?.replace("Bearer test-token-", "") ?? null;
          const respond = (data: unknown, status = 200) =>
            new Response(JSON.stringify(data), {
              status,
              headers: { "content-type": "application/json" },
            });
          if (url.pathname.endsWith("/rpc/read_private_work")) {
            const work = rows.get(body.p_work_id);
            return respond(work?.owner_id === requestOwner ? work : null);
          }
          if (url.pathname.endsWith("/rpc/mutate_private_work")) {
            const receiptKey = requestOwner + ":" + body.p_operation_id;
            const fingerprint = JSON.stringify([
              body.p_work_id,
              body.p_revision,
              body.p_action,
              body.p_payload,
            ]);
            const previous = receipts.get(receiptKey);
            if (previous)
              return respond(
                previous.fingerprint === fingerprint
                  ? previous.result
                  : { code: "22023" },
                previous.fingerprint === fingerprint ? 200 : 400,
              );
            const original = rows.get(body.p_work_id);
            if (!original || original.owner_id !== requestOwner)
              return respond({ code: "42501" }, 403);
            if (original.revision !== body.p_revision)
              return respond({ code: "40001" }, 409);
            const work = structuredClone(original);
            const payload = body.p_payload;
            const action = body.p_action;
            let result: Record<string, any>;
            if (action === "delete_work") {
              rows.delete(work.id);
              result = { deleted_id: work.id };
            } else {
              if (action === "duplicate_work") {
                work.id = webcrypto.randomUUID();
                work.slug = "copia-" + webcrypto.randomUUID();
                work.title += " (Cópia)";
                work.archived_at = null;
                work.revision = 1;
                work.entries = work.entries.map(
                  (entry: Record<string, any>) => ({
                    ...entry,
                    id: webcrypto.randomUUID(),
                    work_id: work.id,
                    revision: 1,
                  }),
                );
              } else {
                if (action === "archive")
                  work.archived_at = new Date().toISOString();
                if (action === "restore") work.archived_at = null;
                if (action === "add_entry")
                  work.entries.push({
                    id: webcrypto.randomUUID(),
                    work_id: work.id,
                    title:
                      payload.title ?? "Capítulo " + (work.entries.length + 1),
                    content: "",
                    entry_type:
                      work.type === "Poesia"
                        ? "poem"
                        : ["HQ / Comic", "Mangá"].includes(work.type)
                          ? "visual"
                          : "chapter",
                    position: work.entries.length + 1,
                    revision: 1,
                    alignment: "left",
                  });
                if (
                  ["save_entry", "delete_entry", "duplicate_entry"].includes(
                    action,
                  )
                ) {
                  const entry = work.entries.find(
                    (item: Record<string, any>) => item.id === payload.entry_id,
                  );
                  if (!entry) return respond({ code: "42501" }, 403);
                  if (entry.revision !== payload.entry_revision)
                    return respond({ code: "40001" }, 409);
                  if (action === "save_entry")
                    Object.assign(entry, {
                      title: payload.title,
                      content: payload.content,
                      alignment: payload.alignment ?? "left",
                      revision: entry.revision + 1,
                    });
                  if (action === "duplicate_entry")
                    work.entries.push({
                      ...entry,
                      id: webcrypto.randomUUID(),
                      title: entry.title + " (Cópia)",
                      position: work.entries.length + 1,
                      revision: 1,
                    });
                  if (action === "delete_entry")
                    work.entries = work.entries
                      .filter(
                        (item: Record<string, any>) => item.id !== entry.id,
                      )
                      .map((item: Record<string, any>, index: number) => ({
                        ...item,
                        position: index + 1,
                      }));
                }
                if (action === "reorder_entries")
                  work.entries = payload.ids.map(
                    (id: string, index: number) => ({
                      ...work.entries.find(
                        (entry: Record<string, any>) => entry.id === id,
                      ),
                      position: index + 1,
                      revision:
                        work.entries.find(
                          (entry: Record<string, any>) => entry.id === id,
                        ).revision + 1,
                    }),
                  );
                work.revision++;
              }
              rows.set(work.id, work);
              result = { work };
            }
            receipts.set(receiptKey, { fingerprint, result });
            if (loseResponse) {
              loseResponse = false;
              throw new Error("Response lost after commit");
            }
            return respond(result);
          }
          let visible = [...rows.values()].filter(
            (row) => row.owner_id === requestOwner,
          );
          for (const column of ["id", "owner_id", "revision"]) {
            const value = url.searchParams.get(column);
            if (value?.startsWith("eq."))
              visible = visible.filter(
                (row) => String(row[column]) === value.slice(3),
              );
          }
          let result: Record<string, any>[];
          if (method === "POST") {
            const now = new Date().toISOString();
            const row = {
              ...body,
              id: webcrypto.randomUUID(),
              owner_id: requestOwner,
              status: "draft",
              visibility: "private",
              revision: 1,
              entries: [],
              archived_at: null,
              created_at: now,
              updated_at: now,
            };
            rows.set(row.id, row);
            result = [row];
          } else if (method === "PATCH") {
            result = visible.map((row) => ({
              ...row,
              ...body,
              revision: row.revision + 1,
              updated_at: new Date().toISOString(),
            }));
            result.forEach((row) => rows.set(row.id, row));
          } else if (method === "DELETE") {
            result = visible;
            visible.forEach((row) => rows.delete(row.id));
          } else {
            const offset = Number(url.searchParams.get("offset") ?? 0);
            const limit = Number(url.searchParams.get("limit") ?? 100);
            result = visible.slice(offset, offset + limit);
          }
          const accept = new Headers(init?.headers).get("accept") ?? "";
          return new Response(
            JSON.stringify(
              accept.includes("vnd.pgrst.object")
                ? (result[0] ?? null)
                : result,
            ),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        },
      },
    });
    client.auth.getSession = async () =>
      ({
        data: { session: user ? { access_token: `test-token-${user}` } : null },
        error: null,
      }) as Awaited<ReturnType<typeof client.auth.getSession>>;
    client.auth.getUser = async (token?: string) =>
      ({
        data: {
          user: (token
            ? { id: token.replace("test-token-", "") }
            : user
              ? { id: user }
              : null) as User | null,
        },
        error: null,
      }) as Awaited<ReturnType<typeof client.auth.getUser>>;
    return {
      client,
      repository: createWorksRepository(client, owner ?? a),
      setUser: (value: string | null) => {
        user = value;
      },
    };
  }
  return {
    rows,
    requests,
    session,
    loseNextResponse: () => {
      loseResponse = true;
    },
    setFail: (value: boolean) => {
      fail = value;
    },
  };
}
test("F2.1: authenticated private creation and retrieval in a fresh session", async () => {
  const db = backend();
  const first = db.session(a);
  const created = await first.repository.create(metadata);
  assert.equal(created.ownerId, a);
  assert.equal(created.persistence, "supabase");
  assert.equal(created.status, "draft");
  assert.deepEqual(created.chapters, []);
  assert.match(created.slug!, /^uma-obra-[a-f0-9-]+$/);
  const second = db.session(a);
  const loaded = await second.repository.list();
  assert.equal(loaded[0].id, created.id);
  assert.equal((await second.repository.find(created.id))?.title, "Uma obra");
  assert.ok(db.requests.some((request) => request.method === "POST"));
});
test("F2.1: other owner cannot retrieve, update or delete a draft", async () => {
  const db = backend();
  const author = db.session(a).repository;
  const work = await author.create(metadata);
  const stranger = db.session(b).repository;
  assert.deepEqual(await stranger.list(), []);
  assert.equal(await stranger.find(work.id), null);
  await assert.rejects(stranger.update(work, metadata), /teus rascunhos/);
  await assert.rejects(stranger.remove(work), /teus rascunhos/);
  // Even a fabricated client object cannot make a zero-row operation report success.
  await assert.rejects(
    stranger.update({ ...work, ownerId: b }, metadata),
    /alterada/,
  );
  await assert.rejects(
    stranger.remove({ ...work, ownerId: b }),
    /permissão|mudou/,
  );
  assert.equal(db.rows.size, 1);
});
test("F2.1: metadata updates, stable slug, revision conflicts and authorized deletion", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  const work = await repo.create(metadata);
  const updated = await repo.update(work, {
    ...metadata,
    title: "Título revisto",
    synopsis: "Nova sinopse",
    tags: ["nova"],
    format: "Poesia",
  });
  assert.equal(updated.title, "Título revisto");
  assert.equal(updated.mode, "poetry");
  assert.equal(updated.revision, 2);
  assert.equal(updated.slug, work.slug);
  await assert.rejects(repo.update(work, metadata), /alterada/);
  await assert.rejects(repo.remove(work), /mudou|mudou noutro|última versão/);
  await repo.remove(updated);
  assert.deepEqual(await repo.list(), []);
});
test("F2.1: no session/configuration or switched identity blocks access", async () => {
  const db = backend();
  const session = db.session(null);
  await assert.rejects(session.repository.create(metadata), /sessão/);
  assert.equal(db.requests.length, 0);
  const author = db.session(a);
  author.setUser(b);
  await assert.rejects(author.repository.list(), /sessão/);
  await assert.rejects(createWorksRepository(null, a).list(), /configurado/);
});
test("F2.1: network failures do not become local fallback or false save success", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  db.setFail(true);
  await assert.rejects(repo.create(metadata), /ligação/);
  const controller = new WorksController(repo);
  await controller.load();
  assert.equal(controller.getSnapshot().loaded, false);
  assert.match(controller.getSnapshot().error, /ligação/);
  assert.equal(await controller.create(metadata), null);
  assert.equal(controller.getSnapshot().saving, false);
  db.setFail(false);
  await controller.load();
  assert.equal(controller.getSnapshot().loaded, true);
  assert.ok(await controller.create(metadata));
});
test("F2.1: payload allowlist excludes publication, ownership, chapters and attribution", async () => {
  const db = backend();
  const input = {
    ...metadata,
    owner_id: b,
    status: "published",
    visibility: "public",
    chapters: [{ content: "private local text" }],
    authorId: "ag-editorial-team",
  };
  await db.session(a).repository.create(input);
  const payload = db.requests.find(
    (request) => request.method === "POST",
  )!.body!;
  for (const key of [
    "owner_id",
    "status",
    "visibility",
    "chapters",
    "authorId",
  ])
    assert.equal(key in payload, false);
  assert.throws(
    () => metadataPayload({ ...metadata, title: " " }),
    /metadados/,
  );
  assert.throws(
    () => metadataPayload({ ...metadata, tags: Array(21).fill("tag") }),
    /metadados/,
  );
});
test("F2.1: late list cannot overwrite a mutation or cross controller/session boundary", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  let resolve!: (value: Awaited<ReturnType<WorksRepository["list"]>>) => void;
  const controller = new WorksController({
    ...repo,
    list: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const pending = controller.load();
  const created = await controller.create(metadata);
  assert.ok(created);
  resolve([]);
  await pending;
  assert.equal(controller.getSnapshot().works.length, 1);
  const again = controller.load();
  controller.stop();
  resolve([created]);
  await again;
  assert.deepEqual(controller.getSnapshot().works, []);
});
test("F2.1: remote CRUD never overwrites previous local drafts or another local account", async () => {
  selectScope("user:" + a);
  studioStore.createWork({
    ...metadata,
    mode: "prose",
    status: "draft",
    chapters: [],
  });
  const before = structuredClone(getStoredWorks());
  const db = backend();
  const repo = db.session(a).repository;
  const work = await repo.create(metadata);
  await repo.update(work, { ...metadata, title: "Remota" });
  await repo.list();
  await repo.remove({ ...work, revision: 2 });
  assert.deepEqual(getStoredWorks(), before);
  selectScope("user:" + b);
  assert.deepEqual(getStoredWorks(), []);
  selectScope("user:" + a);
  assert.deepEqual(getStoredWorks(), before);
});

test("F2.1: a token change between validation and fetch cannot create under another owner", async () => {
  const db = backend();
  const session = db.session(a);
  const original = session.client.auth.getUser.bind(session.client.auth);
  session.client.auth.getUser = async (token) => {
    const validated = await original(token);
    session.setUser(b);
    return validated;
  };
  const work = await session.repository.create(metadata);
  assert.equal(work.ownerId, a);
  assert.equal([...db.rows.values()][0].owner_id, a);
});

test("F2.2: persistent entry CRUD, reorder and work duplicate preserve metadata/content", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  let work = await repo.create(metadata);
  work = (await repo.editorial!(work, "add_entry")).work!;
  const entry = work.chapters[0];
  work = (
    await repo.editorial!(work, "save_entry", {
      entry_id: entry.id,
      entry_revision: entry.revision,
      title: "Capítulo",
      content: "Uma história real.",
      alignment: "left",
    })
  ).work!;
  work = (
    await repo.editorial!(work, "duplicate_entry", {
      entry_id: entry.id,
      entry_revision: work.chapters[0].revision,
    })
  ).work!;
  const ids = work.chapters.map((item) => item.id).reverse();
  work = (await repo.editorial!(work, "reorder_entries", { ids })).work!;
  assert.deepEqual(
    work.chapters.map((item) => item.id),
    ids,
  );
  const copy = (await repo.editorial!(work, "duplicate_work")).work!;
  assert.notEqual(copy.id, work.id);
  assert.equal(copy.title, work.title + " (Cópia)");
  assert.deepEqual(
    copy.chapters.map((item) => item.content),
    work.chapters.map((item) => item.content),
  );
  assert.ok(
    copy.chapters.every(
      (item) => !work.chapters.some((old) => old.id === item.id),
    ),
  );
  const restored = await db.session(a).repository.find(work.id);
  assert.deepEqual(restored?.chapters, work.chapters);
  const item = work.chapters[0];
  work = (
    await repo.editorial!(work, "delete_entry", {
      entry_id: item.id,
      entry_revision: item.revision,
    })
  ).work!;
  assert.equal(work.chapters.length, 1);
  await repo.remove(work);
  assert.equal(await repo.find(work.id), null);
  assert.ok(await repo.find(copy.id));
});
test("F2.2: archive uses archived_at, preserves draft status, restores across sessions", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  let work = await repo.create(metadata);
  work = (await repo.editorial!(work, "archive")).work!;
  assert.ok(work.archivedAt);
  assert.equal(work.status, "draft");
  assert.ok((await db.session(a).repository.find(work.id))?.archivedAt);
  work = (await repo.editorial!(work, "restore")).work!;
  assert.equal(work.archivedAt, null);
});
test("F2.2: a lost response retries the same operation instead of duplicating contents", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  const work = await repo.create(metadata);
  db.loseNextResponse();
  await assert.rejects(repo.editorial!(work, "add_entry"), /ligação/);
  const result = await repo.editorial!(work, "add_entry");
  assert.equal(result.work?.chapters.length, 1);
  const operations = db.requests.filter(
    (item) => item.body?.p_action === "add_entry",
  );
  assert.equal(
    operations[0].body?.p_operation_id,
    operations[1].body?.p_operation_id,
  );
});
test("F2.2: concurrent editorial/metadata changes fail without replacing newer content", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  const work = await repo.create(metadata);
  const updated = (await repo.editorial!(work, "add_entry")).work!;
  await assert.rejects(repo.editorial!(work, "archive"), /noutro dispositivo/);
  await assert.rejects(
    repo.update(work, { ...metadata, title: "Stale" }),
    /alterada/,
  );
  const controller = new WorksController(repo);
  await controller.load();
  assert.equal(
    (await controller.editorial(updated, "archive"))?.work?.archivedAt !== null,
    true,
  );
  await controller.recover(updated.id);
  assert.equal(controller.getSnapshot().works.length, 1);
});

test("Delete work: exact UUID/revision, valid operation ID and safe retry after a lost response", async () => {
  const db = backend();
  const repo = db.session(a).repository;
  const work = await repo.create(metadata);
  db.loseNextResponse();
  await assert.rejects(repo.remove(work), /ligação/);
  const first = db.requests.find(
    (request) => request.body?.p_action === "delete_work",
  )!.body!;
  assert.equal(first.p_work_id, work.id);
  assert.equal(first.p_revision, work.revision);
  assert.match(
    String(first.p_operation_id),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  await repo.remove(work);
  const retries = db.requests.filter(
    (request) => request.body?.p_action === "delete_work",
  );
  assert.equal(
    retries[0].body?.p_operation_id,
    retries[1].body?.p_operation_id,
  );
  assert.equal(await repo.find(work.id), null);
});
