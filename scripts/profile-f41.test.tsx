import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type User } from "@supabase/supabase-js";
import { renderToStaticMarkup } from "react-dom/server";
import {
  fetchProfileWorks,
  fetchFollowerCount,
} from "../src/foundation/features/profile/publicData";
import {
  validateAvatar,
  avatarMaxBytes,
  removeAvatar,
  avatarInitials,
  safeAvatarUrl,
} from "../src/foundation/features/profile/avatar";
import {
  AvatarEditor,
  ProfileAvatar,
} from "../src/foundation/features/profile/AvatarEditor";
const id = "10000000-0000-0000-0000-000000000001";
const profile = {
  id,
  username: "autora",
  displayName: "Autora Real",
  bio: "Bio",
  avatarUrl: "https://images.example/avatar.png",
  createdAt: "2026-11-11",
};
const fixture = (fetcher: typeof fetch) =>
  createClient("https://fixture.invalid", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetcher },
  });
test("F4.1: image MIME, size and magic validation rejects unsafe files; initials and HTTPS fallback", async () => {
  const file = (type: string, bytes: number[], size = bytes.length) => ({
    type,
    size,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  });
  await validateAvatar(file("image/png", [137, 80, 78, 71, 13, 10, 26, 10]));
  await validateAvatar(file("image/jpeg", [255, 216, 255]));
  await assert.rejects(validateAvatar(file("image/svg+xml", [1, 2, 3])));
  await assert.rejects(validateAvatar(file("image/png", [1, 2, 3])));
  await assert.rejects(
    validateAvatar(file("image/jpeg", [255, 216, 255], avatarMaxBytes + 1)),
  );
  assert.equal(avatarInitials("Autora Real"), "AR");
  assert.equal(avatarInitials(""), "AG");
  assert.equal(safeAvatarUrl("javascript:alert(1)"), null);
  assert.equal(safeAvatarUrl("http://example.com/a"), null);
  assert.ok(
    renderToStaticMarkup(
      <ProfileAvatar name="Autora Real" url={null} />,
    ).includes("AR"),
  );
});
test("F4.1: avatar UI waits for image selection and server confirmation", () => {
  const html = renderToStaticMarkup(
    <AvatarEditor profile={profile} onChange={() => {}} />,
  );
  assert.ok(html.includes("não a guarda automaticamente"));
  assert.ok(html.includes("Guardar fotografia"));
  assert.ok(html.includes('type="file"'));
  assert.ok(html.includes("disabled"));
  assert.ok(html.includes("Remover fotografia"));
});
test("F4.1: avatar removal checks identity and persists only avatar metadata", async () => {
  let patches = 0;
  const client = fixture(async (input, init) => {
    patches++;
    assert.equal(init?.method, "PATCH");
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("id"), "eq." + id);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.avatar_url, null);
    assert.equal(body.username, undefined);
    return Response.json({
      id,
      username: profile.username,
      display_name: profile.displayName,
      bio: "Bio",
      avatar_url: null,
      created_at: profile.createdAt,
    });
  });
  client.auth.getUser = async () => ({
    data: { user: { id: "other" } as User },
    error: null,
  });
  await assert.rejects(removeAvatar(profile, client));
  assert.equal(patches, 0);
  client.auth.getUser = async () => ({
    data: { user: { id } as User },
    error: null,
  });
  assert.equal((await removeAvatar(profile, client)).avatarUrl, null);
  assert.equal(patches, 1);
  await assert.rejects(removeAvatar(profile, null));
  const denied = fixture(async () =>
    Response.json({ message: "denied", code: "42501" }, { status: 403 }),
  );
  denied.auth.getUser = client.auth.getUser;
  await assert.rejects(removeAvatar(profile, denied));
});
test("F4.1: author catalogue uses stable profile UUID and retains adult/warned publications", async () => {
  const client = fixture(async (input, init) => {
    assert.ok(String(input).endsWith("/rpc/profile_published_works"));
    assert.deepEqual(JSON.parse(String(init?.body)), {
      p_author_id: id,
      p_offset: 24,
      p_limit: 24,
    });
    return Response.json({
      total: 25,
      items: [
        {
          id: "public-id",
          title: "Obra publicada",
          type: "Romance",
          description: "Sinopse",
          tags: [],
          content_warnings: ["Violência"],
          age_rating: "+18",
          first_published_at: "2026-11-11",
          last_published_at: "2026-11-11",
          author_username: "username-antigo",
        },
      ],
    });
  });
  const result = await fetchProfileWorks(id, 24, client);
  assert.equal(result.total, 25);
  assert.equal(result.works.length, 1);
  assert.equal(result.works[0].ageRating, "+18");
  await assert.rejects(fetchProfileWorks(id, 0, null));
  await assert.rejects(
    fetchProfileWorks(
      id,
      0,
      fixture(async () => Response.json({ code: "PGRST202" }, { status: 404 })),
    ),
  );
});
test("F4.1: followers count is exact, zero is real and missing backend never invents zero", async () => {
  const client = fixture(async (input, init) => {
    assert.equal(init?.method, "HEAD");
    assert.ok(
      new URL(String(input)).searchParams.get("followed_id") === "eq." + id,
    );
    return new Response(null, { headers: { "content-range": "*/0" } });
  });
  assert.equal(await fetchFollowerCount(id, client), 0);
  assert.equal(
    await fetchFollowerCount(
      id,
      fixture(
        async () => new Response(null, { headers: { "content-range": "*/7" } }),
      ),
    ),
    7,
  );
  await assert.rejects(
    fetchFollowerCount(
      id,
      fixture(async () => Response.json({ code: "42P01" }, { status: 404 })),
    ),
  );
});
