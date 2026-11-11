# F2.1 — Persistência de rascunhos privados

## Estado e âmbito

Implementação local, preparada para revisão. Nenhum SQL foi executado no projeto remoto `dlwsjfqijrsmwejsmuts`. Nenhum deploy, commit ou push. Auth e perfis não foram reconstruídos nem tiveram código alterado. As alterações anteriores da F1.2 e o relatório F1 foram preservados.

O marco implementado é guardar **metadados de obras** no Supabase e recuperá-los por utilizador. A confirmação real entre dispositivos fica pendente da aplicação manual da migração e de um teste autorizado no projeto correto. Testes HTTP usam o SDK oficial com respostas simuladas; testes SQL usam PostgreSQL local/PGlite com Auth simulado.

## Ficheiros desta fase

- `supabase/migrations/20261111000000_create_private_works.sql`: esquema e segurança.
- `src/foundation/features/studio/worksRepository.ts`: operações Supabase e mapeamento dos contratos.
- `src/foundation/features/studio/worksController.ts`: cache em memória, estados, exclusão de respostas antigas e serialização de gravações.
- `src/foundation/features/studio/RemoteWorksProvider.tsx`: ligação à identidade existente e ciclo de vida da conta.
- `src/foundation/features/studio/WorkMetadataForm.tsx`: edição explícita com confirmação de gravação.
- `src/foundation/features/studio/types.ts` e `store.ts`: origem remota opcional e composição com arquivo local preservado.
- `src/foundation/app/providers.tsx`: provider de obras dentro do isolamento local existente.
- `src/foundation/features/local/LocalDataTools.tsx`: esclarece que a ausência de sincronização se refere às cópias locais.
- `src/foundation/pages/Studio.tsx`: criação remota, gestão, listagem, origem dos dados e eliminação com confirmação.
- `scripts/works.test.ts`, `scripts/works.browser.html`, `scripts/works.browser.tsx`: regressão de serviço/controller e fluxos reais de interface com backend simulado.
- `scripts/validate-private-works.mjs`: segurança SQL num banco descartável.

## Tabela e propriedade

`public.works` contém UUID PK gerado no servidor; `owner_id` com default `auth.uid()` e FK para `auth.users`; título; slug estável e único por proprietário; description/sinopse; type/formato; status; visibility; idioma; subtítulo; género; tags; classificação etária; avisos; cor da capa; revisão e timestamps.

Os campos adicionais correspondem aos metadados efetivamente recolhidos no wizard. O modo de leitura deriva do formato, sem duplicação de estado. Não existe coluna de capítulos, conteúdo, páginas ou uploads nesta tabela.

`status` só aceita `draft`, e `visibility` só aceita `private`, inclusive para DML elevado normal. Não existe operação de publicação, nem política pública. Owner representa propriedade técnica, não autoria apresentada ou publicador editorial. O catálogo inaugural permanece estático e não é importado ou atribuído ao utilizador.

A FK usa `ON DELETE RESTRICT`: uma futura eliminação administrativa de conta deve tratar previamente as suas obras. Não há alteração de fornecedores, passwords ou sessões. A FK cria os mecanismos internos normais de integridade referencial do PostgreSQL; não substitui nenhuma trigger personalizada de Auth.

## RLS, grants e funções

- RLS ativa, com SELECT/INSERT/UPDATE/DELETE apenas para `authenticated` e próprio owner.
- INSERT tem default de proprietário validado por RLS; não concede escrever `owner_id`, `status`, `visibility`, UUID, revisão ou timestamps.
- UPDATE só concede os metadados editáveis. Slug e identidade permanecem estáveis.
- Trigger SECURITY INVOKER impede transferência de identidade/propriedade, conserva created_at e gera revisão/timestamp no servidor.
- Função da trigger com search_path vazio; EXECUTE revogado de PUBLIC, anon e authenticated, na transação da instalação.
- anon e PUBLIC sem acesso à tabela; authenticated com SELECT/DELETE e INSERT/UPDATE por coluna.
- Sem service_role no frontend e sem nova SECURITY DEFINER.

Revisão otimista no UPDATE/DELETE: uma gravação sobre versão antiga não anuncia sucesso. O formulário permanece preenchido no erro; deve-se copiar as alterações e atualizar a lista para resolver o conflito. A RLS é a autoridade; filtros por owner e validações do cliente são defesa adicional.

## Fluxo da aplicação

1. O provider usa a identidade autenticada existente; não restaura tokens por um mecanismo paralelo.
2. O repositório captura a sessão do SDK, confirma a identidade com getUser(token) e fixa esse token nos pedidos da operação para evitar mudança de conta entre validação e envio. Consulta works filtrando o owner. A listagem usa páginas de 100 registos, sem truncar silenciosamente a primeira página.
3. O wizard grava exclusivamente metadados remotos e navega só depois da resposta de sucesso.
4. Uma nova sessão cria novo cache e recupera a tabela, mantendo as rotas por UUID.
5. A gestão permite editar título, subtítulo, sinopse, formato, idioma, género, tags, classificação, avisos e cor.
6. A eliminação exige confirmação; só remove da lista após resposta de sucesso.
7. Erros não provocam fallback de gravação local nem simulação de sucesso. Há carregamento, gravação e atualização manual.
8. Ao mudar de conta, respostas pendentes da conta anterior não preenchem o novo cache.

