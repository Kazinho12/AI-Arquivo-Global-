// Disposable PostgreSQL, simulated claims only. Never connects to Supabase.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
if (!process.env.PGLITE_PATH) throw Error("Define PGLITE_PATH");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite();
const a = randomUUID(),
  b = randomUUID();
const role = async (user) => {
  await db.exec("RESET ROLE; SET ROLE " + (user ? "authenticated" : "anon"));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
};
const read = async (id) =>
  (await db.query("SELECT public.read_private_work($1) AS w", [id])).rows[0].w;
const pub = async (w, action = "publish", op = randomUUID()) =>
  (
    await db.query("SELECT public.publish_private_work($1,$2,$3,$4) AS r", [
      w.id,
      w.revision,
      action,
      op,
    ])
  ).rows[0].r;
const mutate = async (w, action, payload = {}) =>
  (
    await db.query("SELECT public.mutate_private_work($1,$2,$3,$4,$5) AS r", [
      w.id,
      w.revision,
      action,
      payload,
      randomUUID(),
    ])
  ).rows[0].r.work;
const publicRead = async (id) =>
  (await db.query("SELECT public.read_public_work($1) AS w", [id])).rows[0].w;
const denied = async (sql, args = [], code) =>
  assert.rejects(db.query(sql, args), (e) => !code || e.code === code);
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;`);
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [a, b]);
  for (const file of [
    "20261111000000_create_private_works.sql",
    "20261111010000_private_editorial_entries.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language)VALUES('Legada','legada','Sinopse válida','Romance','pt')RETURNING *",
    )
  ).rows[0];
  w = await mutate(w, "add_entry");
  w = await mutate(w, "save_entry", {
    entry_id: w.entries[0].id,
    entry_revision: w.entries[0].revision,
    title: "Primeiro",
    content: "Texto confirmado",
    alignment: "left",
  });
  const original = structuredClone(w);
  await db.exec("RESET ROLE");
  await db.exec(
    await readFile(
      "supabase/migrations/20261111020000_publication_catalog.sql",
      "utf8",
    ),
  );
  if (process.env.AG_SQL_COVER_STYLE === "1") {
    await db.exec(
      await readFile(
        "supabase/migrations/20261111030000_public_discovery.sql",
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        "supabase/migrations/20261111040000_persist_cover_styles.sql",
        "utf8",
      ),
    );
  }
  await role(a);
  w = await read(w.id);
  for (const key of Object.keys(original).filter((k) => k !== "entries"))
    assert.deepEqual(w[key], original[key], key);
  for (const key of Object.keys(original.entries[0]))
    assert.deepEqual(w.entries[0][key], original.entries[0][key], key);
  const publicId = w.public_id;
  assert.notEqual(publicId, w.id);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM pg_trigger WHERE tgrelid='public.works'::regclass AND NOT tgisinternal",
      )
    ).rows[0].n,
    1,
  );
  // F2.1's table-level SELECT covers columns added later: an invoker RPC
  // can read them as the owner without granting any direct protected writes.
  for (const column of [
    "public_id",
    "first_published_at",
    "last_published_at",
    "withdrawn_at",
    "published_revision",
  ]) {
    for (const roleName of ["anon", "authenticated"]) {
      const privileges = (
        await db.query(
          `SELECT
        has_column_privilege($1,'public.works',$2,'SELECT') AS readable,
        has_column_privilege($1,'public.works',$2,'INSERT') AS insertable,
        has_column_privilege($1,'public.works',$2,'UPDATE') AS editable`,
          [roleName, column],
        )
      ).rows[0];
      assert.deepEqual(
        privileges,
        {
          readable: roleName === "authenticated",
          insertable: false,
          editable: false,
        },
        `${roleName}:${column}`,
      );
    }
  }
  const invoker = (
    await db.query(
      "SELECT prosecdef,proconfig FROM pg_proc WHERE oid='public.read_private_work(uuid)'::regprocedure",
    )
  ).rows[0];
  assert.equal(invoker.prosecdef, false);
  assert.ok(invoker.proconfig.includes('search_path=""'));
  // New protected columns cannot be written via REST, even by owner.
  for (const col of [
    "status",
    "visibility",
    "public_id",
    "first_published_at",
    "last_published_at",
    "withdrawn_at",
    "published_revision",
    "owner_id",
  ]) {
    assert.equal(
      (
        await db.query(
          "SELECT has_column_privilege('authenticated','public.works',$1,'UPDATE') AS ok",
          [col],
        )
      ).rows[0].ok,
      false,
      col,
    );
    await denied(
      `UPDATE public.works SET ${col}=${col} WHERE id=$1`,
      [w.id],
      "42501",
    );
  }
  for (const r of ["anon", "authenticated"]) {
    for (const table of ["published_works", "published_work_entries"])
      for (const privilege of ["INSERT", "UPDATE", "DELETE"])
        assert.equal(
          (
            await db.query("SELECT has_table_privilege($1,$2,$3) ok", [
              r,
              "public." + table,
              privilege,
            ])
          ).rows[0].ok,
          false,
        );
    assert.equal(
      (
        await db.query(
          "SELECT has_column_privilege($1,'public.published_works','work_id','SELECT') ok",
          [r],
        )
      ).rows[0].ok,
      false,
    );
  }
  await db.exec("RESET ROLE");
  assert.equal(
    (
      await db.query(
        `SELECT count(*)::int n FROM pg_proc p CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a WHERE p.pronamespace='public'::regnamespace AND p.proname IN('publish_private_work','read_public_work','guard_private_work_update') AND a.grantee=0`,
      )
    ).rows[0].n,
    0,
  );
  await role(b);
  assert.equal(await read(w.id), null);
  await assert.rejects(pub(w), (e) => e.code === "42501");
  await role(null);
  assert.equal(await publicRead(publicId), null);
  await denied("SELECT * FROM public.works", [], "42501");
  await denied("SELECT * FROM public.work_entries", [], "42501");
  await denied("SELECT * FROM public.work_operation_receipts", [], "42501");
  await assert.rejects(pub(w), (e) => e.code === "42501");
  await role(a);
  let empty = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language)VALUES('Vazia','vazia','Sinopse','Romance','pt')RETURNING *",
    )
  ).rows[0];
  await assert.rejects(pub(empty), (e) => e.code === "23514");
  assert.equal((await read(empty.id)).revision, 1);
  empty = await mutate(empty, "add_entry");
  await assert.rejects(pub(empty), (e) => e.code === "23514");
  // A failure after changing state rolls back the entire RPC (including receipts).
  await db.exec(
    "RESET ROLE; CREATE FUNCTION public.fail_snapshot_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected snapshot failure'; END $$; CREATE TRIGGER fail_snapshot_test BEFORE INSERT ON public.published_work_entries FOR EACH ROW EXECUTE FUNCTION public.fail_snapshot_test();",
  );
  await role(a);
  await assert.rejects(pub(w), /injected snapshot failure/);
  assert.equal((await read(w.id)).status, "draft");
  assert.equal((await read(w.id)).revision, w.revision);
  await db.exec(
    "RESET ROLE; DROP TRIGGER fail_snapshot_test ON public.published_work_entries; DROP FUNCTION public.fail_snapshot_test();",
  );
  await role(a);
  // Publication commits exactly one parent revision and is retry-safe.
  const before = w,
    op = randomUUID();
  w = (await pub(w, "publish", op)).work;
  assert.equal(w.revision, before.revision + 1);
  assert.equal(w.published_revision, w.revision);
  assert.equal(w.status, "published");
  assert.equal((await pub(before, "publish", op)).already_applied, true);
  await assert.rejects(pub(before), (e) => e.code === "40001");
  await assert.rejects(pub(before, "withdraw", op), (e) => e.code === "22023");
  const ownerView = await read(w.id);
  for (const column of [
    "public_id",
    "first_published_at",
    "last_published_at",
    "withdrawn_at",
    "published_revision",
  ])
    assert.deepEqual(ownerView[column], w[column], column);
  // A role without a user claim must fail even if it can execute the RPC.
  await db.query("SELECT set_config('request.jwt.claim.sub','',false)");
  await assert.rejects(pub(w), (e) => e.code === "42501");
  await role(a);
  await assert.rejects(mutate(w, "archive"), (e) => e.code === "55000");
  await role(null);
  let edition = await publicRead(publicId);
  assert.equal(edition.entries[0].content, "Texto confirmado");
  for (const key of [
    "owner_id",
    "work_id",
    "revision",
    "archived_at",
    "operation_id",
  ])
    assert.equal(key in edition, false);
  assert.notEqual(edition.entries[0].id, w.entries[0].id);
  await denied("SELECT work_id FROM public.published_works", [], "42501");
  assert.equal(
    (await db.query("SELECT id FROM public.published_works")).rows.length,
    1,
  );
  await role(b);
  assert.equal(
    (await db.query("SELECT * FROM public.work_entries")).rows.length,
    0,
  );
  await assert.rejects(pub(w, "withdraw"), (e) => e.code === "42501");
  assert.equal((await publicRead(publicId)).title, w.title);
  await role(a);
  const copy = await mutate(w, "duplicate_work");
  assert.equal(copy.status, "draft");
  assert.equal(copy.visibility, "private");
  assert.equal(copy.first_published_at, null);
  assert.notEqual(copy.public_id, publicId);
  assert.equal(copy.entries[0].content, w.entries[0].content);
  assert.notEqual(copy.entries[0].public_id, w.entries[0].public_id);
  w = (
    await db.query(
      "UPDATE public.works SET description='Nova sinopse privada' WHERE id=$1 RETURNING *",
      [w.id],
    )
  ).rows[0];
  w = await read(w.id);
  // Changes to the private edition never leak before another explicit publication.
  w = await mutate(w, "save_entry", {
    entry_id: w.entries[0].id,
    entry_revision: w.entries[0].revision,
    title: "Primeiro",
    content: "Texto ainda privado",
    alignment: "left",
  });
  await role(null);
  assert.equal(
    (await publicRead(publicId)).entries[0].content,
    "Texto confirmado",
  );
  assert.deepEqual(
    await publicRead(publicId),
    edition,
    "Private metadata/content changed the public snapshot",
  );
  await role(a);
  w = (await pub(w)).work;
  assert.equal(
    w.first_published_at,
    before.first_published_at ?? edition.first_published_at,
  );
  await role(null);
  assert.equal(
    (await publicRead(publicId)).entries[0].content,
    "Texto ainda privado",
  );
  assert.equal(
    (await publicRead(publicId)).entries[0].id,
    edition.entries[0].id,
  );
  await role(a);
  const first = w.first_published_at;
  w = (await pub(w, "withdraw")).work;
  assert.equal(w.status, "draft");
  assert.ok(w.withdrawn_at);
  assert.equal(w.archived_at, null);
  await role(null);
  assert.equal(await publicRead(publicId), null);
  assert.equal(
    (await db.query("SELECT * FROM public.published_work_entries")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("SELECT id FROM public.published_works")).rows.length,
    0,
  );
  await role(a);
  w = await mutate(w, "archive");
  await assert.rejects(pub(w), (e) => e.code === "55000");
  w = await mutate(w, "restore");
  w = (await pub(w)).work;
  assert.equal(w.first_published_at, first);
  assert.equal(w.public_id, publicId);
  assert.equal(w.withdrawn_at, null);
  // Poems keep stanzas; blank entries excluded. Public profile fields only.
  await db.exec(
    "RESET ROLE; CREATE TABLE public.profiles(id uuid PRIMARY KEY,display_name text,username text,email text);",
  );
  await db.query("INSERT INTO public.profiles VALUES($1,$2,$3,$4)", [
    a,
    "Autora",
    "autora",
    "private@example.invalid",
  ]);
  await role(a);
  let poem = (
    await db.query(
      "INSERT INTO public.works(title,slug,type,description,language)VALUES('Versos','versos','Poesia','Sinopse de versos','pt')RETURNING *",
    )
  ).rows[0];
  poem = await mutate(poem, "add_entry");
  poem = await mutate(poem, "save_entry", {
    entry_id: poem.entries[0].id,
    entry_revision: poem.entries[0].revision,
    title: "Verso",
    content: "Um verso\n\nOutra estrofe",
    alignment: "center",
  });
  poem = await mutate(poem, "add_entry");
  poem = (await pub(poem)).work;
  await role(null);
  const verses = await publicRead(poem.public_id);
  assert.equal(verses.entries.length, 1);
  assert.equal(verses.entries[0].entry_type, "poem");
  assert.equal(verses.author_name, "Autora");
  assert.equal(verses.author_username, "autora");
  assert.equal(JSON.stringify(verses).includes("private@example"), false);
  await role(a);
  await mutate(w, "delete_work");
  await role(null);
  assert.equal(await publicRead(publicId), null);
  console.log(
    "PASS F3.1 local PostgreSQL: additive compatibility, ACL/RLS, ownership, protected state, validation, snapshot isolation, publish/withdraw/republish, stable IDs, revision conflicts/retries, duplication/archive/restore/delete, poems and public author allowlist.",
  );
} finally {
  await db.close();
}
