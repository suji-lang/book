# Language Overview

Suji is a dynamically and strongly typed language designed for simplicity and expressiveness.

## Key Features

- **Dynamic typing**: Variables can hold values of any type
- **Strong typing**: Type safety enforced at runtime
- **Higher-order functions**: Functions are first-class values
- **Closures**: Functions can capture variables from their lexical scope
- **Pattern matching**: `match` expressions are the only conditional construct — there is no `if`, `else`, `while` or `for`
- **String interpolation**: Built-in `${expression}` syntax
- **Regular expressions**: Native regex support with `/pattern/` literals
- **Shell integration**: Execute commands with backticks
- **Decimal arithmetic**: A single fixed-precision decimal number type (~28–29 significant digits), so `0.1 + 0.2 == 0.3`
- **Pipe operators**: Both stream pipes (`|`) and function pipes (`|>` and `<|`)

## Design Philosophy

Suji is designed to be:
- **Simple**: Familiar syntax that's easy to learn
- **Expressive**: Powerful features that reduce boilerplate
- **Practical**: Built-in support for common tasks (JSON, YAML, shell commands)
- **Type-safe**: Runtime type checking prevents common errors
- **Functional**: First-class functions and transformations (`map`, `filter`, `fold`) that return new collections

## Type System

Suji is dynamically typed but strongly typed:
- Variables don't have type annotations
- Types are checked at runtime
- Type mismatches raise clear runtime errors
- Type checking methods available for runtime validation

## Syntax Highlights

### Functions

Functions are lambdas bound to a name; there is no `fn` or `def` declaration form.

```suji
# Function definition
add = |x, y| {
    return x + y
}

# Implicit return (last expression)
multiply = |x, y| {
    x * y
}

# Single expression (braces optional)
square = |x| x * x
```

### Pattern Matching

`match` is Suji's only conditional construct — there is no `if`/`else`. An arm
whose body is a bare expression must be followed by a comma, including the last
arm.

```suji
import std:println

x = 3

# Value matching
result = match x {
    1 => "one",
    2 | 3 => "small",
    _ => "other",
}

# Conditional matching
status = match {
    x > 10 => "large",
    x > 0 => "positive",
    _ => "zero or negative",
}

println(result)  # small
println(status)  # positive
```

### String Interpolation

```suji
name = "Alice"
age = 30
message = "Hello, ${name}! You are ${age} years old."
# Works with both single and double quotes
message2 = 'Hello, ${name}!'
```

### Method Calls

```suji
# Method syntax with ::
text = "hello"
length = text::length()
upper = text::upper()

# List methods
numbers = [1, 2, 3]
doubled = numbers::map(|x| x * 2)
sum = numbers::sum()
```

### Pipe Operators

```suji
import std:println
import std:io

# Function pipe (|>)
result = 5 |> (|x| x * 2) |> (|x| x + 1)
println(result)  # 11

# Stream pipe (|) — connects closures and shell templates
producer = || {
    println("alpha")
    println("beta")
}

consumer = || {
    lines = io:stdin::read_lines()
    println("kept ${lines::length()}")
}

producer() | `grep a` | consumer()  # kept 2
```

## Standard Library

Suji includes a comprehensive standard library:

- **Data formats**: JSON, YAML, TOML, CSV parsing and generation
- **I/O**: File operations, streams, standard input/output
- **System**: Environment variables, command-line arguments, OS utilities
- **Math**: Trigonometric functions, logarithms, constants
- **Crypto**: Hash functions (MD5, SHA-1, SHA-256, SHA-512), HMAC
- **Time**: Current time, sleep, ISO-8601 parsing and formatting
- **UUID**: Version 4 and 5 UUID generation
- **Encoding**: Base64, hex, percent encoding
- **Random**: Random numbers and string generation
- **Path**: Cross-platform path utilities
- **Dotenv**: Loading `.env` files into the environment

Nothing is available without an import — there is no prelude, so even printing
needs `import std:println`.

## File Extension

Suji programs use the `.si` file extension.

## Version

Current version: 0.1.22

See [Language Versions](../appendices/versions.md) for detailed version history.

## Next Steps

- Learn about [Data Types](data-types/README.md)
- Explore [Operators](operators/README.md)
- Study [Control Flow](control-flow/README.md)
- Check out [Functions](../functions/README.md)
