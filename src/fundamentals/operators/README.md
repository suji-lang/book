# Operators

Operators are special symbols that perform operations on values and expressions.

## Overview

Suji provides a rich set of operators for arithmetic, comparison, logic, pattern matching, and data flow.

## Operator Categories

### Arithmetic Operators

Perform mathematical calculations:

```suji
import std:println

a = 10
b = 3

println(a + b)    # 13 (addition)
println(a - b)    # 7 (subtraction)
println(a * b)    # 30 (multiplication)
println(a / b)    # 3.3333333333333333333333333333 (division)
println((a / b)::floor())   # 3 (integer division via floor)
println(a % b)    # 1 (modulo/remainder)
println(a ^ b)    # 1000 (exponentiation)
println(-a)       # -10 (negation)
```

[Learn more about Arithmetic Operators →](arithmetic.md)

### Relational Operators

Compare values and return booleans:

```suji
import std:println

x = 5
y = 10

println(x == y)   # false (equal to)
println(x != y)   # true (not equal to)
println(x < y)    # true (less than)
println(x <= y)   # true (less than or equal)
println(x > y)    # false (greater than)
println(x >= y)   # false (greater than or equal)
```

[Learn more about Relational Operators →](relational.md)

### Logical Operators

Combine boolean expressions. Both operands must already be booleans — Suji has no
truthiness, and there are no `and` / `or` / `not` keywords:

```suji
import std:println

a = true
b = false

println(a && b)   # false (AND)
println(a || b)   # true (OR)
println(!a)       # false (NOT)
```

[Learn more about Logical Operators →](logical.md)

### Assignment Operators

Assign and update variables:

```suji
import std:println

x = 10

# Basic assignment
x = 20

# Compound assignment
x = x + 5    # or: x += 5
x = x - 3    # or: x -= 3
x = x * 2    # or: x *= 2
x = x / 4    # or: x /= 4
x = x % 3    # or: x %= 3

println(x)
```

[Learn more about Assignment Operators →](assignment.md)

### Matching Operators

Test patterns with regular expressions:

```suji
import std:println

text = "user@example.com"

# Match operator
is_email = text ~ /^[^@]+@[^@]+$/
println(is_email)  # true

# Negative match
not_number = text !~ /^\d+$/
println(not_number)  # true
```

[Learn more about Matching Operators →](matching.md)

### Pipe and Composition Operators

Suji has three distinct pipe-ish operators plus two composition operators. They are
easy to confuse, so keep them straight:

| Operator | Name | Meaning |
|---|---|---|
| `\|` | pipeline | stdout of one stage becomes stdin of the next |
| `\|>` | forward apply | `value \|> f` is `f(value)` |
| `<\|` | backward apply | `f <\| value` is `f(value)` |
| `>>` | compose | `f >> g` is "f then g" |
| `<<` | compose (reverse) | `f << g` is "g then f" |

There is no `|<` operator.

```suji
import std:println

double = |x| x * 2
inc = |x| x + 1

# Pipe-apply passes a value into a function
println(5 |> double)          # 10
println(double <| 5)          # 10
println(5 |> double |> inc)   # 11

# Composition builds a new function instead of calling one
then_inc = double >> inc
println(then_inc(5))          # 11

inc_first = double << inc
println(inc_first(5))         # 12
```

[Learn more about the Pipeline Operator →](pipe.md) ·
[Pipe Apply →](pipe-apply.md) ·
[Function Composition →](composition.md)

## Operator Precedence

Operators are evaluated in a specific order. The full table, **lowest to highest**
precedence:

1. **Assignment** (`=`, including destructuring `a, b = …`)
2. **Compound assignment** (`+=`, `-=`, `*=`, `/=`, `%=`)
3. **Backward pipe-apply** (`<|`, right-associative)
4. **Forward pipe-apply** (`|>`)
5. **Pipeline** (`|`)
6. **Function composition** (`>>`, `<<`)
7. **Logical OR** (`||`)
8. **Logical AND** (`&&`)
9. **Regex match** (`~`, `!~`)
10. **Equality** (`==`, `!=`)
11. **Ordering** (`<`, `<=`, `>`, `>=`)
12. **Range** (`..`, `..=`)
13. **Addition, Subtraction** (`+`, `-`)
14. **Multiplication, Division, Modulo** (`*`, `/`, `%`)
15. **Unary** (`-`, `!`)
16. **Exponentiation** (`^`, right-associative)
17. **Postfix** (`()`, `[]`, `::`, `:`, `++`, `--`)

Note that `||` binds *less* tightly than `&&`, and both bind less tightly than the
regex operators — which in turn bind less tightly than `==`. There is no `.` member
access operator: `::` calls a method and `:` reads a map key.

### Precedence Examples

```suji
import std:println

# Without parentheses
result = 2 + 3 * 4
println(result)  # 14 (multiplication first)

# With parentheses
result = (2 + 3) * 4
println(result)  # 20 (addition first)

# Exponentiation before multiplication
result = 2 * 3 ^ 2
println(result)  # 18 (3^2 = 9, then 2*9)

# Comparison before logical
result = 5 > 3 && 10 < 20
println(result)  # true (comparisons first, then &&)
```

