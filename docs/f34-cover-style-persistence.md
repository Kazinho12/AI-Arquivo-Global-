# F3.4 — Persistência de estilos de capa

Implementação **local**, com ativação desativada por defeito. Não foi executado SQL remoto, deploy, commit ou push. As alterações de estabilização anteriores foram preservadas.

## Auditoria dos contratos e alterações

| Operação                             | Transporte do estilo                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Criação privada                      | `DraftMetadata.coverStyle` → allowlist `cover_style` → INSERT com proprietário e sessão já existentes                   |
| Leitura/recuperação privada          | `read_private_work()` já usa `to_jsonb(w)`; passa a incluir a coluna automaticamente, sob RLS/invoker                   |
| Edição de metadados                  | UPDATE com UUID, proprietário e revisão carregada; a trigger existente incrementa uma única revisão                     |
| Chamadores sem o campo               | Criação usa o default SQL; edição não envia a coluna, preservando o estilo já existente                                 |
| Controlador                          | O controlador existente já transmite metadados e substitui o estado apenas após ACK; não precisou de reconstrução       |
| Duplicação                           | `mutate_private_work()` copia o estilo da edição privada, preservando todas as entradas e contratos de recibos/revisões |
| Publicar/atualizar/republicar        | `publish_private_work()` copia o estilo na mesma transação que confirma o snapshot público                              |
| Retirar                              | Mantém o estilo privado e o snapshot protegido; não transforma uma edição privada em pública                            |
| Detalhes públicos                    | `read_public_work()` acrescenta apenas o campo público permitido                                                        |
| Catálogo/amostras                    | SELECT explícito acrescenta `cover_style` somente no frontend ativado                                                   |
| Pesquisa                             | `search_public_works()` inclui o estilo no conjunto explícito de metadados; filtros e paginação preservados             |
| Facetas/validação de disponibilidade | Não necessitam do estilo; continuam inalteradas                                                                         |
| Capas                                | `Cover` utiliza o estilo do DTO e mantém as imagens das obras inaugurais                                                |

A migration completa está em **`supabase/migrations/20261111040000_persist_cover_styles.sql`**. Acrescenta `cover_style text NOT NULL DEFAULT 'legacy'` a `works` e `published_works`, com CHECK dos seis valores: `legacy`, `minimalist`, `geometric`, `lyric`, `bold`, `monolith`.

Não executa UPDATE de dados antigos: o default constante disponibiliza `legacy`, preservando UUIDs, conteúdo, revisões, datas, recibos e apresentação pública anterior. As constraints e políticas anteriores permanecem. Apenas os grants da nova coluna são adicionados: leitura/inserção/edição da coluna privada para `authenticated`, sob RLS; leitura pública da coluna do snapshot para `anon`/`authenticated`, sob RLS. Não são concedidas escritas na tabela pública.

As quatro RPCs substituídas mantêm **assinaturas e corpos completos anteriores**, com apenas o transporte de estilo acrescentado. Há um teste que compara os corpos com as migrations anteriores removendo essas adições. `mutate_private_work` e `publish_private_work` continuam SECURITY DEFINER com `auth.uid()`, locks, propriedade, revisão, fingerprints e recibos; os leitores e a pesquisa continuam SECURITY INVOKER. Todos mantêm `search_path` vazio e os grants/revogações anteriores. A trigger de revisão não foi modificada.

## Interface e confirmação

- Wizard: envia o estilo selecionado quando a persistência está ativada.
- Editor: inicia com o estilo recebido do servidor, inclui o estilo na deteção de alterações e recupera o valor persistido mediante confirmação.
- O seletor também permite voltar a `legacy` quando ativado.
- Mensagens de gravação só aparecem depois de ACK e sem alterações pendentes. Uma falha não substitui o estilo persistido nem anuncia sucesso.
- Uma alteração privada não muda a capa pública: é necessário confirmar a atualização da publicação, tal como acontece com conteúdo e restantes metadados.

## Compatibilidade e ativação segura

`VITE_ENABLE_COVER_STYLE=false` é o default documentado em `.env.example`. A ausência da variável também desativa a funcionalidade. A flag é de **compatibilidade de aplicação**, não uma autorização de segurança; RLS e grants continuam a decidir o acesso.

No modo desativado:

