# Encerramento da auditoria — Etapa C / AG-22

## Resumo e referência

Revisão de 10/11/2026, branch `main`, HEAD `a2d6ba1649d7c3cca57bf0128a6629a723f605d1`. A referência solicitada coincide com HEAD e está no histórico. O Git estava limpo antes desta etapa. As correções foram inspecionadas no código e os testes foram repetidos; os relatórios [A](STABILIZATION-A.md) e [B](STABILIZATION-B.md) foram preservados.

Os oito P1 e treze P2 estão corrigidos no âmbito local auditado. AG-22 está resolvido pela documentação atualizada. Não foi encontrada pendência dos problemas originais que impeça o encerramento nesse âmbito. Esta classificação não certifica produção nem aplicação das migrações/configuração no serviço remoto.

## Evidência individual dos 22 problemas

Os caminhos abaixo são relativos ao repositório. `F` significa `src/foundation/`. A e B referem-se às suites `scripts/stabilization.test.ts` / `scripts/stabilization-b.test.tsx` e aos respetivos testes Chrome `scripts/stabilization.browser.tsx` / `scripts/stabilization-b.browser.tsx`. SQL A/B referem-se aos scripts `validate-profile-migrations.mjs` / `validate-usernames.mjs`. Cada linha foi confrontada com a implementação, além do relatório histórico.

