import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type User } from "@supabase/supabase-js";
import {
  avatarApiBase,
  avatarLocation,
  readPrivateAvatar,
  safeAvatarUrl,
  uploadAvatar,
} from "../src/foundation/features/profile/avatar";
import { fetchProfileById } from "../src/foundation/features/profile/service";
const id = "10000000-0000-0000-0000-000000000001",
  other = "10000000-0000-0000-0000-000000000002";
const key = `avatars/${id}/photo-123.png`;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const file = () => new Blob([png], { type: "image/png" }) as File;
const profile = {
  id,
  username: "autora",
  displayName: "Autora Real",
  bio: "Bio",
  avatarUrl: "https://images.example/old.png",
  createdAt: "2026-11-11",
};
function backend() {
  let userId: string | null = id,
    stored = profile.avatarUrl,
    failSave = false;
  const requests: { url: URL; body: any; headers: Headers }[] = [];
  const client = createClient("https://fixture.invalid", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input)),
          headers = new Headers(init?.headers),
          body = init?.body ? JSON.parse(String(init.body)) : null;
        requests.push({ url, body, headers });
        if (body) {
          if (failSave)
            return Response.json(
              { code: "42501", message: "denied" },
              { status: 403 },
            );
          assert.equal(url.searchParams.get("id"), "eq." + id);
          assert.equal(url.searchParams.get("avatar_url"), "eq." + stored);
          assert.equal(headers.get("authorization"), "Bearer active-token");
          stored = body.avatar_url;
        }
        return Response.json({
          id,
          username: "autora",
          display_name: "Autora Real",
          bio: "Bio",
          avatar_url: stored,
          created_at: "2026-11-11",
        });
      },
    },
  });
  client.auth.getSession = async () => ({
    data: {
      session: userId
        ? ({ access_token: "active-token", user: { id: userId } } as any)
        : null,
    },
    error: null,
  });
  client.auth.getUser = async () => ({
    data: { user: (userId ? { id: userId } : null) as User },
    error: null,
  });
  return {
    client,
    requests,
    setUser: (value: string | null) => {
      userId = value;
    },
    failSave: () => {
      failSave = true;
    },
    stored: () => stored,
  };
}
test("avatar API: key and Worker URLs stay private; reject traversal, foreign hosts and token queries", () => {
  assert.equal(avatarLocation(key)?.path, `/media/avatar/${id}/photo-123.png`);
  assert.equal(
    avatarLocation(`${avatarApiBase}/media/avatar/${id}/photo-123.png`)?.owner,
    id,
  );
  assert.equal(
    safeAvatarUrl(`${avatarApiBase}/media/avatar/${id}/photo-123.png`),
    null,
  );
  for (const value of [
    `avatars/${id}/../secret.png`,
    `${avatarApiBase}/media/avatar/${id}/photo.png?token=secret`,
    `${avatarApiBase}.evil.test/media/avatar/${id}/photo.png`,
    `avatars/${id}/%2e%2e.png`,
  ])
    assert.equal(avatarLocation(value), null);
});
test("avatar API: raw upload, authenticated Blob read, metadata confirmation and reload keep the key", async () => {
  const fixture = backend(),
    calls: { url: string; init: RequestInit }[] = [];
  const worker: typeof fetch = async (input, init = {}) => {
    assert.ok(String(input).startsWith(avatarApiBase + "/media/avatar"));
    calls.push({ url: String(input), init });
    const headers = new Headers(init.headers);
    assert.equal(headers.get("authorization"), "Bearer active-token");
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    if (init.method === "POST") {
      assert.equal(headers.get("content-type"), "image/png");
      assert.ok(init.body instanceof Blob);
      assert.ok(!(init.body instanceof FormData));
      assert.equal(fixture.stored(), profile.avatarUrl);
      return Response.json({ key });
    }
    assert.equal(
      String(input),
      `${avatarApiBase}/media/avatar/${id}/photo-123.png`,
    );
    assert.equal(fixture.stored(), profile.avatarUrl);
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  };
  const next = await uploadAvatar(profile, file(), fixture.client, worker);
  assert.equal(next.avatarUrl, key);
  assert.equal(fixture.stored(), key);
  assert.equal(calls.length, 2);
  assert.ok(!calls.some((c) => c.init.method === "DELETE"));
  const reloaded = await fetchProfileById(id, fixture.client);
  assert.equal(reloaded.profile?.avatarUrl, key);
  const blob = await readPrivateAvatar(
    key,
    fixture.client,
    async (input, init) => {
      assert.equal(
        String(input),
        `${avatarApiBase}/media/avatar/${id}/photo-123.png`,
      );
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer active-token",
      );
      return new Response(png, { headers: { "Content-Type": "image/png" } });
    },
  );
  assert.equal(blob.type, "image/png");
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), png);
});
test("avatar API: failed uploads, private reads and metadata saves preserve the previous reference", async () => {
  for (const failure of ["upload", "read", "metadata", "invalid-key"]) {
    const fixture = backend();
    if (failure === "metadata") fixture.failSave();
    const worker: typeof fetch = async (_input, init) => {
      if (init?.method === "POST")
        return failure === "upload"
          ? Response.json({ error: "Permission denied" }, { status: 403 })
          : Response.json({
              key:
                failure === "invalid-key" ? `avatars/${other}/file.png` : key,
            });
      return failure === "read"
        ? Response.json({ error: "Not found" }, { status: 404 })
        : new Response(png, { headers: { "content-type": "image/png" } });
    };
    await assert.rejects(uploadAvatar(profile, file(), fixture.client, worker));
    assert.equal(fixture.stored(), profile.avatarUrl);
  }
});
test("avatar API: no session, other owners and account changes never write profile metadata", async () => {
  for (const user of [null, other]) {
    const fixture = backend();
    fixture.setUser(user);
    let calls = 0;
    await assert.rejects(
      uploadAvatar(profile, file(), fixture.client, async () => {
        calls++;
        return Response.json({ key });
      }),
    );
    await assert.rejects(
      readPrivateAvatar(key, fixture.client, async () => {
        calls++;
        return new Response(png);
      }),
    );
    assert.equal(calls, 0);
    assert.equal(fixture.requests.length, 0);
  }
  const fixture = backend();
  await assert.rejects(
    uploadAvatar(profile, file(), fixture.client, async (_input, init) => {
      if (init?.method === "POST") return Response.json({ key });
      fixture.setUser(other);
      return new Response(png, { headers: { "content-type": "image/png" } });
    }),
  );
  assert.equal(fixture.requests.length, 0);
});
test("avatar API: Worker errors are visible, tokens redacted and invalid image responses rejected", async () => {
  const fixture = backend();
  await assert.rejects(
    uploadAvatar(profile, file(), fixture.client, async () =>
      Response.json(
        { error: "Forbidden Bearer private-token" },
        { status: 403 },
      ),
    ),
    (error) =>
      error instanceof Error &&
      error.message.includes("403") &&
      !error.message.includes("private-token"),
  );
  await assert.rejects(
    readPrivateAvatar(
      key,
      fixture.client,
      async () =>
        new Response("<script>bad</script>", {
          headers: { "content-type": "text/html" },
        }),
    ),
  );
  await assert.rejects(
    uploadAvatar(profile, file(), fixture.client, async () => {
      throw TypeError("Failed to fetch");
    }),
    /rede ou CORS/,
  );
});
