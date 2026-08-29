# Strings

Strings represent text in Suji. They support Unicode, interpolation, and rich manipulation methods.

## Overview

Strings are sequences of Unicode characters used for text processing.

### Key Characteristics

- **UTF-8 encoding** - Full Unicode support
- **String interpolation** - Embed expressions with `${...}`
- **Immutable** - Operations create new strings
- **Two quote styles** - Single `'` or double `"`
- **Multiline support** - Triple quotes `"""..."""`

### When to Use Strings

Use strings for:
- Text and messages
- User input/output
- File paths and URLs
- Configuration values
- Template generation

## Syntax

### Single and Double Quotes

```suji
import std:println

# Single quotes
name = 'Alice'
path = '/tmp/file.txt'

# Double quotes
greeting = "Hello"
message = "Welcome to Suji"

println("${greeting}, ${name}!")  # Hello, Alice!
println(path)                     # /tmp/file.txt
```

Both work the same for simple strings. String interpolation works with both quote types.

### String Interpolation

Works with both single and double quotes:

```suji
import std:println

name = "Alice"
age = 30

# Interpolate variables
println("Hello, ${name}!")  # Hello, Alice!
println('Hello, ${name}!')  # Hello, Alice! (also works with single quotes)

# Interpolate expressions
println("Age: ${age + 1}")  # Age: 31

# Multiple interpolations
println("${name} is ${age} years old")
```

### Multiline Strings

Use triple quotes for multiline text:

```suji
import std:println

text = """
This is a
multiline
string
"""

println(text)
```

### Escape Sequences

The supported escapes are exactly `\n`, `\t`, `\r`, `\"`, `\'`, `` \` ``, `\\`
and `\$`:

```suji
import std:println

newline = "Line 1\nLine 2"
tab = "Column 1\tColumn 2"
quote = "He said \"Hello\""
backslash = "Path: C:\\Users\\Alice"
dollar = "Costs \${amount}"   # escape $ to keep it literal

println(newline)
println(tab)
println(quote)
println(backslash)
println(dollar)  # Costs ${amount}
```

**Any other escape is a lex error**, including the Unicode escapes you may know
from other languages: `\u2764`, `\u{1F600}`, `\x41`, `\0` and `\e` are all
rejected with *Invalid escape sequence*. To put a non-ASCII character in a
string, type the character itself — Suji source is UTF-8:

```suji
import std:println

heart = "❤"
println(heart)  # ❤
```

There are also no raw strings; use `\\` for a literal backslash.

## String Operations

### Concatenation

```suji
import std:println

first = "Hello"
last = "World"

# Using +
result = first + " " + last
println(result)  # Hello World

# Using interpolation
result = "${first} ${last}"
println(result)  # Hello World
```

### Length

```suji
import std:println

text = "Hello"
println(text::length())  # 5

# Counts characters, not bytes
accented = "café"
println(accented::length())  # 4
```

### Indexing

Access characters by position (0-based):

```suji
import std:println

text = "Hello"
println(text[0])  # H
println(text[4])  # o

# Negative indices count from end
println(text[-1])  # o
println(text[-2])  # l
```

### Slicing

Extract substrings using semicolon syntax:

```suji
import std:println

text = "Hello, World!"

# Range [start;end) - includes start, excludes end
println(text[0;5])    # Hello
println(text[7;12])   # World

# From start
println(text[;7])     # Hello,

# To end
println(text[7;])      # World!
```

## String Methods

### Case Conversion

```suji
import std:println

text = "Hello World"

println(text::upper())        # HELLO WORLD
println(text::lower())        # hello world
```

### Trimming

```suji
import std:println

text = "  hello  "

println(text::trim())         # hello

# Trim specific characters
text = "***hello***"
println(text::trim("*"))      # hello
```

`trim()` always trims both ends. There is no `trim_start()` or `trim_end()`.

### Searching

```suji
import std:println

text = "Hello, World!"

# Contains
println(text::contains("World"))    # true
println(text::contains("xyz"))      # false

# Starts with / ends with
println(text::starts_with("Hello")) # true
println(text::ends_with("!"))       # true

# Find position
println(text::index_of("World"))    # 7
println(text::index_of("xyz"))      # -1 (not found)
```

### Splitting

```suji
import std:println

text = "apple,banana,cherry"

# Split by delimiter
fruits = text::split(",")
println(fruits)  # [apple, banana, cherry]

# Split by space (default separator is `" "`)
text = "one two three"
words = text::split()
println(words)  # [one, two, three]
```

`split()` takes a plain string separator only — you cannot split on a regex.

### Replacing

```suji
import std:println

text = "Hello, World!"

# Replace all occurrences
result = text::replace("World", "Suji")
println(result)  # Hello, Suji!

