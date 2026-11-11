# F3.1 — Publicação e catálogo público

## Estado e alcance

Implementação local. **A migration F3.1 não foi executada remotamente.** Os resultados locais não certificam o estado do projeto Supabase real. A instalação e a validação funcional remota continuam dependentes de autorização.

Não foram alterados Auth, perfis, dados remotos ou as migrations F2.1/F2.2. Não houve deploy, commit ou push. As correções anteriores do modal de eliminação foram preservadas.

## Fluxo implementado

- No Studio, publicar exige confirmação explícita e título, sinopse, formato, idioma, classificação etária e pelo menos uma entrada com texto válido. Entradas vazias continuam privadas; entradas incompatíveis com o formato impedem publicação.
- Publicar, atualizar a publicação, retirar e republicar usam uma RPC transacional, a revisão carregada e um UUID de operação estável em tentativas da mesma operação. Conflitos exigem recuperar a versão atual; erros aparecem no modal.
- `status` e `visibility` representam `draft/private` ou `published/public`. `archived_at` continua independente. É necessário retirar publicação antes de arquivar; rascunhos arquivados existentes são preservados.
- A edição pública é um **snapshot confirmado**. Editar ou eliminar uma entrada da cópia de trabalho não altera imediatamente a edição pública. O autor pode confirmar “Atualizar publicação” ou retirar a obra. A interface explica esta distinção.
- Duplicar uma obra publicada continua a criar um rascunho privado com novos identificadores, sem copiar datas de publicação. Eliminar a obra elimina também a sua projeção pública por FK/cascade.
- A retirada impede imediatamente novos pedidos públicos ao catálogo, detalhes e entradas. Republicar preserva os identificadores públicos e a primeira data de publicação.
- Catálogo, pesquisa, géneros e tags combinam publicações reais com os quatro conteúdos inaugurais, identificados separadamente. Os conteúdos inaugurais permanecem locais, sem proprietário fictício. Detalhes públicos incluem sinopse, género, idioma, classificação, tags, autor público quando disponível, datas e entradas.
- Prosa e poemas têm leitura pública. HQ/Mangá publicam apenas o **guião textual existente**, claramente identificado no modal, nos detalhes e no leitor. Não existem páginas de imagens, uploads ou R2 nesta etapa.

## Ficheiros da implementação

Novos:

- `supabase/migrations/20261111020000_publication_catalog.sql`.
- `src/foundation/features/catalog/{repository.ts,PublicCatalog.tsx,PublishedPages.tsx,events.ts}`.
- `src/foundation/features/studio/PublicationControls.tsx`.
- `scripts/publication.test.ts`, `scripts/validate-publication.mjs` e este relatório.

Integração alterada:

- `src/foundation/app/App.tsx`: provider do catálogo dentro do router, independente de Auth.
- `src/foundation/features/studio/{types.ts,worksRepository.ts,worksController.ts,store.ts}`: DTOs, RPC protegida, invalidação e contagens reais.
- `src/foundation/pages/{Studio,Work,Reader,Catalog,Home,Explore,Search,Categories,Tags,Trends}.tsx`: publicação, páginas públicas e descoberta.
- `src/foundation/components/{WorkCard,WorkCollection}.tsx`, `src/foundation/data/{works,inaugural}.ts`, `src/foundation/lib/worksRepository.ts`: identificação das origens e preservação da edição inaugural.
- `src/foundation/features/reader/{ProseReader,PoetryReader}.tsx`: leitor reutilizado sem links para interações não implementadas nas publicações de utilizadores.
- `src/foundation/features/studio/RemoteEntryEditor.tsx`: aviso de que eliminar da edição privada não atualiza automaticamente a edição publicada.
- `scripts/works.browser.tsx` e `scripts/validate-editorial-entries.mjs`: cobertura F3.1 e regressão SQL com a nova migration.

A árvore já continha a correção do modal de eliminação (`components/ui.tsx`, `Studio.tsx`, `RemoteEntryEditor.tsx`, `works.browser.tsx` e `works.test.ts`); essas alterações foram preservadas e testadas, sem as atribuir a uma nova implementação de Auth ou perfis.

## Modelo e segurança

Migration: `supabase/migrations/20261111020000_publication_catalog.sql`.

