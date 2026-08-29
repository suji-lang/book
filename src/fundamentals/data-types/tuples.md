# Tuples

Tuples are immutable, fixed-size collections that group heterogeneous values together.

## Overview

Tuples let you package multiple values into a single compound value, perfect for returning multiple results or grouping related data.

### Key Characteristics

- **Fixed size** - Cannot add/remove elements
- **Immutable** - Cannot change after creation
- **Heterogeneous** - Can contain different types
- **Not indexable** - `t[0]` is a type error; there is no `get`, `first` or
  `second` either
- **Destructuring** - `a, b = t` is the way to get the elements out

### When to Use Tuples

Use tuples for:
- Multiple return values from functions
- Grouping related but different types
- Temporary data bundling
- Coordinate pairs or triples
- Fixed-size records

## Syntax

### Creating Tuples

```suji
import std:println

# Empty tuple
empty = ()

# With values
pair = (1, 2)
triple = (1, "two", 3.0)
nested = (1, (2, 3), 4)

# Single element tuple (note the comma)
single = (42,)

println(empty)   # ()
println(pair)    # (1, 2)
println(triple)  # (1, two, 3)
println(nested)  # (1, (2, 3), 4)
println(single)  # (42,)
```

### Accessing Elements

Tuples are **not indexable**. `t[0]` fails with *Cannot index tuple*, and there
are no `get()`, `first()` or `second()` methods — the only tuple methods are
`length()`, `to_list()` and `to_string()`. Get at the elements by destructuring,
or convert to a list first:

```suji
import std:println

point = (10, 20, 30)

# This does NOT work:
# println(point[0])   # Error: Type error: Cannot index tuple

# Destructure instead
x, y, z = point
println(x)  # 10
println(z)  # 30

# Or convert to a list, which *is* indexable
coords = point::to_list()
println(coords[0])   # 10
println(coords[-1])  # 30
```

### Destructuring

The most powerful feature of tuples. Write the targets **without** parentheses —
`(x, y) = point` is not destructuring syntax and will not work:

```suji
import std:println

# Unpack tuple into variables
point = (10, 20)
x, y = point
println("x: ${x}, y: ${y}")  # x: 10, y: 20

# Ignore values with underscore
triple = (1, 2, 3)
first, _, third = triple
println("${first}, ${third}")  # 1, 3
```

Destructuring is one level deep: a nested tuple comes out as a tuple that you
unpack in a second step.

```suji
import std:println

data = (1, (2, 3), 4)

a, inner, d = data
println(inner)  # (2, 3)

b, c = inner
println("${a}, ${b}, ${c}, ${d}")  # 1, 2, 3, 4
```

The number of targets must match the tuple exactly — `a, b = (1, 2, 3)` fails
with *Destructuring arity mismatch: expected 2, got 3*.

## Multiple Return Values

Tuples excel at returning multiple values:

```suji
import std:println

# Function returning tuple
# Use an explicit `return` for the tuple: a line that begins with "(" would
# otherwise be read as a call on the previous line's value.
divide_with_remainder = |a, b| {
    quotient = (a / b)::floor()
    remainder = a % b
    return (quotient, remainder)
}

# Destructure the result
q, r = divide_with_remainder(17, 5)
println("17 ÷ 5 = ${q} remainder ${r}")  # 17 ÷ 5 = 3 remainder 2
```

`return a, b` also builds a tuple, so an explicit early return can carry two
values:

```suji
import std:println

split_sign = |n| {
    n < 0 && return ("negative", n::abs())
    return ("non-negative", n)
}

label, magnitude = split_sign(-7)
println("${label} ${magnitude}")  # negative 7
```

### Real-World Example

```suji
import std:println

# Parse name into parts
parse_name = |full_name| {
    parts = full_name::split()
    match parts::length() {
        0 => (nil, nil),
        1 => (parts[0], nil),
        _ => (parts[0], parts[1;]::join(" ")),
    }
}

first, last = parse_name("Alice Smith")
println("First: ${first}, Last: ${last}")
# First: Alice, Last: Smith

first, last = parse_name("Bob")
println("First: ${first}, Last: ${last}")
# First: Bob, Last: nil
```

## Tuple Methods

### Length

```suji
import std:println

triple = (1, 2, 3)
println(triple::length())  # 3
```

### Conversion

```suji
import std:println

# Tuple to list
triple = (1, 2, 3)
as_list = triple::to_list()
println(as_list)  # [1, 2, 3]

# There is no automatic list-to-tuple conversion; construct a tuple explicitly
# when you know the length
values = [4, 5, 6]
rebuilt = (values[0], values[1], values[2])
println(rebuilt)  # (4, 5, 6)

# to_string() renders the same text println shows
println(triple::to_string())  # (1, 2, 3)
```

### Comparison

Tuples support equality, which compares element by element:

```suji
import std:println

println((1, 2) == (1, 2))   # true
println((1, 2) == (1, 3))   # false
println((1, 2) != (1, 3))   # true
```

There is **no ordering** for tuples: `(1, 2) < (1, 3)` fails with *Cannot compare
tuple and tuple*. If you need to sort pairs, destructure them and compare the
components yourself.

## Common Patterns

### Coordinate Pairs

```suji
import std:println

# 2D point
point = (10, 20)
x, y = point

# Distance from origin
distance = ((x ^ 2) + (y ^ 2))::sqrt()
println(distance)  # 22.360679774997896964091736688

# 3D point
point3d = (10, 20, 30)
x, y, z = point3d
println("${x}, ${y}, ${z}")  # 10, 20, 30
```

### Min/Max with Index

```suji
import std:println

# `loop through list with a, b` is a runtime error - two bindings are for maps
# only - so iterate the indices when you need a counter.
find_min_with_index = |numbers| {
    min_val = numbers[0]
    min_idx = 0

    loop through 0..numbers::length() with idx {
        match { numbers[idx] < min_val => {
            min_val = numbers[idx]
            min_idx = idx
        } }
    }

    (min_val, min_idx)
}

numbers = [5, 2, 8, 1, 9]
min_value, min_index = find_min_with_index(numbers)
println("Min ${min_value} at index ${min_index}")
# Min 1 at index 3
```

### Success/Error Results

Suji has no exceptions and no `Result` type, so a `(value, error)` tuple is the
usual way to report failure from a function:

```suji
import std:println

safe_divide = |a, b| {
    match b {
        0 => (nil, "Division by zero"),
        _ => (a / b, nil),
    }
}

result, error = safe_divide(10, 2)
match error {
    nil => println("Result: ${result}"),
    _ => println("Error: ${error}"),
}
# Result: 5

result, error = safe_divide(10, 0)
match error {
    nil => println("Result: ${result}"),
    _ => println("Error: ${error}"),
}
# Error: Division by zero
```

Note the `_` in the second arm. A bare identifier in a pattern is treated as a
**string literal**, so an arm written `err => …` would only match the literal
string `"err"`; it would not bind the error.

### Swapping Values

```suji
import std:println

a = 10
b = 20

# Swap using tuple destructuring - the right side must be a real tuple,
# so the parentheses here are required
a, b = (b, a)

println("a: ${a}, b: ${b}")  # a: 20, b: 10
```

## Tuples vs Lists

### When to Use Tuples

```suji
import std:println

# Fixed, known structure
rgb = (255, 0, 128)

# Different types
user = ("Alice", 30, true)  # name, age, active

# Multiple returns
try_parse = |text| {
    match {
        text ~ /^[0-9]+$/ => (true, text::to_number()),
        _ => (false, nil),
    }
}

ok, value = try_parse("42")
println("${ok} ${value}")  # true 42

println(rgb)   # (255, 0, 128)
println(user)  # (Alice, 30, true)
```

### When to Use Lists

```suji
import std:println

# Variable number of items
numbers = [1, 2, 3, 4, 5]  # Could be any length

# Same type collection
names = ["Alice", "Bob", "Charlie"]

# Need to add/remove items
items = [1, 2, 3]
items::push(4)  # Grows dynamically

println(numbers::length())  # 5
println(names::join(", "))  # Alice, Bob, Charlie
println(items)              # [1, 2, 3, 4]
```

## Common Pitfalls

### Pitfall 1: Forgetting Comma for Single Element

```suji
import std:println

# Not a tuple - just a number in parentheses
not_tuple = (42)
println(not_tuple::is_tuple())  # false

# Single-element tuple needs trailing comma
one_tuple = (42,)
println(one_tuple::is_tuple())  # true
println(one_tuple::length())    # 1
```

### Pitfall 2: Trying to Modify or Index

```suji
import std:println

triple = (1, 2, 3)

# Neither of these works:
# triple[0] = 10   # Error: Type error: Cannot assign index on tuple
# println(triple[0])  # Error: Type error: Cannot index tuple

# Destructure, then build a new tuple
a, b, c = triple
updated = (10, b, c)
println(updated)  # (10, 2, 3)
```

### Pitfall 3: Wrong Number of Variables

```suji
import std:println

triple = (1, 2, 3)

# Too few targets:
# a, b = triple  # Error: Destructuring arity mismatch: expected 2, got 3

# Match the count
a, b, c = triple
println("${a}${b}${c}")  # 123

# Or use underscore for unwanted values
a, _, c = triple
println("${a}${c}")  # 13
```

### Pitfall 4: Confusion with Function Calls

```suji
import std:println

calculate = |a, b| a * b

# Parentheses for grouping
println((5 + 3) * 2)   # 16

# Parentheses for a function call
println(calculate(5, 3))  # 15

# Tuple (note the comma!)
coords = (5, 3)
println(coords)  # (5, 3)
```

