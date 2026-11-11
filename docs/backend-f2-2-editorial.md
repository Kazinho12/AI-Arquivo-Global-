# F2.2 — Gestão editorial e conteúdos persistentes

## Estado e evidência

Implementação local sobre a F2.1, sem aplicação de SQL remoto, db reset, commit, push ou deploy. O projeto de destino informado pelo proprietário é `dlwsjfqijrsmwejsmuts`. O estado remoto não foi inspecionado nesta tarefa. As alterações anteriores de perfis e documentação foram preservadas; nenhum ficheiro de Auth ou perfis foi modificado nesta fase.

As operações da aplicação usam o repositório Supabase real por omissão. Os testes de navegador usam um serviço de teste; os testes HTTP usam o SDK real com HTTP simulado; os testes SQL executam as migrações num PostgreSQL/PGlite descartável, com Auth simulado. Não constituem prova de instalação ou execução no Supabase real.

## Funcionalidades implementadas

- Duplicação transacional de obra e todas as entradas, com novos UUIDs, revisão inicial, slug próprio, título com “(Cópia)” e privacidade preservada.
- Arquivo/desarquivo persistentes por `archived_at`. `status = draft` e `visibility = private` continuam obrigatórios. Não há publicação.
- Eliminação confirmada da obra e entradas por FK em cascata.
- Metadados guardados explicitamente e revisão otimista; atualizar a lista não muda silenciosamente a revisão de base do formulário.
- Listas filtradas por ativo/arquivo/estado/formato e origem conta/local. Não há importação automática.
- Entradas com UUID, título, conteúdo, tipo, posição, estado draft, revisão, alinhamento e timestamps.
- Adicionar, editar, guardar manualmente, duplicar, reordenar e eliminar entradas com confirmação; inclusive eliminar a última entrada.
- Navegação entre entradas e recuperação explícita da última versão persistida.
- Termos adaptados: capítulos para prosa, poemas para poesia e atos/guião para HQ/mangá. Conteúdo visual nesta etapa é texto editorial, sem páginas de imagens ou uploads simulados.
- Contagem das palavras do conteúdo guardado e do número real de entradas nas obras ativas da conta. Catálogo editorial, rascunhos locais e obras arquivadas não entram nessas estatísticas. Sem métricas fictícias de audiência.

## Migration aditiva

Ficheiro: `supabase/migrations/20261111010000_private_editorial_entries.sql`.

Pré-requisito: `20261111000000_create_private_works.sql` aplicada e validada. Não reaplicar as migrações de perfis como parte desta instalação.

### Objetos

| Objeto                                              | Função                                                                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `works.archived_at`                                 | Marca arquivo, sem alterar estado editorial; NULL nos registos antigos                                               |
| `work_entries`                                      | Conteúdo textual e estrutura; FK para works ON DELETE CASCADE                                                        |
| `work_operation_receipts`                           | Recibos mínimos de operações para repetição segura                                                                   |
| `guard_private_work_update()`                       | Preserva identidade/proprietário; revisiona; recusa edição em arquivo e mudança incompatível de formato com entradas |
| `read_private_work(uuid)`                           | Snapshot consistente de obra e entradas ordenadas                                                                    |
| `mutate_private_work(uuid,integer,text,jsonb,uuid)` | Escritas editoriais transacionais e autorizadas                                                                      |

A migration não faz backfill de conteúdos fictícios, não altera identidades existentes e não converte obras locais. O título, sinopse, slug e restante metadata de uma obra F2.1 permanecem existentes. A nova coluna inicia NULL.

Entradas: título 1–200 caracteres, conteúdo até 1 MiB em UTF-8, até 1000 entradas por obra através das operações normais. Posições positivas, únicas por obra com constraint diferível para permitir reordenação atómica. JSON com ordem incompleta, duplicada ou de outra obra é recusado. A revisão da entrada e a revisão agregada da obra detetam conflitos.

Formatos incompatíveis não são convertidos quando existem entradas. O formulário protege o seletor nessas obras; não destrói texto ou estrofes para converter formatos.

## Segurança

- RLS existente de works mantém-se; novas tabelas têm RLS ativa.
- `work_entries`: authenticated só tem SELECT, sujeito à propriedade da obra pai. Não há escrita direta pelo navegador.
- `work_operation_receipts`: nenhum acesso direto de PUBLIC/anon/authenticated e nenhuma policy permissiva. Não guarda conteúdo, metadata completa nem tokens; mantém UUIDs, fingerprint SHA-256 e data.
- `read_private_work`: SECURITY INVOKER, sujeito a grants/RLS e filtro explícito por `auth.uid()`.
- `mutate_private_work`: SECURITY DEFINER, necessário para escrever entradas e arquivo sem conceder DML direto. Só authenticated recebe EXECUTE. PUBLIC e anon ficam sem execução. Cada chamada deriva ator de Auth, bloqueia a obra, verifica owner e revisão, e aceita apenas ações fixas e campos específicos. Não há SQL dinâmico nem owner/role escolhido pelo cliente.
- Guard interna permanece sem EXECUTE para os papéis do navegador.
- Funções com search_path vazio; referências qualificadas. Nenhum service_role no frontend.
- O token de cada operação continua fixado à identidade validada, preservando a proteção da F2.1 contra troca de conta entre verificação e envio.

