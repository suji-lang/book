# Regular Expressions

Regular expressions (regex) are patterns for **matching** text.

## Overview

In this repository, regexes are used for:

- Validating formats (emails, URLs, IDs)
- Filtering text (pick only lines that match)
- Branching with `match` based on whether a string matches a pattern

Matching is all a regex can do in Suji. There is **no** way to:

- Extract capture groups — there is no `::match()`, `::captures()` or `::find()`,
  and parentheses in a pattern only group for the matcher's own purposes
- Replace with a regex — `"abc"::replace(/b/, "B")` is a type error, because
  `replace()` takes two strings
- Split with a regex — `split()` also takes a plain string separator
- Interpolate a pattern — `/${word}/` is compiled literally and fails as an
  invalid pattern; build the check some other way (see
  [Building patterns at runtime](#building-patterns-at-runtime))

## Syntax

Regex literals use slashes, and evaluate to a regex value you can store in a
variable:

```suji
import std:println

email = /^[^@]+@[^@]+\.[^@]+$/

println(email::is_regex())            # true
println("user@example.com" ~ email)   # true
```

The pattern is compiled by Rust’s regex engine, so you can use inline modifiers like `(?i)`:

```suji
import std:println

case_insensitive = /(?i)hello/
println("HeLLo there" ~ case_insensitive)  # true
```

## Matching

### Match operator (`~`)

```suji
import std:println

email = "user@example.com"
println(email ~ /^[^@]+@[^@]+\.[^@]+$/)  # true
```

### Negative match (`!~`)

```suji
import std:println

text = "hello world"
println(text !~ /goodbye/)  # true
```

## Using regex in `match`

You can use a regex literal as a match pattern:

```suji
import std:println

line = "[WARN] disk is almost full"
match line {
    /^\[ERROR\]/ => println("error"),
    /^\[WARN\]/ => println("warn"),
    _ => println("other"),
}
```

## Common patterns

### Email validation

```suji
import std:println

is_email = |s| s ~ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

println(is_email("user@example.com"))  # true
println(is_email("nope"))              # false
```

### URL detection

```suji
import std:println

is_url = |s| s ~ /^https?:\/\/.+$/

println(is_url("https://example.com"))  # true
println(is_url("example.com"))          # false
```

### Filtering lines

```suji
import std:println

lines = [
    "INFO startup ok",
    "WARN slow request",
    "ERROR database down"
]

errors = lines::filter(|line| line ~ /^ERROR\b/)
println(errors::length())  # 1
```

## Building patterns at runtime

A regex literal is fixed at parse time — `/${prefix}/` does not interpolate. When
the thing you are looking for is only known at runtime, use the string methods
instead of a regex:

```suji
import std:println

word = "cat"
text = "the cat sat"

# Instead of /${word}/
println(text::contains(word))     # true
println(text::starts_with(word))  # false
println(text::index_of(word))     # 4
```

## Extracting values without capture groups

Since there are no capture groups, validate with a regex and then pull the pieces
out with string operations:

```suji
import std:println

parse_pair = |text| {
    match {
        text ~ /^[a-z_]+=[0-9]+$/ => {
            parts = text::split("=")
            return (parts[0], parts[1]::to_number())
        }
        _ => (nil, nil),
    }
}

key, value = parse_pair("retries=3")
println("${key} -> ${value}")  # retries -> 3

key, value = parse_pair("garbage")
println("${key} -> ${value}")  # nil -> nil
```

## See Also

- [Strings](strings.md)
- [Matching Operators](../operators/matching.md)


