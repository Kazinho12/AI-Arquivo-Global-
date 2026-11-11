# F3.3 — Pesquisa e descoberta pública

## Auditoria inicial

O catálogo, pesquisa, categorias e tags já tinham cartões, filtros com URL, paginação local, pesquisa sem acentos e páginas inaugurais. A F3.1 fornecia snapshots públicos reais; a F3.2 já oferecia leitura desses snapshots. A fronteira pública era reutilizável e não precisava de ser reconstruída.

Lacunas: o repositório carregava **todo** o catálogo, a paginação ocorria no navegador, faltavam subtítulo/utilizador público e filtros de idioma/classificação/avisos, não havia debounce nem modal global funcional. A normalização das tags eliminava letras não latinas. Páginas de descoberta apresentavam contagens de uma coleção carregada sem distinguir uma amostra.

## Funcionalidades implementadas

- Pesquisa pública por título, subtítulo, sinopse, autor, utilizador público e tags. Todos os termos devem ocorrer no campo ou conjunto de campos escolhido. Sem distinção de caixa; acentos combinantes comuns são removidos. Não se interpretam operadores SQL ou curingas introduzidos pelo utilizador.
- Filtros combináveis por formato, família literária/visual, género, idioma, classificação, todas as tags selecionadas e avisos presentes. Ordenações por primeira publicação, última publicação confirmada e título; links antigos de autor/publicações antigas continuam válidos.
- Paginação no servidor: 12 por página, limite máximo SQL 24 e página máxima 10000. Contagem exata, limites verificados e desempate por ID público. A edição inaugural tem uma secção local independente, sem misturar contagens ou atribuir propriedade.
- URL partilhável (`q`, `campo`, `formato`, `familia`, `genero`, `idioma`, `idade`, `tag`, `aviso`, `ordem`, `pagina`). Parâmetros tipados e limitados no cliente e no servidor. “Limpar filtros” também permite sair do contexto de uma tag.
- Debounce de 300 ms, descarte de respostas antigas e ocultação de resultados pendentes. Estados de carregamento, vazio, erro e repetição. Uma falha da pesquisa remota não é substituída por resultados fictícios.
- Modal global com resultados públicos limitados a cinco, pesquisa inaugural separada, acesso aos resultados completos e o modal acessível existente.
- Tags clicáveis sem links aninhados nos cartões; detalhes existentes continuam compatíveis. Diretório com pesquisa remota e até 100 tags por consulta, página de tag combinável e tratamento de desconhecidas com zero resultados. Letras Unicode e espaços são suportados por chaves normalizadas; os textos dos autores são preservados nos cartões e a grafia representativa no diretório.
- Secções de publicadas/atualizadas recentemente na entrada e exploração. Géneros e formatos conduzem à pesquisa real. Pré-visualizações gerais limitadas a 12; as contagens nas restantes secções de exploração são explicitamente da amostra.
- Evitado o pedido duplicado provocado pela invalidação inicial do provider; mudar capítulos já não recarrega pré-visualizações de descoberta.

## Ficheiros

Novos:

- `supabase/migrations/20261111030000_public_discovery.sql`.
- `src/foundation/features/catalog/discovery.ts`, `DiscoveryCollection.tsx`, `RemoteTags.tsx`, `QuickSearch.tsx`.
- `scripts/discovery-server.test.ts`, `discovery-server.browser.tsx`, `discovery-server.browser.html`, `validate-discovery.mjs`.
- Este relatório.

Integração alterada em `src/foundation`:

- `features/catalog/repository.ts`, `PublicCatalog.tsx`.
- `components/WorkCollection.tsx`, `WorkCard.tsx`.
- `lib/discovery.ts`, `data/works.ts`.
- `pages/Catalog.tsx`, `Search.tsx` (componente existente integrado pelo wrapper), `Tags.tsx`, `Categories.tsx`, `Explore.tsx`, `Home.tsx`.
- `app/layouts.tsx`: entrada do modal global.

As alterações anteriores F3.1/F3.2 e do modal de eliminação continuam na árvore e foram preservadas. Não foram modificados Auth, perfis ou as migrations anteriores.

