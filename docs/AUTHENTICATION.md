# Autenticação — Arquivo Global 2.0 / Fase 3

## Auditoria e arquitetura

Estado inicial: branch `main`, árvore limpa, commit `e98b3d7`. O SDK Supabase não estava nas dependências ativas. As integrações antigas em `src/lib/supabase.ts` e `src/context/AuthContext.tsx` foram identificadas e preservadas, sem importação pela fundação. Não existiam `.env`, `.env.local`, `.env.development` ou `.env.development.local`, e as variáveis Supabase não estavam presentes no processo. Os valores não foram impressos.

- `features/auth/config.ts`: valida apenas URL e chave públicas; rejeita chaves privadas reconhecíveis e valores ilustrativos.
- `features/auth/client.ts`: cliente único, criado apenas no navegador e com configuração válida. O SDK foi fixado em `2.49.8`, compatível com o Node 18.19 existente; atualizações futuras devem ser validadas com a versão de Node adotada pelo projeto.
- `features/auth/controller.ts`: estado tipado, subscrição única de eventos, recuperação/validação da sessão, operações e callbacks. Interface `AuthPort` permite testes sem serviços reais. Os callbacks de `onAuthStateChange` só atualizam estado de forma síncrona: não fazem chamadas Auth assíncronas dentro do listener.
- `features/auth/AuthProvider.tsx`: ponte React com `useSyncExternalStore`, ligada ao provider existente. Startup idempotente e limpeza do listener, incluindo remontagens do StrictMode.
- `features/auth/security.ts`: validação, mensagens sem detalhes sensíveis, destinos internos e remoção dos parâmetros de autenticação do URL.
- `features/auth/components.tsx`: feedback, senha visível/oculta e navegação de conta.
- `pages/Auth.tsx`: as seis interfaces reais, reutilizando `AuthLayout` e o design system. As restantes rotas e os sete layouts continuam a existir.

Não foi criado backend, perfil, biblioteca, Estúdio funcional nem administração. Mostrar uma sessão no frontend não substitui autorização no servidor. Consultas futuras têm de respeitar políticas RLS e validação de autorização no backend.

## Variáveis públicas

Copiar `.env.example` para `.env.local` manualmente e substituir os exemplos:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_DO_PROJETO
```

`VITE_*` é público e integra o bundle. Nunca usar service-role, `sb_secret_*`, segredos Google/OAuth ou credenciais administrativas. O cliente aceita `sb_publishable_*`. Um JWT público legado com `role: anon` pode ser usado **apenas na variável `VITE_SUPABASE_PUBLISHABLE_KEY`**; a compatibilidade é explícita em `readAuthConfig`, através de `legacyAnon`. `VITE_SUPABASE_ANON_KEY` não é lida. Essa classificação não verifica a assinatura nem concede autorização: o serviço valida a chave e as sessões.

Nenhum `.env` real foi criado ou sobrescrito. Sem configuração válida, as telas continuam utilizáveis para navegação, mostram indisponibilidade e bloqueiam operações remotas. Não são criados utilizadores ou sessões fictícias. Reiniciar Vite após configurar variáveis. Em hospedagem futura, definir as duas variáveis públicas antes do build.

## Site URL e URLs de redirecionamento

No projeto Supabase, o proprietário deverá configurar Authentication / URL Configuration. Nada foi alterado externamente nesta fase.

- Site URL de desenvolvimento: `http://127.0.0.1:3000` (ou `http://localhost:3000`, conforme o endereço efetivamente utilizado).
- Callbacks da SPA: `/confirmar-email` para confirmação e Google; `/redefinir-senha` para recuperação.
- São enviados parâmetros `next` seguros e, para Google, `fluxo=oauth`. A allowlist deve contemplar esses URLs com query string.
- Durante desenvolvimento pode ser autorizado `http://127.0.0.1:3000/**`. Se usares `localhost`, autoriza também essa origem; os armazenamentos de `localhost` e `127.0.0.1` são diferentes.
- Em produção, usar HTTPS e limitar a allowlist aos callbacks da aplicação e às queries necessárias, seguindo as regras de correspondência do Supabase; evitar wildcards globais em domínios de produção.
- A hospedagem deve devolver `index.html` para visitas diretas a estes caminhos. O fallback SPA já existe no projeto.

