// Disposable local SQL only; never connects to Supabase.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_PATH).href);
const db = new PGlite();
const a = randomUUID(),
  b = randomUUID();
const role = async (id) => {
  await db.exec("RESET ROLE; SET ROLE " + (id ? "authenticated" : "anon"));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
};
const search = async (filters = {}) =>
  (await db.query("SELECT public.search_public_works($1) r", [filters])).rows[0]
    .r;
const publish = async (w, action = "publish", op = randomUUID()) =>
  (
    await db.query("SELECT public.publish_private_work($1,$2,$3,$4) r", [
      w.id,
      w.revision,
      action,
      op,
    ])
  ).rows[0].r.work;
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
try {
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;CREATE TABLE public.profiles(id uuid PRIMARY KEY,display_name text,username text);`,
  );
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [a, b]);
  await db.query(
    "INSERT INTO public.profiles VALUES($1,'Ágata Escritora','agata_publica')",
    [a],
  );
  for (const file of [
    "20261111000000_create_private_works.sql",
    "20261111010000_private_editorial_entries.sql",
    "20261111020000_publication_catalog.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  await role(a);
  let w = (
    await db.query(
      "INSERT INTO public.works(title,slug,subtitle,description,type,language,genre,age_rating,tags,content_warnings)VALUES('Coração das Estrelas','coracao','Subtítulo secreto das marés','Sinopse pública','Romance','pt','Fantasia','+12',ARRAY['Ficção científica','東京 文学','Ação'],ARRAY['Violência'])RETURNING *",
    )
  ).rows[0];
  w = await mutate(w, "add_entry");
  w = await mutate(w, "save_entry", {
    entry_id: w.entries[0].id,
    entry_revision: w.entries[0].revision,
    title: "Entrada",
    content: "Texto",
    alignment: "left",
  });
  w = await publish(w);
  const before = structuredClone(w);
  await db.exec("RESET ROLE");
  await db.exec(
    await readFile(
      "supabase/migrations/20261111030000_public_discovery.sql",
      "utf8",
    ),
  );
  await role(a);
  assert.deepEqual(
    (await db.query("SELECT public.read_private_work($1) r", [w.id])).rows[0].r,
    before,
  );
  await role(null);
  assert.equal(
    (await db.query("SELECT public.discovery_tag('東京 文学') k")).rows[0].k,
    "東京-文学",
  );
  assert.equal(
    (await db.query("SELECT public.discovery_tag('✨') k")).rows[0].k,
    "✨",
  );
  for (const query of [
    "coracao",
    "CORAÇÃO",
    "mares",
    "agata",
    "agata_publica",
    "cientifica",
    "東京",
    "coracao estrelas",
  ]) {
    const result = await search({ query });
    assert.equal(result.total, 1, query);
    assert.equal(result.items[0].id, w.public_id);
    assert.ok(!("work_id" in result.items[0]));
    assert.ok(!("owner_id" in result.items[0]));
    assert.ok(!("revision" in result.items[0]));
  }
  assert.equal(
    (
      await search({
        format: "Romance",
        genre: "fantasia",
        language: "pt",
        age: "+12",
        tags: ["ficcao-cientifica", "東京-文学"],
        warnings: ["Violência"],
      })
    ).total,
    1,
  );
  assert.equal((await search({ tags: ["inexistente"] })).total, 0);
  assert.equal((await search({ query: "%' OR 1=1 --" })).total, 0);
  for (const filters of [
    { page: "abc" },
    { size: 1000 },
    { format: "malicious" },
    { tags: [{}] },
    { tags: Array(11).fill("x") },
    { query: "a".repeat(201) },
  ])
    await assert.rejects(search(filters), (e) => e.code === "22023");
  await role(a);
  w = (
    await db.query(
      "UPDATE public.works SET title='Alteração privada invisível' WHERE id=$1 RETURNING *",
      [w.id],
    )
  ).rows[0];
  assert.equal((await search({ query: "invisivel" })).total, 0);
  assert.equal((await search({ query: "coracao" })).total, 1);
  await role(b);
  await assert.rejects(publish(w, "withdraw"), (e) => e.code === "42501");
  assert.equal((await search({ query: "coracao" })).total, 1);
  await role(a);
  w = await publish(w, "withdraw");
  await role(null);
  assert.equal((await search()).total, 0);
  const facets = (await db.query("SELECT public.public_discovery_facets() r"))
    .rows[0].r;
  assert.deepEqual(facets.tags, []);
  await role(a);
  w = await publish(w);
  assert.equal((await search({ query: "invisivel" })).total, 1);
  // Seed extra public fixtures as trusted test owner only, never production data.
  await db.exec("RESET ROLE");
  for (let i = 0; i < 27; i++)
    await db.query(
      "INSERT INTO public.works(owner_id,title,slug,type,language)VALUES($1,$2,$3,'Conto','en') RETURNING id",
      [a, "Seed " + i, "seed-" + i],
    );
  const seeded = (
    await db.query("SELECT id,slug FROM public.works WHERE slug LIKE 'seed-%'")
  ).rows;
  for (const [i, row] of seeded.entries())
    await db.query(
      "INSERT INTO public.published_works(id,work_id,slug,title,subtitle,description,type,genre,language,age_rating,tags,content_warnings,cover_accent_color,first_published_at,last_published_at,is_public)VALUES($1,$2,$3,$4,'','Public fixture','Conto','Mistério','en','Livre','{}','{}','#14243B',$5,$6,true)",
      [
        randomUUID(),
        row.id,
        row.slug,
        "Título " + String(i).padStart(2, "0"),
        new Date(2026, 0, i + 1).toISOString(),
        new Date(2026, 1, 28 - i).toISOString(),
      ],
    );
  await role(null);
  const first = await search({ size: 12, sort: "titulo" }),
    second = await search({ size: 12, page: 2, sort: "titulo" });
  assert.equal(first.total, 28);
  assert.equal(first.items.length, 12);
  assert.equal(second.items.length, 12);
  assert.ok(first.items.every((x) => !second.items.some((y) => x.id === y.id)));
  assert.equal((await search({ page: 9999 })).page, 3);
  assert.equal((await search({ sort: "recentes" })).items[0].id, w.public_id);
  assert.equal(
    (await search({ sort: "atualizadas" })).items[0].id,
    w.public_id,
  );
  assert.notEqual(
    (await search({ format: "Conto", sort: "recentes" })).items[0].id,
    (await search({ format: "Conto", sort: "atualizadas" })).items[0].id,
  );
  const available = (
    await db.query("SELECT public.public_discovery_facets('cientifica') r")
  ).rows[0].r;
  assert.equal(available.tags[0].name, "Ficção científica");
  for (const name of [
    "search_public_works(jsonb)",
    "public_discovery_facets(text)",
    "discovery_text(text)",
    "discovery_tag(text)",
  ])
    assert.equal(
      (
        await db.query(
          "SELECT prosecdef FROM pg_proc WHERE oid=$1::regprocedure",
          ["public." + name],
        )
      ).rows[0].prosecdef,
      false,
    );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::integer n FROM pg_proc p CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a WHERE p.pronamespace='public'::regnamespace AND p.proname IN('search_public_works','public_discovery_facets','discovery_text','discovery_tag') AND a.grantee=0",
      )
    ).rows[0].n,
    0,
  );
  console.log(
    "PASS F3.3 SQL: Unicode/accent search; fields/author/tags; combined filters; bounded pagination; safe input; RLS/withdrawal/private snapshot isolation; invoker ACLs; F3.1 data unchanged",
  );
} finally {
  await db.close();
}
