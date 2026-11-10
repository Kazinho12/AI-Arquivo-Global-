# Arquitetura e estado funcional — Arquivo Global 2.0

Referência: `main`, commit `a2d6ba1649d7c3cca57bf0128a6629a723f605d1`, revisto em 10/11/2026. Este documento descreve o código atual; os relatórios [A](STABILIZATION-A.md) e [B](STABILIZATION-B.md) preservam decisões históricas. Instalação/comandos estão no [README](../README.md) e resultados em [VALIDATION](../VALIDATION.md).

## Entrada e fronteiras

```text
main.tsx → foundation/app/App.tsx
  Providers
    ThemeContext + ToastContext
    PreferenceEffects
    AuthProvider → AuthController → SDK Supabase Auth
      LocalDataBoundary → espaço guest / user:<id>
        BrowserRouter → ApplicationRoutes → sete layouts → páginas lazy
```

A SPA usa `BrowserRouter`; não há servidor de renderização SSR implementado. Providers, componentes e hidratação são exercitados pelos testes. O TypeScript inclui `src/main.tsx`, `src/foundation`, configuração Vite e scripts; não certifica todo o código legado.

Há quatro circuitos de dados distintos:

| Área               | Fonte real no código                            | Limite                                                                         |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Descoberta         | `data/works.ts` → `WorksRepository`             | Oito obras/autores fictícios; sem consulta remota                              |
| Leitura pública    | `reader/data.ts`, validado contra o repositório | Capítulos/páginas demo; amostra para obras conhecidas sem conteúdo detalhado   |
| Biblioteca/Estúdio | Stores → infraestrutura `features/local`        | Metadados localStorage, imagens IndexedDB; sem publicação/sincronização remota |
| Conta/perfil       | Supabase Auth e serviço `profiles`              | Código de integração presente; aplicação/configuração remota não certificada   |

Criar ou marcar uma obra como publicada no Estúdio não modifica o catálogo estático. Essa ligação é arquitetura planeada. O Worker em `src/lib/api.ts`, o cliente/contexto Supabase anteriores e as telas legadas não são importados pela entrada ativa. R2 não tem adaptador de upload ativo.

## Layouts e providers

| Layout             | Utilização                                | Proteção efetiva                                                    |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------- |
| `PublicLayout`     | Descoberta, perfis, informação/comunidade | Aberto; algumas telas são placeholders                              |
| `AuthLayout`       | Seis fluxos Auth                          | Operações dependem de configuração/sessão/serviço                   |
| `ReaderLayout`     | Leitores, comentários e avaliações demo   | Leitura aberta; valida obra/capítulo/modo                           |
| `AccountLayout`    | Biblioteca, perfil e definições           | Biblioteca é local; edição de perfil verifica Auth e depende de RLS |
| `StudioLayout`     | Ferramentas de autoria locais             | Admite visitante; dados separados por espaço                        |
| `ModerationLayout` | Duas rotas de moderação                   | Apenas indisponibilidade; sem ferramenta ou dado administrativo     |
| `SystemLayout`     | Sete rotas de sistema                     | Apenas indisponibilidade; sem API administrativa                    |

Os nomes de layout não são guardas de autorização. Para futuras operações remotas, o servidor deverá verificar identidade, propriedade e papéis. Os placeholders atuais não concedem permissões.

Tema e mensagens são React Context; Auth usa `useSyncExternalStore` sobre um controlador tipado e testável. Preferências e stores têm subscrições. O arranque de tema/Auth tem snapshot neutro compatível com hidratação. `LocalDataBoundary` aguarda a seleção de identidade e remonta o conteúdo ao mudar de conta. Uma falha operacional mantém o espaço da identidade ainda conservada pelo controlador, ou o de visitante se não existir identidade; os fluxos Auth continuam acessíveis.

## Perfis e identidade

O serviço `features/profile/service.ts` contém leitura por ID, leitura por igualdade exata de username e `upsert`. A validação aceita 3–30 caracteres ASCII alfanuméricos/underscore; o contrato canónico usa trim/lowercase. A normalização e unicidade também são preparadas em SQL.