- SELECTs não referenciam a nova coluna.
- Formulários não enviam estilos para gravação; os seletores são apenas pré-visualização com aviso.
- O repositório rejeita uma tentativa explícita de escrever um estilo com a funcionalidade desligada, em vez de o ignorar silenciosamente.
- DTOs públicos/privados utilizam fallback `legacy`, mesmo se um backend mais recente incluir o campo nas RPCs.
- Não há repetição automática de INSERT/UPDATE perante incompatibilidade de esquema, evitando gravações duplicadas ou perda silenciosa do estilo.

### Procedimento posterior — sujeito a autorização

1. Confirmar o projeto `dlwsjfqijrsmwejsmuts` no painel e obter o backup habitual. Manter o frontend com a flag desligada.
2. Confirmar que F2.1, F2.2, F3.1 e F3.3 estão instaladas. Ler definições e comparar as quatro RPCs com as migrations locais. Se existir divergência não explicada, parar antes de substituir funções.
3. Verificar ausência da nova coluna e registar contagens, revisões e datas para comparação. Não reaplicar migrations anteriores.

```sql
SELECT current_database(),current_user;
SELECT table_name,column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('works','published_works')
ORDER BY table_name,ordinal_position;
SELECT count(*) AS works FROM public.works;
SELECT count(*) AS snapshots FROM public.published_works;
SELECT proname,prosecdef,proconfig,pg_get_functiondef(oid)
FROM pg_proc WHERE oid IN (
 'public.mutate_private_work(uuid,integer,text,jsonb,uuid)'::regprocedure,
 'public.publish_private_work(uuid,integer,text,uuid)'::regprocedure,
 'public.read_public_work(uuid)'::regprocedure,
 'public.search_public_works(jsonb)'::regprocedure);
```

4. Depois de autorização explícita, executar **uma vez o ficheiro SQL completo**, de `BEGIN` a `COMMIT`, no SQL Editor. A migration é transacional e não se destina a reaplicação. Escolher uma janela apropriada para o lock de alteração de tabela/validação das constraints.
5. Validar os objetos e os privilégios sem publicar nenhuma obra:

```sql
SELECT cover_style,count(*) FROM public.works GROUP BY cover_style;
SELECT cover_style,count(*) FROM public.published_works GROUP BY cover_style;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid IN ('public.works'::regclass,'public.published_works'::regclass)
AND conname IN ('works_cover_style_check','published_works_cover_style_check');
SELECT role_name,
 has_column_privilege(role_name,'public.works','cover_style','SELECT') AS private_select,
 has_column_privilege(role_name,'public.works','cover_style','INSERT') AS private_insert,
 has_column_privilege(role_name,'public.works','cover_style','UPDATE') AS private_update,
 has_column_privilege(role_name,'public.published_works','cover_style','SELECT') AS public_select,
 has_column_privilege(role_name,'public.published_works','cover_style','UPDATE') AS public_update,
 has_column_privilege(role_name,'public.published_works','work_id','SELECT') AS hidden_link
FROM (VALUES('anon'),('authenticated')) roles(role_name);
SELECT tgname,tgenabled,pg_get_triggerdef(oid) FROM pg_trigger
WHERE tgrelid='public.works'::regclass AND NOT tgisinternal;
```

Esperado: obras antigas e snapshots com `legacy`, contagens e revisões anteriores preservadas. Privados: false/true para anon/authenticated; público SELECT true em ambas, UPDATE false e hidden_link false. Uma única trigger de revisão habilitada.

6. Confirmar também que EXECUTE de `PUBLIC` continua revogado, publicação/mutação só para authenticated e leitura/pesquisa para anon/authenticated. Testar consultas públicas de coluna e RPC via PostgREST, com as credenciais públicas já configuradas. Aguardar atualização do schema cache antes de ativar a flag; uma coluna visível no SQL Editor não comprova por si só que a API já a reconhece.
7. Só após estas validações, configurar **`VITE_ENABLE_COVER_STYLE=true`** no frontend e reiniciar o servidor local ou gerar o build autorizado. Variáveis Vite são resolvidas no arranque/build; esta tarefa não modifica `.env.local` nem faz deploy.
8. Com uma obra de teste e autorização para essas escritas, validar criação, edição, recarregamento, recuperação, publicação, edição privada sem atualização pública, atualização confirmada, retirada e republicação. Confirmar a capa em catálogo, pesquisa e detalhes. Verificar outra conta e janela anónima. Não eliminar obras reais como teste.

