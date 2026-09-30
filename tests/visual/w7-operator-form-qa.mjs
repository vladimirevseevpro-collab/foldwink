import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);
const packageMetadata = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const formPath = resolve("docs/research/FOLDWINK_W7_OPERATOR_FORM.html");
const formUrl = pathToFileURL(formPath).href;
const evidenceDir = resolve("reports/w7-balance-retention-2026-09-14/operator-form");
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const formSource = await readFile(formPath, "utf8");
if (
  /(?:localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|sendBeacon)/u.test(
    formSource,
  )
) {
  throw new Error("operator form contains a persistence or network API");
}
if (/<(?:script|link|img)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//iu.test(formSource)) {
  throw new Error("operator form references an external asset");
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [index, viewport] of viewports.entries()) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      acceptDownloads: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const diagnostics = [];
    const requests = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") diagnostics.push(message.text());
    });
    page.on("request", (request) => requests.push(request.url()));

    await page.goto(formUrl, { waitUntil: "load" });
    await page.locator("#observation-form").waitFor();
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    if (metrics.document > metrics.viewport + 1) {
      throw new Error(`${viewport.name}: horizontal overflow ${JSON.stringify(metrics)}`);
    }
    if (requests.some((url) => !url.startsWith("file:") && !url.startsWith("blob:"))) {
      throw new Error(
        `${viewport.name}: unexpected external request ${JSON.stringify(requests)}`,
      );
    }
    if (diagnostics.length > 0)
      throw new Error(`${viewport.name}: browser diagnostics ${diagnostics.join(" | ")}`);

    await page.screenshot({
      path: resolve(evidenceDir, `operator-form-${viewport.name}.png`),
      fullPage: true,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(evidenceDir, `operator-form-${viewport.name}-viewport.png`),
      fullPage: false,
    });
    await page
      .getByRole("heading", { name: "7. Return windows", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(evidenceDir, `operator-form-${viewport.name}-returns.png`),
      fullPage: false,
    });

    if (index === 0) {
      await page.getByRole("button", { name: "Validate record", exact: true }).click();
      if (await page.locator("#download").isEnabled())
        throw new Error("blank external study code allowed a download");
      const studyError = await page.locator('[data-error-for="studyCode"]').textContent();
      if (!studyError?.includes("P000"))
        throw new Error("study-code validation error was not shown beside the field");

      await page.locator("#studyCode").fill("P017");
      await page.getByRole("button", { name: "Validate record", exact: true }).click();
      if (!(await page.locator("#download").isEnabled()))
        throw new Error("valid observation did not enable download");
      const downloadPromise = page.waitForEvent("download");
      await page.locator("#download").click();
      const download = await downloadPromise;
      if (download.suggestedFilename() !== "foldwink-P017-observation.json") {
        throw new Error(`unsafe or unexpected filename ${download.suggestedFilename()}`);
      }
      const downloadedPath = await download.path();
      if (!downloadedPath) throw new Error("downloaded observation has no local path");
      const payload = JSON.parse(await readFile(downloadedPath, "utf8"));
      if (
        payload.studyCode !== "P017" ||
        payload.build.app !== packageMetadata.version ||
        payload.build.itchBuild !== "#1984826"
      ) {
        throw new Error("download did not preserve the external code and frozen build tuple");
      }
      const { stdout } = await execFileAsync(process.execPath, [
        resolve("scripts/summarize-pilot-observations.mjs"),
        downloadedPath,
      ]);
      const summary = JSON.parse(stdout);
      if (summary.accepted !== 1 || summary.rejected !== 0) {
        throw new Error(`CLI rejected browser-generated record: ${stdout}`);
      }

      await page.getByRole("button", { name: "+ Add issue", exact: true }).click();
      await page.locator('[data-field="summary"]').fill("Contact tester@example.com");
      await page.getByRole("button", { name: "Validate record", exact: true }).click();
      if (await page.locator("#download").isEnabled()) {
        throw new Error("possible personal data allowed a download");
      }
      const issueError = await page.locator('[data-error-section="issues"]').textContent();
      if (!issueError?.includes("персональные данные")) {
        throw new Error("privacy error was not shown for an unsafe issue summary");
      }

      await page.getByRole("button", { name: "Remove", exact: true }).click();
      await page.locator("#d0Qualified").uncheck();
      if (!(await page.locator("#d0LocalDate").isDisabled())) {
        throw new Error("D0 date remained editable without a qualified D0 session");
      }
      await page.getByRole("button", { name: "Validate record", exact: true }).click();
      if (!(await page.locator("#download").isEnabled())) {
        const errors = await page.locator(".error").allTextContents();
        throw new Error(
          `a recruited non-qualified session could not be recorded safely: ${errors.filter(Boolean).join(" | ")}`,
        );
      }
      const nonQualifiedDownloadPromise = page.waitForEvent("download");
      await page.locator("#download").click();
      const nonQualifiedDownload = await nonQualifiedDownloadPromise;
      const nonQualifiedPath = await nonQualifiedDownload.path();
      if (!nonQualifiedPath) throw new Error("non-qualified observation download has no path");
      const nonQualifiedPayload = JSON.parse(await readFile(nonQualifiedPath, "utf8"));
      if (
        nonQualifiedPayload.returns.d0Qualified !== false ||
        nonQualifiedPayload.returns.d0LocalDate !== null ||
        nonQualifiedPayload.returns.d1.targetDate !== null ||
        nonQualifiedPayload.returns.d7.targetDate !== null
      ) {
        throw new Error("non-qualified D0 leaked calendar dates into the retention record");
      }
      const nonQualifiedRun = await execFileAsync(process.execPath, [
        resolve("scripts/summarize-pilot-observations.mjs"),
        nonQualifiedPath,
      ]);
      const nonQualifiedSummary = JSON.parse(nonQualifiedRun.stdout);
      if (
        nonQualifiedSummary.flow.d0Qualified !== 0 ||
        nonQualifiedSummary.metrics.d1.cohort !== 0
      ) {
        throw new Error("non-qualified D0 entered the CLI retention cohort");
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(
  `PASS W7 operator form: offline export and three-view responsive evidence at ${evidenceDir}`,
);