| ID    | Gravidade | Estado atual         | Correção e evidência no código                                                                                                                                                      | Testes correspondentes repetidos                                                        | Limitações restantes                                                                    |
| ----- | --------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| AG-01 | P1        | Corrigido localmente | `F/pages/Reader.tsx`: filhos de comentários/avaliações com chave por obra; `F/features/local/items.ts` valida conteúdo                                                              | Chrome A: alternância de obra sem copiar estado anterior                                | Interações continuam demonstrativas, por obra e navegador                               |
| AG-02 | P1        | Corrigido localmente | `F/features/local/persistence.ts`: memória primeiro, resultados e avisos de falha; `LocalDataTools.tsx`: exportar/repetir; editores mostram estado de gravação                      | A: acesso negado/quota/corrupção; Chrome A: quota, recuperação e aviso                  | Sem gravação persistente, fechar sem exportar pode perder a memória                     |
| AG-03 | P1        | Corrigido localmente | `supabase/migrations/20261110000000_harden_profile_provisioning.sql`: helper normaliza, limita e desambigua usernames; search_path vazio e objetos qualificados                     | SQL A: nomes vazios/longos, colisões, trigger tolerante e RLS em base nova/existente    | Falha inesperada pode deixar perfil pendente; serviço remoto não certificado            |
| AG-04 | P1        | Corrigido localmente | Mesma migração: backfill por conta, isolamento de exceções, preservação de perfis e caminho de atualização da base original                                                         | SQL A: backfill, preservação, repetição e base original já aplicada                     | Exige inspeção posterior de contas sem perfil e aplicação remota autorizada             |
| AG-05 | P1        | Corrigido localmente | `F/features/reader/progress.tsx` e store da biblioteca: quatro modos, última posição e progresso monotónico; histórico inclui leitura iniciada                                      | A: quatro formatos; Chrome A: progresso e recarregamento                                | Posição textual proporcional; sem sincronização entre dispositivos                      |
| AG-06 | P1        | Corrigido localmente | `F/features/local/persistence.ts`, `LocalDataBoundary.tsx`: espaços guest/user, troca de identidade, ações vinculadas à origem; legado só por importação confirmada                 | A: isolamento; Chrome A: troca de contas, ações e recuperação                           | Isolamento da UI/armazenamento, sem encriptação; legado não tem proprietário comprovado |
| AG-07 | P1        | Corrigido localmente | `F/pages/Settings.tsx`: privacidade descreve dados locais/demonstração e oferece recuperação, sem prometer operações remotas inexistentes                                           | Chrome A: privacidade e ferramentas de dados                                            | Exportação pode conter material privado; sem sistema remoto completo de privacidade     |
| AG-08 | P1        | Corrigido localmente | `F/features/local/images.tsx` e `LocalImage` (no mesmo módulo): bytes IndexedDB por espaço, referências duráveis locais e URLs temporários revogados; sequenciador valida ficheiros | A: imagem inválida/IndexedDB indisponível; Chrome A: bytes após reload e falha de quota | Blob antigo expirado é irrecuperável sem original; fallback em memória; sem R2          |
| AG-09 | P2        | Corrigido localmente | `F/features/preferences/store.tsx`: contrato global/formato, migração preservada e subscrições partilhadas por definições/leitores                                                  | B e Chrome B: legado, quatro leitores, sincronização e versão futura                    | Preferências deste navegador, sem conta/dispositivo remoto                              |
| AG-10 | P2        | Corrigido localmente | `PreferenceEffects` no store de preferências e `F/styles/global.css`: aplicação no arranque, media queries, contraste nos temas e movimento reduzido                                | B: regras CSS; Chrome B: estilos reais e preferência do sistema                         | Não constitui certificação WCAG completa                                                |
| AG-11 | P2        | Corrigido localmente | `F/features/profile/service.ts`: igualdade exata `.eq` com username normalizado, sem padrões de wildcard                                                                            | B: argumentos exatos incluindo underscore                                               | Integração remota real pendente                                                         |
| AG-12 | P2        | Corrigido localmente | `supabase/migrations/20261110010000_canonical_usernames.sql`: preflight, normalização, trigger/check e unicidade canónica                                                           | SQL B: nova/existente, repetição, RLS e rollback por colisão                            | Colisões remotas devem ser resolvidas explicitamente antes da aplicação                 |
| AG-13 | P2        | Corrigido localmente | `F/features/profile/cache.ts`, `service.ts` e `pages/Settings.tsx`: cache por ID atualiza consumidores e recusa resposta atrasada                                                   | B: resposta antiga; Chrome B: nome/link atualizados sem reescrever sessão               | Sem push de alterações de outros dispositivos                                           |
| AG-14 | P2        | Corrigido localmente | `F/data/works.ts`, serviço de perfil e `pages/Profile.tsx`: authorId demo explícito, associação por ID                                                                              | B: conta real com nome semelhante não recebe obras demo                                 | Catálogo continua estático                                                              |
| AG-15 | P2        | Corrigido localmente | `F/features/reader/data.ts`, `pages/Reader.tsx`, `pages/Studio.tsx`: validam obra, unidade e modo antes de renderizar/gravar                                                        | B e Chrome B: rotas inválidas/incompatíveis retornam 404                                | Obras demo conhecidas podem usar amostra identificada como demonstração                 |
| AG-16 | P2        | Corrigido localmente | `F/features/reader/content.tsx`: parser restrito cria elementos React, conserva parágrafos/versos e escapa HTML desconhecido                                                        | B e Chrome B: marcação da toolbar, conteúdo seguro e pré-visualização                   | Sem Markdown/HTML geral; ambiguidades podem permanecer literais                         |
| AG-17 | P2        | Corrigido localmente | `F/components/ui.tsx`: contenção de foco, Escape e retorno; sequenciador usa botões; editores sem main aninhado                                                                     | B/Chrome B: teclado de modal e miniaturas                                               | Não substitui revisão completa com tecnologias assistivas                               |
| AG-18 | P2        | Corrigido localmente | `vite.config.ts` e `package.json`: loopback 127.0.0.1, hosts explícitos, sem allowedHosts irrestrito                                                                                | B: contrato da configuração; runners Chrome em loopback                                 | Um eventual acesso de rede requer revisão/configuração explícita                        |
| AG-19 | P2        | Corrigido localmente | `F/app/providers.tsx`, AuthProvider/controlador: render inicial determinístico, APIs browser em efeitos e snapshot SSR neutro                                                       | B: SSR; Chrome B: SSR/hidratação sem divergência                                        | SPA não implementa servidor SSR completo                                                |
| AG-20 | P2        | Corrigido localmente | `F/features/local/validation.ts`, persistence/items e preferences/store: schema/enums/IDs/versões, bloqueio de sobrescrita e exportação de originais                                | B e Chrome B: corrupção, versões futuras, interações e backups                          | Validação não autentica origem do conteúdo importado; confirmar propriedade             |
| AG-21 | P2        | Corrigido localmente | `F/features/local/persistence.ts`, `features/studio/store.ts`: debounce, snapshots estáveis, estatísticas memorizadas, revisões e cópias por aba/conflito                           | B: snapshots e conflitos; Chrome B: agrupamento e duas abas reais/contas                | localStorage sem transações; recuperação conservadora, sem fusão colaborativa           |
| AG-22 | P3        | Resolvido            | README, VALIDATION, AUTHENTICATION, ARCHITECTURE, este relatório e `.env.example`: estado real, instalação, matriz e limites                                                        | Formatação, links locais, inventário 57/7, revisão documental e preservação Git         | Documentação deve acompanhar a próxima implementação                                    |

## Alterações documentais desta etapa

- `README.md`: instalação, missão, comandos, stack, estrutura e estado atual.
- `VALIDATION.md`: resultados atuais e separação explícita dos registos históricos.
- `docs/AUTHENTICATION.md`: ambiente, fluxo existente e configuração manual sem afirmar validação remota.
- `docs/ARCHITECTURE.md`: perfis, leitores, biblioteca, Estúdio, stores, matriz funcional, três migrações e inventário completo das rotas, num documento único.
- `docs/AUDIT-CLOSURE.md`: evidência e classificação dos 22 problemas.
- `.env.example`: apenas placeholders públicos; `.gitignore` permite versionar exclusivamente esse exemplo, mantendo os ambientes reais ignorados.

