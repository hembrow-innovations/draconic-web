import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

export const LEARN_TITLE = "UniqueLearnTitleZ9q";
export const REFERENCE_TITLE = "UniqueRefTitleK3w";

export const LEARN_CHAPTERS = [
  ["install", "Install"],
  ["from-javascript", "from JavaScript"],
  ["from-systems", "from systems"],
  ["dual-worlds", "Dual worlds"],
  ["modules", "modules"],
  ["native-types", "native types"],
  ["host-io", "host I/O"],
  ["packages", "packages"],
] as const;

export const REFERENCE_PAGES = [
  ["cli", "CLI"],
  ["types", "types"],
  ["dual-world-rules", "Dual-world rules"],
  ["reference-host-io", "host I/O"],
  ["reference-packages", "packages"],
] as const;

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
export const websiteDir = join(srcDir, "..");
export const contentDir = join(websiteDir, "content");

export type FenceCheck =
  | { ok: true; fenceDir: string }
  | { ok: false; error: string };

let distCache: string | undefined;
let repoFences: FenceCheck | undefined;

export function languageRepo(): string {
  const fromEnv = process.env.DRACONIC_REPO;
  const candidate = fromEnv ?? join(websiteDir, "..", "draconic");
  if (!existsSync(candidate)) {
    throw new Error(
      `language repo not found at ${candidate} (set DRACONIC_REPO)`,
    );
  }
  return candidate;
}

export function page(
  title: string,
  section: string,
  status: string,
  body: string,
): string {
  return `---\ntitle: ${title}\nsection: ${section}\nstatus: ${status}\n---\n\n# ${title}\n\n${body}\n`;
}

export function fixtureWebsite(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "draconic-web-fences-"));
  const website = join(dir, "website");
  mkdirSync(website);
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(website, name), body);
  }
  return website;
}

export function draconicBin(): string {
  const fromEnv = process.env.DRACONIC_BIN ?? process.env.DRACONIC;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  const root = languageRepo();
  for (const profile of ["debug", "release"] as const) {
    const bin = join(root, "target", profile, "draconic");
    if (existsSync(bin)) {
      return bin;
    }
  }
  throw new Error("missing draconic binary (build draconic-cli first or set DRACONIC_BIN)");
}

export function pageStatusAndFences(src: string): {
  status: string;
  fences: { lang: string; body: string }[];
} {
  let status = "";
  const fences: { lang: string; body: string }[] = [];
  let inFront = false;
  let seenFm = false;
  let inFence = false;
  let lang = "";
  let body = "";
  for (const line of src.split("\n")) {
    if (inFront) {
      if (line === "---") {
        inFront = false;
      } else if (line.startsWith("status:")) {
        status = line.slice("status:".length).trim();
      }
      continue;
    }
    if (inFence) {
      if (line.startsWith("```")) {
        fences.push({ lang, body });
        inFence = false;
        lang = "";
        body = "";
      } else {
        body += `${line}\n`;
      }
      continue;
    }
    if (line === "---" && !seenFm) {
      inFront = true;
      seenFm = true;
      continue;
    }
    if (line.startsWith("```")) {
      inFence = true;
      lang = line.slice(3).trim().split(/\s+/)[0] ?? "";
      body = "";
    }
  }
  return { status, fences };
}

