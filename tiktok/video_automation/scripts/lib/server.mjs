import { spawn } from "node:child_process";
import http from "node:http";

export async function startPreviewServer({ port = 4174, cwd }) {
  const proc = spawn("npm", ["run", "preview", "--", "--host", "--port", String(port)], {
    cwd,
    env: { ...process.env, FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", () => {});
  const url = `http://localhost:${port}`;
  await waitForUrl(url, 20_000);
  return {
    url,
    stop: () =>
      new Promise((r) => {
        if (proc.exitCode !== null) return r();
        proc.once("exit", () => r());
        try {
          proc.kill("SIGTERM");
        } catch {
          r();
        }
        setTimeout(() => {
          try {
            proc.kill("SIGKILL");
          } catch {}
          r();
        }, 2500);
      }),
  };
}

function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", retry);
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs)
        return reject(new Error(`preview server did not respond at ${url}`));
      setTimeout(tick, 400);
    };
    tick();
  });
}