`next` só admite rotas internas reconhecidas. URLs externos, caminhos que começam por `//`, barras invertidas, controlos codificados, destinos desconhecidos e ciclos nas telas Auth são substituídos por `/catalogo`.

## PKCE, confirmação e recuperação

`flowType: 'pkce'`. A deteção automática de callbacks está deliberadamente desativada (`detectSessionInUrl: false`) para que apenas o controlador processe o resultado, recolha o erro e limpe o URL. Não existe uma segunda implementação OAuth: `exchangeCodeForSession` e `verifyOtp` pertencem ao SDK oficial.

1. Registo chama `signUp`, com `emailRedirectTo` em `/confirmar-email`.
2. Se o Supabase devolver sessão, a UI apresenta a sessão ou segue para boas-vindas. Se devolver apenas utilizador, a mensagem é prudente: pedido recebido e instruções se o endereço puder ser registado. Isso respeita respostas ofuscadas para e-mails já existentes.
3. O callback PKCE chega com `?code=…`. O controlador captura-o em memória, remove-o do endereço e troca-o uma única vez com o SDK. Depois recupera a sessão e chama `getUser` para validar o utilizador no serviço.
4. Também são aceites templates de e-mail que enviem `token_hash` e `type=signup` ou `type=email` para `/confirmar-email`. O controlador usa `verifyOtp`. Só apresenta confirmação quando há resultado válido e e-mail confirmado no utilizador devolvido pelo serviço.
5. Recuperação chama `resetPasswordForEmail` com redirecionamento para `/redefinir-senha`. O feedback não revela se a conta existe. O callback aceita código PKCE ou `token_hash` com `type=recovery`.
6. A redefinição usa `updateUser({ password })` e só anuncia alteração depois de resposta válida. Uma sessão autenticada válida também permite atualizar a senha após recarregar a página; a página não trata um parâmetro `type` como autorização. Links reconhecidamente inválidos bloqueiam a operação até nova recuperação.
7. Links inválidos, expirados, sem verificador PKCE ou erros de rede apresentam feedback seguro e opção de pedir novo link. Códigos não são trocados novamente ao remontar o provider.

Os templates padrão com `ConfirmationURL` devem ser compatíveis com a configuração PKCE do projeto. Templates personalizados com hash devem apontar para o caminho correto, por exemplo a recuperação para `/redefinir-senha?token_hash={{ .TokenHash }}&type=recovery`. Não colocar hashes ou códigos em logs, analytics, capturas partilhadas ou tickets. Links de grant implícito com bearer tokens no fragmento são recusados e limpos; solicitar novo link pelo fluxo PKCE da aplicação.

O verificador PKCE é gerido pelo SDK. Normalmente, o link tem de ser aberto no mesmo navegador/origem que iniciou o pedido. Um e-mail expirado, já consumido ou aberto noutro navegador pode exigir novo pedido. Scanners de e-mail também podem consumir links. O reenvio e a recuperação têm intervalo local de 60 segundos; o servidor continua a impor os seus próprios limites, que não podem ser substituídos pela UI.

## Google OAuth

No painel Supabase, ativar o fornecedor Google e configurar as credenciais no próprio serviço. No Google Cloud, configurar o ecrã de consentimento e o cliente OAuth; a URI autorizada de callback é a URI fornecida pelo Supabase, habitualmente `https://SEU_PROJETO.supabase.co/auth/v1/callback`. Os segredos Google ficam no Supabase/Google Cloud, nunca na SPA.

A aplicação usa apenas `signInWithOAuth({ provider: 'google', options: { redirectTo } })`. O Google volta ao Supabase e este devolve o utilizador para `/confirmar-email?fluxo=oauth&next=…`. A aplicação só afirma sucesso após a troca e validação da sessão. Se o fornecedor estiver desativado, o acesso não funciona; o SDK pode devolver erro ou o serviço mostrar o erro depois do redirecionamento. Essa dependência está indicada na tela de entrada.

## Persistência, expiração e logout

