import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadMarkdownPage,
  pageDescriptionFromBody,
  type MarkdownPage,
  type PageShareHead,
  type PageShareInput,
} from "../lib/content";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
export const routesDir = join(srcDir, "routes");

const skipRouteFiles = new Set(["__root.tsx", "404.tsx"]);

export function publicRouteFiles(): string[] {
  return readdirSync(routesDir).filter(
    (name) => name.endsWith(".tsx") && !skipRouteFiles.has(name),
  );
}

export function routeSource(name: string): string {
  return readFileSync(join(routesDir, name), "utf8");
}

export function routeFilePath(source: string): string {
  const match = source.match(/createFileRoute\("([^"]+)"\)/);
  if (match?.[1] === undefined) {
    throw new Error("missing createFileRoute path");
  }
  return match[1];
}

export function liveShareInput(name: string): PageShareInput {
  const source = routeSource(name);
  const object = shareObject(source);
  const page =
    name === "index.tsx"
      ? undefined
      : loadMarkdownPage(name.replace(/\.tsx$/, ""));
  const fields = shareFields(object);
  return {
    title: evalTitle(liveBranch(fields.title), page, name),
    path: evalPath(liveBranch(fields.path), page, name),
    description: evalDescription(
      liveBranch(fields.description),
      source,
      page,
      name,
    ),
  };
}

export function documentTitleFromHead(head: PageShareHead): string {
  const tag = head.meta.find((entry) => entry.title !== undefined);
  if (tag?.title === undefined || tag.title === "") {
    throw new Error("head has no document title");
  }
  return tag.title;
}

export function titleSloganResidue(title: string, pageTitle: string): string {
  return title
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter(
      (part) =>
        part !== "" &&
        part !== pageTitle &&
        part !== "Learn" &&
        part !== "Reference" &&
        part !== "Draconic",
    )
    .join(" · ");
}

function shareObject(source: string): string {
  const start = source.indexOf("pageShareHead(");
  if (start === -1) {
    throw new Error("route does not call pageShareHead");
  }
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open + 1, i);
      }
    }
  }
  throw new Error("unclosed pageShareHead object");
}

function shareFields(object: string): {
  title: string;
  path: string;
  description: string;
} {
  const title = object.match(/title:\s*([\s\S]*?),\s*path:/)?.[1];
  const path = object.match(/path:\s*([\s\S]*?),\s*description:/)?.[1];
  const description = object.match(/description:\s*([\s\S]*?)$/)?.[1];
  if (title === undefined || path === undefined || description === undefined) {
    throw new Error("pageShareHead fields missing");
  }
  return {
    title: title.trim(),
    path: path.trim(),
    description: description.trim().replace(/,$/, "").trim(),
  };
}

function liveBranch(expr: string): string {
  const ternary = expr.match(/^loaderData\s*\?\s*([\s\S]*?)\s*:\s*([\s\S]*)$/);
  if (ternary?.[1] !== undefined) {
    return ternary[1].trim();
  }
  return expr.trim();
}

function interpolate(template: string, page: MarkdownPage): string {
  return template
    .replace(/\$\{loaderData\??\.title\}/g, page.title)
    .replace(/\$\{loaderData\??\.slug\}/g, page.slug);
}

function evalTitle(
  expr: string,
  page: MarkdownPage | undefined,
  name: string,
): string {
  const template = expr.match(/^`([^`]+)`$/);
  if (template?.[1] !== undefined) {
    if (page === undefined) {
      throw new Error(`${name} title template needs markdown`);
    }
    return interpolate(template[1], page);
  }
  const literal = expr.match(/^"([^"]*)"$/);
  if (literal?.[1] !== undefined) {
    return literal[1];
  }
  throw new Error(`${name} unrecognized title ${expr}`);
}

function evalPath(
  expr: string,
  page: MarkdownPage | undefined,
  name: string,
): string {
  const template = expr.match(/^`([^`]+)`$/);
  if (template?.[1] !== undefined) {
    if (page === undefined) {
      throw new Error(`${name} path template needs markdown`);
    }
    return interpolate(template[1], page);
  }
  const literal = expr.match(/^"([^"]*)"$/);
  if (literal?.[1] !== undefined) {
    return literal[1];
  }
  throw new Error(`${name} unrecognized path ${expr}`);
}

function evalDescription(
  expr: string,
  source: string,
  page: MarkdownPage | undefined,
  name: string,
): string {
  if (/^pageDescriptionFromBody\(\s*loaderData\.body\s*\)$/.test(expr)) {
    if (page === undefined) {
      throw new Error(`${name} description needs markdown`);
    }
    return pageDescriptionFromBody(page.body);
  }
  const literal = expr.match(/^"([^"]*)"$/);
  if (literal?.[1] !== undefined) {
    return literal[1];
  }
  const ident = expr.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  if (ident?.[1] !== undefined) {
    const fromConst = source.match(
      new RegExp(`(?:const|let|var)\\s+${ident[1]}\\s*=\\s*"([^"]*)"`),
    )?.[1];
    if (fromConst === undefined) {
      throw new Error(`${name} unresolved description ${ident[1]}`);
    }
    return fromConst;
  }
  throw new Error(`${name} unrecognized description ${expr}`);
}
