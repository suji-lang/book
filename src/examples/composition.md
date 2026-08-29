# Function Composition

Build complex transformations by composing simple functions.

## Overview

This example demonstrates:
- Forward composition (`>>`)
- Backward composition (`<<`)
- Building data pipelines
- Function chaining
- Composing multiple operations

## Prerequisites

- [Functions](../functions/basics.md)
- [Function Composition](../fundamentals/operators/composition.md)
- [Higher-Order Functions](../functions/higher-order.md)

## Complete Code

```suji
import std:println

# Simple transformations
double = |x| x * 2
increment = |x| x + 1
square = |x| x * x

# Forward composition (left to right)
transform1 = double >> increment >> square
println("double >> increment >> square: ${transform1(5)}")

# Backward composition (right to left)
transform2 = square << increment << double
println("square << increment << double: ${transform2(5)}")

# Practical example: text processing
trim = |s| s::trim()
upper = |s| s::upper()
add_prefix = |prefix| |s| "${prefix}${s}"

process_title = trim >> upper >> add_prefix("Title: ")

println(process_title("  hello world  "))
```

Output:

```text
double >> increment >> square: 121
square << increment << double: 121
Title: HELLO WORLD
```

Both compositions compute `((5 * 2) + 1)² = 121`; they differ only in reading order.

## Step-by-Step Explanation

### 1. Define Simple Functions

```suji
import std:println

double = |x| x * 2
increment = |x| x + 1
square = |x| x * x

println(square(increment(double(5))))  # 121
```

Each function performs one simple transformation. There is no `fn` keyword in Suji — functions are lambdas assigned to a name.

### 2. Forward Composition (`>>`)

```suji
import std:println

double = |x| x * 2
increment = |x| x + 1
square = |x| x * x

transform = double >> increment >> square
println(transform(5))  # 121
```

- Read left-to-right: `double` first, then `increment`, then `square`
- Equivalent to `square(increment(double(x)))`

### 3. Backward Composition (`<<`)

```suji
import std:println

double = |x| x * 2
increment = |x| x + 1
square = |x| x * x

transform = square << increment << double
println(transform(5))  # 121
```

- Read right-to-left, the way nested calls are written
- `f << g` means "`g` then `f`"

### 4. Practical Pipeline

```suji
import std:println

trim = |s| s::trim()
upper = |s| s::upper()
add_prefix = |prefix| |s| "${prefix}${s}"

process_title = trim >> upper >> add_prefix("Title: ")

println(process_title("  hello world  "))  # Title: HELLO WORLD
```

`add_prefix` is a function returning a function — Suji has no partial application syntax, so a lambda returning a lambda is how you bind arguments ahead of time.

## Variation 1: Data Validation Pipeline

There is no `Result` type and no way to catch an error, so a validating pipeline passes `nil` along and every stage has to tolerate it:

```suji
import std:println

normalize = |s| match {
    s == nil => nil,
    _ => s::lower()::trim(),
}

not_empty = |s| match {
    s == nil => nil,
    s::length() > 0 => s,
    _ => nil,
}

is_email = |s| match {
    s == nil => nil,
    s ~ /^[^@]+@[^@]+$/ => s,
    _ => nil,
}

validate_email = normalize >> not_empty >> is_email

check = |input| {
    result = validate_email(input)
    match {
        result == nil => { println("Invalid email") },
        _ => { println("Valid: ${result}") },
    }
}

check("  USER@EXAMPLE.COM  ")
check("   ")
check("not-an-email")
```

Output:

```text
Valid: user@example.com
Invalid email
Invalid email
```

Note the conditional `match` form. In a subject `match`, a bare identifier is treated as a **string literal pattern**, not a binding — `match x { email => ... }` matches the literal text `"email"`, which is a common source of silent `nil` results.

## Variation 2: Mathematical Functions

```suji
import std:println

negate = |x| -x
reciprocal = |x| 1 / x
absolute = |x| x::abs()

safe_reciprocal = absolute >> reciprocal
println(safe_reciprocal(-4))  # 0.25
println(negate(0.25))         # -0.25
```

`abs`, `sqrt`, `pow`, `floor`, `ceil` and `round` are **number methods**, not functions in `std:math` — `math` only carries the trigonometric and logarithmic functions plus `PI` and `E`.

Dividing by zero terminates the program, so a truly safe reciprocal has to check first:

```suji
import std:println

reciprocal = |x| match {
    x == 0 => nil,
    _ => 1 / x,
}

println(reciprocal(4))  # 0.25
println(reciprocal(0))  # nil
```

## Variation 3: List Transformations

