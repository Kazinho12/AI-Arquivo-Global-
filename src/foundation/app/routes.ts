export type LayoutName =
  | "public"
  | "auth"
  | "reader"
  | "studio"
  | "account"
  | "moderation"
  | "system";
export interface RouteDefinition {
  path: string;
  title: string;
  layout: LayoutName;
}
const group = (
  layout: LayoutName,
  entries: [string, string][],
): RouteDefinition[] =>
  entries.map(([path, title]) => ({ path, title, layout }));
export const productRoutes: RouteDefinition[] = [
  ...group("public", [
    ["/", "Início"],
    ["/explorar", "Explorar"],
    ["/catalogo", "Catálogo"],
    ["/pesquisa", "Pesquisa"],
    ["/tags", "Tags"],
    ["/tags/:slug", "Explorar tag"],
    ["/categorias", "Categorias"],
    ["/tendencias", "Tendências"],
    ["/obras/:id", "Detalhes da obra"],
  ]),
  ...group("auth", [
    ["/entrar", "Entrar"],
    ["/registar", "Criar conta"],
    ["/recuperar-senha", "Recuperar senha"],
    ["/redefinir-senha", "Redefinir senha"],
    ["/confirmar-email", "Confirmar email"],
    ["/boas-vindas", "Boas-vindas"],
  ]),
  ...group("reader", [
    ["/obras/:id/capitulos/:capituloId", "Leitor literário"],
    ["/obras/:id/paginas/:capituloId", "Leitor visual"],
    ["/obras/:id/comentarios", "Comentários"],
    ["/obras/:id/avaliacoes", "Avaliações"],
  ]),
  ...group("account", [
    ["/biblioteca", "A tua biblioteca"],
    ["/biblioteca/favoritos", "Favoritos"],
    ["/biblioteca/historico", "Histórico de leitura"],
    ["/biblioteca/listas", "Listas de leitura"],
    ["/biblioteca/listas/:id", "Lista de leitura"],
  ]),
  ...group("studio", [
    ["/estudio", "Estúdio de criação"],
    ["/estudio/obras/nova", "Criar uma obra"],
    ["/estudio/obras/:id", "Gerir obra"],
    ["/estudio/obras/:id/capitulos/:capituloId/editar", "Editar capítulo"],
    ["/estudio/obras/:id/paginas/:capituloId/editar", "Editar páginas"],
    ["/estudio/publicacoes", "Publicações"],
    ["/estudio/estatisticas", "Estatísticas"],
    ["/estudio/media", "Biblioteca de media"],
  ]),
  ...group("public", [
    ["/utilizadores/:username", "Perfil público"],
    ["/utilizadores/:username/seguidores", "Seguidores"],
    ["/atividade", "Atividade"],
    ["/colecoes", "Coleções"],
  ]),
  ...group("account", [
    ["/perfil/editar", "Editar perfil"],
    ["/notificacoes", "Notificações"],
    ["/definicoes", "Definições"],
    ["/definicoes/aparencia", "Aparência"],
    ["/definicoes/leitura", "Preferências de leitura"],
    ["/definicoes/seguranca", "Segurança"],
    ["/definicoes/privacidade", "Privacidade da conta"],
    ["/definicoes/acessibilidade", "Acessibilidade"],
  ]),
  ...group("public", [
    ["/denunciar", "Denunciar conteúdo"],
    ["/ajuda", "Centro de ajuda"],
    ["/regras", "Regras da comunidade"],
    ["/privacidade", "Política de privacidade"],
  ]),
  ...group("moderation", [
    ["/moderacao", "Moderação"],
    ["/moderacao/denuncias", "Gestão de denúncias"],
  ]),
  ...group("system", [
    ["/sistema", "Sistema"],
    ["/sistema/logs", "Registos"],
    ["/sistema/logs/:id", "Detalhe de registo"],
    ["/sistema/servicos", "Serviços"],
    ["/sistema/monitorizacao", "Monitorização"],
    ["/sistema/informacoes", "Informações"],
    ["/sistema/testes", "Testes do sistema"],
  ]),
];
