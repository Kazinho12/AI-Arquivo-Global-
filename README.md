# Arquivo Global — Fundação 2.0

Frontend local de uma plataforma aberta e gratuita de obras literárias e visuais. Sem backend, autenticação, serviços externos ou publicação nesta etapa.

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

As 57 rotas solicitadas constam de `src/foundation/app/routes.ts`; sete layouts são PublicLayout, AuthLayout, ReaderLayout, StudioLayout, AccountLayout, ModerationLayout e SystemLayout. `/dev/design-system` e o fallback 404 são adicionais. Início e catálogo têm conteúdo inicial. `/pesquisa` reutiliza o catálogo e `/obras/:id` apresenta apenas um resumo demonstrativo; um ID de obra inexistente apresenta 404. Todas as outras páginas mostram estados de desenvolvimento adequados. Áreas administrativas não apresentam ferramentas, dados nem permissões fictícias. Não existe uma barreira de segurança client-side apresentada como autorização real.

Pesquisa, formato, género, ordenação e paginação usam `q`, `formato`, `genero`, `ordem` e `pagina` no URL. Ligações e histórico usam React Router. Tema segue a preferência inicial do sistema e pode ser alternado e guardado localmente. Sem localStorage disponível, a interface continua funcional.

O design system demonstra botões, campos, seletores, cartões, badges, dialog nativo com foco contido e Escape, dropdown nativo, paginação, estados vazio/carregamento/erro, notificações e confirmação. O protótipo não cria contas, não publica obras, não envia denúncias e não recolhe credenciais.

## Integrações futuras

Adicionar adaptadores para Supabase (auth/base de dados), Workers (operações de API) e R2 (ficheiros) numa etapa autorizada. Verificações de sessão, papéis e autorização têm de ser impostas no servidor. Não existem clientes destes serviços na nova fundação. Nunca colocar service-role keys, segredos R2 ou tokens privados em `VITE_*`.

`vercel.json` prepara o fallback SPA para futuras visitas diretas às rotas. Noutros hosts, reencaminhar URLs de aplicação para `index.html` e servir `/assets` como ficheiros. Não foi criado serviço nem efetuado deployment.

## Verificação e preservação

Consultar `VALIDATION.md` para os resultados realmente executados e limitações. Estado inicial: branch `main`, árvore limpa, remoto `origin` em GitHub. Nenhum commit ou push deve ser feito sem confirmação do proprietário. A próxima etapa é rever esta fundação e aprovar o trabalho das nove interfaces completas de Descoberta e Catálogo.
