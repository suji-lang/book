# Arithmetic Operators

Arithmetic operators perform mathematical calculations on numeric values.

## Overview

Suji provides all standard arithmetic operators for working with numbers.

## Basic Operations

### Addition (`+`)

Add two numbers:

```suji
import std:println

println(5 + 3)       # 8
println(10.5 + 2.3)  # 12.8
println(-5 + 10)     # 5
```

`+` also concatenates two strings or two lists, but it **never mixes types**:
`"a" + 1` is a type error. Use `::to_string()` or string interpolation instead.

```suji
import std:println

# String concatenation
println("Hello" + " " + "World")  # Hello World

# List concatenation
println([1, 2] + [3, 4])  # [1, 2, 3, 4]

# Mixing types is a type error, so convert or interpolate:
println("count: " + 3::to_string())  # count: 3
println("count: ${3}")               # count: 3
```

### Subtraction (`-`)

Subtract one number from another:

```suji
import std:println

println(10 - 3)      # 7
println(20.5 - 5.5)  # 15
println(5 - 10)      # -5
```

### Multiplication (`*`)

Multiply two numbers:

```suji
import std:println

println(5 * 3)       # 15
println(2.5 * 4)     # 10
println(-3 * 4)      # -12
```

`*` is **numbers only**. There is no repetition operator for strings or lists —
`"Ha" * 3` and `[1, 2] * 3` are both type errors. Use `::repeat(n)` for strings:

```suji
import std:println

println("Ha"::repeat(3))  # HaHaHa

# "Ha" * 3   ->  Type error: Cannot multiply string and number
# [1, 2] * 3 ->  Type error: Cannot multiply list and number
```

Lists have no `repeat` method; build one with a loop if you need it:

```suji
import std:println

repeated = []
loop through 0..3 {
    repeated = repeated + [1, 2]
}

println(repeated)  # [1, 2, 1, 2, 1, 2]
```

### Division (`/`)

Divide one number by another. Suji has a single decimal number type, so division is
always decimal division. Non-terminating results are rounded to 28 significant digits:

```suji
import std:println

println(10 / 2)      # 5
println(10 / 3)      # 3.3333333333333333333333333333
println(15.0 / 4.0)  # 3.75
```

Dividing by zero is a runtime error that terminates the program — there is no
`Infinity` and no way to catch it, so check the divisor first.

### Integer Division

Suji uses decimal division. To get integer division, use the `floor()` method:

```suji
import std:println

println((10 / 3)::floor())     # 3
println((17 / 5)::floor())     # 3
println((-10 / 3)::floor())    # -4 (rounds down)
```

There is no `//` integer-division operator; `floor()` is the idiom.

### Modulo (`%`)

Get remainder after division:

```suji
import std:println

println(10 % 3)      # 1
println(17 % 5)      # 2
println(20 % 4)      # 0 (evenly divisible)

# Useful for checking even/odd
println(7 % 2 == 0)  # false (odd)
println(8 % 2 == 0)  # true (even)
```

### Exponentiation (`^`)

Raise a number to a power. The exponent must be a **non-negative integer**:

```suji
import std:println

println(2 ^ 3)       # 8 (2³)
println(10 ^ 2)      # 100 (10²)
println(2 ^ 10)      # 1024
```

Fractional and negative exponents are rejected:

- `4 ^ 0.5` → `Invalid operation: Power exponent must be an integer`
- `2 ^ (0 - 1)` → `Invalid operation: Negative exponents not supported`

Use `::sqrt()` for square roots and division for reciprocals:

```suji
import std:println

println(16::sqrt())  # 4
println(1 / 2 ^ 1)   # 0.50
```

Also note that `^` binds tighter than unary minus, so `-2 ^ 2` is `-(2 ^ 2)`:

```suji
import std:println

println(-2 ^ 2)      # -4
println((-2) ^ 2)    # 4
```

### Negation (`-`)

