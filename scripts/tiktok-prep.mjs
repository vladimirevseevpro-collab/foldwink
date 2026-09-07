#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v = "true"] = a.replace(/^--/, "").split("=");
      return [k, v];
    }),
);

const rawId = positional[0];
const batch = flags.batch || "01";
const field = (flags.field || "post").toLowerCase();
const noCopy = flags["no-copy"] === "true";

const FIELDS = [
  "caption",
  "comment",
  "pinned",
  "cover",
  "cover_text",
  "hashtags",
  "tags",
  "url",
  "destination",
  "post",
  "all",
];

function usage() {
  console.error("Usage:");
  console.error(
    "  node scripts/tiktok-prep.mjs <post-id> [--field=<field>] [--batch=01] [--no-copy]",
  );
  console.error("");
  console.error("post-id:  1 | 01 | post-01");
  console.error(`fields:   ${FIELDS.join(" | ")}   (default: post = caption + hashtags)`);
  console.error("");
  console.error("Examples:");
  console.error(
    "  node scripts/tiktok-prep.mjs 1                # caption + hashtags → clipboard",
  );
  console.error("  node scripts/tiktok-prep.mjs 1 --field=pinned # pinned reply → clipboard");
  console.error("  node scripts/tiktok-prep.mjs 1 --field=all    # every field, formatted");
}

if (!rawId) {
  usage();
  process.exit(1);
}

const queuePath = join(root, "tiktok", `batch_${batch}`, "manifests", "publish_queue.json");
if (!existsSync(queuePath)) {
  console.error(`publish_queue.json missing at: ${queuePath}`);
  console.error("");
  console.error(
    "Generate it with stage 3 of the mega-prompt (see tiktok/foldwink_tiktok_launch_page.html §6).",
  );
  process.exit(1);
}

let queue;
try {
  queue = JSON.parse(readFileSync(queuePath, "utf8"));
} catch (e) {
  console.error(`failed to parse ${queuePath}: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(queue)) {
  console.error("publish_queue.json must be an array of post objects.");
  process.exit(1);
}

function normalise(id) {
  const n = String(id).replace(/^post-/, "");
  const padded = n.padStart(2, "0");
  return `post-${padded}`;
}

const postId = normalise(rawId);
const post = queue.find((p) => p.id === postId);
if (!post) {
  console.error(`post "${postId}" not found in queue.`);
  console.error(`available: ${queue.map((p) => p.id).join(", ")}`);
  process.exit(1);
}

function render(f) {
  switch (f) {
    case "caption":
      return post.caption || "";
    case "comment":
    case "pinned":
      return post.pinned_comment || "";
    case "cover":
    case "cover_text":
      return post.cover_text || "";
    case "hashtags":
    case "tags":
      return (post.hashtags || []).join(" ");
    case "url":
    case "destination":
      return post.destination_url || "";
    case "post":
      return [post.caption, (post.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
    case "all": {
      const head = [post.id, post.bucket, post.segment ? `segment ${post.segment}` : null]
        .filter(Boolean)
        .join(" · ");
      const lines = [
        `# ${head}`,
        "",
        "## cover text",
        post.cover_text || "(none)",
        "",
        "## caption",
        post.caption || "(none)",
        "",
        "## hashtags",
        (post.hashtags || []).join(" ") || "(none)",
        "",
        "## pinned comment (publish + pin from author)",
        post.pinned_comment || "(none)",
        "",
        "## destination URL",
        post.destination_url || "(none)",
      ];
      if (post.scheduled_slot_iso) lines.push("", "## scheduled slot", post.scheduled_slot_iso);
      if (post.file) lines.push("", "## video file", post.file);
      if (post.cover) lines.push("", "## cover image", post.cover);
      return lines.join("\n");
    }
    default:
      throw new Error(`unknown field: ${f}. allowed: ${FIELDS.join(", ")}`);
  }
}

let text;
try {
  text = render(field);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

function copyToClipboard(str) {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let cmd, cmdArgs;
    if (platform === "darwin") {
      cmd = "pbcopy";
      cmdArgs = [];
    } else if (platform === "linux") {
      cmd = "xclip";
      cmdArgs = ["-selection", "clipboard"];
    } else {
      cmd = "clip";
      cmdArgs = [];
    }
    const child = spawn(cmd, cmdArgs, { stdio: ["pipe", "ignore", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)),
    );
    child.stdin.end(str, "utf8");
  });
}

console.log(`--- ${postId} · field=${field} ---`);
console.log(text);
console.log(`--- ${text.length} chars ---`);

if (noCopy || text.length === 0) {
  if (text.length === 0) console.log("(empty — nothing to copy)");
  process.exit(0);
}

try {
  await copyToClipboard(text);
  console.log("(copied to clipboard)");
} catch (e) {
  console.error(`clipboard copy failed: ${e.message}`);
  console.error("text is still printed above — copy manually or install xclip/pbcopy.");
  process.exit(2);
}
