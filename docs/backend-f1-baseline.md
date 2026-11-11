# Fase F1 — Baseline do backend

Data: 11 de novembro de 2026 (Africa/Maputo).

## 1. Resultado e limites

Baseline local inspecionada na branch `main`, commit `5a0155db19314ca4cd7f1d15e6e3513bcacf7c84`, remoto `https://github.com/Kazinho12/Arquivo-Global.git`. Árvore limpa antes da criação deste relatório. A única alteração autorizada nesta execução é este documento.

**Auth, criação de contas, criação de perfis e reconhecimento de sessões estão reportados como operacionais pelo proprietário.** O código confirma integrações reais; não foram repetidos testes remotos. Preservar esses fluxos, UUIDs, perfis e sessões.

Não foi encontrado acesso administrativo utilizável para inventariar o esquema remoto: não há ferramenta Supabase/PostgreSQL conectada, executáveis `supabase`/`psql`, variáveis de ligação administrativa no ambiente ou vínculo local em `supabase/.temp/project-ref`. Não foram encontrados os diretórios de configuração Supabase consultados nem `supabase/config.toml`. Esta verificação é limitada aos meios disponíveis; não demonstra ausência de acesso do proprietário no painel ou noutro ambiente.

`.env.local` existe, está ignorado e não rastreado. Foram inspecionados apenas os nomes das variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A chave pública serve a aplicação e não concede inventário administrativo de catálogos SQL. Não se tentaram login, recuperação de tokens de navegador ou chamadas de autenticação. Não se expõem valores ou referências privadas do projeto.

**Estado remoto não verificado.** Não houve pedidos ao projeto Supabase, SQL remoto, alterações de configuração ou inspeção do dashboard. As consultas abaixo destinam-se à execução manual autorizada no projeto correto. Não se afirma que uma tabela esteja ausente no servidor por estar ausente no repositório.

### Classes de evidência

- **Verificado localmente:** ficheiros, imports, contratos, SQL e versões consultados nesta F1.
- **Reportado operacional:** criação de contas/perfis e reconhecimento de sessões, segundo o proprietário.
- **Histórico automatizado:** testes das fases anteriores; não foram repetidos nesta tarefa documental nem provam RLS remoto.
- **Não confirmado:** esquema, permissões, migrações aplicadas, SMTP, OAuth e configuração remotos.
- **Proposta:** modelo e sequência F2, ainda sem implementação.

## 2. Inventário e utilização real de Supabase

| Evidência local                                                              | Utilização                                                                                                                           | Expectativa de backend                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `src/main.tsx:3`                                                             | Importa `foundation/app/App`                                                                                                         | Aplicação ativa em `foundation`                        |
| `src/foundation/features/auth/client.ts`                                     | Singleton SDK; sessão persistente, renovação, PKCE; callback automático desativado                                                   | Supabase Auth; o controller processa o retorno         |
| `src/foundation/features/auth/controller.ts`                                 | `getSession`, `getUser`, listener, login, registo, Google, logout local, recuperação, atualização de password, confirmação e reenvio | Endpoints geridos por Auth, não tabelas SQL de produto |
| `src/foundation/features/auth/security.ts`                                   | Destinos internos e limpeza do callback                                                                                              | Preservar regras e ownership do SDK sobre tokens       |
| `src/foundation/features/profile/service.ts:30`                              | Busca por username canónico                                                                                                          | SELECT de `profiles`                                   |
| `src/foundation/features/profile/service.ts:102`                             | Busca por UUID e cache                                                                                                               | SELECT de `profiles`                                   |
| `src/foundation/features/profile/service.ts:162`                             | Upsert por `id`, seguido de SELECT                                                                                                   | INSERT, UPDATE e SELECT do próprio perfil              |
| `src/foundation/features/profile/types.ts`                                   | Username, nome e bio validados                                                                                                       | Constraints equivalentes no servidor                   |
| `src/foundation/features/local/LocalDataBoundary.tsx`                        | Namespace de visitante/conta                                                                                                         | Isolamento local, não autorização SQL                  |
| `src/foundation/features/studio/store.ts`                                    | Obras, capítulos, páginas e atividade                                                                                                | Apenas persistência local                              |
| `src/foundation/features/library/store.ts`                                   | Biblioteca, listas e progresso                                                                                                       | Apenas persistência local                              |
| `src/foundation/features/local/images.tsx`                                   | Imagens em IndexedDB                                                                                                                 | Sem integração R2                                      |
| `src/foundation/data/inaugural.ts` e `src/foundation/lib/worksRepository.ts` | Catálogo editorial                                                                                                                   | Dados estáticos, não SELECT remoto                     |
| `src/lib/supabase.ts`, `src/context/AuthContext.tsx`, `src/lib/api.ts`       | Integração legada, incluindo cliente `/auth/me`                                                                                      | Fora da entrada ativa; não reutilizar sem revisão      |

