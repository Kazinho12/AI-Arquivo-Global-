import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  MemoryRouter,
} from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";

import {
  CompletionContext,
  ResourceState,
  useResource,
} from "../src/foundation/features/completion/ui";
import {
  completionService,
  type CompletionService,
  type ReadResult,
  type ResourceMap,
  type Person,
} from "../src/foundation/features/completion/data";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
let root = createRoot(fixture);
const results: { name: string; ok: boolean; error?: string }[] = [];
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
let driverId = 0;
function drive(input: object) {
  return new Promise<void>((resolve) => {
    const id = ++driverId;
    const done = (event: Event) => {
      if ((event as CustomEvent).detail === id) {
        window.removeEventListener("test-driver-done", done);
        resolve();
      }
    };
    window.addEventListener("test-driver-done", done);
    window.testDriver(JSON.stringify({ ...input, id }));
  });
}
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: String(e) });
  } finally {
    await act(async () => root.unmount());
    root = createRoot(fixture);
  }
}
async function waitFor(checker: () => unknown, message: string) {
  for (let i = 0; i < 100; i++) {
    if (checker()) return;
    await act(async () => pause(20));
  }
  throw new Error(message);
}
async function mount(path: string) {
  await act(async () => root.unmount());
  root = createRoot(fixture);
  const router = createMemoryRouter(
    [{ path: "*", element: <ApplicationRoutes /> }],
    { initialEntries: [path], future: { v7_relativeSplatPath: true } },
  );
  await act(async () => {
    root.render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />,
    );
    await pause();
  });
  await waitFor(() => fixture.querySelector("h1"), "Tela não abriu: " + path);
  await act(async () => pause(10));
  return router;
}
const buttons = () => [
  ...fixture.querySelectorAll<HTMLButtonElement>("button"),
];
async function click(text: string) {
  const button = buttons().find((b) => b.textContent?.includes(text));
  check(button && !button.disabled, "Botão indisponível: " + text);
  await act(async () => {
    button.click();
    await pause();
  });
}
async function input(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  await act(async () => {
    const proto =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await pause();
  });
}
async function select(label: string, value: string) {
  const field = [...fixture.querySelectorAll("label")]
    .find((l) => l.textContent?.includes(label))
    ?.querySelector("select");
  check(field, "Select ausente: " + label);
  await act(async () => {
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
    await pause();
  });
}

const paths = [
  "/atividade",
  "/colecoes",
  "/notificacoes",
  "/denunciar",
  "/ajuda",
  "/regras",
  "/privacidade",
  "/moderacao",
  "/moderacao/denuncias",
  "/sistema",
  "/sistema/logs",
  "/sistema/logs/unknown",
  "/sistema/servicos",
  "/sistema/monitorizacao",
  "/sistema/informacoes",
  "/sistema/testes",
  "/utilizadores/equipa-editorial/seguidores",
];
await run(
  "D/E: 17 telas preservadas, dois temas e cinco larguras, sem atividade artificial",
  async () => {
    for (const path of paths) {
      await mount(path);
      check(fixture.querySelectorAll("h1").length === 1, path);
      check(
        !fixture.textContent?.includes("Explorar demonstração"),
        "Controlo fictício em " + path,
      );
      for (const theme of ["dark", "light"])
        for (const width of [320, 375, 768, 1024, 1440]) {
          document.documentElement.dataset.theme = theme;
          await drive({ kind: "viewport", width });
          check(
            document.documentElement.scrollWidth <= width + 1,
            "Overflow " + path + " " + width,
          );
        }
    }
  },
);
await run(
  "D/E: denúncia valida campos sem transmitir e moderação continua inacessível",
  async () => {
    await mount("/denunciar");
    await click("Verificar formulário");
    check(
      fixture.querySelectorAll('[aria-invalid="true"]').length === 2,
      "Erros ausentes",
    );
    check(
      buttons().find((b) => b.textContent === "Enviar denúncia")?.disabled,
      "Envio ativo",
    );
    for (const path of [
      "/moderacao",
      "/moderacao/denuncias",
      "/sistema/logs",
      "/sistema/monitorizacao",
    ]) {
      await mount(path);
      check(
        fixture.textContent?.includes("Acesso não autorizado"),
        "Sem guarda " + path,
      );
      check(!fixture.textContent?.includes("120 ms"), "Métrica fictícia");
    }
  },
);
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
