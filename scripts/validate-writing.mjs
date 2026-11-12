// Disposable local PostgreSQL; never connects to Supabase.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite(),
  a = randomUUID(),
  b = randomUUID();
const role = async (id) => {
  await db.exec("RESET ROLE;SET ROLE " + (id ? "authenticated" : "anon"));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
};
const mutate = async (w, action, payload = {}) =>
  (
    await db.query("SELECT public.mutate_private_work($1,$2,$3,$4,$5) r", [
      w.id,
      w.revision,
      action,
      payload,
      randomUUID(),
    ])
  ).rows[0].r.work;
const rich =
  "AGRT/1\n" +
  JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Texto formatado", marks: [{ type: "bold" }] },
        ],
      },
    ],
  });
try {
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE TABLE public.profiles(id uuid PRIMARY KEY,username text,display_name text);GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;GRANT SELECT ON public.profiles TO anon,authenticated;`,
  );
  for (const id of [a, b]) {
    await db.query("INSERT INTO auth.users VALUES($1)", [id]);
    await db.query("INSERT INTO public.profiles VALUES($1,'autor','Autor')", [
      id,
    ]);
  }
  for (const file of [
    "20261111000000_create_private_works.sql",
    "20261111010000_private_editorial_entries.sql",
    "20261111020000_publication_catalog.sql",
    "20261111030000_public_discovery.sql",
    "20261111040000_persist_cover_styles.sql",
    "20261111050000_cover_studio_v2.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language)VALUES('Obra','obra','Sinopse','Romance','pt')RETURNING *",
    )
  ).rows[0];
  w = await mutate(w, "add_entry");
  const payload = (content) => ({
    entry_id: w.entries[0].id,
    entry_revision: w.entries[0].revision,
    title: "Entrada",
    content,
    alignment: "left",
  });
  w = await mutate(w, "save_entry", payload("Texto antigo\n\n**Legado**"));
  assert.equal(w.entries[0].content, "Texto antigo\n\n**Legado**");
  w = await mutate(w, "save_entry", payload(rich));
  assert.equal(w.entries[0].content, rich);
  const duplicate = await mutate(w, "duplicate_entry", {
    entry_id: w.entries[0].id,
    entry_revision: w.entries[0].revision,
  });
  w = duplicate;
  assert.equal(w.entries[1].content, rich);
  w = (
    await db.query("SELECT public.publish_private_work($1,$2,$3,$4) r", [
      w.id,
      w.revision,
      "publish",
      randomUUID(),
    ])
  ).rows[0].r.work;
  await role(null);
  const snapshot = (
    await db.query("SELECT public.read_public_work($1) r", [w.public_id])
  ).rows[0].r;
  assert.equal(snapshot.entries[0].content, rich);
  assert.equal(snapshot.entries[1].content, rich);
  await assert.rejects(db.query("SELECT * FROM public.work_entries"));
  await role(a);
  const stale = w;
  w = await mutate(
    w,
    "save_entry",
    payload(rich.replace("Texto formatado", "Nova edição privada")),
  );
  await assert.rejects(mutate(stale, "save_entry", payload(rich)));
  await role(b);
  await assert.rejects(mutate(w, "save_entry", payload(rich)));
  await role(null);
  assert.deepEqual(
    (await db.query("SELECT public.read_public_work($1) r", [w.public_id]))
      .rows[0].r,
    snapshot,
  );
  await role(a);
  await assert.rejects(
    mutate(w, "save_entry", payload("x".repeat(1048577))),
    (e) => e.code === "23514",
  );
  const recovered = (
    await db.query("SELECT public.read_private_work($1) r", [w.id])
  ).rows[0].r;
  assert.equal(recovered.entries[0].content, w.entries[0].content);
  const copy = await mutate(w, "duplicate_work");
  assert.equal(copy.entries[0].content, w.entries[0].content);
  console.log(
    "PASS Writing SQL: plain/rich text persistence; duplicate entry/work; publication copies unchanged content; private updates preserve snapshots; owner/RLS/revision rejection; 1 MB bound; recovery.",
  );
} finally {
  await db.close();
}
