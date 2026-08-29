# Error Handling Deep Dive

Suji has **no error handling construct**. There is no `try`, `catch`, `throw` or `rescue`; there are no `Result` or `Option` types, no error values, and no way to trap or recover from a runtime error. Almost every runtime failure prints a diagnostic to stderr and **terminates the process with exit status 1**. The two exceptions are numeric overflow and stack overflow, which abort even more abruptly, with a Rust panic message and exit status 101 or 134 instead of a diagnostic.

That single fact shapes every technique on this page. Since you cannot recover after a failure, all the work happens *before* it: you validate, you check, and you design your own functions so that a "soft" failure is an ordinary value your caller can branch on.

## What a failure looks like

A failing program stops at the point of the error. Nothing after it runs:

```suji
import std:println

println("this line runs")
```

If the next line were `println(10 / 0)`, the program would print the first line and then die with:

```text
[402] Error: Invalid operation
   ╭─[ script.si:4:9 ]
   │
 4 │ println(10 / 0)
   │         ───┬──
   │            ╰──── Division by zero
   │
   │ Note: The SUJI language is strongly typed. Check that you're using compatible types
───╯
Error: Invalid operation: Division by zero
```

The `[402]` is the numeric error code (see [Error taxonomy](#error-taxonomy) below). The shell sees exit status 1, which is what makes Suji scripts safe to use in a `set -e` pipeline: they fail loudly rather than silently.

## Validate before you act

The whole discipline is: never perform an operation whose preconditions you have not checked.

### Missing map keys

Reading an absent key raises `Key not found`. Use `::contains(key)` to test and `::get(key, default)` to read safely:

```suji
import std:println

config = { host: "localhost" }

# Safe read with a fallback
println(config::get("port", 5432))        # 5432

# Explicit branch on presence
port = match config::contains("port") {
    true => config:port,
    false => 5432,
}
println(port)                             # 5432
```

`config:port` on its own would abort the script.

### Division by zero

There is no `NaN` and no `Infinity` — `1 / 0` is a fatal error. Check the divisor:

```suji
import std:println

divide = |a, b| match {
    b == 0 => nil,
    _ => a / b,
}

println(divide(10, 4))    # 2.50
println(divide(10, 0))    # nil
```

### List indices

An out-of-range index raises `Index out of bounds`. Compare against `length()` first:

```suji
import std:println

at = |xs, i| match {
    i < 0 => nil,
    i < xs::length() => xs[i],
    _ => nil,
}

xs = [10, 20]
println(at(xs, 1))    # 20
println(at(xs, 5))    # nil
```

For the common cases, lists already have safe accessors: `xs::first(default)` and `xs::last(default)` never fail.

```suji
import std:println

println([]::first("none"))    # none
println([1, 2]::last(0))      # 2
```

### Strings that must be numbers

`"abc"::to_number()` is fatal. Validate with a regex first:

```suji
import std:println

parse_port = |text| {
    !(text ~ /^[0-9]+$/) && return nil
    text::to_number()
}

println(parse_port("8080"))    # 8080
println(parse_port("80x"))     # nil
```

### Files

`io:open(path)` fails if the file does not exist. Either create it (`io:open(path, true)`) or check first with `os:stat`, which is itself only safe on a path you know exists — in practice, ask the shell:

```suji
import std:println

path = `mktemp`
exists = `test -f ${path} && echo yes || echo no`

println(match exists {
    "yes" => "found",
    _ => "missing",
})    # found
```

## Returning `nil` for soft failures

The simplest convention: a function that can fail returns `nil`, and the caller matches on it. This works because `nil` is a first-class value and `nil` is a valid match pattern.

```suji
import std:println

lookup = |users, name| match users::contains(name) {
    true => users::get(name),
    false => nil,
}

users = { alice: 30 }

report = |name| {
    age = lookup(users, name)
    return match age {
        nil => "${name}: unknown",
        _ => "${name}: ${age}",
    }
}

println(report("alice"))    # alice: 30
println(report("bob"))      # bob: unknown
```

Note that there is no `||` idiom for defaults: `nil || "default"` is a **type error**, because `&&` and `||` require boolean operands. Use `match` or `::get(key, default)`.

## The `(ok, value)` tuple convention

When `nil` is itself a legitimate result, return a two-element tuple and destructure it at the call site:

```suji
import std:println

safe_divide = |a, b| {
    b == 0 && return (false, nil)
    return (true, a / b)
}

ok, value = safe_divide(10, 4)
println(match ok {
    true => "result ${value}",
    false => "undefined",
})    # result 2.50

ok2, value2 = safe_divide(1, 0)
println(match ok2 {
    true => "result ${value2}",
    false => "undefined",
})    # undefined
```

Two things to watch:

- Write `return (true, a / b)` explicitly. A line that *begins* with `(` is parsed as a call applied to the previous expression, so a bare `(true, a / b)` on its own line after another statement is a bug.
- Tuples are not indexable. Destructure with `ok, value = f()` or use `t::to_list()`.

## Guard clauses

`&&` and `||` short-circuit, and `return`, `break` and `continue` are usable on their right-hand side. That gives you compact preconditions at the top of a function:

```suji
import std:println

validate_user = |user| {
    user == nil && return "user is required"
    !user::contains("email") && return "email is required"
    !(user:email ~ /^[^@]+@[^@]+$/) && return "invalid email"
    return "ok"
}

println(validate_user(nil))                          # user is required
println(validate_user({ "name": "Alice" }))          # email is required
println(validate_user({ "email": "not-an-email" }))  # invalid email
println(validate_user({ "email": "a@b.com" }))       # ok
```

## Shell commands abort your script

This deserves its own warning, because it is the failure mode that surprises people most.

**A backtick command that exits non-zero is a fatal runtime error.** There is no way to read the exit status, and no way to recover:

```text
[406] Error: Shell command failed
   ╭─[ script.si:2:9 ]
   │
 2 │ println(`false`)
   │         ┬
   │         ╰── Shell command 'false' failed with exit code 1:
───╯
Error: Shell command failed: Shell command 'false' failed with exit code 1:
```

Since the command runs through a shell, do the recovery *in the shell*, and turn the outcome into a string you can match on.

### Force success with `|| true`

```suji
import std:println

out = `grep nonexistent-pattern /etc/hosts || true`
println("[" + out + "]")    # []
```

`grep` exits 1 when it finds nothing; `|| true` makes the whole command succeed and yields an empty string.

### Turn a status into a value with `&&` / `||`

```suji
import std:println

path = `mktemp`
status = `test -s ${path} && echo nonempty || echo empty`

println(match status {
    "nonempty" => "file has content",
    "empty" => "file is empty",
    _ => "unknown",
})    # file is empty
```

### Capture stderr if you need it

Only stdout is captured. Redirect if the message matters:

```suji
import std:println

out = `ls /definitely/not/here 2>&1 || true`
println(out::length() > 0)    # true
```

## Error taxonomy

Diagnostics are printed as `[code] Error: Title`. The code ranges reflect the phase that failed:

| Range | Phase | Examples |
|---|---|---|
| `1xx` | Lexing | 101 unterminated string, 104 invalid escape, 105 invalid number |
| `2xx` | Parsing | 201 unexpected token, 202 unexpected EOF, 205 expected token |
| `4xx` | Runtime | 400 type error, 401 undefined variable, 402 invalid operation, 404 key not found, 406 shell error, 408 arity mismatch |

Lexer and parser codes mean the file never ran at all — those are typos, and no amount of defensive coding helps. Runtime codes (`4xx`) are the ones the techniques on this page are designed to prevent. The most common are:

- **400 type error** — mixing types, e.g. `"a" + 1` or `nil || "x"`
- **401 undefined variable** — a name used before assignment, or a missing `import`
- **402 invalid operation** — including division by zero
- **403 index out of bounds** / **412 string index error** — check `length()` first
- **404 key not found** — use `::get()` or `::contains()`
- **406 shell error** — a non-zero exit status from a backtick command
- **408 arity mismatch** — calling `|a, b|` with the wrong number of arguments

The complete list, with every code and its meaning, is in [Error Codes](../appendices/error-codes.md).

## Common Patterns

**Chain of validations, one exit point:**

```suji
import std:println

check = |record| {
    !record::contains("name") && return (false, "missing name")
    !record::contains("age") && return (false, "missing age")
    !record:age::is_number() && return (false, "age must be a number")
    record:age < 0 && return (false, "age must not be negative")
    return (true, record:name)
}

ok, detail = check({ "name": "Ada", "age": 36 })
println("${ok} ${detail}")    # true Ada

ok2, detail2 = check({ "name": "Ada", "age": "old" })
println("${ok2} ${detail2}")    # false age must be a number
```

**Collect failures instead of stopping at the first:**

```suji
import std:println

rows = ["1", "two", "3", ""]
good = []
bad = []

loop through rows with row {
    match { row ~ /^[0-9]+$/ => { good::push(row::to_number()) } _ => { bad::push(row) } }
}

println(good::sum())        # 4
println(bad::length())      # 2
```

**Fail fast on purpose:** when the input really is invalid and there is nothing sensible to do, let the error happen, or call `os:exit(1)` with your own message on stderr.

```suji
import std:println
import std:io

report_and_stop = |message| {
    println("fatal: ${message}", io:stderr)
    # os:exit(1) would end the script here
}

report_and_stop("configuration missing")
println("only reached because exit is commented out")
```

## See Also

- [Error Codes](../appendices/error-codes.md) — the complete numeric code list
- [Match Expressions](../fundamentals/control-flow/match.md) — the branching construct used throughout this page
- [Guards](../fundamentals/control-flow/guards.md) — `&&` / `||` with `return`, `break` and `continue`
- [Maps](../fundamentals/data-types/maps.md) — `::get()` and `::contains()`
- [Shell Integration](shell-integration.md) — running commands safely
