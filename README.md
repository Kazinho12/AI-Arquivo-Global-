# Arquivo Global 2.0

O Arquivo Global pretende ser uma plataforma aberta e gratuita para descobrir, ler e criar obras literárias e visuais. A missão é reunir leitores, escritores e artistas com autonomia criativa e convivência respeitosa.

O estado atual é uma **SPA React com catálogo demonstrativo, ferramentas locais de leitura/autoria e integração de autenticação/perfis Supabase**. Não existe backend implementado para obras, publicação, biblioteca, comentários ou notificações. A Fase 6 de comunidade/moderação continua por implementar.

Referência desta documentação: branch `main`, commit [`a2d6ba1`](https://github.com/Kazinho12/Arquivo-Global/commit/a2d6ba1649d7c3cca57bf0128a6629a723f605d1), revisto em 10/11/2026. O encerramento e as verificações efetivamente executadas constam de [AUDIT-CLOSURE](docs/AUDIT-CLOSURE.md) e [VALIDATION](VALIDATION.md).

## Tecnologias e requisitos

React 19, TypeScript em modo estrito, Vite 6, React Router 6, Tailwind CSS 4, Lucide e SDK Supabase. O `package-lock.json` fixa as versões instaladas; `bun.lock` é histórico e não deve ser utilizado para instalar esta reconstrução.

Para um novo ambiente, escolher uma versão LTS suportada do Node.js, como 22 ou 24 na data desta revisão, e executar as verificações do projeto. O ambiente efetivamente revalidado usa **Node 18.19.1 e npm 9.2.0**; essa versão histórica do Node está fora de suporte e não constitui uma recomendação para produção. Outras versões LTS não foram exercitadas nesta revisão. O Vite fixado admite `^18.0.0 || ^20.0.0 || >=22.0.0`, e `tsx` exige Node >=18. Consultar o [calendário oficial do Node.js](https://nodejs.org/en/about/previous-releases) antes de preparar outro ambiente.

São necessários Git e npm. Os testes de navegador usam Chrome/Chromium compatível com CDP; o runner procura `/usr/bin/google-chrome`, configurável com `CHROME_BIN`. Os testes SQL opcionais usam PGlite instalado fora do projeto, conforme [VALIDATION](VALIDATION.md).

## Instalação e execução local

Num clone do [repositório oficial](https://github.com/Kazinho12/Arquivo-Global):

```bash
npm ci
# Linux/macOS: criar configuração só se ainda não existir.
test -f .env.local || cp .env.example .env.local
npm run dev
```

Se `.env.local` já existir, preservá-lo e editar apenas os valores necessários. Os placeholders do exemplo não habilitam a autenticação. É possível explorar a demonstração sem configurar Supabase; as operações Auth apresentam indisponibilidade explícita.

O servidor liga apenas ao loopback, em [http://127.0.0.1:3000](http://127.0.0.1:3000). A página de entrada é [http://127.0.0.1:3000/entrar](http://127.0.0.1:3000/entrar). Hosts aceites: `localhost` e `127.0.0.1`. Não há `allowedHosts: true` ou exposição de rede pública por defeito. Se a porta estiver ocupada, resolver o conflito ou usar `npm run dev -- --strictPort`; mudar de porta/origem também exige rever os callbacks de autenticação.

Para inspecionar o build, executar `npm run build` e `npm run preview`. Dev e preview usam a porta 3000 por configuração: parar um antes de iniciar o outro. O preview local não publica a aplicação.

## Ambiente e autenticação

As duas variáveis lidas pelo cliente ativo são:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example_replace_me
```

Substituir pelos valores públicos do projeto. `VITE_*` é incorporado no JavaScript entregue ao navegador. Nunca colocar service-role, `sb_secret_*`, segredos Google, chaves R2 ou tokens privados nessas variáveis. `VITE_SUPABASE_ANON_KEY` não é lida; a compatibilidade com JWT público legado `anon` é descrita no [guia de autenticação](docs/AUTHENTICATION.md). `.env.local` continua ignorado pelo Git; apenas `.env.example` pode ser versionado.

No Supabase, o responsável deve configurar Site URL e redirecionamentos compatíveis com a origem utilizada. Para desenvolvimento em 127.0.0.1:3000, a SPA usa `/confirmar-email` e `/redefinir-senha`, com query strings. Google requer ativação/configuração do fornecedor no serviço. O [guia de autenticação](docs/AUTHENTICATION.md) distingue a callback do fornecedor Google da callback da SPA, documenta PKCE e inclui a checklist manual. A presença das variáveis não comprova login, OAuth ou migrações remotas aplicadas.

## Comandos

| Comando                  | Finalidade                                            |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`            | Vite local em 127.0.0.1:3000                          |
| `npm run preview`        | Inspeção local do build                               |
| `npm run typecheck`      | Verificação TypeScript, sem emitir ficheiros          |
| `npm run lint`           | Alias de TypeScript; não é ESLint                     |
| `npm test`               | Testes Node/tsx, regras e renderização SSR            |
| `npm run test:browser`   | Regressões Chrome da Etapa A                          |
| `npm run test:browser:b` | Regressões Chrome da Etapa B; script POSIX            |
| `npm run build`          | TypeScript e bundle Vite em `dist/`                   |
| `npm run format:check`   | Prettier no âmbito definido em package.json           |
| `npm run format`         | Formatação com escrita; rever o diff antes de guardar |
| `git diff --check`       | Whitespace nas alterações versionadas                 |

Os testes de navegador usam perfis temporários e um servidor local na porta 4178, com configuração Supabase real desativada. Não os executar simultaneamente na mesma porta. Os seus resultados não substituem um teste autorizado com contas reais.

## Arquitetura e diretórios

```text
src/main.tsx                 Entrada React/StrictMode
src/foundation/app/         Router, manifesto, sete layouts e providers
src/foundation/components/  Primitivas acessíveis, cartões e descoberta
src/foundation/data/        Oito obras fictícias e autores com IDs explícitos
src/foundation/lib/         Repositório estático, pesquisa e paginação
src/foundation/features/
  auth/                     Supabase Auth, PKCE e controlador testável
  profile/                  Serviço profiles e cache canónica
  reader/                   Quatro leitores, conteúdo seguro e progresso
  library/                  Favoritos, listas e histórico locais
  studio/                   Store, editores e sequenciador locais
  local/                    Persistência, isolamento, recuperação e imagens
  preferences/              Contrato de leitura e acessibilidade
src/foundation/pages/       Interfaces específicas e placeholders
src/foundation/styles/      Tokens, temas, responsividade e estilos
supabase/migrations/        Três migrações locais de perfis
scripts/                    Testes e runners de navegador/SQL
public/                     Recursos estáticos
```

A entrada importa `src/foundation/app/App.tsx`. O código anterior em `src/App.tsx`, `src/context`, `src/components`, `src/lib` e outras áreas foi preservado, mas não é a implementação ativa nem está todo incluído no TypeScript/formatação da fundação.

Os providers gerem tema, mensagens, Auth, preferências e seleção do espaço local. As páginas usam lazy loading. `WorksRepository` continua a ler dados estáticos: criar uma obra no Estúdio não a adiciona ao catálogo público. Ver [ARCHITECTURE](docs/ARCHITECTURE.md) para os fluxos, contratos, matriz de funcionalidades e inventário das rotas.

## Funcionalidades e estado real

- **Implementadas localmente:** navegação/layouts, temas, filtros e pesquisa sobre exemplos, quatro leitores, preferências/acessibilidade, biblioteca, rascunhos, editores de prosa/poesia e sequenciador visual. Há exportação, recuperação explícita e deteção de conflitos entre abas.
- **Integrações parciais:** registo/login/recuperação/Google e consulta/edição de perfis têm chamadas Supabase no código. O funcionamento remoto depende de configuração, políticas e migrações, não certificados pelo build.
- **Demonstrativas:** oito obras/autores fictícios, seleções editoriais, comentários e avaliações no navegador e estatísticas de audiência simuladas. O valor de conclusão de 78% do Estúdio não provém de métricas reais.
- **Pendentes:** publicação pública, catálogo/biblioteca remotos, upload R2, seguidores, notificações, atividade, coleções comunitárias, denúncias, moderação, administração e conteúdo completo de ajuda/regras/privacidade.

A [matriz de funcionalidades](docs/ARCHITECTURE.md#matriz-de-funcionalidades) distingue frontend, backend, persistência, testes e estado. Uma rota ou tela existente não comprova uma operação remota implementada.

## Rotas, dados e integrações

O manifesto tem **57 rotas canónicas e sete layouts**: `public`, `auth`, `reader`, `account`, `studio`, `moderation` e `system`. São 41 rotas com componentes específicos e 16 com `DevelopmentPage`; a tela específica de seguidores também é placeholder. `/dev/design-system` e o fallback 404 são adicionais. A [lista completa](docs/ARCHITECTURE.md#inventário-das-57-rotas) documenta cada caminho. O nome de um layout não concede autorização administrativa.

Rascunhos e biblioteca usam localStorage com espaços separados por utilizador/visitante. Imagens ficam em IndexedDB, sem uploads remotos. Preferências são de conforto deste navegador. Comentários/avaliações demo mantêm chaves locais por obra e não são interações sociais autenticadas.

Dados antigos sem proprietário não são atribuídos automaticamente a uma conta. Usar **Cópias e recuperação de dados locais** no Estúdio/conta para exportar ou confirmar uma recuperação. Manter a aba aberta quando houver aviso de conteúdo apenas em memória. Não há encriptação local nem sincronização entre dispositivos; limpar o navegador pode apagar dados. [Detalhes dos stores e recuperação](docs/ARCHITECTURE.md#persistência-local-e-recuperação).

Supabase é utilizado para Auth e `profiles`. As três migrações locais só tratam perfis, não obras ou comunidade. A sua aplicação remota é manual e exige revisão prévia; [ordem e verificações](docs/ARCHITECTURE.md#migrações-sql-locais). Cloudflare R2 está planeado. O cliente Worker em `src/lib/api.ts` é legado e não participa da entrada ativa. `vercel.json` contém fallback SPA, mas não comprova deployment.

## Limitações e contribuição

O encerramento da auditoria trata as correções locais, não certifica produção ou ausência de todos os bugs. Consultar [AUDIT-CLOSURE](docs/AUDIT-CLOSURE.md) para riscos, verificações remotas pendentes e dívida técnica. A validação visual completa em mobile, leitores de ecrã e outros navegadores continua pendente.

Antes de contribuir: ler os contratos de arquitetura, preservar as 57 rotas/sete layouts e evitar apagar dados legados. Trabalhar num conjunto pequeno, acrescentar regressões relevantes e executar typecheck, testes, build, formatação e diff-check. Rever `.env.local`/segredos fora do índice; não incluir dependências, builds ou cópias privadas. Alterações de storage/SQL devem ter estratégia não destrutiva. Migrações remotas, publicação ou operações Git externas exigem autorização do responsável.

## Documentação

- [Arquitetura, módulos, funcionalidades, rotas e SQL](docs/ARCHITECTURE.md)
- [Autenticação, ambiente e Google OAuth](docs/AUTHENTICATION.md)
- [Validação atual e registos históricos](VALIDATION.md)
- [Encerramento dos 22 problemas](docs/AUDIT-CLOSURE.md)
- [Relatório histórico da Etapa A](docs/STABILIZATION-A.md)
- [Relatório histórico da Etapa B](docs/STABILIZATION-B.md)
