# F4.2-A — Infraestrutura e capas personalizadas (local)

## Âmbito entregue

Capas JPEG/PNG/WebP, 5 MB, enquadramento 2:3 com posição e zoom. Pré-visualização
local; só o botão de guardar envia/associa o ficheiro e só o ACK da revisão mostra
sucesso. O wizard cria primeiro o rascunho para obter um UUID real; se o upload
falhar, mantém esse rascunho e dá uma ligação para o abrir, sem criar duplicados.
A galeria e os 32 estilos + legacy, seeds e variações permanecem disponíveis ao
voltar ao Cover Studio. Nenhuma imagem é atribuída automaticamente a uma publicação.

O repositório privado transporta `cover_image` sob opt-in e mantém a revisão
existente; os snapshots copiam o campo apenas em publicação/atualização explícita.
Catálogo, pesquisa, perfil e detalhes reutilizam `Cover` com imagem e fallback.
O Estúdio utiliza GET autenticado e Blob URL; a seleção/cancelamento nunca apaga
ficheiros ainda referenciados. Crop é não destrutivo (CSS consistente em todas as
superfícies), não uma nova imagem processada no servidor. O original continua até
5 MB. O frontend decodifica a imagem antes de a aceitar; o Worker verifica formato,
estrutura, dimensões e limite durante a leitura do corpo. Não é um antivírus ou
um serviço de recodificação; WebP animado não é aceite nesta entrega.

## Instalação manual, só após autorização

1. Rever `20261114000000_custom_cover_media.sql`; exige F2.1/F2.2/F3.1/F3.3,
   F3.4/F3.5 e F4.1. Executar manualmente como uma transação. Não se alteram
   migrations anteriores, Auth, avatares, rotas, SEO ou sitemap.
2. Instalar `docs/cloudflare-cover-media.js` no **Worker existente**
   `arquivo-global-api`, acima de `export default`, mantendo todos os handlers.
   Dentro do fetch existente inserir **antes do OPTIONS e autenticação global**:

   ```js
   const coverResponse = await handleAgCoverMedia(request, env);
   if (coverResponse) return coverResponse;
   ```

   Prefixos alheios devolvem null. Só os preflights de /media/cover/ são tratados
   aqui. Bindings existentes: `AG_MEDIA`, `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`. Não criar bucket nem Worker adicionais.
   Não usar `service_role`. As operações de escrita de media requerem um segredo
   interno adicional **só no Worker e PostgreSQL**, `COVER_MEDIA_TOKEN` (pelo menos
   32 bytes aleatórios). Gera-o num gestor de segredos; calcula SHA-256 localmente
   e grava apenas o hash hexadecimal em `cover_media_settings.worker_token_hash`
   como administrador. Guarda o token como Secret no Worker, nunca como `VITE_*`.
   A migration deixa o hash NULL, bloqueando a escrita até esta configuração.
   O token nunca deve ser incluído no repositório, URLs, logs ou SQL Editor; neste
   último usa apenas o hash. A prova interna acompanha as RPCs de media por HTTPS,
   além da identidade Supabase do proprietário.

3. Validar em ambiente autorizado upload/reload, substituição, remoção, retirada,
   revisão concorrente, conta alheia e acesso anónimo. Só depois definir
   `VITE_ENABLE_CUSTOM_COVERS=true` no frontend e publicar mediante autorização.
   Flag ausente/false não seleciona nem grava a nova coluna e mantém o sistema
   antigo. Nunca ativar apenas com base nos testes locais.

## Contrato Worker

- POST `/media/cover/works/{workUUID}`: bytes da imagem, MIME e Bearer Supabase;
  devolve `{assetId}` apenas após R2 e confirmação de metadados.
- GET `/media/cover/private/{workUUID}/{assetUUID}`: Bearer, propriedade real da
  obra e do asset. Não é uma URL pública de imagem.
- GET `/media/cover/public/{publicationUUID}/{assetUUID}`: só se o snapshot público
  atual apontar para esse asset; confirma novamente em cada pedido, sem cache.
