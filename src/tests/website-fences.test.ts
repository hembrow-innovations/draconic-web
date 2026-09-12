import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  LEARN_TITLE,
  REFERENCE_TITLE,
  assertNav,
  checkFences,
  checkRepoFences,
  contentDir,
  fixtureWebsite,
  page,
  publishedPage,
} from "./website-pipeline-helpers";

test("website_pipeline_shipped_drac_fence_builds", () => {
  const website = fixtureWebsite({
    "learn.md": page(
      LEARN_TITLE,
      "learn",
      "shipped",
      "```drac\nlet sample = 1 + 2;\n```\n",
    ),
    "reference.md": page(
      REFERENCE_TITLE,
      "reference",
      "not-yet",
      "Reference fixture.",
    ),
  });
  const result = checkFences(website);
  expect(result.ok, result.ok ? "" : result.error).toBe(true);
  if (!result.ok) {
    return;
  }
  expect(existsSync(join(result.fenceDir, "fence-0.js"))).toBe(true);
}, 60_000);

test("website_pipeline_shipped_invalid_drac_fence_fails", () => {
  const website = fixtureWebsite({
    "learn.md": page(
      LEARN_TITLE,
      "learn",
      "shipped",
      "```drac\nthis is not valid draconic !!!\n```\n",
    ),
    "reference.md": page(
      REFERENCE_TITLE,
      "reference",
      "not-yet",
      "Reference fixture.",
    ),
  });
  const result = checkFences(website);
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error).toContain("draconic build");
}, 60_000);

test("website_pipeline_not_yet_page_with_fence_fails", () => {
  const website = fixtureWebsite({
    "learn.md": page(LEARN_TITLE, "learn", "shipped", "Learn fixture."),
    "reference.md": page(
      REFERENCE_TITLE,
      "reference",
      "not-yet",
      "```\nsneaky sample\n```\n",
    ),
  });
  const result = checkFences(website);
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error).toContain("not-yet");
  expect(result.error).toContain("fence");
});

test("website_pipeline_not_yet_page_without_fence_generates", () => {
  const website = fixtureWebsite({
    "learn.md": page(LEARN_TITLE, "learn", "shipped", "Learn fixture."),
    "reference.md": page(
      REFERENCE_TITLE,
      "reference",
      "not-yet",
      "Reference fixture.",
    ),
  });
  const result = checkFences(website);
  expect(result.ok, result.ok ? "" : result.error).toBe(true);

  const { html: modules } = publishedPage("modules");
  assertNav(modules);
  expect(modules).toContain("modules");
  expect(modules).toContain("shipped");
}, 300_000);

test("website pipeline repo shipped fences build", () => {
  const result = checkRepoFences();
  expect(result.ok, result.ok ? "" : result.error).toBe(true);
  expect(contentDir.endsWith("content")).toBe(true);
}, 300_000);
