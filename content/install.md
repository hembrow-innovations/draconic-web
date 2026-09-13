---
title: Install
section: learn
status: shipped
---

# Install

Get the toolchain, then parse, build, and run a Program before reading further.

On macOS and Linux:

```
curl -fsSL https://raw.githubusercontent.com/hembrow-innovations/draconic/main/scripts/install.sh | sh
```

That places `draconic` in `~/.draconic/bin`. Add that directory to `PATH` if needed, then confirm the binary:

```
export PATH="$HOME/.draconic/bin:$PATH"
draconic -V
```

The install script picks the host pair. Release CI builds a host-triple binary for each available OS/arch pair:

- linux/amd64
- linux/arm64
- darwin/amd64
- darwin/arm64
- windows/amd64
- windows/arm64

The one-liner downloads a host-triple artifact from GitHub Releases. If that artifact is not published yet, build from source.

## Windows

Do not run the Unix one-liner. Download the host-triple artifact from GitHub Releases and put `draconic.exe` on PATH.

- windows/amd64: `draconic-x86_64-pc-windows-msvc.exe`
- windows/arm64: `draconic-aarch64-pc-windows-msvc.exe`

PowerShell for windows/amd64:

```
New-Item -ItemType Directory -Force $env:USERPROFILE\.draconic\bin | Out-Null
Invoke-WebRequest -Uri https://github.com/hembrow-innovations/draconic/releases/latest/download/draconic-x86_64-pc-windows-msvc.exe -OutFile $env:USERPROFILE\.draconic\bin\draconic.exe
$env:PATH = "$env:USERPROFILE\.draconic\bin;$env:PATH"
draconic -V
```

On windows/arm64, use the arm64 artifact name. If that artifact is not published yet, build from source with cargo:

```
git clone https://github.com/hembrow-innovations/draconic.git
cd draconic
cargo build -p draconic-cli --release
$env:PATH = "$PWD\target\release;$env:PATH"
draconic -V
```

That writes `target\release\draconic.exe`.

## From source

Requires a Rust toolchain (`cargo`). Clone the repository, then build the CLI:

```
git clone https://github.com/hembrow-innovations/draconic.git
cd draconic
cargo build -p draconic-cli --release
```

That writes `target/release/draconic`. Add that directory to `PATH` if needed, then confirm:

```
export PATH="$PWD/target/release:$PATH"
draconic -V
```

The same commands live in the [repository README](https://github.com/hembrow-innovations/draconic).

A working `draconic -V` prints the product name on the first line, then commit, host, and LLVM:

```
draconic 0.1.0
commit: ...
host: ...
LLVM: ...
```

commit, host, and LLVM vary by build.

The next about ten minutes: parse, build, and run the hello Program, then pick a landing.

A Program is a unit of Draconic source the toolchain accepts. Save this as `hello.drac`. It builds today:

```drac
let console = globalThis.console;
console.log("hello from Draconic");
```

Parse it, build it to JavaScript, or run it. Default `draconic run` target is js. Have `node` on PATH before you run: the CLI executes the emitted JavaScript with Node.

```
draconic parse hello.drac
draconic build --target js hello.drac -o hello.js
draconic run hello.drac
```

Native binaries need an LLVM toolchain on the machine:

```
draconic build --target native hello.drac -o hello
./hello
```

## Zed editor

`.drac` files are Programs. Zed can highlight them, run a language server, format, run, and debug the JS target. The extension is not in the Zed marketplace. Install it as a Zed dev extension from [draconic-zed](https://github.com/hembrow-innovations/draconic-zed).

- Open the Extensions view (`zed: extensions`)
- Choose Install Dev Extension
- Pick the `draconic-zed` repo root, the directory that contains `extension.toml`. Do not pick `languages/draconic` or `grammars/draconic`.

Reopen a `.drac` file. The status bar language should read Draconic. `draconic` must be on PATH.

The language server is `draconic lsp`. Format in the editor is `draconic fmt`. Gutter run can `draconic check`, build, and run. JS-target debug uses Zed's host JavaScript adapter.

See [CLI](cli.html).

Learn assumes you can already parse and build.

Next: pick a landing. Use [from JavaScript](from-javascript.html) if you already think in ECMAScript. Use [from systems](from-systems.html) if you already think in Rust, Go, or C. Those landings join at [Dual worlds](dual-worlds.html).

## Reproducibility

Same source plus a matching toolchain pin does not always mean byte-identical files. Use this policy to tell whether two artifacts should match.

- JS artifacts: byte-identical for the same Program source and pin. The JS backend does not embed timestamps or source paths.
- LLVM IR: identical for the same Program source, pin, and source path. Native DWARF records embed the source path (filename and directory), so a different checkout path produces different IR.
- Linked native binaries: Mach-O and ELF timestamps, UUIDs, and linker noise may differ across builds. Documented-equivalent for native is identical LLVM IR, not a byte-identical packaged binary.

Release artifacts copied by the install path keep the linked binary as the host toolchain wrote it. They are not normalized for timestamps or paths.
