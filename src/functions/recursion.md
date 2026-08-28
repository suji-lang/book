# Recursion

Recursion occurs when a function calls itself to solve a problem by breaking it into smaller sub-problems.

A function recurses through the name it is assigned to, and every `match` arm whose
body is a bare expression needs a trailing comma — including the last arm.

> **Depth limit:** Suji has no tail-call optimisation. Each call consumes a native stack
> frame, and a few hundred nested calls overflow the stack and abort the process. The
> exact ceiling depends on how much each frame holds — a simple `1 + f(n - 1)` recursion
> survives 600 levels but not 700, and a two-argument accumulator survives 700 but not
> 900. Recursion is for bounded, shallow work; use a `loop` when the depth grows with the
> size of the input.

## Basic Recursion

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
```

## Fibonacci Sequence

```suji
import std:println

fib = |n| {
    match n {
        0 => 0,
        1 => 1,
        _ => fib(n - 1) + fib(n - 2),
    }
}

println(fib(10))  # 55
```

## Accumulator Recursion

Passing an accumulator keeps the intermediate result in a parameter instead of in the
pending multiplications:

```suji
import std:println

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

This is often called *tail recursion*, but Suji does not optimise it: the accumulator
version uses exactly as many stack frames as the version above. Its only advantage here
is that the result is complete as soon as the base case is reached.

## Recursion vs Iteration

### Recursive Sum

```suji
import std:println

sum_recursive = |list| {
    match list::length() {
        0 => 0,
        _ => list[0] + sum_recursive(list[1;]),
    }
}

println(sum_recursive([1, 2, 3, 4, 5]))  # 15
```

### Iterative Sum

```suji
import std:println

sum_iterative = |list| {
    total = 0
    loop through list with n {
        total = total + n
    }
    total
}

println(sum_iterative([1, 2, 3, 4, 5]))  # 15
```

Both print the same answer, but only the iterative version survives a long list:
`sum_recursive` needs one stack frame per element, so it aborts somewhere past a few
hundred elements.

## Common Recursive Patterns

### List Processing

```suji
import std:println

# Recursive map
map_recursive = |list, fn| {
    match list::length() {
        0 => [],
        _ => [fn(list[0])] + map_recursive(list[1;], fn),
    }
}

numbers = [1, 2, 3, 4, 5]
doubled = map_recursive(numbers, |x| x * 2)
println(doubled)  # [2, 4, 6, 8, 10]
```

### Tree Traversal

```suji
import std:println

# Sum all values in tree
sum_tree = |node| {
    match node {
        nil => 0,
        _ => node:value + sum_tree(node:left) + sum_tree(node:right),
    }
}

tree = {
    value: 10,
    left: {value: 5, left: nil, right: nil},
    right: {value: 15, left: nil, right: nil},
}

println(sum_tree(tree))  # 30
```

Patterns cannot bind values: a bare identifier in a `match` pattern is a string literal,
so the recursive arm is `_` and reads `node` directly.

### Path Finding

```suji
import std:println

find_path = |graph, start, goal, visited| {
    seen = match visited {
        nil => [],
        _ => visited,
    }

    start == goal && return [goal]
    seen::contains(start) && return nil

    seen::push(start)
    neighbors = graph::get(start, [])

    loop through neighbors with neighbor {
        path = find_path(graph, neighbor, goal, seen)
        path != nil && return [start] + path
    }

    nil
}

graph = {
    a: ["b", "c"],
    b: ["d"],
    c: ["d"],
    d: [],
}

println(find_path(graph, "a", "d", nil))  # [a, b, d]
println(find_path(graph, "d", "a", nil))  # nil
```

## Recursive Data Structures

### Linked List

```suji
import std:println

# Count elements
count_list = |node| {
    match node {
        nil => 0,
        _ => 1 + count_list(node:next),
    }
}

list = {value: 1, next: {value: 2, next: {value: 3, next: nil}}}
println(count_list(list))  # 3
```

### Directory Tree

```suji
import std:println

# Count all files
count_files = |entry| {
    match entry:type {
        "file" => 1,
        "directory" => {
            total = 0
            loop through entry:children with child {
                total = total + count_files(child)
            }
            total
        }
        _ => 0,
    }
}

tree = {
    type: "directory",
    children: [
        {type: "file"},
        {type: "directory", children: [{type: "file"}, {type: "file"}]},
    ],
}

println(count_files(tree))  # 3
```

The `_ => 0` arm matters: a `match` with no matching arm evaluates to `nil`, which would
break the `total + …` addition on the next level up.

## Mutual Recursion

Functions that call each other:

