// Disposable local PostgreSQL only. No Supabase credentials or network requests.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.env.PGLITE_PATH)
  throw new Error("Define PGLITE_PATH para PGlite local.");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const migrations = await Promise.all(
  [
    "20261109000000_create_profiles_table.sql",
    "20261110000000_harden_profile_provisioning.sql",
    "20261110010000_canonical_usernames.sql",
  ].map((name) => readFile(`supabase/migrations/${name}`, "utf8")),
);
const signatures = [
  "public.ensure_user_profile(uuid,text,jsonb,timestamptz)",
  "public.handle_new_user()",
  "public.handle_profile_updated_at()",
  "public.normalize_profile_username()",
];
const first = "10000000-0000-0000-0000-000000000001";
const second = "10000000-0000-0000-0000-000000000002";
const third = "10000000-0000-0000-0000-000000000003";
for (const scenario of ["defaults", "explicit-existing-grants"]) {
  const db = new PGlite();
  const scalar = async (sql, args = []) =>
    Object.values((await db.query(sql, args)).rows[0])[0];
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE test_auth_admin;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb,
        created_at timestamptz DEFAULT now());
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, test_auth_admin;
      GRANT INSERT ON auth.users TO test_auth_admin;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
      INSERT INTO auth.users(id,email) VALUES ('${first}','owner@test.local'),('${second}','other@test.local');
    `);
    await db.exec(migrations[0]);
    assert.equal(await scalar("SELECT count(*)::int FROM public.profiles"), 2);
    for (let i = 0; i < 3; i++) {
      assert.equal(
        await scalar("SELECT has_function_privilege('anon', $1, 'EXECUTE')", [
          signatures[i],
        ]),
        false,
      );
      assert.equal(
        await scalar(
          "SELECT has_function_privilege('authenticated', $1, 'EXECUTE')",
          [signatures[i]],
        ),
        false,
      );
    }
    if (scenario === "explicit-existing-grants") {
      await db.exec(`GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid,text,jsonb,timestamptz),
        public.handle_new_user(), public.handle_profile_updated_at() TO PUBLIC, anon, authenticated;
        GRANT ALL ON public.profiles TO PUBLIC, anon, authenticated;`);
    }
    await db.exec(migrations[1]);
    await db.exec(migrations[2]);
    if (scenario === "explicit-existing-grants") {
      await db.exec(
        "GRANT EXECUTE ON FUNCTION public.normalize_profile_username() TO PUBLIC, anon, authenticated;",
      );
      await db.exec(migrations[2]);
    }
    // Reapplication must also remove restored explicit grants, without changing rows.
    const before = (await db.query("SELECT * FROM public.profiles ORDER BY id"))
      .rows;
    for (const sql of migrations) await db.exec(sql);
    assert.deepEqual(
      (await db.query("SELECT * FROM public.profiles ORDER BY id")).rows,
      before,
    );
    for (const signature of signatures) {
      for (const role of ["anon", "authenticated", "test_auth_admin"]) {
        assert.equal(
          await scalar("SELECT has_function_privilege($1, $2, 'EXECUTE')", [
            role,
            signature,
          ]),
          false,
        );
      }
    }
    const functions = (
      await db.query(
        `SELECT proname, prosecdef, proconfig FROM pg_proc
      WHERE oid IN (${signatures.map((_, i) => `$${i + 1}::regprocedure`).join(",")})`,
        signatures,
      )
    ).rows;
    assert.equal(functions.filter((fn) => fn.prosecdef).length, 2);
    for (const fn of functions)
      assert.ok(fn.proconfig.includes('search_path=""'));
    // PUBLIC must have no EXECUTE ACL even when roles receive default grants.
    assert.equal(
      await scalar(
        `SELECT count(*)::int FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
      WHERE p.oid IN (${signatures.map((_, i) => `$${i + 1}::regprocedure`).join(",")})
      AND a.grantee=0 AND a.privilege_type='EXECUTE'`,
        signatures,
      ),
      0,
    );
    // Simulate Auth inserting as a non-owner with no EXECUTE on any helper.
    await db.exec(`SET ROLE test_auth_admin;
      INSERT INTO auth.users(id,email,raw_user_meta_data)
      VALUES('${third}','new@test.local','{"username":"Mixed_New"}'); RESET ROLE;`);
    assert.equal(
      await scalar("SELECT username FROM public.profiles WHERE id=$1", [third]),
      "mixed_new",
    );
    for (const role of ["anon", "authenticated"]) {
      for (const privilege of ["DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        assert.equal(
          await scalar("SELECT has_table_privilege($1,'public.profiles',$2)", [
            role,
            privilege,
          ]),
          false,
        );
      }
    }
    await db.exec("SET ROLE anon;");
    assert.equal(await scalar("SELECT count(*)::int FROM public.profiles"), 3);
    await assert.rejects(
      db.exec(
        `INSERT INTO public.profiles(id,username,display_name) VALUES('${first}','forged','Forged')`,
      ),
      { code: "42501" },
    );
    await db.exec("RESET ROLE; SET ROLE authenticated;");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      first,
    ]);
    // Actual RPC attempts, not just inspection of ACLs.
    await assert.rejects(
      db.exec(`SELECT public.ensure_user_profile('${second}',NULL,NULL,now())`),
      { code: "42501" },
    );
    for (const name of [
      "handle_new_user",
      "handle_profile_updated_at",
      "normalize_profile_username",
    ]) {
      await assert.rejects(db.exec(`SELECT public.${name}()`), {
        code: "42501",
      });
    }
    assert.equal(
      (
        await db.query(
          "UPDATE public.profiles SET bio='forged' WHERE id=$1 RETURNING id",
          [second],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query("UPDATE public.profiles SET id=$1 WHERE id=$2", [
        "90000000-0000-0000-0000-000000000001",
        first,
      ]),
      { code: "42501" },
    );
    await assert.rejects(
      db.query(
        "INSERT INTO public.profiles(id,username,display_name) VALUES($1,'forged','Forged')",
        ["90000000-0000-0000-0000-000000000001"],
      ),
      { code: "42501" },
    );
    const saved = (
      await db.query(
        `INSERT INTO public.profiles(id,username,display_name,bio,updated_at)
      VALUES($1,'Owner_Updated','Owner','Saved','2000-01-01')
      ON CONFLICT(id) DO UPDATE SET username=EXCLUDED.username, bio=EXCLUDED.bio,
      updated_at=EXCLUDED.updated_at RETURNING username,bio,updated_at`,
        [first],
      )
    ).rows[0];
    assert.equal(saved.username, "owner_updated");
    assert.equal(saved.bio, "Saved");
    assert.ok(new Date(saved.updated_at).getFullYear() > 2000);
    await assert.rejects(db.exec("DELETE FROM public.profiles"), {
      code: "42501",
    });
    await assert.rejects(db.exec("TRUNCATE public.profiles"), {
      code: "42501",
    });
    await db.exec("RESET ROLE;");
    // Missing-profile INSERT path, still through real browser grants and RLS.
    await db.exec(
      `DELETE FROM public.profiles WHERE id='${third}'; SET ROLE authenticated;`,
    );
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      third,
    ]);
    assert.equal(
      (
        await db.query(
          `INSERT INTO public.profiles(id,username,display_name)
      VALUES($1,'Own_Insert','Own') RETURNING username`,
          [third],
        )
      ).rows[0].username,
      "own_insert",
    );
    await db.exec("RESET ROLE;");
    console.log(
      `PASS ${scenario}: default/explicit ACLs, all migrations, reapplication, backfill, non-owner Auth trigger, canonical/timestamp triggers, upsert, own insert, RLS and denied RPC/TRUNCATE/DELETE`,
    );
  } finally {
    await db.close();
  }
}
