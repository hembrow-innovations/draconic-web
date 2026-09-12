import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  assertHtmlDocument,
  assertNav,
  assertVisibleStatus,
  languageRepo,
  publishedPage,
  publishedPages,
  websiteDir,
} from "./website-pipeline-helpers";

const PUBLIC_SITE = "https://hembrow-innovations.github.io/draconic";

test("readme_links_public_docs_site_and_stays_onboarding", () => {
  const text = readFileSync(join(languageRepo(), "README.md"), "utf8");
  expect(text).toContain(PUBLIC_SITE);
  expect(text.includes("parse") && text.includes("hello.drac")).toBe(true);
  expect(
    text.includes("build --target js") && text.includes("build --target native"),
  ).toBe(true);
});

test("generated_html_is_not_authoring_source", () => {
  const root = languageRepo();
  const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
  expect(gitignore).toContain("/dist");
  expect(existsSync(join(root, "website"))).toBe(false);

  const siteGitignore = readFileSync(join(websiteDir, ".gitignore"), "utf8");
  expect(
    siteGitignore.includes("dist") || siteGitignore.includes("*.html"),
  ).toBe(true);

  const tracked = spawnSync("git", ["ls-files", "."], {
    cwd: websiteDir,
    encoding: "utf8",
  });
  expect(tracked.status, tracked.stderr).toBe(0);
  for (const line of tracked.stdout.split("\n")) {
    expect(line.endsWith(".html"), line).toBe(false);
  }
  expect(existsSync(join(websiteDir, "generate.drac"))).toBe(false);
});

test("ci_workflow_generates_site_and_deploys_pages", () => {
  const workflow = join(
    websiteDir,
    ".github",
    "workflows",
    "docs-pages.yml.disabled",
  );
  expect(existsSync(workflow)).toBe(true);
  const text = readFileSync(workflow, "utf8");
  expect(
    text.includes("generate-website.sh") ||
      text.includes("scripts/generate-website"),
  ).toBe(true);
  expect(text).toContain("upload-pages-artifact");
  expect(text).toContain("deploy-pages");
  expect(text.includes("dist/pages") || text.includes("dist/pages/")).toBe(
    true,
  );
});

test("generate_website_script_stages_html_to_dist", () => {
  const script = join(websiteDir, "scripts", "generate-website.sh");
  expect(existsSync(script)).toBe(true);
  const scriptText = readFileSync(script, "utf8");
  expect(scriptText).toContain("pnpm");
  expect(scriptText).not.toContain("generate.drac");
  expect(scriptText).toContain(".nojekyll");
  expect(existsSync(join(websiteDir, "generate.drac"))).toBe(false);

  const out = publishedPages();
  const index = readFileSync(join(out, "index.html"), "utf8");
  assertHtmlDocument(index);
  expect(index).toContain("JavaScript you already know");
  expect(index).toContain("Compiles to JavaScript");
  assertNav(index);
  const { html: learn } = publishedPage("learn");
  expect(learn).toContain("Learn is the public path");
  assertVisibleStatus(learn, "learn");
}, 300_000);
