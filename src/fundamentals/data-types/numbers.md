# Numbers

Numbers in Suji are represented as fixed-precision decimal numbers (base-10 arithmetic).

## Overview

Suji has a single number type: **Decimal**. All numbers are decimal numbers, whether they have a fractional part or not. Integers are simply decimal numbers with no fractional component.

### Key Characteristics

- **Single type** - All numbers are decimals (no separate integer/float types)
- **Decimal arithmetic** - Base-10 arithmetic, so `0.1 + 0.2 == 0.3` is `true`
- **Fixed precision** - About 28–29 significant digits, with a hard maximum of
  `79228162514264337593543950335`. This is *not* arbitrary precision: exceeding
  the range aborts the program.
- **No NaN/Infinity** - Invalid operations raise runtime errors
- **Simple literals** - Only decimal digits and an optional `.` (see below)

### When to Use Numbers

Use numbers for:
- Counting and indexing
- Mathematical calculations
- Measurements and quantities
- Coordinates and positions
- Financial calculations (decimal arithmetic provides exact precision)

## Syntax

All numbers in Suji are decimal numbers. Whether a number has a fractional part or not, it's still the same decimal type.

### Number Literals

```suji
import std:println

# Whole numbers (decimals with no fractional part)
age = 30
count = 100
negative = -42

# Decimal numbers (with fractional part)
pi = 3.14159
temperature = -40.5
tiny = 0.000001

println(age)          # 30
println(negative)     # -42
println(temperature)  # -40.5
```

A number literal is **only** a run of decimal digits with an optional `.` and
fractional part. The following forms that other languages accept do **not**
exist in Suji, and each one is a lex or parse error:

| Not supported | Write instead |
|---|---|
| Hex `0xFF`, octal `0o77`, binary `0b1010` | the decimal value (`255`, `63`, `10`) |
| Digit separators `1_000_000` | `1000000` |
| Scientific notation `3e8` | `300000000` (write the digits out) |

Negative numbers are not part of the literal syntax either: `-42` is unary minus
applied to the literal `42`.

Very small magnitudes are also limited: a decimal keeps at most 28 digits after
the point, so a value like `6.626e-34` simply cannot be represented. Rescale your
units instead of trying to write it.

**Note**: There's no distinction between "integers" and "floats" in Suji. Both `42` and `42.0` are decimal numbers. The difference is only whether they have a fractional component.

### Trailing Zeros and Scale

Every number carries a *scale* (the number of digits it keeps after the decimal
point), and arithmetic keeps the larger scale of its operands:

```suji
import std:println

println(1.50)       # 1.50   (scale preserved)
println(2.50 + 1)   # 3.50
println(1.0)        # 1      (a literal with only zeros normalises)
println(42.0)       # 42
```

## Arithmetic Operations

### Basic Operations

```suji
import std:println

# Addition
println(5 + 3)        # 8

# Subtraction
println(10 - 4)       # 6

# Multiplication
println(6 * 7)        # 42

# Division (always returns decimal result)
println(15 / 3)       # 5
println(10 / 3)       # 3.3333333333333333333333333333 (rounded at 28 digits)

# Floor division (get integer part)
println((10 / 3)::floor())  # 3

# Modulo (remainder)
println(10 % 3)       # 1

# Exponentiation (the exponent must be a whole number)
println(2 ^ 10)       # 1024

# For roots use the sqrt() method, not a fractional exponent:
# 4 ^ 0.5 is a runtime error, "Power exponent must be an integer"
println(4::sqrt())    # 2
```

`^` is right-associative and binds tighter than unary minus, so `2 ^ 3 ^ 2` is
`512` (not `64`) and `-2 ^ 2` is `-4` (not `4`).

### Compound Assignment

```suji
import std:println

x = 10

x += 5   # x is now 15
x -= 3   # x is now 12
x *= 2   # x is now 24
x /= 4   # x is now 6
x %= 4   # x is now 2

println(x)  # 2

# Postfix increment and decrement are statements, not expressions
x++
println(x)  # 3
x--
println(x)  # 2
```

### Operator Precedence

