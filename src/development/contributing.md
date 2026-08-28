# Contributing

How to build Suji, where to change it, and what a change is expected to ship with.

## Prerequisites

Stable Rust, installed through `rustup`. Nothing else — the workspace has no
external system dependencies beyond a shell for backtick templates.

## Build and Run

```bash
make build                        # debug build
make release                      # optimised build -> target/release/suji
cargo run -- examples/hello.si    # run a program from the debug build
cargo run                         # start the REPL
```

After `make release` you can call the binary directly:

```bash
target/release/suji examples/hello.si
```

## Lint and Test

```bash
make lint             # cargo clippy --all-targets, then cargo fmt --check
make test             # rust_tests, then verify_spec, then verify_examples
make rust_tests       # Rust unit and integration tests only
make verify_spec      # every spec/*.si against its expected output
make verify_examples  # every examples/*.si must exit cleanly
```

`make lint` and `make test` should both pass before you consider a change
finished. `make verify_spec` and `make verify_examples` depend on `release`, so
they rebuild the optimised binary first.

## Crate Map

The workspace is a chain of single-purpose crates with no dependency cycles:

```text
suji-ast → suji-values → suji-runtime → suji-interpreter → suji-cli / suji-repl
```

| Crate | Responsibility |
|---|---|
| `suji-ast` | AST node definitions (`expr.rs`, `stmt.rs`, `pattern.rs`, `literal.rs`, `function.rs`) |
| `suji-lexer` | Scanner core plus per-construct state handlers under `src/states/` |
| `suji-parser` | Expression and statement parsing under `src/expressions/` and `src/statements/` |
| `suji-values` | Value types, `Env`, `RuntimeError`, and all value methods |
| `suji-runtime` | The `Executor` trait, `ModuleRegistry`, and the builtin registry |
| `suji-interpreter` | The default AST-walking interpreter, evaluators under `src/eval/` |
| `suji-stdlib` | Standard library modules and builtin functions |
| `suji-diagnostics` | Error codes, error builders, and the framed diagnostic emitters |
| `suji-repl` | The REPL loop |
| `suji-cli` | Binary entry point and argument handling |

## Where to Make a Change

| If you are changing… | Start in |
|---|---|
| Tokens, escapes, string/regex/shell scanning | `crates/suji-lexer/src/token.rs` and `src/states/` |
| Regex-versus-division disambiguation | `ScannerContext::should_parse_as_regex` in `crates/suji-lexer/src/states/context.rs` |
| Grammar or operator precedence | `crates/suji-parser/src/expressions/` (precedence lives in `binary.rs`) |
| Evaluation semantics | `crates/suji-interpreter/src/eval/` |
| Function and method invocation | `crates/suji-interpreter/src/eval/function_call.rs` |
| A value method such as `list::sort` | `crates/suji-values/src/methods/` |
| Value types or `RuntimeError` variants | `crates/suji-values/src/value/` |
| A stdlib module or builtin | `crates/suji-stdlib/src/runtime/builtins/` |
| Module resolution | `crates/suji-runtime/src/module_registry.rs` |
| An error message, code, or suggestion | `crates/suji-diagnostics/src/` |

Errors stay in the crate that raises them: `LexError` in `suji-lexer`,
`ParseError` in `suji-parser` (wrapping `LexError`), and `RuntimeError` in
`suji-values` (wrapping `ParseError`). This is what keeps the dependency chain
acyclic, so resist the urge to move an error type "somewhere central".

Value methods are generic over the `Executor` trait rather than tied to the
interpreter directly. If you add a method that needs to call back into user
code — anything taking a closure, like `filter` — keep it generic.

## What a Change Ships With

A language change is not finished until all four of these exist in the same
change:

1. **A spec file** in `spec/`, following the conventions in [Spec Tests](testing/spec-tests.md).
2. **A Rust test** in the matching suite under `tests/`, described in [Writing Tests](testing/writing-tests.md).
3. **Documentation**: The affected chapters of this book.
4. **Green checks**: `make lint` and `make test`.

Bug fixes follow the same rule — a fix without a spec file that would have
caught the bug will regress.

## Editing This Book

The book is an mdBook project in `book/`, with its own `Makefile`:

```bash
cd book
make build     # build the Suji-aware highlighter, then the HTML into book/
make serve     # local server with live reload
make verify    # run every example, then check links, anchors and tables
make test      # check the highlight definition and that the build is complete
```

**Every ` ```suji ` block must be a complete program that runs on its own**, and
every `# …` comment claiming an output must match what the interpreter actually
prints. `make verify` enforces the first half by executing each block; it finds
the binary at `target/release/suji` or from `$SUJI`. A block whose whole purpose
is to demonstrate an error is exempted by putting a marker on the line above the
opening fence:

```text
<!-- verify: skip -->
```

Prefer not to use the marker. A block that shows a failure can usually keep the
offending line commented out and describe the error in prose, which keeps the
example runnable. Examples needing an input file should create it with
`` p = `mktemp` `` rather than referring to a path that only exists on your
machine, and examples using `std:random` should call `random:seed(n)` so their
output is stable.

Syntax highlighting comes from `highlight/suji.js`, bundled by
`npm run build-highlight` into `theme/highlight.js`, which mdBook picks up as a
theme override. `npm run test-highlight` asserts the token classes for the
constructs that are easy to get wrong — pipelines, `match` alternatives,
division versus regex, and interpolation in all four string forms.

## Coding Standards

- Prefer clarity over cleverness; explicit control flow beats a dense
  expression.
- Functions are verbs, variables are descriptive nouns, and abbreviations are
  avoided.
- Use guard clauses and early returns instead of deep nesting.
- Use structured errors via `thiserror`, with actionable messages and precise
  spans from the diagnostics helpers.
- Comments explain **why**, not **how**, and sit above the code they describe.
- Match the surrounding formatting. Do not reformat unrelated code.
- Keep hot paths — the lexer and parser inner loops, runtime tight loops —
  allocation-lean. Non-trivial optimisations should come with a measurement.
- No `unsafe` unless it is genuinely necessary and reviewed.

## Workflow Guardrails

- Keep changes small and cohesive. Do not mix a cross-cutting refactor into a
  feature change.
- Search for existing helpers and tests in the area before adding new ones, and
  read the related material under `docs/`.
- Do not change public-facing behaviour without a test that demonstrates the
  change, and call the change out explicitly.
- Justify any new dependency.
- If a change spans lexer, parser, and runtime, split it into reviewable steps
  where you can.
- Record the rationale for a restructuring alongside the other design notes in
  `internal_docs/`, and stage larger deliveries through a per-version
  implementation plan document, as every release so far has done.

## See Also

- [Testing](testing.md)
- [Spec Tests](testing/spec-tests.md)
- [Writing Tests](testing/writing-tests.md)
- [Language Design](design.md)
- [Roadmap](roadmap.md)
- [Resources](../appendices/resources.md)
