# Quick Start

Welcome to Suji! This guide will get you up and running in minutes.

## What You'll Learn

In this quick start, you'll learn:
- How to write your first Suji program
- Basic syntax and structure
- Core language features
- How to run Suji programs

## Prerequisites

Make sure you have Suji installed. If not, see the [Installation](installation.md) guide.

## Your First Program

Let's start with the classic "Hello, World!":

```suji
import std:println

"Hello, World!" |> println
```

Save this in a file called `hello.si` and run it:

```bash
suji hello.si
```

You should see:
```
Hello, World!
```

## Variables and Functions

Suji makes it easy to work with variables and functions:

```suji
import std:println

# Variables are dynamically typed
name = "Alice"
age = 30

# Functions use the |params| syntax
greet = |person| {
    "Hello, ${person}!"
}

# Call the function
message = greet(name)
println(message)  # Hello, Alice!
```

## Lists and Loops

Working with collections is straightforward:

```suji
import std:println

# Create a list
numbers = [1, 2, 3, 4, 5]

# Loop through items
loop through numbers with n {
    println(n)
}
```

## Pattern Matching

Suji has powerful pattern matching for control flow:

```suji
import std:println

classify = |n| {
    match n {
        0 => "zero",
        1 | 2 | 3 => "small",
        _ => match {
            n < 10 => "medium",
            _ => "large",
        },
    }
}

println(classify(0))   # zero
println(classify(2))   # small
println(classify(5))   # medium
println(classify(42))  # large
```

## Method Chains and Pipes

Transformations read left to right. Chain methods with `::`:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

result = numbers::map(|x| x * 2)::filter(|x| x > 5)::sum()

println(result)  # 24
```

Or feed a value into named functions with the pipe-apply operator `|>`, which
passes the value on the left as the single argument to the function on the right:

```suji
import std:println

double_all = |xs| xs::map(|x| x * 2)
big_only = |xs| xs::filter(|x| x > 5)
total = |xs| xs::sum()

result = [1, 2, 3, 4, 5]
    |> double_all
    |> big_only
    |> total

println(result)  # 24
```

Suji also has a shell-style `|` pipeline for streaming data between closures and
shell commands — see [Pipe](../fundamentals/operators/pipe.md) for the
difference between the two.

## Data Transformation Example

Here's a more realistic example showing data transformation:

```suji
import std:println
import std:json

# Sample data
users = [
  {name: "Alice", age: 30, role: "admin"},
  {name: "Bob", age: 25, role: "user"},
  {name: "Charlie", age: 35, role: "user"},
  {name: "Diana", age: 28, role: "admin"}
]

# Find adult admins
filtered = users::filter(|u| u:age >= 30)
admins = filtered::filter(|u| u:role == "admin")
adult_admins = admins::map(|u| u:name)

println(adult_admins)  # ["Alice"]
```

## Working with JSON

Suji has excellent support for JSON and other data formats:

```suji
import std:println
import std:json

# Parse JSON
data = json:parse("""
{
  "name": "Suji",
  "version": "0.1.0",
  "features": ["pipes", "pattern matching", "shell integration"]
}
""")

println(data:name)     # Suji
println(data:version)  # 0.1.0

# Generate JSON
output = json:generate({
  status: "success",
  count: 42
})

println(output)  # {"count":42,"status":"success"}
```

`json:generate` writes object keys in sorted order.

## Shell Integration

Execute shell commands directly in your code:

```suji
import std:println

# A backtick template runs a command and evaluates to its output
host = `uname -s`
println(host)

# Interpolation works inside the command
name = "Suji"
greeting = `echo Hello from ${name}`
println(greeting)  # Hello from Suji
```

The result is the command's standard output with the trailing newline removed. A
command that exits non-zero raises a runtime error and stops the program, so
guard risky commands (for example `` `grep x file || true` ``).

## Function Composition

Compose functions for cleaner code:

```suji
import std:println

double = |x| x * 2
increment = |x| x + 1

# Compose functions with >>
double_then_increment = double >> increment

result = double_then_increment(5)
println(result)  # 11
```

## Next Steps

Now that you've seen the basics, explore more:

- [Hello World](hello-world.md) - Detailed breakdown of your first program
- [CLI & REPL](cli-repl.md) - Learn about the command-line interface and REPL
- [Language Overview](../fundamentals/overview.md) - Understand Suji's design philosophy
- [Data Types](../fundamentals/data-types/README.md) - Learn about all available types
- [Operators](../fundamentals/operators/README.md) - Master Suji's operators

## Try It Yourself

Experiment with these examples:

1. **Modify the greeting**: Change the `greet` function to include the age
2. **Filter numbers**: Use pipes to find all even numbers in a list
3. **Parse data**: Load a JSON file and extract specific fields
4. **Combine patterns**: Use pattern matching inside a loop

## Common Beginner Mistakes

- **Forgetting imports**: nothing is available without an import, not even
  `println`, and that applies in the REPL too
- **Leaving off the last comma in a `match`**: an arm whose body is a bare
  expression needs a trailing comma, including the final arm
- **Reaching for `if`**: Suji has no `if`, `else`, `for` or `while` — `match` and
  `loop` cover their jobs
- **Missing colons in maps**: use `key: value`, not `key = value`
- **Expecting truthiness**: `&&`, `||` and `!` require real booleans, so
  `value || "default"` is a type error

## Getting Help

If you get stuck:
- Read the error message — diagnostics point at the offending span and carry a
  numeric code you can look up in [Error Codes](../appendices/error-codes.md)
- Use the REPL to experiment interactively
- Refer to the [Standard Library](../stdlib/README.md) reference
- Review the [Examples](../examples/README.md) section

Happy coding with Suji!
