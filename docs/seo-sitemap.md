# SEO 1 — sitemap dinâmico

## Diagnóstico e sincronização (14/11/2026)

`main` estava limpa, quatro commits atrás; fetch e pull --ff-only atualizaram para
`82337fb51c9ca6386978103363eeb366967944c3`. Nenhum commit/push/deploy nesta tarefa.
O sitemap era um XML manual com apenas `/` e `/catalogo`, sem gerador ou consulta.
GETs públicos em produção confirmaram XML 200 com duas URLs; `/robots.txt` devolvia
HTML 200. Catálogo, privacidade e um UUID de obra inexistente devolviam o shell SPA
200, sem canonical nem conteúdo renderizado no HTML inicial.

## Implementação

- `/sitemap.xml`: índice dinâmico; `/sitemaps/pages.xml`: páginas com conteúdo;
  `/sitemaps/works-N.xml`: até 500 obras por shard, ordenadas pelo UUID público.
- Só consulta `published_works` e `public_discovery_facets`, com chave pública e
  acesso anon/RLS. Nunca consulta `works`, Auth, perfis privados ou recibos.
- `is_public=true` é filtrado explicitamente. A retirada desativa o snapshot nas
  RPCs existentes. `lastmod` usa `last_published_at`, nunca a data do pedido/build.
- Sem cache no browser/CDN/função: novas publicações/retiradas refletem-se no
  próximo pedido. Não requer cron, webhook, commit ou build por publicação.
- Se Supabase/configuração falhar: 503 + Retry-After, sem erros internos ou chaves
  na resposta; nunca um sitemap incompleto com 200. Shard inválido: 404; método
  não suportado: 405. HEAD tem os mesmos códigos/cabeçalhos, sem corpo.
- Paginação não herda o limite de 12 obras do frontend. Índice até 20 mil shards (abaixo do limite de resposta da função);
  cada shard também fica abaixo de 50 mil URLs/50 MB. Alterações durante a leitura
  podem devolver 503 temporário; o próximo pedido reconta os snapshots. A contagem
  exata e intervalos evitam truncar silenciosamente quando o limite REST é menor.

## Inclusão e canonical

Sempre: `/`, `/ajuda`, `/regras`, `/privacidade`, `/contacto`.
Com publicações: `/catalogo`, `/explorar`, `/categorias`. `/tags` apenas se as facetas
públicas contiverem tags com contagem positiva. Obras: `/obras/{UUID público}`;
usa a rota real, não inventa URLs com o slug que o router não utiliza.

Excluídos: autenticação, Estúdio, conta/biblioteca, moderação/sistema, páginas
operacionais vazias, pesquisa/filtros, comentários, avaliações e seguidores.
Perfis não entram nesta fase: author_username do snapshot pode estar desatualizado;
não é uma prova da propriedade atual nem de obras disponíveis nesse perfil.
URLs individuais de tags e categorias com filtros ficam fora para evitar aliases,
combinações vazias e duplicação. Leitores continuam descobertos pelos links dos
detalhes, sem multiplicar as URLs do sitemap por capítulo/preferência.
Não há filtro de classificação etária: sitemap de publicações não é destaque da Home.

Metadados na SPA: canonical absoluto sem query/hash, robots por rota; publicações
confirmadas recebem título/sinopse específicos. Erro/obra retirada recebe noindex.
Perfis, leitores e utilitários ficam noindex nesta fase; isto não limita acesso.
Não é colocado um canonical da Home no index.html partilhado por todas as rotas.

## Configuração na Vercel — após autorização de deploy

1. Manter Vite, build `npm run build` (ou `bun run build`) e output `dist`.
2. Usar Node.js suportado pela Vercel (22 ou 24). Nenhuma biblioteca adicional.
3. Configurar em Production `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`, com o mesmo
   projeto público do frontend. Aceita os `VITE_SUPABASE_*` já existentes como
   fallback. Nunca usar service_role, sb_secret ou tokens de utilizadores.
4. Publicar os ficheiros API/server junto do frontend, respeitando vercel.json;
   não configurar o projeto como simples upload estático de dist. A função tem
   duração máxima de 30 s, pedidos REST individuais de 10 s e usa apenas GETs.
5. Não aplicar cache/CDN ou rewrite adicional ao sitemap. As regras específicas
   de sitemap precedem o fallback SPA; API, assets, robots e verificação Google
   não são encaminhados ao index.html.
6. Após deploy: GET/HEAD sitemap (XML 200), cada child XML 200; robots text/plain
   com endereço do índice. Endpoint sem configuração: 503, nunca HTML/200.
7. Com uma obra de teste autorizada, publicar → consultar shard → retirar →
   consultar de novo; verificar inclusão/remoção, sem alterar obras de produção.
8. Reenviar `https://arquivoglobal.vercel.app/sitemap.xml` no Search Console e
   inspecionar uma obra com renderização Google. O deploy e estas ações não foram
   executados nesta tarefa.

## Limites restantes

O HTML inicial continua a ser o shell React/Vite. Crawlers sem JavaScript não
recebem o texto das obras; canonical/descriptions dinâmicos exigem renderização.
URLs inexistentes ainda recebem HTTP 200 do fallback SPA, embora a página de obra
adicione noindex após a consulta falhar. SSR/pré-renderização e HTTP 404 para obras
inexistentes são uma etapa separada, não comprovados por um sitemap válido.
Sem acesso ao ambiente Vercel não se confirma a função implantada, overrides de
routing/cache ou a indexação efetiva. Sitemap é uma indicação, não garantia de
indexação. Nenhum schema, RLS, F4, capa ou editor foi modificado.

Referências: https://vercel.com/docs/frameworks/frontend/vite,
https://vercel.com/docs/functions/runtimes/node-js,
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap,
https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics.

## Validação local e consulta pública

O gerador local foi executado com a configuração pública existente, apenas com
GETs anónimos: índice 200 com dois shards; páginas 200 com nove URLs; obras 200
com cinco publicações. Os três documentos passaram na análise XML e validação
de namespace, host absoluto, ausência de query/hash e duplicações. Isto valida
o contrato com o Supabase atual, não uma instalação da função na Vercel.
Os testes locais cobrem também catálogos maiores que 1.000 obras, erros, retirada
e metadados; nenhuma publicação real foi criada/editada/retirada nos testes.