`features/profile/cache.ts` publica o perfil por ID após leitura/save e protege contra uma resposta antiga repor metadata ultrapassada. As definições usam esse perfil para nome e link; a sessão Auth não é reescrita. Um erro de serviço não é convertido em sucesso fictício.

Cada obra demo tem `authorId` explícito, associado ao registo `demoAuthors`. `findAuthorWorks` compara IDs, não nomes ou substrings. Perfis demo usam um namespace de slugs com hífen distinto do username de contas reais. Uma conta real chamada como um autor fictício não herda as obras demo.

A tabela prevista contém `id` ligado a `auth.users`, username, nome público, bio, avatar URL e datas. Não existe upload remoto de avatar implementado. O [guia Auth](AUTHENTICATION.md) cobre configuração e sessão; o estado efetivo de RLS/triggers no serviço remoto deve ser confirmado separadamente.

## Leitores e contrato editorial

| Leitor         | Unidade                          | Capacidades locais                                                |
| -------------- | -------------------------------- | ----------------------------------------------------------------- |
| `ProseReader`  | Capítulo textual                 | Tipografia, ambiente/foco, navegação e posição proporcional       |
| `PoetryReader` | Poema/estrofes/versos            | Preservação de quebras, ênfase inline, alinhamento e preferências |
| `ComicReader`  | Página, modo individual/vertical | Zoom, navegação e imagens referenciadas localmente                |
| `MangaReader`  | Página, modo individual/vertical | RTL/LTR, navegação e imagens locais                               |

As páginas públicas recusam obra desconhecida, capítulo inexistente e modo incompatível, com 404. Editores também validam modo/unidade. As pré-visualizações do Estúdio recebem diretamente os dados locais e não escrevem progresso na biblioteca.

A prosa conserva strings com a marcação da toolbar: `**negrito**`, `*itálico*`, `<u>sublinhado</u>`, parágrafos, quebras, `#`/`##`/`###`, listas, citações e separadores. O renderizador `reader/content.tsx` cria elementos React permitidos; HTML desconhecido é texto escapado. Os títulos são relativos ao título do capítulo, em h2–h4. Não há HTML arbitrário, Markdown completo ou marcação que atravesse blocos; entradas incompletas/ambíguas podem permanecer literais. A profundidade inline é limitada.

`reader/progress.tsx` cria/atualiza uma entrada por obra, com capítulo, posição proporcional/página, data ISO e estado. O progresso global é monotónico ao revisitar unidades; há conclusão explícita para unidades curtas. O modo vertical identifica a página visível. Mudar tipografia/viewport pode alterar a correspondência de uma posição proporcional com o texto: não se trata de um marcador semântico por frase.

## Biblioteca e Estúdio

A biblioteca oferece filtros locais, favoritos, histórico, listas e retoma. Leituras iniciadas podem ter 0% de progresso; o histórico considera a data de leitura. Não há tabela remota de biblioteca nem sincronização entre dispositivos.

O Estúdio oferece wizard, rascunhos, capítulos, duplicação, arquivo/eliminação, prosa, poesia, sequenciamento de páginas, media e pré-visualização. A ordem só pode ser alterada mediante permutação válida dos IDs. Identificadores novos não dependem apenas do milissegundo.

Contagens editoriais de palavras/capítulos são calculadas sobre os dados locais. Leituras estimadas usam uma fórmula, e a conclusão de 78% é fixa em `pages/Studio.tsx`; não são indicadores de audiência real. O estado local `published` não executa publicação pública. Não há autorização editorial ou fila de moderação implementada.

## Persistência local e recuperação

| Dados                  | Chave/formato                                           | Âmbito                                                                |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Tema da interface      | `ag.v2.theme`                                           | Navegador                                                             |
| Preferências           | `ag_preferences_v1`, envelope v1                        | Conforto do navegador; global e overrides por formato                 |
| Obras/atividades/media | `ag:v2:<espaço codificado>:ag_studio_*_v1`, payload v3  | `guest` ou `user:<id>`                                                |
| Entradas/listas        | `ag:v2:<espaço codificado>:ag_library_*_v1`, payload v3 | Mesmo isolamento                                                      |
| Imagens                | IndexedDB `arquivo-global-local-v2`, store `images`     | Chave por espaço/ID; referência `local-image:<id>` nos metadados      |
| Comentários/avaliações | `ag_comments_<obra>`, `ag_reviews_<obra>`               | Demonstração por obra no navegador; não identidade social autenticada |
| Sessão                 | Armazenamento gerido pelo SDK Supabase                  | Identidade e refresh; não faz parte da exportação de rascunhos        |

