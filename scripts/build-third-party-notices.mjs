import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "public", "third-party-notices.txt");
const checkOnly = process.argv.includes("--check");
const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));

const productionPackages = Object.entries(lock.packages)
  .filter(([path, metadata]) => path.startsWith("node_modules/") && metadata.dev !== true)
  .map(([path, metadata]) => ({
    name: path.slice("node_modules/".length),
    version: metadata.version,
    declaredLicense: metadata.license,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const acceptedLicenses = new Set(["MIT", "OFL-1.1", "0BSD", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause"]);
const packagedLicenseFallbacks = new Map([
  ["@ribpay/qr-code-generator", join(root, "THIRD_PARTY_NOTICES.md")],
]);
const sections = [];

for (const dependency of productionPackages) {
  if (!dependency.declaredLicense || !acceptedLicenses.has(dependency.declaredLicense)) {
    throw new Error(
      `${dependency.name}@${dependency.version} has an unreviewed license: ${dependency.declaredLicense ?? "missing"}`,
    );
  }
  const directory = join(root, "node_modules", dependency.name);
  const licenseFile = (await readdir(directory)).find((name) => /^licen[cs]e(?:\.|$)/iu.test(name));
  const fallback = packagedLicenseFallbacks.get(dependency.name);
  if (!licenseFile && !fallback) {
    throw new Error(`${dependency.name}@${dependency.version} has no packaged license file.`);
  }
  const licenseText = (
    await readFile(licenseFile ? join(directory, licenseFile) : fallback, "utf8")
  ).trim();
  sections.push(
    `${dependency.name}@${dependency.version}\nDeclared license: ${dependency.declaredLicense}\n\n${licenseText}`,
  );
}

const body = [
  "FOLDWINK THIRD-PARTY NOTICES",
  "Generated deterministically from the production dependency lockfile.",
  "These notices apply to the dependency versions distributed with this build.",
  "",
  ...sections.map((section) => `${"=".repeat(78)}\n${section}`),
  "",
].join("\n");

if (checkOnly) {
  const current = await readFile(output, "utf8").catch(() => "");
  if (current !== body) {
    throw new Error("public/third-party-notices.txt is missing or stale. Run npm run notices:build.");
  }
  console.log(`Production dependency notices are current (${productionPackages.length} packages).`);
} else {
  await writeFile(output, body, "utf8");
  console.log(`Built production dependency notices (${productionPackages.length} packages).`);
}