As três chamadas `.from("profiles")` do serviço são os acessos a tabelas identificados no frontend ativo. Não foram identificados acessos ativos a RPC, Storage, Edge Functions ou Realtime. Não existe backend de obras ativo no repositório. O cliente Worker legado não prova disponibilidade do servidor remoto.

### Contrato esperado de `profiles`

Colunas lidas: `id`, `username`, `display_name`, `bio`, `avatar_url`, `created_at`, `updated_at`. O upsert envia ID, username, nome, bio e data de atualização. A trigger deve manter o timestamp autoritativo. O cliente não usa DELETE de perfil nem invoca a função privilegiada de provisionamento.

A leitura pública é intencional nos scripts. A atualização é do próprio utilizador. RLS não substitui GRANT e GRANT não substitui RLS: ambos precisam de confirmação. O retorno do upsert também depende de SELECT permitido. Avatar é lido, mas não há fluxo remoto completo de upload.

## 3. Migrações locais e objetos esperados

| Ordem | Ficheiro                                                             | Efeito descrito no SQL local                                                 |
| ----- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1     | `supabase/migrations/20261109000000_create_profiles_table.sql`       | Instala perfis, funções, triggers, políticas e backfill                      |
| 2     | `supabase/migrations/20261110000000_harden_profile_provisioning.sql` | Repete estrutura/provisionamento robusto para compatibilidade de instalações |
| 3     | `supabase/migrations/20261110010000_canonical_usernames.sql`         | Verifica colisões, normaliza usernames e impõe unicidade canónica            |

### Tabela e constraints

`public.profiles`: UUID PK/FK para `auth.users(id)` com `ON DELETE CASCADE`; username TEXT UNIQUE NOT NULL, 3–30 caracteres e regex ASCII alfanumérica/underscore; nome obrigatório com 1–60 caracteres; bio opcional com default vazio e até 500 caracteres; avatar opcional; timestamps obrigatórios com defaults.

Índices: PK, unicidade textual original, `idx_profiles_username_lower` e `profiles_username_canonical_unique` funcional único. O índice lower não único pode tornar-se redundante, mas nenhuma remoção é proposta sem medir utilização. A terceira migração adiciona `profiles_username_canonical_check`.

### Funções e triggers

- `handle_profile_updated_at()`: BEFORE UPDATE, atualiza timestamp; `search_path` vazio.
- `ensure_user_profile(uuid,text,jsonb,timestamptz)`: SECURITY DEFINER, `search_path` vazio, preserva perfis existentes, sanitiza nomes, tenta até 64 candidatos com lock consultivo, insere só o que falta e trata falhas sem bloquear o registo.
- `handle_new_user()`: SECURITY DEFINER, chama provisionamento no AFTER INSERT de `auth.users`.
- `normalize_profile_username()`: lower/trim em BEFORE INSERT ou UPDATE de username.
- Triggers esperadas: `on_profile_updated`, `on_auth_user_created`, `normalize_profile_username`.

Os scripts revogam execução de PUBLIC sobre provisionamento e `handle_new_user`. Isso não elimina possíveis grants explícitos anteriores a outros papéis: verificar ACL efetiva, proprietário, superuser/bypass e possibilidade de substituição das funções. Triggers não exigem conceder RPC privilegiada ao navegador.

### Políticas esperadas

