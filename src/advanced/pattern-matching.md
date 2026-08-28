# Pattern Matching Deep Dive

Advanced patterns and best practices for `match` expressions.

Suji's `match` is deliberately small. Patterns are *literal shapes*, not a destructuring mini-language: there are no binding patterns, no list or map patterns, no ranges and no `if` guards. Almost everything people reach for those features to do is instead done with the **conditional form** `match { … }`, or with plain destructuring assignment before the match. This page covers what patterns really are, the two traps that catch everyone, and the idioms that replace the features Suji does not have.

## What a Pattern Can Be

A pattern in the subject form `match value { … }` is one of:

| Pattern | Example | Matches |
|---|---|---|
| Number literal | `200`, `-1`, `3.5` | that exact number |
| String literal | `"admin"` | that exact string |
| Boolean literal | `true`, `false` | that boolean |
| `nil` | `nil` | `nil` |
| Regex literal | `/^[0-9]+$/` | a string matching the regex |
| Tuple pattern | `(0, 0)`, `("GET", _)` | a tuple whose elements match |
| Alternatives | `200 \| 201 \| 204` | any one of the alternatives |
| Wildcard | `_` | anything |

That is the complete list.

## What a Pattern Cannot Be

None of the following exist in Suji, and most of them fail *silently* rather than loudly:

- **Binding patterns.** `n => n * 2` does not bind `n`.
- **List patterns.** `[a, b] => …` is a parse error.
- **Map patterns.** `{role: "admin"} => …` is a parse error.
- **Range patterns.** `1..10 => …` does not match a range of values.
- **Guards.** There is no `pattern if condition =>` form.
- **Interpolated strings.** `"${prefix}-x" => …` is a parse error.
- **Variables.** A name in pattern position is not read as a variable.

### The bare-identifier trap

**A bare identifier in a pattern is a string literal.** This is the single most common misunderstanding, because it produces no error at all — just a silent `nil`:

```suji
import std:println

# Looks like a binding pattern. Is not.
println(match 5 { n => n * 2, })    # nil

# It is really a string literal, so it matches the string "n":
println(match "n" { n => "matched the string n", _ => "no match", })    # matched the string n
```

The same applies to variables holding regexes: `pattern = /^h/` followed by `match text { pattern => … }` compares against the *string* `"pattern"`, never the regex.

### The comma rule

An arm whose body is a bare expression **must** be followed by a comma, **including the final arm**. An arm whose body is a `{ … }` block may omit it.

```suji
import std:println

# Correct: trailing comma on every expression arm
println(match 1 { 1 => "one", _ => "other", })

# Correct: block bodies need no commas
println(match 2 { 1 => { "one" } _ => { "other" } })
```

Writing `match x { 1 => "one", _ => "other" }` without the final comma is a parse error.

## The Two Forms

### Subject form

Compares patterns against a value:

```suji
import std:println

status_code = 200

println(match status_code {
    200 => "OK",
    404 => "Not Found",
    500 => "Server Error",
    _ => "Unknown",
})    # OK
```

### Conditional form

No subject; each arm is a boolean expression, evaluated top to bottom. This is where every "guard" goes:

```suji
import std:println

classify = |value| match {
    value < 0 => "Negative",
    value == 0 => "Zero",
    value < 10 => "Small positive",
    _ => "Large positive",
}

println(classify(-3))    # Negative
println(classify(0))     # Zero
println(classify(7))     # Small positive
println(classify(99))    # Large positive
```

The conditional form is strictly more powerful than pattern guards would be: any expression that evaluates to a boolean is allowed, including method calls, regex tests and type predicates. The only rule is that the arm conditions must be **booleans** — there is no truthiness in Suji, so `match { name => … }` is a type error.

### A match with no matching arm is `nil`

Non-exhaustive matches are not an error; they evaluate to `nil`:

```suji
import std:println

println(match 42 { 1 => "one", })    # nil
```

Always add a `_` arm unless `nil` is the answer you want.

## Tuple Patterns

Tuple patterns are the one structural pattern Suji has. Elements are themselves patterns, so literals and `_` both work:

```suji
import std:println

describe = |point| match point {
    (0, 0) => "Origin",
    (0, _) => "On the Y axis",
    (_, 0) => "On the X axis",
    _ => "Somewhere else",
}

println(describe((0, 0)))    # Origin
println(describe((0, 7)))    # On the Y axis
println(describe((3, 0)))    # On the X axis
println(describe((3, 4)))    # Somewhere else
```

Note that `(x, 0)` would **not** bind `x` — it would require the first element to be the string `"x"`.

## Getting Values Out: Destructure First, Match Second

Since patterns cannot bind, the way to work with the parts of a value is to destructure it *before* the match, with an ordinary assignment, and then use the conditional form:

```suji
import std:println

describe = |point| {
    x, y = point
    return match {
        x == 0 && y == 0 => "Origin",
        x == 0 => "On the Y axis at ${y}",
        y == 0 => "On the X axis at ${x}",
        _ => "Point at (${x}, ${y})",
    }
}

println(describe((0, 7)))    # On the Y axis at 7
println(describe((3, 4)))    # Point at (3, 4)
```

The same technique replaces list and map patterns. Pull the pieces out with indexing or key access, then branch:

