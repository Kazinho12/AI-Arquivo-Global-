// Disposable local PostgreSQL; no remote project or credentials.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.env.PGLITE_PATH)
  throw new Error("Define PGLITE_PATH para PGlite local.");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const sql = await readFile(
  "supabase/migrations/20261111000000_create_private_works.sql",
  "utf8",
);
const a = "10000000-0000-0000-0000-000000000001";
const b = "10000000-0000-0000-0000-000000000002";
for (const scenario of ["without-profiles", "with-profiles"]) {
  const db = new PGlite();
  const scalar = async (query, params = []) =>
    Object.values((await db.query(query, params)).rows[0])[0];
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb,created_at timestamptz DEFAULT now());
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;
      INSERT INTO auth.users(id,email) VALUES('${a}','a@test.local'),('${b}','b@test.local');`);
    if (scenario === "with-profiles") {
      for (const name of [
        "20261109000000_create_profiles_table.sql",
        "20261110000000_harden_profile_provisioning.sql",
        "20261110010000_canonical_usernames.sql",
      ])
        await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
    }
    const authBefore = (await db.query("SELECT * FROM auth.users ORDER BY id"))
      .rows;
    const triggersBefore = (
      await db.query(
        "SELECT pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal ORDER BY tgname",
      )
    ).rows;
    await db.exec(sql);
    assert.deepEqual(
      (await db.query("SELECT * FROM auth.users ORDER BY id")).rows,
      authBefore,
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal ORDER BY tgname",
        )
      ).rows,
      triggersBefore,
    );
    if (scenario === "with-profiles")
      assert.equal(
        await scalar("SELECT count(*)::int FROM public.profiles"),
        2,
      );
    for (const role of ["anon", "authenticated"]) {
      assert.equal(
        await scalar(
          "SELECT has_function_privilege($1,'public.guard_private_work_update()','EXECUTE')",
          [role],
        ),
        false,
      );
      for (const privilege of ["TRUNCATE", "TRIGGER", "REFERENCES"])
        assert.equal(
          await scalar("SELECT has_table_privilege($1,'public.works',$2)", [
            role,
            privilege,
          ]),
          false,
        );
    }
    await db.exec("SET ROLE authenticated;");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [a]);
    const work = (
      await db.query(
        "INSERT INTO public.works(title,slug,type,language) VALUES('Privada','privada','Romance','Português') RETURNING *",
      )
    ).rows[0];
    assert.equal(work.owner_id, a);
    assert.equal(work.status, "draft");
    assert.equal(work.visibility, "private");
    assert.match(work.id, /^[0-9a-f-]{36}$/);
    await assert.rejects(
      db.query("UPDATE public.works SET owner_id=$1 WHERE id=$2", [b, work.id]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query("UPDATE public.works SET status='published' WHERE id=$1", [
        work.id,
      ]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query("UPDATE public.works SET visibility='public' WHERE id=$1", [
        work.id,
      ]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query(
        "INSERT INTO public.works(owner_id,title,slug,type,language) VALUES($1,'Forjada','forjada','Romance','pt')",
        [b],
      ),
      { code: "42501" },
    );
    const updated = (
      await db.query(
        "UPDATE public.works SET title='Revista',description='Sinopse',tags=ARRAY['tag'] WHERE id=$1 AND revision=1 RETURNING *",
        [work.id],
      )
    ).rows[0];
    assert.equal(updated.revision, 2);
    assert.equal(updated.description, "Sinopse");
    assert.equal(
      (
        await db.query(
          "UPDATE public.works SET title='Perda' WHERE id=$1 AND revision=1 RETURNING id",
          [work.id],
        )
      ).rows.length,
      0,
    );
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [b]);
    assert.equal(
      (await db.query("SELECT * FROM public.works WHERE id=$1", [work.id])).rows
        .length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "UPDATE public.works SET title='Intrusão' WHERE id=$1 RETURNING id",
          [work.id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query("DELETE FROM public.works WHERE id=$1 RETURNING id", [
          work.id,
        ])
      ).rows.length,
      0,
    );
    await db.exec("RESET ROLE; SET ROLE anon;");
    await assert.rejects(db.exec("SELECT * FROM public.works"), {
      code: "42501",
    });
    await db.exec(
      "RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','',false);",
    );
    assert.equal((await db.query("SELECT * FROM public.works")).rows.length, 0);
    await assert.rejects(
      db.exec(
        "INSERT INTO public.works(title,slug,type,language) VALUES('Sem sessão','sem-sessao','Romance','pt')",
      ),
      { code: "42501" },
    );
    await db.exec("RESET ROLE;");
    // Even an elevated caller cannot transfer ownership or publish through plain DML.
    await assert.rejects(
      db.query("UPDATE public.works SET owner_id=$1 WHERE id=$2", [b, work.id]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query("UPDATE public.works SET status='published' WHERE id=$1", [
        work.id,
      ]),
      { code: "23514" },
    );
    await assert.rejects(
      db.query("UPDATE public.works SET visibility='public' WHERE id=$1", [
        work.id,
      ]),
      { code: "23514" },
    );
    await db.exec("SET ROLE authenticated;");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [a]);
    assert.equal(
      (
        await db.query(
          "DELETE FROM public.works WHERE id=$1 AND revision=2 RETURNING id",
          [work.id],
        )
      ).rows.length,
      1,
    );
    assert.equal((await db.query("SELECT * FROM public.works")).rows.length, 0);
    await db.exec("RESET ROLE;");
    console.log(
      `PASS ${scenario}: private CRUD, A/B/anon/no-session, owner immutability, publication denied, revisions, hostile default grants and unchanged Auth/profiles`,
    );
  } finally {
    await db.close();
  }
}
