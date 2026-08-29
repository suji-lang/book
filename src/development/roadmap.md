# Roadmap

Where Suji stands at 0.1.22, stated as current condition rather than as promises.

This page describes what works and what is missing. It deliberately contains no
dates and no commitments. The honest summary is that
Suji is a pre-1.0 language, built from source, whose surface is settled enough
to write real scripts against and not settled enough to depend on.

## Current Version

**0.1.22**, from the workspace `Cargo.toml`. There is no
`suji --version` flag; the version lives in the source tree.

Suji is distributed only as a source build. There is no Homebrew formula, no
apt package, no published crate, and no prebuilt binary. Building is
`make release`, and the result is `target/release/suji`. See
[Installation](../getting-started/installation.md).

Versions in the `0.1.x` series have changed language syntax — 0.1.11 changed
match arms from `:` to `=>`, and 0.1.22 changed slices from `list[a:b]` to
`list[a;b]`. Treat a version bump as potentially source-breaking until 1.0. The
full history is in [Language Versions](../appendices/versions.md).

## What Is Stable Today

These parts of the language are exercised by the full spec suite and are
unlikely to move under you:

| Area | State |
|---|---|
| Exact decimal numbers and arithmetic | Settled since 0.1.9 |
| Strings, interpolation, multiline strings | Settled |
| Lists, maps, tuples, and their methods | Settled |
| `match` in both forms | Settled since 0.1.17 |
| `loop` with `through`/`with`, labels, `break`/`continue` | Settled |
| Lambdas, defaults, closures, multiple returns | Settled |
| Ranges, inclusive and descending | Settled since 0.1.18 |
| Regex matching with `~` and `!~` | Settled |
| Shell templates and `\|` pipelines | Settled |
| `\|>`, `<\|`, `>>`, `<<` | Settled since 0.1.12 |
| Imports, exports, local file modules | Settled since 0.1.16 |
| The standard library modules listed in the [Standard Library Overview](../stdlib/README.md) | Settled |
| Numeric error codes and framed diagnostics | Settled since 0.1.15 |

The AST-walking interpreter is the reference implementation, and it passes all
650 spec programs. `suji --print-ast program.si` dumps the parsed AST without
running the program.

## Known Limitations

These are the sharp edges as of 0.1.22. Each is a real constraint on what you
can write today, and each is the obvious place for future work.

### No error-handling construct

There is no `try`/`catch`, no `throw`, no `Result` or `Option`, and no `defer`.
Any runtime error prints a diagnostic and terminates the process with exit
status 1. The only available strategy is checking before acting:
`m::get(k, default)`, `m::contains(k)`, `xs::length() > 0`. A script cannot be
made to survive a single bad record. See [Error Handling Deep Dive](../advanced/error-handling.md).

### Regex is match-only

`/pattern/` supports `~` and `!~` and can be used as a match arm, and that is
all. There are no capture groups, no `::match()` or `::captures()`, no
regex-based replace, and no regex split. `string::replace(old, new)` takes
strings only. Extracting a substring means combining `split`, `index_of`, and
slicing, or shelling out to `sed`. Regex literals are also not interpolated, so
a pattern cannot be built from a variable.

### No tail-call optimisation

Recursion is bounded by the native stack; roughly 600–700 frames deep, a program
aborts with a stack overflow. Deeply recursive algorithms need to be rewritten
as loops. See [Recursion](../functions/recursion.md).

### A small collection API

Lists have `map`, `filter`, and `fold` but no `any`, `all`, `find`, `unique`,
`flatten`, `zip`, `enumerate`, `group_by`, or `sort_by`. Maps have no `set`
method — assign through `m[k] = v`. Strings have no `slice`, `pad_start`,
`capitalize`, or `lines`. Most gaps can be closed with a `fold` or a loop, but
they are gaps.

### Decimal overflow aborts

Numbers are fixed-precision, maximum `79228162514264337593543950335`. Exceeding
it terminates the process rather than promoting to a wider type, so `2::pow(100)`
is not a large number — it is a crash. Division by zero is likewise fatal.

### Everything is eager

Ranges materialise as full lists, so `0..1000000` allocates a million elements.
`map` and `filter` allocate a new list per stage. There are no lazy sequences,
no generators, and no parallelism. See [Performance Considerations](../advanced/performance.md).

### Other current gaps

| Gap | Detail |
|---|---|
| No packaging | Source builds only; nothing published to a package manager |
| No `--version`, `--help`, or `-e` | The only flag is `--print-ast` |
| No tuple indexing | `t[0]` is a type error; destructure or use `t::to_list()` |
| No binding patterns in `match` | A bare identifier in a pattern is a string literal |
| No variadic or keyword arguments | Use a list or a map parameter |
| No `break <value>` | Loops always evaluate to `nil` |
| Strings and streams are not iterable | Convert with `::to_list()` or `::read_lines()` first |
| Minimal REPL | `:help`, `:quit`, `:exit` only |
| No formatter or checker | `make lint` covers the Rust source, not `.si` files |

## Following Along

Progress is recorded in the repository rather than announced: the per-version
implementation plans under `internal_docs/`, the growth of `spec/`, and the
version history in [Language Versions](../appendices/versions.md). The most
reliable way to know whether something works is to write a spec file for it and
run it.

## See Also

- [Language Versions](../appendices/versions.md)
- [Language Design](design.md)
- [Contributing](contributing.md)
- [Error Handling Deep Dive](../advanced/error-handling.md)
- [Performance Considerations](../advanced/performance.md)
