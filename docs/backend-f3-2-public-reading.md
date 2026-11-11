# F3.2 — Experiência de leitura pública

## Auditoria inicial

A F3.1 já disponibilizava detalhes e leitura em `/obras/:id` e `/obras/:id/capitulos/:capituloId`, com IDs públicos estáveis. `PublishedPages` consultava `read_public_work` através de um cliente anónimo independente; as tabelas privadas não eram usadas. Os leitores de prosa e poesia, o parser de texto escapado, o modal acessível, as preferências e o histórico local eram reutilizáveis.

Operacional antes desta fase: títulos e autor público, anterior/seguinte, ordem fornecida pelo snapshot, temas claro/escuro/sépia, progresso local por contexto e estados de erro/carregamento/404. As quatro obras inaugurais utilizam conteúdo editorial local legítimo; os utilizadores utilizam snapshots Supabase. Os dados inventados nos testes são fixtures isoladas, nunca publicadas ou usadas como catálogo real.

Lacunas verificadas:

- O índice da prosa usava `window.location.href`, recarregando toda a aplicação. A poesia não tinha índice.
- O painel de poesia só oferecia tamanho e tema. Não havia opção “Sistema”. Algumas classes CSS e o font-family fixo da poesia contrariavam as preferências.
- Os detalhes públicos não ofereciam retoma do último capítulo. URLs de capítulos removidos necessitavam de tratamento seguro.
- Quebras/indentação na poesia podiam ser normalizadas pelo DTO; o leitor passa a usar o texto original, normalizando apenas CRLF.
- A leitura aberta só revalidava em navegação/foco, sem verificação periódica. As cores de controlos podiam herdar o tema global, contrariando o tema local.

## Implementação

Foram aperfeiçoados os leitores existentes, sem substituir o catálogo ou alterar SQL, Auth ou perfis.

- Índice acessível nos dois leitores, com navegação React Router, anterior/seguinte e retorno aos detalhes. A ordem editorial é preservada, mesmo com posições não contíguas no snapshot.
- Painel partilhado: cinco tamanhos, três famílias tipográficas, três entrelinhas, três larguras e temas sistema/claro/escuro/sépia. Grupos com `fieldset`/`legend` e seleção anunciada por `aria-pressed`; mantém o modal existente com Escape, contenção e retorno de foco.
- Tipografia efetiva aplicada à coluna de leitura. O tema do sistema acompanha alterações de `prefers-color-scheme`; todas as variáveis de cores ficam limitadas ao leitor. As preferências continuam no armazenamento local versionado existente, sem login.
- Poemas preservam versos, indentação, estrofes vazias e alinhamento indicado pelo autor. Conteúdo HTML permanece escapado. Prosa mantém o parser existente.
- “Começar leitura”/“Retomar leitura” nos detalhes públicos, utilizando o histórico local existente. Um capítulo removido dá acesso à primeira entrada disponível e uma mensagem explicativa. Dados anteriores não são apagados ou importados automaticamente. Posições inválidas são limitadas a valores finitos entre 0 e 1.
- O histórico continua no contexto local existente (`guest` ou conta), sem pedidos de escrita ao Supabase. Login/logout não misturam automaticamente os históricos.
- A leitura revalida ao voltar à página/visibilidade e a cada 30 segundos enquanto está visível. A verificação periódica lê apenas `id,last_published_at` da projeção pública; o texto é recarregado quando a data muda. Retirada ou erro confirmado ocultam o leitor. Respostas antigas são ignoradas após navegação/desmontagem.
- Ajustes de largura, quebra de palavras, foco e contraste para dispositivos pequenos. Os temas do leitor definem também as cores de controlos e de navegação, independentemente do tema global.

## Ficheiros desta fase

Novos:

- `src/foundation/features/reader/ReaderSettings.tsx`: painel, aparência, índice e parser de estrofes.
- `scripts/public-reading.test.tsx`: testes de preferências, poesia, retoma e índice.
- `scripts/public-reading.browser.html` e `scripts/public-reading.browser.tsx`: cenários em Chrome isolado, usando o cliente Supabase real com transporte HTTP de teste.
- Este relatório.

Alterados:

- `features/reader/ProseReader.tsx`, `PoetryReader.tsx`, `types.ts`, `progress.tsx`.
- `features/preferences/store.tsx`: validação do tema `system`, preservando a versão e dados existentes.
- `features/catalog/PublishedPages.tsx`, `PublicCatalog.tsx`, `repository.ts`: retoma e revalidação pública leve.
- `styles/global.css`: estilos locais de leitura, contraste e responsividade.
- `scripts/publication.test.ts`: cobertura da consulta pública leve.

Os caminhos de código acima são relativos a `src/foundation`. As alterações F3.1 e do modal já presentes na árvore foram preservadas. Nenhuma migration foi modificada nesta fase.

## Verificações

Executar:

```bash
npm test
npm run typecheck
npm run build
npm run format:check
git diff --check
AG_TEST_PAGE=public-reading.browser.html AG_TEST_RESULTS=/tmp/ag-f32-browser.json node scripts/run-browser-tests.mjs
AG_TEST_PAGE=works.browser.html AG_TEST_RESULTS=/tmp/ag-f32-editorial-browser.json node scripts/run-browser-tests.mjs
```

A suite F3.2 verifica leitura anónima e com estado autenticado, pedidos exclusivamente públicos e sem envio de histórico, anterior/seguinte/índices, formatação poética, painel e persistência, tema do sistema sem alteração global, foco/teclado, contraste calculado, retoma local, capítulo removido, URL inválido, retirada numa leitura aberta/URL guardado, erro de rede e repetição, revalidação leve/edição atualizada, e preservação da edição inaugural. Testa larguras 320/375/768 px com o maior tamanho de fonte. A suite editorial preserva os cenários F2.1/F2.2/F3.1.

O navegador executa componentes reais e o SDK real num perfil temporário, com variáveis Supabase vazias e endpoint de teste. Não usa sessões nem obras reais do proprietário. A captura móvel foi inspecionada visualmente. Resultados: **234/234 testes automatizados e 29/29 cenários de navegador** (10 F3.2 + 19 de regressão editorial). Typecheck, build, formatação e `git diff --check` aprovados.

Foi também efetuada uma verificação anónima **exclusivamente de leitura** no projeto Supabase configurado: a listagem e `read_public_work` responderam com uma edição e uma entrada com conteúdo válido, sem campos privados de proprietário/revisão. Não foram impressos conteúdos, nomes, credenciais ou identificadores da obra. Não houve chamadas Auth nem operações de escrita.

## Limitações

- Os testes de navegador validam a aplicação em Chrome real com transporte isolado, complementados pela consulta anónima de leitura ao Supabase real. A combinação não substitui a validação visual completa desta versão com a sessão e o dispositivo do proprietário; o procedimento abaixo cobre essa verificação, sem criar contas ou alterar obras.
- RLS bloqueia novos pedidos de obras retiradas. Conteúdo já entregue pode permanecer no ecrã até revalidação (30 segundos mais o tempo da rede, ou ao voltar à página). Nenhuma aplicação consegue revogar cópias já descarregadas. Não há leitura offline de snapshots.
- O primeiro carregamento ainda recebe a edição pública completa pela RPC F3.1. Não se introduziu uma nova API paginada de capítulos. A verificação periódica evita repetir esse payload quando a edição não mudou.
- Progresso e preferências são locais ao navegador; não há sincronização entre dispositivos. A posição é relativa e pode deslocar-se quando texto, fonte ou dimensão da janela mudam.
- Dados locais corrompidos continuam sujeitos ao mecanismo conservador existente: preservar originais e usar recuperação/memória quando necessário. Não existe migração silenciosa de dados antigos.
- Acessibilidade verificada de forma básica com teclado, semântica, foco e contraste; não substitui testes manuais completos com NVDA/VoiceOver.
- HQ/Mangá de utilizadores continuam a apresentar apenas o guião textual da F3.1. Os leitores visuais inaugurais foram preservados. Não há R2, comentários, avaliações ou recomendações novos.

## Validação manual no ambiente do proprietário

1. Abrir o preview local e o catálogo numa janela privada. Escolher uma obra já publicada; confirmar obra/autor, entrada, ordem e URL pública. Abrir o mesmo URL noutra janela.
2. Percorrer anterior/seguinte e o índice apenas com teclado. Confirmar retorno aos detalhes e foco visível. Abrir preferências com Enter, percorrer opções com Tab, fechar com Escape e confirmar retorno ao botão.
3. Alterar fonte, tamanho, entrelinhas, largura e temas; recarregar. Confirmar persistência e ausência de alteração do tema global. Em “Sistema”, alterar a preferência do sistema operativo.
4. Ler um poema com várias estrofes e alinhamento centrado, depois um à esquerda. Verificar quebras, indentação e fonte maior a 320/375 px e com zoom de navegador.
5. Visitar outro capítulo, regressar aos detalhes e usar “Retomar leitura”. Repetir sem login e com a conta normal; confirmar que o contexto local continua separado. Não é necessário criar utilizadores.
6. Abrir um ID de entrada inexistente: deve mostrar indisponibilidade sem conteúdo privado. Para testar alteração/retirada, utilizar apenas uma obra de teste e operações explicitamente autorizadas pelo proprietário: uma retirada deve bloquear o URL guardado e a leitura aberta após revalidação; republicar deve permitir voltar a ler. Esta tarefa não executa essas escritas remotas.
7. Desligar a rede e voltar à página: erro visível e ausência de fallback para dados privados; restabelecer rede e repetir. No separador Network confirmar apenas consultas `published_works`/`read_public_work` e nenhuma escrita de histórico.
8. Confirmar novamente uma obra inaugural e os fluxos do Studio. Não eliminar obras reais para validar esta fase.
