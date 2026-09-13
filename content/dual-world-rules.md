---
title: Dual-world rules
section: reference
status: shipped
---

# Dual-world rules

Dual worlds is the coexistence of JS values and native types in one Program, with explicit boundaries at the type and lowering level.

This page is lookup: crossing, backend fit, and catchable versus abort. Keep it open while you write. `draconic check` is the Checker. Open [Dual worlds](dual-worlds.html) for the lesson, or [types](types.html) for Checker versus tsc.

## Crossing

JS values live on the GC heap. Native types stay unboxed and off the heap. Crossing a JS `number` and a native numeric type is an explicit `as`. There is no silent coercion. `string as i32` is a Checker error.

```drac
let console = globalThis.console;
let jsCount: number = 41;
let nativeCount: i32 = jsCount as i32;
let next: number = (nativeCount as number) + 1;
console.log(next);
```

## Backend fit

- A portable program is accepted by both backends with equivalent observable behavior after documented polyfills.
- A native-only Program is valid on LLVM only; the JS backend hard-errors with a diagnostic, never silent wrong code.
- A JS-only Program is valid on the JS backend only; LLVM hard-errors.

Pointers (`*T`, `&x`) are native-only: valid on LLVM, a hard error on the JS backend, never silent wrong code.

## Catchable versus abort

Catchable exceptions are JS-value failures a Program can handle with `try` / `catch`; they do not abort the process. Process abort is a different class and is not a JS value.

```drac
let console = globalThis.console;
try {
  throw "miss";
} catch (err) {
  console.log("caught");
}
console.log("continues");
```

Ownership-only and arena-only models were rejected so a full ECMAScript superset can sit next to native types.

Learn chapter: [Dual worlds](dual-worlds.html). Types lookup: [types](types.html).