```suji
import std:println

is_even = |n| {
    match n {
        0 => true,
        _ => is_odd(n - 1),
    }
}

is_odd = |n| {
    match n {
        0 => false,
        _ => is_even(n - 1),
    }
}

println(is_even(4))  # true
println(is_odd(5))   # true
```

`is_even` may refer to `is_odd` before it is defined, because the name is looked up when
the call happens, not when the lambda is created.

## Performance Optimization

### Memoization

Cache results to avoid recomputation. The cache has to be consulted **inside** the
recursive function, so that every sub-call benefits:

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

Without the cache, `fib(60)` would make more calls than you have patience for; with it,
each value is computed once. Note that the recursion still goes 60 frames deep, so this
trick makes the function faster, not deeper.

A generic wrapper is also possible, but it only caches repeated calls at the top level —
the recursive calls inside `fib_slow` still go to the unmemoized function:

```suji
import std:println

memoize = |fn| {
    cache = {}
    cached = |arg| {
        cache::contains(arg) && return cache[arg]
        result = fn(arg)
        cache[arg] = result
        result
    }
    cached
}

fib_slow = |n| {
    match n {
        0 => 0,
        1 => 1,
        _ => fib_slow(n - 1) + fib_slow(n - 2),
    }
}

fib_fast = memoize(fib_slow)
println(fib_fast(20))  # 6765 (computed)
println(fib_fast(20))  # 6765 (from the cache)
```

### No Tail-Call Optimization

Suji does **not** optimise tail calls. Both functions below use one stack frame per
element, so both overflow on a long list — the accumulator version is not a way to
recurse deeper:

```suji
import std:println

# Tail-recursive in shape, but not optimised
sum_tail = |list, acc| {
    match list::length() {
        0 => acc,
        _ => sum_tail(list[1;], acc + list[0]),
    }
}

# Plainly recursive
sum_regular = |list| {
    match list::length() {
        0 => 0,
        _ => list[0] + sum_regular(list[1;]),
    }
}

small = 1..=50
println(sum_tail(small, 0))    # 1275
println(sum_regular(small))    # 1275

# sum_tail(1..=5000, 0)
# => aborts with "thread 'main' has overflowed its stack"
```

When the depth follows the size of the input, use `list::fold()` or a `loop`:

```suji
import std:println

big = 1..=10000
println(big::fold(0, |acc, x| acc + x))  # 50005000
```

## When to Use Recursion

### Good Use Cases:
- Tree/graph traversal
- Divide-and-conquer algorithms
- Parsing nested structures
- Mathematical sequences
- Backtracking algorithms

### Avoid Recursion For:
- Simple list iteration (use loops)
- Deep recursion (stack overflow risk)
- When iterative solution is clearer
- Performance-critical hot paths

## Best Practices

### DO:
- Always have base case
- Keep the depth bounded and small (a few hundred frames at most)
- Consider memoization for expensive recursion
- Document recursive logic
- Test with edge cases (empty, single element)

### DON'T:
- Forget the base case
- Create infinite recursion — there is no trampolining, it aborts the process
- Use recursion for simple loops
- Expect tail calls to be optimised
- Over-complicate with recursion

## Examples

### Flatten Nested Lists

```suji
import std:println

flatten = |list| {
    result = []
    loop through list with item {
        match {
            item::is_list() => { result = result + flatten(item) },
            _ => result::push(item),
        }
    }
    result
}

nested = [1, [2, 3], [4, [5, 6]], 7]
println(flatten(nested))  # [1, 2, 3, 4, 5, 6, 7]
```

### Quick Sort

```suji
import std:println

quicksort = |list| {
    match list::length() {
        0 => [],
        1 => list,
        _ => {
            pivot = list[0]
            rest = list[1;]

            less = rest::filter(|x| x < pivot)
            greater = rest::filter(|x| x >= pivot)

            quicksort(less) + [pivot] + quicksort(greater)
        },
    }
}

unsorted = [3, 1, 4, 1, 5, 9, 2, 6, 5]
println(quicksort(unsorted))  # [1, 1, 2, 3, 4, 5, 5, 6, 9]
```

### Generate Permutations

```suji
import std:println

permutations = |list| {
    match list::length() {
        0 => [[]],
        _ => {
            result = []
            i = 0
            loop through list with item {
                rest = list[0;i] + list[i + 1;]
                loop through permutations(rest) with perm {
                    result::push([item] + perm)
                }
                i = i + 1
            }
            result
        }
    }
}

println(permutations([1, 2, 3]))
# [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
```

`loop through` over a list binds one variable, the element. Track the index with a
counter, as above; the two-binding form (`with k, v`) is for maps only.

## See Also

- [Function Basics](basics.md)
- [Higher-Order Functions](higher-order.md)
- [Loops](../fundamentals/control-flow/loops.md)
- [Pattern Matching](../fundamentals/control-flow/match.md)