As cinco chaves globais anteriores de Estúdio/biblioteca permanecem como legado sem proprietário; não são automaticamente atribuídas à conta atual. Visitantes conservam exemplos demonstrativos, e contas novas começam sem conteúdo alheio.

O novo payload de metadados inclui versão 3 e revisão. Arrays válidos da Etapa A continuam legíveis; antes da primeira substituição é preservado um backup `:backup:v2`. Schema inválido ou versão desconhecida bloqueia sobrescrita e permite trabalhar/exportar a cópia em memória. A exportação pública continua em v2, com dados, originais inválidos e alternativas.

Edições atualizam a memória imediatamente; obras/atividades são agrupadas por 300 ms no navegador. Exportar, mudar de espaço ou sair força a tentativa de gravação. Falhas de quota/acesso mostram aviso; manter a aba aberta e exportar antes de sair. Não há encriptação dos dados locais.

Snapshots estáveis alimentam a UI; mutações recebem cópias. Estatísticas são memorizadas por snapshot. Eventos `storage` atualizam abas sem edições; uma aba com edição própria conserva a sua versão e assinala conflito. Candidatas por aba e cópias de conflito complementam as verificações de revisão, porque localStorage não oferece transações entre processos. Não há fusão automática de capítulos ou garantia de colaboração distribuída.

Em **Cópias e recuperação de dados locais**, o utilizador pode exportar o estado, exportar originais legados, ver cópias ou importar com confirmação explícita de propriedade/destino. Obras em conflito recebem novo ID; outras entradas com ID já existente mantêm a versão do destino. Ler a confirmação e guardar o JSON original. Não apagar manualmente o armazenamento como primeira tentativa de recuperação.

As preferências seguem defaults → global → formato. Uma alteração global remove o override do mesmo campo nos formatos. As chaves antigas de preferências são preservadas e podem ser exportadas nas definições. Movimento reduzido do sistema é respeitado, mesmo quando a escolha local não o ativa.

As imagens aceitam PNG, JPEG, WebP, GIF e AVIF até 10 MiB, com verificação de MIME/tamanho/assinatura. Os object URLs são temporários e revogados pela UI, não referências duráveis. Falha IndexedDB conserva o blob em memória e alerta. A cópia JSON pode incluir imagens base64; o importador tem limite de 80 MiB/500 imagens. URLs blob antigos expirados não permitem reconstruir bytes: é preciso selecionar novamente o ficheiro original.

Cópias e binários órfãos não são eliminados automaticamente para não apagar referências utilizadas por rascunhos/cópias. Consomem quota e necessitam de revisão futura. Dados/ficheiros não são enviados a R2. A alteração de conta oculta conteúdo da conta anterior na UI, mas quem controla o perfil do navegador pode aceder ao armazenamento diretamente.

## Matriz de funcionalidades

“Implementada” refere-se ao âmbito descrito na linha, não à existência de backend de produção. “Testes” identifica verificações reais do repositório; resultados atuais estão em [VALIDATION](../VALIDATION.md).

