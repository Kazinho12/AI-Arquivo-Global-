# Arquivo Global — Fundação 2.0

Frontend de uma plataforma aberta e gratuita de obras literárias e visuais, com autenticação Supabase preparada na Fase 3. Sem backend próprio ou publicação da aplicação nesta etapa.

## Desenvolvimento

Node 18.19+ (recomendado Node 22 LTS) e npm. `npm ci`, `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`. O preview de produção usa `npm run preview`. `package-lock.json` é o lockfile desta reconstrução; `bun.lock` pertence à implementação anterior e não deve ser usado para instalar a versão 2.0.

## Organização

- `src/main.tsx`: entrada única da reconstrução.
- `src/foundation/app`: React Router, manifesto tipado das 57 rotas, sete layouts, providers de tema e notificações.
- `src/foundation/components`: primitivas do design system e cartões/capas de obras.
- `src/foundation/pages`: início, catálogo/pesquisa, pré-visualização de obra, galeria, estados de desenvolvimento e 404.
- `src/foundation/data`: oito obras e autores inteiramente fictícios, sem métricas de popularidade.
- `src/foundation/lib`: contrato `WorksRepository` e filtros puros. Futuro adaptador Supabase deve respeitar este contrato.
- `src/foundation/styles`: tokens semânticos claro/escuro, tipografia e estilos responsivos.
- `scripts/routes.test.ts`: testes do contrato das 57 rotas, resolução pelo React Router e regras do catálogo.

A implementação anterior foi preservada nos outros diretórios de `src/`, mas não é importada pela nova entrada nem incluída no TypeScript desta fundação. Não serve como dependência funcional da reconstrução. Esta fronteira torna explícito o código ativo e evita remover trabalho anterior; a limpeza dos ficheiros antigos pode ser uma alteração futura separada.

React, TypeScript estrito, Vite, Tailwind CSS 4, React Router 6 e Lucide React. Os estilos próprios usam tokens CSS; Tailwind está integrado no pipeline, sem adicionar bibliotecas de animação ou de componentes. Tipografia de sistema para interface, Georgia para leitura, monospace para elementos técnicos. As capas são composições CSS locais, sem imagens nem fontes remotas.

## Funcionalidades e limites

As 57 rotas solicitadas constam de `src/foundation/app/routes.ts`; sete layouts são PublicLayout, AuthLayout, ReaderLayout, StudioLayout, AccountLayout, ModerationLayout e SystemLayout. `/dev/design-system` e o fallback 404 são adicionais. As nove páginas de Descoberta e Catálogo têm interfaces próprias: início, explorar, catálogo, pesquisa avançada, tags, página de tag, categorias, tendências editoriais e apresentação de obra. Um ID de obra inexistente apresenta 404 e uma tag desconhecida apresenta recuperação para o diretório. As seis telas de autenticação integram Supabase Auth; sem configuração pública, apresentam indisponibilidade explícita. As restantes rotas de produto mantêm estados de desenvolvimento adequados. Áreas administrativas não apresentam ferramentas, dados nem permissões fictícias. Não existe uma barreira de segurança client-side apresentada como autorização real.

Pesquisa, formato, género, ordenação e paginação usam `q`, `formato`, `genero`, `ordem` e `pagina` no URL. A pesquisa avançada acrescenta `campo` (`todos`, `titulo`, `autor`, `sinopse`) e permite várias entradas `tag` com slugs canónicos, combinadas com AND. O diretório usa `q` e `grupo`; categorias usam `familia`, `genero` e `pagina`; tendências usam `selecao`. A paginação usa quatro obras por página, valida entradas e limita páginas fora dos resultados. Ligações e histórico usam React Router. Tema segue a preferência inicial do sistema e pode ser alternado e guardado localmente. Sem localStorage disponível, a interface continua funcional.

O design system demonstra botões, campos, seletores, cartões, badges, dialog nativo com foco contido e Escape, dropdown nativo, paginação, estados vazio/carregamento/erro, notificações e confirmação. Com configuração válida, a autenticação usa e-mail/senha e Google através do SDK oficial Supabase. Senhas só são usadas nos formulários e nas chamadas Auth, sem armazenamento próprio. Publicação de obras e envio de denúncias continuam indisponíveis.

## Integrações futuras

Supabase Auth está integrado na Fase 3. Adaptadores de base de dados, Workers (operações de API) e R2 (ficheiros) ficam para uma etapa autorizada. Verificações de sessão, papéis e autorização têm de ser impostas no servidor. Existe um único cliente Supabase para autenticação; não existem consultas à base de dados, Workers ou R2 na nova fundação. Nunca colocar service-role keys, segredos R2 ou tokens privados em `VITE_*`.

`vercel.json` prepara o fallback SPA para futuras visitas diretas às rotas. Noutros hosts, reencaminhar URLs de aplicação para `index.html` e servir `/assets` como ficheiros. Não foi criado serviço nem efetuado deployment.

## Verificação e preservação

Consultar `VALIDATION.md` para os resultados realmente executados e limitações. Estado inicial: branch `main`, árvore limpa, remoto `origin` em GitHub. Nenhum commit ou push deve ser feito sem confirmação do proprietário. As nove interfaces de Descoberta e Catálogo estão implementadas; qualquer fase seguinte, commit ou push destas alterações exige nova aprovação.

## Descoberta e Catálogo — Prompt 2

Os sete layouts, o manifesto de 57 rotas, os tokens claro/escuro e a interface `WorksRepository` foram preservados. Oito obras continuam a ser a fonte única; não foram adicionados autores ou publicações. `data/editorial.ts` guarda apenas IDs de seleções manuais e texto editorial. `lib/discovery.ts` deriva tags, géneros e contagens, e concentra normalização, leitura do URL, paginação e obras relacionadas. `components/WorkCollection.tsx` partilha a interface de filtros entre catálogo, pesquisa e páginas de tags.

As páginas são carregadas por importação dinâmica. `ApplicationRoutes` é a mesma árvore usada pela SPA e pelos testes de renderização, com `StaticRouter` apenas nos testes. Estes testes verificam o HTML real das nove rotas, ligações, filtros reproduzíveis, estados vazios e IDs desconhecidos. Não substituem testes interativos no navegador.

As obras relacionadas usam coincidências de género, formato e tags; tendências são seleções editoriais demonstrativas. Não existem métricas de popularidade, personalização, capítulos, comentários ou avaliações fictícias apresentados como reais. O estado de publicação é explicitamente “Demonstração · sem publicação real”. As datas do conjunto são identificadas como fictícias.

## Autenticação — Prompt 3

As seis rotas de autenticação usam `src/foundation/features/auth` e `src/foundation/pages/Auth.tsx`, preservando as telas anteriores e os sete layouts. O SDK oficial controla persistência e renovação da sessão; a UI aguarda recuperação e validação do utilizador. Callbacks PKCE e de confirmação são processados por métodos do SDK, com limpeza do URL e redirecionamentos internos validados.

Consultar [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) para variáveis públicas, configuração do Supabase/Google, recuperação, limites de persistência e checklist real. Nenhuma configuração externa foi alterada. Não havia credenciais de um projeto Supabase neste ambiente: os testes de autenticação são simulados, incluindo o teste do SDK com HTTP e armazenamento em memória.
