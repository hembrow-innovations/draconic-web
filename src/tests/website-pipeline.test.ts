import { expect, test } from "vitest";
import {
  LEARN_CHAPTERS,
  REFERENCE_PAGES,
  assertHtmlDocument,
  assertLearnChapterNav,
  assertNav,
  assertReferencePageNav,
  assertVisibleStatus,
  checkRepoFences,
  containsHref,
  containsLabeledLink,
  publishedPage,
} from "./website-pipeline-helpers";

test("website_pipeline_learn_and_reference_nav_and_status", () => {
  const fences = checkRepoFences();
  expect(fences.ok, fences.ok ? "" : fences.error).toBe(true);

  const { html: learn } = publishedPage("learn");
  assertHtmlDocument(learn);
  assertNav(learn);
  expect(learn).toContain("Learn");
  expect(learn).toContain("shipped");

  const { html: reference } = publishedPage("reference");
  assertHtmlDocument(reference);
  assertNav(reference);
  expect(reference).toContain("Reference");
  assertVisibleStatus(reference, "reference");
}, 300_000);

test("website_pipeline_renders_markdown_subset", () => {
  const { html: install } = publishedPage("install");
  assertNav(install);
  expect(install).toContain("shipped");
  expect(install.includes("<h1>") && install.includes("Install")).toBe(true);
  expect(install.includes("<h2") && install.includes("Reproducibility")).toBe(
    true,
  );
  expect(install.includes("<p>") && install.includes("Get the toolchain")).toBe(
    true,
  );
  expect(
    install.includes("<ul>") &&
      install.includes("<li>") &&
      install.includes("linux/amd64"),
  ).toBe(true);
  expect(
    install.includes("<pre") &&
      install.includes("<code") &&
      install.includes("hello.drac"),
  ).toBe(true);
  expect(
    containsLabeledLink(install, "from-javascript", "from JavaScript"),
  ).toBe(true);

  const { html: fromSystems } = publishedPage("from-systems");
  assertNav(fromSystems);
  expect(fromSystems).toContain("shipped");
}, 300_000);

test("website_pipeline_learn_skeleton_is_walkable", () => {
  const fences = checkRepoFences();
  expect(fences.ok, fences.ok ? "" : fences.error).toBe(true);

  const { html: learn } = publishedPage("learn");
  assertNav(learn);
  assertLearnChapterNav(learn);
  assertVisibleStatus(learn, "learn");

  for (const [slug] of LEARN_CHAPTERS) {
    const { path, html } = publishedPage(slug);
    assertNav(html);
    assertLearnChapterNav(html);
    assertVisibleStatus(html, path);
  }

  const { html: fromJs } = publishedPage("from-javascript");
  expect(containsHref(fromJs, "dual-worlds")).toBe(true);
  const { html: fromSys } = publishedPage("from-systems");
  expect(containsHref(fromSys, "dual-worlds")).toBe(true);
}, 300_000);

test("website_pipeline_reference_skeleton_is_walkable", () => {
  const fences = checkRepoFences();
  expect(fences.ok, fences.ok ? "" : fences.error).toBe(true);

  const { html: reference } = publishedPage("reference");
  assertNav(reference);
  assertReferencePageNav(reference);
  assertVisibleStatus(reference, "reference");

  for (const [slug] of REFERENCE_PAGES) {
    const { path, html } = publishedPage(slug);
    assertNav(html);
    assertReferencePageNav(html);
    assertVisibleStatus(html, path);
  }
}, 300_000);