| Objeto                                         | Alteração                                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `works`                                        | `public_id` UUID estável, `first_published_at`, `last_published_at`, `withdrawn_at`, `published_revision`; restrições de estado/datas |
| `work_entries`                                 | `public_id` UUID estável, independente do UUID privado                                                                                |
| `published_works`                              | Projeção explícita de metadados, autoria pública e datas; FK interna para a obra; indicador de disponibilidade                        |
| `published_work_entries`                       | Conteúdo confirmado e ordenação, usando apenas IDs públicos                                                                           |
| `publish_private_work(uuid,integer,text,uuid)` | Publicar/atualizar/retirar com transação, proprietário, bloqueio de linha, revisão e recibo idempotente                               |
| `read_public_work(uuid)`                       | Leitura com lista explícita de campos e RLS, `SECURITY INVOKER`                                                                       |

As tabelas privadas mantêm RLS de proprietário. A política `works_update_own` passa a aceitar metadados de uma obra publicada do próprio autor; os grants por coluna continuam a impedir alterações diretas a estado, visibilidade, propriedade, IDs e datas de publicação. INSERT continua restrito a rascunhos privados. Uma única trigger de revisão incrementa a obra uma vez por alteração; a proteção anterior de formatos e arquivo é preservada.

As duas projeções têm RLS SELECT para `anon`/`authenticated` apenas quando `is_public` é verdadeiro. Não há grants de escrita. A FK privada `published_works.work_id` não tem grant SELECT para essas roles. Não são expostos proprietário técnico, revisões de trabalho, recibos, email ou metadados de Auth. O frontend pede uma lista explícita de colunas; a RPC pública também usa uma lista explícita.

A RPC de publicação é `SECURITY DEFINER`, com `search_path = ''`, objetos qualificados e proprietário verificado por `auth.uid()` sob bloqueio `FOR UPDATE`. Acesso EXECUTE de `PUBLIC` e `anon` é revogado; apenas `authenticated` recebe EXECUTE. A trigger interna não tem EXECUTE para clientes. Grants padrão permissivos são neutralizados nos novos objetos. Os testes também verificam a pseudo-role `PUBLIC`.

O snapshot só copia `profiles.display_name` e `profiles.username`, quando o perfil existe; a ausência do perfil não inventa autoria. Não se consulta email de Auth nem se modificam perfis. A autoria apresentada pode ser atualizada numa próxima publicação explícita.

O catálogo usa um cliente anónimo independente, sem sessão de Auth e com pedidos `no-store`; o Studio mantém o token validado e fixado por pedido. Não existe `service_role` no navegador. A publicação/retirada/eliminação invalida o catálogo local. Navegação, foco da janela e atualização manual revalidam o catálogo; detalhes/leitor revalidam ao navegar e ao atualizar esse estado.

## Verificações locais

Comandos:

```bash
npm test
npm run typecheck
npm run build
npm run format:check
git diff --check
AG_TEST_PAGE=works.browser.html AG_TEST_RESULTS=/tmp/ag-f31-browser.json node scripts/run-browser-tests.mjs
PGLITE_PATH=/caminho/local/pglite/dist/index.js node scripts/validate-publication.mjs
PGLITE_PATH=/caminho/local/pglite/dist/index.js node scripts/validate-editorial-entries.mjs
AG_SQL_PUBLICATION=1 PGLITE_PATH=/caminho/local/pglite/dist/index.js node scripts/validate-editorial-entries.mjs
```

O runner de navegador usa um perfil temporário, Supabase desconfigurado e repositórios de teste; não acede a obras reais. PGlite executa PostgreSQL descartável com roles e claims simuladas, incluindo defaults de privilégios deliberadamente permissivos. A variável `AG_SQL_PUBLICATION=1` repete a bateria editorial anterior após aplicar também F3.1.

Cobertura: compatibilidade dos campos/UUIDs anteriores, ACL/RLS, proprietário alheio/anónimo/sem sessão, colunas protegidas, validação sem conteúdo, publicação transacional e rollback após falha injetada, snapshots sem fugas de edições privadas, retirada/republicação, IDs estáveis, conflito de revisão e repetição de operação, duplicação/arquivo/restauro/eliminação, prosa/poemas e allowlist de autoria. O navegador cobre confirmação/cancelamento, catálogo, detalhes, leitura, retirada, republicação, erros de rede e conflito, além dos fluxos editoriais anteriores.

