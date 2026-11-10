# Etapa B — correção dos 13 P2

## Resumo executivo e base

Base inspecionada: branch `main`, HEAD `2261efa52ba1d890f015ed47c06793a4ab1e9792`. A árvore já continha as alterações sem commit da Etapa A. Foram preservadas e foi criada uma cópia de referência anterior à Etapa B para identificar apenas o novo trabalho. Não houve pull, reset, merge, rebase, commit ou push.

AG-01 a AG-08 foram revalidados no código e em `docs/STABILIZATION-A.md`. AG-19 já tinha uma guarda parcial de `matchMedia`, e AG-20 já tinha validação parcial. Esta etapa completa essas correções e trata AG-09 a AG-21. A configuração `.env.local` foi preservada e verificada por comparação de hash, sem imprimir valores. Não há nova dependência de produção ou alteração de lockfiles.

## Estado individual

| ID    | Estado local | Implementação e evidência                                                                                                                                            |
| ----- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AG-09 | Corrigido    | Contrato canónico em `features/preferences/store.tsx`, partilhado pelas definições e quatro leitores; migração não destrutiva e teste de sincronização/versão futura |
| AG-10 | Corrigido    | Preferências aplicadas no arranque, eventos de media query, contraste claro/escuro e CSS de redução de movimento; regras verificadas no Chrome                       |
| AG-11 | Corrigido    | Consulta `.eq("username", normalizeUsername(...))`; `_` é literal; cliente simulado verifica o argumento exato                                                       |
| AG-12 | Corrigido    | Migração local de normalização e unicidade, preflight de colisões, testes PostgreSQL de instalação nova/existente, repetição e RLS                                   |
| AG-13 | Corrigido    | Cache canónica por ID, publicação após guardar e proteção contra respostas atrasadas; links das definições atualizam sem modificar a sessão                          |
| AG-14 | Corrigido    | `authorId` explícito em cada obra demo; associação por igualdade de ID; contas reais com nomes semelhantes recebem zero obras demo                                   |
| AG-15 | Corrigido    | Validação de obra, capítulo e modo nos leitores públicos e editores; desconhecidos/incompatíveis apresentam 404, sem escrever histórico                              |
| AG-16 | Corrigido    | Renderizador seguro do contrato de texto da toolbar; prosa/poesia, parágrafos, quebras, ênfase, sublinhado, títulos relativos, listas, citações e separadores        |
| AG-17 | Corrigido    | Miniaturas com botões nativos; diálogos comuns com Tab contido, Escape e retorno de foco; remoção de `main` aninhados dos editores                                   |
| AG-18 | Corrigido    | Vite, preview e script dev limitados a `127.0.0.1`; hosts explícitos; sem `allowedHosts: true`                                                                       |
| AG-19 | Corrigido    | Tema inicial determinístico, APIs do navegador em efeitos, controlador SSR sem singleton partilhado e snapshot Auth neutro; SSR/hidratação testados                  |
| AG-20 | Corrigido    | Validação de estruturas, enums, IDs e versões; corrupção preservada; interações locais e preferências validadas; cópias originais recuperáveis                       |
| AG-21 | Corrigido    | Gravações agrupadas, snapshots estáveis, estatísticas memorizadas, revisão por gravação e cópias por aba; conflito explícito, exportação e recuperação               |

“Corrigido” refere-se ao código e às verificações locais. Nenhuma migração ou configuração do Supabase remoto foi aplicada ou certificada.

## Decisões arquiteturais

### Preferências e acessibilidade

`ag_preferences_v1` guarda um envelope `version: 1` com `global`, `formats` e `accessibility`. São preferências de conforto deste navegador, independentes dos dados privados de cada conta. Não existe sincronização entre dispositivos.

Precedência: defaults → preferências globais → ajustes específicos do formato. Alterar uma opção global nas definições remove o override dessa opção nos quatro formatos, aplicando-a imediatamente. Ajustar a mesma opção dentro de um leitor volta a criar um override apenas desse formato. Valores visuais como zoom/direção continuam específicos quando alterados no respetivo leitor.

