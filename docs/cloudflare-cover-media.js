// F4.2-A: add above the EXISTING Worker's export; call BEFORE the existing OPTIONS and
// before global authentication/routing. Do not replace any avatar handlers.
// const coverResponse = await handleAgCoverMedia(request, env);
// if (coverResponse) return coverResponse;
async function handleAgCoverMedia(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/media/cover/")) return null;
  const origins = new Set([
    "https://arquivoglobal.vercel.app",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    ...(env.MEDIA_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ]);
  const origin = request.headers.get("Origin");
  const headers = {
    "Cache-Control": "no-store",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (origin && origins.has(origin))
    headers["Access-Control-Allow-Origin"] = origin;
  const reply = (message, status = 200) =>
    Response.json({ message }, { status, headers });
  if (origin && !origins.has(origin))
    return reply("Origem não autorizada.", 403);
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
      },
    });
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  if (url.search) return reply("Rota inválida.", 404);
  const publicMatch = url.pathname.match(
    new RegExp(`^/media/cover/public/(${uuid})/(${uuid})$`, "i"),
  );
  const privateMatch = url.pathname.match(
    new RegExp(`^/media/cover/private/(${uuid})/(${uuid})$`, "i"),
  );
  const uploadMatch = url.pathname.match(
    new RegExp(`^/media/cover/works/(${uuid})$`, "i"),
  );
  const deleteMatch = url.pathname.match(
    new RegExp(`^/media/cover/assets/(${uuid})$`, "i"),
  );
  const cleanup = url.pathname === "/media/cover/cleanup";
  if (!publicMatch && !privateMatch && !uploadMatch && !deleteMatch && !cleanup)
    return reply("Não encontrado.", 404);
  try {
    const base = new URL(env.SUPABASE_URL);
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== "/"
    )
      return reply("Media indisponível.", 503);
    const key = env.SUPABASE_PUBLISHABLE_KEY;
    let anon = typeof key === "string" && key.startsWith("sb_publishable_"),
      legacy = false;
    if (!anon && typeof key === "string" && key.startsWith("eyJ")) {
      try {
        legacy =
          JSON.parse(
            atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
          ).role === "anon";
      } catch {}
    }
    if (!anon && !legacy) return reply("Media indisponível.", 503);
    const token = request.headers.get("Authorization");
    const http = async (
      path,
      { method = "GET", body, authenticated = true } = {},
    ) => {
      const h = { apikey: key };
      if (authenticated) h.Authorization = token;
      else if (legacy) h.Authorization = `Bearer ${key}`;
      if (body !== undefined) h["Content-Type"] = "application/json";
      const response = await fetcher(new URL(path, base), {
        method,
        headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const e = new Error("Operação de media recusada.");
        e.status = ["23503", "55000"].includes(err?.code)
          ? 409
          : err?.code === "54000"
            ? 413
            : response.status === 401 || response.status === 403
              ? 403
              : 503;
        throw e;
      }
      return response.status === 204 ? null : response.json();
    };
    const writeRpcs = new Set([
      "reserve_cover_upload",
      "list_unused_cover_assets",
      "finish_cover_upload",
      "begin_delete_cover",
      "finish_delete_cover",
    ]);
    const rpc = (name, body) =>
      http(`/rest/v1/rpc/${name}`, {
        method: "POST",
        body: writeRpcs.has(name)
          ? { ...body, p_worker_token: env.COVER_MEDIA_TOKEN }
          : body,
      });
    const keyPattern = new RegExp(
      `^covers/${uuid}/${uuid}/${uuid}\\.(jpg|png|webp)$`,
      "i",
    );
    const deliver = async (objectKey, mime) => {
      if (
        !keyPattern.test(objectKey) ||
        !["image/jpeg", "image/png", "image/webp"].includes(mime)
      )
        return reply("Não encontrado.", 404);
      const object = await env.AG_MEDIA.get(objectKey);
      if (!object || object.httpMetadata?.contentType !== mime)
        return reply("Não encontrado.", 404);
      return new Response(object.body, {
        headers: {
          ...headers,
          "Content-Type": mime,
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      });
    };
    if (publicMatch) {
      if (request.method !== "GET") return reply("Método não permitido.", 405);
      const [_, publicId, assetId] = publicMatch;
      const rows = await http(
        `/rest/v1/published_works?select=cover_image&id=eq.${publicId}&is_public=eq.true`,
        { authenticated: false },
      );
      if (
        !Array.isArray(rows) ||
        rows.length !== 1 ||
        rows[0].cover_image?.assetId?.toLowerCase() !== assetId.toLowerCase()
      )
        return reply("Não encontrado.", 404);
      // Private R2 manifest resolves the storage key without exposing owner/work IDs
      // via a public SQL function or storing any credentials in the browser.
      const index = await env.AG_MEDIA.get(
        `cover-index/${assetId.toLowerCase()}.json`,
      );
      if (!index) return reply("Não encontrado.", 404);
      const record = await index.json();
      if (
        record.assetId !== assetId.toLowerCase() ||
        !record.key.includes(`/${assetId.toLowerCase()}.`)
      )
        return reply("Não encontrado.", 404);
      return deliver(record.key, record.mime);
    }
    if (!token || !/^Bearer \S+$/.test(token))
      return reply("Inicia sessão.", 401);
    const identity = await http("/auth/v1/user");
    if (!identity?.id || !new RegExp(`^${uuid}$`, "i").test(identity.id))
      return reply("Sessão inválida.", 401);
    const owner = identity.id;
    if (
      request.method !== "GET" &&
      (typeof env.COVER_MEDIA_TOKEN !== "string" ||
        env.COVER_MEDIA_TOKEN.length < 32)
    )
      return reply("Serviço de capas por ativar.", 503);
    async function asset(id) {
      const rows = await http(
        `/rest/v1/cover_assets?select=id,owner_id,object_key,mime,state,created_at&id=eq.${id}&owner_id=eq.${owner}`,
      );
      if (!Array.isArray(rows) || rows.length !== 1) return null;
      return rows[0];
    }
    async function ownedWork(id) {
      const rows = await http(
        `/rest/v1/works?select=id,owner_id&id=eq.${id}&owner_id=eq.${owner}`,
      );
      return (
        Array.isArray(rows) &&
        rows.length === 1 &&
        rows[0].id === id &&
        rows[0].owner_id === owner
      );
    }
    async function remove(id) {
      const row = await rpc("begin_delete_cover", { p_asset_id: id });
      if (
        !row ||
        row.owner_id !== owner ||
        !keyPattern.test(row.object_key) ||
        !row.object_key.startsWith(`covers/${owner}/`)
      )
        throw new Error("Referência inválida.");
      await env.AG_MEDIA.delete(row.object_key);
      await env.AG_MEDIA.delete(`cover-index/${id}.json`);
      await rpc("finish_delete_cover", { p_asset_id: id });
    }
    if (privateMatch && request.method === "GET") {
      const [_, workId, id] = privateMatch;
      if (!(await ownedWork(workId))) return reply("Não encontrado.", 404);
      const row = await asset(id);
      if (!row || row.state !== "ready") return reply("Não encontrado.", 404);
      return deliver(row.object_key, row.mime);
    }
    if (deleteMatch && request.method === "DELETE") {
      await remove(deleteMatch[1]);
      return reply("Ficheiro não utilizado eliminado.");
    }
    if (cleanup && request.method === "POST") {
      // Grace period prevents deleting an in-flight upload/edit in another tab.
      // Filter references in SQL before LIMIT: pinned rows cannot starve orphans.
      const rows = await rpc("list_unused_cover_assets", { p_limit: 50 });
      let removed = 0;
      for (const row of rows) {
        try {
          await remove(row.id);
          removed++;
        } catch (e) {
          if (e.status !== 409) throw e;
        }
      }
      return Response.json({ removed }, { headers });
    }
    if (!uploadMatch || request.method !== "POST")
      return reply("Método não permitido.", 405);
    if (!(await ownedWork(uploadMatch[1])))
      return reply("Não encontrado.", 404);
    const mime = request.headers.get("Content-Type");
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
      return reply("Escolhe JPEG, PNG ou WebP.", 415);
    const maximum = Math.min(
      5242880,
      Math.max(1, Number(env.MEDIA_MAX_COVER_BYTES) || 5242880),
    );
    if (Number(request.headers.get("Content-Length")) > maximum)
      return reply("Capa demasiado grande.", 413);
    const reader = request.body?.getReader();
    if (!reader) return reply("Imagem vazia.", 400);
    const parts = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        return reply("Capa demasiado grande.", 413);
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    if (!validateCoverBytes(bytes, mime))
      return reply("Imagem inválida ou truncada.", 415);
    const row = await rpc("reserve_cover_upload", {
      p_work_id: uploadMatch[1],
      p_mime: mime,
      p_bytes: length,
    });
    if (
      !row ||
      row.owner_id !== owner ||
      !keyPattern.test(row.object_key) ||
      !row.object_key.startsWith(`covers/${owner}/`)
    )
      return reply("Media indisponível.", 503);
    await env.AG_MEDIA.put(row.object_key, bytes, {
      httpMetadata: { contentType: mime },
    });
    await env.AG_MEDIA.put(
      `cover-index/${row.id}.json`,
      JSON.stringify({ assetId: row.id, key: row.object_key, mime }),
      { httpMetadata: { contentType: "application/json" } },
    );
    await rpc("finish_cover_upload", { p_asset_id: row.id });
    return Response.json({ assetId: row.id }, { status: 201, headers });
  } catch (e) {
    return reply(
      e.status === 409
        ? "A imagem ainda é usada num rascunho ou publicação."
        : e.status === 413
          ? "Limite de armazenamento atingido."
          : "Não foi possível concluir a operação de media. Tenta novamente.",
      e.status || 503,
    );
  }
}
function validateCoverBytes(bytes, mime) {
  const b = bytes,
    n = b.length,
    ascii = (a, z) => String.fromCharCode(...b.slice(a, z));
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const pixels = (w, h) => w > 0 && h > 0 && w * h <= 40000000;
  if (mime === "image/png") {
    if (
      n < 45 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v) ||
      ascii(12, 16) !== "IHDR" ||
      view.getUint32(8) !== 13 ||
      !pixels(view.getUint32(16), view.getUint32(20))
    )
      return false;
    let pos = 8,
      data = false;
    while (pos + 12 <= n) {
      const size = view.getUint32(pos);
      if (size > n - pos - 12) return false;
      const type = ascii(pos + 4, pos + 8);
      if (type === "IDAT" && size > 0) data = true;
      if (type === "IEND") return size === 0 && pos + 12 === n && data;
      pos += size + 12;
    }
    return false;
  }
  if (mime === "image/webp") {
    if (
      n < 20 ||
      ascii(0, 4) !== "RIFF" ||
      ascii(8, 12) !== "WEBP" ||
      view.getUint32(4, true) + 8 !== n
    )
      return false;
    let pos = 12,
      frame = false;
    while (pos + 8 <= n) {
      const type = ascii(pos, pos + 4),
        size = view.getUint32(pos + 4, true),
        start = pos + 8;
      if (size > n - start) return false;
      if (type === "VP8X") {
        if (
          size < 10 ||
          b[start] & 2 ||
          !pixels(
            1 + b[start + 4] + (b[start + 5] << 8) + (b[start + 6] << 16),
            1 + b[start + 7] + (b[start + 8] << 8) + (b[start + 9] << 16),
          )
        )
          return false;
      }
      if (type === "VP8 ") {
        if (
          size < 10 ||
          ascii(start + 3, start + 6) !== "\x9d\x01\x2a" ||
          !pixels(
            view.getUint16(start + 6, true) & 16383,
            view.getUint16(start + 8, true) & 16383,
          )
        )
          return false;
        frame = true;
      }
      if (type === "VP8L") {
        if (size < 5 || b[start] !== 47) return false;
        const bits = view.getUint32(start + 1, true);
        if (!pixels((bits & 16383) + 1, ((bits >>> 14) & 16383) + 1))
          return false;
        frame = true;
      }
      pos = start + size + (size % 2);
    }
    return frame && pos === n;
  }
  if (mime === "image/jpeg") {
    if (
      n < 12 ||
      b[0] !== 255 ||
      b[1] !== 216 ||
      b[n - 2] !== 255 ||
      b[n - 1] !== 217
    )
      return false;
    let i = 2,
      frame = false;
    while (i < n - 2) {
      if (b[i++] !== 255) return false;
      while (b[i] === 255) i++;
      const marker = b[i++];
      if (marker === 218) return frame && i + 2 < n;
      if (marker === 217) break;
      if (i + 2 > n) return false;
      const size = (b[i] << 8) | b[i + 1];
      if (size < 2 || i + size > n) return false;
      if ([192, 193, 194].includes(marker)) {
        if (
          size < 8 ||
          ((b[i + 3] << 8) | b[i + 4]) === 0 ||
          ((b[i + 5] << 8) | b[i + 6]) === 0
        )
          return false;
        if (!pixels((b[i + 5] << 8) | b[i + 6], (b[i + 3] << 8) | b[i + 4]))
          return false;
        frame = true;
      }
      i += size;
    }
  }
  return false;
}