- DELETE `/media/cover/assets/{assetUUID}`: só proprietário e apenas sem referências
  em quaisquer rascunhos ou snapshots públicos. Operação repetível.
- POST `/media/cover/cleanup`: proprietário; seleciona até 50 órfãos antigos (>24h),
  filtrando referências antes do limite; retoma eliminações interrompidas. Não mexe em
  avatares, páginas ou outros namespaces.

As chaves são `covers/{owner}/{work}/{asset}.{ext}`. O R2 mantém um manifesto
privado `cover-index/{asset}.json` para resolver o asset sem expor owner/work/key no
payload público. Os manifestos nunca são servidos pelo Worker. A chave pública
Supabase opera sob RLS; os tokens dos visitantes não são propagados ao GET público.

## Segurança, quotas e recuperação

A tabela owner-only `cover_assets` regista pending/ready/deleting/deleted. Regras
SQL serializam associação/publicação e início de eliminação: nunca apagar uma
capa ainda usada, incluindo por uma obra duplicada. O Worker verifica Auth no
servidor e não confia no owner do browser. As RPCs de reserva/finalização/eliminação exigem simultaneamente o proprietário
autenticado e a prova interna do Worker. Um browser não pode declarar uploads
fictícios como ready, liberar quota sem apagar R2 ou forjar outra conta.
Sem token/hash, o serviço falha visivelmente, nunca simula sucesso.

Default configurável por administrador em `cover_media_settings`: 5 MB/ficheiro,
200 assets ativos/proprietário e 8 GiB reservados para capas. São limites desta
entrega de capas, não limites de páginas. `MEDIA_MAX_COVER_BYTES` permite ao Worker
baixar o limite; `MEDIA_ALLOWED_ORIGINS` acrescenta origens exatas, separadas por
vírgulas. Desenvolvimento 127.0.0.1/localhost:3000 e produção Vercel já incluídos.
Confirmar a ocupação real de R2 antes de definir o orçamento: a quota de capas não
mede avatares/outros objetos e não garante custos zero. A futura entrega B reutiliza
este registo, com quotas revistas antes de aceitar capítulos visuais.

Upload interrompido ou ACK perdido pode deixar um objeto/registo não associado;
fica contabilizado e pode ser limpo após a carência. Falha entre source/manifest/RPC
não anuncia sucesso. Uma eliminação R2 interrompida fica deleting e pode repetir-se. Uploads pending
com menos de 24 horas não podem ser eliminados, evitando corrida com um PUT ativo.
Não correr limpeza administrativa ou remover objetos diretamente para contornar
referências. A remoção no formulário só desassocia o rascunho ao guardar; a capa
pública mantém-se até atualização/retirada explícita.

Reversão: desligar a flag do frontend, sem remover colunas, registos ou objetos.
As capas gráficas servem de fallback e as referências existentes são preservadas.
Não reverter funções ou apagar assets já publicados sem revisão de dependências.

## Validação

`node --import tsx --test scripts/custom-covers.test.tsx` e testes de regressão.
`PGLITE_PATH=/caminho/existente/pglite/dist/index.js node scripts/validate-custom-covers.mjs`
usa só PostgreSQL descartável; carrega todas as migrations editoriais em sequência
com privilégios padrão hostis e valida revisões, snapshots, propriedade, quotas,
duplicação, referências e retirada. Não contacta Supabase/R2.
Cenários de navegador: `AG_TEST_PAGE=custom-covers.browser.html node scripts/run-browser-tests.mjs`.
Typecheck e build de produção são obrigatórios antes de ativação.

Implementação local sem SQL remoto nem implantação do Worker. A finalização Git
é autorizada separadamente; a feature flag deve permanecer false. Validação integrada
no Worker real continua pendente. F4.2-B/C/D não foram iniciadas; aguardar autorização.

Resultados desta entrega: testes de regressão direcionados aprovados; testes
específicos finais do Worker/contratos aprovados; seis cenários de navegador
aprovados (incluindo 360/768/1280 px, claro/escuro e cancelamento da limpeza).
Todas as migrations editoriais e a nova migration passaram em PostgreSQL
descartável, com prova interna, RLS e grants verificados. Build/typecheck,
formatação dos ficheiros alterados e git diff --check passaram. Nenhuma
validação remota nem implantação do Worker foi realizada.