Resultados locais finais: **230/230 testes automatizados, 19/19 cenários de navegador, typecheck, build, formatação e `git diff --check` aprovados**. A bateria SQL F3.1 passou; a bateria F2.2 passou nos três cenários de trigger, antes e depois de aplicar F3.1. PGlite não comprova JWT/PostgREST nem concorrência entre ligações reais: valida conflitos de revisão e repetição sequencial; o bloqueio concorrente deve ser confirmado no ambiente autorizado.

## Instalação manual posterior — só após autorização

1. Confirmar no painel que o projeto selecionado é `dlwsjfqijrsmwejsmuts`. Obter backup pelo procedimento habitual. Não reaplicar Auth, perfis, F2.1 ou F2.2 instaladas.
2. Executar estas consultas **de leitura** no SQL Editor e rever o resultado. Deve existir F2.2 com a trigger habilitada e uma única proteção BEFORE UPDATE, sem novos objetos F3.1. Se o esquema divergir, parar e comparar antes de instalar.

```sql
SELECT current_database(), current_user;
SELECT to_regclass('public.works') AS works,
       to_regclass('public.work_entries') AS entries,
       to_regclass('public.work_operation_receipts') AS receipts,
       to_regclass('public.published_works') AS publication;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'public.works'::regclass;
SELECT tgname, tgenabled, pg_get_triggerdef(oid)
FROM pg_trigger WHERE tgrelid = 'public.works'::regclass AND NOT tgisinternal;
SELECT proname, prosecdef, proconfig, pg_get_functiondef(oid)
FROM pg_proc WHERE oid IN (
  'public.read_private_work(uuid)'::regprocedure,
  'public.mutate_private_work(uuid,integer,text,jsonb,uuid)'::regprocedure,
  'public.guard_private_work_update()'::regprocedure);
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
  AND tablename IN ('works','work_entries','work_operation_receipts');
SELECT table_name,column_name,data_type
FROM information_schema.columns WHERE table_schema='public'
  AND table_name IN ('works','work_entries','profiles')
ORDER BY table_name,ordinal_position;
SELECT count(*) AS works, count(*) FILTER (WHERE status<>'draft' OR visibility<>'private') AS unexpected_state,
       count(*) FILTER (WHERE archived_at IS NOT NULL) AS archived
FROM public.works;
SELECT count(*) AS entries FROM public.work_entries;
```

3. Guardar contagens e, pelo processo de backup aprovado, o estado anterior. Não copiar dados pessoais para este relatório.
4. Abrir **todo** `20261111020000_publication_catalog.sql` no SQL Editor e executar uma vez, incluindo `BEGIN` e `COMMIT`. Não selecionar fragmentos. A migration é aditiva e transacional, mas não é destinada a reaplicação. Não publica nenhuma obra automaticamente.
5. Em caso de falha, executar `ROLLBACK;` se a sessão ainda estiver numa transação abortada. A transação impede instalação parcial. Confirmar que os objetos novos não existem e que as contagens/UUIDs anteriores permanecem. Não eliminar tabelas nem reaplicar migrations anteriores; investigar a causa antes de nova tentativa.
6. Após sucesso, executar as validações de leitura abaixo. Os dados antigos mantêm IDs e conteúdo, mas recebem novos IDs públicos sem alterar revisão ou estado. As projeções devem começar vazias.