As chaves `ag_reading_*`, `ag_reader_*_prefs`, `ag_reduced_motion` e `ag_high_contrast` não são apagadas nem sobrescritas. Na migração, escolhas globais antigas explícitas têm prioridade nos campos partilhados; os restantes ajustes válidos de cada leitor são recuperados. Dados inválidos são filtrados/preservados com aviso. Um envelope canónico inválido ou de versão incompatível não é sobrescrito: a edição fica em memória e há exportação dos originais nas definições.

A redução de movimento do sistema operativo é sempre respeitada. Contraste e movimento podem seguir o sistema; escolhas explícitas são persistidas. A classe de contraste altera tokens em ambos os temas e o CSS cobre as opções do leitor visual. O primeiro render de tema é determinístico, seguido da aplicação da preferência guardada ou do sistema num efeito, evitando divergência de hidratação.

### Identidade

`normalizeUsername` usa trim e lowercase ASCII, alinhado com os caracteres permitidos. A consulta remota é exata. Perfis demo têm usernames com hífen num namespace explícito, distinto do contrato de usernames de contas reais, que não permite hífen.

As oito obras demonstrativas têm `authorId` explícito e um registo de autores fictícios. `findAuthorWorks` recebe um ID; não procura nomes, substrings ou metadata Auth. Os perfis reais não recebem obras por coincidência de apresentação.

As definições consultam o perfil canónico por ID. Um save bem-sucedido publica o perfil devolvido pelo serviço; os consumidores atualizam o nome e o link. Uma resposta anterior que chegue depois desse save não repõe o username antigo. Metadata Auth e sessão não são reescritas.

### Conteúdo e rotas

O contrato de texto mantém as strings existentes; não há transformação destrutiva de capítulos. A prosa aceita `**negrito**`, `*itálico*`, `<u>sublinhado</u>`, parágrafos, quebras de linha, `#`/`##`/`###`, `>`, listas e `* * *`/`---`. Os títulos são relativos ao título principal do capítulo, renderizados em h2–h4. Sublinhado só aceita as tags exatas, sem atributos. HTML desconhecido permanece texto escapado. Não existe `dangerouslySetInnerHTML` ou execução de HTML arbitrário.

A poesia mantém versos e estrofes, suporta a mesma marcação inline e guarda alinhamento opcional por capítulo. Não se promete Markdown completo, imagens/links em Markdown, HTML geral ou marcação que atravesse blocos. Marcação ambígua/incompleta pode permanecer literal; a profundidade inline é limitada para não causar recursão ilimitada.

`getWorkReadingData` recusa obras que não estão no repositório. Para obras demo conhecidas sem capítulos detalhados, permanece uma amostra explicitamente demonstrativa, no formato correto. As páginas exigem capítulo existente e modo compatível. Os leitores usados em pré-visualizações locais continuam a receber conteúdo diretamente do Estúdio, sem publicar obras remotamente.

### Persistência e abas

Mantêm-se os espaços `guest` e `user:<id>` e as chaves isoladas da Etapa A. O novo payload dessas chaves é um envelope `version: 3` com revisão, escritor e dados. Arrays válidos da Etapa A continuam legíveis; antes da primeira substituição é guardado o original em `<chave>:backup:v2`. As cinco chaves globais legadas continuam intactas e só são importadas mediante confirmação.

A cópia/exportação pública continua no formato v2 para compatibilidade com o importador. Agora também inclui `alternatives`: backups, candidatas por aba e conflitos. A secção de recuperação permite selecionar uma dessas cópias e confirmar a importação. Obras em conflito são recuperadas como cópias; não são sobrescritas obras atuais. As referências de imagens IndexedDB não mudam.

As operações de edição atualizam a memória imediatamente. Gravações de obras/atividades no navegador são agrupadas por 300 ms e há estado “A guardar no dispositivo”. Exportar, mudar de espaço ou sair da página força a gravação pendente; uma falha mantém aviso e conteúdo em memória. Biblioteca e progresso mantêm gravação imediata no store, além do agrupamento de scroll já existente no leitor.

Leituras da UI usam snapshots estáveis, enquanto operações mutáveis recebem cópias. Estatísticas dependem da identidade do snapshot de obras e não são recalculadas por uma alteração numa lista. Gravações idênticas não serializam novamente. IDs novos usam identificadores únicos em vez de depender apenas do milissegundo.

