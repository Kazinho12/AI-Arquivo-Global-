# Fase D — conclusão das 17 interfaces

## Resumo executivo e base

Implementadas as 16 telas anteriormente resolvidas por `DevelopmentPage` e a tela específica de seguidores. As 57 rotas e os sete layouts foram preservados. Cada nova tela tem conteúdo, estados e interações próprios dentro do seu âmbito; a conclusão visual não significa disponibilidade remota ou aprovação para produção.

Base: branch `main`, HEAD `a2d6ba1649d7c3cca57bf0128a6629a723f605d1`. No início já havia alterações P3 em `.gitignore`, README, VALIDATION, AUTHENTICATION, `.env.example`, ARCHITECTURE e AUDIT-CLOSURE. Esses ficheiros foram preservados byte a byte nesta fase, assim como os relatórios A/B. Este documento regista separadamente a Fase D e passa a ser a referência para a conclusão das interfaces; as contagens de placeholders na documentação P3 descrevem o momento anterior.

A inspeção revelou duas diferenças de classificação no pedido: a terceira interface comunitária é seguidores (também descrita no bloco F), e existem **sete**, não seis, rotas de sistema, contando o detalhe de um registo. Foram implementadas as 17 rotas reais, sem inventar caminhos de gestão de utilizadores/configurações.

## Inventário e classificação individual

“Interface concluída” significa camada visual/interativa no âmbito descrito, com limites remotos explícitos. Não significa que os serviços pendentes estejam operacionais.

| Rota canónica                        | Componente              | Capacidades disponíveis                                                                                         | Dependência remota                                                      | Classificação       |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------- |
| `/atividade`                         | `ActivityPage`          | Seleção finita, filtros, datas, autores e links para obras/perfis                                               | Feed real e eventos                                                     | Interface concluída |
| `/colecoes`                          | `CollectionsPage`       | Pesquisa, visibilidade, cartões, detalhes, seleção de obras e criação/descartar rascunho privado de exemplo     | Coleções persistidas, propriedade e publicação                          | Interface concluída |
| `/notificacoes`                      | `NotificationsPage`     | Grupos cronológicos, filtros por tipo/estado e marcação de leitura de exemplo                                   | Entrega, leitura e subscrição de notificações reais                     | Interface concluída |
| `/denunciar`                         | `ReportPage`            | Motivos, referência opcional por query `conteudo`, descrição, validação associada aos campos e feedback honesto | Envio/persistência, identidade e proteção contra duplicação no servidor | Interface concluída |
| `/ajuda`                             | `HelpPage`              | Pesquisa, FAQ expansível e orientação confirmada pelo código                                                    | Canal de suporte não existente                                          | Interface concluída |
| `/regras`                            | `RulesPage`             | Documento semântico, índice e navegação                                                                         | Aprovação editorial/institucional do texto                              | Interface concluída |
| `/privacidade`                       | `PrivacyPage`           | Descrição técnica atual, índice e opções locais                                                                 | Aprovação jurídica/institucional e definição da política real           | Interface concluída |
| `/moderacao`                         | `ModerationPage`        | Visão geral e contagens apenas sobre denúncias fictícias                                                        | Autorização, fila e decisões                                            | Interface concluída |
| `/moderacao/denuncias`               | `ModerationReportsPage` | Pesquisa, filtros, tabela, detalhe e histórico fictício em modal                                                | Dados reais e ações autorizadas                                         | Interface concluída |
| `/sistema`                           | `SystemPage`            | Navegação por áreas, inventário de exemplo e ausência explícita de métricas reais                               | Autorização e dados operacionais                                        | Interface concluída |
| `/sistema/logs`                      | `SystemLogsPage`        | Pesquisa, nível, paginação e navegação para detalhe                                                             | Logs reais autorizados                                                  | Interface concluída |
| `/sistema/logs/:id`                  | `SystemLogDetailPage`   | Evento individual fictício, contexto e referência desconhecida                                                  | Consulta de logs reais                                                  | Interface concluída |
| `/sistema/servicos`                  | `SystemServicesPage`    | Inventário pesquisável e limites de cada integração                                                             | Health checks e configurações reais                                     | Interface concluída |
| `/sistema/monitorizacao`             | `SystemMonitoringPage`  | Seleção de janela e indicadores fixos identificados como fictícios                                              | Telemetria, séries temporais, alertas e autorização                     | Interface concluída |
| `/sistema/informacoes`               | `SystemInformationPage` | Características públicas do frontend e fronteiras dos dados                                                     | Sem exposição de configuração operacional                               | Interface concluída |
| `/sistema/testes`                    | `SystemTestsPage`       | Quatro verificações locais de manifesto/exemplos com resultados efetivamente calculados                         | Sem execução de CI ou comandos administrativos                          | Interface concluída |
| `/utilizadores/:username/seguidores` | `FollowersPage`         | Avatares por iniciais/URL, nomes, username, links, pesquisa e paginação de exemplos                             | Relações reais e seguir/deixar de seguir                                | Interface concluída |

