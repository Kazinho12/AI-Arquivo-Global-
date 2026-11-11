# F3.4 — Estabilização pós-auditoria

## Correções autorizadas

- **Contraste:** `getContrastRatio` calcula a razão WCAG real; a escolha do tema compara os contrastes e utiliza preto/branco quando necessário. Os três níveis de texto têm contraste mínimo 4.5:1 sobre a cor normalizada. Foram removidas opacidades dos textos e as camadas tipográficas usam a mesma cor opaca da capa, para que a arte SVG não altere o fundo efetivo. Os cinco estilos e o fallback são preservados.
- **Tema:** `dark:` passa a seguir `[data-theme="dark"]`, tal como o tema da aplicação. Os controlos não seguem a preferência do sistema quando a aplicação escolheu outro tema. As cores editoriais das capas continuam independentes do tema global, com contraste calculado sobre a cor da própria capa.
- **Género:** o wizard começa numa sugestão válida de Romance, presente no mesmo catálogo usado para as opções. Um género existente que não pertença ao catálogo é mantido como opção explícita, sem substituição silenciosa. O formulário de edição já preservava esses valores.
- **Auth:** removida a classificação genérica de 403 como sessão inválida. Permissão/RLS, erro interno e rede têm mensagens distintas; as credenciais de sessões válidas são preservadas. Códigos explícitos de JWT/sessão inválida e o comportamento existente de 401 continuam a invalidar a sessão. A restauração não chama logout perante um 403 genérico de `getUser`.
- **Combobox:** scroll da opção ativa com `block: nearest`; `aria-activedescendant` apenas enquanto o menu está aberto e a opção existe; fechamento ao perder foco para fora; seleção não reabre o menu ao devolver foco; pointer mantém o foco para não desmontar a opção antes do clique; filtros de região anunciam o estado e devolvem o foco ao input. A pesquisa não é gravada como idioma sem seleção explícita.

## Testes acrescentados

- Cálculo de contraste independente para as 28 cores, fundos personalizados claros/escuros/intermédios e uma sequência de cinzentos.
- Renderização dos cinco estilos e fallback para todas as cores, sem opacidade redutora nas camadas de texto.
- Sessões válidas preservadas perante 403, RLS, rede e 500; JWT/sessão explicitamente inválidos continuam rejeitados; restauração com 403 não chama logout.
- Chrome isolado: navegação longa com setas e opção visível; ARIA/destaque/seleção; pesquisa, região, Escape, Tab e limpar; pointer e foco; preferência do sistema oposta ao tema da aplicação; contraste renderizado nos estilos; gravação de género personalizado e valor inicial do wizard efetivamente submetido.

Os testes usam fixtures e transporte local; não acedem ao Supabase real. Não constituem uma declaração de conformidade integral WCAG. Continuam recomendados testes manuais com NVDA/VoiceOver e dispositivos reais.

## Formatação

Os 12 ficheiros identificados na auditoria foram tratados por `npm run format`, sem refatoração funcional nesses trechos:

- `components/WorkCard.tsx`, `components/WorkCover.tsx`.
- `data/covers.ts`, `data/genres.ts`, `data/languages.ts`.
- `features/auth/controller.ts`, `features/studio/WorkMetadataForm.tsx`.
- `pages/Auth.tsx`, `pages/Studio.tsx`.
- `scripts/f34-foundation.test.tsx`, `scripts/f34-integration.test.tsx`, `scripts/f34-languages.test.tsx`.

Os caminhos de componentes/dados/features/pages são relativos a `src/foundation`. Além desses ficheiros, há alterações funcionais em `components/LanguageCombobox.tsx`, `features/auth/security.ts` e `styles/global.css`, novos testes `scripts/f34-stabilization.*` e casos adicionais em `scripts/auth.test.tsx`.

## Verificação e limites

Comandos: `npm test`, `npm run typecheck`, `npm run build`, `npm run format`, `npm run format:check` e `git diff --check`. Testes interativos executados com `AG_TEST_PAGE=f34-stabilization.browser.html node scripts/run-browser-tests.mjs`; regressões de Studio, leitura e descoberta usam os runners já existentes.

Resultados finais: **278/278 testes automatizados e 40/40 cenários de navegador** (6 de estabilização, 19 editoriais, 10 de leitura e 5 de descoberta). Typecheck, build, `npm run format`, `npm run format:check` e `git diff --check` aprovados. A conformidade completa de acessibilidade não foi certificada apenas pelos testes unitários ou pelas verificações básicas de navegador.

Não foi implementada persistência de `cover_style`. Não foram criadas ou executadas migrations, alteradas RPCs/RLS, modificados dados remotos, removidas obras inaugurais, nem efetuados deploy, commit ou push. A próxima fase depende de autorização.
