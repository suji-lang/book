# Assignment Operators

Assignment operators set or update variable values.

## Overview

Assignment is how you store values in variables and update them over time.

## Basic Assignment (`=`)

The simplest and most common operator:

```suji
import std:println

# Assign a value to a variable
x = 42
name = "Alice"
active = true

println(x)     # 42
println(name)  # Alice
```

## Compound Assignment

Combine an operation with assignment for concise updates:

### Addition Assignment (`+=`)

```suji
import std:println

x = 10
x += 5  # same as: x = x + 5

println(x)  # 15
```

### Subtraction Assignment (`-=`)

```suji
import std:println

x = 20
x -= 3  # same as: x = x - 3

println(x)  # 17
```

### Multiplication Assignment (`*=`)

```suji
import std:println

x = 5
x *= 4  # same as: x = x * 4

println(x)  # 20
```

### Division Assignment (`/=`)

```suji
import std:println

x = 100
x /= 4  # same as: x = x / 4

println(x)  # 25
```

### Modulo Assignment (`%=`)

```suji
import std:println

x = 17
x %= 5  # same as: x = x % 5

println(x)  # 2
```

### Increment and Decrement (`++`, `--`)

`++` and `--` are **postfix** operators that mutate the variable in place. There are
no prefix forms — `++x` fails with `Increment (++) can only be applied to variables`.
Note that unlike C, `x++` evaluates to the value *after* the increment:

```suji
import std:println

count = 0
count++
count++
println(count)  # 2

count--
println(count)  # 1

x = 1
y = x++
println(y)  # 2 (the incremented value, not 1)
```

## Assignment Semantics

### Rebinding

Assignment in Suji rebinds the variable to a new value:

```suji
import std:println

x = 10
println(x)  # 10

x = 20  # Rebind x to new value
println(x)  # 20

x = "hello"  # Can change type
println(x)  # hello
```

### Immutability

Strings and tuples are immutable. Lists and maps are mutable (some methods modify the value in place):

```suji
import std:println

list = [1, 2, 3]
list::push(4)
println(list)  # [1, 2, 3, 4]
```

## Destructuring Assignment

### Tuple Destructuring

Unpack tuple values into variables. The target list is a **bare comma-separated list
of names** — do not wrap it in parentheses. `(x, y) = (10, 20)` fails with
`Invalid assignment target`:

```suji
import std:println

# Basic destructuring
x, y = (10, 20)
println("x: ${x}, y: ${y}")  # x: 10, y: 20

# Any number of targets, as long as the arity matches
a, b, c, d = (1, 2, 3, 4)
println("${a}, ${b}, ${c}, ${d}")  # 1, 2, 3, 4

# Ignore values with underscore
first, _, third = (1, 2, 3)
println("${first}, ${third}")  # 1, 3
```

**Nested destructuring is not supported.** `a, (b, c), d = …` is a parse error;
unpack in two steps instead:

```suji
import std:println

outer, inner = (1, (2, 3))
p, q = inner

println("${outer}, ${p}, ${q}")  # 1, 2, 3
```

### Multiple Return Values

`return a, b` returns a tuple, which the caller can destructure:

```suji
import std:println

divide_with_remainder = |a, b| {
    return (a / b)::floor(), a % b
}

quotient, remainder = divide_with_remainder(17, 5)
println("${quotient} remainder ${remainder}")  # 3 remainder 2
```

## Assignment vs Equality

Don't confuse assignment (`=`) with equality (`==`):

```suji
import std:println

x = 5  # Assignment: set x to 5

# Equality check
match x == 5 {
    true => println("x is 5"),
    false => {},
}

# Assignment in condition would be an error
# match x = 5 {  # Error: Assignment not allowed in condition
#     ...
# }
```

## Chained Assignment

Assign the same value to multiple variables:

```suji
import std:println

# Right-to-left evaluation
a = b = c = 10

println(a)  # 10
println(b)  # 10
println(c)  # 10
```

