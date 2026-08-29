# Mathematics (`std:math`)

Two constants plus trigonometric, logarithmic and exponential functions.

## Overview

`std:math` is small — it exports exactly these twelve items and nothing else:

| Export | Kind | Description |
|---|---|---|
| `PI` | Number | π |
| `E` | Number | Euler's number |
| `sin(x)` | Function | Sine of `x` radians |
| `cos(x)` | Function | Cosine of `x` radians |
| `tan(x)` | Function | Tangent of `x` radians |
| `asin(x)` | Function | Arcsine, radians; domain `[-1, 1]` |
| `acos(x)` | Function | Arccosine, radians; domain `[-1, 1]` |
| `atan(x)` | Function | Arctangent, radians |
| `atan2(y, x)` | Function | Arctangent of `y / x`, quadrant-aware |
| `log(x)` | Function | Natural logarithm; domain `x > 0` |
| `log10(x)` | Function | Base-10 logarithm; domain `x > 0` |
| `exp(x)` | Function | e raised to `x` |

The constants are **uppercase**: `math:PI`, `math:E`.

## What Is Not in `std:math`

Rounding, absolute value, roots, powers and comparisons are **number methods**,
not module functions:

| You might expect | Use instead |
|---|---|
| `math:abs(x)` | `x::abs()` |
| `math:sqrt(x)` | `x::sqrt()` |
| `math:pow(x, n)` | `x::pow(n)` or `x ^ n` |
| `math:floor(x)` | `x::floor()` |
| `math:ceil(x)` | `x::ceil()` |
| `math:round(x)` | `x::round()` |
| `math:min(a, b)` | `a::min(b)` |
| `math:max(a, b)` | `a::max(b)` |
| `math:random()` | [`random:random()`](random.md) |

```suji
import std:println

println(16::sqrt())     # 4
println((0-5)::abs())   # 5
println(2::pow(10))     # 1024
println(3.7::floor())   # 3
println(3.2::ceil())    # 4
println(3.5::round())   # 4
println(5::min(3))      # 3
println(5::max(3))      # 5
```

There is no `TAU`, `cbrt`, `log2`, `hypot`, `sign`, `clamp` or `trunc` in any
form. `log2(x)` can be written as `math:log(x) / math:log(2)`.

## Quick Start

```suji
import std:math
import std:println

println(math:PI)             # 3.14159265358979323846
println(math:E)              # 2.71828182845904523536

println(math:sin(0))         # 0
println(math:cos(0))         # 1
println(math:log10(100))     # 2
println(math:exp(0))         # 1
```

## Constants

```suji
import std:math
import std:println

radius = 5
println(2 * math:PI * radius)          # 31.41592653589793238460
println(math:PI * radius * radius)     # 78.53981633974483096150
```

## Trigonometric Functions

All angles are in **radians**.

```suji
import std:math
import std:println

println(math:sin(0))            # 0
println(math:sin(math:PI / 2))  # 1
println(math:cos(0))            # 1
println(math:cos(math:PI))      # -1
println(math:tan(0))            # 0
```

Convert from degrees before calling them:

```suji
import std:math
import std:println

to_radians = |deg| deg * math:PI / 180
to_degrees = |rad| rad * 180 / math:PI

println(to_degrees(math:PI / 4))     # 45
println(math:sin(to_radians(90)))    # 1
```

`tan` has no special value at π/2 — because the argument is only an
approximation of π/2 the result is a very large number rather than an error, so
guard the inputs yourself if that matters.

## Inverse Trigonometric Functions

These return radians. `asin` and `acos` require an argument in `[-1, 1]`;
anything else raises `Invalid operation: asin domain is [-1,1]` and terminates
the program.

```suji
import std:math
import std:println

println(math:asin(0))   # 0
println(math:asin(1))   # 1.570796326794897
println(math:acos(1))   # 0
println(math:atan(1))   # 0.785398163397448
```

`atan2(y, x)` picks the correct quadrant from the signs of both arguments, which
`atan` cannot do:

```suji
import std:math
import std:println

println(math:atan2(1, 1))        # 0.785398163397448
println(math:atan2(1, 0-1))      # 2.356194490192345
println(math:atan2(0-1, 0-1))    # -2.356194490192345
println(math:atan2(0-1, 1))      # -0.785398163397448
```