## Sequência exata de ativação — não executada nesta revisão

**Enquanto estas condições não forem cumpridas, manter Production sem a flag ou
com `VITE_ENABLE_CUSTOM_COVERS=false`.**

1. Supabase SQL Editor, projeto correto: guardar as definições remotas atuais das
   cinco RPCs substituídas e confirmar que correspondem às migrations F3.5/F4.1.
   Confirmar os pré-requisitos com leitura:

   ```sql
   SELECT to_regclass('public.profile_follows') AS follows,
          to_regprocedure('public.profile_published_works(uuid,integer,integer)') AS profile_rpc;
   SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='works'
     AND column_name IN ('cover_style','cover_seed');
   ```

   As duas primeiras referências e as duas colunas devem existir. Rever e aplicar
   **todo** `supabase/migrations/20261114000000_custom_cover_media.sql`, incluindo
   BEGIN/COMMIT. Se houver divergência/falha, parar; não repetir nem apagar objetos
   para contornar o erro. Nenhuma alteração a migrations anteriores.

2. Gerar um segredo aleatório de 32 bytes (por exemplo, 64 caracteres hexadecimais)
   num gestor de segredos. Calcular o hash localmente sem colocar o segredo no
   histórico da shell ou em argumentos:

   ```sh
   python3 -c 'import getpass,hashlib; print(hashlib.sha256(getpass.getpass("Token do Worker: ").encode()).hexdigest())'
   ```

   Gravar **apenas o hash** no SQL Editor, substituindo o marcador:

   ```sql
   UPDATE public.cover_media_settings
   SET worker_token_hash = '<SHA256_HEX_MINUSCULO_64_CARACTERES>'
   WHERE id = true;
   SELECT worker_token_hash IS NOT NULL AS configured,
          max_cover_bytes, max_owner_assets, storage_budget_bytes
   FROM public.cover_media_settings WHERE id = true;
   ```

3. Cloudflare → Worker **arquivo-global-api** → Settings → Variables and Secrets:
   adicionar **Secret** `COVER_MEDIA_TOKEN` com o valor original, nunca o hash.
   Confirmar `AG_MEDIA` ligado a `arquivo-global-media`, `SUPABASE_URL` e
   `SUPABASE_PUBLISHABLE_KEY` do mesmo projeto. Manter bucket e manifestos privados;
   não ativar acesso público direto por r2.dev/domínio de bucket.

4. No código desse Worker, acrescentar integralmente `docs/cloudflare-cover-media.js`
   e inserir a chamada de dispatch indicada acima, antes do OPTIONS/Auth antigos.
   Preservar avatares e todos os handlers existentes. Publicar o Worker manualmente
   apenas após revisão. Para origens de Preview adicionais, usar a lista exata em
   `MEDIA_ALLOWED_ORIGINS`, nunca alargar a exposição do bucket.

5. Num ambiente local/Preview autorizado, com uma conta e rascunho descartável,
   ativar a flag **só nesse ambiente** e testar upload → guardar → recarregar;
   tentativa por outra conta; acesso anónimo antes de publicar (404); publicação
   (200); substituição privada sem alterar imagem pública; atualização explícita;
   retirada (404); eliminação de asset referenciado (409). Limpeza só após 24h,
   com confirmação; verificar que avatares e objetos alheios continuam intactos.
   Não usar obras reais de produção como dados descartáveis.

6. Só após aprovação destes testes: Vercel → projeto arquivoglobal → Settings →
   Environment Variables → Production: `VITE_ENABLE_CUSTOM_COVERS=true`; efetuar
   um novo deploy/build porque Vite incorpora a flag no bundle. Os valores de
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` permanecem os atuais.
   **Não adicionar `COVER_MEDIA_TOKEN` ou o hash a variáveis VITE\_\*.**
   Se falhar, voltar a false e redeploy, sem apagar colunas, referências ou R2.
