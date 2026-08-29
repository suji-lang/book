# Match Expressions

Pattern matching allows you to match values against patterns and execute corresponding code.

## Basic Match

```suji
import std:println

day = "Monday"

match day {
    "Monday" => println("Start of week"),
    "Friday" => println("End of week"),
    "Saturday" | "Sunday" => println("Weekend"),
    _ => println("Midweek"),
}
```

## The Comma Rule

This is the single easiest thing to get wrong. An arm whose body is a **bare
expression must be followed by a comma — including the final arm**. Only an arm
whose body is a `{ … }` block may omit the comma.

Correct — every expression arm ends with a comma:

```suji
import std:println

x = 1

println(match x { 1 => "one", _ => "other", })
```

Incorrect — the last arm has no comma, so the program fails to parse with
`[201] Error: Unexpected token` pointing at the closing brace:

```text
match x { 1 => "one", _ => "other" }
```

Block bodies are the exception, and they may be written with or without commas:

```suji
import std:println

x = 1

match x {
    1 => { println("one") }
    _ => { println("other") }
}
```

## Match as Expression

Match expressions return values:

```suji
import std:println

grade = |score| {
    match {
        score >= 90 => "A",
        score >= 80 => "B",
        score >= 70 => "C",
        score >= 60 => "D",
        _ => "F",
    }
}

println(grade(85))  # B
```

## Pattern Types

Patterns are deliberately limited. The complete list is:

- number literals, including negative ones (`-3`)
- string literals (`"Monday"`)
- boolean literals (`true`, `false`) and `nil`
- regex literals (`/\d+/`)
- tuple patterns whose elements are themselves patterns (`(0, 1)`, `(10, _)`)
- alternations with `|` (`1 | 2 | 3`)
- the wildcard `_`

There are **no variable-binding patterns, no list patterns (`[a, b]`), no map
patterns, no range patterns (`1..10 =>`) and no `if` guards.** For anything that
needs a computed test, use the condition-only form of `match` described below.

### Literal Matching

```suji
import std:println

value = 2

result = match value {
    0 => "zero",
    1 => "one",
    2 => "two",
    _ => "other",
}

println(result)  # two
```

### Bare Identifiers Are String Literals — Not Bindings

A bare identifier on the left of `=>` is **not** a binding; it is parsed as a
string literal. So this looks like it doubles the subject but actually compares
`5` against the string `"n"`, matches nothing, and evaluates to `nil`:

```suji
import std:println

println(match 5 { n => n * 2, })  # nil
```

If you need the subject inside an arm body, refer to the original variable
instead:

```suji
import std:println

n = 5

println(match { n > 0 => n * 2, _ => 0, })  # 10
```

### No Match Means `nil`

A `match` with no arm that matches is not an error — it evaluates to `nil`:

```suji
import std:println

println(match 99 { 1 => "one", 2 => "two", })  # nil
```

That is why an explicit `_` arm matters whenever `nil` would be a surprising
result.

### Conditional Match (No Scrutinee)

Use `match { ... }` without an expression for conditional matching:

```suji
import std:println

categorize = |n| {
    match {
        n < 0 => "negative",
        n == 0 => "zero",
        n < 10 => "single digit",
        n < 100 => "double digit",
        _ => "large",
    }
}

println(categorize(42))  # double digit
```

### Tuple Patterns

A tuple pattern matches element by element, and each element is itself a pattern
— a literal or `_`, never a binding:

```suji
import std:println

point = (10, 0)

match point {
    (0, 0) => println("Origin"),
    (0, _) => println("On the Y-axis"),
    (_, 0) => println("On the X-axis"),
    _ => println("Somewhere else"),
}
```

To use the components of a tuple, destructure it with an assignment first — the
`match` arms can then test the parts:

```suji
import std:println

point = (10, 20)
x, y = point

quadrant = match {
    x > 0 && y > 0 => "I",
    x < 0 && y > 0 => "II",
    x < 0 && y < 0 => "III",
    x > 0 && y < 0 => "IV",
    _ => "on an axis",
}

println("(${x}, ${y}) is in quadrant ${quadrant}")  # (10, 20) is in quadrant I
```

### Regex Patterns

A regex literal as a pattern matches when the subject string matches it. Regex
matching is boolean only — there are no capture groups, so an arm body cannot
pull pieces out of the subject:

```suji
import std:println

text = "Call me at 555-1234"

match text {
    /\d{3}-\d{4}/ => {
        words = text::split(" ")
        phones = words::filter(|w| w ~ /^\d{3}-\d{4}$/)
        match { phones::length() > 0 => { println("Phone: " + phones[0]) } }
    }
    /[a-z]+@[a-z]+\.[a-z]+/ => println("Email found"),
    _ => println("No pattern matched"),
}
```

### Type Matching

