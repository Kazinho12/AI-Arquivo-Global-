import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileAvatar } from "../src/foundation/features/profile/AvatarEditor";
import {
  avatarApiBase,
  publicAvatarUrl,
} from "../src/foundation/features/profile/avatar";
// Execute the exact pasteable Worker snippet with a disposable R2/REST fixture.
const handler = new Function(
  readFileSync("docs/cloudflare-public-avatar.js", "utf8") +
    ";return handleAgPublicAvatar;",
)() as (
  request: Request,
  env: any,
  fetcher?: typeof fetch,
) => Promise<Response | null>;
const owner = "10000000-0000-0000-0000-000000000001",
  other = "10000000-0000-0000-0000-000000000002";
const oldKey = `avatars/${owner}/old.png`,
  newKey = `avatars/${owner}/new.webp`;
const route = (file = "old.png") =>
  `${avatarApiBase}/media/avatar/public/${owner}/${file}`;
function fixture() {
  let reference: string | null = oldKey,
    visible = true,
    fail = false;
  const gets: string[] = [],
    requests: RequestInit[] = [];
  const env = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture",
    AG_MEDIA: {
      get: async (key: string) => {
        gets.push(key);
        return {
          body: new Uint8Array([137, 80, 78, 71]),
          size: 4,
          httpMetadata: {
            contentType: key.endsWith("webp") ? "image/webp" : "image/png",
          },
        };
      },
    },
  };
  const rest: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    requests.push(init);
    assert.equal(url.origin, "https://project.supabase.co");
    assert.equal(url.pathname, "/rest/v1/profiles");
    assert.equal(url.searchParams.get("select"), "id,avatar_url");
    assert.equal(url.searchParams.get("id"), "eq." + owner);
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    assert.equal(
      new Headers(init.headers).get("apikey"),
      env.SUPABASE_PUBLISHABLE_KEY,
    );
    assert.equal(new Headers(init.headers).has("authorization"), false);
    return fail
      ? new Response(null, { status: 500 })
      : Response.json(visible ? [{ id: owner, avatar_url: reference }] : []);
  };
  return {
    env,
    rest,
    gets,
    requests,
    reference: (value: string | null) => {
      reference = value;
    },
    hide: () => {
      visible = false;
    },
    fail: () => {
      fail = true;
    },
  };
}
test("public avatar: anonymous route serves only the current profile reference without forwarding user credentials", async () => {
  const f = fixture();
  const response = await handler(
    new Request(route(), {
      headers: { Authorization: "Bearer must-not-forward" },
    }),
    f.env,
    f.rest,
  );
  assert.equal(response?.status, 200);
  assert.deepEqual(f.gets, [oldKey]);
  assert.equal(response?.headers.get("Content-Type"), "image/png");
  assert.equal(response?.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(response?.headers.get("X-Content-Type-Options"), "nosniff");
});
test("public avatar: removal/replacement rechecks Supabase even with validators and no stale positive/negative cache", async () => {
  const f = fixture();
  assert.equal(
    (await handler(new Request(route()), f.env, f.rest))?.status,
    200,
  );
  f.reference(newKey);
  const removed = await handler(
    new Request(route(), { headers: { "If-None-Match": "old-etag" } }),
    f.env,
    f.rest,
  );
  assert.equal(removed?.status, 404);
  assert.ok(removed?.headers.get("Cache-Control")?.includes("no-store"));
  assert.equal(f.gets.length, 1);
  const current = await handler(new Request(route("new.webp")), f.env, f.rest);
  assert.equal(current?.status, 200);
  assert.equal(current?.headers.get("CDN-Cache-Control"), "no-store");
  assert.equal(
    current?.headers.get("Cloudflare-CDN-Cache-Control"),
    "no-store",
  );
  assert.equal(current?.headers.get("etag"), null);
  f.reference(null);
  assert.equal(
    (await handler(new Request(route("new.webp")), f.env, f.rest))?.status,
    404,
  );
  assert.equal(f.gets.length, 2);
  assert.equal(f.requests.length, 4);
});
test("public avatar: invisible profiles and other namespaces/owners never reach R2", async () => {
  for (const reference of [
    `covers/${owner}/old.png`,
    `pages/${owner}/old.png`,
    `illustrations/${owner}/old.png`,
    `avatars/${other}/old.png`,
    `https://other.example/old.png`,
    `avatars/${owner}/../secret.png`,
  ]) {
    const f = fixture();
    f.reference(reference);
    assert.equal(
      (await handler(new Request(route()), f.env, f.rest))?.status,
      404,
    );
    assert.equal(f.gets.length, 0);
  }
  const f = fixture();
  f.hide();
  assert.equal(
    (await handler(new Request(route()), f.env, f.rest))?.status,
    404,
  );
  assert.equal(f.gets.length, 0);
});
test("public avatar: private routes and upload fall through unchanged; bad paths, methods, config and outages fail closed", async () => {
  const f = fixture();
  for (const path of [
    "/media/avatar",
    `/media/avatar/${owner}/old.png`,
    "/media/covers/a.png",
  ]) {
    assert.equal(
      await handler(new Request(avatarApiBase + path), f.env, f.rest),
      null,
    );
  }
  assert.equal(f.requests.length, 0);
  assert.equal(
    (await handler(new Request(route(), { method: "POST" }), f.env, f.rest))
      ?.status,
    405,
  );
  for (const path of [
    route() + "?key=secret",
    route("old.svg"),
    route("bad%2Fname.png"),
  ])
    assert.equal(
      (await handler(new Request(path), f.env, f.rest))?.status,
      404,
    );
  const privileged =
    "eyJhbGciOiJub25lIn0." +
    btoa(JSON.stringify({ role: "service_role" })) +
    ".signature";
  assert.equal(
    (
      await handler(
        new Request(route()),
        { ...f.env, SUPABASE_PUBLISHABLE_KEY: privileged },
        f.rest,
      )
    )?.status,
    503,
  );
  assert.equal(f.gets.length, 0);
  f.fail();
  assert.equal(
    (await handler(new Request(route()), f.env, f.rest))?.status,
    503,
  );
  assert.equal(f.gets.length, 0);
  const invalid = fixture();
  invalid.env.AG_MEDIA.get = async () => ({
    body: new Uint8Array([1]),
    size: 1,
    httpMetadata: { contentType: "image/svg+xml" },
  });
  assert.equal(
    (await handler(new Request(route()), invalid.env, invalid.rest))?.status,
    404,
  );
});
test("public avatar: profile rendering uses a public route without session, editor stays private and initials remain available", () => {
  assert.equal(publicAvatarUrl(oldKey), route());
  assert.equal(publicAvatarUrl("covers/anything.png"), null);
  const publicHtml = renderToStaticMarkup(
    <ProfileAvatar name="Autora" url={oldKey} publicProfile />,
  );
  assert.ok(publicHtml.includes(route()));
  assert.ok(publicHtml.includes('crossorigin="anonymous"'));
  assert.ok(!publicHtml.includes("Bearer"));
  const privateHtml = renderToStaticMarkup(
    <ProfileAvatar name="Autora" url={oldKey} />,
  );
  assert.ok(!privateHtml.includes(route()));
  assert.ok(privateHtml.includes("profile-avatar-monogram"));
  const empty = renderToStaticMarkup(
    <ProfileAvatar name="Autora Real" url={null} publicProfile />,
  );
  assert.ok(empty.includes("AR"));
});

test("public avatar: Workers-compatible manual redirect never follows credentials to another host", async () => {
  const f = fixture();
  const runtimeFetch: typeof fetch = async (_input, init) => {
    if (init?.redirect === "error")
      throw new TypeError("Unsupported redirect mode: error");
    assert.equal(init?.redirect, "manual");
    return new Response(null, {
      status: 302,
      headers: { Location: "https://other.invalid/profiles" },
    });
  };
  assert.equal(
    (await handler(new Request(route()), f.env, runtimeFetch))?.status,
    503,
  );
  assert.equal(f.gets.length, 0);
});
