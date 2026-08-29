# Fibonacci Sequence

Learn recursion, memoization, and functional programming through the classic Fibonacci sequence.

## Overview

This example demonstrates:
- Recursive function definitions
- Pattern matching with `match`
- Method chaining over lists
- Memoization for performance
- Building sequences from ranges

## Prerequisites

- [Functions](../functions/basics.md)
- [Pattern Matching](../fundamentals/control-flow/match.md)
- [Lists](../fundamentals/data-types/lists.md)

## Complete Code

```suji
import std:println

# Simple recursive Fibonacci
fib = |n| {
    match n {
        0 | 1 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
}

# Generate the first N Fibonacci numbers
first_n_fibs = |n| {
    numbers = (0..n)::map(|i| fib(i))::join(", ")

    println("The first ${n} Fibonacci numbers are: ${numbers}")
}

first_n_fibs(10)
```

Output:

```text
The first 10 Fibonacci numbers are: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

Note the comma after `_ => fib(n - 1) + fib(n - 2)`. A match arm whose body is a bare expression must be followed by a comma, **including the last arm** — leaving it off is a parse error.

## Step-by-Step Explanation

### 1. Define Recursive Fibonacci

```suji
import std:println

fib = |n| {
    match n {
        0 | 1 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
}

println(fib(10))  # 55
```

- Base cases: `fib(0) = 0`, `fib(1) = 1`
- Recursive case: `fib(n) = fib(n-1) + fib(n-2)`
- Pattern alternation `0 | 1` matches both values
- The lambda calls itself through the name it was assigned to

### 2. Generate the Sequence

```suji
import std:println

square = |i| i * i

println((0..5)::map(square)::join(", "))  # 0, 1, 4, 9, 16
```

- `(0..n)` builds a list from `0` to `n - 1` (ranges evaluate to real lists immediately)
- `::map(fn)` transforms every element
- `::join(", ")` produces a comma-separated string

### 3. Format and Print

```suji
import std:println

n = 10
numbers = "0, 1, 1, 2"

println("The first ${n} Fibonacci numbers are: ${numbers}")
```

- String interpolation with `${...}`
- `println` comes from `std:println`; there is no prelude, so every program that prints needs the import

## Variation 1: Iterative Approach

Much faster, and the only sensible choice for large `n`:

```suji
import std:println

fib_iterative = |n| {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            a = 0
            b = 1
            i = 2

            loop {
                i > n && break

                temp = a + b
                a = b
                b = temp
                i++
            }

            b
        }
    }
}

println(fib_iterative(10))   # 55
println(fib_iterative(90))   # 2880067194370816120
println(fib_iterative(139))  # 50095301248058391139327916261
```

**Advantage**: O(n) time, O(1) space, and no recursion depth to worry about.

`fib_iterative(140)` would abort with `Addition overflowed`: Suji has a single fixed-precision decimal number type whose maximum is `79228162514264337593543950335`, so 139 is the last Fibonacci number the language can represent.

## Variation 2: Memoized Fibonacci

Cache results so each value is computed once:

```suji
import std:println

create_fib_memo = || {
    cache = {0: 0, 1: 1}

    fib = |n| {
        match cache::contains(n) {
            true => cache::get(n, nil),
            _ => {
                result = fib(n - 1) + fib(n - 2)
                cache[n] = result
                result
            },
        }
    }

    fib
}

fib_memo = create_fib_memo()
println(fib_memo(100))  # 354224848179261915075
```

**Advantage**: O(n) time. The closure captures `cache` by reference, so the map survives between calls.

Use `cache::contains(n)` rather than checking for a `nil` result: reading a missing key with `cache[n]` raises `Key not found` and terminates the program.

## Variation 3: Sequence as a List

```suji
import std:println

fib_list = |count| {
    out = []
    a = 0
    b = 1
    loop through 0..count {
        out::push(a)
        temp = a + b
        a = b
        b = temp
    }
    out
}

loop through fib_list(8) with n {
    println(n)
}
```

Output:

```text
0
1
1
2
3
5
8
13
```

## Performance Comparison

`time:now():epoch_ms` is the practical timing primitive (`os:uptime_ms()` only has second resolution):

```suji
import std:println
import std:time

fib = |n| {
    match n {
        0 | 1 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
}

fib_iterative = |n| {
    a = 0
    b = 1
    i = 0
    loop {
        i >= n && break
        temp = a + b
        a = b
        b = temp
        i++
    }
    a
}

benchmark = |name, f| {
    start = time:now():epoch_ms
    result = f()
    elapsed = time:now():epoch_ms - start
    println("${name} = ${result} in ${elapsed}ms")
}

benchmark("recursive fib(25)", || fib(25))
benchmark("iterative fib(25)", || fib_iterative(25))
```

Example output (timings vary by machine):

```text
recursive fib(25) = 75025 in 238ms
iterative fib(25) = 75025 in 0ms
```

On the reference build the recursive version needs roughly a quarter of a second for `fib(25)` — it makes about 243 thousand calls — while the iterative version is instant. The gap doubles with every extra `n`, so `fib(35)` recursively is minutes of work.

## Exercises

### Beginner

1. Return the Fibonacci sequence as a list instead of printing it
2. Find the first Fibonacci number greater than 1000
3. Sum the first 10 Fibonacci numbers with `::sum()`

### Intermediate

4. Rewrite `fib_iterative` so it returns both the value and the number of loop iterations (`return a, count`)
5. Write `is_fibonacci(n)` that reports whether a number appears in the sequence
6. Add a `cache::length()` counter to the memoized version to show how many values were computed

### Advanced

7. Implement matrix-based Fibonacci (O(log n)) using lists of lists
8. Build a generator-style closure that returns the next Fibonacci number on each call
9. Detect the overflow point programmatically: stop before the sum exceeds `79228162514264337593543950335`

## Common Mistakes

### Missing Comma After the Last Arm

```suji
import std:println

# Correct: every bare-expression arm ends with a comma
classify = |n| {
    match {
        n < 0 => "negative",
        n == 0 => "zero",
        _ => "positive",
    }
}

println(classify(0))  # zero
```

Writing `_ => "positive"` without the trailing comma produces `Parse error: Unexpected token: RightBrace`.

### Stack Overflow

```suji
import std:println

# Linear recursion is fine at this depth ...
count_down = |n| match { n <= 0 => 0, _ => 1 + count_down(n - 1), }
println(count_down(500))  # 500
```

There is no tail-call optimisation. Around 600–700 nested frames the process aborts with `thread 'main' has overflowed its stack`, so `count_down(900)` — or a memoized `fib(900)` — crashes rather than returning. Convert deep recursion into a `loop`.

### Off-by-One Errors

```suji
import std:println

println((0..10)::length())    # 10  — exclusive: 0 through 9
println((0..=10)::length())   # 11  — inclusive: 0 through 10
println((0..10)::last(nil))   # 9
```

## See Also

- [Recursion](../functions/recursion.md)
- [Pattern Matching](../advanced/pattern-matching.md)
- [Performance](../advanced/performance.md)
- [Quicksort Example](quicksort.md)
