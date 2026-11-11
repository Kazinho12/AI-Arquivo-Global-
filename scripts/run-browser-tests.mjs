import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
const profile = await mkdtemp(join(tmpdir(), "ag-browser-tests-"));
const server = await createServer({
  envFile: false,
  optimizeDeps: {
    noDiscovery: true,
    include: [
      "react",
      "react-dom/client",
      "react-dom/server",
      "react-router-dom",
      "lucide-react",
      "@supabase/supabase-js",
    ],
  },
  define: {
    "import.meta.env.VITE_ENABLE_COVER_STUDIO_V2": JSON.stringify(
      process.env.AG_TEST_COVER_STUDIO_V2 === "1" ? "true" : "false",
    ),
    "import.meta.env.VITE_ENABLE_COVER_STYLE": JSON.stringify(
      process.env.AG_TEST_COVER_STYLE_ENABLED === "1" ? "true" : "false",
    ),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(""),
  },
  server: { host: "127.0.0.1", port: 4178, strictPort: true },
});
let chrome, socket;
try {
  await server.listen();
  const endpoint = await new Promise((resolve, reject) => {
    chrome = spawn(process.env.CHROME_BIN || "/usr/bin/google-chrome", [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-networking",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ]);
    let errors = "";
    chrome.stderr.on("data", (chunk) => {
      errors += chunk;
      const match = errors.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) resolve(match[1]);
    });
    chrome.on("error", reject);
    chrome.on("exit", () => reject(new Error(errors)));
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.on("message", (message) => {
    const data = JSON.parse(message.toString());
    if (data.id) {
      const request = pending.get(data.id);
      pending.delete(data.id);
      data.error
        ? request?.reject(new Error(JSON.stringify(data.error)))
        : request?.resolve(data.result);
    }
    if (data.method === "Runtime.exceptionThrown")
      errors.push(
        data.params.exceptionDetails.exception?.description ||
          data.params.exceptionDetails.text,
      );
    if (
      data.method === "Runtime.consoleAPICalled" &&
      data.params.type === "error"
    )
      errors.push(
        data.params.args.map((arg) => arg.value || arg.description).join(" "),
      );
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const next = ++id;
      pending.set(next, { resolve, reject });
      socket.send(
        JSON.stringify({
          id: next,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Page.bringToFront", {}, sessionId);
  await send("Runtime.addBinding", { name: "testDriver" }, sessionId);
  let peer;
  socket.on("message", async (message) => {
    const event = JSON.parse(message.toString());
    if (
      event.method !== "Runtime.bindingCalled" ||
      event.params.name !== "testDriver"
    )
      return;
    const request = JSON.parse(event.params.payload);
    try {
      if (request.kind === "peer") {
        if (!peer) {
          const target = await send("Target.createTarget", {
            url: "http://127.0.0.1:4178/scripts/storage-peer.html",
          });
          peer = await send("Target.attachToTarget", {
            targetId: target.targetId,
            flatten: true,
          });
        }
        const response = await send(
          "Runtime.evaluate",
          {
            expression: `(async()=>{for(let n=0;n<200&&!window.agPeer;n++) await new Promise(r=>setTimeout(r,10));return window.agPeer(${JSON.stringify(request.payload)});})()`,
            awaitPromise: true,
            returnByValue: true,
          },
          peer.sessionId,
        );
        if (response.exceptionDetails)
          throw new Error(response.exceptionDetails.text);
        await send(
          "Runtime.evaluate",
          {
            expression: `window.peerResult=${JSON.stringify(response.result?.value)}`,
          },
          sessionId,
        );
        await send("Page.bringToFront", {}, sessionId);
      } else if (request.kind === "key") {
        const codes = { Tab: 9, Enter: 13, Escape: 27, " ": 32 };
        await send(
          "Input.dispatchKeyEvent",
          {
            type: "keyDown",
            key: request.key,
            windowsVirtualKeyCode: codes[request.key],
            code: request.key,
          },
          sessionId,
        );
        if (request.key === "Enter" || request.key === " ")
          await send(
            "Input.dispatchKeyEvent",
            { type: "char", text: request.key === "Enter" ? "\r" : " " },
            sessionId,
          );
        await send(
          "Input.dispatchKeyEvent",
          {
            type: "keyUp",
            key: request.key,
            windowsVirtualKeyCode: codes[request.key],
            code: request.key,
          },
          sessionId,
        );
      } else if (request.kind === "viewport") {
        await send(
          "Emulation.setDeviceMetricsOverride",
          {
            width: Math.max(320, Math.min(1920, Number(request.width) || 1024)),
            height: 900,
            deviceScaleFactor: 1,
            mobile: false,
          },
          sessionId,
        );
      } else if (request.kind === "screenshot") {
        const shot = await send(
          "Page.captureScreenshot",
          { format: "png" },
          sessionId,
        );
        const label = String(request.label || "page")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 60);
        await writeFile(
          `/tmp/ag-D-${label}.png`,
          Buffer.from(shot.data, "base64"),
        );
      } else if (request.kind === "media")
        await send(
          "Emulation.setEmulatedMedia",
          { features: request.features },
          sessionId,
        );
      await send(
        "Runtime.evaluate",
        {
          expression: `window.dispatchEvent(new CustomEvent('test-driver-done',{detail:${JSON.stringify(request.id)}}))`,
        },
        sessionId,
      );
    } catch (error) {
      errors.push(String(error));
    }
  });
  await send(
    "Page.navigate",
    {
      url: `http://127.0.0.1:4178/scripts/${process.env.AG_TEST_PAGE || "stabilization.browser.html"}`,
    },
    sessionId,
  );
  const deadline =
    Date.now() +
    Math.min(
      240000,
      Math.max(90000, Number(process.env.AG_TEST_TIMEOUT_MS) || 90000),
    );
  let status = "";
  while (Date.now() < deadline) {
    try {
      const result = await send(
        "Runtime.evaluate",
        {
          expression: "document.documentElement.dataset.tests || ''",
          returnByValue: true,
        },
        sessionId,
      );
      status = result.result?.value;
      if (status) break;
    } catch {
      /* A real reload replaces the execution context. */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const result = await send(
    "Runtime.evaluate",
    {
      expression:
        "document.getElementById('results')?.textContent || document.body.innerText",
      returnByValue: true,
    },
    sessionId,
  );
  console.log(result.result?.value);
  if (errors.length) console.error(errors.join("\n"));
  await writeFile(
    process.env.AG_TEST_RESULTS || "/tmp/arquivo-global-browser-results.json",
    result.result?.value || "[]",
  );
  if (status !== "passed") process.exitCode = 1;
} finally {
  socket?.close();
  if (chrome && chrome.exitCode === null) {
    chrome.kill();
    await new Promise((resolve) => chrome.once("exit", resolve));
  }
  await server.close();
  await rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 200,
  });
}