```suji
import std:println

# Standard precedence (PEMDAS)
result = 2 + 3 * 4    # 14, not 20
println(result)

# Use parentheses for clarity
result = (2 + 3) * 4  # 20
println(result)

# Exponentiation has highest precedence
result = 2 * 3 ^ 2    # 18 (2 * 9)
println(result)
```

## Comparison Operations

```suji
import std:println

# Equality
println(5 == 5)       # true
println(5 == 6)       # false
println(5 != 6)       # true

# Relational
println(5 < 10)       # true
println(5 > 10)       # false
println(5 <= 5)       # true
println(10 >= 10)     # true
```

## Mathematical Functions

Arithmetic that works on a single number is exposed as **methods** on the number
itself. The `std:math` module contains only the transcendental functions and two
constants.

### Basic Math (number methods)

```suji
import std:println

# Absolute value
println((-5)::abs())      # 5

# Rounding
println(3.7::floor())     # 3
println(3.2::ceil())      # 4
println(3.5::round())     # 4
println(3.4::round())     # 3

# Min/Max (a method on one of the two values)
println(5::min(10))       # 5
println(5::max(10))       # 10

# Power and square root
println(2::pow(10))       # 1024
println(16::sqrt())       # 4
```

> **There is no `math:abs`, `math:floor`, `math:ceil`, `math:round`, `math:min`,
> `math:max`, `math:pow`, `math:sqrt` or `math:cbrt`.** Use the methods above.
> Suji has no cube-root operation at all; `27 ^ (1/3)` will not work either
> because `^` requires a whole-number exponent. If you need one, write a
> Newton-iteration helper yourself.

`sqrt()` returns a decimal approximation for non-perfect squares:

```suji
import std:println

println(2::sqrt())   # 1.4142135623730950488016887242
```

`pow()` requires a non-negative whole-number exponent (`2::pow(-1)` fails with
*Negative exponents not supported*).

Both `^` and `pow()` overflow far earlier than plain multiplication does. They
work by repeated squaring and square the base once more than the result needs, so
the intermediate value exceeds the decimal range long before the answer would:

```suji
import std:println

println(10 ^ 15)  # 1000000000000000
println(2 ^ 63)   # 9223372036854775808
```

`10 ^ 16` and `2 ^ 64` both abort the program, even though both results are
comfortably inside the decimal range — `1000000000000000 * 10 * 10` computes
`100000000000000000` without complaint. Overflow is not a catchable Suji error
either: it is a panic that prints `Multiplication overflowed` and exits with
status 101 instead of a framed diagnostic.

### Trigonometry

```suji
import std:math
import std:println

# Angles in radians
println(math:sin(math:PI / 2))    # 1
println(math:cos(0))              # 1

# Trig results are approximations, so don't expect exact values
println(math:tan(math:PI / 4))    # 0.9999999956815324130588099842

# Inverse functions
println(math:asin(1))      # 1.570796326794897   (π/2)
println(math:acos(1))      # 0
println(math:atan(1))      # 0.785398163397448   (π/4)
println(math:atan2(1, 1))  # 0.785398163397448   (two-argument arctangent)
```

There are no hyperbolic functions (`sinh`, `cosh`, `tanh`) and no inverse
hyperbolics.

### Logarithms and Exponentials

```suji
import std:math
import std:println

# Natural logarithm
println(math:log(math:E))  # 0.9999999999999999999998942453

# Base 10 logarithm
println(math:log10(100))   # 2

# Exponential
println(math:exp(1))       # 2.7182818261984928651595318263

# Constants (uppercase)
println(math:PI)           # 3.14159265358979323846
println(math:E)            # 2.71828182845904523536
```

The complete contents of `std:math` are `PI`, `E`, `sin`, `cos`, `tan`, `asin`,
`acos`, `atan`, `atan2`, `log`, `log10` and `exp`. There is no `log2`, `hypot`,
`sign`, `clamp`, `trunc` or `random` (for randomness see
[`std:random`](../../stdlib/random.md)).

## Number Methods

### Type Checking

