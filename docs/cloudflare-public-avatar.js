// Add ABOVE the existing `export default` in the Cloudflare Worker.
// Inside fetch(request, env), after OPTIONS and BEFORE authentication/media routing:
// const avatarPublicResponse = await handleAgPublicAvatar(request, env);
// if (avatarPublicResponse) return avatarPublicResponse;
async function handleAgPublicAvatar(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/media/avatar/public/")) return null;
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0",
    "Access-Control-Allow-Origin": "*",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "X-Content-Type-Options": "nosniff",
  };
  const fail = (status) =>
    new Response(status === 404 ? "Not found" : "Avatar unavailable", {
      status,
      headers,
    });
  if (request.method !== "GET")
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: "GET" },
    });
  const match = url.pathname.match(
    /^\/media\/avatar\/public\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([a-z0-9_-]{1,160}\.(?:jpe?g|png|webp))$/i,
  );
  if (!match || url.search) return fail(404);
  const [, owner, file] = match;
  try {
    // Never use a service-role/secret key here: profile visibility is enforced
    // by the anonymous role and the existing profiles SELECT policy.
    const key = env.SUPABASE_PUBLISHABLE_KEY;
    let publicKey =
      typeof key === "string" && key.startsWith("sb_publishable_");
    if (!publicKey && typeof key === "string") {
      try {
        const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        publicKey =
          JSON.parse(
            atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")),
          ).role === "anon";
      } catch {
        /* Fail closed for invalid or privileged keys. */
      }
    }
    const base = new URL(env.SUPABASE_URL);
    if (
      !publicKey ||
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !["", "/"].includes(base.pathname)
    )
      return fail(503);
    const lookup = new URL("/rest/v1/profiles", base);
    lookup.search = new URLSearchParams({
      select: "id,avatar_url",
      id: `eq.${owner}`,
      limit: "1",
    }).toString();
    // No user Authorization header is forwarded; public visibility only.
    const response = await fetcher(lookup.href, {
      headers: { apikey: key, Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      // Workers supports manual/follow only; error throws before the HTTP request.
      redirect: "manual",
    });
    if (!response.ok) return fail(503);
    const rows = await response.json();
    if (
      !Array.isArray(rows) ||
      rows.length !== 1 ||
      rows[0].id !== owner ||
      typeof rows[0].avatar_url !== "string"
    )
      return fail(404);
    const reference = rows[0].avatar_url;
    // Dedicated avatar namespaces ONLY. Never accept arbitrary R2 keys,
    // covers/pages/illustrations, external URLs, or another owner's directory.
    if (
      reference !== `avatars/${owner}/${file}` &&
      reference !== `avatar/${owner}/${file}`
    )
      return fail(404);
    const object = await env.AG_MEDIA.get(reference);
    if (!object || !object.body || object.size > 2 * 1024 * 1024)
      return fail(404);
    const type = object.httpMetadata?.contentType
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(type))
      return fail(404);
    return new Response(object.body, {
      headers: {
        ...headers,
        "Content-Type": type,
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return fail(503);
  }
}
