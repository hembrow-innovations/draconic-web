import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { loadMarkdownPage, pageShareHead } from "../lib/content";
import {
  documentTitleFromHead,
  liveShareInput,
  publicRouteFiles,
  routeFilePath,
  routeSource,
  titleSloganResidue,
} from "./live-route-share-head";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("document title", () => {
  const learnPage = loadMarkdownPage("learn");
  const referencePage = loadMarkdownPage("reference");
  const articlePage = loadMarkdownPage("from-javascript");
  const learn = routeSource("learn.tsx");
  const reference = routeSource("reference.tsx");
  const article = routeSource("from-javascript.tsx");
  const root = readFileSync(join(srcDir, "routes", "__root.tsx"), "utf8");
  const home = routeSource("index.tsx");

  expect(learn).toContain("public-site.chrome:document-title");
  expect(reference).toContain("public-site.chrome:document-title");
  expect(article).toContain("public-site.chrome:document-title");

  const learnTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("learn.tsx")),
  );
  const referenceTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("reference.tsx")),
  );
  const articleTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("from-javascript.tsx")),
  );

  expect(learnPage.title).toBe("Learn");
  expect(referencePage.title).toBe("Reference");
  expect(articlePage.title).toBe("from JavaScript");
  expect(
    [learnTitle, referenceTitle, articleTitle].every(
      (title) => title === "Draconic",
    ),
  ).toBe(false);
  expect(new Set([learnTitle, referenceTitle, articleTitle]).size).toBe(3);
  expect(learnTitle).toContain("Learn");
  expect(learnTitle).not.toBe("Draconic");
  expect(referenceTitle).toContain("Reference");
  expect(referenceTitle).not.toBe("Draconic");
  expect(articleTitle).toContain("from JavaScript");
  expect(articleTitle).not.toBe("Draconic");
  expect(titleSloganResidue(learnTitle, learnPage.title)).toBe("");
  expect(titleSloganResidue(referenceTitle, referencePage.title)).toBe("");
  expect(titleSloganResidue(articleTitle, articlePage.title)).toBe("");

  expect(root).toContain('title: "Draconic"');
  const homeInput = liveShareInput("index.tsx");
  expect(documentTitleFromHead(pageShareHead(homeInput))).toBe("Draconic");
  expect(titleSloganResidue(homeInput.title, "Draconic")).toBe("");
  expect(homeInput.description).not.toBe("");
  expect(homeInput.path).toBe(routeFilePath(home));
  expect(home).not.toMatch(/<h1\b/);

  const learnHostIoTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("host-io.tsx")),
  );
  const referenceHostIoTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("reference-host-io.tsx")),
  );
  const learnPackagesTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("packages.tsx")),
  );
  const referencePackagesTitle = documentTitleFromHead(
    pageShareHead(liveShareInput("reference-packages.tsx")),
  );

  expect(learnHostIoTitle).toContain("Learn");
  expect(learnHostIoTitle).toContain("host I/O");
  expect(referenceHostIoTitle).toContain("Reference");
  expect(referenceHostIoTitle).toContain("host I/O");
  expect(learnHostIoTitle).not.toBe(referenceHostIoTitle);
  expect(learnPackagesTitle).toContain("Learn");
  expect(learnPackagesTitle).toContain("packages");
  expect(referencePackagesTitle).toContain("Reference");
  expect(referencePackagesTitle).toContain("packages");
  expect(learnPackagesTitle).not.toBe(referencePackagesTitle);

  const markdownTitles: string[] = [];
  for (const name of publicRouteFiles().filter((file) => file !== "index.tsx")) {
    const slug = name.replace(/\.tsx$/, "");
    const page = loadMarkdownPage(slug);
    const source = routeSource(name);
    const input = liveShareInput(name);
    const head = pageShareHead(input);
    const title = documentTitleFromHead(head);
    markdownTitles.push(title);
    expect(title, name).not.toBe("Draconic");
    expect(title, name).toContain(page.title);
    expect(titleSloganResidue(title, page.title), name).toBe("");
    expect(input.description, name).not.toBe("");
    expect(input.path, name).toBe(routeFilePath(source));
    expect(source, name).toContain("public-site.chrome:document-title");
    expect(source, name).not.toMatch(/<h1\b/);
  }
  expect(new Set(markdownTitles).size).toBe(markdownTitles.length);
});
