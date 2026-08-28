# Functions

Functions are first-class values in Suji that encapsulate reusable logic and enable functional programming patterns.

## Overview

In Suji, functions are treated as values just like numbers or strings. You can pass them as arguments, return them from other functions, and store them in data structures.

## Function Basics

### Defining Functions

Every function in Suji is a lambda assigned to a name — there is no `fn`, `def` or
`function` declaration keyword:

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
get_pi = || {
    3.14159
}

# Single expression (implicit return)
double = |x| x * 2

# Default parameter value
increment = |x, step = 1| x + step
```

### Calling Functions

```suji
import std:println

greet = |name| "Hello, ${name}!"

# Call the function
message = greet("Alice")
println(message)  # Hello, Alice!

# Direct call
println(greet("Bob"))  # Hello, Bob!
```

[Learn more about Function Basics →](basics.md)

## Closures

Functions capture variables from their surrounding scope:

```suji
import std:println

make_counter = || {
    count = 0
    increment = || {
        count = count + 1
        count
    }
    increment
}

counter = make_counter()
println(counter())  # 1
println(counter())  # 2
println(counter())  # 3
```

The returned closure is bound to a name (`increment`) before it is returned. A line
that begins with `|` would otherwise be read as the pipeline operator continuing the
previous statement.

[Learn more about Closures →](closures.md)

## Higher-Order Functions

Functions that take functions as parameters or return functions:

```suji
import std:println

# Takes a function as parameter
apply_twice = |fn, x| {
    fn(fn(x))
}

double = |x| x * 2
println(apply_twice(double, 5))  # 20

# Returns a function
multiplier = |factor| {
    |x| x * factor
}

times_3 = multiplier(3)
println(times_3(5))  # 15
```

[Learn more about Higher-Order Functions →](higher-order.md)

## Function Composition

Combine functions to create new functions:

```suji
import std:println

add_1 = |x| x + 1
times_2 = |x| x * 2

# Compose: (x + 1) * 2
composed = add_1 >> times_2
println(composed(5))  # 12

# Reverse: (x * 2) + 1
reversed = add_1 << times_2
println(reversed(5))  # 11
```

[Learn more about Function Composition →](../fundamentals/operators/composition.md)

## Recursion

Functions that call themselves. Note that every `match` arm whose body is a bare
expression needs a trailing comma, including the last one:

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

# Accumulator version — the same depth of recursion, just a different shape
factorial_acc = |n| {
    helper = |n, acc| {
        match n {
            0 => acc,
            _ => helper(n - 1, n * acc),
        }
    }
    helper(n, 1)
}

println(factorial_acc(5))  # 120
```

Suji has no tail-call optimisation, so recursion is limited by the native stack —
see [Recursion](recursion.md) for the depth you can rely on.

[Learn more about Recursion →](recursion.md)

## Multiple Return Values

Use tuples to return multiple values:

```suji
import std:println

divide_with_remainder = |a, b| {
    quotient = (a / b)::floor()
    return quotient, a % b
}

q, r = divide_with_remainder(17, 5)
println("${q} remainder ${r}")  # 3 remainder 2
```

Destructuring targets are written without parentheses (`q, r = …`); a line that starts
with `(` is read as a call on the previous expression.

[Learn more about Multiple Returns →](multiple-returns.md)

## Common Patterns

### Partial Application

There is no partial-application operator; return a lambda from a lambda instead:

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
```

### Function Pipeline

```suji
import std:println

validate = |data| data::filter(|x| x != nil)
transform = |data| data::map(|x| x * 2)
enrich = |data| data + [0]

process_data = |data| {
    validated = validate(data)
    transformed = transform(validated)
    enrich(transformed)
}

println(process_data([1, nil, 3]))  # [2, 6, 0]
```

### Memoization

A closure over a cache map turns an expensive recursive function into a fast one:

```suji
import std:println

fib_cache = {0: 0, 1: 1}

fib = |n| {
    fib_cache::contains(n) && return fib_cache[n]
    result = fib(n - 1) + fib(n - 2)
    fib_cache[n] = result
    result
}

println(fib(60))  # 1548008755920
```

## Function Types

### Pure Functions

No side effects, same input always produces same output:

```suji
# Pure: depends only on parameters
add = |a, b| a + b

# Pure: deterministic
double = |x| x * 2
```

### Impure Functions

Have side effects or depend on external state:

```suji
import std:println

# Impure: side effect (printing)
log = |message| {
    println(message)
}

# Impure: depends on external state
counter = 0
increment = || {
    counter = counter + 1
    counter
}
```

### Anonymous Functions (Lambdas)

Inline functions without names:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

# Anonymous function in map
doubled = numbers::map(|x| x * 2)

# Anonymous function in filter
evens = numbers::filter(|x| x % 2 == 0)
```

