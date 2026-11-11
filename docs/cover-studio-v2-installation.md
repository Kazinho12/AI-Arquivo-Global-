# F3.5 — Ativação do Estúdio de Capas 2.0

Implementação local: 32 estilos modernos da lista aprovada, mais `legacy`; cinco composições por seed, sem aleatoriedade na renderização. A seed 0 de `legacy` mantém a composição anterior.

1. Confirmar o projeto Supabase e backup. Comparar as quatro RPCs remotas com `20261111040000_persist_cover_styles.sql`; parar perante divergências. Esta migration F3.4 é pré-requisito, não deve ser reaplicada.
2. Mediante autorização, executar **todo** `supabase/migrations/20261111050000_cover_studio_v2.sql` (BEGIN–COMMIT). Não executar fragmentos. Acrescenta `cover_seed integer NOT NULL DEFAULT 0`, amplia o CHECK de estilos e preserva RLS/triggers/revisões/recibos/dados.
3. Validar SQL abaixo e testar PostgREST anónimo/autenticado com uma obra de teste autorizada. Aguardar reconhecimento da nova coluna no schema cache.
4. Só depois, ativar `VITE_ENABLE_COVER_STYLE=true` e `VITE_ENABLE_COVER_STUDIO_V2=true` e reiniciar/reconstruir o frontend. Ambas estão desativadas em `.env.example`; `.env.local` não foi alterado.

```sql
SELECT cover_style,cover_seed,count(*) FROM public.works GROUP BY 1,2;
SELECT cover_style,cover_seed,count(*) FROM public.published_works GROUP BY 1,2;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid IN ('public.works'::regclass,'public.published_works'::regclass)
AND conname LIKE '%cover_%';
SELECT role_name,
 has_column_privilege(role_name,'public.works','cover_seed','SELECT') AS private_select,
 has_column_privilege(role_name,'public.works','cover_seed','UPDATE') AS private_update,
 has_column_privilege(role_name,'public.published_works','cover_seed','SELECT') AS snapshot_select,
 has_column_privilege(role_name,'public.published_works','cover_seed','UPDATE') AS snapshot_update
FROM (VALUES('anon'),('authenticated')) r(role_name);
```

Esperado: seeds anteriores = 0; contagens/revisões inalteradas. Coluna privada sob RLS: SELECT/UPDATE apenas authenticated; snapshot SELECT para ambos, UPDATE para nenhum. RPCs substituídas integralmente: `mutate_private_work`, `publish_private_work`, `read_public_work`, `search_public_works`; apenas o transporte de seed é acrescentado. Leitura privada inclui automaticamente a coluna.

Reversão: antes do commit SQL, ROLLBACK. Depois, desligar a flag V2 e reiniciar/reconstruir; **manter colunas e dados**. O modo anterior não consulta/escreve `cover_seed`, apresenta fallback e preserva capas de versão mais recente ao editar outros metadados. Não fazer DROP COLUMN nem restauro destrutivo automaticamente.

Validação local usa PostgreSQL descartável e backend de navegador isolado. Instalação real, permissões efetivas remotas, schema cache e fluxos integrados no Supabase permanecem pendentes de autorização. O Hero só usa snapshots elegíveis, nunca títulos/autores de substituição; vagas neutras são decorativas.

Revisão final: a confirmação de metadados usa UPDATE via PostgREST (`worksRepository.update`), não `mutate_private_work`. O payload inclui `cover_seed` com a V2 ativada; filtros de proprietário/UUID/revisão, RLS e a trigger existente protegem a gravação. `read_private_work` recupera a seed; a RPC de publicação copia-a explicitamente para o snapshot. A comparação automática das quatro RPCs com a F3.4 confirma que apenas o transporte de seed foi acrescentado. Testes locais verificam também os nomes das quatro constraints de estilo/seed, preservação exata das políticas/RLS e ausência de EXECUTE para PUBLIC. A instalação permanece condicionada aos pré-requisitos acima; não foi executado SQL remoto.