Nenhuma das 16 rotas continua a usar DevelopmentPage. O componente antigo permanece no ficheiro States como código preservado, mas o router ativo só usa páginas específicas e NotFound para uma eventual ausência de resolução. Seguidores é carregado do módulo Community; o export antigo em Profile foi mantido por compatibilidade.

## Contratos, estados e isolamento

`src/foundation/features/completion/data.ts` define Activity, Collection, Notification, Person, Report, LogEntry, ServiceInfo e Metric. São contratos de leitura, sem inventar tabelas ou endpoints. Os fixtures de pessoas reutilizam exclusivamente o namespace explícito dos autores demo existentes. As obras são referências ao catálogo já existente, sem alteração desses dados.

`CompletionService.read` é uma porta tipada e substituível através de `CompletionContext`; um futuro adaptador deverá validar respostas e aplicar identidade/autorização no servidor. O adaptador atual não faz pedidos remotos nem fornece mutações. Fora da demonstração devolve indisponibilidade, ou acesso não autorizado nas áreas restritas. Um viewer ID, mesmo chamado “admin”, não concede qualquer permissão.

`useResource` distingue carregamento, sucesso com origem, erro recuperável, indisponibilidade e acesso negado. Resultados prontos sem itens/filtros sem resultados têm estado vazio. Uma alteração de recurso, identidade, modo ou perfil invalida imediatamente o snapshot anterior e ignora respostas atrasadas/desmontadas. Erros apresentados são genéricos; detalhes internos da exceção não são mostrados.

As demonstrações só aparecem após ação explícita. Os rascunhos de coleção e estados de leitura de notificações ficam em memória; fechar a demonstração, sair da tela ou mudar de identidade descarta-os. Nunca são usados como confirmação de publicação, denúncia ou operação remota. Não há novas chaves localStorage nem alterações em dados existentes.

Coleções públicas de exemplo não contêm seleções privadas. Um rascunho privado criado na demonstração não aparece na listagem pública e só pode conter referências às obras demo. Seguidores fictícios só são disponibilizados para usernames do registo demo; contas reais e handles desconhecidos não recebem relações inventadas. O modelo atual não suporta uma lista real de “a seguir”, pelo que essa relação não foi inventada.

## Acesso e ações sensíveis

Os layouts continuam a usar o aviso de autorização remota existente. Não foi adicionado papel por metadata, localStorage, query ou estado cliente. As nove rotas de moderação/sistema não consultam registos operacionais nem dados pessoais. As demonstrações são independentes de privilégios e apenas de leitura. Informações do sistema e verificações do manifesto exibem apenas informações públicas do bundle.

Remover conteúdo, sancionar contas e resolver denúncias não estão disponíveis; não existe ação destrutiva real a confirmar. O detalhe de denúncia mostra os controlos desativados e explica a falta de autorização. Não se apresenta uma sanção, remoção ou decisão como concluída.

O formulário de denúncia tem o envio desativado com explicação associada. “Verificar formulário” valida motivo, 20–2000 caracteres e referência interna opcional de obra/perfil. URLs externos, parâmetros, caminhos ambíguos e referências excessivamente longas são rejeitados. Uma verificação válida informa **“A denúncia não foi enviada”**. Submissões repetidas não produzem efeitos persistentes nem pedidos; proteção remota contra duplicação pertence à futura integração.

Regras e privacidade estão marcadas como **rascunhos não publicados**, sem aprovação institucional/jurídica. A página de ajuda não inventa contactos, atendimento ativo ou garantias de resposta.

## Implementação por blocos e ficheiros

| Bloco                  | Ficheiros/integrações                                                                                                  | Verificação                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Inventário e contratos | `features/completion/data.ts`, `ui.tsx`                                                                                | Typecheck de contratos                                       |
| Comunidade             | `pages/Community.tsx`: atividade e coleções; contrato de seguidores preparado                                          | Typecheck do bloco                                           |
| Comunicação            | `pages/Communication.tsx`: notificações e denúncia                                                                     | Typecheck do bloco                                           |
| Ajuda/políticas        | `pages/Information.tsx`                                                                                                | Typecheck; navegação e âncoras na suite final                |
| Moderação              | `pages/Moderation.tsx`                                                                                                 | Typecheck; filtros/modal/acesso no Chrome                    |
| Sistema                | `pages/System.tsx`                                                                                                     | Typecheck; filtros, detalhe, paginação e verificações locais |
| Seguidores             | `pages/Community.tsx`; reexport compatível em `pages/Profile.tsx`                                                      | SSR, pesquisa/paginação e isolamento no Chrome               |
| Integração             | `app/App.tsx`, estilos isolados `.completion-*` em `styles/global.css`                                                 | Router real, 57 rotas/sete layouts e responsividade          |
| Regressões             | `scripts/frontend-completion.test.tsx`, `.browser.tsx`, `.browser.html`; extensão do driver em `run-browser-tests.mjs` | Suites Node, Chrome A/B/D e revisão de capturas              |

