# Examples Gallery

Real-world examples demonstrating Suji's capabilities.

## Overview

Each example includes:
- **Overview**: What the example demonstrates
- **Complete Code**: Full working implementation
- **Step-by-Step Explanation**: Detailed breakdown
- **Variations**: Alternative approaches
- **Exercises**: Practice challenges
- **See Also**: Related concepts and examples

Every code block in this section is a complete program. Copy one into `example.si` and run `suji example.si` — blocks that need input create it in a temp file first.

## Example Categories

### Algorithms

- **[Fibonacci Sequence](fibonacci.md)** - Recursion, memoization and the limits of both
- **[Quicksort](quicksort.md)** - Divide and conquer with pattern matching and list slices

### Functional Programming

- **[Function Composition](composition.md)** - Composing and chaining functions

### Text Processing

- **[Regex Matching](regex-matching.md)** - Pattern matching for text processing

### Automation

- **[CLI Tools](cli-tools.md)** - Building command-line utilities

Task-oriented recipes for files, data formats, configuration and shell scripting live in the [Cookbook](../cookbook/README.md).

## Quick Examples

### Hello World

```suji
import std:println

println("Hello, Suji!")
```

### Calculate Factorial

```suji
import std:println

factorial = |n| {
    match n {
        0 | 1 => 1,
        _ => n * factorial(n - 1),
    }
}

println(factorial(5))  # 120
```

Every match arm whose body is a bare expression needs a trailing comma — including the last one.

### Filter and Transform a List

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

filtered = numbers::filter(|n| n % 2 == 0)
result = filtered::map(|n| n * n)

println(result)  # [4, 16, 36, 64, 100]
```

### Read and Parse JSON

```suji
import std:io
import std:json
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("""{"users": [{"name": "Alice"}, {"name": "Bob"}]}""")
f::close()

file = io:open(path)
data = json:parse(file::read_all())
file::close()

println("Loaded ${data:users::length()} users")  # Loaded 2 users

os:rm(path)
```

### Run a Shell Command

```suji
import std:println

# Backticks return stdout with the trailing newline trimmed
println(`echo hello from the shell`)  # hello from the shell

# A non-zero exit ends the script, so absorb failures in the shell itself
println(`grep nothing /etc/hosts || echo "no match"`)  # no match
```

## Getting Started

1. Browse examples by category
2. Read the overview and prerequisites
3. Study the complete code
4. Review the step-by-step explanation
5. Try the exercises
6. Experiment with variations

## See Also

- [Cookbook](../cookbook/README.md) - Task-oriented recipes
- [Standard Library](../stdlib/README.md) - Built-in modules
- [Functions](../functions/README.md) - Function programming guide
