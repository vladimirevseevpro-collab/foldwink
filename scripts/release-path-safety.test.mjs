import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prepareFreshWorkspaceOutput } from "./release-path-safety.mjs";

describe("exact-rebuild output path safety", () => {
  it("rejects a parent junction that resolves outside the workspace", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "foldwink-output-safety-"));
    const root = join(scratch, "workspace");
    const outside = join(scratch, "outside");
    await mkdir(root);
    await mkdir(outside);
    try {
      await symlink(outside, join(root, "linked"), "junction");
      await expect(
        prepareFreshWorkspaceOutput(root, join(root, "linked", "receipt.json"), "Receipt output"),
      ).rejects.toThrow("parent must not contain a symbolic link");
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite an existing output file", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "foldwink-output-safety-"));
    const root = join(scratch, "workspace");
    await mkdir(root);
    try {
      const output = join(root, "evidence", "receipt.json");
      await mkdir(join(root, "evidence"));
      await writeFile(output, "existing\n");
      await expect(prepareFreshWorkspaceOutput(root, output, "Receipt output")).rejects.toThrow(
        "must not overwrite an existing file",
      );
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });

  it("creates and accepts a fresh nested output parent inside the workspace", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "foldwink-output-safety-"));
    const root = join(scratch, "workspace");
    await mkdir(root);
    try {
      const output = join(root, "evidence", "BLD-01", "receipt.json");
      await expect(
        prepareFreshWorkspaceOutput(root, output, "Receipt output"),
      ).resolves.toBeUndefined();
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });
});
