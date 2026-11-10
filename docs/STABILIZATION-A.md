# Etapa A — estabilização local

## Base e âmbito

Base: branch `main`, HEAD `2261efa52ba1d890f015ed47c06793a4ab1e9792`, árvore inicialmente limpa. As Fases 1–5 foram revalidadas no código; AG-01 a AG-08 continuavam presentes. Não houve pull, reset, merge, rebase, commit, push, alteração Supabase/Cloudflare ou migração remota.

As 57 rotas, sete layouts, AuthController, fluxos Google/PKCE e navegação principal são preservados. Não foi adicionado backend nem dependência de produção.

## Chaves anteriores e migração não destrutiva

Antes da alteração, o Estúdio usava `ag_studio_works_v1`, `ag_studio_activities_v1`, `ag_studio_media_v1`; a biblioteca usava `ag_library_entries_v1`, `ag_library_lists_v1`. Essas cinco chaves continuam intactas e não são lidas como dados da conta atual.

O novo formato é `ag:v2:<espaço codificado>:<chave anterior>`. O espaço é `guest` ou `user:<id Supabase>`. Durante a inicialização de Auth, o conteúdo local fica oculto. Uma falha operacional conserva o espaço da identidade que o controlador ainda mantém, ou o de visitante se não há identidade; a UI Auth permanece disponível para nova tentativa. A troca de conta desmonta o conteúdo anterior antes de mostrar o novo. Ações já capturadas mantêm o espaço de origem; operações assíncronas de seleção de imagens verificam a sessão antes de alterar metadados.

Exemplos demonstrativos continuam disponíveis para visitantes; contas novas começam sem rascunhos ou bibliotecas de outra pessoa. O isolamento é uma proteção da interface, não encriptação ou autorização de servidor: o perfil do navegador pode ler o seu armazenamento.

A secção **Cópias e recuperação de dados locais**, no Estúdio e na conta, permite:

1. Exportar JSON v2 com textos, biblioteca e imagens disponíveis, incluindo alterações apenas em memória.
2. Exportar as cinco chaves antigas em formato bruto para revisão.
3. Recuperar legado ou importar uma cópia v2, após confirmação explícita de propriedade e do espaço de destino.
4. Repetir gravações de texto que falharam.

A recuperação não apaga originais. Obras com IDs em conflito são importadas como cópias com novo ID; referências de atividades/media são ajustadas. Outros registos com identificador já existente no destino são ignorados, conforme a confirmação informa; o JSON original permanece a fonte de recuperação dessas versões. Listas/entradas antigas não são atribuídas automaticamente a contas. Não se deve importar dados que pertençam a outra pessoa num navegador partilhado.

JSON inválido na nova chave é preservado e bloqueia a sobrescrita dessa chave. A edição continua em memória e a exportação inclui o original bruto quando acessível. Rever o original antes de qualquer reparação manual. Em armazenamento bloqueado/quota, manter a aba aberta e exportar; fechar a sessão do navegador sem cópia pode perder alterações em memória. Os dados não são sincronizados entre dispositivos.

## AG-01 e AG-02

Comentários e avaliações mantêm as chaves existentes `ag_comments_<obra>` e `ag_reviews_<obra>`. Um componente interno com chave por obra remonta formulário/estado/efeitos quando o parâmetro muda; nunca grava o estado anterior sob o novo ID. Continuam demonstrativos e locais, sem identidade verificada.

As leituras dos stores usam cópias e validação estrutural. As escritas atualizam primeiro a memória, devolvem resultado e notificam a interface mesmo em falha. O Estúdio mostra aviso, identifica alterações apenas em memória e oferece exportação/repetição. Os editores deixam de apresentar o estado normal quando existe falha. Aviso de saída protege alterações em memória enquanto as ferramentas locais estão montadas.

## AG-05

Os quatro leitores públicos registam uma única entrada por obra. Guardam capítulo/poema, posição proporcional ou página, data ISO e estado. O histórico considera leituras iniciadas mesmo com 0%. O progresso global nunca diminui ao revisitar unidades; a última posição permite retomar. A conclusão de unidades curtas pode ser indicada pelo botão **Marcar capítulo/poema como lido**. No modo visual vertical, o scroll identifica a página visível. Os leitores usados como pré-visualização no Estúdio não escrevem na biblioteca.

## AG-08

