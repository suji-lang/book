# Functions

Functions are first-class values in Suji that can be passed around, stored, and returned.

## Overview

Functions encapsulate reusable logic and are treated as values like numbers or
strings. This page covers functions *as a data type*: how to create them, what a
function value can do, and how they interact with the rest of the language. For
deeper treatment of individual topics see
[Higher-Order Functions](../../functions/higher-order.md),
[Closures](../../functions/closures.md),
[Recursion](../../functions/recursion.md) and
[Multiple Return Values](../../functions/multiple-returns.md).

### Key Characteristics

- **Lambda syntax only** - `name = |a, b| …`. There is no `fn`, `def`, `func` or
  `function` keyword; a function is just a value you bind to a variable.
- **First-class** - Functions can be stored in lists and maps, passed as
  arguments, and returned from other functions
- **Closures** - Capture the enclosing scope by reference, and can mutate what
  they capture
- **Default parameter values** - `|a, b = 10| …`
- **Multiple return values** - Using tuples
- **No variadics, no keyword arguments** - Take a list or a map instead

### When to Use Functions

Use functions for:
- Reusable logic
- Abstraction and composition
- Callbacks and event handlers
- Data transformations
- Building DSLs

## Syntax

### Function Definition

A function value is written with pipes around the parameter list, followed by
either a single expression or a `{ … }` block.

```suji
import std:println

# Basic function
greet = |name| {
    "Hello, ${name}!"
}

# Multiple parameters
add = |a, b| {
    a + b
}

# No parameters
answer = || {
    42
}

# Single expression (no braces needed)
double = |x| x * 2

println(greet("Alice"))  # Hello, Alice!
println(add(2, 3))       # 5
println(answer())        # 42
println(double(21))      # 42
```

Because a function is an ordinary value, it has the usual type predicate and can
be stored anywhere:

```suji
import std:println

double = |x| x * 2

println(double::is_function())  # true

# Functions in a map, used as a dispatch table
ops = {"double": double, "negate": |x| 0 - x}
println(ops:double(7))  # 14
println(ops:negate(7))  # -7
```

### Function Calls

```suji
import std:println

greet = |name| "Hello, ${name}!"

# Call function
message = greet("Alice")
println(message)  # Hello, Alice!

# Direct call
println(greet("Bob"))  # Hello, Bob!
```

Arity is checked at call time: passing the wrong number of arguments raises
*Arity mismatch: Function expects N arguments, got M* and stops the program.

There are two pipe-apply operators for feeding a value into a function, which
often reads better than nesting calls — see
[Pipe Apply](../operators/pipe-apply.md):

```suji
import std:println

double = |x| x * 2

println(5 |> double)   # 10  (forward)
println(double <| 5)   # 10  (backward)
```

## Parameters

### Required Parameters

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

println(calculate(10, 5, "add"))       # 15
println(calculate(10, 5, "multiply"))  # 50
```

### Default Values

A parameter can declare a default, which applies when the argument is omitted:

```suji
import std:println

greet = |name, title = "Mr./Ms."| "${title} ${name}"

println(greet("Alice", "Dr."))  # Dr. Alice
println(greet("Bob"))           # Mr./Ms. Bob
```

Defaults only fill in *missing* arguments. Passing `nil` explicitly passes `nil`;
if you want `nil` to mean "use the default", check for it in the body.

### Variable Arguments

Suji has no variadic parameters and no keyword arguments. Accept a list when the
count varies, or a map when you want named options:

```suji
import std:println

# Using a list for a variable number of values
sum_all = |numbers| numbers::fold(0, |acc, x| acc + x)
println(sum_all([1, 2, 3, 4, 5]))  # 15

# Using a map for named options, with get() supplying defaults
render = |text, options| {
    prefix = options::get("prefix", "- ")
    upper = options::get("upper", false)
    body = match upper {
        true => text::upper(),
        _ => text,
    }
    "${prefix}${body}"
}

println(render("hello", {}))                # - hello
println(render("hello", {"upper": true}))   # - HELLO
```

## Return Values

### Explicit Return

```suji
import std:println

find_first = |list, predicate| {
    loop through list with item {
        predicate(item) && return item  # Early return
    }
    nil  # Default return
}

numbers = [1, 2, 3, 4, 5]
println(find_first(numbers, |x| x > 3))  # 4
```

### Implicit Return

Last expression is returned:

```suji
import std:println

add = |a, b| {
    a + b  # Returned automatically
}

println(add(3, 4))  # 7
```

### Multiple Return Values

Use tuples:

```suji
import std:println

