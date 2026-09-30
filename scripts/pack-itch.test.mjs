import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createDeterministicZip } from "./pack-itch.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function createFixture(root, reverse) {
  const files = [
    ["index.html", "<main>Foldwink</main>\n"],
    ["assets/app.js", "export const version = 'test';\n"],
    ["assets/theme.css", ":root { color-scheme: light dark; }\n"],
  ];
  if (reverse) files.reverse();
  for (const [relativePath, contents] of files) {
    const fullPath = join(root, ...relativePath.split("/"));
    await mkdir(join(fullPath, ".."), { recursive: true });
    await writeFile(fullPath, contents);
  }
}

describe("deterministic itch archive", () => {
  it("produces the same ZIP for identical trees created in different orders", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "foldwink-pack-test-"));
    try {
      const firstTree = join(scratch, "first");
      const secondTree = join(scratch, "second");
      await mkdir(firstTree);
      await mkdir(secondTree);
      await createFixture(firstTree, false);
      await createFixture(secondTree, true);
      const firstZip = join(scratch, "first.zip");
      const secondZip = join(scratch, "second.zip");

      await createDeterministicZip(firstTree, firstZip);
      await createDeterministicZip(secondTree, secondZip);

      expect(sha256(await readFile(firstZip))).toBe(sha256(await readFile(secondZip)));
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });

  it("rejects symbolic links in archive input", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "foldwink-pack-test-"));
    try {
      const tree = join(scratch, "tree");
      await mkdir(tree);
      const target = join(scratch, "outside");
      await mkdir(target);
      await writeFile(join(target, "outside.txt"), "outside\n");
      await symlink(target, join(tree, "linked"), "junction");

      await expect(createDeterministicZip(tree, join(scratch, "linked.zip"))).rejects.toThrow(
        "Non-regular archive input is not allowed",
      );
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });
});
