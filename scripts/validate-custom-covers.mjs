// In-memory PostgreSQL only. Never connects to Supabase or R2.
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite();
const a = randomUUID(),
  b = randomUUID();
async function role(id) {
  await db.exec("RESET ROLE; SET ROLE " + (id ? "authenticated" : "anon"));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
}
const workerToken = "disposable-sql-worker-proof-0000000000000000000";
const protectedRpc = new Set([
  "reserve_cover_upload",
  "list_unused_cover_assets",
  "finish_cover_upload",
  "begin_delete_cover",
  "finish_delete_cover",
]);
const rpc = async (name, args) => {
  const values = protectedRpc.has(name) ? [...args, workerToken] : args;
  return (
    await db.query(
      `SELECT public.${name}(${values.map((_, i) => "$" + (i + 1)).join(",")}) r`,
      values,
    )
  ).rows[0].r;
};
const read = async (id) => rpc("read_private_work", [id]);
const mutate = async (w, action, payload = {}) =>
  (
    await rpc("mutate_private_work", [
      w.id,
      w.revision,
      action,
      payload,
      randomUUID(),
    ])
  ).work;
const publish = async (w, action = "publish", operation = randomUUID()) =>
  rpc("publish_private_work", [w.id, w.revision, action, operation]);
const attach = async (w, image) =>
  (
    await db.query(
      "UPDATE public.works SET cover_image=$1 WHERE id=$2 AND revision=$3 RETURNING *",
      [image, w.id, w.revision],
    )
  ).rows[0];
