# Regex Matching

Pattern matching and text validation with regular expressions.

## Overview

This example demonstrates:

- Regex literals (`/pattern/`)
- Pattern matching with `~` / `!~`
- Using regex patterns inside `match`
- Extracting simple fields using string methods (`split`, `index_of`, slicing)

## Prerequisites

- [Regular Expressions](../fundamentals/data-types/regex.md)
- [Matching Operators](../fundamentals/operators/matching.md)
- [Strings](../fundamentals/data-types/strings.md)

## Complete Code

```suji
import std:println

# 1) Email validation
email = "user@example.com"
println(email ~ /^[^@]+@[^@]+\.[^@]+$/)  # true
println("nope" !~ /@/)                   # true

# 2) Token extraction: URLs + phone numbers
text = "Visit https://example.com or call 555-1234 for help"
words = text::replace("\n", " ")::replace("\t", " ")::split(" ")

urls = words::filter(|w| w ~ /^https?:\/\/.+$/)
phones = words::filter(|w| w ~ /^\d{3}-\d{4}$/)

println(urls::join(", "))    # https://example.com
println(phones::join(", "))  # 555-1234

# 3) Log parsing (no regex captures; use index_of and slicing)
parse_log_line = |line| {
    close = line::index_of("]")
    close < 0 && return nil

    rest = line[(close + 2);]
    sep = rest::index_of(": ")
    sep < 0 && return nil

    {
        "timestamp": line[1;close],
        "level": rest[0;sep],
        "message": rest[(sep + 2);],
    }
}

log = "[2024-01-15 10:30:00] ERROR: Connection failed"
entry = parse_log_line(log)
println(entry:level)    # ERROR
println(entry:message)  # Connection failed
```

## Regex as a Match Pattern

A regex literal is also a valid pattern in a subject `match`, which reads better than a chain of `~` tests:

```suji
import std:println

classify = |token| {
    match token {
        /^\d+$/ => "number",
        /^[a-z]+@[a-z.]+$/ => "email",
        /^https?:\/\// => "url",
        _ => "text",
    }
}

println(classify("42"))                    # number
println(classify("me@example.com"))        # email
println(classify("https://example.com"))   # url
println(classify("hello"))                 # text
```

Patterns may also be stored in variables and reused:

```suji
import std:println

iso_date = /^\d{4}-\d{2}-\d{2}$/

dates = ["2024-01-15", "15/01/2024", "2024-1-5"]
valid = dates::filter(|d| d ~ iso_date)

println(valid::join(", "))  # 2024-01-15
```

Note that `/${variable}/` is **not** interpolated — a regex literal is fixed at parse time.

## Notes

- Regex matching answers "does it match?" only. There are no capture groups, no `::match()`, no regex `replace` and no regex `split`; combine matching with `split`, `index_of` and slicing for extraction.
- `string::replace(old, new)` takes plain strings, so `"abc"::replace(/b/, "B")` is an error.
- Validate before converting: `::to_number()` on a non-numeric string terminates the program, so guard it with `s ~ /^\d+$/` first.

```suji
import std:println

to_number_or = |s, fallback| match {
    s ~ /^-?\d+(\.\d+)?$/ => s::to_number(),
    _ => fallback,
}

println(to_number_or("42.5", 0))   # 42.5
println(to_number_or("many", 0))   # 0
```

## See Also

- [Regular Expressions](../fundamentals/data-types/regex.md)
- [Matching Operators](../fundamentals/operators/matching.md)
- [Text Processing Recipes](../cookbook/text-processing.md)
