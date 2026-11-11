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