Negate a number (unary operator):

```suji
import std:println

x = 5
println(-x)          # -5
println(-(-x))       # 5 (double negation)

y = -10
println(-y)          # 10
```

## Compound Assignment

Arithmetic operations combined with assignment:

```suji
import std:println

x = 10

x += 5      # same as: x = x + 5
println(x)  # 15

x -= 3      # same as: x = x - 3
println(x)  # 12

x *= 2      # same as: x = x * 2
println(x)  # 24

x /= 4      # same as: x = x / 4
println(x)  # 6

x %= 5      # same as: x = x % 5
println(x)  # 1
```

## Operator Precedence

The arithmetic slice of the precedence table, **lowest to highest**:

1. **Addition, Subtraction** (`+`, `-`)
2. **Multiplication, Division, Modulo** (`*`, `/`, `%`)
3. **Unary negation and not** (`-`, `!`)
4. **Exponentiation** (`^`, right-associative)

Parentheses override all of it. Note that `^` binds *tighter* than unary `-`, which
differs from the usual PEMDAS reading — see the `-2 ^ 2` example above. The full
table for all operators is in the [operators overview](README.md#operator-precedence).

### Examples

```suji
import std:println

# Multiplication before addition
println(2 + 3 * 4)       # 14 (not 20)

# Exponentiation before multiplication
println(2 * 3 ^ 2)       # 18 (2 * 9, not 6²)

# Use parentheses to override
println((2 + 3) * 4)     # 20
println((2 * 3) ^ 2)     # 36

# Complex expression
println(10 + 2 * 3 ^ 2 - 4 / 2)  # 26
# Breakdown: 10 + 2*9 - 2 = 10 + 18 - 2 = 26
```

## Associativity

Most arithmetic operators are left-associative:

```suji
import std:println

# Left to right: (10 - 3) - 2
println(10 - 3 - 2)  # 5

# Left to right: (20 / 4) / 2
println(20 / 4 / 2)  # 2.50
```

(Scale is preserved through division, which is why this prints `2.50` rather than
`2.5`.)

Exponentiation is right-associative:

```suji
import std:println

# Right to left: 2 ^ (3 ^ 2)
println(2 ^ 3 ^ 2)   # 512 (2^9, not 8^2)
```

## Common Patterns

### Increment/Decrement

```suji
import std:println

count = 0
count++            # Increment (also: count += 1)
println(count)     # 1

count--            # Decrement (also: count -= 1)
println(count)     # 0
```

### Averaging

```suji
import std:println

numbers = [10, 20, 30, 40, 50]
sum = numbers::fold(0, |acc, x| acc + x)
average = sum / numbers::length()
println(average)  # 30
```

### Scaling

```suji
import std:println

# Scale value to percentage
value = 75
max_value = 200
percentage = (value / max_value) * 100
println("${percentage}%")  # 37.500%
```

### Rounding

Rounding lives on the number type, not in `std:math` — there is no `math:round`,
`math:floor`, `math:ceil`, `math:abs` or `math:sqrt`:

```suji
import std:println

value = 3.14159

# Round to 2 decimal places
rounded = (value * 100)::round() / 100
println(rounded)  # 3.14
```

### Wrapping (Circular)

```suji
import std:println

# Wrap index in circular buffer
index = 15
buffer_size = 10
wrapped = index % buffer_size
println(wrapped)  # 5
```

## Common Pitfalls

### Pitfall 1: Division by Zero

Division by zero terminates the program, and there is no `try`/`catch`, so the only
option is to check first:

```suji
import std:println

# result = 10 / 0   ->  Runtime error: Division by zero (process exits)

# Check before dividing
safe_divide = |a, b| {
    match b {
        0 => nil,
        _ => a / b,
    }
}

println(safe_divide(10, 0))  # nil
println(safe_divide(10, 4))  # 2.50
```

### Pitfall 2: Integer Division Confusion

```suji
import std:println

# Regular division always returns decimal
println(10 / 3)   # 3.3333333333333333333333333333

# Integer division using floor method
println((10 / 3)::floor())  # 3

# Be explicit about intent
total = 10
count = 4
println(total / count)              # 2.50 - when you want decimal
println((total / count)::floor())   # 2    - when you want an integer
```

Suji has **no** `//` operator. Writing `a // b` starts a regex literal and produces a
lexer error, not integer division.

### Pitfall 3: Modulo with Negatives

```suji
import std:println

# Result has sign of dividend (left operand)
println(10 % 3)    # 1
println(-10 % 3)   # -1 (not 2)
println(10 % -3)   # 1
```

### Pitfall 4: Assuming Binary Floating Point

Suji's single number type is a **fixed-precision decimal**, not a binary float, so
the classic `0.1 + 0.2` surprise does not happen here:

```suji
import std:println

println(0.1 + 0.2)         # 0.3
println(0.1 + 0.2 == 0.3)  # true
```

What *does* bite is the precision limit: results are rounded to about 28 significant
digits, and exceeding the maximum value (`79228162514264337593543950335`) aborts the
process rather than producing an approximation. Decimals are not big integers.

### Pitfall 5: Operator Precedence Confusion

```suji
import std:println

# Unclear intent
result = 2 + 3 * 4 ^ 2 - 5

# Use parentheses for clarity
result = 2 + (3 * (4 ^ 2)) - 5
println(result)  # 45
```

## Best Practices

### DO:
- Use parentheses for clarity in complex expressions
- Check for division by zero *before* dividing — there is no way to recover after
- Be aware of the 28-significant-digit precision limit
- Use `(a / b)::floor()` when you need integer division
- Consider modulo sign behavior with negatives

### DON'T:
- Rely on obscure precedence rules (`^` binds tighter than unary `-`)
- Ignore division by zero possibilities
- Reach for `//`, `**`, `"x" * 3` or `math:sqrt` — none of them exist
- Assume modulo always returns positive

## Examples

### Distance Between Points

`std:math` has no `sqrt` — square roots are a number method:

```suji
import std:println

distance = |x1, y1, x2, y2| {
    dx = x2 - x1
    dy = y2 - y1
    sum_of_squares = (dx ^ 2) + (dy ^ 2)
    sum_of_squares::sqrt()
}

println(distance(0, 0, 3, 4))  # 5
```

### Temperature Conversion

```suji
import std:println

celsius_to_fahrenheit = |c| {
    (c * 9 / 5) + 32
}

fahrenheit_to_celsius = |f| {
    (f - 32) * 5 / 9
}

println(celsius_to_fahrenheit(0))    # 32
println(celsius_to_fahrenheit(100))  # 212
println(fahrenheit_to_celsius(32))   # 0
```

### Compound Interest

```suji
import std:println

compound_interest = |principal, rate, time| {
    principal * ((1 + rate) ^ time)
}

# $1000 at 5% for 10 years
final = compound_interest(1000, 0.05, 10)
println("$${final::round()}")  # $1629
```

### Digit Sum

```suji
import std:println

digit_sum = |n| {
    sum = 0
    num = n::abs()
    
    loop {
        num == 0 && break
        sum = sum + (num % 10)
        num = (num / 10)::floor()
    }
    
    sum
}

println(digit_sum(12345))  # 15 (1+2+3+4+5)
```

## Next Steps

- Learn about [Relational Operators](relational.md)
- Explore [Math Module](../../stdlib/math.md) for trigonometry, logs and `PI`/`E`
- Study [Operator Precedence](../../appendices/precedence.md) in detail
- Check out [Number Data Type](../data-types/numbers.md)

## See Also

- [Numbers](../data-types/numbers.md)
- [Math Module](../../stdlib/math.md)
- [Operator Precedence](../../appendices/precedence.md)
- [Assignment Operators](assignment.md)
