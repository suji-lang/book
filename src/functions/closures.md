# Closures

Closures are functions that capture and remember variables from their surrounding scope.

## Overview

A closure "closes over" variables from its outer scope, allowing the function to access those variables even after the outer scope has finished executing.

## Basic Closure

```suji
import std:println

outer = || {
    message = "Hello"
    
    # Inner function captures 'message'
    inner = || {
        println(message)
    }
    
    inner
}

fn = outer()
fn()  # Prints: Hello
```

## Capturing Variables

```suji
import std:println

make_greeter = |greeting| {
    # Returns function that captures 'greeting'
    |name| "${greeting}, ${name}!"
}

hello = make_greeter("Hello")
hi = make_greeter("Hi")

println(hello("Alice"))  # Hello, Alice!
println(hi("Bob"))       # Hi, Bob!
```

## Counter Example

Classic closure use case:

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

counter1 = make_counter()
counter2 = make_counter()

println(counter1())  # 1
println(counter1())  # 2
println(counter2())  # 1 (separate counter)
println(counter1())  # 3
```

The inner closure is bound to `increment` before being returned. A statement that
begins with `|` is read as the pipeline operator continuing the previous statement, so
a returned lambda always needs a name (or has to be the first thing in the body).

## Multiple Closures Sharing State

```suji
import std:println

make_account = |initial_balance| {
    balance = initial_balance

    account = {
        deposit: |amount| {
            balance = balance + amount
            balance
        },
        withdraw: |amount| {
            match {
                amount <= balance => {
                    balance = balance - amount
                    balance
                },
                _ => nil,
            }
        },
        get_balance: || balance,
    }
    account
}

account = make_account(100)
println(account:deposit(50))     # 150
println(account:withdraw(30))    # 120
println(account:get_balance())   # 120
```

All three closures share the same `balance`, and the map has to be bound to a name
before it is returned — a `{ … }` in statement position is parsed as a block.

## Partial Application

Use closures for partial application:

```suji
import std:println

multiply = |a, b| a * b

# Create specialized function
double = |x| multiply(2, x)
triple = |x| multiply(3, x)

println(double(5))  # 10
println(triple(5))  # 15

# Or with closure
make_multiplier = |factor| {
    |x| multiply(factor, x)
}

times_10 = make_multiplier(10)
println(times_10(5))  # 50
```

## Configuration Pattern

```suji
import std:println

create_formatter = |config| {
    prefix = config::get("prefix", "")
    suffix = config::get("suffix", "")
    uppercase = config::get("uppercase", false)

    format = |text| {
        result = text
        match { uppercase => { result = result::upper() } }
        "${prefix}${result}${suffix}"
    }
    format
}

formatter = create_formatter({
    prefix: "[",
    suffix: "]",
    uppercase: true,
})

println(formatter("hello"))  # [HELLO]
```

## Closure Scope Chain

Closures can access multiple levels of scope:

```suji
import std:println

outer = |x| {
    middle = |y| {
        inner = |z| {
            # Accesses all three scopes
            x + y + z
        }
        inner
    }
    middle
}

fn = outer(1)(2)
println(fn(3))  # 6
```

## Memoization with Closures

```suji
import std:println

memoize = |fn| {
    cache = {}
    cached = |arg| {
        cache::contains(arg) && return cache[arg]
        println("Computing for ${arg}")
        result = fn(arg)
        cache[arg] = result
        result
    }
    cached
}

expensive = |n| {
    # Simulate expensive computation
    n * n
}

fast = memoize(expensive)
println(fast(5))  # Computing for 5, then 25
println(fast(5))  # 25 straight from the cache
```

## Event Handlers

```suji
import std:println

create_button = |label| {
    click_count = 0

    button = {
        label: label,
        on_click: || {
            click_count = click_count + 1
            println("${label} clicked ${click_count} times")
        },
    }
    button
}

button = create_button("Submit")
button:on_click()  # Submit clicked 1 times
button:on_click()  # Submit clicked 2 times
```

## Common Patterns

### Factory Function

```suji
import std:println

create_validator = |rules| {
    check = |value| {
        loop through rules with rule {
            !rule(value) && return false
        }
        true
    }
    check
}

is_valid_password = create_validator([
    |p| p::length() >= 8,
    |p| p ~ /[A-Z]/,
    |p| p ~ /[0-9]/,
])

println(is_valid_password("Abc123"))    # false
println(is_valid_password("Abc12345")) # true
```

### Module Pattern

```suji
import std:println

create_module = || {
    # Private state
    private_data = "secret"

    # Public interface
    api = {
        get_public: || "public data",
        process: |input| {
            # Can access private_data
            "${input} + ${private_data}"
        },
    }
    api
}

module = create_module()
println(module:get_public())      # public data
println(module:process("test"))   # test + secret
# private_data is not accessible
```

## Performance Considerations

### Closure Creation Cost

Creating a closure only records the current scope, so factories are cheap to call:

```suji
make_adder = |x| {
    |y| x + y
}
```

A lambda that is the first thing in the body does not need a name — it is only a
statement *after* another expression that would be misread as a pipeline.

### Shared Scope

A closure holds a reference to the whole scope it was created in, not a copy of
individual variables. Everything defined in that scope stays alive as long as the
closure does, and writes are visible in both directions:

```suji
import std:println

outer = || {
    shared = "first"
    read = || shared
    shared = "second"
    read
}

read = outer()
println(read())  # second
```

## Best Practices

### DO:
- Use closures for encapsulation
- Return closures for configuration
- Use for event handlers and callbacks
- Create factory functions with closures
- Bind a returned closure to a name before returning it

### DON'T:
- Keep large values alive in a captured scope longer than needed
- Create deeply nested closures
- Use closures for simple operations
- Forget captured variables are shared
- Mutate captured state unexpectedly

## See Also

- [Function Basics](basics.md)
- [Higher-Order Functions](higher-order.md)
- [Function Composition](../fundamentals/operators/composition.md)
