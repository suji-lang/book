# Loops

Loops repeat code multiple times until a condition is met. `loop` is the only
looping keyword — there is no `while` and no `for`. The five forms are:

```text
loop { … }                      # infinite; needs break
loop as outer { … }             # labeled infinite loop
loop through xs { … }           # iterate without a binding
loop through xs with x { … }    # bind each element (or each map key)
loop through m with k, v { … }  # bind key and value — maps only
```

A loop is a statement, never a value: `break` takes no operand (there is no
`break <value>`) and a loop expression always evaluates to `nil`.

## Infinite Loop

```suji
import std:println

count = 0
loop {
    count = count + 1
    println(count)
    
    match count >= 5 {
        true => break,
        false => {},
    }
}
```

## Loop Through Lists

```suji
import std:println

fruits = ["apple", "banana", "cherry"]

# Basic iteration
loop through fruits with fruit {
    println(fruit)
}

# Iterate a fixed number of times without binding anything
count = 0
loop through fruits {
    count = count + 1
}
println(count)  # 3
```

### There Is No Index Binding for Lists

Two bindings are for **maps only**. Writing `loop through fruits with fruit, index`
fails at runtime with `Type error: Cannot iterate over list`. Keep your own
counter, or iterate an index range:

```suji
import std:println

fruits = ["apple", "banana", "cherry"]

# Manual counter
index = 0
loop through fruits with fruit {
    println("${index}: ${fruit}")
    index = index + 1
}

# Or iterate the indices directly
loop through 0..fruits::length() with i {
    println("${i} -> ${fruits[i]}")
}
```

## Loop Through Maps

Only maps support two bindings, one for the key and one for the value. Iterating a
map `with k` alone binds just the key.

```suji
import std:println

config = {
    host: "localhost",
    port: 8080,
    debug: true
}

loop through config with key, value {
    println("${key} = ${value}")
}
```

## Loop Through Ranges

A range is not a lazy iterator — `a..b` evaluates immediately to a plain list, so
`loop through 1..11` is exactly `loop through [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`.
Very large ranges therefore allocate very large lists.

```suji
import std:println

# Using range literal (exclusive)
loop through 1..11 with n {
    println(n)  # 1 to 10
}

# Inclusive range
loop through 1..=10 with n {
    println(n)  # 1 to 10
}

# Descending range
loop through 10..5 with n {
    println(n)  # 10, 9, 8, 7, 6
}
```

## What You Cannot Iterate

Only lists (including ranges) and maps are iterable. A string or a stream must be
converted first, otherwise you get `Type error: Cannot iterate over string` /
`over stream`:

```suji
import std:println

word = "hi"

# loop through word with c { … }   # runtime error
loop through word::to_list() with c {
    println(c)
}
```

Streams are the same story: read them into a list with `read_lines()` first, then
loop through that list.

## Labeled Loops

Label an infinite `loop` with `as name` to `break` or `continue` an outer loop from
inside a nested one. The label goes on the plain `loop` form; `loop as name through …`
is a parse error.

```suji
import std:println

i = 0
loop as outer {
    i = i + 1
    i > 3 && break outer

    loop through [1, 2, 3] with j {
        j == 2 && continue outer
        println("${i},${j}")
    }
}
```

## Break and Continue

### Break

Exit the loop immediately:

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

loop through numbers with n {
    n > 5 && break  # Stop when n > 5 (short-circuit)
    println(n)
}
# Prints: 1, 2, 3, 4, 5
```

### Continue

Skip to next iteration:

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

loop through numbers with n {
    n % 2 == 0 && continue  # Skip even numbers (short-circuit)
    println(n)
}
# Prints: 1, 3, 5, 7, 9
```

## Return from Loop

Since `break` cannot carry a value, a loop that needs to produce a result lives
inside a function and uses `return`:

```suji
import std:println

find_first = |list, predicate| {
    loop through list with item {
        predicate(item) && return item  # Return from function (short-circuit)
    }
    nil  # Not found
}

println(find_first([1, 3, 8, 5], |n| n % 2 == 0))  # 8
println(find_first([1, 3, 5], |n| n % 2 == 0))     # nil
```

## Common Patterns

### Accumulator

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
sum = 0

loop through numbers with n {
    sum = sum + n
}

println(sum)  # 15
```

### Search

```suji
import std:println

names = ["Alice", "Bob", "Charlie"]
target = "Bob"
found = false

loop through names with name {
    match { name == target => {
        found = true
        break
    } }
}

println(found)  # true
```

### Transformation

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
doubled = []

loop through numbers with n {
    doubled::push(n * 2)
}

println(doubled)  # [2, 4, 6, 8, 10]
```

### Nested Loops

```suji
import std:println

# Multiplication table
loop through 1..11 with i {
    loop through 1..11 with j {
        println("${i} x ${j} = ${i * j}")
    }
}
```

## Loops vs Functional Methods

Often functional methods are more concise:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

# Loop (verbose)
doubled = []
loop through numbers with n {
    doubled::push(n * 2)
}

# Map (concise)
doubled = numbers::map(|n| n * 2)

println(doubled)  # [2, 4, 6, 8, 10]
```

When to use each:

- **Use loops** for: complex logic, early exits, state management
- **Use functional methods** for: transformations, filtering, aggregation

## Best Practices

### DO:
- Use `loop through` for collections
- Provide clear exit conditions
- Use `break` for early exit
- Use `continue` to skip iterations
- Label the outer `loop` when a nested loop needs to break out of it
- Consider functional methods for simple transformations

### DON'T:
- Create infinite loops without break
- Expect `break` to return a value, or a loop to evaluate to anything but `nil`
- Use two bindings on a list — that form is for maps only
- Iterate a string or stream directly; convert with `to_list()` / `read_lines()`
- Modify collection while iterating
- Nest loops more than 2-3 levels
- Use loops where functional methods are clearer

## See Also

- [Lists](../data-types/lists.md)
- [Maps](../data-types/maps.md)
- [Higher-Order Functions](../../functions/higher-order.md)
- [Streams](../data-types/streams.md)
