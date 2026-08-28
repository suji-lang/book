# String Interpolation

Embedding values and expressions directly inside string literals with `${…}`.

## Overview

Suji has exactly one interpolation form: `${expression}`. It works in every kind of string literal and inside backtick shell templates, it accepts any expression (not just a variable name), and it converts the result with that value's `to_string()` behaviour.

### Key Characteristics

- **One syntax** - `${expr}`; `$var` without braces is plain text
- **Any expression** - arithmetic, method calls, indexing, even a nested `match`
- **Everywhere strings are** - `"…"`, `'…'`, `"""…"""`, `'''…'''` and `` `…` ``
- **Automatic conversion** - values are rendered with their `to_string()` form
- **Escapable** - `\$` produces a literal dollar sign

## Syntax

```suji
import std:println

name = "Ada"
year = 1843

println("Hello, ${name}!")              # Hello, Ada!
println("Published in ${year}.")        # Published in 1843.
println("${name} in ${year + 100}")     # Ada in 1943
```

Single quotes behave identically — unlike some languages, `'…'` is *not* a raw string:

```suji
import std:println

name = "Ada"

println('Single quotes interpolate too: ${name}')    # Single quotes interpolate too: Ada
```

### `$var` is not interpolation

Only the braced form is recognised. A bare `$` followed by a name is ordinary text:

```suji
import std:println

name = "Ada"

println("$name")      # $name
println("${name}")    # Ada
```

### Escaping a literal `$`

Use `\$` when the character before `{` really should be a dollar sign:

```suji
import std:println

amount = 42

println("Total: \$${amount}")    # Total: $42
println("A literal \${not interpolated}")    # A literal ${not interpolated}
```

## Any Expression Works

The contents of `${…}` are parsed as a full expression, so method calls, indexing, key access and function calls are all fair game:

```suji
import std:println

name = "ada lovelace"
scores = [90, 80, 70]
user = { profile: { city: "London" } }
double = |x| x * 2

println("Name: ${name::upper()}")                    # Name: ADA LOVELACE
println("Best: ${scores::max()}")                    # Best: 90
println("Second: ${scores[1]}")                      # Second: 80
println("Average: ${scores::average()}")             # Average: 80
println("City: ${user:profile:city}")                # City: London
println("Doubled: ${double(21)}")                    # Doubled: 42
println("Length: ${name::length()} characters")      # Length: 12 characters
```

Even a `match` expression can be interpolated, which is the closest Suji gets to a conditional inside a template:

```suji
import std:println

count = 3

println("You have ${count} ${match { count == 1 => "item", _ => "items", }}")
# You have 3 items
```

### Nested interpolation

An interpolated expression may itself contain a string with interpolation:

```suji
import std:println

name = "Ada"

println("outer: ${"inner: ${name}"}")    # outer: inner: Ada
```

This is legal but hard to read; prefer building the inner string in a variable first.

## How Values Are Rendered

Interpolation uses the same conversion as `::to_string()`. There is no formatting mini-language — no field widths, no precision specifiers, no alignment.

```suji
import std:println

println("number: ${42}")          # number: 42
println("scaled: ${1.50}")        # scaled: 1.50
println("bool: ${true}")          # bool: true
println("nil: ${nil}")            # nil: nil
println("list: ${[1, 2, 3]}")     # list: [1, 2, 3]
println("map: ${{a: 1}}")         # map: {a: 1}
println("tuple: ${(1, 2)}")       # tuple: (1, 2)
```

Note that numbers keep their scale: `1.50` renders as `1.50`, not `1.5`.

Since strings and numbers cannot be added (`"a" + 1` is a type error), interpolation is usually the shortest way to join them. The explicit alternative is `::to_string()`:

```suji
import std:println

count = 7

println("Count: ${count}")                    # Count: 7
println("Count: " + count::to_string())       # Count: 7
```

### Rounding and padding by hand

Because there is no format specifier, numeric presentation is done with methods:

```suji
import std:println

ratio = 22 / 7

println("rounded: ${ratio::round()}")               # rounded: 3
println("floored: ${ratio::floor()}")               # floored: 3
println("padded: ${"0"::repeat(3)}${7}")            # padded: 0007
println("percent: ${(0.256 * 100)::round()}%")      # percent: 26%
```

## Escape Sequences

Interpolation shares the string lexer, so the same escape rules apply everywhere.

