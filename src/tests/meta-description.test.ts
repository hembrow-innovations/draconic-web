import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { loadMarkdownPage, pageShareHead } from "../lib/content";
import {
  liveShareInput,
  publicRouteFiles,
  routeFilePath,
  routeSource,
} from "./live-route-share-head";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const homePitch =
  "JavaScript you already know. Native types when you need them. One language, two backends.";
const articleLead =
  "This landing assumes you already write JavaScript or TypeScript. Learn will not teach ECMAScript from scratch.";
const siteOrigin = "https://hembrow-innovations.github.io/draconic";

function firstProseLine(body: string): string {
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (
      trimmed === "" ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("```") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ")
    ) {
      continue;
    }
    return trimmed.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  }
  throw new Error("markdown body has no prose line");
}

function metaContent(
  head: ReturnType<typeof pageShareHead>,
  key: "name" | "property",
  value: string,
): string {
  const tag = head.meta.find((entry) => entry[key] === value);
  expect(tag?.content, value).toEqual(expect.any(String));
  expect(tag?.content, value).not.toBe("");
  return tag?.content ?? "";
}

function canonicalHref(head: ReturnType<typeof pageShareHead>): string {
  const link = head.links.find((entry) => entry.rel === "canonical");
  expect(link?.href).toEqual(expect.any(String));
  expect(link?.href).not.toBe("");
  return link?.href ?? "";
}

function expectedCanonical(path: string): string {
  if (path === "/") {
    return `${siteOrigin}/`;
  }
  return `${siteOrigin}${path}`;
}

test("meta description", () => {
  const learnPage = loadMarkdownPage("learn");
  const articlePage = loadMarkdownPage("from-javascript");
  const home = routeSource("index.tsx");
  const learn = routeSource("learn.tsx");
  const article = routeSource("from-javascript.tsx");
  const hero = readFileSync(
    join(srcDir, "features", "home", "HomeHero", "HomeHero.tsx"),
    "utf8",
  );

  expect(hero).toContain(homePitch);
  expect(learnPage.title).toBe("Learn");
  expect(articlePage.title).toBe("from JavaScript");
  expect(firstProseLine(learnPage.body)).toBe(homePitch);
  expect(firstProseLine(articlePage.body)).toBe(articleLead);

  expect(home).toContain("public-site.chrome:meta-description");
  expect(learn).toContain("public-site.chrome:meta-description");
  expect(article).toContain("public-site.chrome:meta-description");

  const homeInput = liveShareInput("index.tsx");
  const learnInput = liveShareInput("learn.tsx");
  const articleInput = liveShareInput("from-javascript.tsx");
  expect(homeInput.description).toBe(homePitch);
  expect(homeInput.description).not.toBe("");
  expect(learnInput.description).not.toBe("");
  expect(articleInput.description).not.toBe("");
  expect(homeInput.path).toBe(routeFilePath(home));
  expect(learnInput.path).toBe(routeFilePath(learn));
  expect(articleInput.path).toBe(routeFilePath(article));

  const homeHead = pageShareHead(homeInput);
  const learnHead = pageShareHead(learnInput);
  const articleHead = pageShareHead(articleInput);

  expect(metaContent(homeHead, "name", "description")).toBe(homePitch);
  expect(metaContent(learnHead, "name", "description")).toBe(homePitch);
  expect(metaContent(articleHead, "name", "description")).toBe(articleLead);

  expect(canonicalHref(homeHead)).toBe(expectedCanonical(routeFilePath(home)));
  expect(canonicalHref(learnHead)).toBe(expectedCanonical(routeFilePath(learn)));
  expect(canonicalHref(articleHead)).toBe(
    expectedCanonical(routeFilePath(article)),
  );
  expect(
    new Set([
      canonicalHref(homeHead),
      canonicalHref(learnHead),
      canonicalHref(articleHead),
    ]).size,
  ).toBe(3);

  expect(metaContent(homeHead, "property", "og:title")).toBe("Draconic");
  expect(metaContent(learnHead, "property", "og:title")).toContain("Learn");
  expect(metaContent(articleHead, "property", "og:title")).toContain(
    "from JavaScript",
  );
  expect(metaContent(homeHead, "property", "og:description")).toBe(homePitch);
  expect(metaContent(learnHead, "property", "og:description")).toBe(homePitch);
  expect(metaContent(articleHead, "property", "og:description")).toBe(
    articleLead,
  );
  expect(metaContent(homeHead, "property", "og:url")).toBe(
    expectedCanonical(routeFilePath(home)),
  );
  expect(metaContent(learnHead, "property", "og:url")).toBe(
    expectedCanonical(routeFilePath(learn)),
  );
  expect(metaContent(articleHead, "property", "og:url")).toBe(
    expectedCanonical(routeFilePath(article)),
  );

  for (const name of publicRouteFiles().filter((file) => file !== "index.tsx")) {
    const slug = name.replace(/\.tsx$/, "");
    const page = loadMarkdownPage(slug);
    const source = routeSource(name);
    const lead = firstProseLine(page.body);
    const input = liveShareInput(name);
    expect(input.description, name).toBe(lead);
    expect(input.description, name).not.toBe("");
    expect(input.path, name).toBe(routeFilePath(source));
    expect(source, name).toContain("public-site.chrome:meta-description");
    expect(source, name).not.toMatch(/<h1\b/);
    expect(source, name).not.toContain("twitter:");
    expect(source, name).not.toContain("og:image");
    expect(source, name).not.toContain("theme-color");
    const head = pageShareHead(input);
    expect(metaContent(head, "name", "description"), name).toBe(lead);
    expect(canonicalHref(head), name).toBe(
      expectedCanonical(routeFilePath(source)),
    );
    expect(metaContent(head, "property", "og:title"), name).toContain(
      page.title,
    );
    expect(metaContent(head, "property", "og:description"), name).toBe(lead);
    expect(metaContent(head, "property", "og:url"), name).toBe(
      expectedCanonical(routeFilePath(source)),
    );
  }

  expect(home).not.toMatch(/<h1\b/);
  expect(home).not.toContain("twitter:");
  expect(home).not.toContain("og:image");
  expect(home).not.toContain("theme-color");
});