## SQL e segurança

**É necessária a migration local F3.3. Não foi instalada remotamente.** Não altera as tabelas privadas, RLS, triggers, propriedade, recibos ou o processo de publicação. Acrescenta quatro funções e três índices na projeção pública.

- `discovery_text(text)` e `discovery_tag(text)`: normalização pura, imutável, sem acesso a dados; necessárias também aos índices.
- `search_public_works(jsonb)`: `STABLE SECURITY INVOKER`, `search_path` vazio. Consulta exclusivamente colunas públicas explicitamente enumeradas de `published_works`, exige `is_public` e respeita RLS. Não lê capítulos nem perfis. Conta e pagina no mesmo statement/snapshot SQL. Não há SQL dinâmico.
- `public_discovery_facets(text)`: também `SECURITY INVOKER`, apenas metadados públicos, valores agregados limitados a 100 por grupo. Contagens de tags usam obras distintas e nunca rascunhos.
- EXECUTE revogado de `PUBLIC`; apenas `anon` e `authenticated` recebem EXECUTE. Não são concedidos direitos de escrita. Não há funções `SECURITY DEFINER` novas.
- Cliente de descoberta continua anónimo e independente de Auth, incluindo quando o leitor está autenticado. Sem `service_role`, histórico remoto ou consultas públicas a `works`/`work_entries`.

Índices: primeira publicação/ID, título normalizado/ID e formato/género, todos parciais sobre `is_public`. O índice F3.1 de última publicação é preservado. Não são instaladas extensões. A pesquisa por substring normalizada pode fazer varrimento dos **metadados públicos no servidor**; não se afirma que os índices B-tree aceleram qualquer substring. O CTE permite otimização da página pelo planner. Antes de adicionar trigramas, medir com `EXPLAIN (ANALYZE, BUFFERS)` num ambiente autorizado e com volume real. Esta escolha evita complexidade e armazenamento desnecessários no catálogo inicial/plano gratuito.

## Verificação local

```bash
npm test
npm run typecheck
npm run build
npm run format:check
git diff --check
PGLITE_PATH=/caminho/local/pglite/dist/index.js node scripts/validate-discovery.mjs
AG_TEST_PAGE=discovery-server.browser.html AG_TEST_RESULTS=/tmp/ag-f33-browser.json node scripts/run-browser-tests.mjs
AG_TEST_PAGE=public-reading.browser.html AG_TEST_RESULTS=/tmp/ag-f33-reading.json node scripts/run-browser-tests.mjs
AG_TEST_PAGE=works.browser.html AG_TEST_RESULTS=/tmp/ag-f33-editorial.json node scripts/run-browser-tests.mjs
```

SQL descartável com claims/roles de teste, incluindo grants padrão deliberadamente permissivos: pesquisa por campos/autor/acentos/Unicode, todos os filtros, entradas inválidas, injeção literal sem execução, paginação/ordenação, dados F3.1 preservados, alteração privada invisível, retirada e privilégios invoker. Os cenários de navegador usam Chrome real, SDK real e transporte HTTP isolado; nunca criam conteúdos de teste no projeto real. Verificam debounce, respostas fora de ordem, URLs, modal, erros, tags, paginação, navegação e largura móvel. A captura da interface foi inspecionada visualmente. Resultados finais locais: **237/237 testes automatizados, 34/34 cenários de navegador** (5 descoberta + 10 leitura + 19 editoriais), validação SQL F3.3, typecheck, build, formatação e `git diff --check` aprovados.

## Instalação manual posterior

1. Confirmar o projeto `dlwsjfqijrsmwejsmuts`. F3.1 deve estar instalada e validada. Não reaplicar migrations anteriores. O frontend F3.3 depende das RPCs novas; até à instalação, apresenta erro explícito na pesquisa pública.
2. Executar apenas estas pré-verificações de leitura:

```sql
SELECT to_regclass('public.published_works'),to_regclass('public.published_work_entries');
SELECT to_regprocedure('public.search_public_works(jsonb)'),
       to_regprocedure('public.public_discovery_facets(text)');
SELECT column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='published_works' ORDER BY ordinal_position;
SELECT policyname,roles,cmd,qual FROM pg_policies
WHERE schemaname='public' AND tablename IN ('published_works','published_work_entries');
SELECT count(*) AS editions,count(*) FILTER(WHERE is_public) AS public_editions FROM public.published_works;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='published_works';
```

3. Se houver objetos F3.3 pré-existentes ou divergência da F3.1, parar e comparar. Fazer o backup habitual autorizado. Executar uma vez **todo** `20261111030000_public_discovery.sql`, incluindo `BEGIN`/`COMMIT`, no SQL Editor. Os índices podem bloquear brevemente escritas de publicação; escolher uma janela adequada ao volume real. Não é uma migration de reaplicação.
4. Se falhar: `ROLLBACK;` quando a sessão estiver abortada; verificar ausência dos novos objetos e preservação dos anteriores. A transação impede instalação parcial. Não eliminar tabelas ou reconstruir dados.
5. Validar definições e privilégios:

```sql
SELECT proname,prosecdef,proconfig FROM pg_proc
WHERE pronamespace='public'::regnamespace AND proname IN
('discovery_text','discovery_tag','search_public_works','public_discovery_facets');
SELECT role_name,
 has_function_privilege(role_name,'public.search_public_works(jsonb)','EXECUTE') AS search,
 has_function_privilege(role_name,'public.public_discovery_facets(text)','EXECUTE') AS facets
FROM (VALUES('anon'),('authenticated')) roles(role_name);
SELECT p.proname,a.privilege_type FROM pg_proc p
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
WHERE p.pronamespace='public'::regnamespace AND p.proname IN
('discovery_text','discovery_tag','search_public_works','public_discovery_facets') AND a.grantee=0;
```

Esperado: `prosecdef=false`, `search_path` vazio, EXECUTE verdadeiro para as duas roles e nenhuma linha de grant `PUBLIC`.

6. Validar como visitante (leitura, sem gravar claims ou dados):

```sql
BEGIN;
SET LOCAL ROLE anon;
SELECT public.search_public_works('{"query":"","page":1,"size":12,"sort":"recentes"}');
SELECT public.public_discovery_facets('');
ROLLBACK;
```

7. No preview, pesquisar uma obra publicada por título, subtítulo, autor e tag com acento; combinar idioma, género e classificação; abrir URL noutra janela; percorrer páginas; experimentar o modal com teclado e um termo inexistente. Confirmar que o separador Network só usa as projeções/RPCs públicas, com páginas limitadas.
8. Com uma obra de teste e ações expressamente autorizadas pelo proprietário, confirmar que editar sem publicar não altera resultados e que retirar remove a obra. Nesta tarefa essas escritas **não são executadas**. Revalidar leitura F3.2 e operações editoriais F2.2 existentes.

## Limitações e pendências

- Instalação e validação F3.3 no Supabase real pendentes. Não é declarada funcional em produção; não foram executadas migrations, deploy, commit ou push.
- Substrings podem exigir varrimento de metadados; contagens exatas têm custo proporcional aos candidatos. Medir antes de aumentar volume. Não há ranking de relevância ou recomendações: todos os termos devem ocorrer, com ordenação explícita escolhida pelo leitor.
- Facetas limitadas a 100 valores por grupo. O diretório permite refinar tags; filtros em URL continuam a funcionar para um valor não mostrado na lista. As facetas globais não são recalculadas para cada combinação de filtros.
- Remoção de diacríticos cobre marcas combinantes comuns e o banco usa UTF-8. Não se promete equivalência linguística universal ou transliteração. Tags com pontuação podem partilhar uma chave normalizada; a grafia original permanece na obra.
- A edição inaugural não possui classificação/idioma estruturados: filtros por esses campos não inventam valores para essas obras.
- Resultados já recebidos revalidam em navegação, foco ou atualização; RLS impede novos pedidos de obras retiradas. Não se consegue revogar cópias já descarregadas.
- Sem R2, comentários, favoritos, avaliações, métricas ou F4.
