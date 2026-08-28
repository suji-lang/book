# Error Codes

Every diagnostic Suji prints carries a numeric code. This page lists all of them.

## How Errors Behave

Suji has no error-handling construct: no `try`/`catch`, no `throw`, no `Result`
or `Option` type, no `defer`. **Any diagnosed error terminates the script
immediately with exit status 1**, and there is no way to trap it from Suji code.
The only strategy is to check before you act — see
[Error Handling Deep Dive](../advanced/error-handling.md).

Two failures escape this taxonomy because they abort the process before a
diagnostic can be produced. Neither carries a code, and neither can be caught:

| Failure | What you see | Exit status |
|---|---|---|
| Numeric overflow, including `10 ^ 16` | `thread 'main' panicked … Multiplication overflowed` | 101 |
| Recursion deeper than a few hundred frames | `thread 'main' has overflowed its stack` | 134 |

## Code Ranges

| Range | Phase | Meaning |
|---|---|---|
| `1xx` | Lexing | The source could not be turned into tokens |
| `2xx` | Parsing | The tokens do not form a valid program |
| `4xx` | Runtime | The program started and then failed while running |

A `1xx` or `2xx` error means nothing ran at all. A `4xx` error means everything
before the failing line already executed, including its side effects.

## Diagnostic Format

The interpreter prints a framed diagnostic to stderr, followed by a one-line
summary. The code appears in brackets before the title:

```text
[403] Error: Index out of bounds
   ╭─[ e1.si:4:9 ]
   │
 4 │ println(xs[5])
   │         ──┬──
   │           ╰──── Index 5 out of bounds for length 2
   │
   │ Note 1: Use list::length() to check the size before indexing
   │
   │ Note 2: Check array/map bounds and key existence
   │
   │ Note 3: Use length() methods to verify bounds before access
───╯
Error: Index out of bounds: Index 5 out of bounds for length 2
```

Reading it: `403` is the code, `Index out of bounds` is the title,
`e1.si:4:9` is the file, line and column, the underline marks the offending
expression, and the notes are generic suggestions for that error category.

## Lexer Errors (1xx)

| Code | Title | Usual cause and fix |
|---|---|---|
| 101 | Unterminated string literal | A quote was never closed. Check for a stray `"` or `'`, and remember that `"""` must be closed by `"""` |
| 102 | Unterminated shell command | A backtick template was never closed. Escape literal backticks inside strings as `` \` `` |
| 103 | Unterminated regex literal | A `/pattern/` is missing its closing slash. Escape a literal slash inside the pattern as `\/` |
| 104 | Invalid escape sequence | Only `\n \t \r \" \' \` \\ \$` exist. `\u0041`, `\0` and `\e` are not supported; write the character directly |
| 105 | Invalid number literal | Numbers are decimal digits with at most one `.`. Hex, octal, binary, digit separators and exponents do not exist |
| 106 | Unexpected character | A character that is not part of any token, often a smart quote pasted from a document, or `@`/`?` |

## Parser Errors (2xx)

| Code | Title | Usual cause and fix |
|---|---|---|
| 201 | Unexpected token | Something is in a position the grammar does not allow. The classic case is a missing comma after a bare-expression `match` arm |
| 202 | Unexpected end of input | A brace, bracket or parenthesis was never closed |
| 203 | Parse error | A general parse failure that does not fit a more specific code |
| 204 | Multiple export statements found | A file may contain at most one `export`. Merge the values into a single map |
| 205 | Expected token | A specific token was required and something else appeared, for example a missing `=>` in a match arm |
| 206 | Expected item name after `:` | An import path ends in a colon, as in `import std:` |
| 207 | Expected alias name after `as` | `import std:println as` has no name after `as`. Note that aliasing a single-segment local import is also rejected |

## Runtime Errors (4xx)

### Types and Operations

| Code | Title | Usual cause and fix |
|---|---|---|
| 400 | Type error | Mixed types in an operation. `"a" + 1`, `nil \|\| "x"`, indexing a tuple, comparing a number with a string using `<` |
| 402 | Invalid operation | The operation is not defined for these values at all, such as an unsupported unary application |
| 410 | Invalid number conversion | `"abc"::to_number()` on text that is not numeric. Validate with a regex before converting |

### Names and Access