Uma aba sem edições invalida o snapshot após `storage`. Uma aba com edição própria conserva a sua versão quando recebe uma alteração diferente. A comparação com a revisão de base também deteta mudanças antes de gravar. A candidata é conservada numa cópia por aba antes de alterar o registo principal, protegendo contra a corrida entre processos. O utilizador pode exportar ambas as versões ou carregar explicitamente a outra versão; a versão anterior permanece recuperável.

O conflito é conservador, por coleção, sem fusão automática de capítulos. localStorage não oferece uma transação distribuída entre abas: as cópias de candidatas complementam a deteção por revisão/evento. Não há promessa de colaboração em tempo real ou sincronização entre dispositivos.

## Migração local de usernames e aplicação manual

Nova migração: `supabase/migrations/20261110010000_canonical_usernames.sql`. As duas migrações da Etapa A foram preservadas sem alterações.

Ordem em instalação nova: base A → hardening A → canonicalização B. Se o serviço já tem a versão antiga, confirmar o histórico e aplicar o hardening A antes de B. Nada foi executado no serviço real.

A migração B bloqueia escritas na tabela durante a alteração, verifica colisões por `lower(btrim(username))`, normaliza apenas a caixa dos nomes sem ambiguidade, instala trigger/check de normalização e índice único canónico. IDs, biografias e políticas RLS são preservados. É reexecutável.

Se houver colisões, a transação aborta sem renomear perfis ou eliminar dados. Antes da aplicação manual, fazer backup e rever:

```sql
SELECT lower(btrim(username)) AS canonical, count(*)
FROM public.profiles
GROUP BY lower(btrim(username)) HAVING count(*) > 1;
```

Resolver cada colisão explicitamente, preservando IDs e a propriedade dos perfis; depois repetir a migração num ambiente de ensaio. Confirmar esquema, índices, triggers, permissões e políticas adicionais reais. O funcionamento remoto com nomes antigos em maiúsculas depende dessa normalização; não é possível certificá-lo sem a ação manual autorizada.

## Testes e resultados

Os testes da Etapa A permanecem. As suas asserções de armazenamento passaram a aceitar o envelope versionado e a conclusão explícita de gravações agrupadas; funcionalidades não foram removidas para fazer testes passar.

Novos testes Node em `scripts/stabilization-b.test.tsx`: preferências/legado, SSR, CSS, comparação exata, associação de autores, resposta atrasada de perfil, conteúdo seguro, obra desconhecida, schema/versões, migração de arrays, conflitos, snapshots e configuração Vite.

Nova suíte Chrome: `npm run test:browser:b`. Usa perfil temporário e um servidor de testes com `envFile: false` e variáveis Supabase vazias, sem tocar no `.env.local`. Verifica os quatro leitores, preferências, contraste, media query do sistema, Enter/Tab/Escape nativos, foco, identidade canónica, navegação inválida, conteúdo seguro, hidratação, corrupção, agrupamento e duas abas reais. Há também uma regressão para preferências de uma versão futura.

Os testes SQL usam a instalação temporária de PGlite já existente fora do projeto, com esquema Auth/papéis locais. `scripts/validate-usernames.mjs` testa instalação nova, existente e colisões, incluindo RLS e rollback. As regressões SQL A são executadas separadamente.

| Verificação final        | Resultado executado                                                |
| ------------------------ | ------------------------------------------------------------------ |
| `npm run typecheck`      | Aprovado                                                           |
| `npm test`               | 186 aprovados, zero falhados/ignorados: 173 da base A + 13 novos   |
| `npm run test:browser`   | 14 cenários A aprovados, incluindo recarregamento real e IndexedDB |
| `npm run test:browser:b` | 12 cenários B aprovados, incluindo duas abas e hidratação          |
| PostgreSQL/PGlite        | 5 cenários aprovados: 2 da Etapa A + 3 de canonicalização B        |
| `npm run build`          | Aprovado, Vite 6.4.5                                               |
| `npm run format:check`   | Aprovado após formatação dos ficheiros da entrega                  |
| `git diff --check`       | Aprovado                                                           |

As 57 rotas e os sete layouts foram verificados novamente na suíte existente. A comparação do `.env.local` com a referência inicial confirmou conteúdo inalterado; os lockfiles e o manifesto também permaneceram inalterados. Não houve instalação de dependências nesta etapa. A documentação e os SQL anteriores da Etapa A foram preservados byte a byte.

