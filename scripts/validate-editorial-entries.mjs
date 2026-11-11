// Disposable local PostgreSQL only. Auth claims are simulated; no remote access.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
if (!process.env.PGLITE_PATH)
  throw new Error("Define PGLITE_PATH para PGlite local.");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
let db;
const a = "10000000-0000-0000-0000-000000000001",
  b = "10000000-0000-0000-0000-000000000002";
const mutate = async (work, action, payload = {}, key = randomUUID()) =>
  (
    await db.query(
      "SELECT public.mutate_private_work($1,$2,$3,$4,$5) AS result",
      [work.id, work.revision, action, payload, key],
    )
  ).rows[0].result;
const read = async (id) =>
  (await db.query("SELECT public.read_private_work($1) AS work", [id])).rows[0]
    .work;
const role = async (id) => {
  await db.exec("RESET ROLE; SET ROLE authenticated;");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
};
for (const scenario of [
  "existing-trigger",
  "missing-trigger",
  "disabled-trigger",
]) {
  db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb,created_at timestamptz DEFAULT now());
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;
 INSERT INTO auth.users(id)VALUES('${a}'),('${b}');`);
    await db.exec(
      await readFile(
        "supabase/migrations/20261111000000_create_private_works.sql",
        "utf8",
      ),
    );
    await role(a);
    const legacy = (
      await db.query(
        "INSERT INTO public.works(title,slug,type,language,description,subtitle,genre,tags,age_rating,content_warnings,cover_accent_color)VALUES('Obra F2.1','legada','Romance','pt','Sinopse original','Subtítulo original','Aventura',ARRAY['original'],'+14',ARRAY['Tema sensível'],'#123456') RETURNING *",
      )
    ).rows[0];
    const legacySnapshot = (
      await db.query(
        "SELECT to_jsonb(w) AS snapshot FROM public.works w WHERE id=$1",
        [legacy.id],
      )
    ).rows[0].snapshot;
    await db.exec("RESET ROLE;");
    if (scenario === "missing-trigger")
      await db.exec("DROP TRIGGER guard_private_work_update ON public.works");
    if (scenario === "disabled-trigger")
      await db.exec(
        "ALTER TABLE public.works DISABLE TRIGGER guard_private_work_update",
      );
    await db.exec(
      await readFile(
        "supabase/migrations/20261111010000_private_editorial_entries.sql",
        "utf8",
      ),
    );
    if (process.env.AG_SQL_PUBLICATION === "1")
      await db.exec(
        await readFile(
          "supabase/migrations/20261111020000_publication_catalog.sql",
          "utf8",
        ),
      );
    const triggers = (
      await db.query(`SELECT tgname,tgenabled,tgfoid::regprocedure::text AS function_name,
    pg_get_triggerdef(oid) AS definition FROM pg_trigger
    WHERE tgrelid='public.works'::regclass AND NOT tgisinternal`)
    ).rows;
    assert.equal(triggers.length, 1);
    assert.equal(triggers[0].tgname, "guard_private_work_update");
    assert.equal(triggers[0].tgenabled, "O");
    assert.match(triggers[0].function_name, /guard_private_work_update/);
    assert.match(triggers[0].definition, /BEFORE UPDATE/);
    for (const roleName of ["anon", "authenticated"]) {
      const allowed = roleName === "authenticated";
      const privileges = (
        await db.query(
          `SELECT
      has_table_privilege($1,'public.works','SELECT') AS work_select,
      has_column_privilege($1,'public.works','title','UPDATE') AS metadata_update,
      has_column_privilege($1,'public.works','owner_id','UPDATE') AS owner_update,
      has_column_privilege($1,'public.works','archived_at','UPDATE') AS archive_update,
      has_table_privilege($1,'public.work_entries','SELECT') AS entry_select,
      has_table_privilege($1,'public.work_entries','INSERT') AS entry_insert,
      has_table_privilege($1,'public.work_entries','UPDATE') AS entry_update,
      has_table_privilege($1,'public.work_entries','DELETE') AS entry_delete,
      has_table_privilege($1,'public.work_operation_receipts','SELECT') AS receipt_select,
      has_table_privilege($1,'public.work_operation_receipts','INSERT') AS receipt_insert,
      has_table_privilege($1,'public.work_operation_receipts','UPDATE') AS receipt_update,
      has_table_privilege($1,'public.work_operation_receipts','DELETE') AS receipt_delete,
      has_function_privilege($1,'public.guard_private_work_update()','EXECUTE') AS guard_execute,
      has_function_privilege($1,'public.read_private_work(uuid)','EXECUTE') AS read_execute,
      has_function_privilege($1,'public.mutate_private_work(uuid,integer,text,jsonb,uuid)','EXECUTE') AS mutate_execute`,
          [roleName],
        )
      ).rows[0];
      assert.deepEqual(privileges, {
        work_select: allowed,
        metadata_update: allowed,
        owner_update: false,
        archive_update: false,
        entry_select: allowed,
        entry_insert: false,
        entry_update: false,
        entry_delete: false,
        receipt_select: false,
        receipt_insert: false,
        receipt_update: false,
        receipt_delete: false,
        guard_execute: false,
        read_execute: allowed,
        mutate_execute: allowed,
      });
    }
    // PUBLIC is an ACL pseudo-role, so inspect expanded ACLs instead of treating it as pg_roles.
    assert.equal(
      (
        await db.query(`SELECT count(*)::int AS n FROM pg_class c
    CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
    WHERE c.oid IN ('public.works'::regclass,'public.work_entries'::regclass,'public.work_operation_receipts'::regclass)
    AND a.grantee=0`)
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(`SELECT count(*)::int AS n FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
    WHERE p.oid IN ('public.guard_private_work_update()'::regprocedure,'public.read_private_work(uuid)'::regprocedure,
      'public.mutate_private_work(uuid,integer,text,jsonb,uuid)'::regprocedure) AND a.grantee=0`)
      ).rows[0].n,
      0,
    );
    await role(a);
    let work = await read(legacy.id);
    for (const [field, value] of Object.entries(legacySnapshot))
      assert.deepEqual(work[field], value, `Existing field changed: ${field}`);
    const metadataRevision = work.revision;
    const metadata = (
      await db.query(
        "UPDATE public.works SET description='Sinopse revista' WHERE id=$1 AND revision=$2 RETURNING *",
        [work.id, metadataRevision],
      )
    ).rows[0];
    assert.equal(metadata.revision, metadataRevision + 1);
    work = await read(work.id);
    assert.equal(work.title, legacy.title);
    assert.equal(work.owner_id, a);
    assert.equal(work.archived_at, null);
    assert.deepEqual(work.entries, []);
    const addKey = randomUUID();
    const first = await mutate(work, "add_entry", {}, addKey);
    const repeat = await mutate(work, "add_entry", {}, addKey);
    assert.deepEqual(repeat.work.entries, first.work.entries);
    await assert.rejects(
      mutate(work, "add_entry", { title: "Different" }, addKey),
      { code: "22023" },
    );
    work = first.work;
    const e = work.entries[0];
    assert.equal(e.entry_type, "chapter");
    assert.equal(e.status, "draft");
    const savePayload = {
      entry_id: e.id,
      entry_revision: e.revision,
      title: "Capítulo real",
      content: "Texto persistente\ncom palavras reais.",
      alignment: "left",
    };
    const before = work;
    work = (await mutate(work, "save_entry", savePayload)).work;
    assert.equal(work.entries[0].content, savePayload.content);
    assert.equal(work.entries[0].revision, 2);
    assert.equal(work.revision, before.revision + 1);
    await assert.rejects(mutate(before, "save_entry", savePayload), {
      code: "40001",
    });
    const saved = work.entries[0];
    work = (
      await mutate(work, "duplicate_entry", {
        entry_id: saved.id,
        entry_revision: saved.revision,
      })
    ).work;
    assert.equal(work.entries.length, 2);
    assert.notEqual(work.entries[0].id, work.entries[1].id);
    assert.equal(work.entries[1].content, saved.content);
    const ids = work.entries.map((item) => item.id).reverse();
    work = (await mutate(work, "reorder_entries", { ids })).work;
    assert.deepEqual(
      work.entries.map((item) => item.id),
      ids,
    );
    assert.deepEqual(
      work.entries.map((item) => item.position),
      [1, 2],
    );
    await assert.rejects(
      mutate(work, "reorder_entries", { ids: [ids[0], ids[0]] }),
      { code: "22023" },
    );
    assert.deepEqual((await read(work.id)).entries, work.entries);
    const copyKey = randomUUID();
    const copySource = work;
    const copied = (await mutate(work, "duplicate_work", {}, copyKey)).work;
    assert.notEqual(copied.id, work.id);
    assert.equal(copied.title, work.title + " (Cópia)");
    assert.equal(copied.status, "draft");
    assert.equal(copied.visibility, "private");
    assert.equal(copied.archived_at, null);
    for (const field of [
      "description",
      "subtitle",
      "type",
      "language",
      "genre",
      "tags",
      "age_rating",
      "content_warnings",
      "cover_accent_color",
    ])
      assert.deepEqual(
        copied[field],
        work[field],
        `Copy changed metadata: ${field}`,
      );
    assert.deepEqual(
      copied.entries.map((item) => item.content),
      work.entries.map((item) => item.content),
    );
    assert.ok(
      copied.entries.every(
        (item) => !work.entries.some((old) => old.id === item.id),
      ),
    );
    assert.equal(
      (await mutate(copySource, "duplicate_work", {}, copyKey)).work.id,
      copied.id,
    );
    await assert.rejects(
      mutate(work, "save_entry", {
        entry_id: copied.entries[0].id,
        entry_revision: 1,
        title: "Forged",
        content: "Forged",
      }),
      { code: "42501" },
    );
    const preArchive = work;
    const archiveKey = randomUUID();
    work = (await mutate(work, "archive", {}, archiveKey)).work;
    assert.equal(work.revision, preArchive.revision + 1);
    assert.equal(
      (await mutate(preArchive, "archive", {}, archiveKey)).work.revision,
      work.revision,
    );
    assert.ok(work.archived_at);
    assert.equal(work.status, "draft");
    assert.equal((await read(work.id)).entries.length, 2);
    await assert.rejects(mutate(work, "add_entry"), { code: "55000" });
    await assert.rejects(
      db.query("UPDATE public.works SET title='Blocked' WHERE id=$1", [
        work.id,
      ]),
      { code: "55000" },
    );
    const preRestore = work.revision;
    work = (await mutate(work, "restore")).work;
    assert.equal(work.revision, preRestore + 1);
    assert.equal(work.archived_at, null);
    const count = (
      await db.query("SELECT count(*)::int AS n FROM public.works")
    ).rows[0].n;
    // Force invalid content after revision/ownership checks: no partial mutation or receipt.
    await assert.rejects(
      mutate(work, "save_entry", {
        entry_id: work.entries[0].id,
        entry_revision: work.entries[0].revision,
        title: " ",
        content: "invalid",
      }),
      { code: "23514" },
    );
    assert.equal((await read(work.id)).revision, work.revision);
    await assert.rejects(
      db.query("UPDATE public.works SET type='Poesia' WHERE id=$1", [work.id]),
      { code: "23514" },
    );
    await assert.rejects(
      db.query("UPDATE public.works SET owner_id=$1 WHERE id=$2", [b, work.id]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query(
        "INSERT INTO public.work_entries(work_id,title,entry_type,position)VALUES($1,'Direct','chapter',99)",
        [work.id],
      ),
      { code: "42501" },
    );
    await assert.rejects(
      db.exec("SELECT * FROM public.work_operation_receipts"),
      { code: "42501" },
    );
    await role(b);
    assert.equal(await read(work.id), null);
    assert.equal(
      (await db.query("SELECT * FROM public.work_entries")).rows.length,
      0,
    );
    for (const action of [
      "duplicate_work",
      "delete_work",
      "archive",
      "add_entry",
      "save_entry",
      "reorder_entries",
    ])
      await assert.rejects(mutate(work, action, savePayload), {
        code: "42501",
      });
    await db.exec("RESET ROLE; SET ROLE anon;");
    await assert.rejects(read(work.id), { code: "42501" });
    await assert.rejects(mutate(work, "duplicate_work"), { code: "42501" });
    await role("");
    await assert.rejects(mutate(work, "duplicate_work"), { code: "42501" });
    await role(a);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM public.works")).rows[0].n,
      count,
    );
    const selected = work.entries[0];
    work = (
      await mutate(work, "delete_entry", {
        entry_id: selected.id,
        entry_revision: selected.revision,
      })
    ).work;
    assert.equal(work.entries.length, 1);
    assert.equal(work.entries[0].position, 1);
    const competition = await Promise.allSettled([
      mutate(work, "add_entry"),
      mutate(work, "archive"),
    ]);
    assert.equal(
      competition.filter((item) => item.status === "fulfilled").length,
      1,
    );
    assert.equal(
      competition.filter(
        (item) => item.status === "rejected" && item.reason.code === "40001",
      ).length,
      1,
    );
    work = await read(work.id);
    const deleteKey = randomUUID();
    assert.equal(
      (await mutate(work, "delete_work", {}, deleteKey)).deleted_id,
      work.id,
    );
    assert.equal(
      (await mutate(work, "delete_work", {}, deleteKey)).deleted_id,
      work.id,
    );
    assert.equal(await read(work.id), null);
    assert.equal(
      (
        await db.query("SELECT * FROM public.work_entries WHERE work_id=$1", [
          work.id,
        ])
      ).rows.length,
      0,
    );
    // Poetry, HQ and manga retain their actual entry kind, without fake image pages.
    for (const [format, kind] of [
      ["Poesia", "poem"],
      ["HQ / Comic", "visual"],
      ["Mangá", "visual"],
    ]) {
      const empty = (
        await db.query(
          "INSERT INTO public.works(title,slug,type,language)VALUES($1,$2,$3,'pt')RETURNING *",
          [format, randomUUID(), format],
        )
      ).rows[0];
      let book = (await mutate(empty, "add_entry")).work;
      assert.equal(book.entries[0].entry_type, kind);
      const item = book.entries[0];
      book = (
        await mutate(book, "save_entry", {
          entry_id: item.id,
          entry_revision: item.revision,
          title: format,
          content: "Linha 1\nLinha 2\n\nEstrofe 2",
          alignment: "center",
        })
      ).work;
      assert.equal(
        (await read(book.id)).entries[0].content,
        book.entries[0].content,
      );
    }
    console.log(
      `PASS ${scenario}: one enabled trigger; exactly one revision increment; effective ACLs; F2.1 compatibility; entry CRUD/types/order; duplicate/cascade/archive/restore; atomic rollback; stale revisions; A/B/anon; hostile grants; idempotent retries; private drafts preserved`,
    );
  } finally {
    await db.close();
  }
}