| Code | Title | Usual cause and fix |
|---|---|---|
| 401 | Undefined variable | A typo, a missing `import`, or a keyword from another language such as `if` being read as an identifier |
| 403 | Index out of bounds | A list index outside `0 .. length-1` (or the negative equivalent). Check `xs::length()` first |
| 404 | Key not found | `m:key` or `m[k]` on an absent key. Use `m::get(k, default)` or `m::contains(k)` |
| 405 | Invalid key type | Map keys must be numbers, booleans, strings or tuples. Lists and maps cannot be keys |
| 412 | String index error | A character index outside the string. Check `s::length()` first |
| 413 | Range error | Range bounds must be integers, and very large ranges allocate a full list |

### Calls and Control Flow

| Code | Title | Usual cause and fix |
|---|---|---|
| 408 | Arity mismatch | Wrong number of arguments. Give the parameter a default value if it should be optional |
| 409 | Method error | The method does not exist for that type. Check the spelling and the type's method list |
| 411 | Internal control flow error | A `break`, `continue` or `return` escaped its construct. Usually indicates a bug worth reporting |
| 416 | Conditional match error | An arm of a `match { … }` did not evaluate to a boolean |
| 426 | Map method error | A map method was called with the wrong arguments, for example `m::get()` with no key |

### Collections and Destructuring

| Code | Title | Usual cause and fix |
|---|---|---|
| 414 | List concatenation error | `+` was used between a list and a non-list. Use `xs::push(v)` to add one item |
| 415 | Map contains error | `m::contains(k)` was called with a key of an unusable type |
| 434 | Destructuring type error | `a, b = value` where the right side is not a tuple |
| 435 | Destructuring arity mismatch | The number of targets does not match the tuple size. Use `_` to discard a position |
| 436 | Invalid destructuring target | A destructuring target is not assignable |

### Pipes

| Code | Title | Usual cause and fix |
|---|---|---|
| 429 | Pipe stage type error | A `\|` stage is neither a closure call nor a shell template |
| 430 | Empty pipe expression | A `\|` has nothing on one side |
| 431 | Pipe execution error | A stage of a `\|` pipeline failed while running |
| 432 | Pipe apply type error | `\|>` has a non-function on the right |
| 433 | Pipe apply type error | `<\|` has a non-function on the left |

### System, Streams and Regex

| Code | Title | Usual cause and fix |
|---|---|---|
| 406 | Shell command failed | A backtick command exited non-zero. Neutralise it with `` `cmd \|\| true` `` or make the command print a value you can match on |
| 407 | Regex error | The pattern could not be compiled, or `~` was applied to something other than `string ~ regex` |
| 427 | Stream error | A read or write on a closed, missing or unreadable stream |

### Data Formats

| Code | Title | Usual cause and fix |
|---|---|---|
| 417 | JSON parse error | Malformed JSON text |
| 418 | JSON generation error | The value contains something JSON cannot hold, such as a function or a regex |
| 419 | YAML parse error | Malformed YAML text, usually indentation |
| 420 | YAML generation error | The value contains something YAML cannot hold |
| 421 | TOML parse error | Malformed TOML text |
| 422 | TOML generation error | TOML has no nil, and functions and regex cannot be written |
| 423 | TOML conversion error | A TOML key was not a string, or a nil appeared in the value |
| 424 | CSV parse error | Unclosed quotes or an unusable delimiter |
| 425 | CSV generation error | `csv:generate` expects a list of lists of strings; convert numbers first |
| 428 | Serialization error | A value that cannot be serialised at all, such as a stream, reached a format writer |

## Checking Before You Act

Because nothing can be caught, the defensive patterns below are the whole
error-handling story.

```suji
import std:println

safe_divide = |a, b| {
    match {
        b == 0 => nil,
        _ => a / b,
    }
}

config = {host: "localhost"}
xs = [1, 2, 3]

println(safe_divide(10, 0))            # nil
println(safe_divide(10, 4))            # 2.50
println(config::get("port", 8080))     # 8080
println(config::contains("host"))      # true
println(xs::length() > 0)              # true
println(xs::first(0))                  # 1
```

For a shell command that may fail, make failure produce a value instead of an
error:

```suji
import std:println

status = `test -f /definitely/not/here && echo found || echo missing`

println(status)  # missing
```

## See Also

- [Error Handling Deep Dive](../advanced/error-handling.md)
- [Syntax Reference](syntax-reference.md)
- [Type Checking Methods](../advanced/type-checking.md)
- [Shell Integration Best Practices](../advanced/shell-integration.md)