```sql
SELECT count(*) AS works, count(DISTINCT public_id) AS public_ids,
       count(*) FILTER (WHERE status='published') AS published
FROM public.works;
SELECT count(*) AS entries, count(DISTINCT public_id) AS public_ids
FROM public.work_entries;
SELECT count(*) FROM public.published_works;
SELECT count(*) FROM public.published_work_entries;
SELECT tgname,tgenabled,pg_get_triggerdef(oid)
FROM pg_trigger WHERE tgrelid='public.works'::regclass AND NOT tgisinternal;
SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public'
  AND tablename IN ('works','work_entries','work_operation_receipts','published_works','published_work_entries');
SELECT policyname,cmd,roles,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('works','published_works','published_work_entries');
SELECT role_name,
 has_function_privilege(role_name,'public.publish_private_work(uuid,integer,text,uuid)','EXECUTE') AS publish,
 has_function_privilege(role_name,'public.read_public_work(uuid)','EXECUTE') AS read_public,
 has_function_privilege(role_name,'public.guard_private_work_update()','EXECUTE') AS internal_guard,
 has_column_privilege(role_name,'public.works','status','UPDATE') AS direct_status,
 has_column_privilege(role_name,'public.works','public_id','UPDATE') AS direct_public_id,
 has_column_privilege(role_name,'public.published_works','work_id','SELECT') AS private_link,
 has_table_privilege(role_name,'public.work_operation_receipts','SELECT') AS receipts,
 has_table_privilege(role_name,'public.published_work_entries','INSERT') AS entry_insert
FROM (VALUES ('anon'),('authenticated')) roles(role_name);
SELECT p.proname,p.prosecdef,p.proconfig,a.privilege_type
FROM pg_proc p CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
WHERE p.pronamespace='public'::regnamespace
 AND p.proname IN ('read_public_work','publish_private_work','guard_private_work_update')
 AND a.grantee=0;
```

Esperado: `publish=false/true` para anon/authenticated; `read_public=true` em ambas; restantes privilégios consultados falsos; última consulta sem linhas. Todas as cinco tabelas com RLS ativo, uma única trigger habilitada. Conferir também ausência de grants INSERT/UPDATE/DELETE em ambas as projeções.

7. Só depois, num teste autorizado com **obra de teste**, validar duas contas e janela anónima: rascunho bloqueado, confirmar publicação, abrir ID público, editar sem atualizar a edição, confirmar atualização, retirar, verificar novos pedidos bloqueados, republicar mantendo ID e primeira data. Testar concorrência com duas sessões a partir da mesma revisão e verificar um único vencedor; testar repetição após resposta perdida. Não usar obras existentes como alvos de eliminação.
8. Se a instalação manual não registar histórico da CLI, reconciliar posteriormente apenas após comparar SQL instalado e ficheiro local; não executar `db push`, `db reset` ou reparações de histórico nesta tarefa.

## Limitações e pendências

- Instalação, grants reais, PostgREST/JWT, concorrência entre sessões e testes funcionais remotos ainda por validar. Não declarar publicação funcional em produção.
- Retirar impede novos pedidos; não consegue apagar cópias ou capturas já descarregadas. Uma página já aberta pode conservar texto até revalidar. Não existe promessa de revogação de conteúdo já entregue nem atualização em tempo real entre dispositivos.
- Listagem remota paginada em lotes; filtros da interface continuam no cliente sobre o catálogo carregado. Pesquisa/indexação dedicada e volumes elevados não fazem parte desta entrega.
- A última edição retirada permanece armazenada, protegida por RLS, para continuidade editorial; elimina-se por cascade quando o proprietário elimina a obra. Não há histórico público de edições.
- Capas usam composição tipográfica; HQ/Mangá têm apenas guião textual. Sem R2, comentários, avaliações ou métricas inventadas.

## Revisão final anterior à instalação — 11/11/2026

Não foi identificado um defeito que justificasse alterar novamente a migration ou as funcionalidades.

- O `GRANT SELECT ON TABLE public.works TO authenticated` da F2.1 abrange também colunas adicionadas posteriormente. `read_private_work()` continua `SECURITY INVOKER`, com `search_path` vazio, e consegue devolver os novos campos ao proprietário. RLS continua a ocultar as linhas alheias. Os campos novos não recebem INSERT/UPDATE direto.
- Há uma única trigger habilitada de revisão, com incremento único. Arquivar uma obra publicada é rejeitado; retirar, arquivar e restaurar preservam dados e identificadores.
- A cópia privada e o snapshot público são independentes. Foi reforçado o teste para comparar **todo** o snapshot após editar metadados e conteúdo privados.
- A RPC continua protegida por `auth.uid()`, bloqueio da obra, revisão esperada e bloqueio/recibo por utilizador e operação. Foram acrescentadas verificações explícitas de ausência de claim e reutilização de chave com outra ação.
- Os testes SQL F3.1 e os três cenários de regressão editorial com F3.1 passaram. Não foi executado SQL remoto. As limitações de teste de concorrência real e PostgREST/JWT descritas acima permanecem; esta revisão não certifica produção.

Alteração desta revisão: reforço de `scripts/validate-publication.mjs` e atualização deste relatório. A migration e o código funcional permaneceram inalterados.
