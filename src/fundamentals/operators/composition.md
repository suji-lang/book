# Function Composition

Function composition operators combine functions to create new functions.

## Overview

Composition creates a new function by chaining two functions together, where the output of one becomes the input of the next. Suji provides two composition operators: `>>` (compose right) and `<<` (compose left).

Both sit at the same precedence level, between the pipeline operator `|` and `||`. They
are distinct from the pipe-apply operators `|>` / `<|`, which call a function
immediately rather than building a new one.

## Operators

### Compose Right (`>>`)

Chains functions left-to-right: `f >> g` means "first apply `f`, then apply `g` to the result".

```suji
import std:println

# Define simple functions
add2 = |x| x + 2
mul3 = |x| x * 3

# Compose: add 2, then multiply by 3
f = add2 >> mul3

println(f(5))  # (5 + 2) * 3 = 21
```

**Syntax**: `function1 >> function2`

**Evaluation**: `(f >> g)(x)` is equivalent to `g(f(x))`

### Compose Left (`<<`)

Chains functions right-to-left: `f << g` means "first apply `g`, then apply `f` to the result".

```suji
import std:println

# Define simple functions
add2 = |x| x + 2
mul3 = |x| x * 3

# Compose: multiply by 3, then add 2
f = add2 << mul3

println(f(5))  # (5 * 3) + 2 = 17
```

**Syntax**: `function1 << function2`

**Evaluation**: `(f << g)(x)` is equivalent to `f(g(x))`

## Comparison

```suji
import std:println

add2 = |x| x + 2
mul3 = |x| x * 3

# Left-to-right (>>)
f1 = add2 >> mul3
println(f1(5))  # (5 + 2) * 3 = 21

# Right-to-left (<<)
f2 = add2 << mul3
println(f2(5))  # (5 * 3) + 2 = 17

# Equivalence
f3 = mul3 << add2
println(f3(5))  # Same as f1: (5 + 2) * 3 = 21
```

**Relationship**: `f >> g` is equivalent to `g << f`

## Common Use Cases

### Data Transformation Pipelines

```suji
import std:println

# Processing functions
trim = |s| s::trim()
upper = |s| s::upper()
exclaim = |s| "${s}!"

# Compose processing pipeline
process = trim >> upper >> exclaim

println(process("  hello  "))  # HELLO!
```

### Number Processing

```suji
import std:println

# Math operations
square = |x| x * x
negate = |x| -x
add10 = |x| x + 10

# Complex transformation
transform = square >> negate >> add10

println(transform(3))  # -(3^2) + 10 = -9 + 10 = 1
```

### Validation and Transformation

```suji
import std:println

# Validators
is_positive = |x| x > 0
is_even = |x| x % 2 == 0

# Transformers
double = |x| x * 2
add5 = |x| x + 5

# Combined pipeline
safe_transform = |x| {
    match (is_positive(x) && is_even(x)) {
        true => {
            pipeline = double >> add5
            pipeline(x)
        },
        false => nil,
    }
}

println(safe_transform(4))   # (4 * 2) + 5 = 13
println(safe_transform(3))   # nil (not even)
println(safe_transform(-2))  # nil (not positive)
```

### Function Factories

```suji
import std:println

# Create composable operations
make_adder = |n| { |x| x + n }
make_multiplier = |n| { |x| x * n }

# Build complex functions
add10 = make_adder(10)
mul2 = make_multiplier(2)

# Compose dynamically
transform = add10 >> mul2

println(transform(5))  # (5 + 10) * 2 = 30
```

## Chaining Compositions

Composition is associative, allowing natural chaining:

```suji
import std:println

f = |x| x + 1
g = |x| x * 2
h = |x| x * x

# All equivalent:
pipeline1 = (f >> g) >> h
pipeline2 = f >> (g >> h)
pipeline3 = f >> g >> h

println(pipeline1(3))  # 64
println(pipeline2(3))  # 64
println(pipeline3(3))  # 64

# Calculation: ((3 + 1) * 2)^2 = (8)^2 = 64
```

## Composition vs Pipe Apply

Composition creates a **new function**, while pipe apply **executes immediately**:

```suji
import std:println

add2 = |x| x + 2
mul3 = |x| x * 3

# Composition: creates a function
composed = add2 >> mul3
result1 = composed(5)     # Call the composed function
println(result1)  # 21

# Pipe apply: executes immediately
result2 = 5 |> add2 |> mul3
println(result2)  # 21

# Key difference: composition is reusable
println(composed(10))  # 36
println(composed(15))  # 51
```

