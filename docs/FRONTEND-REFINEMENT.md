# Fase E — refinamento e catálogo inaugural

## Âmbito, base e preservação

Revisão local de 10/11/2026, branch `main`, HEAD `a2d6ba1649d7c3cca57bf0128a6629a723f605d1`. As alterações P3/D existentes no início foram identificadas e preservadas como base do trabalho. Não houve reset, pull, merge, rebase, commit, push, deploy ou SQL remoto. `.env.local`, migrações e contratos de segurança não foram substituídos.

As 57 rotas e os sete layouts continuam presentes. O manifesto e a estrutura dos layouts são os anteriores; no rodapé apenas se corrigiu o texto para “Versão local · edição inaugural”. Os relatórios A/B/C/D e a documentação anterior permanecem históricos e intactos; este documento descreve o estado posterior à Fase E.

## Inventário antes da implementação

| Origem anterior               | Utilização                                                                   | Destino nesta fase                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `data/works.ts`               | Oito obras e oito autores fictícios, datas históricas de exemplo             | Catálogo ativo substituído por quatro peças originais com IDs novos; nenhum ID antigo foi reatribuído                    |
| `data/editorial.ts`           | Três seleções independentes com os IDs antigos                               | Seleções derivadas das duas coleções canónicas                                                                           |
| `features/reader/data.ts`     | Quatro conjuntos detalhados e fallback genérico para qualquer obra conhecida | Apenas capítulos explícitos do catálogo inaugural; ausência devolve undefined/404                                        |
| `features/profile/service.ts` | Biografias fictícias dispersas e resolução dos autores demo                  | Uma identidade editorial local, por ID exato, separada de contas Auth                                                    |
| `pages/Reader.tsx`            | Comentários/avaliações pré-inseridos e contagens de gostos                   | Sementes removidas; notas/avaliações guardadas pelo utilizador continuam legíveis; gostos não são exibidos nem simulados |
| Stores biblioteca/Estúdio     | Leituras, listas, rascunhos, atividades e media de exemplo                   | Espaços novos vazios; todos os originais já persistidos continuam no respetivo espaço                                    |
| `features/completion/data.ts` | Pessoas, notificações, feed, denúncias, logs, serviços e métricas fictícios  | Fixtures retirados; serviços ausentes/negados e coleções editoriais reais do manifesto local                             |
| Estatísticas do Estúdio       | Leituras calculadas por fórmula e conclusão fixa de 78%                      | Audiência/conclusão indisponíveis; apenas contagens de produção local e duração textual estimada                         |
| Descoberta e cartões          | Etiquetas “demo”, autores fictícios e avisos repetidos                       | Série inaugural coerente, atribuição institucional e indicação sucinta de preparação local                               |
| Informação institucional      | Ajuda ligada ao catálogo/demo anterior                                       | Orientação revista; regras e política continuam rascunhos não publicados                                                 |
| Design system e testes        | Exemplos de componentes e dados de teste                                     | Mantidos isolados, com finalidade de desenvolvimento, sem alimentar a experiência editorial                              |

O inventário foi apresentado antes da implementação. Os registos antigos já existentes no navegador não foram filtrados/apagados por se parecerem com sementes: não seria possível provar que não foram editados ou usados legitimamente. A biblioteca identifica referências fora do catálogo ativo, conservando títulos, progresso e outros dados. Capítulos retirados não são substituídos por texto novo sob o mesmo ID.

## Conteúdo editorial introduzido

Fonte única: `src/foundation/data/inaugural.ts`.

| ID                    | Peça                      | Formato/leitor              | Conteúdo explícito                                                                |
| --------------------- | ------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `ag-carta-abertura`   | Carta de abertura         | Conto institucional / prosa | Duas partes originais sobre começar um arquivo e preservar leituras               |
| `ag-primeiras-linhas` | Primeiras linhas          | Poesia                      | Três poemas originais com versos/estrofes preservados                             |
| `ag-tres-gestos`      | Um arquivo em três gestos | HQ / Comic                  | Dois capítulos, quatro composições SVG originais e respetivas descrições/legendas |
| `ag-outra-margem`     | A outra margem da página  | Mangá / RTL                 | Dois capítulos, quatro composições SVG originais sobre percursos de leitura       |

São peças editoriais breves criadas especificamente nesta fase, não transcrições de obras de terceiros ou obras de domínio público presumido. Os ensaios visuais são composições geométricas editoriais, não obras atribuídas a ilustradores/mangakás reais. Há quatro capas originais da mesma série em `public/editorial/` e oito páginas gráficas diferentes. Todos os assets são locais, sem downloads ou upload.

