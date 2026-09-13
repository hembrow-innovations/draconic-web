---
title: packages
section: reference
status: shipped
---

# packages

Packages are git-backed. v1 does not require a central registry.

This page is lookup: Go-like module path, manifest map, semver git tags, lock pin, get, tidy, and named import from the module path. Keep it open while you write. `draconic check` is the Checker. Open [packages](packages.html) for the flow, or [CLI](cli.html) for command names.

- Imports use a Go-like module path such as github.com/org/pkg
- draconic.toml may map that path to a git URL
- Versions are semver git tags
- draconic.lock pins commit OID and a content hash of the package tree
- Resolve lands on ESM files inside the package
- Every `.drac` file in the checkout is importable; there is no exports map
- v1 lock fill is direct deps only; nested git deps are not auto-locked
- A Program depends on git-tag source via manifest, lock, and Linker
- Node consumes a flattened artifact only from `draconic build --target js --library`
- Native `--library` is rejected; native build stays an executable
- Default `draconic run` stays a script

## Package root

A package is a git tree with a `draconic.toml` and an ESM entry. `draconic mod init` writes `module =` and refuses to overwrite an existing manifest. Tag a semver version so `get` can resolve it.

```drac
let console = globalThis.console;

export function greet(name: string): string {
  return "hello " + name;
}

console.log(greet("from a package"));
```

The matching manifest names the module path:

```
module = "github.com/org/pkg"
```

## get

`draconic get` adds a git package. It writes the dependency into `draconic.toml`, fetches, and updates `draconic.lock`. There is no published central registry in v1. Use `--url` when the default `https://{module_path}.git` is wrong, including a local git checkout:

```
draconic get github.com/org/pkg@1.0.0
draconic get github.com/org/pkg@1.0.0 --url /path/to/pkg
```

## mod tidy

`draconic mod tidy` aligns the lockfile with the manifest, fetches missing packages, and prunes unused ones:

```
draconic mod tidy
```

`draconic build` fetches missing locked deps unless `--offline`.

A consumer imports named exports with the module path, not a relative `.drac` specifier:

```
import { greet } from "github.com/org/pkg";
```

Copy [pkg-lib](https://github.com/hembrow-innovations/draconic/tree/main/examples/pkg-lib) and [pkg-consumer](https://github.com/hembrow-innovations/draconic/tree/main/examples/pkg-consumer) when you want a package root plus a consumer in one tree.
