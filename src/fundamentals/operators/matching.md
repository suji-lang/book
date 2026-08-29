# Matching Operators

Matching operators test if strings match regular expression patterns.

## Overview

Suji provides two operators for testing strings against regular expressions, making
text validation concise and readable.

The operators are `~` and `!~` — there is no `=~`. Both yield **only a boolean**.
Suji's regex support is deliberately match-only:

- no capture groups (`::captures()`, `::match()`, `::find()` do not exist)
- no regex replace — `::replace(old, new)` takes **strings** only
- no regex split — `::split(sep)` takes a string separator
- regex literals are **not** interpolated: `/${var}/` is passed to the engine
  literally and fails to compile

Regex values are first class: you can store one in a variable and use it as a `match`
arm pattern.

## Match Operator (`~`)

Tests if a string matches a regex pattern:

```suji
import std:println

text = "user@example.com"
pattern = /^[^@]+@[^@]+\.[^@]+$/

# Returns true if matches
is_email = text ~ pattern
println(is_email)  # true
```

### Basic Matching

```suji
import std:println

# Check if string contains pattern
println("hello world" ~ /world/)      # true
println("hello world" ~ /goodbye/)    # false

# Case-sensitive by default
println("Hello" ~ /hello/)            # false
println("Hello" ~ /(?i)hello/)        # true (case-insensitive)
```

## Negative Match Operator (`!~`)

Tests if a string does NOT match a pattern:

```suji
import std:println

text = "hello123"

println(text !~ /world/)      # true (doesn't contain "world")
println(text !~ /hello/)      # false (contains "hello")

# Useful for validation
username = "alice_123"
is_valid_username = username !~ /[^a-zA-Z0-9_]/
println(is_valid_username)    # true - contains NO invalid characters
```

## Common Patterns

### Email Validation

```suji
import std:println

validate_email = |email| {
    email ~ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

println(validate_email("user@example.com"))    # true
println(validate_email("invalid.email"))        # false
```

### URL Validation

```suji
import std:println

validate_url = |url| {
    url ~ /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/
}

println(validate_url("https://example.com"))       # true
println(validate_url("http://site.co.uk/path"))    # true
println(validate_url("not-a-url"))                 # false
```

### Phone Number

```suji
import std:println

validate_phone = |phone| {
    phone ~ /^\d{3}-\d{3}-\d{4}$/
}

println(validate_phone("555-123-4567"))  # true
println(validate_phone("555-1234"))      # false
println(validate_phone("5551234567"))    # false
```

### Contains Digits

```suji
import std:println

has_digits = |text| {
    text ~ /\d/
}

println(has_digits("hello123"))  # true
println(has_digits("hello"))     # false
```

### Starts/Ends With

```suji
import std:println

# Starts with "http"
println("http://example.com" ~ /^http/)    # true
println("https://example.com" ~ /^http/)   # true
println("ftp://example.com" ~ /^http/)     # false

# Ends with ".com"
println("example.com" ~ /\.com$/)          # true
println("example.org" ~ /\.com$/)          # false
```

## In Conditionals

Matching operators work well with match expressions:

```suji
import std:println

username = "alice_123"

match username ~ /^[a-zA-Z0-9_]+$/ {
    true => println("Valid username"),
    false => println("Invalid username: contains special characters"),
}
```

## In Filters

Use matching to filter lists:

```suji
import std:println

emails = [
    "valid@example.com",
    "invalid.email",
    "another@test.org",
    "bad@"
]

pattern = /^[^@]+@[^@]+\.[^@]+$/
valid_emails = emails::filter(|e| e ~ pattern)

println(valid_emails)
# [valid@example.com, another@test.org]
```

## Pattern Matching with Match

Combine with `match` for branching on patterns:

```suji
import std:println

text = "Call me at 555-1234"

words = text::split(" ")
phones = words::filter(|w| w ~ /^\d{3}-\d{4}$/)

match {
    phones::length() > 0 => println("Phone: " + phones[0]),
    _ => println("No phone found"),
}
```

A regex literal can also be used directly as a **match arm pattern**, which is often
tidier than a chain of `~` tests:

```suji
import std:println

classify = |token| {
    match token {
        /^\d+$/ => "number",
        /^[a-z]+$/ => "word",
        _ => "mixed",
    }
}

println(classify("42"))       # number
println(classify("hello"))    # word
println(classify("h3llo"))    # mixed
```

Because regex values are ordinary values, you can name them and reuse them:

```suji
import std:println

digits_only = /^\d+$/

println("123" ~ digits_only)  # true
println("12a" ~ digits_only)  # false
```

What you cannot do is build a pattern dynamically. Regex literals are not
interpolated, so `/${some_var}/` is handed to the engine verbatim and fails with a
`Regex error`, and there is no function that turns a string into a regex. Patterns
must be written out literally in the source.

## Negation Patterns

Use `!~` to check absence of patterns:

```suji
import std:println

# Check password doesn't contain spaces
password = "MyP@ssw0rd"
no_spaces = password !~ /\s/
println(no_spaces)  # true

# Check username has no special chars
username = "alice_123"
only_alphanumeric = username !~ /[^a-zA-Z0-9_]/
println(only_alphanumeric)  # true
```

## Combining with Logical Operators

```suji
import std:println

validate_password = |password| {
    # All these conditions must be true
    long_enough = password::length() >= 8
    has_upper = password ~ /[A-Z]/
    has_lower = password ~ /[a-z]/
    has_digit = password ~ /[0-9]/
    has_special = password ~ /[!@#$%^&*]/
    
    long_enough && has_upper && has_lower && has_digit && has_special
}

println(validate_password("Passw0rd!"))  # true
println(validate_password("password"))   # false
```

