# Quicksort Algorithm

Learn divide-and-conquer algorithms, pattern matching, and list operations.

## Overview

This example demonstrates:
- Recursive divide-and-conquer strategy
- Pattern matching on list length
- List filtering and concatenation
- Elegant functional implementation

## Prerequisites

- [Functions](../functions/basics.md)
- [Lists](../fundamentals/data-types/lists.md)
- [Pattern Matching](../fundamentals/control-flow/match.md)
- [Recursion](../functions/recursion.md)

## Complete Code

```suji
import std:println

quicksort = |list| {
    match list::length() {
        0 => [],
        1 => list,
        _ => {
            pivot = list[0]
            rest = list[1;]
            left = rest::filter(|x| x < pivot)
            right = rest::filter(|x| x >= pivot)

            quicksort(left) + [pivot] + quicksort(right)
        },
    }
}

numbers = [5, 3, 8, 1, 9, 2, 7]
println("Original: ${numbers::join(", ")}")
println("Sorted: ${quicksort(numbers)::join(", ")}")

# The same function sorts strings, since `<` compares them too
println(quicksort(["pear", "apple", "fig"])::join(", "))
```

Output:

```text
Original: 5, 3, 8, 1, 9, 2, 7
Sorted: 1, 2, 3, 5, 7, 8, 9
apple, fig, pear
```

## Step-by-Step Explanation

### 1. Base Cases

```suji
import std:println

base_cases = |list| {
    match list::length() {
        0 => [],
        1 => list,
        _ => "needs partitioning",
    }
}

println(base_cases([]))       # []
println(base_cases([42]))     # [42]
println(base_cases([2, 1]))   # needs partitioning
```

- An empty list is already sorted
- A single-element list is already sorted
- Every arm here is a bare expression, so every arm — including the last — ends with a comma

### 2. Choose Pivot

```suji
import std:println

list = [5, 3, 8, 1]
pivot = list[0]
rest = list[1;]

println(pivot)             # 5
println(rest::join(", "))  # 3, 8, 1
```

- The first element becomes the pivot
- `list[1;]` is slice notation — from index 1 to the end. Suji uses `;` in slices, not `:`
- `rest` contains everything except the pivot, which is what keeps the recursion shrinking

### 3. Partition

```suji
import std:println

rest = [3, 8, 1]
pivot = 5

left = rest::filter(|x| x < pivot)
right = rest::filter(|x| x >= pivot)

println(left::join(", "))   # 3, 1
println(right::join(", "))  # 8
```

- **Left partition**: elements less than the pivot
- **Right partition**: elements greater than or equal to the pivot
- `filter` is eager and returns a new list, so `rest` is untouched

### 4. Recursive Sort and Combine

```suji
import std:println

sorted_left = [1, 3]
pivot = 5
sorted_right = [8]

println(sorted_left + [pivot] + sorted_right)  # [1, 3, 5, 8]
```

`+` concatenates lists, so the combine step is a single expression.

## Variation 1: Sorting by Mutation

Suji passes arguments **by value**: a list handed to a function is copied, and `xs::push(...)` or `xs[0] = ...` inside that function leaves the caller's list untouched. A closure, on the other hand, captures its environment by reference — so a genuinely in-place sort is written against a captured list:

```suji
import std:println

data = [5, 3, 8, 1, 9, 2, 7]

swap = |i, j| {
    temp = data[i]
    data[i] = data[j]
    data[j] = temp
}

partition = |low, high| {
    pivot = data[high]
    i = low - 1

    loop through low..high with j {
        match {
            data[j] < pivot => {
                i++
                swap(i, j)
            },
            _ => {},
        }
    }

    swap(i + 1, high)
    i + 1
}

sort_range = |low, high| {
    match {
        low < high => {
            p = partition(low, high)
            sort_range(low, p - 1)
            sort_range(p + 1, high)
        },
        _ => {},
    }
}

sort_range(0, data::length() - 1)
println(data)  # [1, 2, 3, 5, 7, 8, 9]
```

**Advantage**: no intermediate lists. **Cost**: the sort is tied to one specific variable, which is why the functional version above is the one worth reaching for first.

## Variation 2: Random Pivot

Better average-case performance on partially ordered input:

```suji
import std:println
import std:random

quicksort_random = |list| {
    match list::length() {
        0 | 1 => list,
        _ => {
            pivot_idx = random:integer(0, list::length())
            pivot = list[pivot_idx]

            rest = []
            loop through 0..list::length() with idx {
                match {
                    idx != pivot_idx => { rest::push(list[idx]) },
                    _ => {},
                }
            }

            left = rest::filter(|x| x < pivot)
            right = rest::filter(|x| x >= pivot)

            quicksort_random(left) + [pivot] + quicksort_random(right)
        },
    }
}

random:seed(7)
input = random:shuffle(1..=12)
println(quicksort_random(input) == (1..=12))  # true
```