## Reversão segura

- Se a instalação falhar antes do commit: executar `ROLLBACK` se a sessão estiver abortada e confirmar que o estado anterior permanece. Não selecionar fragmentos da migration.
- Se já estiver instalada: desligar a flag e reconstruir/reiniciar o frontend. As novas colunas, constraints e funções permanecem; estilos guardados não são apagados. A interface apresenta o fallback de compatibilidade até reativação.
- **Não executar DROP COLUMN** como reversão automática. Isso perderia estilos privados e de snapshots e afetaria funções dependentes. Qualquer reversão estrutural exige backup, exportação dos estilos, revisão de dependências e uma migration posterior autorizada.
- Não restaurar snapshots antigos apenas para mudar a apresentação: preservar a separação editorial entre edição privada e publicação confirmada.

## Ficheiros desta implementação

- Migration completa `20261111040000_persist_cover_styles.sql`.
- `src/foundation/features/covers/config.ts` e `.env.example`.
- Tipos em `data/works.ts`, `features/studio/types.ts`; validação em `data/covers.ts`.
- `features/studio/worksRepository.ts`, `features/catalog/repository.ts`.
- `features/studio/WorkMetadataForm.tsx`, `pages/Studio.tsx`, `components/WorkCard.tsx`, `components/WorkCover.tsx`.
- `scripts/cover-style-persistence.test.tsx`, `cover-style-persistence.browser.tsx`, `cover-style-persistence.browser.html`, `validate-cover-styles.mjs`.
- `scripts/run-browser-tests.mjs`: flag exclusiva para ativar/desativar a funcionalidade no ambiente de testes isolado.
- `scripts/validate-editorial-entries.mjs` e `validate-publication.mjs`: opção de aplicar a nova migration antes das regressões SQL.
- Este relatório. As alterações anteriores de estabilização continuam pendentes no Git e não foram descartadas.

## Validação local e pendências

```bash
npm test
npm run typecheck
npm run build
npm run format
npm run format:check
git diff --check
PGLITE_PATH=/caminho/pglite/dist/index.js node scripts/validate-cover-styles.mjs
AG_SQL_COVER_STYLE=1 PGLITE_PATH=/caminho/pglite/dist/index.js node scripts/validate-editorial-entries.mjs
AG_SQL_COVER_STYLE=1 PGLITE_PATH=/caminho/pglite/dist/index.js node scripts/validate-publication.mjs
AG_TEST_COVER_STYLE_ENABLED=1 AG_TEST_PAGE=cover-style-persistence.browser.html node scripts/run-browser-tests.mjs
AG_TEST_COVER_STYLE_ENABLED=0 AG_TEST_PAGE=cover-style-persistence.browser.html node scripts/run-browser-tests.mjs
```

PostgreSQL descartável com claims/roles simuladas; Chrome com backend de teste e Supabase desconfigurado. Cobertura inclui valores inválidos, dados e recibos anteriores, ACL/RLS, estilos em criação/edição/recuperação, conflitos, idempotência, duplicação com capítulos, congelamento do snapshot, publicação/retirada/republicação, pesquisa, imagens inaugurais e compatibilidade sem coluna.

Resultados desta execução:

- `npm test`: **284/284 aprovados**, incluindo seis novos testes de persistência e contratos.
- Navegador: **44/44 cenários aprovados** — três com persistência ativada, um com ativação desligada, seis de estabilização, 19 editoriais, dez de leitura e cinco de descoberta.
- SQL descartável: validação específica de estilos aprovada; regressão editorial aprovada nos três estados de trigger; regressão de publicação aprovada com a nova migration instalada.
- `typecheck`, `build`, `format`, `format:check` e `git diff --check`: aprovados.

Os cenários de navegador usam repositórios de teste; os testes dos repositórios usam o SDK Supabase com transporte HTTP simulado. Os testes SQL executam separadamente as funções, constraints e políticas reais das migrations. Esta combinação não substitui um teste integrado no Supabase real.

PostgreSQL/PostgREST reais, schema cache, concorrência entre sessões reais e a instalação remota permanecem por validar depois de autorização. A flag fica desativada por defeito até lá.