Validate the input range before calling `asin` or `acos`:

```suji
import std:math
import std:println

safe_asin = |x| match {
    x < (0-1) => nil,
    x > 1 => nil,
    _ => math:asin(x),
}

println(safe_asin(2) == nil)  # true
println(safe_asin(0))         # 0
```

## Logarithms and Exponentials

`log` is the natural logarithm and `log10` is base 10. Both require a positive
argument; `log(0)` and `log(-1)` raise
`Invalid operation: log domain is (0, +inf)`.

```suji
import std:math
import std:println

println(math:log(1))        # 0
println(math:log10(1))      # 0
println(math:log10(100))    # 2
println(math:log10(1000))   # 3
println(math:exp(0))        # 1
```

Any base can be derived from `log`:

```suji
import std:math
import std:println

log_base = |x, base| math:log(x) / math:log(base)

println(log_base(8, 2)::round())    # 3
println(log_base(81, 3)::round())   # 4
```

A result larger than the decimal range raises
`Invalid operation: math result overflow` — `math:exp(100)` is already too big.

## Precision

Arguments and results are Suji's fixed-precision decimals, but these functions
are computed in binary floating point internally. Results are therefore very
close to, but not always exactly, the mathematically exact value:

```suji
import std:math
import std:println

println(math:log(math:E))        # 0.9999999999999999999998942453
println(math:exp(1))             # 2.7182818261984928651595318263
println(math:sin(math:PI))       # 0.0000000000000000000026433832
println(math:tan(math:PI / 4))   # 0.9999999956815324130588099842
```

So compare with a tolerance rather than `==`:

```suji
import std:math
import std:println

close_enough = |a, b| (a - b)::abs() < 0.0000001

println(close_enough(math:log(math:E), 1))       # true
println(close_enough(math:tan(math:PI / 4), 1))  # true
```

Rounding to a known number of digits works through arithmetic and `::round()`:

```suji
import std:math
import std:println

round_to = |x, digits| {
    factor = 10 ^ digits
    scaled = x * factor
    scaled::round() / factor
}

println(round_to(math:exp(1), 4))  # 2.7183
```

## Examples

### Distance Between Two Points

```suji
import std:println

distance = |x1, y1, x2, y2| {
    dx = x2 - x1
    dy = y2 - y1
    squares = (dx ^ 2) + (dy ^ 2)
    squares::sqrt()
}

println(distance(0, 0, 3, 4))  # 5
```

### Polar and Cartesian Coordinates

```suji
import std:math
import std:println

polar_to_cartesian = |r, theta| (r * math:cos(theta), r * math:sin(theta))

cartesian_to_polar = |x, y| (((x ^ 2) + (y ^ 2))::sqrt(), math:atan2(y, x))

x, y = polar_to_cartesian(5, 0)
println("${x} ${y}")  # 5 0

r, theta = cartesian_to_polar(3, 4)
println(r)              # 5
println(theta > 0.92)   # true
```

### Decibels

```suji
import std:math
import std:println

to_decibels = |power| 10 * math:log10(power)

println(to_decibels(1))     # 0
println(to_decibels(1000))  # 30
println(to_decibels(0.001)) # -30
```

### Continuous Growth

```suji
import std:math
import std:println

compound = |principal, rate, years| principal * math:exp(rate * years)

amount = compound(1000, 0.05, 10)
println(amount::round())  # 1649
```

### Sine Wave Samples

```suji
import std:math
import std:println

samples = []
loop through 0..4 with i {
    samples::push(math:sin(2 * math:PI * i / 4)::round())
}

println(samples)  # [0, 1, 0, -1]
```

## Gotchas

- The constants are uppercase; `math:pi` is an undefined variable.
- `^` requires an integer exponent, so use `x::sqrt()` rather than `x ^ 0.5`.
- `x::sqrt()` on a negative number raises
  `Invalid operation: Square root of negative number`.
- Domain and overflow errors terminate the program; check inputs first.
- There is no `NaN` and no `Infinity`, so a bad computation is an error rather
  than a special value.

## See Also

- [Numbers](../fundamentals/data-types/numbers.md)
- [Arithmetic Operators](../fundamentals/operators/arithmetic.md)
- [Random Numbers](random.md)
- [Standard Library Overview](README.md)