export function checkFences(website: string): FenceCheck {
  const fenceDir = join(
    mkdtempSync(join(tmpdir(), "draconic-web-fence-out-")),
    ".fences",
  );
  let fenceI = 0;
  let entries: string[];
  try {
    entries = readdirSync(website);
  } catch (e) {
    return { ok: false, error: `read website: ${String(e)}` };
  }
  for (const name of entries) {
    if (!name.endsWith(".md")) {
      continue;
    }
    const path = join(website, name);
    let src: string;
    try {
      src = readFileSync(path, "utf8");
    } catch (e) {
      return { ok: false, error: `read ${path}: ${String(e)}` };
    }
    const { status, fences } = pageStatusAndFences(src);
    if (status === "not-yet" && fences.length > 0) {
      return { ok: false, error: `not-yet page ${path} contains a fence` };
    }
    if (status !== "shipped") {
      continue;
    }
    for (const fence of fences) {
      if (fence.lang !== "drac") {
        continue;
      }
      mkdirSync(fenceDir, { recursive: true });
      const srcPath = join(fenceDir, `fence-${fenceI}.drac`);
      const outPath = join(fenceDir, `fence-${fenceI}.js`);
      writeFileSync(srcPath, fence.body);
      fenceI += 1;
      const built = spawnSync(
        draconicBin(),
        ["build", "--target", "js", srcPath, "-o", outPath],
        { encoding: "utf8" },
      );
      if (built.error) {
        return { ok: false, error: `draconic build: ${built.error.message}` };
      }
      if (built.status !== 0) {
        return {
          ok: false,
          error: `draconic build failed for ${srcPath}: status=${built.status} stdout=${built.stdout} stderr=${built.stderr}`,
        };
      }
    }
  }
  return { ok: true, fenceDir };
}

export function checkRepoFences(): FenceCheck {
  if (!repoFences) {
    repoFences = checkFences(contentDir);
  }
  return repoFences;
}

export function publishedPages(): string {
  if (distCache) {
    return distCache;
  }
  const built = spawnSync("pnpm", ["build"], {
    cwd: websiteDir,
    encoding: "utf8",
    env: { ...process.env, PAGES_BASE: process.env.PAGES_BASE ?? "/draconic" },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 180_000,
  });
  if (built.error) {
    throw new Error(`pnpm build: ${built.error.message}`);
  }
  if (built.status !== 0) {
    throw new Error(
      `pnpm build failed: status=${built.status} stdout=${built.stdout} stderr=${built.stderr}`,
    );
  }
  for (const candidate of [
    join(websiteDir, "dist", "client"),
    join(websiteDir, "dist"),
  ]) {
    if (existsSync(join(candidate, "index.html"))) {
      distCache = candidate;
      return candidate;
    }
  }
  throw new Error("Start static build produced no index.html under dist");
}

export function publishedPage(slug: string): { path: string; html: string } {
  const dist = publishedPages();
  const candidates =
    slug === "" || slug === "index"
      ? [join(dist, "index.html")]
      : [join(dist, `${slug}.html`), join(dist, slug, "index.html")];
  for (const path of candidates) {
    if (existsSync(path)) {
      return { path, html: readFileSync(path, "utf8") };
    }
  }
  throw new Error(`expected published HTML for ${slug} under ${dist}`);
}

export function containsHref(html: string, slug: string): boolean {
  return [
    `href="/${slug}"`,
    `href="/${slug}/"`,
    `href="/draconic/${slug}"`,
    `href="/draconic/${slug}/"`,
  ].some((needle) => html.includes(needle));
}

export function containsLabeledLink(
  html: string,
  slug: string,
  label: string,
): boolean {
  return (
    containsHref(html, slug) &&
    (html.includes(`>${label}</a>`) || html.includes(`>${label}<`))
  );
}

export function assertNav(html: string): void {
  expect(containsLabeledLink(html, "learn", "Learn"), html).toBe(true);
  expect(containsLabeledLink(html, "reference", "Reference"), html).toBe(true);
}

export function assertVisibleStatus(html: string, path: string): void {
  expect(
    html.includes("shipped") || html.includes("not-yet"),
    `expected visible status shipped or not-yet in ${path}`,
  ).toBe(true);
}

export function assertHtmlDocument(html: string): void {
  expect(
    html.includes("<!DOCTYPE html>") || html.includes("<html"),
    html,
  ).toBe(true);
}

export function assertLearnChapterNav(html: string): void {
  for (const [slug, label] of LEARN_CHAPTERS) {
    expect(containsLabeledLink(html, slug, label), `${label} -> ${slug}`).toBe(
      true,
    );
  }
}

export function assertReferencePageNav(html: string): void {
  for (const [slug, label] of REFERENCE_PAGES) {
    expect(containsLabeledLink(html, slug, label), `${label} -> ${slug}`).toBe(
      true,
    );
  }
}
