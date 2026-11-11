# Avatar público — alteração manual no Worker existente

1. Colar **todo** `docs/cloudflare-public-avatar.js` acima do `export default` do Worker atual.
2. Dentro de `async fetch(request, env, ...)`, **após o tratamento OPTIONS e antes de qualquer autenticação global ou rota de media**, inserir:

```js
const avatarPublicResponse = await handleAgPublicAvatar(request, env);
if (avatarPublicResponse) return avatarPublicResponse;
```

Bindings existentes usados sem criar recursos/tokens: `env.AG_MEDIA`, `env.SUPABASE_URL`, `env.SUPABASE_PUBLISHABLE_KEY`.

Nova rota: `GET /media/avatar/public/{userId}/{fileId}.{ext}`. Consulta `profiles.id/avatar_url` como anon, sob o RLS existente. Atualmente os perfis têm SELECT público; não existe coluna `is_public`. Só lê `avatars/{userId}/{ficheiro}` ou `avatar/{userId}/{ficheiro}` quando a referência completa coincide com o `avatar_url` atual desse perfil. Recusa outros namespaces, SVG e chaves de terceiros. Não alterar a autenticação das rotas existentes.

Sem cache positivo ou negativo no Worker/browser/CDN (`no-store`); cada GET verifica o perfil de novo, inclusive com If-None-Match. Após remoção/substituição, a URL anterior devolve 404. Nenhum URL público é gravado no perfil: mantém-se a chave R2. Não adicionar regra de CDN que ignore estes cabeçalhos.

Frontend: perfis públicos utilizam a nova rota sem Bearer; editor/upload e verificação pré-gravação continuam privados. Enquanto o trecho não estiver aplicado, visitantes mantêm iniciais e o proprietário pode usar o fallback privado. Fotografias antigas já descarregadas por terceiros não podem ser revogadas retroativamente.

Não foi feito deploy nem SQL remoto. Não é necessária migration. Validar manualmente, após aplicar o trecho: janela anónima mostra avatar atual; chave antiga/removida, perfil invisível, outro namespace e outro proprietário devolvem 404; POST de upload e GET privado continuam a exigir sessão.

## Correção v0.5.1

No `handleAgPublicAvatar`, substituir somente `redirect: "error"` por `redirect: "manual"` na consulta REST. Workers não implementa o modo `error`: lança TypeError antes do HTTP e o catch devolve 503. O `if (!response.ok)` existente rejeita 3xx sem seguir Location nem transmitir a chave para outro host. Manter `apikey` com `SUPABASE_PUBLISHABLE_KEY`, sem Bearer publishable e sem service_role. O ficheiro JS contém a versão corrigida. Referência: https://developers.cloudflare.com/workers/runtime-apis/request/ (redirect).

Diagnóstico de leitura: a consulta anónima real a `profiles.id,avatar_url` respondeu HTTP 200. As migrations locais habilitam RLS e SELECT público; nenhuma política foi modificada. Configuração/bindings e o código efetivamente instalado no painel continuam sujeitos a confirmação: se persistir 503, verificar no log do Worker se falhou validação de chave/URL, HTTP REST ou R2, sem registar valores de credenciais.

Auth: inicialização do SDK movida para o efeito do provider; uma instância por projeto permanece no mesmo separador mesmo com HMR. Web Locks e BroadcastChannel do SDK continuam ativos entre separadores. Após atualizar, recarregar completamente os separadores antigos para terminar instâncias da versão anterior; não apagar sessões/localStorage. A disputa transitória de lock pelo auto-refresh entre separadores é tratada pelo SDK instalado, não é motivo para logout.