Durante o desenvolvimento, foram corrigidos o envio de Enter no driver Chrome, a contenção de Tab no diálogo e as condições assíncronas dos testes de storage. Uma execução foi invalidada por reotimização de dependências do Vite; o runner passou a pré-otimizar os módulos usados e a execução final foi repetida sem edições em curso. Os resultados acima correspondem apenas às execuções finais concluídas.

## Riscos e limitações

- A validação é local; Google OAuth, sessão real e configuração remota não foram alterados nem certificados por estes testes.
- O teste com duas abas comprova entrega de eventos, sincronização sem edições, conservação de conflito e isolamento; não substitui um ensaio de colaboração distribuída de grande escala.
- Cópias de recuperação consomem quota local e não são apagadas automaticamente. Limpar o navegador pode apagar dados; exportar antes de qualquer limpeza manual.
- Imagens já perdidas por expiração de URLs blob antigos continuam a exigir o ficheiro original, como documentado na Etapa A.
- Foram testados comportamento e estilos no Chrome; uma auditoria completa de leitores de ecrã, dispositivos móveis e todos os navegadores permanece trabalho futuro.
- A escolha de conforto é por navegador. Os rascunhos, biblioteca e binários continuam isolados por utilizador; a separação local não é encriptação ou autorização de servidor.

## Próxima etapa

Aplicar as migrações apenas após revisão/ensaio autorizados. Depois, priorizar um contrato de publicação e propriedade de obras, antes de iniciar persistência remota de obras/capítulos ou comunidade. Recomenda-se também uma revisão visual mobile/leitor de ecrã e uma auditoria atualizada de dependências. Esta tarefa não implementa a Fase 6, uploads R2 ou backend de obras.

## Ficheiros desta etapa

A lista seguinte compara com a cópia de referência anterior à Etapa B, em vez de incluir indiscriminadamente todos os ficheiros ainda sem commit da Etapa A.

- `README.md`
- `VALIDATION.md`
- `docs/STABILIZATION-B.md`
- `package.json`
- `scripts/profile.test.tsx`
- `scripts/reader.test.tsx`
- `scripts/run-browser-tests.mjs`
- `scripts/stabilization-b.browser.html`
- `scripts/stabilization-b.browser.tsx`
- `scripts/stabilization-b.test.tsx`
- `scripts/stabilization.browser.tsx`
- `scripts/stabilization.test.ts`
- `scripts/storage-peer.html`
- `scripts/storage-peer.ts`
- `scripts/validate-usernames.mjs`
- `src/foundation/app/providers.tsx`
- `src/foundation/components/ui.tsx`
- `src/foundation/data/works.ts`
- `src/foundation/features/auth/AuthProvider.tsx`
- `src/foundation/features/library/store.ts`
- `src/foundation/features/local/LocalDataTools.tsx`
- `src/foundation/features/local/id.ts`
- `src/foundation/features/local/items.ts`
- `src/foundation/features/local/persistence.ts`
- `src/foundation/features/local/validation.ts`
- `src/foundation/features/preferences/store.tsx`
- `src/foundation/features/profile/cache.ts`
- `src/foundation/features/profile/service.ts`
- `src/foundation/features/profile/types.ts`
- `src/foundation/features/reader/ComicReader.tsx`
- `src/foundation/features/reader/MangaReader.tsx`
- `src/foundation/features/reader/PoetryReader.tsx`
- `src/foundation/features/reader/ProseReader.tsx`
- `src/foundation/features/reader/content.tsx`
- `src/foundation/features/reader/data.ts`
- `src/foundation/features/reader/types.ts`
- `src/foundation/features/studio/HybridProseEditor.tsx`
- `src/foundation/features/studio/PoetryEditor.tsx`
- `src/foundation/features/studio/VisualSequencer.tsx`
- `src/foundation/features/studio/store.ts`
- `src/foundation/pages/Library.tsx`
- `src/foundation/pages/Profile.tsx`
- `src/foundation/pages/Reader.tsx`
- `src/foundation/pages/Settings.tsx`
- `src/foundation/pages/Studio.tsx`
- `src/foundation/styles/global.css`
- `supabase/migrations/20261110010000_canonical_usernames.sql`
- `vite.config.ts`