SECURITY DEFINER não herda a segurança de RLS automaticamente: os checks explícitos de ator/proprietário são obrigatórios. A instalação deve confirmar owner/ACLs reais e testes A/B. Referências: [PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html) e [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Concorrência e retentativas

A mutação bloqueia a linha da obra antes de verificar a revisão. Entrada alterada também exige a sua revisão. Alterações concorrentes não são mescladas silenciosamente: a segunda revisão antiga falha e a UI preserva o texto.

Uma operação tem UUID e fingerprint. Retentar o mesmo pedido com a mesma chave não duplica conteúdo, não incrementa novamente revisões e não repete uma eliminação. Reutilizar a chave com payload diferente falha. Recibos são gravados na mesma transação. O repositório conserva a chave de pedidos não confirmados enquanto está ativo; não há retry automático destrutivo.

Recibos não guardam snapshots antigos: um replay devolve o estado atual autorizado, ou confirmação da eliminação. Se uma cópia já tiver sido eliminada, o retry não a recria. Pedidos intencionalmente novos, com nova chave, continuam operações novas. Após fechar sessão/recriar o repositório, atualizar a lista antes de repetir uma operação de resultado incerto.

Metadados mantêm a API F2.1 com filtro de revisão no UPDATE. Clientes externos também precisam de enviar esse filtro; a trigger gera revisões mas não torna toda escrita SQL externa otimista por si só.

## Editor e proteção contra perda

Gravação manual, sem autosave. “Guardado na conta” só aparece depois da confirmação do serviço. Falhas transitórias de Auth mantêm o controller da identidade conhecida; cada operação continua a validar o token e logout confirmado limpa os buffers. O editor mantém a revisão de base, mostra alterações pendentes, preserva o texto no erro e exige confirmação para eliminar ou substituir pela versão persistida.

Antes de sair por links ou recarregar, há aviso para alterações pendentes. Durante navegação interna por histórico, buffers em memória permitem reabrir o texto não guardado no mesmo separador. Esses buffers são por controller/conta, não enviados automaticamente e limpos ao terminar a sessão, após confirmação de gravação ou eliminação. Não substituem backup e não sobrevivem ao encerramento/recarregamento confirmado. Guardar antes de sair da conta.

Estrutura fica bloqueada enquanto há texto por guardar. Metadados pendentes também bloqueiam duplicação/arquivo e criação de entradas na gestão, evitando navegação acidental sem guardar. Para resolver conflito: copiar alterações, recuperar versão persistida, reaplicar e guardar.

## Ficheiros desta fase

Novos:

- `supabase/migrations/20261111010000_private_editorial_entries.sql`.
- `src/foundation/features/studio/RemoteEntryEditor.tsx`.
- `scripts/validate-editorial-entries.mjs`.
- `docs/backend-f2-2-editorial.md`.

Alterados sobre a F2.1:

- `src/foundation/features/studio/worksRepository.ts`, `worksController.ts` e `RemoteWorksProvider.tsx`.
- `src/foundation/features/studio/WorkMetadataForm.tsx`, `types.ts` e `store.ts`.
- `src/foundation/features/reader/types.ts` (campos opcionais de entradas, preservando leitores locais).
- `src/foundation/pages/Studio.tsx`.
- `scripts/works.test.ts` e `scripts/works.browser.tsx`.

## Instalação remota futura — autorização obrigatória

1. Confirmar projeto e backup/restauro disponível. Executar como administrador de instalação (normalmente postgres no SQL Editor), nunca como anon/authenticated. Tabelas e funções não podem ser propriedade de papéis do navegador ou de papéis herdados por eles.
2. Confirmar F2.1 instalada e comparável ao ficheiro local. Inspecionar colunas, constraints, grants, RLS e a função guard existente; não substituir objetos de origem desconhecida.
3. Confirmar ausência dos novos objetos. Se algum existir, parar e comparar em vez de reaplicar ou eliminar.
4. Abrir o SQL Editor; executar **somente o ficheiro completo** da F2.2 com BEGIN/COMMIT. Não juntar com outra transação e não executar seleções parciais.
5. Rever erros e resultado do COMMIT. Executar verificações abaixo.
6. Validar pela aplicação com contas autorizadas A/B, refresh e outro dispositivo, incluindo conteúdos e arquivo. Instalar/verificar a migration antes de disponibilizar o frontend F2.2.
7. Clientes antigos F2.1 não distinguem arquivo nem mostram entradas; pedir atualização da aplicação. O servidor recusa escrita em obras arquivadas em vez de as restaurar silenciosamente.
8. Registar o histórico da CLI separadamente, apenas depois de confirmar a execução, com autorização própria. Não executar db push ou migration repair automaticamente.

### Pré-verificação — leitura

```sql
BEGIN TRANSACTION READ ONLY;
SELECT current_user, to_regclass('public.works'),
       to_regclass('public.work_entries'),
       to_regclass('public.work_operation_receipts'),
       to_regprocedure('public.guard_private_work_update()'),
       to_regprocedure('public.read_private_work(uuid)'),
       to_regprocedure('public.mutate_private_work(uuid,integer,text,jsonb,uuid)');
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'works'
ORDER BY ordinal_position;
ROLLBACK;
```

### Pós-instalação — leitura

```sql
BEGIN TRANSACTION READ ONLY;
SELECT relname, relrowsecurity FROM pg_class
WHERE oid IN ('public.works'::regclass,'public.work_entries'::regclass,
              'public.work_operation_receipts'::regclass);
SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('works','work_entries','work_operation_receipts');
SELECT conname, convalidated, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.work_entries'::regclass;
SELECT r.rolname,
       has_table_privilege(r.oid,'public.work_entries','SELECT') AS read_entries,
       has_table_privilege(r.oid,'public.work_entries','INSERT') AS insert_entries,
       has_table_privilege(r.oid,'public.work_entries','UPDATE') AS update_entries,
       has_table_privilege(r.oid,'public.work_entries','DELETE') AS delete_entries,
       has_table_privilege(r.oid,'public.work_operation_receipts','SELECT') AS read_receipts,
       has_column_privilege(r.oid,'public.works','owner_id','UPDATE') AS change_owner,
       has_column_privilege(r.oid,'public.works','archived_at','UPDATE') AS direct_archive,
       has_function_privilege(r.oid,'public.read_private_work(uuid)','EXECUTE') AS read_rpc,
       has_function_privilege(r.oid,'public.mutate_private_work(uuid,integer,text,jsonb,uuid)','EXECUTE') AS write_rpc
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated');
SELECT p.oid::regprocedure, pg_get_userbyid(p.proowner), p.prosecdef, p.proconfig
FROM pg_proc p WHERE p.oid IN ('public.guard_private_work_update()'::regprocedure,
 'public.read_private_work(uuid)'::regprocedure,
 'public.mutate_private_work(uuid,integer,text,jsonb,uuid)'::regprocedure);
SELECT status,visibility,count(*) FROM public.works GROUP BY status,visibility;
ROLLBACK;
```

Esperado: RLS ativa; SELECT de entradas e RPCs só para authenticated; sem escrita direta nas entradas, sem leitura de recibos, sem alteração de owner ou arquivo direto. Status/visibilidade apenas draft/private. Se grants herdados contradisserem isto, parar e rever. Consulta como administrador não prova RLS por conta.

## Recuperação

Erro antes do COMMIT deve abortar a migration inteira. Confirmar rollback e causa antes de repetir. Queda de ligação junto do COMMIT exige inventário antes de retentar. Não remover works, dados ou políticas para resolver falhas. Cada operação editorial também é transacional: erro de validação/revisão não deixa cópia parcial, ordem parcial ou recibo falso. Não executar backfills de capítulos ou conteúdo editorial.

## Limitações e pendências

- Não há publicação pública, imagens remotas, R2 ou importação automática.
- Conteúdo é textual; não há anexos/páginas de imagem associados para copiar ou eliminar nesta fase.
- Buffers não guardados são temporários em memória; guardar manualmente antes de fechar sessão.
- Ler snapshots completos por obra privilegia consistência nesta fase; catálogos grandes precisarão de paginação seletiva de conteúdos e métricas agregadas no servidor.
- Até 1000 entradas e 1 MiB por entrada; duplicações grandes precisam de monitorização de duração, quota e limites operacionais no ambiente real.
- Recibos mínimos persistem até eliminação da conta; política futura de retenção/limpeza deve preservar a janela de idempotência aprovada.
- Backups, rate limiting adicional e testes remotos continuam condições operacionais, não foram configurados nesta execução.

## Validação local

Suite Node/SDK, testes de navegador e verificação SQL cobrem F2.1, CRUD, arquivo/restauro, duplicação com novos IDs, conteúdos e ordem, falhas/repetição, rollback, concorrência, A/B/anon, cascata e privacidade. Resultado: 226 testes Node/SDK aprovados, 13 cenários de navegador aprovados e cenário SQL completo aprovado, incluindo chamadas concorrentes com revisão antiga. npm run typecheck, npm run build, npm run format:check e git diff --check aprovados. Nenhuma execução local é certificação do Supabase remoto.
