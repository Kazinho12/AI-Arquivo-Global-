import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ApplicationRoutes } from "../src/foundation/app/App";
import {
  validateBio,
  validateDisplayName,
  validateUsername,
} from "../src/foundation/features/profile/types";
import {
  fetchUserProfile,
  findAuthorWorks,
  saveUserProfile,
} from "../src/foundation/features/profile/service";

function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => {
      html += chunk.toString();
    });
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

test("profile: username validation enforces length and allowed characters", () => {
  assert.ok(validateUsername("ab") !== null); // too short
  assert.ok(validateUsername("a".repeat(31)) !== null); // too long
  assert.ok(validateUsername("user-name") !== null); // dash not allowed
  assert.ok(validateUsername("user name") !== null); // spaces not allowed
  assert.ok(validateUsername("user@name") !== null); // special chars not allowed

  assert.equal(validateUsername("autora"), null);
  assert.equal(validateUsername("autor_123"), null);
  assert.equal(validateUsername("Lia_Mavume"), null);
});

test("profile: display name validation requires non-empty string under 60 chars", () => {
  assert.ok(validateDisplayName("") !== null);
  assert.ok(validateDisplayName("   ") !== null);
  assert.ok(validateDisplayName("A".repeat(61)) !== null);

  assert.equal(validateDisplayName("Arquivo Global — Equipa Editorial"), null);
  assert.equal(validateDisplayName("Tomás Nilo"), null);
});

test("profile: bio validation allows up to 500 characters", () => {
  assert.equal(validateBio(""), null);
  assert.equal(validateBio("Uma biografia curta e elegante."), null);
  assert.ok(validateBio("A".repeat(501)) !== null);
});

test("profile: former editorial identity has no bundled profile or publications", async () => {
  assert.deepEqual(findAuthorWorks("ag-editorial-team"), []);
  assert.equal(
    (await fetchUserProfile("equipa-editorial", null)).profile,
    null,
  );
});

test("profile: saveUserProfile refuses invalid data before touching network", async () => {
  const shortUser = await saveUserProfile("user-1", {
    displayName: "Nome Válido",
    username: "ab",
    bio: "Bio",
  });
  assert.equal(shortUser.ok, false);
  assert.ok(shortUser.message?.includes("3 caracteres"));

  const emptyName = await saveUserProfile("user-1", {
    displayName: "",
    username: "autor_valido",
    bio: "Bio",
  });
  assert.equal(emptyName.ok, false);
  assert.ok(emptyName.message?.includes("obrigatório"));
});

test("profile: saveUserProfile never fakes success when database is unconfigured", async () => {
  const result = await saveUserProfile("user-1", {
    displayName: "Nome Válido",
    username: "autor_valido",
    bio: "Bio",
  });
  // Since test environment has no Supabase credentials, it returns an explicit error
  assert.equal(result.ok, false);
  assert.ok(result.message && result.message.length > 0);
});

test("profile: removed editorial URL does not synthesize an author", async () => {
  const html = await renderRoute("/utilizadores/equipa-editorial");
  assert.ok(!html.includes("Arquivo Global — Equipa Editorial"));
  assert.ok(!html.includes("Carta de abertura"));
});

test("profile: render /utilizadores/autor-desconhecido shows empty / not-found state", async () => {
  const html = await renderRoute("/utilizadores/autor-desconhecido");
  assert.ok(
    html.includes("Autor não encontrado") ||
      html.includes("Nenhuma obra publicada"),
  );
  assert.ok(html.includes("/catalogo"));
});

test("profile: render /perfil/editar requires authentication for unauthenticated visitors", async () => {
  const html = await renderRoute("/perfil/editar");
  assert.ok(
    html.includes("Autenticação necessária") || html.includes("Iniciar sessão"),
  );
  assert.ok(html.includes("/entrar"));
});

test("profile: render /utilizadores/equipa-editorial/seguidores renders followers view", async () => {
  const html = await renderRoute("/utilizadores/equipa-editorial/seguidores");
  assert.ok(html.includes("Seguidores"));
  assert.ok(html.includes("equipa-editorial"));
});

test("settings: render /definicoes renders overview and functional navigation", async () => {
  const html = await renderRoute("/definicoes");
  assert.ok(html.includes("Definições"));
  assert.ok(html.includes("/definicoes/aparencia"));
  assert.ok(html.includes("/definicoes/leitura"));
  assert.ok(html.includes("/definicoes/seguranca"));
  assert.ok(html.includes("/definicoes/privacidade"));
  assert.ok(html.includes("/definicoes/acessibilidade"));
});

test("settings: render sub-routes deliver functional preferences", async () => {
  const appearanceHtml = await renderRoute("/definicoes/aparencia");
  assert.ok(appearanceHtml.includes("Aparência"));
  assert.ok(appearanceHtml.includes("Tema Escuro"));
  assert.ok(appearanceHtml.includes("Tema Claro"));

  const readingHtml = await renderRoute("/definicoes/leitura");
  assert.ok(readingHtml.includes("Preferências de leitura"));
  assert.ok(readingHtml.includes("Tamanho do texto"));
  assert.ok(readingHtml.includes("Família de fonte"));

  const securityHtml = await renderRoute("/definicoes/seguranca");
  assert.ok(securityHtml.includes("Segurança"));

  const privacyHtml = await renderRoute("/definicoes/privacidade");
  assert.ok(privacyHtml.includes("Privacidade"));
  assert.ok(privacyHtml.includes("Conteúdo público"));
  assert.ok(privacyHtml.includes("Conteúdo privado"));

  const accessibilityHtml = await renderRoute("/definicoes/acessibilidade");
  assert.ok(accessibilityHtml.includes("Acessibilidade"));
  assert.ok(accessibilityHtml.includes("Reduzir animações"));
  assert.ok(accessibilityHtml.includes("Contraste reforçado"));
});