## Associativity

When operators have the same precedence, associativity determines evaluation order:

### Left-Associative

Most operators evaluate left to right:

```suji
import std:println

# Left to right: (10 - 3) - 2
result = 10 - 3 - 2
println(result)  # 5

# Left to right: (12 / 3) / 2
result = 12 / 3 / 2
println(result)  # 2
```

### Right-Associative

Exponentiation and assignment evaluate right to left:

```suji
import std:println

# Right to left: 2 ^ (3 ^ 2)
result = 2 ^ 3 ^ 2
println(result)  # 512 (2^9)

# Assignment chains (right to left)
a = b = c = 10
println(a)  # 10
```

## Overloading

Some operators work differently based on operand types:

### Addition (`+`)

`+` works on two numbers, two strings, or two lists. It **never mixes types**:

```suji
import std:println

# Numbers: arithmetic addition
println(5 + 3)  # 8

# Strings: concatenation
println("Hello" + " " + "World")  # Hello World

# Lists: concatenation
println([1, 2] + [3, 4])  # [1, 2, 3, 4]

# Mixing types is a type error:
#   "a" + 1     ->  Type error: Cannot add string and number
# Convert or interpolate instead:
println("a" + 1::to_string())  # a1
println("a${1}")               # a1
```

### Multiplication (`*`)

`*` is numbers-only. Unlike some scripting languages, Suji has **no** string or list
repetition operator:

```suji
import std:println

# Numbers: arithmetic multiplication
println(5 * 3)  # 15

# "Ha" * 3   ->  Type error: Cannot multiply string and number
# [1, 2] * 3 ->  Type error: Cannot multiply list and number

# Use the repeat() method for strings:
println("Ha"::repeat(3))  # HaHaHa
```

## Short-Circuit Evaluation

Logical operators use short-circuit evaluation:

### AND (`&&`)

If left side is `false`, right side is not evaluated:

```suji
import std:println

# Right side not evaluated, so no division-by-zero error
result = false && (10 / 0)
println(result)  # false
```

### OR (`||`)

If left side is `true`, right side is not evaluated:

```suji
import std:println

# Right side not evaluated
result = true || (10 / 0)
println(result)  # true
```

This is useful for safe operations:

```suji
import std:println

# Safe property access
user = nil
name_present = user != nil && user:name != nil
println(name_present)  # false (no error accessing nil)
```

Because `&&` and `||` require **boolean** operands, there is no `x || "default"`
idiom in Suji — `nil || "default"` is a type error. Use `match` (or
`map::get(key, default)`) instead:

```suji
import std:println

user_setting = nil

config_value = match user_setting {
    nil => "default",
    _ => user_setting,
}
println(config_value)  # default

# For maps, get() already takes a default
settings = {theme: "dark"}
println(settings::get("lang", "en"))  # en
```

## Best Practices

### DO:
- Use parentheses for clarity in complex expressions
- Understand precedence to avoid bugs
- Leverage short-circuit evaluation for safety
- Use pipes for readable data transformations
- Keep expressions simple and readable

### DON'T:
- Write deeply nested expressions without parentheses
- Rely on obscure precedence rules
- Ignore short-circuit evaluation opportunities
- Chain too many operations in one expression
- Sacrifice readability for brevity

## Quick Reference

| Category | Operators | Example |
|----------|-----------|---------|
| **Arithmetic** | `+`, `-`, `*`, `/`, `%`, `^`, `-` (unary) | `a + b`, `a ^ 2` |
| **Relational** | `==`, `!=`, `<`, `<=`, `>`, `>=` | `x < y` |
| **Logical** | `&&`, `\|\|`, `!` | `a && b` |
| **Assignment** | `=`, `+=`, `-=`, `*=`, `/=`, `%=` | `x += 5` |
| **Matching** | `~`, `!~` | `text ~ /pattern/` |
| **Range** | `..`, `..=` | `0..5` |
| **Pipeline** | `\|` | `` `cat f` \| stage() `` |
| **Pipe apply** | `\|>`, `<\|` | `data \|> transform` |
| **Composition** | `>>`, `<<` | `f >> g` |
| **Postfix** | `()`, `[]`, `::`, `:`, `++`, `--` | `xs::length()`, `m:key` |

## Next Steps

Explore each operator category in detail:

1. **[Arithmetic Operators](arithmetic.md)** - Mathematical operations
2. **[Relational Operators](relational.md)** - Equality and ordering
3. **[Logical Operators](logical.md)** - Boolean logic
4. **[Assignment Operators](assignment.md)** - Variable assignment
5. **[Matching Operators](matching.md)** - Regex matching
6. **[Pipeline Operator](pipe.md)** - stdin/stdout pipelines
7. **[Pipe Apply](pipe-apply.md)** - Applying a value to a function
8. **[Function Composition](composition.md)** - Building functions from functions

## See Also

- [Operator Precedence Table](../../appendices/precedence.md)
- [Expression Syntax](../overview.md#syntax-highlights)
- [Pattern Matching](../control-flow/match.md)
- [Functions](../../functions/)
