# Testing

Suji is tested at three layers, each answering a different question.

## The Three Layers

| Layer | Location | Question it answers | Runner |
|---|---|---|---|
| Rust tests | `tests/` | Does this component behave correctly in isolation? | `make rust_tests` |
| Spec programs | `spec/` | Does the language produce this exact output? | `make verify_spec` |
| Examples | `examples/` | Does a realistic program still run end to end? | `make verify_examples` |

`make test` runs all three in that order.

## Rust Tests

The Rust suites live under `tests/` and are grouped by what they exercise:

| Suite | Covers |
|---|---|
| `tests/components/` | Single components: `lexer/`, `parser/`, `ast/`, `runtime/`, `values/` |
| `tests/integration/` | Whole programs through the interpreter: arithmetic, functions, maps, match, methods, modules, pipes, ranges, strings, shell templates, indexing, JSON |
| `tests/spec/` | Rust-side counterparts of the spec areas, such as `spec_methods.rs` and `spec_strings_regex.rs` |
| `tests/stdlib/` | One file per standard library module, such as `std_path.rs` and `std_time.rs` |

These are the right place for anything a `.si` program cannot observe: token
streams, AST shapes, specific `RuntimeError` variants, and error spans.

```bash
make rust_tests
cargo test --workspace
cargo test --package suji-tests --test integration
```

## Spec Programs

`spec/` holds 650 single-assertion `.si` programs. Each one prints exactly one
value, and the expected output is a trailing comment on that final line:

```suji
import std:println

inc = |x| x + 1
result = 3 |> inc

println(result)  # 4
```

`scripts/verify_spec.sh` runs each file from inside `spec/`, takes the last line
of stdout, and compares it to the text after the `#` on the file's last line.
The conventions are strict and easy to get wrong — see [Spec Tests](testing/spec-tests.md).

Spec files are the executable definition of the language. When you want to know
whether a behaviour is intentional, `spec/` is the authority.

## Examples

`examples/` holds complete programs that demonstrate the language rather than
assert on it. `scripts/verify_examples.sh` runs each one and checks only that it
exits successfully, so an example is a smoke test against regressions that a
narrow spec file would miss.

```bash
make verify_examples
```

Examples must remain deterministic and must not depend on network access or on
files outside the repository.

## Which Layer to Use

| Change | Add |
|---|---|
| New syntax or new semantics | A spec file **and** a parser or interpreter test |
| A new value method | A spec file **and** a `tests/components/values/methods.rs` case |
| A new stdlib function | A spec file **and** a case in the module's `tests/stdlib/` file |
| A lexer or parser fix | A `tests/components/` test asserting on tokens or AST, plus a spec file if the behaviour is user-visible |
| A new error or error message | A `tests/components/runtime/errors.rs` case asserting the variant |
| A bug fix | A spec file that fails before the fix |
| A new end-to-end capability | An example, in addition to the above |

The rule of thumb: **a spec file proves the behaviour, a Rust test proves the
mechanism.** Most language changes need both.

## See Also

- [Spec Tests](testing/spec-tests.md)
- [Writing Tests](testing/writing-tests.md)
- [Contributing](contributing.md)
- [Roadmap](roadmap.md)