IndexedDB `arquivo-global-local-v2`, object store `images`, conserva binários por espaço/ID. Os metadados usam `local-image:<id>`; não são criados novos metadados com URLs `blob:` duráveis. `LocalImage` resolve uma referência para um URL temporário e revoga-o ao mudar de imagem ou desmontar.

Tipos aceites: PNG, JPEG, WebP, GIF e AVIF, até 10 MiB por ficheiro. São verificados MIME, dimensão em bytes e assinatura. Não há upload R2. O adaptador de binários está isolado para futura substituição. Falhas IndexedDB/quota preservam o blob em memória e mostram aviso. A cópia JSON inclui os binários como base64; importa-os antes de ligar metadados. Imagens existentes com o mesmo ID no destino não são sobrescritas. Importações têm limite de 80 MiB; grandes bibliotecas precisarão de exportação em lotes numa etapa posterior.

URLs `blob:` antigos não contêm os bytes de uma imagem. Uma referência de uma sessão já terminada não pode ser reconstruída a partir do localStorage: o ficheiro original terá de ser novamente selecionado. Os registos legados não são apagados. Cópias/exportações podem conter material privado: guardá-las num local adequado.

A remoção de media elimina o metadado; não elimina automaticamente o binário, porque outras páginas/cópias podem referenciá-lo. Uma futura limpeza de órfãos deverá verificar todas as referências e exigir ação explícita.

## AG-03 e AG-04 — SQL local, aplicação manual futura

Há dois caminhos preparados:

- Base revista: `20261109000000_create_profiles_table.sql`, para instalações novas.
- Migração posterior: `20261110000000_harden_profile_provisioning.sql`, compatível com a tabela anterior existente e também com a sua ausência.

Não se pressupõe qual está aplicada remotamente. Antes de aplicar qualquer uma, o proprietário deve confirmar o histórico de migrações, esquema/constraints reais, triggers, proprietário das funções e políticas adicionais. Fazer cópia da tabela e testar numa base local/de ensaio. Numa instalação nova, a sequência cronológica é suportada. Se a versão anterior já foi aplicada, usar a migração posterior; não editar o histórico remoto para fingir que a base revista foi executada.

A função `ensure_user_profile` normaliza e limita nomes, trata vazios, tenta nomes com sufixos derivados do UUID e serializa nomes concorrentes. `search_path` fica vazio e objetos são qualificados. A função auxiliar não é executável por PUBLIC. RLS mantém leitura pública e escrita apenas do próprio ID. Não são eliminados perfis ou alterados valores de perfis existentes.

O backfill trata apenas contas sem perfil, com isolamento por registo. Uma falha inesperada produz warning sem metadata sensível e deixa o perfil pendente, sem impedir o registo Auth nem os restantes perfis. Esses casos devem ser identificados e recuperados depois; não se promete que todo erro de infraestrutura permita criar um perfil.

Verificações de integridade (somente quando autorizadas; não executadas remotamente nesta etapa):

```sql
-- Contas ainda sem perfil
SELECT u.id FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;
-- Colisões antigas por caixa; a migração preserva esses perfis
SELECT lower(username), count(*) FROM public.profiles GROUP BY lower(username) HAVING count(*) > 1;
-- Limites e caracteres
SELECT id FROM public.profiles WHERE username !~ '^[a-zA-Z0-9_]{3,30}$'
  OR char_length(display_name) NOT BETWEEN 1 AND 60;
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
```

Não criar um índice único em `lower(username)` antes de resolver manualmente eventuais colisões antigas. A Etapa A não renomeia perfis existentes.

## Testes

- `scripts/stabilization.test.ts`: isolamento, falhas de leitura/escrita/quota, exportação, confirmação/legado, corrupção preservada, progresso dos quatro modos, validação de imagens, fallback em memória e contratos SQL.
- `npm run test:browser`: Chrome headless com perfil temporário e servidor local; navegação A/B, AuthProvider, avisos/recuperação, quatro leitores, IndexedDB, object URLs, privacidade e recarregamento real.
- `scripts/validate-profile-migrations.mjs`: PostgreSQL descartável via PGlite instalado fora do projeto. Definir `PGLITE_PATH` para o `dist/index.js` da ferramenta. Testa instalação nova e versão original aplicada, reexecução, limites, colisões, preservação, falhas por registo e RLS. Não liga a serviços remotos.