## Advanced Usage

### Tuple Unpacking in Loops

A loop binds one variable per element. `loop through points with x, y` is a
runtime error — two bindings only work for maps — so destructure inside the body:

```suji
import std:println

# List of tuples
points = [(1, 2), (3, 4), (5, 6)]

loop through points with point {
    x, y = point
    println("Point: (${x}, ${y})")
}
# Point: (1, 2)
# Point: (3, 4)
# Point: (5, 6)
```

Maps are the exception, and `map::to_list()` gives you exactly this shape:

```suji
import std:println

scores = {alice: 3, bob: 5}

loop through scores with name, score {
    println("${name} scored ${score}")
}
# alice scored 3
# bob scored 5
```

### Nested Destructuring

Destructuring does not recurse. Unpack one level at a time:

```suji
import std:println

# Complex nested structure
data = (1, (2, 3, (4, 5)), 6)

a, middle, f = data
b, c, innermost = middle
d, e = innermost

println("${a}, ${b}, ${c}, ${d}, ${e}, ${f}")
# 1, 2, 3, 4, 5, 6
```

### Pattern Matching with Tuples

Tuple patterns work, and `_` is a wildcard inside them. What does **not** work is
binding: patterns cannot introduce variables, and a bare identifier in a pattern
is read as a string literal. So use `_` for "anything" and fall through to a
conditional `match` when you need to look at the values.

```suji
import std:println

classify_point = |point| {
    match point {
        (0, 0) => "origin",
        (0, _) => "on y-axis",
        (_, 0) => "on x-axis",
        _ => {
            x, y = point
            match { x == y => "on diagonal", _ => "elsewhere", }
        }
    }
}

println(classify_point((0, 0)))    # origin
println(classify_point((0, 5)))    # on y-axis
println(classify_point((3, 0)))    # on x-axis
println(classify_point((4, 4)))    # on diagonal
println(classify_point((2, 3)))    # elsewhere
```

## Examples

### RGB to HSV Conversion

```suji
import std:println

rgb_to_hsv = |r, g, b| {
    r = r / 255
    g = g / 255
    b = b / 255
    
    max_val = match {
        r >= g && r >= b => r,
        g >= b => g,
        _ => b,
    }
    min_val = match {
        r <= g && r <= b => r,
        g <= b => g,
        _ => b,
    }
    delta = max_val - min_val
    
    # Calculate hue
    h = match {
        delta == 0 => 0,
        max_val == r => 60 * (((g - b) / delta) % 6),
        max_val == g => 60 * (((b - r) / delta) + 2),
        _ => 60 * (((r - g) / delta) + 4),
    }
    
    # Calculate saturation
    s = match max_val {
        0 => 0,
        _ => delta / max_val,
    }
    
    v = max_val
    
    return (h, s, v)
}

h, s, v = rgb_to_hsv(255, 0, 0)  # Red
println("H: ${h}, S: ${s}, V: ${v}")  # H: 0, S: 1, V: 1
```

### Statistics

```suji
import std:println

calculate_stats = |numbers| {
    total = numbers::sum()
    count = numbers::length()
    mean = total / count

    sorted = numbers::sort()
    mid = (count / 2)::floor()
    median = match count % 2 {
        0 => (sorted[mid - 1] + sorted[mid]) / 2,
        _ => sorted[mid],
    }

    return (mean, median, total, count)
}

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
mean, median, sum, count = calculate_stats(data)

println("Mean: ${mean}")      # Mean: 5.50
println("Median: ${median}")  # Median: 5.50
println("Sum: ${sum}")        # Sum: 55
println("Count: ${count}")    # Count: 10
```

## Best Practices

### DO:
- Use for multiple return values
- Destructure immediately when possible
- Use underscore for unused values
- Keep tuples small (2-4 elements ideal)
- Document tuple structure in function names

### DON'T:
- Try to index a tuple (`t[0]`) or reach for `get`/`first`/`second` — destructure,
  or call `to_list()` if you really need positional access
- Wrap destructuring targets in parentheses (`(a, b) = t` is not destructuring)
- Order tuples with `<`/`>` — only `==` and `!=` are defined
- Use tuples for large collections
- Create deeply nested tuples (use maps instead)
- Forget trailing comma for single-element tuples

## Next Steps

- Learn about [Pattern Matching](../control-flow/match.md) with tuples
- Explore [Functions](../../functions/multiple-returns.md) returning tuples
- Study [Destructuring](../../advanced/pattern-matching.md) patterns
- Check out [Lists](lists.md) for variable-size collections

## See Also

- [Lists](lists.md)
- [Maps](maps.md)
- [Multiple Return Values](../../functions/multiple-returns.md)
- [Pattern Matching](../control-flow/match.md)
