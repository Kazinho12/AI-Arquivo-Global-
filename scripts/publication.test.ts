import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";
import {
  createPublicWorksRepository,
  mapPublishedWork,
  publicColumns,
} from "../src/foundation/features/catalog/repository";
import { createWorksRepository } from "../src/foundation/features/studio/worksRepository";
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});
const id = "10000000-0000-0000-0000-000000000001",
  publicId = "20000000-0000-0000-0000-000000000001";
const publicRow = {
  id: publicId,
  slug: "obra",
  title: "Obra publicada",
  subtitle: "",
  description: "Sinopse",
  type: "Poesia",
  genre: "Lírico",
  language: "pt",
  age_rating: "Livre",
  tags: ["versos"],
  content_warnings: [],
  cover_accent_color: "#14243B",
  author_name: null,
  author_username: null,
  first_published_at: "2026-11-11T10:00:00Z",
  last_published_at: "2026-11-11T11:00:00Z",
  entries: [
    {
      id: publicId,
      position: 1,
      title: "Poema",
      content: "Um verso\n\nOutro",
      entry_type: "poem",
      alignment: "center",
    },
  ],
};
test("F3.1 public repository uses explicit projections and public IDs, handles withdrawal and network errors", async () => {
  let withdrawn = false,
    fail = false;
  const requests: string[] = [];
  const client = createClient("https://fixture.invalid", "public-test-key", {
    accessToken: async () => null,
    global: {
      fetch: async (input, init) => {
        if (fail) throw Error("offline");
        const url = new URL(String(input));
        requests.push(url.pathname);
        assert.equal(
          new Headers(init?.headers).get("Authorization"),
          "Bearer public-test-key",
        );
        if (url.pathname.endsWith("/rpc/read_public_work")) {
          assert.deepEqual(JSON.parse(String(init?.body)), {
            p_public_id: publicId,
          });
          return Response.json(withdrawn ? null : publicRow);
        }
        if (url.searchParams.get("select") === "id,last_published_at")
          return Response.json(
            withdrawn
              ? []
              : [
                  {
                    id: publicId,
                    last_published_at: publicRow.last_published_at,
                  },
                ],
          );
        assert.equal(url.searchParams.get("select"), publicColumns);
        assert.ok(!publicColumns.includes("owner_id"));
        assert.ok(!publicColumns.split(",").includes("work_id"));
        return Response.json(
          withdrawn || Number(url.searchParams.get("offset")) > 0
            ? []
            : [publicRow],
        );
      },
    },
  });
  const repo = createPublicWorksRepository(client);
  assert.equal((await repo.list()).length, 1);
  let work = await repo.find(publicId);
  assert.equal(work?.origin, "user-publication");
  assert.equal(work?.author, "Autor não identificado");
  assert.equal(work?.authorId, "");
  assert.deepEqual(work?.chapters[0].stanzas, [["Um verso"], ["Outro"]]);
  assert.equal(await repo.find("private-local-id"), null);
  assert.deepEqual(await repo.check!(publicId), {
    lastPublishedAt: publicRow.last_published_at,
  });
  withdrawn = true;
  assert.equal(await repo.check!(publicId), null);
  assert.deepEqual(await repo.list(), []);
  assert.equal(await repo.find(publicId), null);
  fail = true;
  await assert.rejects(repo.list(), /Não foi possível/);
  await assert.rejects(repo.find(publicId), /Não foi possível/);
  assert.ok(
    requests.every(
      (path) => !path.includes("read_private") && !path.endsWith("/works"),
    ),
  );
});
test("F3.1 mapping rejects malformed responses and preserves public profile attribution", () => {
  assert.throws(() => mapPublishedWork({}), /inválida/);
  assert.equal(
    mapPublishedWork({
      ...publicRow,
      author_name: "Nome público",
      author_username: "autora",
    }).authorUsername,
    "autora",
  );
});
test("F3.1 Studio publication uses protected RPC, current revision, validated session token and stable retry key", async () => {
  let fail = true;
  const calls: Record<string, any>[] = [];
  const row = {
    id,
    owner_id: id,
    public_id: publicId,
    title: "Obra",
    slug: "obra",
    description: "Sinopse",
    type: "Romance",
    status: "published",
    visibility: "public",
    language: "pt",
    subtitle: "",
    genre: "Ficção",
    tags: [],
    age_rating: "Livre",
    content_warnings: [],
    cover_accent_color: "#14243B",
    revision: 8,
    created_at: "2026-11-11",
    updated_at: "2026-11-11",
    archived_at: null,
    first_published_at: "2026-11-11",
    last_published_at: "2026-11-11",
    published_revision: 8,
    entries: [],
  };
  const client = createClient("https://fixture.invalid", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        assert.ok(String(input).endsWith("/rpc/publish_private_work"));
        assert.equal(
          new Headers(init?.headers).get("Authorization"),
          "Bearer validated-token",
        );
        const body = JSON.parse(String(init?.body));
        calls.push(body);
        if (fail) throw Error("response lost");
        return Response.json({
          work:
            body.p_action === "withdraw"
              ? {
                  ...row,
                  status: "draft",
                  visibility: "private",
                  withdrawn_at: "2026-11-11",
                }
              : row,
        });
      },
    },
  });
  client.auth.getSession = async () => ({
    data: { session: { access_token: "validated-token" } as any },
    error: null,
  });
  client.auth.getUser = async () => ({
    data: { user: { id } as User },
    error: null,
  });
  const repo = createWorksRepository(client, id);
  const work = {
    id,
    ownerId: id,
    persistence: "supabase" as const,
    publicId,
    revision: 7,
    title: "Obra",
    slug: "obra",
    synopsis: "Sinopse",
    format: "Romance" as const,
    mode: "prose" as const,
    status: "draft" as const,
    language: "pt",
    genre: "Ficção",
    tags: [],
    ageRating: "Livre" as const,
    contentWarnings: [],
    coverAccentColor: "#14243B",
    chapters: [],
    createdAt: "2026-11-11",
    updatedAt: "2026-11-11",
  };
  await assert.rejects(repo.editorial!(work, "publish"));
  fail = false;
  const result = await repo.editorial!(work, "publish");
  assert.equal(result.work?.status, "published");
  assert.equal(result.work?.publicId, publicId);
  assert.equal(calls[0].p_operation_id, calls[1].p_operation_id);
  assert.equal(calls[1].p_revision, 7);
  assert.equal(calls[1].p_work_id, id);
  assert.equal("p_payload" in calls[1], false);
  const withdrawn = await repo.editorial!(result.work!, "withdraw");
  assert.equal(withdrawn.work?.status, "draft");
  assert.equal(calls[2].p_revision, 8);
  assert.notEqual(calls[2].p_operation_id, calls[1].p_operation_id);
  await assert.rejects(
    repo.editorial!({ ...work, ownerId: publicId }, "publish"),
    /teus/,
  );
});