Nenhum código funcional, SQL, configuração Supabase/Cloudflare, dependência ou lockfile foi alterado. `.env.local` foi preservado sem expor os valores. Não foram criados commits nem executados push/deploy/migrações remotas.

## Validação final

| Verificação executada | Resultado                      |
| --------------------- | ------------------------------ |
| Typecheck             | Aprovado                       |
| Testes Node           | 186/186; zero falhas/ignorados |
| Build Vite            | Aprovado                       |
| Chrome A              | 14/14                          |
| Chrome B              | 12/12                          |
| SQL local A           | 2/2                            |
| SQL local B           | 3/3                            |
| Format check          | Aprovado                       |
| Git diff check        | Aprovado                       |
| Rotas/layouts         | 57 rotas únicas / sete layouts |

Detalhes de reprodução, ambiente e alcance em [VALIDATION](../VALIDATION.md). A reexecução foi sobre o código do commit de referência; só a documentação mudou depois. As suites SQL usam PGlite e Auth/papéis simulados, não o projeto Supabase. As suites Auth usam mocks/HTTP simulado; Chrome não usa as credenciais reais do ambiente.

## Rotas, layouts e estado funcional

O [inventário](ARCHITECTURE.md#inventário-das-57-rotas) enumera as 57 rotas preservadas e os sete layouts: Public, Auth, Reader, Account, Studio, Moderation e System. Há 41 resoluções específicas e 16 para DevelopmentPage; a tela específica de seguidores também é placeholder. Design system e 404 são adicionais, fora da contagem. A existência da rota não comprova operação remota nem autorização administrativa.

Operacionais no âmbito local: descoberta/pesquisa sobre catálogo estático, quatro leitores, preferências, biblioteca/histórico/listas, autoria/edição/pré-visualização, media IndexedDB e recuperação de dados. Auth/perfis possuem integração Supabase implementada, condicionada à configuração e ao serviço.

Demonstrativos: obras/autores, comentários/avaliações locais, tendências e estatísticas de audiência. O estado `published` local não publica uma obra. Pendentes: backend de obras/capítulos/publicação, sincronização remota, seguidores, atividade, notificações, coleções comunitárias, denúncias, moderação/administração, políticas públicas completas e upload R2. A [matriz](ARCHITECTURE.md#matriz-de-funcionalidades) detalha frontend, backend, persistência e testes de cada área.

## Riscos, migrações pendentes e dívida técnica

Não há evidência nesta revisão sobre quais migrações estão aplicadas no Supabase real. Antes de aplicar as três migrações de perfis, confirmar histórico/esquema/permissões, fazer backup e ensaio; em base original existente, aplicar hardening antes da unicidade canónica. Colisões devem ser resolvidas explicitamente; contas sem perfil devem ser inspecionadas após backfill. A migração canónica bloqueia escritas durante a alteração. A ordem, consultas de integridade e limites estão em [Arquitetura](ARCHITECTURE.md#migrações-sql-locais).

Persistência local depende da quota e do perfil do navegador; não oferece backup remoto, encriptação ou colaboração transacional. Manter exportações e ficheiros originais; cópias/binários órfãos podem consumir espaço. Blobs antigos expirados não são reconstruíveis. RLS/triggers reais, e-mails e Google OAuth exigem contas/projeto de teste autorizados.

Permanecem código legado fora da entrada ativa, ausência de API operacional para obras, tipagem limitada ao escopo do tsconfig e `lint` equivalente a typecheck. Não foi executada auditoria de vulnerabilidades de dependências nem certificação completa de segurança/acessibilidade. O runtime Node 18 utilizado nos testes é histórico; para continuidade, validar numa versão LTS suportada conforme README. Estas limitações são declaradas, não funcionalidades certificadas por esta auditoria.

## Próxima fase recomendada

Primeiro, validar instalação numa versão Node LTS suportada e preparar um projeto Supabase de ensaio: confirmar migrações, executar verificações de integridade e testar Auth/OAuth/e-mail com autorização. Depois, definir o contrato e autorização do backend de obras/publicação e upload R2, com testes de propriedade e isolamento. Priorizar publicação real antes das funcionalidades sociais e administrativas. Nenhuma dessas atividades foi iniciada nesta etapa.

**AUDITORIA ENCERRADA — correções verificadas.**

Classificação limitada aos 22 problemas e às evidências locais descritas; produção e serviços remotos continuam sujeitos às validações expressamente pendentes.