```suji
import std:println

filter_even = |list| list::filter(|x| x % 2 == 0)
map_double = |list| list::map(|x| x * 2)
sum_all = |list| list::fold(0, |acc, x| acc + x)

sum_of_doubled_evens = filter_even >> map_double >> sum_all

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
println(sum_of_doubled_evens(numbers))  # 60
```

`(2 + 4 + 6 + 8 + 10) * 2 = 60`. There is no `list::reduce`; `fold(initial, fn)` is the equivalent, and `list::sum()` covers this particular case in one call.

## Complete Example: Data Processing Pipeline

```suji
import std:io
import std:json
import std:os
import std:println

# Sample input
path = `mktemp`
f = io:open(path, true, true)
f::write("""{
  "users": [
    {"name": "Carol", "email": "carol@example.com", "active": true},
    {"name": "Alice", "email": "alice@example.com", "active": true},
    {"name": "Bob", "email": "bob@example.com", "active": false}
  ]
}""")
f::close()

# Transformation steps
parse_json = |text| json:parse(text)
extract_users = |data| data:users
filter_active = |users| users::filter(|u| u:active)
map_summary = |users| users::map(|u| {
    { "name": u:name, "email": u:email }
})

sort_by_name = |users| {
    # list::sort() sorts numbers and strings, but there is no sort_by,
    # so sort the names and rebuild the list in that order.
    names = users::map(|u| u:name)::sort()
    names::map(|name| users::filter(|u| u:name == name)::first(nil))
}

process_users = parse_json
    >> extract_users
    >> filter_active
    >> map_summary
    >> sort_by_name

file = io:open(path)
content = file::read_all()
file::close()

active_users = process_users(content)

println("Found ${active_users::length()} active users")
loop through active_users with user {
    println("  ${user:name} <${user:email}>")
}

os:rm(path)
```

Output:

```text
Found 2 active users
  Alice <alice@example.com>
  Carol <carol@example.com>
```

A composition may be written across several lines as long as the continuation line starts with the operator, as `process_users` does above.

## Composition vs Piping

### Composition (Creates a New Function)

```suji
import std:println

trim = |s| s::trim()
lower = |s| s::lower()
no_spaces = |s| s::replace(" ", "")

normalize = trim >> lower >> no_spaces

println(normalize("  HELLO WORLD  "))  # helloworld
println(normalize("  TEST @ TEST  "))  # test@test
```

### Piping (Immediate Execution)

```suji
import std:println

input = "  HELLO WORLD  "

# Method chaining
println(input::trim()::lower())  # hello world

# Pipe-apply sends a value into a function
shout = |s| s::upper() + "!"
println("hello" |> shout)  # HELLO!
println(shout <| "hello")  # HELLO!
```

**Use composition when**: you want a reusable transformation function.

**Use piping when**: you want to transform one value right now.

## Exercises

### Beginner

1. Create a pipeline that doubles a number, adds 10, then halves it
2. Compose string functions into a slug maker (lowercase, spaces to hyphens)
3. Build a validation chain for passwords (length, digit, symbol)

### Intermediate

4. Write `compose_all(list_of_functions)` that folds a list into one function
5. Make a composition that returns `(value, error)` tuples instead of `nil`
6. Build a sanitisation pipeline for untrusted user input

### Advanced

7. Add tracing: wrap each stage so it prints its input and output
8. Build a pipeline whose stages are chosen from a configuration map
9. Implement a reversible pipeline where every stage has an inverse

## Common Patterns

### Pattern 1: Build Transform, Apply to Many

```suji
import std:println

trim = |s| s::trim()
lower = |s| s::lower()
sanitize = trim >> lower

inputs = ["  Alice  ", "BOB", " Carol "]
println(inputs::map(sanitize)::join(", "))  # alice, bob, carol
```

### Pattern 2: Conditional Composition

```suji
import std:println

trim = |s| s::trim()
lower = |s| s::lower()
log_step = |s| {
    println("  [log] ${s}")
    s
}

with_logging = true

process = trim >> lower
process = match {
    with_logging => process >> log_step,
    _ => process,
}

println(process("  MIXED Case  "))
```

Output:

```text
  [log] mixed case
mixed case
```

### Pattern 3: Partial Application with Composition

```suji
import std:println

add = |x| |y| x + y
multiply = |x| |y| x * y

scale_and_shift = multiply(2) >> add(10)
println(scale_and_shift(5))  # 20
```

## See Also

- [Function Composition Operator](../fundamentals/operators/composition.md)
- [Higher-Order Functions](../functions/higher-order.md)
- [Pipe Operators](../fundamentals/operators/pipe.md)
- [Functions](../functions/basics.md)
