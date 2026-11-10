# Validação atual — Etapa C

Data: 10/11/2026. Branch `main`, HEAD `a2d6ba1649d7c3cca57bf0128a6629a723f605d1`. Árvore inicialmente limpa; referência presente no histórico. Documentação atual: [encerramento](docs/AUDIT-CLOSURE.md), [arquitetura/matriz](docs/ARCHITECTURE.md), [instalação](README.md) e [Auth](docs/AUTHENTICATION.md).

## Resultados executados nesta revisão

Ambiente observado: Linux, Node 18.19.1, npm 9.2.0, Vite 6.4.5, Chrome headless. Esta é a versão efetivamente testada; consultar o README para requisitos e suporte do Node.

| Verificação                               | Resultado                                      |
| ----------------------------------------- | ---------------------------------------------- |
| `npm run typecheck`                       | Aprovado, sem erros                            |
| `npm test`                                | 186 aprovados, 0 falhas, 0 ignorados           |
| `npm run build`                           | Aprovado, bundle Vite produzido                |
| `npm run test:browser`                    | 14 verificações Chrome aprovadas               |
| `npm run test:browser:b`                  | 12 verificações Chrome aprovadas               |
| `scripts/validate-profile-migrations.mjs` | 2 cenários SQL locais aprovados                |
| `scripts/validate-usernames.mjs`          | 3 cenários SQL locais aprovados                |
| `npm run format:check`                    | Aprovado após formatação dos documentos atuais |
| `git diff --check`                        | Aprovado                                       |
| Manifesto/layouts                         | 57 rotas únicas, sete layouts preservados      |

Os 26 cenários Chrome e cinco cenários SQL são adicionais aos 186 testes Node; não são 217 testes da mesma suite. Chrome usa uma aplicação de teste com credenciais vazias, incluindo IndexedDB, recarregamento e duas abas reais. O runner inicia o servidor de teste em loopback na porta 4178. Executar A e B sequencialmente.

Os testes SQL usam PostgreSQL local via PGlite, papéis/Auth simulados e migrações do repositório. Para repetir, disponibilizar `@electric-sql/pglite` fora do runtime da aplicação e definir `PGLITE_PATH` para o módulo `dist/index.js` antes de executar `node scripts/validate-profile-migrations.mjs` e `node scripts/validate-usernames.mjs`. Não é uma dependência de produção nem uma execução no Supabase remoto. Os cinco cenários cobrem instalação nova, base original existente, reexecução, RLS, normalização e aborto seguro por colisão.

## Alcance e preservação

Os testes verificam as correções A/B no âmbito local; Auth/perfis usam mocks e HTTP simulado. Não certificam Google OAuth real, entrega de e-mail, recuperação de senha no serviço, migrações/RLS remotas, dispositivos físicos, todos os browsers, auditoria completa WCAG ou ausência de vulnerabilidades nas dependências. SSR/hidratação de componentes não significa que exista servidor SSR.

Foram mantidos o código funcional, rotas/layouts, SQL, dependências/lockfiles, `.env.local` e relatórios A/B. Apenas documentação, exemplo de ambiente com placeholders e a exceção desse exemplo no `.gitignore` foram alterados. Nenhum commit, push, deploy ou comando SQL remoto nesta etapa.

## Registo histórico — entregas anteriores

As secções abaixo descrevem o estado nas datas originais. Contagens de testes, ausência de configuração e afirmações sobre funcionalidades dessas entregas não descrevem o estado atual. Os relatórios A/B também são históricos e permanecem intactos.

> Etapa B (10/11/2026): consultar [docs/STABILIZATION-B.md](docs/STABILIZATION-B.md) para as verificações atuais. As entregas anteriores continuam registadas abaixo.

> Atualização de 10/11/2026: consultar [Etapa A](docs/STABILIZATION-A.md) para o estado e os resultados atuais. As secções seguintes preservam o registo histórico das entregas anteriores.

# Validação — Fundação 2.0

Data: 8 de novembro de 2026 (Africa/Maputo).

## Autenticação — Prompt 3

### Preservação, ambiente e implementação

Estado inicial: branch `main`, árvore limpa no commit `e98b3d7`. O SDK Supabase não estava instalado na fundação; as integrações legadas foram inspecionadas e preservadas. A auditoria de ambiente leu apenas presença/nomes: não existiam ficheiros de configuração real nem variáveis Supabase no processo. `.env.example` foi atualizado com valores ilustrativos; nenhum `.env` ou `.env.local` foi criado ou sobrescrito.