```suji
import std:println

# Check if a number has no fractional part (is an integer)
println(42::is_int())        # true (no fractional part)
println(3.14::is_int())      # false (has fractional part)
println(42.0::is_int())      # true (no fractional part, even with .0)

# Check if a value is a number
println(42::is_number())         # true
println("text"::is_number())    # false

# Note: Suji uses decimal arithmetic, so NaN and Infinity don't exist
# Division by zero raises a runtime error instead
```

### Conversion

```suji
import std:println

# To string
println(42::to_string())         # 42
println(3.14::to_string())       # 3.14

# Parse from string
num = "42"::to_number()
println(num)                   # 42

decimal = "3.14"::to_number()
println(decimal)               # 3.14
```

`to_number()` raises a runtime error on input that isn't a number, and Suji has
no way to trap a runtime error, so validate the text **before** converting:

```suji
import std:println

parse_or_nil = |text| {
    match {
        text ~ /^-?[0-9]+(\.[0-9]+)?$/ => text::to_number(),
        _ => nil,
    }
}

println(parse_or_nil("42"))     # 42
println(parse_or_nil("abc"))    # nil
```

### Formatting

```suji
import std:println

# Rounding methods
num = 3.14159
println(num::round())    # 3
println(num::floor())    # 3
println(num::ceil())     # 4

# Note: number::to_fixed(), to_exponential() and to_precision() do not exist.
# To show a fixed number of decimals, scale, round and divide yourself:
two_dp = |x| (x * 100)::round() / 100
println(two_dp(3.14159))  # 3.14
println(two_dp(2.5))      # 2.50
println(two_dp(2))        # 2
```

This rounds correctly, but how many decimals get *printed* still depends on the
input's scale: `two_dp(2)` shows `2`, not `2.00`. Suji has no formatting
mini-language, so pad the string yourself when you need fixed-width output.

## Number Ranges

```suji
import std:println

# Range literals (list of numbers)
range1 = 0..5          # [0, 1, 2, 3, 4]
range2 = 0..=5         # [0, 1, 2, 3, 4, 5] (inclusive)
range3 = 5..0          # [5, 4, 3, 2, 1] (descending)

println(range1)

# Note: Suji doesn't support step ranges directly
# Use filter to get evens/odds:
evens = (0..10)::filter(|x| x % 2 == 0)  # [0, 2, 4, 6, 8]
odds = (1..10)::filter(|x| x % 2 == 1)   # [1, 3, 5, 7, 9]

println(evens)
```

## Special Values

### Division by Zero

Suji uses decimal arithmetic and raises a runtime error on division by zero:

```suji
import std:println

# Division by zero raises a runtime error
# result = 1 / 0  # Runtime error

# Check before dividing
safe_divide = |a, b| {
    match b {
        0 => nil,
        _ => a / b,
    }
}

println(safe_divide(10, 2))  # 5
println(safe_divide(10, 0))  # nil
```

Note: Suji does not have Infinity or NaN values. Invalid operations raise runtime errors instead.

## Common Patterns

### Clamping

```suji
import std:println

clamp = |value, min_val, max_val| {
    match {
        value < min_val => min_val,
        value > max_val => max_val,
        _ => value,
    }
}

println(clamp(5, 0, 10))      # 5
println(clamp(-5, 0, 10))     # 0
println(clamp(15, 0, 10))     # 10
```

### Linear Interpolation

```suji
import std:println

lerp = |a, b, t| {
    a + (b - a) * t
}

# Interpolate between 0 and 100
println(lerp(0, 100, 0.0))    # 0
println(lerp(0, 100, 0.5))    # 50
println(lerp(0, 100, 1.0))    # 100
```

### Range Mapping

```suji
import std:println

# Map value from one range to another
map_range = |value, in_min, in_max, out_min, out_max| {
    (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

# Map 0-100 to 0-1
println(map_range(50, 0, 100, 0, 1))   # 0.50

# Map 0-255 to 0-100 (RGB to percentage)
println(map_range(128, 0, 255, 0, 100)) # 50.196078431372549019607843137
```

Note the `0.50` in the first result: division keeps the scale of its operands, so
round explicitly when the exact number of decimals matters.

### Averaging

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