| Operação | Política local                                           | Observação                            |
| -------- | -------------------------------------------------------- | ------------------------------------- |
| SELECT   | `Perfis públicos são visíveis por todos`, `USING (true)` | Os campos expostos são públicos       |
| INSERT   | authenticated, `WITH CHECK (auth.uid() = id)`            | Só o próprio perfil                   |
| UPDATE   | authenticated, USING e WITH CHECK com `auth.uid() = id`  | Não transferir identidade             |
| DELETE   | Nenhuma política criada                                  | Não é funcionalidade do cliente atual |

Não há GRANT explícito de tabela nesses scripts. Grants atuais/defaults do projeto são uma dependência por confirmar. Políticas adicionais preexistentes podem alterar o acesso efetivo; as permissivas combinam-se por OR. Verificar o conjunto completo, não apenas os três nomes esperados.

### Compatibilidade e conflitos

1. `CREATE TABLE IF NOT EXISTS` não repara uma tabela existente com tipos, constraints ou colunas diferentes.
2. As duas primeiras migrações substituem funções/triggers/políticas pelos mesmos nomes; reaplicá-las pode sobrescrever customizações legítimas e executar backfill.
3. Migração de username adquire lock e executa UPDATE; não é um diagnóstico de leitura e não será executada nesta F1.
4. Colisões em `lower(btrim(username))` abortam a terceira migração. Resolver individualmente com aprovação; nunca mudar UUIDs ou renomear automaticamente titulares.
5. Normalizar username pode alterar URLs e timestamps. Exige plano de compatibilidade se houver links antigos.
6. Existing profiles são preservados pelo provisionador; erros são diferidos. Um registo bem-sucedido não prova sozinho que toda conta antiga tem perfil.
7. `SECURITY DEFINER` precisa de owner/grants corretos e objetos qualificados; verificar definição real, não apenas o nome.
8. O SQL original contém whitespace histórico. Não foi corrigido: F1 autoriza apenas este relatório.
9. Histórico de migrações e estrutura podem divergir em ambas as direções. Não editar migrações antigas para ajustar um remoto desconhecido.

## 4. Comparação esperado/observado

| Objeto                              | Esperado pelos scripts/código             | Observação remota                                                |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `auth.users` e Auth                 | Identidade gerida Supabase                | Funcional segundo proprietário; metadados não inspecionados      |
| `public.profiles`                   | Colunas e constraints acima               | Perfis funcionais segundo proprietário; definição não confirmada |
| RLS/grants                          | Leitura pública e escrita própria         | Não confirmados                                                  |
| Triggers e funções                  | Provisionamento, normalização e timestamp | Não confirmados                                                  |
| Histórico de migrações              | Três versões locais                       | Não confirmado                                                   |
| `works` / `chapters`                | Não criadas pelas migrações locais        | Existência remota desconhecida                                   |
| SMTP, OAuth, schemas expostos e API | Dependências de configuração              | Não confirmados por SQL local                                    |

**Não há diferença remota comprovada.** Há uma baseline esperada e lacunas de observação. Resultados manuais devem ser anexados com data/projeto confirmado, sem tokens, dados de contas ou dumps pessoais.