As seis telas Auth, o provider único, os métodos do SDK e o estado do cabeçalho foram integrados. PKCE, confirmação por hash, limpeza de callbacks, destinos internos, validação e cooldown local estão documentados em `docs/AUTHENTICATION.md`. Persistência e refresh são responsabilidade do SDK; não há armazenamento próprio de senhas ou tokens. Nenhum serviço externo foi configurado.

### Testes e revisão

- `npm run typecheck`: passou.
- `npm test`: **118 testes passaram, 0 falharam** — 88 de regressão e 30 novos testes de autenticação. Todos os testes Auth são simulados; um utiliza o SDK real com HTTP e armazenamento em memória. Não houve login, e-mail, recuperação ou Google contra um projeto real.
- Cobertura nova: validação, configuração/chaves públicas, destinos e callbacks, recuperação da sessão, listener único, corrida com logout, atualizações de sessão/refresh, erros/revogação, submissão duplicada, registo pendente, recuperação/reenvio/cooldown, redefinição e renderização das seis telas.
- `npm run build`: passou.
- `npm run format:check`: passou.
- `git diff --check`: passou.
- Revisão no navegador local: seis telas verificadas em 320, 768 e 1440 px, sem transbordo horizontal observado. Tema escuro nas revisões móvel/tablet e tema claro na revisão desktop. Alternância e persistência do tema ao navegar verificadas; preferência original restaurada.
- Controlo mostrar/ocultar senha e passagem de foco por Tab verificados na tela de entrada; navegação para recuperação e voltar também exercitada. As operações remotas estavam desativadas por falta de configuração. As dimensões temporárias do navegador foram restauradas.

### Limitações e Git

Não foi validada persistência entre reinícios de um navegador real com um projeto Supabase, entrega de e-mails, Google OAuth real, todos os estados remotos no navegador ou leitores de ecrã. Dependem de configuração e contas de teste autorizadas; os passos estão na documentação Auth. Não foram implementados perfis completos, biblioteca, Estúdio, backend ou administração, nem iniciada a Fase 4.

Alterações locais sem stage, commit ou push nesta fase. O registo das fases anteriores abaixo é histórico. A lista de ficheiros desta fase consta de `docs/AUTHENTICATION.md`.

## Descoberta e Catálogo — Prompt 2

### Preservação e escopo

Estado inicial verificado: branch `main`, árvore limpa e `HEAD` em `31c74d5`. O estado Git local indicava `main` alinhada com a referência local `origin/main`; não foi feito fetch ou push nesta etapa. Foram preservados os sete layouts, o manifesto das 57 rotas, os tokens dos dois temas, o contrato `WorksRepository`, os oito trabalhos fictícios e todo o código legado. Sem novas dependências de runtime, backend, autenticação ou publicação.

### Verificações executadas

- `npm run typecheck`: passou, sem erros.
- `npm test`: **88 testes passaram, 0 falharam** (64 existentes e 24 novos). A execução inicial foi bloqueada pelo pipe local do `tsx` na sandbox; a execução autorizada fora da sandbox concluiu.
- Os novos testes renderizam as nove telas pela mesma árvore `ApplicationRoutes` usada na SPA, usando `StaticRouter` no ambiente de teste. Verificam um título principal por tela, ligações a rotas registadas, URLs com filtros, respostas vazias, ID inexistente com 404 e tag desconhecida com recuperação.
- Regras puras verificadas: pesquisa por campo sem acentos, combinação AND de formato/género/tags, contagens de tags e categorias derivadas dos dados, slugs, integridade e referências editoriais, paginação sem sobreposição, páginas inválidas e associações entre obras.
- `npm run build`: passou, com importações dinâmicas para as páginas e componentes partilhados.
- `npm run format:check`: passou.
- `git diff --check`: passou.

### Limitações

A revisão visual não foi executada: o navegador integrado tinha recusado acesso a `localhost` nesta sessão. Não se tentou contornar esse bloqueio. A renderização de HTML nos testes não valida geometria, contraste sobre as capas, interação de teclado, histórico ou persistência de tema num navegador. Os estilos cobrem os intervalos de 320, 375, 768, 1024 e 1440 px; os tokens, o foco visível e a preferência por movimento reduzido foram mantidos, mas a validação visual destes tamanhos e temas continua pendente.

A página de obra apresenta apenas metadados e sinopse demonstrativos. Sem texto integral, capítulos, comentários, avaliações, popularidade ou personalização. Tendências são seleções editoriais manuais identificadas como demonstração.

