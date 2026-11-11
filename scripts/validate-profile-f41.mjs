// Disposable PostgreSQL only. No Supabase calls.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite(),
  a = randomUUID(),
  b = randomUUID(),
  c = randomUUID();
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
const pub = async (w, action = "publish") =>
  (
    await db.query("SELECT public.publish_private_work($1,$2,$3,$4) r", [
      w.id,
      w.revision,
      action,
      randomUUID(),
    ])
  ).rows[0].r.work;
const list = async (id) =>
  (await db.query("SELECT public.profile_published_works($1) r", [id])).rows[0]
    .r;
try {
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users,username text,display_name text);GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;GRANT SELECT ON public.profiles TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;`,
  );
  for (const id of [a, b, c]) {
    await db.query("INSERT INTO auth.users VALUES($1)", [id]);
    await db.query("INSERT INTO public.profiles VALUES($1,$2,'Autora')", [
      id,
      id === a ? "antigo" : "outro",
    ]);
  }
  for (const file of [
    "20261111000000_create_private_works.sql",
    "20261111010000_private_editorial_entries.sql",
    "20261111020000_publication_catalog.sql",
    "20261111060000_profile_features.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language,age_rating,content_warnings)VALUES('Obra real','obra-real','Sinopse','Romance','pt','+18',ARRAY['Violência']) RETURNING *",
    )
  ).rows[0];
  w = await mutate(w, "add_entry");
  w = await mutate(w, "save_entry", {
    entry_id: w.entries[0].id,
    entry_revision: 1,
    title: "Entrada",
    content: "Texto real",
    alignment: "left",
  });
  assert.equal((await list(a)).total, 0);
  w = await pub(w);
  await db.exec("RESET ROLE");
  await db.query("UPDATE public.profiles SET username='novo' WHERE id=$1", [a]);
  await role(null);
  let result = await list(a);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].id, w.public_id);
  assert.equal(result.items[0].age_rating, "+18");
  assert.deepEqual(result.items[0].content_warnings, ["Violência"]);
  assert.ok(!("work_id" in result.items[0]));
  assert.ok(!("owner_id" in result.items[0]));
  assert.equal((await list(b)).total, 0);
  await assert.rejects(db.query("SELECT * FROM public.works"));
  await assert.rejects(
    db.query(
      "INSERT INTO public.profile_follows(follower_id,followed_id)VALUES($1,$2)",
      [b, a],
    ),
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM public.profile_follows WHERE followed_id=$1",
        [a],
      )
    ).rows[0].n,
    0,
  );
  await role(b);
  await db.query(
    "INSERT INTO public.profile_follows(follower_id,followed_id)VALUES($1,$2)",
    [b, a],
  );
  await assert.rejects(
    db.query(
      "INSERT INTO public.profile_follows(follower_id,followed_id)VALUES($1,$2)",
      [b, a],
    ),
    (e) => e.code === "23505",
  );
  await assert.rejects(
    db.query(
      "INSERT INTO public.profile_follows(follower_id,followed_id)VALUES($1,$1)",
      [b],
    ),
  );
  await assert.rejects(
    db.query(
      "INSERT INTO public.profile_follows(follower_id,followed_id)VALUES($1,$2)",
      [c, a],
    ),
  );
  await assert.rejects(
    db.query("UPDATE public.profile_follows SET followed_id=$1", [c]),
  );
  await role(c);
  assert.equal(
    (await db.query("DELETE FROM public.profile_follows RETURNING follower_id"))
      .rows.length,
    0,
  );
  await role(null);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM public.profile_follows WHERE followed_id=$1",
        [a],
      )
    ).rows[0].n,
    1,
  );
  await role(a);
  w = await pub(w, "withdraw");
  await role(null);
  assert.equal((await list(a)).total, 0);
  await role(b);
  await db.query("DELETE FROM public.profile_follows");
  await role(null);
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM public.profile_follows"))
      .rows[0].n,
    0,
  );
  console.log(
    "PASS F4.1 SQL: stable author ownership after username change; public snapshots only; +18/warnings retained; withdrawn/draft excluded; follower counts, uniqueness, no-self, RLS and permissions.",
  );
} finally {
  await db.close();
}