# Replace in a string with multiple occurrences
text = "foo bar foo"
result = text::replace("foo", "baz")
println(result)  # baz bar baz
```

Both arguments must be strings. `text::replace(/foo/, "baz")` is a type error —
there is no regex-based replacement in Suji.

### Repeating

```suji
import std:println

println("*"::repeat(5))      # *****
println("ab"::repeat(3))      # ababab
```

### Reversing

```suji
import std:println

text = "Hello"
println(text::reverse())     # olleH
```

### Converting to List

```suji
import std:println

text = "hello"
chars = text::to_list()
println(chars)  # [h, e, l, l, o]
```

`to_list()` is also how you iterate a string — a string is not directly
iterable (see [Character Iteration](#character-iteration) below).

### Methods That Do Not Exist

The complete string method list is `length`, `split`, `to_number`, `to_list`,
`index_of`, `contains`, `starts_with`, `ends_with`, `replace`, `trim`, `upper`,
`lower`, `reverse`, `repeat`, `to_string` (plus the `is_*` type predicates).

| You might reach for | Use instead |
|---|---|
| `trim_start()` / `trim_end()` | `trim()` (both ends), or slice manually |
| `is_empty()` | `s::length() == 0` |
| `capitalize()` / `title()` | slice and `upper()` the first character (see [Title Case](#title-case)) |
| `pad_start()` / `pad_end()` | build the padding with `" "::repeat(n)` |
| `slice()` / `substring()` | slice syntax `s[1;3]` |
| `chars()` | `to_list()` |
| `lines()` | `split("\n")` |
| `find()` | `index_of()` |
| `match()` / `captures()` | the `~` operator (boolean only) |
| `format()` | interpolation `"${a} ${b}"` |

## Pattern Matching

### With Regular Expressions

```suji
import std:println

email = "user@example.com"

# Match operator
is_valid = email ~ /^[^@]+@[^@]+\.[^@]+$/
println(is_valid)  # true

text = "Call me at 555-1234"
words = text::split(" ")
phones = words::filter(|w| w ~ /^\d{3}-\d{4}$/)
match {
    phones::length() > 0 => { println("Found phone: " + phones[0]) },
    _ => println("No phone found"),
}
```

See [Regular Expressions](regex.md) for more details.

## Advanced Patterns

### Template Strings

```suji
import std:println

template = |name, age| {
    """
    Name: ${name}
    Age: ${age}
    Status: ${match { age >= 18 => "Adult", _ => "Minor", }}
    """
}

println(template("Alice", 30))
```

### String Builder Pattern

For building strings efficiently:

```suji
import std:println

build_html = |items| {
    html = "<ul>"
    loop through items with item {
        html = html + "<li>${item}</li>"
    }
    html = html + "</ul>"
    html
}

items = ["Apple", "Banana", "Cherry"]
println(build_html(items))
```

### Multi-line with Indentation

```suji
import std:println

query = """
    SELECT *
    FROM users
    WHERE age >= 18
      AND status = 'active'
    ORDER BY name
"""

println(query)
```

## Type Conversion

### To String

```suji
import std:println

# Numbers
println(42::to_string())       # 42

# Booleans
println(true::to_string())     # true

# Lists/Maps
println([1, 2, 3]::to_string())  # [1, 2, 3]
```

`to_string()` is required whenever you mix types with `+`: `"n = " + 1` is a type
error, while `"n = " + 1::to_string()` (or just `"n = ${1}"`) works.

### From String

```suji
import std:println

# Parse number
num = "42"::to_number()
println(num)                   # 42

# Parse boolean
parse_bool = |s| {
    match s {
        "true" => true,
        "false" => false,
        _ => nil,
    }
}
println(parse_bool("true"))    # true
```

## Unicode Support

### Unicode Length

`String::length()` counts Unicode scalar values (Rust `char`s), not grapheme clusters:

```suji
import std:println

text = "Hello World"
println(text::length())         # 11

# Diacritics: a precomposed é is one scalar value
text = "café"
println(text::length())         # 4

# An emoji is usually one scalar value too
text = "👍"
println(text::length())         # 1
```

Because the unit is the scalar value and not the grapheme cluster, a character
written as a base letter plus a combining mark counts as two, and a
multi-codepoint emoji (a flag, or a family with zero-width joiners) counts as
several. Indexing and `length()` are therefore O(n) walks over the string.

### Character Iteration

A string is **not** iterable: `loop through "Hello"` fails with
*Cannot iterate over string*. Convert it to a list of characters first:

```suji
import std:println

text = "Hello"
loop through text::to_list() with char {
    println(char)
}
# H
# e
# l
# l
# o
```

## Common Pitfalls

### Pitfall 1: Index Out of Bounds

There is no way to catch a runtime error, so check the length before indexing:

```suji
import std:println