# Mean (::average() does the same thing, and returns nil for an empty list)
mean = numbers::sum() / numbers::length()
println(mean)                # 3
println(numbers::average())  # 3

# Median
sorted = numbers::sort()
median = match sorted::length() % 2 {
    0 => {
        mid = sorted::length() / 2
        (sorted[mid - 1] + sorted[mid]) / 2
    },
    _ => {
        mid = (sorted::length() / 2)::floor()
        sorted[mid]
    },
}
println(median)  # 3
```

## Common Pitfalls

### Pitfall 1: Decimal Precision

```suji
import std:println

# Decimal arithmetic is exact for values that fit in base 10
println(0.1 + 0.2 == 0.3)     # true
println(0.1 + 0.2)            # 0.3

# But precision is finite: repeating divisions are rounded to 28 digits
println(1 / 3)                # 0.3333333333333333333333333333
println((1 / 3) * 3 == 1)     # false
```

So the familiar `0.1 + 0.2` surprise is gone, but you can still lose digits.
Anything that does not terminate in base 10 is rounded, and results larger than
`79228162514264337593543950335` abort the program instead of wrapping or
becoming infinity.

### Pitfall 2: Division by Zero

```suji
import std:println

# Division by zero raises a runtime error (not infinity)
# result = 10 / 0  # Runtime error: "Division by zero"

# Check before dividing
divide_safe = |a, b| {
    match b {
        0 => nil,
        _ => a / b,
    }
}

println(divide_safe(10, 2))  # 5
println(divide_safe(10, 0))  # nil
```

### Pitfall 3: Whole Number vs Decimal Division

```suji
import std:println

# Suji uses decimal division (always returns decimal result)
println(10 / 3)              # 3.3333333333333333333333333333 (exact decimal)
println((10 / 3)::floor())   # 3 (get whole number part using floor)

# All numbers are decimals, so division always returns a decimal
# Use floor() if you need the whole number part
```

### Pitfall 4: Modulo with Negatives

```suji
import std:println

# Result has sign of dividend
println(10 % 3)       # 1
println(-10 % 3)      # -1
println(10 % -3)      # 1
```

## Performance Tips

### All Numbers Are Decimals

```suji
# All numbers are decimals, so there's no "conversion" between types
count = 0
count = count + 1

# Adding 1.0 is the same as adding 1 (both are decimals)
count = count + 1.0  # Same result

# The only difference is whether the result has a fractional part
whole = 42        # Decimal with no fractional part
decimal = 42.5    # Decimal with fractional part
# Both are the same type: Decimal
```

Decimal arithmetic is implemented in software rather than by the CPU's
floating-point unit, so it is exact but not free. In hot loops, hoist work that
does not depend on the loop variable.

### Avoid Repeated Calculations

```suji
import std:println

items = [1, 2, 3, 4]

# Recalculates the square root on every iteration
total = 0
loop through items with item {
    total += item / items::length()::sqrt()
}
println(total)  # 5

# Calculate once, outside the loop
sqrt_len = items::length()::sqrt()
total = 0
loop through items with item {
    total += item / sqrt_len
}
println(total)  # 5
```

## Best Practices

### DO:
- Handle division by zero before it happens (it raises a runtime error that
  cannot be caught)
- Use exact decimal comparisons for terminating values (no epsilon needed)
- Round explicitly with `round()`/`floor()`/`ceil()` when a result's scale matters
- Keep magnitudes well inside the 28–29 significant digit range
- Document units and ranges

### DON'T:
- Think of numbers as separate integer/float types (they're all decimals)
- Assume arbitrary precision — overflow aborts the program
- Ignore division by zero (it raises an error, not infinity)
- Expect NaN or Infinity (invalid operations raise runtime errors)
- Reach for `math:` for abs/round/sqrt/pow/min/max — those are number methods

## Next Steps

- Learn about [Booleans](booleans.md) for logical values
- Explore the [Math Module](../../stdlib/math.md) for trigonometry and logarithms
- Study [Operators](../operators/arithmetic.md) in detail

## See Also

- [Booleans](booleans.md)
- [Math Module](../../stdlib/math.md)
- [Arithmetic Operators](../operators/arithmetic.md)