| Funcionalidade                               | Frontend                         | Backend                      | Persistência                  | Testes                                   | Estado        |
| -------------------------------------------- | -------------------------------- | ---------------------------- | ----------------------------- | ---------------------------------------- | ------------- |
| Navegação, sete layouts e temas              | Ativo                            | Desnecessário                | Tema local                    | Contrato de rotas, SSR e hidratação      | Implementada  |
| Catálogo de exemplos                         | Nove telas de descoberta         | Nenhum de obras              | Oito obras estáticas          | Regras e SSR                             | Demonstrativa |
| Pesquisa/filtros/paginação locais            | Combináveis por URL              | Nenhum                       | Query string                  | Funções puras e SSR                      | Implementada  |
| Tags/categorias locais                       | Derivadas do catálogo            | Nenhum                       | Estática/URL                  | Contagens/filtros                        | Implementada  |
| Tendências                                   | Seleções editoriais manuais      | Nenhum de métricas           | Estática                      | SSR/seleção                              | Demonstrativa |
| Registo/login/e-mail                         | Métodos Supabase                 | Serviço externo condicionado | SDK                           | Mocks + SDK com HTTP simulado            | Parcial       |
| Google OAuth                                 | Delegação SDK/PKCE               | Fornecedor a configurar      | SDK                           | Mock de redirect e erro                  | Parcial       |
| Perfil público/edição                        | Serviço e cache por ID           | Tabela profiles se aplicada  | Supabase condicionado         | Validação/mocks/cache/SQL local          | Parcial       |
| Avatar                                       | Exibição por URL                 | Upload ausente               | Campo profiles                | Sem fluxo completo de upload             | Parcial       |
| Quatro leitores demo                         | Prosa/poesia/Comic/Mangá         | Nenhum de conteúdo           | Conteúdo demo e posição local | SSR + Chrome                             | Implementada  |
| Preferências/acessibilidade                  | Contrato partilhado e CSS        | Desnecessário                | Local                         | Migração, estilos, media query e teclado | Implementada  |
| Biblioteca/favoritos/listas                  | Operações locais                 | Nenhum                       | LocalStorage isolado          | Store, SSR e Chrome                      | Implementada  |
| Histórico/progresso                          | Ligado aos leitores              | Nenhum                       | LocalStorage isolado          | Quatro modos e recarregamento            | Implementada  |
| Wizard e gestão de rascunhos                 | Ativos                           | Nenhum                       | LocalStorage isolado          | Store/SSR/Chrome                         | Implementada  |
| Editores e pré-visualização                  | Texto seguro e sequenciador      | Nenhum                       | Local/IndexedDB               | Conteúdo, teclado e persistência         | Implementada  |
| Media local                                  | Seleção/validação/visualização   | Nenhum upload                | IndexedDB/fallback em memória | Bytes, quota e recarregamento            | Implementada  |
| Exportação/recuperação/conflitos             | Confirmação explícita            | Desnecessário                | JSON/cópias locais            | Corrupção, duas abas e isolamento        | Implementada  |
| Publicação pública                           | Inventário/estados locais apenas | Nenhum                       | Sem publicação remota         | Sem integração de publicação             | Ausente       |
| Estatísticas de audiência                    | Valores simulados                | Nenhum                       | Fórmula/constantes            | Renderização, não audiência              | Demonstrativa |
| Comentários e avaliações                     | Criar/listar localmente          | Nenhum                       | Chaves por obra               | Navegação e schema                       | Demonstrativa |
| Seguidores                                   | Tela vazia específica            | Nenhum                       | Nenhuma                       | SSR da tela                              | Planeada      |
| Atividade/notificações/coleções comunitárias | Placeholders                     | Nenhum                       | Nenhuma                       | Apenas contrato de rotas                 | Planeada      |
| Denúncias e moderação                        | Placeholders                     | Nenhum                       | Nenhuma                       | Apenas contrato de rotas                 | Planeada      |
| Administração/monitorização/logs             | Placeholders                     | Nenhum                       | Nenhuma                       | Apenas contrato de rotas                 | Planeada      |
| Ajuda/regras/política pública completas      | Placeholders                     | Nenhum                       | Nenhuma                       | Apenas contrato de rotas                 | Ausente       |
| Cloudflare R2                                | Nenhum upload ativo              | Integração futura            | Nenhuma remota                | Não implementado                         | Planeada      |

## Migrações SQL locais

As três migrações só tratam perfis:

1. `20261109000000_create_profiles_table.sql`: tabela, constraints, trigger de data, criação automática, RLS e backfill seguros para instalação nova.
2. `20261110000000_harden_profile_provisioning.sql`: caminho posterior compatível com a migração original já aplicada ou com a sua ausência. Mantém perfis existentes, fixa search_path e trata nomes vazios/longos/colisões; uma falha por conta não aborta todo o backfill nem deve bloquear o registo Auth.
3. `20261110010000_canonical_usernames.sql`: requer a base A; normaliza caixa, adiciona trigger/check e unicidade canónica. O preflight aborta se já existirem usernames equivalentes, sem renomear donos automaticamente.

Ordem numa instalação nova: 1 → 2 → 3. Se o serviço já tem a versão original antiga, confirmar o histórico e aplicar o hardening 2 antes de 3; não falsificar o histórico para assumir que a base revista foi executada. O projeto não contém configuração completa do Supabase CLI nem uma receita automática de serviço remoto.

Antes de qualquer aplicação autorizada: fazer backup, confirmar esquema/constraints/triggers/permissões reais, testar numa base de ensaio e rever colisões por `lower(btrim(username))`. Resolver colisões de forma explícita preservando IDs. A migração 3 bloqueia escritas durante a alteração, pelo que é necessário planear a janela. As políticas previstas permitem leitura pública e inserção/atualização apenas do próprio `auth.uid()`; não há políticas para obras/biblioteca porque essas tabelas não existem nas migrações.

Verificações de integridade para um ensaio autorizado, não executadas remotamente nesta revisão:

```sql
SELECT u.id FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;
SELECT lower(btrim(username)), count(*) FROM public.profiles
GROUP BY lower(btrim(username)) HAVING count(*) > 1;
SELECT id FROM public.profiles WHERE username !~ '^[a-z0-9_]{3,30}$'
  OR char_length(display_name) NOT BETWEEN 1 AND 60;
SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
```

PGlite valida esquemas/papéis simulados e RLS localmente, não o serviço real. A aplicação remota destas migrações continua sem evidência nesta auditoria. Não executar os exemplos numa instância remota sem autorização.

## Inventário das 57 rotas

Fonte: `src/foundation/app/routes.ts`, resolução em `app/App.tsx`. “Local” inclui dados demo; “Supabase condicionado” indica código de integração que depende do serviço. As telas administrativas não disponibilizam operações reais. `/dev/design-system` e `*` (404) são adicionais, fora da contagem.

