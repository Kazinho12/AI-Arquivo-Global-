import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { matchRoutes } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { productRoutes } from "../src/foundation/app/routes";
import {
  completionService,
  filterText,
  validateReport,
} from "../src/foundation/features/completion/data";
import { ResourceState } from "../src/foundation/features/completion/ui";
const pages = [
  ["/atividade", "Histórias em movimento"],
  ["/colecoes", "Coleções que abrem caminhos"],
  ["/notificacoes", "Notificações"],
  ["/denunciar", "Sinalizar um problema"],
  ["/ajuda", "Central de Ajuda"],
  ["/contacto", "Contacto Institucional"],
  ["/regras", "Regras da Comunidade"],
  ["/privacidade", "Política de Privacidade"],
  ["/moderacao", "Moderação"],
  ["/moderacao/denuncias", "Gestão de denúncias"],
  ["/sistema", "Visão geral do sistema"],
  ["/sistema/logs", "Registos de atividade"],
  ["/sistema/logs/demo-inicio", "Detalhe do registo"],
  ["/sistema/servicos", "Serviços"],
  ["/sistema/monitorizacao", "Monitorização"],
  ["/sistema/informacoes", "Informações do sistema"],
  ["/sistema/testes", "Testes da interface"],
  [
    "/utilizadores/equipa-editorial/seguidores",
    "Seguidores de @equipa-editorial",
  ],
];
function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => (html += chunk.toString()));
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <ApplicationRoutes />
      </StaticRouter>,
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
for (const [path, title] of pages)
  test(`D: actual route ${path} has its own semantic screen and canonical links`, async () => {
    const html = await renderRoute(path);
    assert.ok(html.includes(title));
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.ok(!html.includes("Em desenvolvimento"));
    assert.ok(!html.includes("Esta página faz parte da fundação"));
    assert.ok(html.includes('id="conteudo"'));
    for (const [, href] of html.matchAll(/<a[^>]*href="([^"]+)"/g))
      if (href.startsWith("/") && !href.startsWith("/dev/"))
        assert.ok(
          matchRoutes(productRoutes, href.replaceAll("&amp;", "&")),
          href,
        );
  });
test("D/E: absent social services never return fixtures even when demo is requested", async () => {
  for (const viewerId of [null, "admin", "real-id"])
    for (const demo of [false, true])
      for (const name of [
        "activity",
        "notifications",
        "followers",
        "reports",
        "logs",
        "services",
        "monitoring",
      ] as const) {
        const result = await completionService.read(name, { demo, viewerId });
        assert.equal(
          result.status,
          ["reports", "logs", "services", "monitoring"].includes(name)
            ? "unauthorized"
            : "unavailable",
        );
        assert.ok(!("data" in result));
      }
});
test("D/E: collections are editorial and detached, never private fixtures", async () => {
  const one = await completionService.read("collections", {
    demo: false,
    viewerId: null,
  });
  assert.ok(one.status === "ready" && one.source === "editorial");
  if (one.status !== "ready") return;
  assert.ok(one.data.every((c) => c.visibility === "public"));
  one.data[0].title = "mutation";
  const two = await completionService.read("collections", {
    demo: false,
    viewerId: "other",
  });
  assert.ok(two.status === "ready" && two.data[0].title !== "mutation");
});
test("D/E: report validation still rejects missing fields and external references", () => {
  assert.deepEqual(Object.keys(validateReport("", "", "")).sort(), [
    "description",
    "reason",
  ]);
  for (const reference of [
    "https://evil.test/obras/a",
    "//obras/a",
    "/obras/a?token=x",
    "/obras/a/../b",
    "/sistema/logs/a",
  ])
    assert.ok(
      validateReport("Outro", "Uma descrição de teste com contexto.", reference)
        .reference,
    );
  assert.deepEqual(
    validateReport(
      "Outro",
      "Uma descrição de teste com contexto.",
      "/obras/ag-carta-abertura",
    ),
    {},
  );
});
test("D/E: loading, errors, empty and denied states hide content appropriately", () => {
  const props = { retry() {}, children: <p>Conteúdo privado</p> };
  for (const status of ["loading", "error"] as const) {
    const html = renderToStaticMarkup(
      <ResourceState
        {...props}
        result={
          status === "loading"
            ? { status }
            : { status, message: "Falha controlada" }
        }
      />,
    );
    assert.ok(!html.includes("Conteúdo privado"));
    assert.match(html, status === "loading" ? /role="status"/ : /role="alert"/);
  }
  const empty = renderToStaticMarkup(
    <ResourceState
      {...props}
      result={{ status: "ready", source: "remote", data: [] }}
      empty
    />,
  );
  assert.match(empty, /Nenhum resultado/);
  const denied = renderToStaticMarkup(
    <StaticRouter location="/">
      <ResourceState
        {...props}
        result={{ status: "unauthorized", message: "Sem autorização" }}
      />
    </StaticRouter>,
  );
  assert.match(denied, /Acesso não autorizado/);
  assert.ok(!denied.includes("Conteúdo privado"));
  assert.equal(filterText("Coleções de poesia", "colecoes"), true);
});

test("institutional: official contact has encoded subjects and reports retain their limitation", async () => {
  const contact = await renderRoute("/contacto");
  assert.ok(
    contact.includes(
      "mailto:arquivoglobal.org@gmail.com?subject=Privacidade%20e%20dados%20pessoais",
    ),
  );
  assert.ok(contact.includes("Direitos de autor"));
  const report = await renderRoute("/denunciar");
  assert.ok(report.includes("O formulário abaixo não envia pedidos"));
  assert.ok(
    report.includes(
      "mailto:arquivoglobal.org@gmail.com?subject=Den%C3%BAncias%20de%20conte%C3%BAdo",
    ),
  );
});
