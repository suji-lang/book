# Writing Tests

Practical guidance for the Rust side of the test suite.

## Where Tests Live

All Rust tests sit under `tests/` in the `suji-tests` package. Four top-level
files declare the suites, and each pulls in a directory of modules:

| Entry point | Directory | Purpose |
|---|---|---|
| `tests/components.rs` | `tests/components/` | One component at a time |
| `tests/integration.rs` | `tests/integration/` | Whole programs through the interpreter |
| `tests/spec.rs` | `tests/spec/` | Rust counterparts to the spec areas |
| `tests/stdlib.rs` | `tests/stdlib/` | One file per standard library module |

Modules are wired in explicitly with `#[path = "..."]` declarations, so a new
file must be added to its `mod.rs` (or to the suite entry point) before it will
run.

```bash
cargo test --workspace
cargo test --package suji-tests --test integration --test components --test stdlib --test spec
make rust_tests
```

Crate-internal unit tests stay in the crate they belong to, in a
`#[cfg(test)] mod tests` block next to the code — `error_codes.rs`, for example,
carries its own uniqueness and range checks.

## Unit or Integration?

| Put it in `tests/components/` when | Put it in `tests/integration/` when |
|---|---|
| You are asserting on a token stream | You are asserting on a program's value |
| You are asserting on AST shape | Several components must cooperate |
| You are calling a method dispatcher directly | The behaviour crosses lexer, parser, and interpreter |
| You are checking a specific `RuntimeError` variant | You want the closest thing to a real program |

If a test would read naturally as a `.si` program, it probably belongs in
`spec/` instead — see [Spec Tests](spec-tests.md).

## Shared Helpers

`tests/common/mod.rs` provides the plumbing so individual tests stay short:

| Helper | Use |
|---|---|
| `parse_expression(src)` | Parse one expression |
| `parse_statement(src)` | Parse one statement |
| `parse_program(src)` | Parse a whole program |
| `create_test_env()` | An `Env` with globals installed |
| `eval_string_expr(src)` | Evaluate a single expression to a `Value` |
| `eval_program(src)` | Evaluate a program, returning the last value |
| `eval_program_with_modules(src)` | As above, with the module registry wired up |
| `can_eval(src)` / `can_eval_program(src)` | Boolean success check |
| `assert_parse_fails(src, fragment)` | Assert a parse error containing a fragment |
| `assert_eval_fails(src, fragment)` | Assert a runtime error containing a fragment |

Reach for these before writing your own setup. `assert_parse_fails` also accepts
several acceptable fragments separated by `||`, which is useful while an error
message is in transition.

## Testing the Lexer

Lex a small input and compare the token vector, remembering the trailing
`Token::Eof`:

```rust
#[test]
fn test_keywords() {
    let input = "return loop as through with continue break match import export true false nil";
    let tokens = Lexer::lex(input).unwrap();

    let expected = vec![
        Token::Return,
        Token::Loop,
        // ...
        Token::Eof,
    ];

    let actual: Vec<Token> = tokens.into_iter().map(|t| t.token).collect();
    assert_eq!(actual, expected);
}
```

Group new cases into the existing files by construct: `strings.rs`, `regex.rs`,
`shell.rs`, `comments.rs`, `operators.rs`, `ranges.rs`, `unicode.rs`,
`basics.rs`. Regex-versus-division disambiguation belongs in `regex.rs`, and it
is worth testing both the regex and the division reading of the same character.

## Testing the Parser

Assert on the AST shape rather than on a rendered string, so the test survives
formatting changes:

```rust
let expr = parse_expression("2 + 3 * 4").unwrap();
assert!(matches!(expr, Expr::Binary { .. }));
```

Precedence and associativity cases go in `tests/components/parser/precedence.rs`.
The most valuable parser tests are the negative ones — confirming that an
invalid program is *rejected*, and with a comprehensible message:

```rust
assert_parse_fails(
    "match x { 1 => \"one\", _ => \"other\" }",
    "Unexpected token",
);
```

## Testing Runtime Behaviour

Evaluate a program and compare the resulting `Value`:

```rust
let value = eval_program("xs = [1, 2, 3]\nxs::sum()").unwrap();
assert_eq!(value, Value::Number(DecimalNumber::from_i64(6)));
```

Method dispatch can also be exercised directly through `call_method`, which is
how `tests/components/values/methods.rs` covers the dispatcher without going
through the parser:

```rust
let s = Value::String("hello".to_string());
let result = call_method(None, ValueRef::Immutable(&s), "length", vec![]).unwrap();
assert_eq!(result, Value::Number(DecimalNumber::from_i64(5)));
```

## Asserting on Errors

Match on the `RuntimeError` variant rather than on its rendered text. Messages
get reworded; variants do not:

```rust
assert!(matches!(
    result,
    Err(RuntimeError::MethodError { .. })
));
```

When the message itself is the thing under test, use `assert_eval_fails` with
the smallest distinctive fragment.

Errors carry spans, and `error.span()` returns the source range. If your change
touches where an error is raised, assert that the span still covers the right
text — that is what makes the framed diagnostic point at the correct expression:

```rust
let span = error.span().expect("error should have a span");
assert!(source[span.start..span.end].contains('x'));
```

## Testing the Standard Library

One file per module, named after it: `std_path.rs`, `std_time.rs`,
`std_crypto.rs`. Test through Suji source with `eval_program_with_modules` so
that the import path is exercised too, and keep assertions deterministic —
assert on the shape or length of a UUID or a timestamp rather than on its value.

## Add a Spec File Too

Almost every Rust test for user-visible behaviour should be accompanied by a
`.si` file in `spec/`. The Rust test proves the mechanism; the spec file proves
the behaviour, in the language itself, in a form that any contributor can read.
Getting into that habit is the single most useful thing you can do for the
suite. See [Spec Tests](spec-tests.md).

## Before You Push

```bash
make lint
make test
```

## See Also

- [Testing](../testing.md)
- [Spec Tests](spec-tests.md)
- [Contributing](../contributing.md)
- [Error Codes](../../appendices/error-codes.md)