```suji
import std:println

process = |value| {
    match {
        value::is_number() => "Number: ${value}",
        value::is_string() => "String: ${value}",
        value::is_bool() => "Boolean: ${value}",
        value::is_list() => "List with ${value::length()} items",
        _ => "Unknown type",
    }
}

println(process(42))        # Number: 42
println(process("hello"))   # String: hello
println(process([1, 2, 3])) # List with 3 items
```

## Multiple Patterns (Alternation)

Use `|` to match multiple patterns:

```suji
import std:println

value = 5

match value {
    1 | 2 | 3 => println("Small"),
    4 | 5 | 6 => println("Medium"),
    7 | 8 | 9 => println("Large"),
    _ => println("Out of range"),
}
```

## Wildcard Pattern (`_`)

Matches anything (catch-all):

```suji
import std:println

value = "something"

match value {
    "specific" => println("Matched specific"),
    _ => println("Matched anything else"),
}
```

## Nested Match

```suji
import std:println

process = |value| {
    match {
        value::is_number() => {
            match {
                value < 0 => "Negative",
                value == 0 => "Zero",
                value < 10 => "Small positive",
                _ => "Large positive",
            }
        },
        value::is_string() => "Text",
        _ => "Other",
    }
}

println(process(-5))      # Negative
println(process(5))       # Small positive
println(process("hi"))    # Text
```

## Common Patterns

### Command Handler

```suji
import std:println

start_service = || println("starting")
stop_service = || println("stopping")
check_status = || println("running")

handle_command = |cmd| {
    match cmd {
        "start" => start_service(),
        "stop" => stop_service(),
        "status" => check_status(),
        _ => println("Unknown command: ${cmd}"),
    }
}

handle_command("start")   # starting
handle_command("deploy")  # Unknown command: deploy
```

### State Machine

```suji
import std:println

next_state = |current, event| {
    match (current, event) {
        ("idle", "start") => "running",
        ("running", "pause") => "paused",
        ("paused", "resume") => "running",
        ("running", "stop") => "idle",
        ("paused", "stop") => "idle",
        _ => current,  # No transition
    }
}

println(next_state("idle", "start"))  # running
println(next_state("idle", "pause"))  # idle
```

Note the last arm: it is `_` (a wildcard pattern) with the body `current` (an
ordinary variable reference). Writing `(state, _) => state` would not work,
because `state` in a pattern means the string `"state"`.

### Value-and-Error Tuples

Suji has no `Result` or `Option` type and no exceptions, so functions that can
fail conventionally return a `(value, error)` tuple. Destructure the tuple first,
then branch on the error with the condition form:

```suji
import std:println

parse_port = |text| {
    match text {
        /^\d+$/ => (text::to_number(), nil),
        _ => (nil, "not a number"),
    }
}

report = |text| {
    value, error = parse_port(text)
    match {
        error == nil => println("Port: ${value}"),
        _ => println("Error: ${error}"),
    }
}

report("8080")  # Port: 8080
report("http")  # Error: not a number
```

### Ranges Are Not Patterns

`1..10` is a range *expression* that evaluates to a list; it cannot appear on the
left of `=>`. Use the condition form for interval logic:

```suji
import std:println

categorize_age = |age| {
    match {
        age < 0 => "Invalid",
        age < 13 => "Child",
        age < 20 => "Teenager",
        age < 65 => "Adult",
        _ => "Senior",
    }
}

println(categorize_age(25))  # Adult
```

## Match vs Conditional Logic

### When to Use Match:

- Multiple distinct literal values
- Regex or tuple shape testing
- Type-based dispatch (via `is_number()`, `is_string()` and friends)
- Interval and comparison logic, using the condition form
- Anywhere another language would use `if`/`else`

### When to Use Short-Circuit Operators:

- Simple boolean conditions with early returns
- Guard clauses: `condition && return value`
- Early exits: `condition || break`

Both operands of `&&` and `||` must be real booleans — there is no truthiness, so
write `x == nil` or `xs::length() == 0` rather than relying on a bare value.

## Best Practices

### DO:
- Always include a wildcard case (`_`) unless `nil` is the result you want
- Remember the trailing comma on every expression arm, last one included
- Use the condition form (`match { … }`) for ranges and computed tests
- Destructure a tuple *before* matching when you need its parts
- Keep match arms simple (extract complex logic)
- Order patterns from specific to general

### DON'T:
- Forget the wildcard/default case
- Expect a bare identifier pattern to bind — it is a string literal
- Reach for list, map, range or `if`-guard patterns; they do not exist
- Have unreachable patterns
- Mix unrelated match criteria

## See Also

- [Pattern Matching](../../advanced/pattern-matching.md)
- [Regular Expressions](../data-types/regex.md)
- [Tuples](../data-types/tuples.md)
- [Conditional Logic](conditionals.md)