`loop through list with item, idx` does **not** work: two bindings are only valid for maps. Iterate over an index range instead, as above.

## Variation 3: Three-Way Partitioning

Handle duplicate values efficiently:

```suji
import std:println

quicksort_3way = |list| {
    match list::length() {
        0 | 1 => list,
        _ => {
            pivot = list[0]
            rest = list[1;]

            less = rest::filter(|x| x < pivot)
            equal = rest::filter(|x| x == pivot)
            greater = rest::filter(|x| x > pivot)

            quicksort_3way(less) + [pivot] + equal + quicksort_3way(greater)
        },
    }
}

println(quicksort_3way([3, 1, 3, 2, 3, 1]))  # [1, 1, 2, 3, 3, 3]
```

**Advantage**: values equal to the pivot are placed once instead of being re-partitioned.

## Performance Analysis

### Time Complexity

- **Best case**: O(n log n) - balanced partitions
- **Average case**: O(n log n) - random pivot
- **Worst case**: O(n²) - already sorted input with a first-element pivot

### Space Complexity

- **Functional version**: O(n) - `filter` and `+` allocate new lists at every level
- **Mutating version**: O(log n) - only the recursion stack grows

### Recursion Depth

There is no tail-call optimisation, and the interpreter aborts the process at roughly 600–700 nested frames. Sorting an already-sorted list recurses once per element, so `quicksort(0..300)` is fine while `quicksort(0..700)` crashes with `thread 'main' has overflowed its stack`. Shuffled input recurses only about `log2(n)` deep, so large random lists are not a problem — the danger is specifically sorted or reverse-sorted input.

## Complete Example with Benchmarking

```suji
import std:println
import std:random
import std:time

quicksort = |list| {
    match list::length() {
        0 | 1 => list,
        _ => {
            pivot = list[0]
            rest = list[1;]
            quicksort(rest::filter(|x| x < pivot)) + [pivot] + quicksort(rest::filter(|x| x >= pivot))
        },
    }
}

benchmark = |name, list| {
    start = time:now():epoch_ms
    result = quicksort(list)
    elapsed = time:now():epoch_ms - start
    println("${name} (${list::length()} elements): ${elapsed}ms, sorted correctly: ${result == list::sort()}")
}

random:seed(1)
benchmark("random", random:shuffle(0..300))
benchmark("already sorted", 0..300)
benchmark("reverse sorted", 300..0)
```

Example output (timings vary by machine):

```text
random (300 elements): 4ms, sorted correctly: true
already sorted (300 elements): 51ms, sorted correctly: true
reverse sorted (300 elements): 48ms, sorted correctly: true
```

For production sorting of numbers or strings, use the built-in `list::sort()` — it is implemented in Rust and has none of these depth limits.

## Exercises

### Beginner

1. Sort a list of strings alphabetically, then reverse the result with `::reverse()`
2. Sort in descending order by swapping the two `filter` predicates
3. Count comparisons by incrementing a counter captured from the enclosing scope

### Intermediate

4. Implement median-of-three pivot selection
5. Add an `ascending` parameter that chooses the comparison direction
6. Print each partition step to visualise the recursion

### Advanced

7. Implement dual-pivot quicksort
8. Fall back to insertion sort for sublists shorter than 8 elements
9. Rewrite the sort as an explicit stack of ranges so it never exceeds the recursion limit

## Common Mistakes

### Infinite Recursion

```suji
import std:println

# Bug: the pivot stays in the right partition, so the list never shrinks
buggy = |list| {
    pivot = list[0]
    right = list::filter(|x| x >= pivot)
    println("right partition still has ${right::length()} of ${list::length()} elements")
}

buggy([1, 3, 2])
```

Output:

```text
right partition still has 3 of 3 elements
```

**Solution**: partition `rest = list[1;]`, not `list`, so the pivot is removed exactly once.

### Missing Comma After the Final Arm

```suji
import std:println

sorted = match [3, 1] ::length() {
    0 => "empty",
    _ => "sort me",
}

println(sorted)  # sort me
```

Dropping the comma after `_ => "sort me"` is a parse error, not a warning.

### Stack Overflow on Sorted Input

```suji
import std:println

quicksort = |list| {
    match list::length() {
        0 | 1 => list,
        _ => {
            pivot = list[0]
            rest = list[1;]
            quicksort(rest::filter(|x| x < pivot)) + [pivot] + quicksort(rest::filter(|x| x >= pivot))
        },
    }
}

println(quicksort(0..300)::length())  # 300
```

`quicksort(0..700)` on already-sorted input aborts the process. Shuffle first, pick a random pivot, or use `list::sort()`.

## See Also

- [Lists](../fundamentals/data-types/lists.md)
- [Recursion](../functions/recursion.md)
- [Pattern Matching](../advanced/pattern-matching.md)
- [Fibonacci Example](fibonacci.md)
