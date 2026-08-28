# Function Basics

Learn the fundamentals of defining, calling, and using functions in Suji.

## Defining Functions

Functions are created with the pipe syntax `|parameters| { body }` and bound to a name
with `=`. There is no separate declaration keyword:

```suji
import std:println
import std:time

# Basic function
greet = |name| {
    "Hello, ${name}!"
}

# Multiple parameters
add = |a, b| {
    a + b
}

# No parameters
get_timestamp = || {
    time:now():epoch_ms
}

# Single expression (no braces needed)
double = |x| x * 2
square = |x| x * x
```

## Calling Functions

```suji
import std:println

greet = |name| "Hello, ${name}!"
add = |a, b| a + b
double = |x| x * 2

# Direct call
println(greet("Alice"))  # Hello, Alice!

# Store result
message = greet("Bob")
println(message)  # Hello, Bob!

# Chain calls
result = double(add(3, 4))
println(result)  # 14
```

## Parameters

### Required Parameters

Every parameter without a default must be provided. Arity is checked at call time, so
a missing argument is a runtime error, not `nil`:

```suji
import std:println

calculate = |x, y, operation| {
    match operation {
        "add" => x + y,
        "subtract" => x - y,
        "multiply" => x * y,
        "divide" => x / y,
        _ => 0,
    }
}

println(calculate(10, 5, "add"))  # 15

# calculate(10, 5)
# => Arity mismatch: Function expects 3 arguments, got 2
```

### Default Values

Give a parameter a default with `=` in the parameter list. The default is used when the
argument is omitted:

```suji
import std:println

greet = |name, title = "Mr./Ms."| "${title} ${name}"

println(greet("Alice", "Dr."))  # Dr. Alice
println(greet("Bob"))           # Mr./Ms. Bob
```

Passing `nil` explicitly passes `nil` — it does not fall back to the default. Handle
that case with `match` if callers may supply `nil`:

```suji
import std:println

greet = |name, title| {
    label = match title {
        nil => "Mr./Ms.",
        _ => title,
    }
    "${label} ${name}"
}

println(greet("Alice", "Dr."))  # Dr. Alice
println(greet("Bob", nil))      # Mr./Ms. Bob
```

A bare identifier in a `match` pattern is a **string literal**, not a binding, so the
fallback arm has to be `_` and read the parameter directly.

### Variable Arguments Pattern

There are no variadic parameters. Accept a list instead:

```suji
import std:println

sum_all = |numbers| {
    numbers::fold(0, |acc, x| acc + x)
}

println(sum_all([1, 2, 3]))       # 6
println(sum_all([1, 2, 3, 4, 5])) # 15
```

## Return Values

### Implicit Return

Last expression is automatically returned:

```suji
import std:println

add = |a, b| {
    a + b  # Returned automatically
}

println(add(3, 4))  # 7
```

### Explicit Return

Use `return` for early exit:

```suji
import std:println

find_first = |list, predicate| {
    loop through list with item {
        predicate(item) && return item  # Early return
    }
    nil  # Not found
}

numbers = [1, 2, 3, 4, 5]
println(find_first(numbers, |x| x > 3))  # 4
```

### Multiple Return Values

Return several values with `return a, b`, and destructure them without parentheses:

```suji
import std:println

divide_with_remainder = |a, b| {
    return (a / b)::floor(), a % b
}

quotient, remainder = divide_with_remainder(17, 5)
println("${quotient} remainder ${remainder}")  # 3 remainder 2
```

### No Return Value

Functions can perform side effects without returning:

```suji
import std:println

log_message = |message| {
    println("[LOG] ${message}")
    # No explicit return (returns nil implicitly)
}

log_message("Application started")
```

## Function Scope

### Local Variables

Variables defined in functions are local:

```suji
import std:println

calculate = |x| {
    temp = x * 2
    result = temp + 10
    result
}

println(calculate(5))  # 20
# temp and result are not accessible here
```

### Capturing Outer Variables

Functions can access variables from outer scope:

```suji
import std:println

multiplier = 10

scale = |x| {
    x * multiplier  # Accesses outer variable
}

println(scale(5))  # 50
```

## Function as Values

Functions are first-class values:

```suji
import std:println

# Store in variable
double = |x| x * 2

# Store in list
operations = [
    |x| x + 1,
    |x| x * 2,
    |x| x ^ 2,
]

times_2 = operations[1]
println(times_2(5))  # 10 (second function)

# Store in map
math_ops = {
    add: |a, b| a + b,
    sub: |a, b| a - b,
    mul: |a, b| a * b,
}

println(math_ops:add(3, 4))  # 7
```

## Common Patterns

### Predicate Functions

Return boolean:

```suji
import std:println

is_even = |x| x % 2 == 0
is_positive = |x| x > 0
is_adult = |age| age >= 18

println(is_even(4))      # true
println(is_positive(-5)) # false
println(is_adult(25))    # true
```

### Transformer Functions

Transform input to output:

```suji
import std:println

to_upper = |text| text::upper()
trim_and_lower = |text| text::trim()::lower()
add_prefix = |text| "PREFIX_${text}"

println(to_upper("hello"))  # HELLO
```

### Validator Functions

Validate and return result:

```suji
import std:println

validate_email = |email| {
    missing = email == nil || email::length() == 0
    missing && return false, "Email is required"
    !(email ~ /^[^@]+@[^@]+$/) && return false, "Invalid email format"

    return true, nil
}

valid, error = validate_email("test@example.com")
println(valid)  # true

ok, why = validate_email("not-an-email")
println(why)  # Invalid email format
```

Note the explicit `return true, nil` at the end: a line starting with `(` would be
parsed as a call on the previous line's value.

## Best Practices

### DO:
- Use descriptive verb names (calculate, validate, transform)
- Keep functions small and focused
- Document complex behavior
- Handle edge cases
- Return consistent types

### DON'T:
- Create functions with too many parameters
- Mix different concerns
- Use cryptic abbreviations
- Ignore error cases
- Create side effects unexpectedly

## See Also

- [Closures](closures.md)
- [Higher-Order Functions](higher-order.md)
- [Multiple Returns](multiple-returns.md)
- [Recursion](recursion.md)