```suji
import std:println

user = { "role": "admin", "active": true }

role = user::get("role", "guest")
active = user::get("active", false)

println(match {
    role == "admin" && active => "Active admin",
    role == "admin" => "Inactive admin",
    role == "user" && active => "Active user",
    _ => "Unknown user type",
})    # Active admin
```

## Regex Patterns

Regex literals are real patterns and are tested against the subject string:

```suji
import std:println

classify = |input| match input {
    /^[0-9]+$/ => "Digits only",
    /^[a-zA-Z]+$/ => "Letters only",
    /^[a-zA-Z0-9]+$/ => "Alphanumeric",
    _ => "Mixed characters",
}

println(classify("12345"))    # Digits only
println(classify("hello"))    # Letters only
println(classify("abc123"))   # Alphanumeric
println(classify("a b!"))     # Mixed characters
```

Order matters: `/^[a-zA-Z0-9]+$/` would also match `"12345"`, so the narrower patterns come first.

### No capture groups

Suji's regex support is **match-only**. There are no capture groups, no `::match()`, no `::captures()` and no regex-based `replace` or `split`. To extract the interesting part of a string, match to classify it and then use string methods to slice it:

```suji
import std:println

log_lines = ["ERROR: disk full", "WARN: low memory", "hello"]

loop through log_lines with line {
    message = match line {
        /^ERROR: / => "error -> " + line[7;],
        /^WARN: / => "warn -> " + line[6;],
        _ => "unrecognised",
    }
    println(message)
}
# error -> disk full
# warn -> low memory
# unrecognised
```

Note `line[7;]` — string and list slices use `;`, not `:`.

## Pattern Alternation

`|` matches any one of several patterns and works with every pattern kind:

```suji
import std:println

label = |status| match status {
    200 | 201 | 202 => "Success",
    400 | 401 | 403 => "Client error",
    500 | 502 | 503 => "Server error",
    _ => "Other",
}

println(label(201))    # Success
println(label(403))    # Client error
println(label(302))    # Other
```

For a *range* of values, which alternation cannot express, use the conditional form:

```suji
import std:println

label = |status| match {
    status >= 200 && status < 300 => "Success",
    status >= 400 && status < 500 => "Client error",
    status >= 500 => "Server error",
    _ => "Other",
}

println(label(204))    # Success
println(label(451))    # Client error
```

## Ordering

Arms are tried top to bottom and the first match wins, so specific patterns must come before general ones:

```suji
import std:println

# Good: specific first
good = |value| match {
    value == 0 => "Zero",
    value < 10 => "Small",
    value < 100 => "Medium",
    _ => "Large",
}

# Bad: the general arm swallows the specific one
bad = |value| match {
    value < 100 => "Less than 100",
    value == 0 => "Zero",
    _ => "Other",
}

println(good(0))    # Zero
println(bad(0))     # Less than 100
```

## Complete Example: A Request Router

This is the shape a router actually takes in Suji: exact routes as tuple patterns, everything variable extracted with string methods, and the conditional form for prefix matching.

```suji
import std:println

get_user = |id| "user ${id}"

route = |method, path| {
    exact = match (method, path) {
        ("GET", "/") => "home page",
        ("GET", "/health") => "ok",
        ("POST", "/users") => "created",
        _ => nil,
    }
    exact != nil && return exact

    parts = path::split("/")
    is_user_path = method == "GET" && parts::length() == 3 && parts[1] == "users"
    return match {
        is_user_path && parts[2] ~ /^[0-9]+$/ => get_user(parts[2]),
        _ => "404 not found",
    }
}

println(route("GET", "/"))          # home page
println(route("POST", "/users"))    # created
println(route("GET", "/users/42"))  # user 42
println(route("GET", "/nope"))      # 404 not found
```

## Map Literals as Arm Bodies

A map literal with bare identifier keys is ambiguous with a block, so as a match arm body it is parsed as a block and fails. Quote the keys or wrap the literal in parentheses:

```suji
import std:println

response = match 200 {
    200 => { "status": 200, "body": "ok" },
    _ => ({ status: 500, body: "error" }),
}

println(response:status)    # 200
println(response:body)      # ok
```

## Best Practices

### DO:

- Add a `_` arm unless you genuinely want `nil` for unmatched input
- Put a trailing comma after every expression-bodied arm, including the last one
- Order arms from specific to general
- Destructure with `a, b = value` *before* the match when you need the parts
- Use the conditional form `match { … }` for anything involving comparisons, ranges or type predicates
- Use tuple patterns for fixed combinations like `(method, path)`

### DON'T:

- Expect a bare identifier to bind a value — it is a string literal
- Reach for list, map or range patterns; they do not exist
- Put a variable holding a regex in pattern position
- Rely on capture groups; use `split`, `index_of` and slices instead
- Write unreachable arms after a broad one

## See Also

- [Match Expressions](../fundamentals/control-flow/match.md) — the basics
- [Guards](../fundamentals/control-flow/guards.md) — `&&` / `||` with `return`
- [Regular Expressions](../fundamentals/data-types/regex.md)
- [Tuples](../fundamentals/data-types/tuples.md) — including destructuring
- [Type Checking](type-checking.md) — predicates for type-based dispatch