- `persistSession: true` e `autoRefreshToken: true`: o SDK gere armazenamento local e renovação; a aplicação não escreve senhas, access tokens ou refresh tokens num armazenamento próprio.
- Ao arrancar: listener único, inicialização do SDK, recuperação da sessão e `getUser`. O cabeçalho mantém estado neutro até terminar a inicialização.
- `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED` e `PASSWORD_RECOVERY` atualizam o estado. Uma leitura inicial atrasada não ressuscita uma sessão terminada entretanto.
- Logout usa `scope: 'local'` para terminar a sessão atual, sem prometer terminar todas as sessões de outros dispositivos. A sincronização entre abas e as alterações no armazenamento são geridas pelo SDK.
- Sessões inválidas e erros de refresh são tratados; `getUser` ajuda a verificar o utilizador durante a recuperação. O frontend não consegue prometer deteção imediata de toda revogação: JWTs já emitidos podem continuar válidos até expirarem. O servidor é a autoridade.
- Sem rede, o provider apresenta erro operacional e permite tentar recuperar novamente, em vez de tratar uma falha de rede como logout confirmado.
- Em navegação privada, os dados podem desaparecer ao fechar o navegador. Com armazenamento bloqueado/limpo, a persistência pode falhar ou ficar limitada à memória. A sessão termina também quando expira sem renovação, é revogada ou o utilizador termina sessão. Não existe fallback persistente de tokens criado pela aplicação.

## Validação manual com projeto real

Executar apenas com contas de teste autorizadas; não usar dados pessoais de terceiros.

1. Configurar as duas variáveis públicas e os callbacks; reiniciar Vite. Confirmar que desaparece o estado de configuração ausente.
2. Registar um e-mail de teste, confirmar a mensagem e a diferença entre registo com confirmação ativa/inativa. Testar senha fraca e confirmação diferente.
3. Entrar, atualizar a página, fechar/reabrir o navegador e confirmar que a sessão válida regressa sem novo login. Confirmar estado neutro durante a inicialização.
4. Abrir outra aba; fazer logout e confirmar sincronização. Invalidar uma sessão de teste no serviço e verificar o comportamento quando o SDK a renovar/verificar.
5. Pedir recuperação para conta existente e endereço inexistente; comparar feedback genérico. Abrir link válido no mesmo navegador, definir senha, confirmar com o serviço. Testar link expirado, reutilizado e sem verificador.
6. Testar confirmação válida, inválida, expirada e reenvio; respeitar o intervalo da UI e os limites do serviço.
7. Ativar Google e testar ida/retorno, cancelamento e fornecedor desativado. Testar `next` interno e rejeição de destinos externos.
8. Simular modo offline, storage indisponível e navegação privada. Confirmar que não há tokens no URL final, nos logs de aplicação ou em mensagens de erro.
9. Rever teclado, leitores de ecrã e temas; verificar que nenhuma área administrativa é autorizada apenas pelo estado frontend.

## Testes e limites da entrega

Os testes de `scripts/auth.test.tsx` usam mocks do serviço e armazenamento em memória. Há um teste que executa o SDK oficial com HTTP simulado para verificar escrita/restauração da sessão, refresh e remoção no logout. Não são chamadas reais a um projeto Supabase, não enviam e-mails e não validam Google externamente. A renderização das seis telas usa a mesma árvore React Router da SPA.

Sem configuração real neste ambiente, a entrega não comprova login, persistência entre processos de um navegador real ou entrega de mensagens contra um projeto Supabase. Esses passos permanecem na checklist manual. Nenhuma configuração Supabase ou Google Cloud foi modificada.

Referências oficiais consultadas: [sessões](https://supabase.com/docs/guides/auth/sessions), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [eventos Auth](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [senhas](https://supabase.com/docs/guides/auth/passwords), [redirecionamentos](https://supabase.com/docs/guides/auth/redirect-urls), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Ficheiros da entrega

- `.env.example`
- `README.md`
- `VALIDATION.md`
- `docs/AUTHENTICATION.md`
- `package-lock.json`
- `package.json`
- `scripts/auth.test.tsx`
- `src/foundation/app/App.tsx`
- `src/foundation/app/layouts.tsx`
- `src/foundation/app/providers.tsx`
- `src/foundation/features/auth/AuthProvider.tsx`
- `src/foundation/features/auth/client.ts`
- `src/foundation/features/auth/components.tsx`
- `src/foundation/features/auth/config.ts`
- `src/foundation/features/auth/controller.ts`
- `src/foundation/features/auth/security.ts`
- `src/foundation/pages/Auth.tsx`
- `src/foundation/pages/Home.tsx`
- `src/foundation/styles/global.css`