Os caminhos das páginas/features/estilos acima são relativos a `src/foundation/`. Não foram adicionadas dependências, alterados lockfiles, SQL, Auth, providers, layouts ou o manifesto. As outras 40 interfaces mantêm a sua implementação; Profile só troca o corpo antigo de seguidores por um reexport compatível. A navegação das novas áreas usa links canónicos; ajuda permite chegar à comunidade, e as telas existentes de perfil já apontam para seguidores.

## Resultados de testes

| Verificação            | Resultado final                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run typecheck`    | Aprovado                                                                        |
| `npm test`             | 209 aprovados, zero falhas/ignorados; 23 testes novos                           |
| `npm run build`        | Aprovado                                                                        |
| `npm run format:check` | Aprovado                                                                        |
| `git diff --check`     | Aprovado                                                                        |
| Chrome A               | 14 verificações aprovadas                                                       |
| Chrome B               | 12 verificações aprovadas                                                       |
| Chrome D               | 13 cenários aprovados, incluindo matriz de 170 combinações de tela/largura/tema |
| Manifesto e layouts    | 57 rotas únicas; sete layouts; ficheiros preservados byte a byte                |

Na primeira passagem final, TypeScript identificou dois erros de tipagem no novo teste de resposta atrasada e Prettier apontou um ficheiro. Foram corrigidos no teste/formatação, e typecheck, build e format-check foram repetidos até aprovação. Os testes funcionais Node/Chrome já estavam aprovados; não se alterou uma regra de negócio para contornar essas verificações.

Os resultados Chrome são adicionais aos testes Node. O teste de 170 combinações está incluído num dos 13 cenários D, não representa 170 testes Node novos. A suite Node renderiza as 17 telas pelo router real via SSR, verifica h1 único, links internos canónicos, estados e contratos de isolamento/validação. As suites antigas A/B foram repetidas por terem sido alterados o router, estilos e driver de testes.

Repetir as verificações normais com os comandos acima. Para os browsers, executar sequencialmente `npm run test:browser`, `npm run test:browser:b` e:

```bash
AG_TEST_PAGE=frontend-completion.browser.html \
AG_TEST_RESULTS=/tmp/ag-D-browser-results.json \
node scripts/run-browser-tests.mjs
```

O runner utiliza Chrome headless, credenciais Supabase vazias e um servidor de testes em loopback:4178. Os controlos de viewport/captura adicionados ao driver só servem estes testes. Não foi alterado o comportamento de autorização da aplicação. Imagens temporárias de revisão ficam em `/tmp/ag-D-activity-desktop.png`, `/tmp/ag-D-report-mobile.png` e `/tmp/ag-D-moderation-tablet.png`; não são ficheiros a versionar.

## Acessibilidade e responsividade

O Chrome verificou as 17 telas em **320, 375, 768, 1024 e 1440 px**, nos temas claro/escuro, com demonstrações abertas quando disponíveis. Não foi observado overflow horizontal da página. A tabela de denúncias tem um contentor de scroll horizontal próprio quando necessário, mantendo cabeçalhos/caption. Formulários, cartões e colunas adaptam-se à largura.

Foram verificados h1 único, labels dos campos novos, mensagens de erro associadas, foco devolvido ao acionador, Tab contido e Escape em modal, links de navegação real, estados vazios/erro/carregamento, pesquisa, filtros, paginação, leitura de notificações e rascunho privado. Preservam-se os componentes Modal/Button/Select existentes, foco visível e os tokens de contraste e movimento reduzido das correções A/B; as regressões Chrome B revalidam as preferências/CSS existentes.

Três capturas foram revistas visualmente em desktop, mobile e tablet. Isto não é certificação WCAG: não houve ensaio manual com leitores de ecrã, dispositivos físicos, motores diferentes do Chrome ou todas as combinações de zoom/conteúdo. A semântica e anúncios de estado foram preparados, mas essa revisão assistiva continua recomendada.

## Limitações e próximas integrações

As 17 interfaces estão concluídas no âmbito desta fase; as funcionalidades remotas continuam pendentes. Não existem tabelas/API novas de coleções, seguidores, feed, notificações, denúncias, moderação ou telemetria. Sem esse backend, a interface distingue indisponibilidade de uma resposta válida vazia e não afirma “zero denúncias/seguidores reais”. Não existe persistência de rascunhos destas demonstrações ao sair, opção de publicar uma coleção nem envio de denúncias.

O próximo trabalho deve definir contratos e políticas de acesso no servidor, integrar leituras reais com validação de schema e implementar mutações com confirmação persistida, idempotência e autorização de propriedade/papel. Depois, aprovar os textos institucionais e testar os fluxos com contas/projeto de ensaio autorizados. Adicionar tecnologias assistivas, outros browsers e dispositivos à validação de acessibilidade/responsividade.

Nenhuma credencial foi alterada; `.env.local` foi preservado. Sem migrações remotas, deploy, commit ou push. As alterações permanecem locais para revisão e continuação do desenvolvimento.