O erro antigo de `profiles` não deve motivar reconstrução. O serviço agrupa `PGRST200` e `PGRST204` com erro de tabela: na documentação atual, referem-se respetivamente a relação/cache e coluna; `PGRST205` indica tabela e `42P01` relação indefinida. A versão do PostgREST remoto também não foi verificada. [Erros PostgREST](https://docs.postgrest.org/en/stable/references/errors.html).

## 5. Diagnóstico SQL manual — exclusivamente leitura

Não executado nesta tarefa. Confirmar o projeto no painel. Usar um SQL Editor autorizado; não colar credenciais. Executar cada bloco completo, incluindo `ROLLBACK`. Todos usam transação read-only e limites de tempo; não contêm DDL, DML, DO, execução de funções da aplicação, troca de papel ou alterações persistentes. Se ocorrer erro, fazer ROLLBACK antes do bloco seguinte. Não executar a própria migração como diagnóstico.

Os catálogos abaixo mostram metadados, não conteúdo de contas. Ausência de linhas pode significar objeto ausente, nome diferente ou falta de visibilidade/permissão. Leitura como administrador não valida RLS de utilizadores normais.

### A. Servidor, relações, colunas e RLS

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT current_database() AS database_name, current_user AS inspection_role,
       current_setting('server_version') AS postgres_version,
       current_setting('transaction_read_only') AS read_only;
SELECT n.nspname AS schema_name, c.relname, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f'))
   OR (n.nspname = 'auth' AND c.relname = 'users')
ORDER BY 1,2;
SELECT table_schema, table_name, ordinal_position, column_name,
       data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('profiles','works','chapters')
ORDER BY table_name, ordinal_position;
ROLLBACK;
```

### B. Constraints, índices e políticas completas

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT c.relname AS table_name, con.conname, con.contype,
       con.convalidated, pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('profiles','works','chapters')
ORDER BY 1,2;
SELECT t.relname AS table_name, i.relname AS index_name,
       ix.indisunique, ix.indisvalid, pg_get_indexdef(i.oid) AS definition
FROM pg_index ix JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname IN ('profiles','works','chapters')
ORDER BY 1,2;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('profiles','works','chapters')
ORDER BY tablename, policyname;
ROLLBACK;
```

### C. Triggers, funções e ACL de execução

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT n.nspname AS schema_name, c.relname, t.tgname, t.tgenabled,
       pn.nspname AS function_schema, p.proname,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace pn ON pn.oid = p.pronamespace
WHERE NOT t.tgisinternal AND
 ((n.nspname = 'public' AND c.relname IN ('profiles','works','chapters'))
  OR (n.nspname = 'auth' AND c.relname = 'users'))
ORDER BY 1,2,3;
SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer,
       p.proconfig, p.proacl, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' AND
 p.proname IN ('handle_profile_updated_at','ensure_user_profile',
               'handle_new_user','normalize_profile_username')
ORDER BY 1,2,3;
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       COALESCE(r.rolname, 'PUBLIC') AS grantee, a.privilege_type, a.is_grantable
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
LEFT JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public' AND p.proname IN
 ('handle_profile_updated_at','ensure_user_profile','handle_new_user','normalize_profile_username')
ORDER BY 1,2,3;
ROLLBACK;
```

A definição de funções pode conter configurações particulares. Rever localmente antes de partilhar; nunca publicar eventuais segredos encontrados. Não chamar as funções de provisionamento para as testar nesta fase.

### D. Grants, privilégios efetivos e defaults

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT r.rolname, r.rolsuper, r.rolbypassrls, r.rolinherit
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role');
SELECT grantee, table_schema, table_name, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name IN ('profiles','works','chapters')
ORDER BY table_name, grantee, privilege_type;
SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name IN ('profiles','works','chapters')
ORDER BY table_name, grantee, column_name, privilege_type;
SELECT r.rolname, n.nspname, c.relname,
       has_schema_privilege(r.oid, n.oid, 'USAGE') AS schema_usage,
       has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete
FROM pg_roles r CROSS JOIN pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE r.rolname IN ('anon','authenticated','service_role')
  AND n.nspname = 'public' AND c.relname IN ('profiles','works','chapters')
  AND c.relkind IN ('r','p')
ORDER BY 1,2,3;
SELECT r.rolname, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_roles r CROSS JOIN pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE r.rolname IN ('anon','authenticated','service_role') AND n.nspname = 'public'
 AND p.proname IN ('handle_profile_updated_at','ensure_user_profile',
                  'handle_new_user','normalize_profile_username')
ORDER BY 1,2,3;
SELECT pg_get_userbyid(d.defaclrole) AS owner,
       COALESCE(n.nspname, '(global)') AS schema_name,
       d.defaclobjtype, d.defaclacl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE n.nspname = 'public' OR d.defaclnamespace = 0;
ROLLBACK;
```

Grants efetivos não demonstram que uma linha passa em RLS. Defaults só afetam objetos futuros e dependem do criador. Grants por coluna e associações de papéis também precisam ser considerados na revisão.

### E. Histórico e disponibilidade para checks opcionais

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history,
       to_regclass('public.profiles') AS profiles;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
ORDER BY ordinal_position;
ROLLBACK;
```

Executar o bloco seguinte **apenas se a relação e a coluna `version` existirem e houver permissão**. Não exportar a coluna de statements, que pode incluir SQL operacional sensível.

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
ROLLBACK;
```

Comparar com `20261109000000`, `20261110000000` e `20261110010000`. Uma versão registada não prova ausência de alterações manuais posteriores.

### F. Integridade agregada opcional, sem dados pessoais

Executar **só depois de A confirmar as colunas `id`, `username`, `display_name`, `bio` de profiles e a existência de `auth.users`**, com permissão de leitura apropriada. Pode exigir varrimento de tabelas; respeitar timeout e uma janela adequada. Não listar emails, UUIDs, nomes ou metadados de contas.

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT count(*) AS profile_count,
       count(*) FILTER (WHERE username IS NULL OR char_length(username) NOT BETWEEN 3 AND 30
         OR username !~ '^[a-zA-Z0-9_]+$') AS invalid_usernames,
       count(*) FILTER (WHERE username <> lower(btrim(username))) AS noncanonical_usernames,
       count(*) FILTER (WHERE display_name IS NULL OR char_length(display_name) NOT BETWEEN 1 AND 60) AS invalid_names,
       count(*) FILTER (WHERE char_length(bio) > 500) AS invalid_bios
FROM public.profiles;
SELECT count(*) AS canonical_collision_groups FROM
 (SELECT lower(btrim(username)) FROM public.profiles
  GROUP BY lower(btrim(username)) HAVING count(*) > 1) collisions;
SELECT count(*) AS accounts_without_profile FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
SELECT count(*) AS profiles_without_account FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
ROLLBACK;
```

Uma contagem de perfis em falta pede investigação; não autoriza backfill ou alteração de Auth. Estes SELECTs não simulam JWTs. Testes reais A/B/anónimo ficam para ambiente de teste e autorização específica.

## 6. Riscos de segurança e compatibilidade

| Risco                              | Evidência e alcance                                       | Prioridade / ação proposta                                    |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Esquema remoto desconhecido        | Sem inventário administrativo disponível                  | P0: obter resultados manuais antes de migração                |
| Reaplicar SQL antigo               | Substitui objetos, faz backfill/normalização e locks      | P0: comparar e escrever migração aditiva apenas se necessária |
| Permissões/RLS desconhecidas       | Grants não declarados explicitamente nos scripts          | P0: rever A–D, incluindo políticas adicionais                 |
| Escalada por proprietário editável | Risco futuro de works/chapters, não exploração confirmada | P0: owner imutável no servidor, RLS e privilégios por coluna  |
| SECURITY DEFINER exposto           | ACL remota desconhecida                                   | P0: confirmar EXECUTE e owner, sem executar função            |
| Vite 6.4.5                         | Versão efetiva do lock afetada pelo advisory abaixo       | P0 antes de expor dev server; patch futuro autorizado         |
| Node 18.19.1                       | Runtime atual e linha EOL                                 | P1: migrar para LTS suportada e testar                        |
| Dados locais/editoriais            | Não são persistência remota nem controlo de acesso        | P1: não converter estado visual em publicação                 |
| Atualizações concorrentes          | Store local não é transação remota                        | P1: revisionamento e testes de conflitos                      |

O advisory oficial GHSA-p4f5-76q4-ffq7, publicado em 10/11/2026, inclui Vite 6.4.5 e indica 6.4.6 como correção na linha 6. A execução remota descrita depende de exposição do servidor de desenvolvimento. `vite.config.ts` e `npm run dev` usam loopback 127.0.0.1; não se verificou túnel ou proxy. Não foi executado exploit e não se afirma que o bundle estático tenha a mesma falha. [Advisory oficial](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7).

O campo engines do Vite bloqueado aceita Node 18, mas compatibilidade declarada não significa suporte de segurança. Node 18 terminou suporte; propor Node 24 LTS, validar plugins, npm, testes, browser e build antes de fixar runtime. Não foram alteradas versões, lock ou ambiente. [Releases oficiais Node.js](https://nodejs.org/en/about/previous-releases).

Lock observado: Supabase JS 2.49.8, Auth JS 2.69.1, React Router DOM 6.30.6. Não inferir versão instalada pelo limite inferior do package.json. Não foi executado SCA completo; não há garantia de ausência de outras vulnerabilidades.

A segurança das próximas tabelas requer policies para todos os acessos e validação adicional em caminhos privilegiados; service_role pode contornar RLS. Nunca usar user_metadata editável como papel administrativo. [RLS oficial Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 7. Proposta mínima F2 — não implementada

Escopo inicial recomendado: **rascunhos privados de proprietário único**. Persistir e recuperar noutro dispositivo primeiro; publicação pública, organizações, coautoria, agendamento e R2 têm gates próprios. Não alterar tabelas ou triggers de Auth/perfis para acomodar obras.

### `works`

- `id`: UUID PK gerado no servidor.
- `owner_id`: UUID NOT NULL, referência à identidade Auth existente. Escolher explicitamente política de eliminação: recomendar RESTRICT até existir fluxo de eliminação de conta e media; não bloquear/destruir contas sem plano aprovado.
- `title`, `subtitle`, `synopsis`, `language`, `format`, `reading_mode`, `age_rating`, `content_warnings`, `tags`, `genre` com tipos, defaults e limites aprovados.
- `state`: inicialmente draft/archived, controlado por servidor; não aceitar published antes de existir transação de publicação. Conclusão da narrativa é conceito separado.
- `visibility`: private no escopo inicial; não permitir promoção pública por simples UPDATE arbitrário.
- `revision`: inteiro para concorrência otimista; timestamps do servidor.
- `source`/`external_id`: opcionais, com unicidade delimitada por origem e proprietário para importação consentida. Não tratar IDs locais como UUIDs.
- Índice `(owner_id, updated_at, id)` e FK; slug público só quando contrato de URLs estiver aprovado.

### `chapters`

- UUID PK; `work_id` FK NOT NULL; posição inteira positiva, única por obra.
- Título, `mode`, conteúdo JSONB com versão de esquema e validação estrutural/limites também no servidor. Sem HTML arbitrário e sem URLs temporários local-image como media publicável.
- Revisão e timestamps do servidor; estado inicial draft.
- Unicidade de identificação externa por obra e origem; `cap-1` não é globalmente único.
- Índice por `(work_id, position)`; exclusão de capítulos por cascata de obra apenas se aprovada e sem ignorar futuras referências de assets.
- Reordenação atómica, constraint diferível ou algoritmo transacional explicitamente testado; evitar duplicação temporária de posições.

### Políticas e permissões propostas

| Papel/operação       | Works                                           | Chapters                                                       |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| anon                 | Sem acesso aos rascunhos                        | Sem acesso                                                     |
| authenticated SELECT | `owner_id = auth.uid()`                         | Obra pai pertence a `auth.uid()`                               |
| INSERT               | WITH CHECK próprio owner; defaults privados     | WITH CHECK obra pai própria e campos válidos                   |
| UPDATE               | USING + WITH CHECK proprietário                 | USING + WITH CHECK pai próprio; impedir mover para obra alheia |
| DELETE               | Próprio owner, se escopo de eliminação aprovado | Só capítulo de obra própria                                    |

RLS por si só não impede trocar owner para outro valor permitido por outra policy: negar alteração de owner por grant de coluna ou trigger própria de works, e testar todas as policies em conjunto. Restringir também colunas de publicação/moderação. Não criar trigger em profiles/Auth para isso. Novo conteúdo público exigirá policies adicionais parentais, sem libertar rascunhos ou retirar proteção de contas.

Campos de direitos, autoria original, publicador e proprietário não são equivalentes. No MVP de rascunho pode haver único owner; importação editorial fica bloqueada até aprovar mapeamento da organização. Não criar contas artificiais nem atribuir admin por esse motivo.

### Compatibilidade com dados atuais

Formatos: catálogo inclui mais opções que Studio; aprovar enum/mapa sem eliminar variantes. Datas relativas como "Agora mesmo" não são timestamptz. Preservar origem e import timestamp, sem inventar data histórica. Importação deve gerar UUIDs e guardar mapeamento; ser idempotente e nunca apagar a cópia local antes de ACK remoto. Nenhuma importação automática na F2 inicial.

## 8. Sequência segura F2

| Etapa                      | Entrega proposta                                                    | Verificação/aceitação                                                                                                       | Dependências e autorização                                                                 |
| -------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| F2.0 — fechar evidência    | Resultados A–F revistos, inventário comparado e decisões registadas | Sem diferenças desconhecidas que afetem a nova migração                                                                     | Proprietário confirma projeto e partilha resultados sem segredos                           |
| F2.1 — contrato            | Tipos, limites, propriedade, formatos, concorrência e exclusão      | Exemplos dos quatro modos e IDs locais mapeáveis                                                                            | Aprovar escopo privado e política de eliminação                                            |
| F2.2 — ambiente e tooling  | Runtime LTS e patch Vite compatível; staging/testes isolados        | Typecheck, testes, build e regressão Auth/perfis aprovados                                                                  | Autorização para alterações locais futuras e ambiente de teste                             |
| F2.3 — esquema local       | Nova migração aditiva só para works/chapters e seus objetos         | Instalação limpa e upgrade sobre fixture de perfis; nada altera Auth/perfis                                                 | Não reaplicar antigas nem usar dados pessoais; rever SQL antes de remoto                   |
| F2.4 — segurança           | RLS, grants mínimos, ownership e revisão                            | Anónimo negado; A/B isolados em SELECT/INSERT/UPDATE/DELETE, IDs diretos, troca de owner/pai; RPCs verificadas se existirem | Testar como papéis reais, não apenas administrador/service_role                            |
| F2.5 — integração          | Serviço assíncrono de obras/capítulos ligado ao Studio              | Criar, recarregar e recuperar noutro dispositivo; edição e ordenação consistentes                                           | Alterações futuras em store/types/Studio e novo serviço; preservar leitores e sete layouts |
| F2.6 — migração controlada | Backup restaurável, revisão e aplicação em staging                  | Migração reproduzível; regressão de login/perfis; falhas recuperáveis                                                       | Aprovação específica antes de qualquer SQL remoto                                          |
| F2.7 — fecho               | Evidências, inventário atualizado e plano da fase seguinte          | Sem publicação involuntária; nenhuma perda local                                                                            | Produção/publicação/R2 ficam sujeitos a autorização posterior                              |

Ficheiros futuros prováveis: `src/foundation/features/studio/types.ts`, `store.ts`, serviço/repositório novo, `src/foundation/pages/Studio.tsx`, contratos dos leitores e testes específicos em scripts. Migrações novas receberão versão posterior às existentes; este documento não cria SQL de implementação.

Complexidade relativa: contrato M; esquema/RLS L; integração e concorrência L; importação/editorial e R2 posteriores L/XL. Não há estimativa de prazo sem validar o remoto e o escopo.

Teste crítico: A cria obra privada e dois capítulos; uma segunda sessão/dispositivo de A recupera e edita; B e anon não leem nem alteram nada, inclusive por API direta. UPDATE com revisão antiga falha de forma recuperável. Reordenar não deixa posições duplicadas. Login, perfil e username mantêm comportamento anterior.

## 9. Critérios objetivos para autorizar início da F2

- [ ] Projeto/ambiente confirmado e resultados A–E revistos; F executado se autorizado e pertinente.
- [ ] Diferenças de schema, RLS, grants, funções e histórico classificadas; nenhuma correção implícita em perfis.
- [ ] Estado operacional reportado de Auth/perfis preservado e baseline de regressão definida.
- [ ] Contrato works/chapters aprovado: formatos, propriedade, exclusão, visibilidade e concorrência.
- [ ] Ambiente de teste isolado e plano de backup/restauro definidos antes de aplicação remota.
- [ ] Plano de atualização Node/Vite aprovado antes de expor desenvolvimento.
- [ ] Matriz A/B/anónimo e critérios de aceitação aceites.
- [ ] Autorização explícita para implementar F2. Essa autorização não equivale a aplicar migrações em produção.

**Conclusão:** F1 documental concluída; baseline local verificável e diagnóstico manual preparado. Comparação remota permanece pendente de acesso ou resultados. Não há evidência para declarar Auth/perfis defeituosos nem autorização implícita para mudar o serviço. Aguardar autorização antes de implementar F2.

## 10. Verificação desta entrega

Não foram executados npm test/build ou os validadores SQL: esta alteração é exclusivamente documental. Validação limitada a Markdown/whitespace e confirmação de que apenas este relatório foi criado. Nenhuma migração, código, credencial, conta, configuração remota, commit, push ou deploy foi alterado/executado.