## Inline Regex Modes

The regex engine supports inline mode modifiers like `(?i)` (case-insensitive) and `(?m)` (multiline).

```suji
import std:println

text = "Hello World"

# Case-insensitive
println(text ~ /(?i)hello/)       # true

# Multiline
multiline = "line1\nline2"
println(multiline ~ /(?m)^line2/) # true
```

## Common Pitfalls

### Pitfall 1: Not Escaping Special Characters

```suji
import std:println

# Unescaped dot matches any character
println("axb" ~ /a.b/)   # true  - the dot matched "x"
println("a.b" ~ /a.b/)   # true  - and it matches a literal dot too

# Escape the dot to match only a literal dot
println("axb" ~ /a\.b/)  # false
println("a.b" ~ /a\.b/)  # true
```

### Pitfall 2: Forgetting Anchors

```suji
import std:println

# Partial match (finds "123" anywhere)
println("hello123world" ~ /\d+/)  # true

# Anchored (entire string must be digits)
println("hello123world" ~ /^\d+$/)  # false
println("123" ~ /^\d+$/)            # true
```

### Pitfall 3: Case Sensitivity

```suji
import std:println

# Case-sensitive by default
println("Hello" ~ /hello/)   # false

# Use inline case-insensitive mode
println("Hello" ~ /(?i)hello/)  # true
```

### Pitfall 4: Expecting Greediness to Matter

Greedy and non-greedy quantifiers are both accepted, but since `~` returns only
"did it match", the difference is invisible — you never get to see *what* matched:

```suji
import std:println

text = "<tag>content</tag>"

println(text ~ /<.*>/)   # true
println(text ~ /<.*?>/)  # true - same answer
```

If you need the matched text, regex will not help you: use string methods such as
`::index_of()`, `::split()` and slicing (`s[1;4]`) to carve the value out yourself.

## Best Practices

### DO:
- Use anchors (`^`, `$`) for exact matches
- Escape special regex characters
- Reach for `::contains()`, `::starts_with()` and `::ends_with()` when a plain
  substring test will do
- Test patterns thoroughly
- Add comments for complex regex

### DON'T:
- Expect captured groups, regex replace or regex split — none exist
- Write `=~`; the operator is `~`
- Try to interpolate a pattern (`/${var}/` is a regex error)
- Forget case sensitivity
- Use regex to parse HTML/XML

## Examples

### Username Validation

```suji
import std:println

validate_username = |username| {
    # 3-20 characters, alphanumeric and underscore only
    valid_format = username ~ /^[a-zA-Z0-9_]{3,20}$/
    no_double_underscore = username !~ /__/
    not_starts_with_number = username !~ /^[0-9]/
    
    valid_format && no_double_underscore && not_starts_with_number
}

println(validate_username("alice_123"))    # true
println(validate_username("ab"))           # false (too short)
println(validate_username("alice__bob"))   # false (double underscore)
println(validate_username("123alice"))     # false (starts with number)
```

### Extract Domain from URL

```suji
import std:println

get_domain = |url| {
    url !~ /^https?:\/\// && return nil

    parts = url::split("://")
    parts::length() < 2 && return nil

    host_and_path = parts[1]
    host_parts = host_and_path::split("/")
    host_parts[0]
}

println(get_domain("https://example.com/path"))  # example.com
println(get_domain("http://site.org"))           # site.org
println(get_domain("ftp://site.org"))            # nil
```

### Sanitize Input

There is no regex replace, so filtering has to be done character by character. Note
that strings are **not iterable** — `loop through text` is a runtime error, so convert
with `::to_list()` first:

```suji
import std:println

sanitize = |text| {
    # Keep only alphanumerics, spaces, hyphens and underscores
    result = ""
    loop through text::to_list() with char {
        match { char ~ /[a-zA-Z0-9 _-]/ => { result = result + char } }
    }
    result
}

println(sanitize("Hello, World!"))      # Hello World
println(sanitize("Test@#$%123"))        # Test123
```

### Password Strength Checker

```suji
import std:println

check_password_strength = |password| {
    score = 0
    
    match { password::length() >= 8 => { score = score + 1 } }
    match { password::length() >= 12 => { score = score + 1 } }
    match { password ~ /[A-Z]/ => { score = score + 1 } }
    match { password ~ /[a-z]/ => { score = score + 1 } }
    match { password ~ /[0-9]/ => { score = score + 1 } }
    match { password ~ /[!@#$%^&*]/ => { score = score + 1 } }
    
    match {
        score >= 5 => "Strong",
        score >= 3 => "Medium",
        _ => "Weak",
    }
}

println(check_password_strength("abc123"))          # Weak
println(check_password_strength("Abc123"))          # Medium
println(check_password_strength("Abc123!@"))        # Strong
```

### File Extension Check

```suji
import std:println

is_image = |filename| {
    filename ~ /(?i)\.(jpg|jpeg|png|gif|webp)$/
}

is_document = |filename| {
    filename ~ /(?i)\.(pdf|doc|docx|txt)$/
}

println(is_image("photo.jpg"))        # true
println(is_image("document.pdf"))     # false
println(is_document("report.pdf"))    # true
```

## Next Steps

- Learn about [Regular Expressions](../data-types/regex.md) in detail
- Explore [String Methods](../data-types/strings.md)
- Study [Pattern Matching](../control-flow/match.md)
- Check out [Text Processing](../../cookbook/text-processing.md)

## See Also

- [Regular Expressions](../data-types/regex.md)
- [Strings](../data-types/strings.md)
- [Pattern Matching](../control-flow/match.md)
- [Match Expression](../control-flow/match.md)