try {
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users,username text,display_name text);GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;GRANT SELECT ON public.profiles TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;`,
  );
  for (const id of [a, b]) {
    await db.query("INSERT INTO auth.users VALUES($1)", [id]);
    await db.query("INSERT INTO public.profiles VALUES($1,$2,'Autora')", [
      id,
      id,
    ]);
  }
  const files = (await readdir("supabase/migrations"))
    .filter(
      (f) =>
        f.startsWith("20261111") ||
        f === "20261114000000_custom_cover_media.sql",
    )
    .sort();
  for (const file of files)
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await db.query(
    "UPDATE public.cover_media_settings SET worker_token_hash=encode(sha256(convert_to($1,'UTF8')),'hex')",
    [workerToken],
  );
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language,age_rating,cover_style,cover_seed) VALUES('Visual','visual','Sinopse','Romance','pt','Livre','retro',42) RETURNING *",
    )
  ).rows[0];
  const originalId = w.id;
  await assert.rejects(
    db.query(
      "SELECT public.reserve_cover_upload($1,'image/png',100,'wrong-worker-token')",
      [w.id],
    ),
  );
  const asset = await rpc("reserve_cover_upload", [w.id, "image/png", 100]);
  await assert.rejects(
    rpc("begin_delete_cover", [asset.id]),
    (e) => e.code === "55000",
  );
  assert.equal(asset.owner_id, a);
  assert.ok(asset.object_key.startsWith("covers/" + a + "/" + w.id + "/"));
  const image = { assetId: asset.id, x: 30, y: 70, zoom: 1.2 };
  await assert.rejects(attach(w, image));
  await assert.rejects(
    db.query("SELECT public.finish_cover_upload($1,'wrong-token')", [asset.id]),
  );
  await assert.rejects(
    db.query("UPDATE public.cover_assets SET state='ready' WHERE id=$1", [
      asset.id,
    ]),
  );
  await rpc("finish_cover_upload", [asset.id]);
  w = await attach(w, image);
  assert.equal(w.revision, 2);
  assert.deepEqual((await read(w.id)).cover_image, image);
  assert.equal(w.cover_style, "retro");
  assert.equal(w.cover_seed, 42);
  await role(b);
  await assert.rejects(rpc("finish_cover_upload", [asset.id]));
  await assert.rejects(rpc("begin_delete_cover", [asset.id]));
  assert.equal(
    (await db.query("SELECT * FROM public.cover_assets")).rows.length,
    0,
  );
  const own = (
    await db.query(
      "INSERT INTO public.works(title,slug,type,language) VALUES('Outro','outro','Romance','pt') RETURNING *",
    )
  ).rows[0];
  await assert.rejects(attach(own, image));
  await role(a);
  w = await mutate(w, "add_entry");
  w = await mutate(w, "save_entry", {
    entry_id: w.entries[0].id,
    entry_revision: 1,
    title: "Capítulo",
    content: "Texto preservado",
    alignment: "left",
  });
  const operation = randomUUID();
  const revision = w.revision;
  w = (await publish(w, "publish", operation)).work;
  const repeated = await rpc("publish_private_work", [
    w.id,
    revision,
    "publish",
    operation,
  ]);
  assert.ok(repeated.already_applied);
  assert.equal(repeated.work.revision, w.revision);
  await assert.rejects(rpc("begin_delete_cover", [asset.id]));
  await role(null);
  assert.deepEqual(
    (await rpc("read_public_work", [w.public_id])).cover_image,
    image,
  );
  assert.deepEqual(
    (await rpc("search_public_works", [{}])).items[0].cover_image,
    image,
  );
  assert.deepEqual(
    (await rpc("profile_published_works", [a])).items[0].cover_image,
    image,
  );
  await assert.rejects(db.query("SELECT * FROM public.cover_assets"));
  await assert.rejects(rpc("reserve_cover_upload", [w.id, "image/png", 100]));
  await role(a);
  w = await attach(w, { ...image, x: 5 });
  await role(null);
  assert.deepEqual(
    (await rpc("read_public_work", [w.public_id])).cover_image,
    image,
  );
  await role(a);
  const asset2 = await rpc("reserve_cover_upload", [w.id, "image/webp", 100]);
  await rpc("finish_cover_upload", [asset2.id]);
  const image2 = { ...image, assetId: asset2.id };
  w = await attach(w, image2);
  await role(null);
  assert.deepEqual(
    (await rpc("read_public_work", [w.public_id])).cover_image,
    image,
  );
  await role(a);
  await assert.rejects(rpc("begin_delete_cover", [asset.id]));
  w = (await publish(w)).work;
  await role(null);
  assert.deepEqual(
    (await rpc("read_public_work", [w.public_id])).cover_image,
    image2,
  );
  await role(a);
  await db.exec("RESET ROLE");
  await db.exec(
    "UPDATE public.cover_assets SET created_at=now()-interval '2 days'",
  );
  await role(a);
  const orphans = await rpc("list_unused_cover_assets", [50]);
  assert.ok(orphans.some((r) => r.id === asset.id));
  assert.ok(!orphans.some((r) => r.id === asset2.id));
  const duplicate = await mutate(w, "duplicate_work");
  assert.deepEqual(duplicate.cover_image, image2);
  assert.equal(duplicate.cover_seed, 42);
  w = (await publish(w, "withdraw")).work;
  await role(null);
  assert.equal(await rpc("read_public_work", [w.public_id]), null);
  await role(a);
  w = (await publish(w)).work;
  await role(null);
  assert.deepEqual(
    (await rpc("read_public_work", [w.public_id])).cover_image,
    image2,
  );
  await role(a);
  w = (await publish(w, "withdraw")).work;
  w = await attach(w, null);
  await assert.rejects(rpc("begin_delete_cover", [asset2.id]));
  await mutate(duplicate, "delete_work");
  await rpc("begin_delete_cover", [asset2.id]);
  await assert.rejects(attach(w, image2));
  await rpc("finish_delete_cover", [asset2.id]);
  await rpc("begin_delete_cover", [asset.id]);
  await rpc("finish_delete_cover", [asset.id]);
  await assert.rejects(
    rpc("reserve_cover_upload", [w.id, "image/svg+xml", 100]),
  );
  await assert.rejects(
    rpc("reserve_cover_upload", [w.id, "image/png", 5242881]),
  );
  await assert.rejects(attach(w, { assetId: asset.id, x: -1, y: 0, zoom: 1 }));
  await db.exec("RESET ROLE");
  await db.exec("UPDATE public.cover_media_settings SET max_owner_assets=1");
  await role(a);
  await rpc("reserve_cover_upload", [originalId, "image/png", 100]);
  await assert.rejects(
    rpc("reserve_cover_upload", [originalId, "image/png", 100]),
  );
  console.log(
    "PASS F4.2-A SQL: all migrations; grants/RLS; ownership; revision/idempotence; style/seed preservation; public snapshot isolation/update/withdrawal; duplication; deletion pins; quotas; invalid references.",
  );
} finally {
  await db.close();
}
