# The Suji Programming Language

Welcome to the Suji Programming Language documentation!

Suji is a dynamically-typed scripting language designed for data manipulation, scripting tasks, and general-purpose programming. It combines the expressiveness of modern scripting languages with powerful features like pattern matching, pipes, and native shell integration.

## Why Suji?

Suji is built for developers who need:
- **Reliable arithmetic** - Decimal number semantics eliminate floating-point surprises
- **Data transformation power** - First-class pipes and functional programming patterns
- **Shell integration** - Execute commands naturally, without string escaping hell
- **Rapid prototyping** - Dynamic typing with strict runtime type checking
- **Readable code** - Clean syntax inspired by functional languages and modern scripting

## Who Is Suji For?

Suji is ideal for:
- **Data engineers** processing JSON, CSV, YAML, and other formats
- **DevOps engineers** writing automation scripts and configuration tools
- **Backend developers** building CLI tools and data pipelines
- **Anyone** who wants a more expressive alternative to shell scripts

## Key Features

### One Number Type
There is no `int` versus `float` split: every number is a base-10 decimal with 28
digits of precision, so arithmetic behaves the way you would work it out on paper.

```suji
import std:println

println(0.1 + 0.2)          # 0.3, not 0.30000000000000004
println(0.1 + 0.2 == 0.3)   # true
```

### Pipes and Method Chains
Transform data left to right, either by chaining methods with `::` or by piping
values into functions with `|>`:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

println(numbers::map(|x| x * 2)::filter(|x| x > 5)::sum())  # 24

total = |xs| xs::sum()
println(numbers |> total)  # 15
```

### Pattern Matching
`match` is Suji's only conditional construct, in a value form and a
condition form:

```suji
import std:println

describe = |value| match {
    value == 0 => "zero",
    value < 0 => "negative",
    value < 10 => "single digit",
    _ => "large",
}

println(describe(0))    # zero
println(describe(7))    # single digit
println(describe(900))  # large
```

### Native Shell Integration
Run commands with backtick templates; the result is the command's output:

```suji
import std:println

name = "Suji"

println(`echo Hello from ${name}`)  # Hello from Suji
println(`uname -s`::length() > 0)   # true
```

### String Interpolation
Built-in `${expression}` syntax, in every kind of string literal and in shell
templates:

```suji
import std:println

name = "Alice"
age = 30

println("Hello, ${name}! You are ${age} years old.")
println("Next year: ${age + 1}")
```

### A Small Set of Types
Numbers, booleans, strings, lists, maps, tuples, regular expressions, streams,
functions and `nil` — that is the whole list:

```suji
import std:println

user = {
    name: "Alice",
    age: 30,
    tags: ["admin", "developer"],
    email: /^[^@]+@[^@]+$/,
}

println(user:name)                        # Alice
println(user:tags::length())              # 2
println("alice@example.com" ~ user:email) # true
```

### Standard Library
Data formats, filesystem and process access, time, hashing, encoding and more —
all explicitly imported:

```suji
import std:json
import std:yaml
import std:csv
import std:io
import std:path
import std:time
import std:crypto
```

## Quick Example

Here's what Suji code looks like:

```suji
import std:println
import std:json

# Define a data structure
users = [
    {name: "Alice", age: 30, role: "admin"},
    {name: "Bob", age: 25, role: "user"},
    {name: "Charlie", age: 35, role: "user"},
]

# Transform it with a method chain
adult_admins = users
    ::filter(|u| u:age >= 30)
    ::filter(|u| u:role == "admin")
    ::map(|u| u:name)

println(adult_admins)  # [Alice]

# Convert to JSON
output = json:generate({
    admin_users: adult_admins,
    count: adult_admins::length(),
})

println(output)  # {"admin_users":["Alice"],"count":1}
```

## Philosophy

Suji follows these design principles:

1. **Clarity over cleverness** - Code should be easy to read and understand
2. **Explicit is better than implicit** - Imports, types, and control flow are clear
3. **Composability** - Small, focused functions that work together
4. **Practical defaults** - Common cases should be easy, edge cases possible
5. **Progressive disclosure** - Learn the basics quickly, discover advanced features gradually

[Language Design](development/design.md) covers the concrete decisions these
principles led to, and what each one costs.

## Language Comparison

Coming from another language? Here's how Suji compares:

| Feature | Python | JavaScript | Bash | Suji |
|---------|--------|------------|------|------|
| Dynamic typing | Yes | Yes | Yes | Yes |
| Default numbers are exact decimals | No | No | No | Yes |
| Shell command literals | No | No | Yes | Yes |
| Pipelines in the language | No | No | Yes | Yes (`\|`, `\|>`, `<\|`) |
| Pattern matching | Yes (3.10+) | No | No | Yes (`match`) |
| `if`/`for`/`while` statements | Yes | Yes | Yes | No — `match` and `loop` |
| Exceptions | Yes | Yes | No | No — errors are fatal |
| Truthiness | Yes | Yes | Yes | No — booleans only |
| JSON/YAML/TOML/CSV in the stdlib | Partly | JSON only | No | Yes |

Suji is pre-1.0 (currently version 0.1.22) and is installed by building from
source. The two most common surprises for newcomers are that there is no `if`
statement and that runtime errors cannot be caught — see
[Conditional Logic](fundamentals/control-flow/conditionals.md) and
[Error Handling](advanced/error-handling.md).

## Getting Started

Ready to start? Follow these steps:

1. **[Installation](getting-started/installation.md)** - Install Suji on your system
2. **[Quick Start](getting-started/quick-start.md)** - Write your first programs
3. **[Hello World](getting-started/hello-world.md)** - Detailed first program walkthrough
4. **[CLI & REPL](getting-started/cli-repl.md)** - Master the command-line tools

## Documentation Structure

This book is organized into several main sections:

### For Beginners
- **[Getting Started](getting-started/quick-start.md)** - Installation, first steps, and basic usage
- **[Language Fundamentals](fundamentals/overview.md)** - Core language features and syntax
- **[Functions and Modules](functions/README.md)** - Structure and organize your code

### For Practitioners
- **[Standard Library Reference](stdlib/README.md)** - Every module, function and signature
- **[Cookbook](cookbook/README.md)** - Practical recipes for common tasks
- **[Examples](examples/README.md)** - Complete example programs

### For Deep Divers
- **[Advanced Topics](advanced/error-handling.md)** - Error handling, pattern matching, shell integration, performance
- **[Development](development/contributing.md)** - Building, testing and contributing
- **[Appendices](appendices/syntax-reference.md)** - Syntax reference, precedence, error codes, glossary

## Community and Support

- **GitHub**: [github.com/suji-lang/suji](https://github.com/suji-lang/suji)
- **Issues**: [Report bugs and request features](https://github.com/suji-lang/suji/issues)

## License

Suji is open source, released under a 3-clause BSD license. See the `LICENSE`
file in the repository for the full text.

---

Enjoy exploring Suji! We hope you find it as expressive and productive as we do.

