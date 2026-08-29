# Resources

Where to look when this book runs out, listing only material that actually exists.

## Status

Suji is pre-1.0 — the current version is **0.1.22** — and is distributed only as
a source build. There is no package-manager release, no `suji --version` flag,
and no stability guarantee across `0.1.x` versions. Build it with
`cargo build --release` or `make release`; the binary lands at
`target/release/suji`. See [Installation](../getting-started/installation.md).

## The Source Repository

The project lives at <https://github.com/suji-lang/suji>. The workspace is split
into single-purpose crates:

| Path | Contents |
|---|---|
| `crates/suji-ast/` | AST node definitions |
| `crates/suji-lexer/` | Scanner, tokens, and the string/regex/shell state machines |
| `crates/suji-parser/` | Expression and statement parsing, operator precedence |
| `crates/suji-values/` | Value types, environment, methods, `RuntimeError` |
| `crates/suji-runtime/` | `Executor` trait, module registry, builtin registry |
| `crates/suji-interpreter/` | The default AST-walking interpreter |
| `crates/suji-stdlib/` | Standard library modules and builtin functions |
| `crates/suji-diagnostics/` | Error codes, templates, and the framed diagnostic output |
| `crates/suji-repl/` | The REPL loop |
| `crates/suji-cli/` | Binary entry point |

Supporting directories:

| Path | Contents |
|---|---|
| `spec/` | 650 single-assertion `.si` programs — the executable definition of the language |
| `examples/` | Complete runnable programs |
| `tests/` | Rust unit and integration tests |
| `scripts/` | `verify_spec.sh` and `verify_examples.sh` |
| `Makefile` | Every build and test entry point |

## Reading the Spec Suite

`spec/` is the most reliable answer to "does Suji support this?". Each file is
one assertion whose expected output sits in a trailing comment, so a file is
both a question and its answer:

```suji
import std:println

inc = |x| x + 1
result = 3 |> inc

println(result)  # 4
```

Files are named `feature_area_NN.si`, so `ls spec/ | grep map_methods` is a fast
way to find every documented behaviour of a feature. The conventions are
described in [Spec Tests](../development/testing/spec-tests.md).

## Make Targets

| Command | What it does |
|---|---|
| `make build` | Debug build |
| `make release` | Optimised build, producing `target/release/suji` |
| `make test` | Rust tests, then spec verification, then examples |
| `make rust_tests` | Rust unit and integration tests only |
| `make verify_spec` | Runs every `spec/*.si` and compares against its expected output |
| `make verify_examples` | Runs every `examples/*.si` and checks it exits cleanly |
| `make lint` | `cargo clippy --all-targets` plus `cargo fmt --check` |
| `make help` | Lists the full target set |

## Reading Diagnostics

Errors are your main feedback channel, since nothing can be caught at runtime.
Each diagnostic prints a numeric code, a title, the source line with the failing
expression underlined, and one or more suggestions. Look the code up in
[Error Codes](error-codes.md): the range alone tells you whether the failure was
lexical (`1xx`), syntactic (`2xx`) or a runtime fault (`4xx`).

## A Path Through This Book

If you are new, this order works well:

1. [Installation](../getting-started/installation.md) and [Quick Start](../getting-started/quick-start.md) — get a working binary and run something.
2. [Language Overview](../fundamentals/overview.md) — the shape of the language in one sitting.
3. [Data Types](../fundamentals/data-types/README.md) — one decimal number type, and the collections.
4. [Control Flow](../fundamentals/control-flow/README.md) — `match` and `loop` are the whole story.
5. [Functions](../functions/README.md) — lambdas, closures, and multiple returns.
6. [Operators](../fundamentals/operators/README.md) — especially the three pipe families.
7. [Modules](../modules/README.md) — imports, exports, and resolution.
8. [Standard Library Overview](../stdlib/README.md) — what you can import.
9. [Examples](../examples/README.md) and [Cookbook](../cookbook/README.md) — complete programs.
10. [Advanced Topics](../advanced/error-handling.md) — error behaviour, pattern matching, performance.

Keep [Syntax Reference](syntax-reference.md), [Operator Precedence](precedence.md)
and [Error Codes](error-codes.md) open while you write.

## Contributing

If you want to change the language rather than use it, start with
[Contributing](../development/contributing.md), then
[Testing](../development/testing.md). A language change is expected to ship with
a spec file, a Rust test, and a documentation update in the same commit.

## See Also

- [Syntax Reference](syntax-reference.md)
- [Glossary](glossary.md)
- [Language Versions](versions.md)
- [Contributing](../development/contributing.md)
- [Roadmap](../development/roadmap.md)