Duas coleções: **Começar pelas palavras** e **Outras formas de olhar**. Os filtros, tags, géneros, seleções e ligações derivam das mesmas obras. Formatos sem conteúdo inaugural mostram zero resultados; não se criaram obras só para preencher todas as categorias.

## Identidade, autoria e proveniência

Identidade: **Arquivo Global — Equipa Editorial**, ID `ag-editorial-team`, username local `equipa-editorial`. É uma identidade institucional de preparação, não uma pessoa inventada, utilizador Supabase ou papel administrativo. O namespace com hífen mantém-se distinto do contrato de usernames reais.

Cada obra distingue:

- `originalAuthorId`: identidade que assina os novos textos/composições institucionais.
- `publisherId`: `ag-publisher-editorial`, organização publicadora prevista.
- `ownerId`: `ag-editorial-organization`, referência organizacional local; não é um ID Auth nem transfere direitos de terceiros.
- `origin`: `original-created-for-project`; `rights`: `original-institutional-draft`.
- `publicationStatus`: `prepared-local`; `publishedAt`: null.
- `preparedAt`/`createdAt`: 10/11/2026, data de preparação desta fase, nunca apresentada como publicação histórica.

O proprietário do projeto deverá rever o conteúdo, atribuição institucional e condições de utilização antes de uma publicação. Nenhuma obra anterior foi renomeada ou convertida numa obra da equipa. As novas peças têm IDs próprios, sem alias de leitura para IDs antigos.

## Estrutura e contratos

`inauguralCatalog` é um manifesto JSON-serializável v1 com authors, publishers, works, reading, collections, taxonomy e institutional. Reutiliza Work e WorkReadingData/Chapter; InauguralWork acrescenta proveniência, publicador, proprietário, estado e capa. Capítulos usam IDs únicos dentro da obra, numeração contínua, modo compatível e conteúdo completo explicitamente declarado. Páginas visuais têm ID, número, asset, legenda e descrição.

O repositório continua somente de leitura. A biblioteca/Estúdio não recebem obras editoriais automaticamente e não alimentam o catálogo público. As exportações técnicas antigas `demoWorks`, `demoAuthors`, `demoReadingLibrary` e `resolveDemoProfile` são aliases de compatibilidade sobre a fonte editorial; não contêm uma segunda cópia de fixtures ou pessoas fictícias.

Coleções editoriais são `public-preview` e `prepared-local`, com relações por ID. As listas privadas usam o store já existente da biblioteca, no espaço guest/user selecionado. Não são misturadas nas seleções editoriais e não são publicadas. A criação confirma apenas disponibilidade local; os avisos/exportação/repetição das ferramentas de persistência continuam a aplicar-se em falha de gravação.

Os contratos futuros de feed/notificações/denúncias/logs mantêm-se tipados, mas o adaptador atual não inventa respostas. Nem um viewer chamado “admin” nem o antigo parâmetro demo concedem acesso ou devolvem dados sociais/operacionais fictícios.

## Refinamentos e fluxos

- Cartões/capas, detalhes, pesquisa, tags, categorias, seleções e perfil utilizam a mesma série inaugural; etiquetas e datas foram alinhadas.
- Detalhes apresentam autoria original, publicador, proprietário e origem, índice de capítulos e retoma a partir do progresso local.
- Leitores validam obra/unidade/modo, usam assets reais e não fabricam capítulos ausentes.
- Comentários e avaliações começam vazios. Guardar uma nota/avaliação é explicitamente local, sem identidade verificada ou publicação social.
- Atividade apresenta um anúncio institucional de preparação, com data desta fase; não simula eventos entre pessoas.
- Seguidores/notificações permanecem indisponíveis; denúncias têm validação, mas envio desativado. Não são simuladas relações/receções.
- Moderação/sistema conservam acesso negado sem autorização remota. Não há contagens falsas, logs fabricados, denúncias fictícias ou métricas de saúde inventadas.
- Contagens do Estúdio descrevem os dados locais. A contagem por obra inclui poesia, coerente com o total; a duração a 200 palavras/min é estimativa textual, não audiência. Leituras e conclusão por leitores mostram indisponibilidade.
- A biblioteca mantém referências históricas e explica indisponibilidade de conteúdo retirado, sem reatribuir IDs ou apagar dados.
- Refinamentos usam os tokens e componentes existentes: capas de série, espaçamento dos cartões, índice com alvos confortáveis, estado inválido dos campos e semântica de títulos.
- A revisão encontrou falta de h1 nos leitores visuais e nos editores. Foram acrescentados títulos acessíveis e um título na edição de perfil sem sessão; pré-visualizações de prosa/poesia usam h2 para evitar títulos principais duplicados. Isto não altera persistência, interpretação do texto ou ações editoriais.

## Ficheiros modificados nesta fase

