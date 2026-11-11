// Local disposable PostgreSQL only. Install PGlite outside the project and pass PGLITE_PATH.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const modulePath = process.env.PGLITE_PATH;
if (!modulePath)
  throw new Error(
    "Define PGLITE_PATH para uma instalação temporária de @electric-sql/pglite. Não usa Supabase.",
  );
const { PGlite } = await import(pathToFileURL(modulePath).href);
const base = await readFile(
  "supabase/migrations/20261109000000_create_profiles_table.sql",
  "utf8",
);
const followup = await readFile(
  "supabase/migrations/20261110000000_harden_profile_provisioning.sql",
  "utf8",
);
const original = execFileSync(
  "git",
  [
    "show",
    "2261efa:supabase/migrations/20261109000000_create_profiles_table.sql",
  ],
  { encoding: "utf8" },
);
for (const scenario of ["fresh", "original-already-applied"]) {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb, created_at timestamptz DEFAULT now());
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA public, auth TO authenticated;`);
    if (scenario !== "fresh") {
      await db.exec(original);
      await db.exec("DROP TRIGGER on_auth_user_created ON auth.users;");
    }
    const accounts = [
      [
        "10000000-0000-0000-0000-000000000001",
        "duplicate@test.local",
        { username: "DUPLICATE", display_name: "" },
      ],
      [
        "10000000-0000-0000-0000-000000000002",
        "duplicate@test.local",
        { username: "duplicate", display_name: " ".repeat(5) },
      ],
      [
        "10000000-0000-0000-0000-000000000003",
        "a".repeat(90) + "@test.local",
        { username: "A".repeat(100), display_name: "N".repeat(100) },
      ],
      [
        "10000000-0000-0000-0000-000000000004",
        null,
        { username: "!!!", name: "" },
      ],
      ["10000000-0000-0000-0000-000000000005", null, null],
    ];
    for (const [id, email, metadata] of accounts)
      await db.query(
        "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
        [id, email, metadata],
      );
    if (scenario !== "fresh")
      await db.exec(
        "INSERT INTO public.profiles(id,username,display_name,bio) VALUES('10000000-0000-0000-0000-000000000001','KEEP_ME','Original','Preservar');",
      );
    await db.exec(scenario === "fresh" ? base : followup);
    const profiles = (
      await db.query("SELECT * FROM public.profiles ORDER BY id")
    ).rows;
    assert.equal(profiles.length, accounts.length);
    assert.equal(
      new Set(profiles.map((row) => row.username.toLowerCase())).size,
      accounts.length,
    );
    for (const row of profiles) {
      assert.match(row.username, /^[a-zA-Z0-9_]{3,30}$/);
      assert.ok(row.display_name.length >= 1 && row.display_name.length <= 60);
    }
    if (scenario !== "fresh") {
      assert.equal(profiles[0].username, "KEEP_ME");
      assert.equal(profiles[0].bio, "Preservar");
    }
    await db.exec(followup);
    assert.deepEqual(
      (await db.query("SELECT * FROM public.profiles ORDER BY id")).rows,
      profiles,
    );
    await db.query(
      "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
      [
        "20000000-0000-0000-0000-000000000001",
        "duplicate@test.local",
        { username: "duplicate", name: "N".repeat(200) },
      ],
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM public.profiles")).rows[0]
        .n,
      6,
    );
    await db.exec(
      "ALTER TABLE public.profiles ADD CONSTRAINT test_rejection CHECK (display_name <> 'FAIL_TEST');",
    );
    await db.query(
      "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
      [
        "30000000-0000-0000-0000-000000000001",
        "defer@test.local",
        { name: "FAIL_TEST" },
      ],
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM auth.users WHERE id='30000000-0000-0000-0000-000000000001'",
        )
      ).rows[0].n,
      1,
    );
    await db.exec(
      "DROP TRIGGER on_auth_user_created ON auth.users; INSERT INTO auth.users(id,email) VALUES('30000000-0000-0000-0000-000000000002','valid@test.local');",
    );
    await db.exec(followup);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM public.profiles WHERE id='30000000-0000-0000-0000-000000000002'",
        )
      ).rows[0].n,
      1,
    );
    await db.exec(
      "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',false);",
    );
    assert.equal(
      (
        await db.query(
          "UPDATE public.profiles SET bio='Intrusão' WHERE id='10000000-0000-0000-0000-000000000001' RETURNING id",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "UPDATE public.profiles SET bio='Meu perfil' WHERE id='10000000-0000-0000-0000-000000000002' RETURNING id",
        )
      ).rows.length,
      1,
    );
    await assert.rejects(
      db.query(
        "SELECT public.ensure_user_profile('10000000-0000-0000-0000-000000000002',null,null,now())",
      ),
    );
    await db.exec("RESET ROLE;");
    console.log(
      `PASS ${scenario}: normalização, colisões, limites, preservação, reexecução, trigger tolerante, backfill e RLS`,
    );
  } finally {
    await db.close();
  }
}