## With Higher-Order Functions

Composition works elegantly with map, filter, etc.:

```suji
import std:println

add1 = |x| x + 1
double = |x| x * 2

# Compose transformation
transform = add1 >> double

# Apply to list
numbers = [1, 2, 3, 4, 5]
result = numbers::map(transform)

println(result)  # [4, 6, 8, 10, 12]
```

## Pattern: Method Chain Composition

```suji
import std:println

# String processing pipeline
process_text = 
    (|s| s::trim()) >>
    (|s| s::lower()) >>
    (|s| s::split(" "))

text = "  HELLO WORLD  "
words = process_text(text)
println(words)  # [hello, world]
```

## Advanced Patterns

### Conditional Composition

```suji
import std:println

safe_divide = |divisor| {
    |x| {
        match divisor != 0 {
            true => x / divisor,
            false => nil,
        }
    }
}

# Compose with safe operations
add10 = |x| x + 10
divide_by_2 = safe_divide(2)

pipeline = add10 >> divide_by_2

println(pipeline(5))  # 7.50 - (5 + 10) / 2
```

### N-ary Function Composition

```suji
import std:println

# Compose functions that take multiple arguments
add = |a, b| a + b
multiply_by_3 = |x| x * 3

# Suji has no partial-application syntax, so wrap the call in a one-argument lambda
add5 = |x| add(x, 5)
transform = add5 >> multiply_by_3

println(transform(10))  # (10 + 5) * 3 = 45
```

## Best Practices

### DO:
- Use `>>` for left-to-right reading (more intuitive)
- Compose pure functions (no side effects)
- Create reusable function pipelines
- Name composed functions descriptively
- Keep composed functions simple and focused

### DON'T:
- Compose functions with side effects (unpredictable)
- Create overly complex compositions (hard to debug)
- Forget that composition creates new functions
- Mix composition with imperative code
- Ignore function signatures (ensure types match)

## Composition Equivalences

These are identities, not runnable Suji (`≡` is not an operator):

```text
f >> g  ≡  |x| g(f(x))
f << g  ≡  |x| f(g(x))

Associativity:
(f >> g) >> h  ≡  f >> (g >> h)
(f << g) << h  ≡  f << (g << h)

Relationship:
f >> g  ≡  g << f
```

And here they are as executable checks:

```suji
import std:println

f = |x| x + 1
g = |x| x * 2

println((f >> g)(5) == g(f(5)))  # true
println((f << g)(5) == f(g(5)))  # true
println((f >> g)(5) == (g << f)(5))  # true
```

## Examples

### URL Builder

```suji
import std:println

# Component functions
add_protocol = |url| "https://${url}"
add_path = |url| "${url}/api"
add_version = |url| "${url}/v1"

# Compose URL builder
build_api_url = add_protocol >> add_path >> add_version

url = build_api_url("example.com")
println(url)  # https://example.com/api/v1
```

### Data Sanitization

```suji
import std:println

# Sanitization steps. There is no regex replace, so stripping unwanted characters
# means filtering them out one at a time (strings need ::to_list() to be iterable).
remove_whitespace = |s| s::trim()
remove_special_chars = |s| {
    kept = ""
    loop through s::to_list() with ch {
        match { ch ~ /[A-Za-z0-9]/ => { kept = kept + ch } }
    }
    kept
}
to_lowercase = |s| s::lower()

# Compose sanitizer
sanitize = remove_whitespace >> remove_special_chars >> to_lowercase

raw = "  Hello@World!  "
clean = sanitize(raw)
println(clean)  # helloworld
```

### Numeric Transformation

```suji
import std:println

# Math operations. Note `^` requires an integer exponent, so `x ^ 0.5` is an error —
# square roots use the number method `::sqrt()`.
abs_val = |x| x::abs()
square = |x| x * x
root = |x| x::sqrt()

# Compose distance calculation
distance = abs_val >> square >> root

println(distance(-5))  # 5 - abs(-5) = 5, 5^2 = 25, sqrt(25) = 5
```

## See Also

- [Pipe Apply Operators](pipe-apply.md) - Execute pipelines immediately
- [Higher-Order Functions](../../functions/higher-order.md) - Functions that work with functions
- [Function Basics](../../functions/basics.md) - Function fundamentals
- [Pipe Operator](pipe.md) - Stream composition