### Git e continuação

Alterações locais exclusivamente para esta etapa, sem stage, commit ou push. Nenhuma fase seguinte foi iniciada. A revisão visual e qualquer nova fase ou operação Git de gravação dependem de autorização do proprietário.

### Ficheiros desta entrega

- `README.md`
- `VALIDATION.md`
- `package.json`
- `scripts/discovery.test.tsx`
- `src/foundation/app/App.tsx`
- `src/foundation/app/layouts.tsx`
- `src/foundation/components/Discovery.tsx`
- `src/foundation/components/WorkCollection.tsx`
- `src/foundation/components/ui.tsx`
- `src/foundation/data/editorial.ts`
- `src/foundation/lib/discovery.ts`
- `src/foundation/lib/worksRepository.ts`
- `src/foundation/pages/Catalog.tsx`
- `src/foundation/pages/Categories.tsx`
- `src/foundation/pages/Explore.tsx`
- `src/foundation/pages/Home.tsx`
- `src/foundation/pages/Search.tsx`
- `src/foundation/pages/States.tsx`
- `src/foundation/pages/Tags.tsx`
- `src/foundation/pages/Trends.tsx`
- `src/foundation/pages/Work.tsx`
- `src/foundation/styles/global.css`

## Histórico da Fundação 2.0 — Prompt 1

Este registo descreve a entrega anterior ao commit `31c74d5`.

### Executado

- Estado inicial: repositório `/home/killian/AI-Arquivo-Global-`, branch `main`, árvore limpa e remoto `origin` em `https://github.com/Kazinho12/AI-Arquivo-Global-.git`.
- Instalação npm concluída. A primeira tentativa foi impedida por DNS na sandbox; a instalação com acesso autorizado ao registo npm concluiu. Tailwind fixado em 4.1.0, compatível com o Node 18.19 deste ambiente. Lockfile npm incluído.
- `npm run typecheck`: passou, TypeScript estrito, sem erros na nova fundação e configurações. Código anterior preservado está fora deste escopo de compilação.
- `npm test`: 64 testes passaram, 0 falharam. Inclui comparação independente das 57 rotas pedidas, correspondência de cada rota pelo React Router, parâmetros dinâmicos, precedência de rotas estáticas, ausência de match para endereço desconhecido, atribuição dos layouts administrativos, filtros compostos, pesquisa sem acentos, ordenação e integridade dos dados demonstrativos. Não constitui um teste visual de renderização das 57 páginas.
- `npm run build`: passou, gerando `dist/` e chunks separados para início, catálogo e design system.
- Servidor Vite iniciou e `curl -I http://localhost:3000/` devolveu HTTP 200.
- `git diff --check` e `npm run format:check`: passaram.
- Contraste dos tokens principais calculado pela fórmula WCAG: texto 15,70:1 (escuro) e 14,01:1 (claro), texto secundário 8,21:1 e 5,19:1 nas superfícies verificadas; botões principais 10,96:1 e 10,01:1. Esta verificação estática não cobre todas as sobreposições decorativas das capas.
- Inspeção do diff e dos ficheiros novos: sem criação de backend, pedidos externos, clientes de serviços na fundação ou credenciais privadas detetadas por padrões comuns. Esta inspeção não é uma auditoria de segurança integral.

### Limitações verificadas

O navegador integrado recusou o acesso a `http://localhost:3000/` por falta de autorização. Não se tentou contornar esse bloqueio. Não foram executados testes interativos de voltar/avançar, persistência do tema, foco, modal, menus ou revisão visual nos tamanhos 320, 375, 768, 1024 e 1440 px. Existem media queries para esses intervalos, tokens para ambos os temas, foco visível, link para saltar conteúdo, landmarks e suporte a movimento reduzido; a presença do código não equivale à aprovação desses testes visuais. A validação visual e com leitor de ecrã continua pendente.

O servidor de desenvolvimento usado para a verificação foi temporário. Para nova revisão local: `npm run dev`. Nenhuma aplicação foi publicada.

### Estado de entrega

Não foram feitos commit, push, stage ou criação de serviços externos. O trabalho está na árvore local, pronto para revisão. O código anterior continua preservado. `bun.lock` é histórico; a versão 2 usa `package-lock.json`. Os ficheiros ignorados `node_modules/` e `dist/` não são parte da entrega Git.

A implementação completa das nove telas de Descoberta e Catálogo depende de aprovação do proprietário. Backend, autenticação, publicação, leitura completa, biblioteca, comunidade e administração permanecem por implementar.