Rascunhos antigos continuam no namespace local original, identificados como locais; os editores anteriores permanecem para esses dados. Não há importação, envio, atribuição de dono ou eliminação automáticos. Visitantes não criam novos rascunhos remotos. Arquivo local continua acessível à identidade/namespace a que já pertencia.

Os novos rascunhos remotos têm zero capítulos. Criação de capítulos, duplicação e arquivo remotos não estão disponíveis. A UI não envia o utilizador para um capítulo fictício. Imagens continuam locais e o R2 não foi integrado.

## Instalação manual futura — exige autorização

1. Confirmar o projeto `dlwsjfqijrsmwejsmuts`, o executor administrativo e backup/restauro.
2. Confirmar ausência de conflito de nomes com `public.works` e `public.guard_private_work_update()`. Se existir qualquer um, parar e comparar; não eliminar nem reaplicar cegamente.
3. Rever os grants padrão, RLS e eventuais papéis herdados. Não assumir que uma verificação como administrador valida RLS de utilizadores.
4. Instalar/validar perfis numa operação separadamente autorizada, caso ainda pendente. A nova tabela depende de Auth, não de profiles; não reaplica migrações de perfis.
5. No SQL Editor, colar e executar **apenas o ficheiro completo** `supabase/migrations/20261111000000_create_private_works.sql`, incluindo BEGIN/COMMIT. Não usar db reset ou db push automático.
6. Executar a validação de leitura abaixo. Verificar notices/erros e que a transação confirmou.
7. Testar pelo frontend com contas autorizadas A/B e duas sessões/dispositivos de A.
8. Registar a versão no histórico da CLI posteriormente, com revisão e autorização próprias; executar no SQL Editor não faz esse registo automaticamente.

### Pré-verificação (somente leitura)

```sql
BEGIN TRANSACTION READ ONLY;
SELECT current_user, to_regclass('auth.users'), to_regprocedure('auth.uid()'),
       to_regclass('public.works'), to_regprocedure('public.guard_private_work_update()');
ROLLBACK;
```

### Validação posterior (somente leitura)

```sql
BEGIN TRANSACTION READ ONLY;
SELECT relrowsecurity FROM pg_class WHERE oid = 'public.works'::regclass;
SELECT policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'works';
SELECT conname, convalidated, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'public.works'::regclass;
SELECT r.rolname,
       has_table_privilege(r.oid, 'public.works', 'SELECT') AS can_select,
       has_table_privilege(r.oid, 'public.works', 'DELETE') AS can_delete,
       has_table_privilege(r.oid, 'public.works', 'TRUNCATE') AS can_truncate,
       has_column_privilege(r.oid, 'public.works', 'title', 'INSERT') AS can_insert_title,
       has_column_privilege(r.oid, 'public.works', 'title', 'UPDATE') AS can_update_title,
       has_column_privilege(r.oid, 'public.works', 'owner_id', 'UPDATE') AS can_update_owner,
       has_column_privilege(r.oid, 'public.works', 'status', 'UPDATE') AS can_publish,
       has_function_privilege(r.oid, 'public.guard_private_work_update()', 'EXECUTE') AS can_call_guard
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated');
SELECT status, visibility, count(*) FROM public.works GROUP BY status, visibility;
ROLLBACK;
```

Esperado: RLS true; quatro políticas próprias; anon sem acessos; authenticated com SELECT/DELETE/title INSERT/UPDATE, sem owner UPDATE, publicação, TRUNCATE ou EXECUTE da função. Somente combinações draft/private. INSERT/UPDATE têm grants por coluna; não exigir que has_table_privilege para essas operações seja true.

## Validação funcional e recuperação

- A cria obra privada, fecha a sessão e a recupera noutra sessão/dispositivo autenticado como A.
- B e anon não consultam nem alteram a obra, inclusive por ID/API direta.
- Atualizar metadados persiste e incrementa revisão; gravação antiga é recusada.
- Eliminar pede confirmação e não elimina rascunhos locais ou catálogo editorial.
- Sem sessão/configuração/migração/rede, a aplicação mostra erro e não inventa sucesso.
- Se houver erro antes do COMMIT, confirmar rollback. Se cair a ligação junto do COMMIT, inventariar antes de repetir. Se a instalação confirmar mas a UI falhar, rever schema/grants/sessão sem desativar RLS ou dar privilégios elevados ao navegador.

## Limitações deliberadas

Sem publicação, capítulos remotos, R2, importação local, coautoria ou atribuição editorial. Metadados não guardados ainda podem perder-se ao fechar a página; erros de gravação mantêm o formulário aberto. Em caso de resposta perdida após COMMIT de criação, atualizar a lista antes de tentar criar novamente: não há reenvio automático nem garantia de idempotência entre tentativas manuais. A listagem paginada pode precisar de atualização perante alterações concorrentes. Eliminação de conta exige política futura por causa da FK RESTRICT.

## Verificações desta fase

Suite Node: 222 testes aprovados, incluindo mudança de token entre validação e envio. Validador SQL: dois cenários aprovados (com e sem profiles), com defaults de grants permissivos, isolamento A/B/anon, escrita sem sessão recusada, propriedade imutável, publicação impossível e revisão. Navegador: cinco cenários aprovados de criação, nova sessão, edição/erro de rede, troca de conta, eliminação confirmada e visitante. Typecheck, build, format:check e diff --check aprovados. Nenhum resultado local é prova de aplicação da migração remota.