## Best Practices

### DO:
- Keep functions small and focused (single responsibility)
- Use descriptive names (verbs for actions)
- Prefer pure functions when possible
- Use closures for encapsulation
- Leverage higher-order functions for abstraction

### DON'T:
- Create functions with too many parameters (>4)
- Mix concerns in a single function
- Forget to handle edge cases
- Create deeply nested functions
- Ignore function return values

## Performance Considerations

### Function Call Overhead

Every call still walks the interpreter, so inlining simple arithmetic is cheaper than
routing it through two closures:

```suji
import std:println

double = |x| x * 2
add_1 = |x| x + 1

x = 5
result1 = x * 2 + 1
result2 = add_1(double(x))

println(result1 == result2)  # true
```

### Closure Capture

A closure keeps a reference to the scope it was created in, so captured variables stay
live (and stay writable) for as long as the closure does:

```suji
make_adder = |x| {
    |y| x + y
}
```

### Recursion Depth

There is **no** tail-call optimisation: a tail-recursive shape uses exactly as much
stack as any other recursion, and a few hundred nested calls will overflow the native
stack and abort the process. Use a loop when the depth depends on input size:

```suji
import std:println

# Recursive: one stack frame per element
sum_recursive = |n| {
    match n {
        0 => 0,
        _ => n + sum_recursive(n - 1),
    }
}

# Iterative: constant stack, any size
sum_iterative = |n| {
    total = 0
    loop through 1..=n with i {
        total = total + i
    }
    total
}

println(sum_recursive(100))   # 5050
println(sum_iterative(10000)) # 50005000
```

## Common Use Cases

### Callbacks

```suji
import std:println

read_config = |path, callback| {
    contents = `cat ${path}`
    callback(contents)
}

path = `mktemp`
`printf 'debug=true' > ${path}`

read_config(path, |data| {
    println("Received: ${data}")  # Received: debug=true
})
```

### Event Handlers

Store handlers in a map and call them when the event happens:

```suji
import std:println

handlers = {}

on = |event, handler| {
    handlers[event] = handler
}

emit = |event| {
    handler = handlers::get(event)
    match { handler != nil => { handler() } }
}

on("click", || println("Button clicked!"))
emit("click")   # Button clicked!
emit("scroll")  # nothing registered, nothing happens
```

### Factory Functions

```suji
import std:println

create_user = |name, age| {
    user = {
        name: name,
        age: age,
        greet: || "Hello, I'm ${name}",
        is_adult: || age >= 18,
    }
    user
}

user = create_user("Alice", 30)
println(user:greet())     # Hello, I'm Alice
println(user:is_adult())  # true
```

The map is bound to a name before being returned: a `{ … }` in statement position is
parsed as a block, not as a map literal.

### Middleware Pattern

```suji
import std:println

# Middleware function
with_logging = |handler| {
    |request| {
        println("Request: ${request}")
        result = handler(request)
        println("Response: ${result}")
        result
    }
}

# Base handler
handle_request = |request| {
    "Processed: ${request}"
}

# Wrapped handler
logged_handler = with_logging(handle_request)
println(logged_handler("GET /"))
# Request: GET /
# Response: Processed: GET /
# Processed: GET /
```

## Quick Reference

| Concept | Syntax | Example |
|---------|--------|---------|
| **Basic function** | `name = \|params\| { body }` | `add = \|a, b\| a + b` |
| **Default value** | `\|param = expr\|` | `inc = \|x, step = 1\| x + step` |
| **Call function** | `name(args)` | `add(5, 3)` |
| **Closure** | Captures outer scope | `make_counter = \|\| { ... }` |
| **Higher-order** | Takes/returns a function | `xs::map(\|x\| x * 2)` |
| **Composition** | `>>`, `<<` | `f >> g` |
| **Recursion** | Calls itself by name | `fib = \|n\| ... fib(n - 1)` |
| **Multiple returns** | `return a, b` then `a, b = f()` | `return result, nil` |
| **Anonymous** | Lambda | `\|x\| x * 2` |

## Next Steps

Dive deep into each function concept:

1. **[Function Basics](basics.md)** - Parameters, returns, calling
2. **[Closures](closures.md)** - Variable capture, scope
3. **[Higher-Order Functions](higher-order.md)** - Functions as values
4. **[Recursion](recursion.md)** - Self-referential functions
5. **[Multiple Returns](multiple-returns.md)** - Returning tuples
6. **[Function Composition](../fundamentals/operators/composition.md)** - Combining functions with `>>` and `<<`

## See Also

- [Operators](../fundamentals/operators/)
- [Control Flow](../fundamentals/control-flow/)
- [Data Types](../fundamentals/data-types/)
- [Modules](../modules/)
