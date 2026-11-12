# Estúdio de Escrita 2.0

O editor persistente de capítulos, poemas e guiões utiliza Tiptap 3.33.1 (StarterKit + TextAlign) e DOMPurify para colagem. Suporta os formatos pedidos, links seguros, histórico, contagens, foco, ecrã inteiro e pré-visualização. Colagem simples usa o botão, a opção persistente durante a edição ou Ctrl+Shift+V; a leitura da área de transferência depende das permissões do navegador. Word/Docs/web são convertidos apenas para o subconjunto suportado, sem fidelidade visual absoluta.

## Armazenamento e compatibilidade

`work_entries.content` continua TEXT. Um documento rico é `AGRT/1\n` seguido de JSON Tiptap normalizado: doc, parágrafos, H1–H3, listas, citações, separadores, quebras, texto e marcas bold/italic/underline/strike/link. Atributos aceites limitam-se a alinhamento, nível, início de lista e URL segura. O leitor gera elementos React; não injeta HTML. Colagem HTML é sanitizada e estilos visuais externos são descartados, conservando apenas alinhamento e ênfase suportada.

Texto antigo/markup AG v1 mantém o armazenamento original: abrir/recarregar não grava nem converte automaticamente. Ao editar, importa os estilos já suportados pelo leitor, versos e espaços. A primeira edição confirmada pode guardar o documento rico. JSON inválido/desconhecido é mostrado como texto escapado; não há migração automática de conteúdos. O limite existente de 1 MB inclui a serialização; conteúdo demasiado grande é preservado na sessão mas precisa de redução antes de guardar.

**Não é necessária migration.** RPCs, RLS, revisões e recibos não foram modificados. As operações existentes copiam o conteúdo integral na duplicação e nos snapshots. Edição privada continua sem modificar a versão pública até publicação/atualização explícita. Novos leitores/editor devem ser distribuídos juntos; clientes antigos sem este codec não apresentam documentos ricos corretamente. Não reverter o leitor para uma versão anterior sem preservar este suporte.

## Autosave e recuperação

Debounce de 1,5 segundos. Uma gravação por vez passa UUID, revisão da obra e revisão da entrada à RPC existente. O ACK atualiza a revisão-base; texto escrito durante a requisição permanece e é guardado numa operação posterior. Rede/conflito interrompe retries automáticos e mantém o buffer na sessão; Guardar alterações permite tentar de novo. Recuperação é explícita e exige confirmação; conflito não força sobrescrita. Navegação em links/fecho avisa quando há alterações ou gravação; navegação interna pelo histórico conserva o buffer. O buffer não é um backup durável e termina ao sair da conta/fechar o separador.

O leitor público reutiliza a apresentação segura e as preferências existentes. Poesia conserva versos/estrofes; alinhamentos por bloco podem sobrepor-se ao alinhamento geral do poema. Justificação usa white-space normal nesse bloco para evitar o problema conhecido de Firefox com pre-wrap. Os editores exclusivamente locais legados permanecem disponíveis sem reconstrução.

## Validação

Testes unitários do codec, URLs e renderização; cenários Chrome reais de Tiptap/colagem/autosave/rede/revisões/recuperação; regressões editoriais e de leitura; PostgreSQL descartável com as migrations atuais e claims simuladas. Não foram feitas gravações nem migrations no Supabase real. Validar manualmente uma obra de teste autorizada antes da disponibilização: editar, sair/reabrir, publicar, ler anonimamente e confirmar isolamento do snapshot.

Resultados: 317 testes automatizados aprovados; testes de navegador cobrem o editor e as regressões editoriais/de leitura; PostgreSQL descartável aprovado. Typecheck, build de produção, formatação e instalação Bun congelada aprovados. O Tiptap é carregado apenas ao abrir uma entrada, num chunk separado do Studio. O StarterKit não acrescenta parágrafos automaticamente ao abrir documentos legados.

## Ficheiros alterados/criados

- Editor: `features/studio/RemoteEntryEditor.tsx`; `features/writing/document.ts`, `RichEditor.tsx`, `RichContent.tsx`, `paste.ts` (em `src/foundation/`).
- Leitura: `features/reader/content.tsx`, `ProseReader.tsx`, `PoetryReader.tsx`.
- Integração: `features/studio/PublicationControls.tsx`, `store.ts`, `pages/Studio.tsx`, `styles/global.css`.
- Dependências: `package.json`, `package-lock.json`, `bun.lock`.
- Testes: `scripts/writing.test.tsx`, `writing.browser.tsx`, `writing.browser.html`, `validate-writing.mjs`, `works.browser.tsx`, `run-browser-tests.mjs`.
- Documentação: este ficheiro. Total: 22 ficheiros. Última validação: 317 testes automatizados, 36 cenários Chrome (7 de escrita, 19 editoriais, 10 de leitura), SQL local, typecheck, build, formatação e Bun frozen aprovados.
