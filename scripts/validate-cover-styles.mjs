// Disposable local PostgreSQL only; simulated users and claims, no Supabase calls.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
if (!process.env.PGLITE_PATH) throw Error("Define PGLITE_PATH");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite();
const studioV2 = process.env.AG_SQL_COVER_STUDIO_V2 === "1";
const a = randomUUID(),
  b = randomUUID();
const role = async (id) => {
  await db.exec("RESET ROLE;SET ROLE " + (id ? "authenticated" : "anon"));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
};
const read = async (id) =>
  (await db.query("SELECT public.read_private_work($1) w", [id])).rows[0].w;
const pub = async (w, action = "publish", op = randomUUID()) =>
  (
    await db.query("SELECT public.publish_private_work($1,$2,$3,$4) r", [
      w.id,
      w.revision,
      action,
      op,
    ])
  ).rows[0].r;
const mutate = async (w, action, payload = {}, op = randomUUID()) =>
  (
    await db.query("SELECT public.mutate_private_work($1,$2,$3,$4,$5) r", [
      w.id,
      w.revision,
      action,
      payload,
      op,
    ])
  ).rows[0].r;
const publicRead = async (id) =>
  (await db.query("SELECT public.read_public_work($1) w", [id])).rows[0].w;
try {
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid()RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;`,
  );
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [a, b]);
  for (const file of [
    "20261111000000_create_private_works.sql",
    "20261111010000_private_editorial_entries.sql",
    "20261111020000_publication_catalog.sql",
    "20261111030000_public_discovery.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,description,type,language)VALUES('Legada','legada','Sinopse válida','Romance','pt')RETURNING *",
    )
  ).rows[0];
  w = (await mutate(w, "add_entry")).work;
  w = (
    await mutate(w, "save_entry", {
      entry_id: w.entries[0].id,
      entry_revision: 1,
      title: "Capítulo",
      content: "Texto",
      alignment: "left",
    })
  ).work;
  w = (
    await mutate(w, "duplicate_entry", {
      entry_id: w.entries[0].id,
      entry_revision: w.entries[0].revision,
    })
  ).work;
  const beforePublication = w,
    legacyOperation = randomUUID();
  w = (await pub(w, "publish", legacyOperation)).work;
  const before = structuredClone(w);
  await role(null);
  const beforePublic = await publicRead(w.public_id);
  await db.exec("RESET ROLE");
  await db.exec(
    await readFile(
      "supabase/migrations/20261111040000_persist_cover_styles.sql",
      "utf8",
    ),
  );
  const priorPolicies = (
    await db.query(
      "SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname",
    )
  ).rows;
  const priorRls = (
    await db.query(
      "SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid IN ('public.works'::regclass,'public.published_works'::regclass) ORDER BY relname",
    )
  ).rows;
  if (studioV2)
    await db.exec(
      await readFile(
        "supabase/migrations/20261111050000_cover_studio_v2.sql",
        "utf8",
      ),
    );
  await role(a);
  w = await read(w.id);
  const { cover_style, cover_seed, ...oldWork } = w;
  if (studioV2) assert.equal(cover_seed, 0);
  if (studioV2) {
    assert.deepEqual(
      (
        await db.query(
          "SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname",
        )
      ).rows,
      priorPolicies,
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid IN ('public.works'::regclass,'public.published_works'::regclass) ORDER BY relname",
        )
      ).rows,
      priorRls,
    );
    const names = (
      await db.query(
        "SELECT conname FROM pg_constraint WHERE conrelid IN ('public.works'::regclass,'public.published_works'::regclass) AND conname LIKE '%cover_%' ORDER BY conname",
      )
    ).rows.map((r) => r.conname);
    assert.deepEqual(names, [
      "published_works_cover_seed_check",
      "published_works_cover_style_check",
      "works_cover_accent_color_check",
      "works_cover_seed_check",
      "works_cover_style_check",
    ]);
  }
  assert.equal(cover_style, "legacy");
  assert.deepEqual(oldWork, before);
  assert.equal(
    (await pub(beforePublication, "publish", legacyOperation)).already_applied,
    true,
  );
  await role(null);
  const {
    cover_style: publicStyle,
    cover_seed: publicSeed,
    ...oldPublic
  } = await publicRead(w.public_id);
  assert.equal(publicStyle, "legacy");
  assert.deepEqual(oldPublic, beforePublic);
  for (const name of ["anon", "authenticated"]) {
    const p = (
      await db.query(
        "SELECT has_column_privilege($1,'public.works','cover_style','SELECT') s,has_column_privilege($1,'public.works','cover_style','INSERT') i,has_column_privilege($1,'public.works','cover_style','UPDATE') u,has_column_privilege($1,'public.published_works','cover_style','SELECT') ps,has_column_privilege($1,'public.published_works','cover_style','UPDATE') pu,has_column_privilege($1,'public.published_works','work_id','SELECT') hidden",
        [name],
      )
    ).rows[0];
    assert.deepEqual(p, {
      s: name === "authenticated",
      i: name === "authenticated",
      u: name === "authenticated",
      ps: true,
      pu: false,
      hidden: false,
    });
  }
  await assert.rejects(read(w.id), (e) => e.code === "42501");
  await assert.rejects(
    db.query("UPDATE public.published_works SET cover_style='bold'"),
    (e) => e.code === "42501",
  );
  await role(b);
  assert.equal(await read(w.id), null);
  assert.equal(
    (
      await db.query(
        "UPDATE public.works SET cover_style='bold' WHERE id=$1 RETURNING id",
        [w.id],
      )
    ).rows.length,
    0,
  );
  await assert.rejects(pub(w), (e) => e.code === "42501");
  await role(a);
  const revision = w.revision;
  await assert.rejects(
    db.query("UPDATE public.works SET cover_style='invalid' WHERE id=$1", [
      w.id,
    ]),
    (e) => e.code === "23514",
  );
  assert.equal((await read(w.id)).revision, revision);
  w = (
    await db.query(
      "UPDATE public.works SET cover_style='minimalist' WHERE id=$1 AND revision=$2 RETURNING *",
      [w.id, w.revision],
    )
  ).rows[0];
  w = await read(w.id);
  assert.equal(w.revision, revision + 1);
  assert.equal(
    (
      await db.query(
        "UPDATE public.works SET cover_style='bold' WHERE id=$1 AND revision=$2 RETURNING id",
        [w.id, revision],
      )
    ).rows.length,
    0,
  );
  await role(null);
  assert.equal((await publicRead(w.public_id)).cover_style, "legacy");
  assert.deepEqual(
    (await publicRead(w.public_id)).entries,
    beforePublic.entries,
  );
  await role(a);
  const publishKey = randomUUID(),
    source = w;
  w = (await pub(w, "publish", publishKey)).work;
  assert.equal(
    (await pub(source, "publish", publishKey)).already_applied,
    true,
  );
  await assert.rejects(pub(source), (e) => e.code === "40001");
  await role(null);
  assert.equal((await publicRead(w.public_id)).cover_style, "minimalist");
  let results = (
    await db.query("SELECT public.search_public_works($1) r", [{}])
  ).rows[0].r;
  assert.equal(results.items[0].cover_style, "minimalist");
  await role(a);
  w = (
    await db.query(
      "UPDATE public.works SET cover_style='bold' WHERE id=$1 RETURNING *",
      [w.id],
    )
  ).rows[0];
  w = await read(w.id);
  const copyOp = randomUUID();
  const copy = (await mutate(w, "duplicate_work", {}, copyOp)).work;
  assert.equal(copy.cover_style, "bold");
  assert.equal(copy.status, "draft");
  assert.equal(copy.entries.length, 2);
  assert.equal(
    (await mutate(w, "duplicate_work", {}, copyOp)).work.id,
    copy.id,
  );
  await role(null);
  assert.equal((await publicRead(w.public_id)).cover_style, "minimalist");
  await role(a);
  const first = w.first_published_at;
  w = (await pub(w, "withdraw")).work;
  assert.equal(w.cover_style, "bold");
  await role(null);
  assert.equal(await publicRead(w.public_id), null);
  assert.equal(
    (await db.query("SELECT public.search_public_works($1) r", [{}])).rows[0].r
      .total,
    0,
  );
  await role(a);
  w = (await pub(w)).work;
  assert.equal(w.first_published_at, first);
  assert.equal(w.cover_style, "bold");
  await role(null);
  assert.equal((await publicRead(w.public_id)).cover_style, "bold");
  await role(a);
  w = (await pub(w, "withdraw")).work;
  w = (await mutate(w, "archive")).work;
  w = (await mutate(w, "restore")).work;
  assert.equal(w.cover_style, "bold");
  for (const style of [
    "legacy",
    "minimalist",
    "geometric",
    "lyric",
    "bold",
    "monolith",
  ]) {
    const row = (
      await db.query(
        "INSERT INTO public.works(title,slug,type,language,cover_style)VALUES('Nova',$1,'Poesia','pt',$2)RETURNING *",
        ["style-" + style, style],
      )
    ).rows[0];
    assert.equal((await read(row.id)).cover_style, style);
  }
  await assert.rejects(
    db.query(
      "INSERT INTO public.works(title,slug,type,language,cover_style)VALUES('Bad','bad','Conto','pt','oops')",
    ),
    (e) => e.code === "23514",
  );
  await db.exec("RESET ROLE");
  await assert.rejects(
    db.query("UPDATE public.published_works SET cover_style='oops'"),
    (e) => e.code === "23514",
  );
  if (studioV2) {
    const registry = await readFile("src/foundation/data/covers.ts", "utf8");
    const styles = [
      "legacy",
      ...registry
        .match(/export const COVER_STYLES = ([\s\S]*?) as const;/)[1]
        .matchAll(/"([a-z_]+)"/g),
    ].map((v) => (typeof v === "string" ? v : v[1]));
    for (const style of styles) {
      await role(a);
      const result = await db.query(
        "INSERT INTO public.works(title,slug,type,language,cover_style,cover_seed)VALUES('V2',$1,'Romance','pt',$2,4)RETURNING *",
        ["v2-" + style.replaceAll("_", "-"), style],
      );
      assert.equal((await read(result.rows[0].id)).cover_seed, 4);
    }
    for (const id of [null, a]) {
      await role(id);
      const acl = (
        await db.query(
          "SELECT has_column_privilege(current_user,'public.works','cover_seed','SELECT') ps,has_column_privilege(current_user,'public.works','cover_seed','UPDATE') pu,has_column_privilege(current_user,'public.published_works','cover_seed','SELECT') ss,has_column_privilege(current_user,'public.published_works','cover_seed','UPDATE') su",
        )
      ).rows[0];
      assert.equal(acl.ps, !!id);
      assert.equal(acl.pu, !!id);
      assert.equal(acl.ss, true);
      assert.equal(acl.su, false);
    }
    await role(a);
    w = await read(w.id);
    for (const invalid of [-1, 2147483648, 1.5])
      await assert.rejects(
        db.query("UPDATE public.works SET cover_seed=$1 WHERE id=$2", [
          invalid,
          w.id,
        ]),
      );
    w = (
      await db.query(
        "UPDATE public.works SET cover_style='arcane',cover_seed=4 WHERE id=$1 AND revision=$2 RETURNING *",
        [w.id, w.revision],
      )
    ).rows[0];
    w = await read(w.id);
    const source = w,
      operation = randomUUID();
    w = (await pub(w, "publish", operation)).work;
    assert.equal(
      (await pub(source, "publish", operation)).already_applied,
      true,
    );
    await role(null);
    const snapshot = await publicRead(w.public_id);
    assert.equal(snapshot.cover_style, "arcane");
    assert.equal(snapshot.cover_seed, 4);
    const search = (
      await db.query("SELECT public.search_public_works($1) r", [
        { query: w.title },
      ])
    ).rows[0].r;
    assert.equal(
      search.items.find((item) => item.id === w.public_id).cover_seed,
      4,
    );
    await role(b);
    await assert.rejects(pub(w, "withdraw"));
    assert.equal(await read(w.id), null);
    await role(a);
    const previousRevision = w.revision;
    w = (
      await db.query(
        "UPDATE public.works SET cover_style='holographic',cover_seed=9 WHERE id=$1 AND revision=$2 RETURNING *",
        [w.id, w.revision],
      )
    ).rows[0];
    assert.equal(w.revision, previousRevision + 1);
    w = await read(w.id);
    await assert.rejects(pub({ ...w, revision: previousRevision }, "publish"));
    await role(null);
    assert.deepEqual(await publicRead(w.public_id), snapshot);
    await role(a);
    const copy = (await mutate(w, "duplicate_work")).work;
    assert.equal(copy.cover_style, "holographic");
    assert.equal(copy.cover_seed, 9);
    assert.equal(copy.entries.length, 2);
    w = (await pub(w, "publish")).work;
    await role(null);
    assert.equal((await publicRead(w.public_id)).cover_seed, 9);
    await role(a);
    w = (await pub(w, "withdraw")).work;
    await role(null);
    assert.equal(await publicRead(w.public_id), null);
    await role(a);
    w = (await pub(w, "publish")).work;
    await role(null);
    assert.equal((await publicRead(w.public_id)).cover_seed, 9);
    await db.exec("RESET ROLE");
    console.log(
      "PASS Cover Studio V2 SQL: 33 styles; defaults/data/revisions; seed constraints; ACL/RLS; owner and revision checks; explicit snapshot copies; idempotence; duplicate; withdraw/republication.",
    );
  }
  if (studioV2) {
    for (const roleName of ["anon", "authenticated"]) {
      const privileges = (
        await db.query(
          "SELECT has_function_privilege($1,'public.mutate_private_work(uuid,integer,text,jsonb,uuid)','EXECUTE') mutate,has_function_privilege($1,'public.publish_private_work(uuid,integer,text,uuid)','EXECUTE') publish,has_function_privilege($1,'public.read_public_work(uuid)','EXECUTE') read,has_function_privilege($1,'public.search_public_works(jsonb)','EXECUTE') search",
          [roleName],
        )
      ).rows[0];
      assert.deepEqual(privileges, {
        mutate: roleName === "authenticated",
        publish: roleName === "authenticated",
        read: true,
        search: true,
      });
    }
    const publicExec = (
      await db.query(
        "SELECT count(*)::int n FROM pg_proc p CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a WHERE p.oid IN ('public.mutate_private_work(uuid,integer,text,jsonb,uuid)'::regprocedure,'public.publish_private_work(uuid,integer,text,uuid)'::regprocedure,'public.read_public_work(uuid)'::regprocedure,'public.search_public_works(jsonb)'::regprocedure) AND a.grantee=0 AND a.privilege_type='EXECUTE'",
      )
    ).rows[0].n;
    assert.equal(publicExec, 0);
    console.log(
      "PASS final review: exact policy/RLS preservation; four named constraints; effective RPC privileges; no PUBLIC EXECUTE.",
    );
  }
  const funcs = (
    await db.query(
      "SELECT proname,prosecdef,proconfig FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN('read_private_work','read_public_work','mutate_private_work','publish_private_work','search_public_works')",
    )
  ).rows;
  for (const f of funcs) {
    assert.equal(
      f.prosecdef,
      ["mutate_private_work", "publish_private_work"].includes(f.proname),
    );
    assert.ok(f.proconfig.includes('search_path=""'));
  }
  console.log(
    "PASS cover styles SQL: existing rows/snapshots/revisions preserved; six values; invalid values denied; effective ACL/RLS; private update isolation; explicit publication/update/withdraw/republication; idempotence/conflicts; duplicate/archive/restore with chapters; public detail/search transport.",
  );
} finally {
  await db.close();
}