| Área                            | Ficheiros                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonte editorial                 | Novo `data/inaugural.ts`; `data/works.ts`, `data/editorial.ts`                                                                                                                                                                                                                            |
| Repositório e descoberta        | `lib/worksRepository.ts`, `lib/discovery.ts`, `components/WorkCard.tsx`, `Discovery.tsx`, `WorkCollection.tsx`                                                                                                                                                                            |
| Páginas                         | Home, Explore, Catalog, Categories, Tags, Trends, Work, Profile, Reader, Library, Studio, Community, Communication, Information, Moderation, System                                                                                                                                       |
| Dados e serviços                | `features/profile/service.ts`, `features/reader/data.ts`, stores da biblioteca/Estúdio, tipo StudioStats, `features/completion/data.ts`/`ui.tsx`                                                                                                                                          |
| Semântica dos leitores/editores | ProseReader, PoetryReader, ComicReader, MangaReader, HybridProseEditor, PoetryEditor e VisualSequencer                                                                                                                                                                                    |
| Visual                          | Acréscimos delimitados em `styles/global.css`; texto do rodapé em `app/layouts.tsx`; doze SVGs novos em `public/editorial/`                                                                                                                                                               |
| Testes                          | Regressões de descoberta, rotas, perfil, leitores, biblioteca, Estúdio e completion adaptadas; inputs A/B atualizados para IDs atuais; fixtures privadas explícitas em `scripts/fixtures/user-content.ts`; novas suites `editorial-refinement.test.tsx`, `.browser.tsx` e `.browser.html` |
| Driver                          | Timeout opcional limitado para a matriz Chrome completa; mantém as capacidades anteriores                                                                                                                                                                                                 |
| Relatório                       | Este ficheiro                                                                                                                                                                                                                                                                             |

Os caminhos de módulos/páginas são relativos a `src/foundation/`. Git pode mostrar também alterações das fases C/D já presentes; a tabela separa a intenção da Fase E. Nenhuma configuração de Supabase/Cloudflare, dependência, lockfile, SQL, guard, AuthController ou armazenamento pessoal foi reescrito.

## Validação

As primeiras execuções identificaram expectativas antigas e problemas reais de semântica/responsividade. Os resultados abaixo são das execuções aprovadas após as correções.

| Verificação            | Resultado                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Aprovado                                                                                                                  |
| `npm test`             | 213 aprovados; zero falhas, zero ignorados                                                                                |
| `npm run build`        | Aprovado                                                                                                                  |
| `npm run format:check` | Aprovado                                                                                                                  |
| `git diff --check`     | Aprovado                                                                                                                  |
| Chrome A               | 14/14 cenários de persistência/recuperação                                                                                |
| Chrome B               | 12/12 cenários de preferências, teclado, segurança e duas abas                                                            |
| Chrome D adaptado      | 2/2 cenários de preservação das 17 interfaces e limites de acesso                                                         |
| Chrome E completo      | 7/7 cenários; inclui 57 rotas × 5 larguras × 2 temas = 570 combinações                                                    |
| Revisão de assets      | 12 SVGs válidos; capturas de catálogo, obra e leitor revistas visualmente                                                 |
| Preservação            | Manifesto de 57 rotas, sete layouts, ambiente, relatórios anteriores, SQL, dependências e persistência/segurança mantidos |

São **35 cenários Chrome distintos**, adicionais aos 213 testes Node. A matriz responsiva constitui um dos sete cenários E; não são 570 testes Node. Após um ajuste no harness para colocar uma atualização de storage dentro de act, repetiram-se ainda os sete cenários E em modo focado, cuja matriz abrange apenas as três telas anteriormente problemáticas. A evidência da matriz completa é a execução sem query debug.

Larguras: 320, 375, 768, 1024 e 1440 px, temas claro/escuro. A matriz final não observou overflow horizontal da página, títulos principais em falta/duplicados ou campos visíveis sem nome acessível nos estados percorridos. Tabelas e sequências mantêm scroll local quando necessário. Foram encontrados e corrigidos overflows na página inicial, leitor Comic, biblioteca/listas, dashboard, publicações e editores. Não se aplicou overflow-x hidden ao body para ocultar problemas.

Uma regressão B ainda pressupunha uma obra automática no Estúdio e falhou depois da remoção das sementes. O teste foi corrigido para criar explicitamente uma obra no seu espaço de teste; a seleção por Enter voltou a passar. O aviso React act observado numa execução E dizia respeito à atualização de dados feita pelo harness; foi ajustado sem mudar código funcional e o ensaio focado foi repetido.

Reprodução dos browsers, sempre sequencialmente na porta local 4178:

```bash
npm run test:browser
npm run test:browser:b
AG_TEST_PAGE=frontend-completion.browser.html AG_TEST_RESULTS=/tmp/ag-E-regression-D-results.json node scripts/run-browser-tests.mjs
AG_TEST_PAGE=editorial-refinement.browser.html AG_TEST_RESULTS=/tmp/ag-E-browser-results.json AG_TEST_TIMEOUT_MS=240000 node scripts/run-browser-tests.mjs
```

O timeout adicional é limitado a quatro minutos no driver e só afeta o teste. As capturas temporárias ficam em `/tmp/ag-D-editorial-catalog-desktop.png`, `/tmp/ag-D-editorial-work-mobile.png` e `/tmp/ag-D-editorial-reader-tablet.png`, conforme o prefixo do driver existente. Não são artefactos a versionar.

Os testes existentes que dependiam de sementes falsas agora criam explicitamente os próprios dados num ambiente de teste. Não se removeram as verificações de isolamento, recuperação, versões futuras, quota, IndexedDB, duas abas ou acessibilidade. As contagens mudaram porque testes de fixtures antigos foram consolidados e foram adicionadas regressões editoriais; comparar o total sem considerar essa alteração seria enganador.

A primeira suite Node teve 52 falhas ligadas ao catálogo/fixtures anterior. Após atualização, restaram quatro expectativas de texto/sementes antigas; a execução seguinte passou 213 testes. Chrome identificou títulos principais em falta nos leitores visuais, editores e estado não autenticado de edição de perfil; as correções foram verificadas numa nova execução. Relatar apenas o último resultado não apaga estes achados.

Não se fez certificação WCAG, teste manual com leitores de ecrã, revisão em dispositivos físicos, todos os níveis de zoom ou motores diferentes do Chrome. Sem integração real de e-mail/Google/Auth/perfis, telemetria ou publicação. As suites desativam credenciais reais; as imagens e dados locais de teste são descartáveis e não usam o perfil pessoal do navegador.

## Classificação das capacidades

| Capacidade                                                                                 | Classificação                |
| ------------------------------------------------------------------------------------------ | ---------------------------- |
| Descoberta, filtros, tags, leitura, progresso, biblioteca e autoria no navegador           | Funcional localmente         |
| Quatro peças originais, nove capítulos, oito páginas visuais, quatro capas e duas coleções | Conteúdo editorial preparado |
| Textos institucionais, com regras e privacidade ainda em rascunho                          | Conteúdo editorial preparado |
| Obras/publicação/sincronização, comunidade, autorização administrativa e telemetria        | Dependente de backend        |
| Envio de denúncias, seguir/deixar de seguir e ações de moderação reais                     | Indisponível                 |
| Upload R2 e publicação remota do conteúdo inaugural                                        | Indisponível                 |

## Importação futura para Supabase

Este é um contrato lógico e plano de importação, não SQL executado nem declaração de tabelas já existentes:

1. Rever e aprovar editorialmente cada peça, autoria, proveniência, política de uso dos assets e decisão explícita de publicação. `prepared-local` não autoriza publicação.
2. Definir o esquema e políticas no servidor para autores institucionais, organizações/publicadores, obras, capítulos, páginas, coleções, tags e relações. O modelo de perfis existente não basta para obras e organizações.
3. Conservar os IDs locais como chaves externas estáveis/únicas. Se o servidor usar UUIDs, criar um mapa explícito external_id → UUID por tipo; não inserir `ag-editorial-team` como UUID de auth.users/profiles. Não criar uma conta administrativa para representar a assinatura editorial.
4. Exportar apenas `inauguralCatalog` como JSON v1 numa operação revista. Nunca misturar localStorage, imagens pessoais, tokens, perfis reais ou rascunhos privados no payload.
5. Validar IDs, unicidade, relações obra/capítulo/página, ordenação, modos, assets, metadados e hashes. Importar numa transação/ensaio controlado com idempotência por chave externa; manter prepared/draft e published_at nulo.
6. Importar entidades de autoria/publicador antes das obras, depois capítulos/páginas, tags/relações e coleções. Transferir os assets aprovados por um serviço autorizado, mantendo o mapa de referências; credenciais R2/Supabase administrativas nunca ficam em VITE\_\*.
7. Fazer backup, testar RLS/propriedade/papéis com contas autorizadas e validar a preservação de autoria original. Não associar obras automaticamente a uma conta com nome/metadata semelhante.
8. Substituir o adaptador de leitura apenas após comparar resultados e testar rollback; a publicação é uma ação separada, autorizada e confirmada pelo servidor. Não converter implicitamente o histórico local em dados remotos.

Nenhuma destas operações remotas foi iniciada. A próxima fase deve rever o conteúdo preparado e definir contratos/permissões do backend antes de qualquer importação ou publicação.
