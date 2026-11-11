import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (!process.env.PGLITE_PATH)
  throw new Error("Define PGLITE_PATH para a ferramenta PostgreSQL local.");
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const base = await readFile(
  "supabase/migrations/20261109000000_create_profiles_table.sql",
  "utf8",
);
const canonical = await readFile(
  "supabase/migrations/20261110010000_canonical_usernames.sql",
  "utf8",
);
for (const scenario of ["fresh", "existing", "collision"]) {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb,created_at timestamptz DEFAULT now()); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA auth,public TO authenticated;`,
    );
    await db.exec(base);
    if (scenario === "fresh") await db.exec(canonical);
    await db.exec(
      `INSERT INTO auth.users(id,email) VALUES('10000000-0000-0000-0000-000000000001','mixed@test.local'),('10000000-0000-0000-0000-000000000002','other@test.local'); UPDATE public.profiles SET username='Mixed_Handle',bio='Preservar' WHERE id='10000000-0000-0000-0000-000000000001';`,
    );
    if (scenario === "collision") {
      await db.exec(
        `UPDATE public.profiles SET username='MIXED_HANDLE' WHERE id='10000000-0000-0000-0000-000000000002';`,
      );
      await assert.rejects(db.exec(canonical));
      await db.exec("ROLLBACK;");
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.profiles WHERE lower(username)='mixed_handle'",
          )
        ).rows[0].n,
        2,
      );
      console.log(
        "PASS collision: preflight aborta sem renomear ou perder dados",
      );
      continue;
    }
    await db.exec(canonical);
    await db.exec(canonical);
    const first = (
      await db.query(
        "SELECT * FROM public.profiles WHERE username='mixed_handle'",
      )
    ).rows[0];
    assert.equal(first.bio, "Preservar");
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',false);`,
    );
    await assert.rejects(
      db.exec(
        "UPDATE public.profiles SET username='MIXED_HANDLE' WHERE id=auth.uid()",
      ),
    );
    assert.equal(
      (
        await db.query(
          "UPDATE public.profiles SET bio='Intrusão' WHERE id='10000000-0000-0000-0000-000000000001' RETURNING id",
        )
      ).rows.length,
      0,
    );
    await db.exec(
      "UPDATE public.profiles SET username='Own_Underscore' WHERE id=auth.uid(); RESET ROLE;",
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM public.profiles WHERE username='own_underscore'",
        )
      ).rows[0].n,
      1,
    );
    console.log(
      `PASS ${scenario}: unicidade canónica, underscore, normalização, reexecução, preservação e RLS`,
    );
  } finally {
    await db.close();
  }
}