divide_with_remainder = |a, b| {
    quotient = (a / b)::floor()
    remainder = a % b
    return (quotient, remainder)
}

q, r = divide_with_remainder(17, 5)
println("${q} remainder ${r}")  # 3 remainder 2
```

Two details worth remembering: destructuring targets are written **without**
parentheses (`q, r = …`), and the tuple is returned with an explicit `return`
because a line that starts with `(` would otherwise be parsed as a call on the
previous line's value. `return a, b` builds the tuple for you as well.

## Closures

Functions capture variables from their surrounding scope:

```suji
import std:println

make_adder = |x| {
    |y| x + y  # Captures x
}

add_5 = make_adder(5)
add_10 = make_adder(10)

println(add_5(3))   # 8 (5 + 3)
println(add_10(3))  # 13 (10 + 3)
```

### Closure Example

Captured variables are shared by reference, so a closure can keep mutable state.
Note the explicit `return`: a line beginning with `||` would otherwise be read as
a logical-or continuing the previous line.

```suji
import std:println

make_counter = || {
    count = 0
    return || {
        count = count + 1
        count
    }
}

counter = make_counter()
println(counter())  # 1
println(counter())  # 2
println(counter())  # 3
```

## Higher-Order Functions

Functions that accept or return functions:

### Functions as Parameters

```suji
import std:println

apply_twice = |fn, x| {
    fn(fn(x))
}

double = |x| x * 2
println(apply_twice(double, 3))  # 12 (double(double(3)))

increment = |x| x + 1
println(apply_twice(increment, 5))  # 7
```

### Functions as Return Values

```suji
import std:println

multiplier = |factor| {
    |x| x * factor
}

times_2 = multiplier(2)
times_10 = multiplier(10)

println(times_2(5))   # 10
println(times_10(5))  # 50
```

## Common Patterns

### Partial Application

There is no partial-application syntax; return a lambda from a lambda instead:

```suji
import std:println

greet_with = |greeting| {
    |name| "${greeting}, ${name}!"
}

hello = greet_with("Hello")
hi = greet_with("Hi")

println(hello("Alice"))  # Hello, Alice!
println(hi("Bob"))       # Hi, Bob!
```

### Function Composition

```suji
import std:println

compose = |f, g| {
    |x| f(g(x))
}

add_1 = |x| x + 1
times_2 = |x| x * 2

# (x + 1) * 2
add_then_multiply = compose(times_2, add_1)
println(add_then_multiply(5))  # 12

# (x * 2) + 1
multiply_then_add = compose(add_1, times_2)
println(multiply_then_add(5))  # 11
```

Suji also has built-in composition operators, so you rarely need to write
`compose` yourself: `f >> g` is "f then g" and `f << g` is "g then f". See
[Composition Operators](../operators/composition.md).

```suji
import std:println

add_1 = |x| x + 1
times_2 = |x| x * 2

println((add_1 >> times_2)(5))  # 12
println((add_1 << times_2)(5))  # 11
```

### Currying

```suji
import std:println

# Curried function
curry_add = |a| |b| |c| a + b + c

# Partial application
add_1 = curry_add(1)
add_1_2 = add_1(2)
result = add_1_2(3)

println(result)  # 6

# Or all at once
println(curry_add(1)(2)(3))  # 6
```

### Memoization

```suji
import std:println

memoize = |fn| {
    cache = {}
    return |arg| {
        match cache::contains(arg) {
            true => cache::get(arg),
            false => {
                result = fn(arg)
                cache[arg] = result
                result
            }
        }
    }
}

# Example: memoize a function and avoid repeating work
calls = 0
slow_square = |n| {
    calls = calls + 1
    n * n
}

fast_square = memoize(slow_square)
println(fast_square(5))  # 25
println(fast_square(5))  # 25
println(calls)           # 1
```

## Recursion

Functions can call themselves:

```suji
import std:println

# Factorial
factorial = |n| {
    match n {
        0 => 1,
        _ => n * factorial(n - 1),
    }
}

println(factorial(5))  # 120

# Fibonacci
fib = |n| {
    match n {
        0 => 0,
        1 => 1,
        _ => fib(n - 1) + fib(n - 2),
    }
}

println(fib(10))  # 55
```

### Recursion Depth

Suji does **not** optimise tail calls. Every recursive call is a real stack frame,
and somewhere around 600–700 frames deep the process aborts with a stack
overflow. Writing a call in tail position does not change that:

```suji
import std:println

# "Tail-recursive" in shape, but still one frame per call
factorial = |n| {
    helper = |n, acc| {
        match n {
            0 => acc,
            _ => helper(n - 1, n * acc),
        }
    }
    helper(n, 1)
}

println(factorial(5))  # 120
```

For anything that could run deep, use a `loop` instead of recursion:

```suji
import std:println

sum_to = |n| {
    total = 0
    loop through 1..=n with i {
        total += i
    }
    total
}

println(sum_to(100000))  # 5000050000
```

## Lambda Expressions

Short anonymous functions:

```suji
import std:println

# In map
numbers = [1, 2, 3, 4, 5]
squares = numbers::map(|x| x * x)
println(squares)  # [1, 4, 9, 16, 25]

# In filter
evens = numbers::filter(|x| x % 2 == 0)
println(evens)  # [2, 4]

# In fold (the method is fold, not reduce)
sum = numbers::fold(0, |acc, x| acc + x)
println(sum)  # 15
```

## Common Pitfalls

### Pitfall 1: Forgetting to Call Function

```suji
import std:println

greet = |name| "Hello, ${name}!"

# This is the function value, not the result
result = greet
println(result::is_function())  # true

# Call the function
result = greet("Alice")
println(result)  # Hello, Alice!
```

### Pitfall 2: Closure Variable Capture

Closures capture the enclosing scope **by reference**, so later changes to a
captured variable are visible inside the closure:

```suji
import std:println

factor = 2
scale = |x| x * factor

println(scale(5))  # 10

# Reassigning the captured variable changes what the closure computes
factor = 10
println(scale(5))  # 50
```

Loop bindings, on the other hand, are fresh each iteration, so closures created
in a loop each keep their own value — the "all my callbacks see the last index"
bug from other languages does not happen here:

```suji
import std:println

functions = []
loop through [1, 2, 3] with i {
    functions::push(|| i)
}

println(functions::first()())  # 1
println(functions::last()())   # 3
```

### Pitfall 3: Missing Base Case

There is no way to catch a stack overflow, so a runaway recursion kills the
process:

```suji
import std:println

# No base case - would abort with a stack overflow:
# countdown = |n| {
#     println(n)
#     countdown(n - 1)
# }

# Always have a base case
countdown = |n| {
    n <= 0 && return nil
    println(n)
    countdown(n - 1)
}

countdown(3)
# 3
# 2
# 1
```

## Best Practices

### DO:
- Use descriptive function names (verbs)
- Keep functions small and focused
- Use lambdas for simple transformations
- Leverage closures when appropriate
- Document complex functions

### DON'T:
- Create overly long functions
- Mix concerns in one function
- Forget base cases in recursion
- Capture mutable state carelessly
- Ignore function return values

## Examples

### Map-Filter-Fold Pipeline

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

result = numbers
  ::filter(|x| x % 2 == 0)       # [2, 4, 6, 8, 10]
  ::map(|x| x * x)               # [4, 16, 36, 64, 100]
  ::fold(0, |acc, x| acc + x)    # 220

println(result)
```

### Function Builder

```suji
import std:println

operation = |op| {
    match op {
        "add" => |a, b| a + b,
        "subtract" => |a, b| a - b,
        "multiply" => |a, b| a * b,
        "divide" => |a, b| a / b,
        _ => |a, b| 0,
    }
}

add = operation("add")
multiply = operation("multiply")

println(add(5, 3))       # 8
println(multiply(5, 3))  # 15
```

### Retry Logic

```suji
import std:println

retry = |fn, max_attempts| {
    attempt = 1
    loop {
        result = fn()
        # Bind the condition first: a line starting with "(" would be parsed
        # as a call on the previous line's value.
        done = result != nil || attempt >= max_attempts
        done && return result
        attempt++
    }
}

# Simulated flaky function: fails twice, then succeeds
tries = 0
flaky = || {
    tries++
    match {
        tries < 3 => nil,
        _ => "ok",
    }
}

println(retry(flaky, 5))  # ok
println(tries)            # 3
```

`loop` always evaluates to `nil` and `break <value>` is not supported, so an
explicit `return` from inside the loop is how you hand a result back.

## Next Steps

- Learn about [Higher-Order Functions](../../functions/higher-order.md)
- Explore [Closures](../../functions/closures.md) in detail
- Study [Composition Operators](../operators/composition.md)
- Check out [Recursion](../../functions/recursion.md) patterns

## See Also

- [Function Basics](../../functions/README.md)
- [Higher-Order Functions](../../functions/higher-order.md)
- [Closures](../../functions/closures.md)
- [Multiple Return Values](../../functions/multiple-returns.md)
- [Composition Operators](../operators/composition.md)
- [Pipe Apply](../operators/pipe-apply.md)
- [Pattern Matching](../control-flow/match.md)