| Escape | Produces |
|---|---|
| `\n` | newline |
| `\t` | tab |
| `\r` | carriage return |
| `\"` | double quote |
| `\'` | single quote |
| `` \` `` | backtick |
| `\\` | backslash |
| `\$` | dollar sign |

**That is the complete list.** Any other escape — notably `\u0041`, `\u{1F600}`, `\0` and `\e` — is a **lex error** (`[104] Invalid escape sequence`) and the file will not even parse. There are no Unicode escapes and no raw strings; to put a non-ASCII character in a string, type the character itself.

```suji
import std:println

println("tab:\tdone")            # tab:	done
println("quote: \" and \\")      # quote: " and \
println("emoji: ✨ é 日本")       # emoji: ✨ é 日本
```

## Multi-Line Templates

Triple-quoted strings (`"""…"""` and `'''…'''`) span lines and interpolate the same way, which makes them the natural fit for reports, messages and generated files:

```suji
import std:println

name = "Ada"
items = 3
price = 12.50

receipt = """Dear ${name},

You ordered ${items} item(s).
Total: ${(items * price)::to_string()}

Thank you!"""

println(receipt)
```

That prints:

```text
Dear Ada,

You ordered 3 item(s).
Total: 37.50

Thank you!
```

Everything between the delimiters is preserved literally, so a newline right after the opening `"""` becomes a leading blank line. Start the content on the same line as the delimiter when you do not want one.

## Interpolation in Shell Templates

Backtick shell templates interpolate too, and this is by far the most common way to build a command:

```suji
import std:println

word = "hello"

println(`echo ${word}`)              # hello
println(`printf '%s-%s\n' a ${word}`)    # a-hello
```

### Quote what you interpolate

Interpolation is **plain text substitution into the command line**, performed before the shell parses it. An interpolated value containing shell metacharacters therefore becomes shell syntax:

```suji
import std:println

untrusted = "safe; echo INJECTED"

println(`echo ${untrusted}`)
# safe
# INJECTED
```

The `;` was interpreted by the shell and a second command ran. Wrapping the interpolation in double quotes prevents that:

```suji
import std:println

untrusted = "safe; echo INJECTED"

println(`echo "${untrusted}"`)    # safe; echo INJECTED
```

Rules of thumb:

- Always put `"${…}"` in double quotes inside a shell template
- Prefer values you produced yourself over values from `env:var` or file input
- For paths, quoting also handles spaces: `` `ls "${dir}"` ``
- Values containing a double quote still need care; validate with a regex first when the value is untrusted

```suji
import std:println

path = `mktemp`
label = "my report"

`printf '%s\n' "${label}" > "${path}"`
println(`cat "${path}"`)    # my report
```

## Where Interpolation Does Not Work

Two places look like they should interpolate and do not:

- **Regex literals.** `/${var}/` is not interpolated; the regex engine sees the literal characters `${var}` and raises `[407] Regex error`. Regex patterns must be written out in full.
- **Match patterns.** `match x { "${prefix}-1" => … }` is a parse error. Patterns must be plain literals; compare with the conditional form `match { x == "${prefix}-1" => … }` instead.

```suji
import std:println

prefix = "job"
id = "job-1"

# Interpolate in the comparison, not in the pattern
println(match {
    id == "${prefix}-1" => "first job",
    _ => "other",
})    # first job
```

## Common Patterns

**Building a log line:**

```suji
import std:println
import std:time

level = "WARN"
message = "disk almost full"
stamp = time:now():iso

line = "[${level}] ${message}"
println(line)                       # [WARN] disk almost full
println(stamp::length() > 0)        # true
```

**Assembling a key from parts:**

```suji
import std:println

user_id = 42
resource = "invoice"

key = "user:${user_id}:${resource}"
println(key)    # user:42:invoice
```

**Rendering a list of rows:**

```suji
import std:println

rows = [{ name: "a", n: 1 }, { name: "b", n: 2 }]

lines = rows::map(|r| "${r:name} = ${r:n}")
println(lines::join("\n"))
# a = 1
# b = 2
```

**Writing a generated file:**

```suji
import std:println
import std:io

path = `mktemp`
host = "localhost"
port = 5432

config = """host = "${host}"
port = ${port}
"""

f = io:open(path, true, true)
f::write(config)
f::close()

println(`cat "${path}"`)
# host = "localhost"
# port = 5432
```

## See Also

- [Strings](../fundamentals/data-types/strings.md) - literals, escapes and string methods
- [Shell Integration](shell-integration.md) - running commands built with interpolation
- [Regular Expressions](../fundamentals/data-types/regex.md) - why patterns cannot interpolate
- [Match Expressions](../fundamentals/control-flow/match.md)