text = "Hello"

# This would terminate the program:
# char = text[10]  # Runtime error: Index out of bounds

char = match {
    text::length() > 10 => text[10],
    _ => nil,
}
println(char)  # nil
```

### Pitfall 2: Mutability Confusion

```suji
import std:println

text = "Hello"
result = text::upper()  # Returns "HELLO", doesn't modify text

# Original unchanged
println(text)    # Hello
println(result)  # HELLO

# Rebind the variable to "modify" it
text = text::upper()
println(text)    # HELLO
```

### Pitfall 3: String Comparison

```suji
import std:println

# Case-sensitive by default
println("Hello" == "hello")                        # false

# Case-insensitive comparison
println("Hello"::lower() == "hello"::lower())      # true

# `<` and `>` compare lexicographically, but only between two strings —
# comparing a string with a number is a type error
println("apple" < "banana")                        # true
```

## Performance Considerations

### String Concatenation

For many concatenations, collect in list then join:

```suji
import std:println

items = ["a", "b", "c"]

# Slow for many items: every + allocates a new string
result = ""
loop through items with item {
    result = result + item + ", "
}
println(result)  # a, b, c,

# Faster, and no trailing separator
println(items::join(", "))  # a, b, c
```

### String Building

```suji
import std:println

items = ["Apple", "Banana"]

# Efficient for complex building: collect the pieces, join once
parts = []
loop through items with item {
    parts::push("<li>${item}</li>")
}
html = parts::join("")
println(html)  # <li>Apple</li><li>Banana</li>
```

## Examples

### Email Validation

```suji
import std:println

validate_email = |email| {
    email ~ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

println(validate_email("user@example.com"))   # true
println(validate_email("invalid.email"))      # false
```

### Slugify

`replace()` only accepts strings, so a slug has to be built character by
character rather than with a regex substitution:

```suji
import std:println

allowed = "abcdefghijklmnopqrstuvwxyz0123456789"

slugify = |text| {
    out = []
    loop through text::lower()::to_list() with ch {
        out::push(match {
            allowed::contains(ch) => ch,
            _ => "-",
        })
    }
    # Collapse runs of "-" and drop the empty leading/trailing pieces
    words = out::join("")::split("-")::filter(|p| p::length() > 0)
    words::join("-")
}

println(slugify("Hello World!"))   # hello-world
println(slugify("  Foo & Bar  "))  # foo-bar
```

### Parse CSV Line

```suji
import std:println

parse_csv_line = |line| {
    line::split(",")::map(|s| s::trim())
}

line = "Alice, 30, Engineer"
fields = parse_csv_line(line)
println(fields)  # [Alice, 30, Engineer]
```

### Title Case

```suji
import std:println

title_case = |text| {
    words = text::lower()::split()
    result = []
    loop through words with word {
        first = word[0]::upper()
        rest = word[1;]::lower()
        result::push(first + rest)
    }
    result::join(" ")
}

println(title_case("hello world"))     # Hello World
println(title_case("the quick BROWN fox"))  # The Quick Brown Fox
```

### Password Strength

```suji
import std:println

check_password_strength = |password| {
    has_length = password::length() >= 8
    has_upper = password ~ /[A-Z]/
    has_lower = password ~ /[a-z]/
    has_digit = password ~ /[0-9]/
    has_special = password ~ /[!@#$%^&*]/
    
    checks = [has_length, has_upper, has_lower, has_digit, has_special]
    score = checks::filter(|x| x)::length()
    
    match score {
        5 => "Strong",
        _ => match score >= 3 {
            true => "Medium",
            false => "Weak",
        },
    }
}

println(check_password_strength("abc123"))           # Weak
println(check_password_strength("Abc123"))           # Medium
println(check_password_strength("Abc123!@"))         # Strong
```

## Best Practices

### DO:
- Use string interpolation with `${...}` (works with both single and double quotes)
- Use triple quotes for multiline text
- Use method chaining with `::` syntax
- Use meaningful variable names
- Handle Unicode correctly

### DON'T:
- Concatenate in loops (use join instead)
- Forget strings are immutable
- Ignore Unicode edge cases
- Hard-code strings that should be configurable

## Next Steps

- Learn about [Lists](lists.md) for collections of strings
- Explore [Regular Expressions](regex.md) for pattern matching
- Study [String Interpolation](../../advanced/string-interpolation.md) in depth
- Check out [Text Encoding](../../stdlib/encoding.md) in the stdlib

## See Also

- [Regular Expressions](regex.md)
- [String Interpolation](../../advanced/string-interpolation.md)
- [Text Encoding](../../stdlib/encoding.md)
- [Pattern Matching](../control-flow/match.md)
