import { lstat, mkdir, realpath } from "node:fs/promises";
import path from "node:path";

function isInside(file, directory) {
  const relative = path.relative(directory, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function lstatOrNull(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function prepareFreshWorkspaceOutput(workspaceRoot, file, label) {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(file);
  if (!isInside(target, root)) throw new Error(`${label} must stay inside the workspace`);

  const rootStat = await lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("Workspace root must be a real directory");
  }

  const parent = path.dirname(target);
  const relativeParent = path.relative(root, parent);
  let cursor = root;
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    let cursorStat = await lstatOrNull(cursor);
    if (!cursorStat) {
      await mkdir(cursor);
      cursorStat = await lstat(cursor);
    }
    if (cursorStat.isSymbolicLink()) {
      throw new Error(`${label} parent must not contain a symbolic link: ${cursor}`);
    }
    if (!cursorStat.isDirectory()) {
      throw new Error(`${label} parent component is not a directory: ${cursor}`);
    }
  }

  const [resolvedRoot, resolvedParent] = await Promise.all([realpath(root), realpath(parent)]);
  if (resolvedParent !== resolvedRoot && !isInside(resolvedParent, resolvedRoot)) {
    throw new Error(`${label} parent resolves outside the workspace`);
  }

  const existing = await lstatOrNull(target);
  if (existing) {
    throw new Error(
      `${label} must not overwrite an existing ${existing.isSymbolicLink() ? "symbolic link" : "file"}`,
    );
  }
}
