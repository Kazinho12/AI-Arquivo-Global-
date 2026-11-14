import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CoverPicker,
  coverDraft,
} from "../src/foundation/features/media/CoverPicker";
import "../src/foundation/styles/global.css";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!,
  root = createRoot(fixture),
  results: { name: string; ok: boolean; error?: string }[] = [];
let value = coverDraft();
let requests = 0;
const originalFetch = window.fetch;
window.fetch = async () => {
  requests++;
  throw Error("Unexpected remote request");
};
const check = (condition: unknown, message: string) => {
  if (!condition) throw Error(message);
};
function Harness() {
  const [state, setState] = useState(coverDraft());
  value = state;
  return (
    <CoverPicker
      value={state}
      onChange={setState}
      enabled
      ownerId="10000000-0000-0000-0000-000000000001"
    />
  );
}
const pause = () => new Promise((r) => setTimeout(r, 50));
async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: String(e) });
  }
}
await act(async () => root.render(<Harness />));
const canvas = document.createElement("canvas");
canvas.width = 80;
canvas.height = 120;
canvas.getContext("2d")!.fillRect(0, 0, 80, 120);
const png = await new Promise<Blob>((r) =>
  canvas.toBlob((b) => r(b!), "image/png"),
);
async function choose(file: File) {
  const input = fixture.querySelector<HTMLInputElement>("input[type=file]")!;
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await pause();
    await pause();
  });
}
await run(
  "Cover selection validates and previews without uploading or saving",
  async () => {
    await choose(new File([png], "cover.png", { type: "image/png" }));
    check(value.file?.name === "cover.png", "File not selected");
    check(fixture.querySelector('img[src^="blob:"]'), "No local image preview");
    check(requests === 0, "Selection uploaded");
    check(
      !fixture.textContent?.includes("Alterações guardadas"),
      "False success",
    );
  },
);
await run(
  "2:3 preview, crop controls and mobile width remain usable",
  async () => {
    const frame = fixture.querySelector<HTMLElement>(".custom-cover-frame")!;
    check(
      frame.clientWidth / frame.clientHeight > 0.65 &&
        frame.clientWidth / frame.clientHeight < 0.68,
      "Wrong aspect",
    );
    const sliders =
      fixture.querySelectorAll<HTMLInputElement>("input[type=range]");
    check(sliders.length === 3, "Missing crop controls");
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    await act(async () => {
      set.call(sliders[2], "1.5");
      sliders[2].dispatchEvent(new Event("input", { bubbles: true }));
      sliders[2].dispatchEvent(new Event("change", { bubbles: true }));
    });
    check(value.zoom === 1.5, "Zoom not applied");
    check(
      document.documentElement.scrollWidth <= innerWidth + 1,
      "Horizontal overflow",
    );
  },
);
async function viewport(width: number) {
  const id = crypto.randomUUID();
  await new Promise<void>((resolve) => {
    const done = (event: Event) => {
      if ((event as CustomEvent).detail === id) {
        window.removeEventListener("test-driver-done", done);
        resolve();
      }
    };
    window.addEventListener("test-driver-done", done);
    (window as any).testDriver(JSON.stringify({ kind: "viewport", width, id }));
  });
}
await run(
  "Cover controls fit mobile, tablet and desktop in both application themes",
  async () => {
    for (const width of [360, 768, 1280]) {
      await viewport(width);
      for (const theme of ["light", "dark"]) {
        document.documentElement.dataset.theme = theme;
        await pause();
        check(
          document.documentElement.scrollWidth <= innerWidth + 1,
          `Overflow ${width} ${theme}`,
        );
        check(
          fixture.querySelectorAll("input[type=range]").length === 3,
          "Crop controls missing",
        );
      }
    }
  },
);
await run(
  "Invalid replacement preserves the chosen image and exposes an error",
  async () => {
    await choose(new File(["<svg/>"], "fake.png", { type: "image/png" }));
    check(fixture.querySelector("[role=alert]"), "No visible error");
    check(value.file?.name === "cover.png", "Old file lost");
    check(requests === 0, "Invalid image uploaded");
  },
);
await run(
  "Switching back to Cover Studio changes only the unsaved local selection",
  async () => {
    const button = [...fixture.querySelectorAll("button")].find(
      (b) => b.textContent === "Cover Studio",
    )!;
    await act(async () => {
      button.click();
      await pause();
    });
    check(!value.file && !value.image, "Image not cleared");
    check(!fixture.querySelector('img[src^="blob:"]'), "Preview not cleared");
    check(requests === 0, "Toggle sent a remote delete");
  },
);
await run(
  "Orphan cleanup requires confirmation and cancel makes no requests",
  async () => {
    const button = [...fixture.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Limpar uploads antigos"),
    )!;
    await act(async () => {
      button.click();
      await pause();
    });
    check(
      document.querySelector("dialog[open]"),
      "Missing cleanup confirmation",
    );
    const cancel = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Cancelar limpeza",
    )!;
    await act(async () => {
      cancel.click();
      await pause();
    });
    check(!document.querySelector("dialog[open]"), "Dialog stayed open");
    check(requests === 0, "Cancel deleted files");
  },
);
await act(async () => root.unmount());
window.fetch = originalFetch;
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