| Rota                                              | Título                  | Layout       | Resolução atual        |
| ------------------------------------------------- | ----------------------- | ------------ | ---------------------- |
| `/`                                               | Início                  | `public`     | Tela específica        |
| `/explorar`                                       | Explorar                | `public`     | Tela específica        |
| `/catalogo`                                       | Catálogo                | `public`     | Tela específica        |
| `/pesquisa`                                       | Pesquisa                | `public`     | Tela específica        |
| `/tags`                                           | Tags                    | `public`     | Tela específica        |
| `/tags/:slug`                                     | Explorar tag            | `public`     | Tela específica        |
| `/categorias`                                     | Categorias              | `public`     | Tela específica        |
| `/tendencias`                                     | Tendências              | `public`     | Tela específica        |
| `/obras/:id`                                      | Detalhes da obra        | `public`     | Tela específica        |
| `/entrar`                                         | Entrar                  | `auth`       | Tela específica        |
| `/registar`                                       | Criar conta             | `auth`       | Tela específica        |
| `/recuperar-senha`                                | Recuperar senha         | `auth`       | Tela específica        |
| `/redefinir-senha`                                | Redefinir senha         | `auth`       | Tela específica        |
| `/confirmar-email`                                | Confirmar email         | `auth`       | Tela específica        |
| `/boas-vindas`                                    | Boas-vindas             | `auth`       | Tela específica        |
| `/obras/:id/capitulos/:capituloId`                | Leitor literário        | `reader`     | Tela específica        |
| `/obras/:id/paginas/:capituloId`                  | Leitor visual           | `reader`     | Tela específica        |
| `/obras/:id/comentarios`                          | Comentários             | `reader`     | Tela específica        |
| `/obras/:id/avaliacoes`                           | Avaliações              | `reader`     | Tela específica        |
| `/biblioteca`                                     | A tua biblioteca        | `account`    | Tela específica        |
| `/biblioteca/favoritos`                           | Favoritos               | `account`    | Tela específica        |
| `/biblioteca/historico`                           | Histórico de leitura    | `account`    | Tela específica        |
| `/biblioteca/listas`                              | Listas de leitura       | `account`    | Tela específica        |
| `/biblioteca/listas/:id`                          | Lista de leitura        | `account`    | Tela específica        |
| `/estudio`                                        | Estúdio de criação      | `studio`     | Tela específica        |
| `/estudio/obras/nova`                             | Criar uma obra          | `studio`     | Tela específica        |
| `/estudio/obras/:id`                              | Gerir obra              | `studio`     | Tela específica        |
| `/estudio/obras/:id/capitulos/:capituloId/editar` | Editar capítulo         | `studio`     | Tela específica        |
| `/estudio/obras/:id/paginas/:capituloId/editar`   | Editar páginas          | `studio`     | Tela específica        |
| `/estudio/publicacoes`                            | Publicações             | `studio`     | Tela específica        |
| `/estudio/estatisticas`                           | Estatísticas            | `studio`     | Tela específica        |
| `/estudio/media`                                  | Biblioteca de media     | `studio`     | Tela específica        |
| `/utilizadores/:username`                         | Perfil público          | `public`     | Tela específica        |
| `/utilizadores/:username/seguidores`              | Seguidores              | `public`     | Placeholder específico |
| `/atividade`                                      | Atividade               | `public`     | DevelopmentPage        |
| `/colecoes`                                       | Coleções                | `public`     | DevelopmentPage        |
| `/perfil/editar`                                  | Editar perfil           | `account`    | Tela específica        |
| `/notificacoes`                                   | Notificações            | `account`    | DevelopmentPage        |
| `/definicoes`                                     | Definições              | `account`    | Tela específica        |
| `/definicoes/aparencia`                           | Aparência               | `account`    | Tela específica        |
| `/definicoes/leitura`                             | Preferências de leitura | `account`    | Tela específica        |
| `/definicoes/seguranca`                           | Segurança               | `account`    | Tela específica        |
| `/definicoes/privacidade`                         | Privacidade da conta    | `account`    | Tela específica        |
| `/definicoes/acessibilidade`                      | Acessibilidade          | `account`    | Tela específica        |
| `/denunciar`                                      | Denunciar conteúdo      | `public`     | DevelopmentPage        |
| `/ajuda`                                          | Centro de ajuda         | `public`     | DevelopmentPage        |
| `/regras`                                         | Regras da comunidade    | `public`     | DevelopmentPage        |
| `/privacidade`                                    | Política de privacidade | `public`     | DevelopmentPage        |
| `/moderacao`                                      | Moderação               | `moderation` | DevelopmentPage        |
| `/moderacao/denuncias`                            | Gestão de denúncias     | `moderation` | DevelopmentPage        |
| `/sistema`                                        | Sistema                 | `system`     | DevelopmentPage        |
| `/sistema/logs`                                   | Registos                | `system`     | DevelopmentPage        |
| `/sistema/logs/:id`                               | Detalhe de registo      | `system`     | DevelopmentPage        |
| `/sistema/servicos`                               | Serviços                | `system`     | DevelopmentPage        |
| `/sistema/monitorizacao`                          | Monitorização           | `system`     | DevelopmentPage        |
| `/sistema/informacoes`                            | Informações             | `system`     | DevelopmentPage        |
| `/sistema/testes`                                 | Testes do sistema       | `system`     | DevelopmentPage        |

## Implementado versus planeado

A fronteira atual é explícita: Auth/perfis podem comunicar com Supabase; autoria, leitura, biblioteca e interações demo usam dados estáticos/locais. Futuro backend de obras deve unificar ID de autor, propriedade, estados editoriais, publicação e acesso aos capítulos. R2 exigirá upload autorizado pelo servidor e referências duráveis; não colocar credenciais de storage no frontend.

Seguidores, notificações, denúncias e ferramentas de moderação/administração não devem ser considerados concluídos pela presença das rotas. A preparação para essa fase depende primeiro de publicação, autorização e políticas de dados. Nenhuma dessas integrações futuras foi iniciada na Etapa C.
