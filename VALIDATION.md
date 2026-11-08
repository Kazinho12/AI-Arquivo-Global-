# Validação — Fundação 2.0

Data: 8 de novembro de 2026 (Africa/Maputo).

## Executado

- Estado inicial: repositório `/home/killian/AI-Arquivo-Global-`, branch `main`, árvore limpa e remoto `origin` em `https://github.com/Kazinho12/AI-Arquivo-Global-.git`.
- Instalação npm concluída. A primeira tentativa foi impedida por DNS na sandbox; a instalação com acesso autorizado ao registo npm concluiu. Tailwind fixado em 4.1.0, compatível com o Node 18.19 deste ambiente. Lockfile npm incluído.
- `npm run typecheck`: passou, TypeScript estrito, sem erros na nova fundação e configurações. Código anterior preservado está fora deste escopo de compilação.
- `npm test`: 64 testes passaram, 0 falharam. Inclui comparação independente das 57 rotas pedidas, correspondência de cada rota pelo React Router, parâmetros dinâmicos, precedência de rotas estáticas, ausência de match para endereço desconhecido, atribuição dos layouts administrativos, filtros compostos, pesquisa sem acentos, ordenação e integridade dos dados demonstrativos. Não constitui um teste visual de renderização das 57 páginas.
- `npm run build`: passou, gerando `dist/` e chunks separados para início, catálogo e design system.
- Servidor Vite iniciou e `curl -I http://localhost:3000/` devolveu HTTP 200.
- `git diff --check` e `npm run format:check`: passaram.
- Contraste dos tokens principais calculado pela fórmula WCAG: texto 15,70:1 (escuro) e 14,01:1 (claro), texto secundário 8,21:1 e 5,19:1 nas superfícies verificadas; botões principais 10,96:1 e 10,01:1. Esta verificação estática não cobre todas as sobreposições decorativas das capas.
- Inspeção do diff e dos ficheiros novos: sem criação de backend, pedidos externos, clientes de serviços na fundação ou credenciais privadas detetadas por padrões comuns. Esta inspeção não é uma auditoria de segurança integral.

## Limitações verificadas

O navegador integrado recusou o acesso a `http://localhost:3000/` por falta de autorização. Não se tentou contornar esse bloqueio. Não foram executados testes interativos de voltar/avançar, persistência do tema, foco, modal, menus ou revisão visual nos tamanhos 320, 375, 768, 1024 e 1440 px. Existem media queries para esses intervalos, tokens para ambos os temas, foco visível, link para saltar conteúdo, landmarks e suporte a movimento reduzido; a presença do código não equivale à aprovação desses testes visuais. A validação visual e com leitor de ecrã continua pendente.

O servidor de desenvolvimento usado para a verificação foi temporário. Para nova revisão local: `npm run dev`. Nenhuma aplicação foi publicada.

## Estado de entrega

Não foram feitos commit, push, stage ou criação de serviços externos. O trabalho está na árvore local, pronto para revisão. O código anterior continua preservado. `bun.lock` é histórico; a versão 2 usa `package-lock.json`. Os ficheiros ignorados `node_modules/` e `dist/` não são parte da entrega Git.

A implementação completa das nove telas de Descoberta e Catálogo depende de aprovação do proprietário. Backend, autenticação, publicação, leitura completa, biblioteca, comunidade e administração permanecem por implementar.