Resultados reais da execução são registados no relatório final; a presença dos testes não significa aprovação.

## Etapa B

Continuam fora desta etapa: integração remota de obras/biblioteca, publicação, correção geral dos P2, preferências globais, regras/política completas, moderação, R2, sincronização e resolução de conflitos entre abas concorrentes. Fazer a verificação atualizada de dependências e o endurecimento de configuração de desenvolvimento antes de expor ambientes de teste.

## Resultado final executado em 10/11/2026

| Verificação            | Resultado                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Aprovado                                                                                |
| `npm test`             | 173 aprovados; 0 falhados; 0 ignorados (160 anteriores + 13 novos)                      |
| `npm run test:browser` | 14 cenários aprovados no Chrome headless; perfil temporário; inclui recarregamento real |
| SQL local/PGlite       | 2 cenários aprovados: instalação nova e migração original já aplicada                   |
| `npm run build`        | Aprovado; Vite 6.4.5                                                                    |
| `npm run format:check` | Aprovado                                                                                |
| `git diff --check`     | Aprovado                                                                                |

AG-01, AG-02, AG-03, AG-04, AG-05, AG-06, AG-07 e AG-08: **Corrigido no âmbito local**. O estado remoto Supabase/Cloudflare e a aplicação SQL continuam **não verificados**, por limite explícito desta etapa.

As dependências foram instaladas por `npm ci --ignore-scripts` usando o lockfile existente; houve falhas/repetições de rede antes do sucesso. Não houve alteração de versões ou lockfiles. PGlite foi instalado somente numa pasta de artefactos fora do projeto para validar SQL. O runner Chrome usa o pacote `ws` já presente no lockfile, sem adicionar dependência. TypeScript, testes e build exigiram permissões do ambiente para processos/IPC; nenhum serviço do projeto foi chamado remotamente.

O teste Auth no Chrome também verifica que um erro de login não oculta a aplicação nem impede nova tentativa. Uma execução intermediária de navegador foi invalidada por HMR durante alterações; a execução final foi repetida sem edições em curso e terminou com os 14 casos aprovados.

O SQL foi testado com esquema Auth e papéis locais simulados no PostgreSQL, incluindo políticas RLS. Não substitui a verificação de permissões, triggers adicionais e configuração específicas do Supabase real, nem um ensaio concorrente em múltiplas ligações. Os testes Chrome verificam comportamento, não uma auditoria visual completa em todos os navegadores/dispositivos.

O HEAD permanece `2261efa`; as alterações ficam na árvore de trabalho para revisão. Não houve commit ou push.

## Ficheiros alterados/adicionados

- `README.md`
- `VALIDATION.md`
- `docs/STABILIZATION-A.md`
- `package.json`
- `scripts/run-browser-tests.mjs`
- `scripts/stabilization.browser.html`
- `scripts/stabilization.browser.tsx`
- `scripts/stabilization.test.ts`
- `scripts/validate-profile-migrations.mjs`
- `src/foundation/app/layouts.tsx`
- `src/foundation/app/providers.tsx`
- `src/foundation/features/library/store.ts`
- `src/foundation/features/library/types.ts`
- `src/foundation/features/local/LocalDataBoundary.tsx`
- `src/foundation/features/local/LocalDataTools.tsx`
- `src/foundation/features/local/images.tsx`
- `src/foundation/features/local/persistence.ts`
- `src/foundation/features/local/validation.ts`
- `src/foundation/features/reader/ComicReader.tsx`
- `src/foundation/features/reader/MangaReader.tsx`
- `src/foundation/features/reader/PoetryReader.tsx`
- `src/foundation/features/reader/ProseReader.tsx`
- `src/foundation/features/reader/progress.tsx`
- `src/foundation/features/studio/HybridProseEditor.tsx`
- `src/foundation/features/studio/PoetryEditor.tsx`
- `src/foundation/features/studio/VisualSequencer.tsx`
- `src/foundation/features/studio/store.ts`
- `src/foundation/pages/Library.tsx`
- `src/foundation/pages/Reader.tsx`
- `src/foundation/pages/Settings.tsx`
- `src/foundation/pages/Studio.tsx`
- `supabase/migrations/20261109000000_create_profiles_table.sql`
- `supabase/migrations/20261110000000_harden_profile_provisioning.sql`