## Common Patterns

### Accumulator

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
sum = 0

loop through numbers with num {
    sum += num
}

println(sum)  # 15
```

### Counter

```suji
import std:println

items = [3, -1, 7, 0, 12]
count = 0

loop through items with item {
    match { item > 0 => { count++ } }
}

println("${count} valid items")  # 3 valid items
```

### Swap Values

```suji
import std:println

a = 10
b = 20

# Swap using tuple destructuring
a, b = (b, a)

println("a: ${a}, b: ${b}")  # a: 20, b: 10
```

### Update Configuration

```suji
import std:println

config = {
    theme: "light",
    lang: "en",
    notifications: true
}

# Update single value
config["theme"] = "dark"

# Update multiple values
config["lang"] = "es"
config["notifications"] = false

println(config)  # {theme: dark, lang: es, notifications: false}
```

## Common Pitfalls

### Pitfall 1: Forgetting Immutability

```suji
list = [1, 2, 3]

# push() modifies the list, but returns nil
result = list::push(4)
# list is now [1, 2, 3, 4], and result is nil
```

### Pitfall 2: Assignment in Conditions

```suji
x = 5

# Typo: assignment instead of comparison
# match x = 10 {  # Error
#     ...
# }

# Correct: equality check
match x == 10 {
    true => {
        # ...
    },
    false => {},
}
```

### Pitfall 3: Shadowing vs Mutation

```suji
import std:println

x = 10

# This creates a new binding in inner scope
{
    x = 20  # Rebinds x
    println(x)  # 20
}

# x is now 20 (not shadowing in Suji, actual rebinding)
println(x)  # 20
```

### Pitfall 4: Compound Assignment Type Changes

```suji
import std:println

x = "10"

# This would be an error, so it is commented out:
#   x += 5   ->  Type error: Cannot add string and number

# Convert first
x = x::to_number()
x += 5

println(x)  # 15
```

## Best Practices

### DO:
- Use compound assignment for concise updates
- Use destructuring for multiple return values
- Choose descriptive variable names
- Initialize variables before use
- Keep assignments simple and clear

### DON'T:
- Confuse `=` with `==`
- Forget that operations return new values
- Use overly complex chained assignments
- Mutate external state unexpectedly
- Reuse variable names for different purposes

## Examples

### Running Total

```suji
import std:println

prices = [10.50, 25.00, 15.75, 30.00]
total = 0.0

loop through prices with price {
    total = total + price
    println("Subtotal: $${total}")
}

println("Final total: $${total}")
```

### State Machine

```suji
import std:println

state = "idle"

process_event = |event| {
    state = match (state, event) {
        ("idle", "start") => "running",
        ("running", "pause") => "paused",
        ("paused", "resume") => "running",
        ("running", "stop") => "idle",
        _ => state,
    }
}

process_event("start")
println(state)  # running
```

Note the wildcard arm: a bare identifier in a pattern position is treated as a
**string literal**, not a binding, so `(s, _) => s` would try to match the literal
tuple `("s", "_")`. Use `_` and refer to the outer variable instead.

### Fibonacci Sequence

```suji
import std:println

a = 0
b = 1

loop through (0..10) {
    println(a)
    a, b = (b, a + b)  # Tuple swap and update
}
```

### Build Configuration

```suji
import std:println

config = {}

# Build up configuration
config["env"] = "production"
config["debug"] = false
config["port"] = 8080
config["host"] = "0.0.0.0"

println(config)  # {env: production, debug: false, port: 8080, host: 0.0.0.0}
```

## Next Steps

- Learn about [Arithmetic Operators](arithmetic.md)
- Explore [Language Overview](../overview.md)
- Study [Destructuring](../data-types/tuples.md)

## See Also

- [Language Overview](../overview.md)
- [Arithmetic Operators](arithmetic.md)
- [Tuples](../data-types/tuples.md)
- [Destructuring](../data-types/tuples.md)
