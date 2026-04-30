import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH))
    return process.env.FFMPEG_PATH;
  try {
    const p = require("ffmpeg-static");
    if (typeof p === "string" && existsSync(p)) return p;
  } catch {}
  return "ffmpeg";
}

export function run(ffmpegPath, args, { silent = true } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: silent ? "ignore" : "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
}

export function winFont(p = "C\\:/Windows/Fonts/arialbd.ttf") {
  return p;
}
