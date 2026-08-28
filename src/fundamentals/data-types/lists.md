# Lists

Lists are ordered, indexed collections that can hold any type of values.

## Overview

Lists are one of the most commonly used data types in Suji for storing sequences of items.

### Key Characteristics

- **Ordered** - Items maintain insertion order
- **Indexed** - Zero-based integer indexing
- **Heterogeneous** - Can contain mixed types
- **Growable** - Can add/remove items
- **Functional** - Rich methods for transformation

### When to Use Lists

Use lists for:
- Sequences of items
- Collections that need ordering
- Data pipelines and transformations
- Iterating over elements
- Stack/queue operations

## Syntax

### Creating Lists

```suji
import std:println

# Empty list
items = []

# With initial values
numbers = [1, 2, 3, 4, 5]
names = ["Alice", "Bob", "Charlie"]

# Mixed types
mixed = [1, "two", 3.0, true, nil]

# Nested lists
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

println(items)   # []
println(names)   # [Alice, Bob, Charlie]
println(mixed)   # [1, two, 3, true, nil]
println(matrix)  # [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
```

Note that printing a list shows its elements without quotes: strings inside a
list are not re-quoted by `println`.

### Range Literals

Create lists using range syntax. A range is evaluated **immediately into a real
list** — it is not lazy, so `0..1000000` allocates a million elements.

```suji
import std:println

# Exclusive range (includes start, excludes end)
println(0..10)     # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Inclusive range (includes both start and end)
println(0..=10)    # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Descending range
println(10..5)     # [10, 9, 8, 7, 6]

# Descending inclusive
println(10..=5)    # [10, 9, 8, 7, 6, 5]

# Negative numbers
println(-2..2)     # [-2, -1, 0, 1]
```

There is no step syntax; use `filter` to skip elements.

### Accessing Elements

```suji
import std:println

numbers = [10, 20, 30, 40, 50]

# By index (0-based)
println(numbers[0])     # 10
println(numbers[2])     # 30

# Negative indices (from end)
println(numbers[-1])    # 50 (last)
println(numbers[-2])   # 40 (second to last)
```

### Slicing

Extract sublists using semicolon syntax:

```suji
import std:println

numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Range [start;end) - includes start, excludes end
println(numbers[1;3])    # [1, 2]

# From start
println(numbers[;2])     # [0, 1]

# To end
println(numbers[2;])     # [2, 3, 4, 5, 6, 7, 8, 9]

# Negative indices
println(numbers[-2;])    # [8, 9]
```

### Assigning Elements

```suji
import std:println

xs = [10, 20, 30]
xs[1] = 99     # xs is now [10, 99, 30]
xs[-1] = 0     # xs is now [10, 99, 0]
println(xs)    # [10, 99, 0]
```

## List Methods

### Length

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
println(numbers::length())    # 5

empty = []
println(empty::length())      # 0
```

### Adding Elements

```suji
import std:println

# Push (add to end)
list = [1, 2, 3]
list::push(4)
println(list)  # [1, 2, 3, 4]

# Multiple pushes
list::push(5)
list::push(6)
println(list)  # [1, 2, 3, 4, 5, 6]

# Concatenate lists
list1 = [1, 2]
list2 = [3, 4]
combined = list1 + list2
println(combined)  # [1, 2, 3, 4]
```

### Removing Elements

```suji
import std:println

# Pop (remove from end)
list = [1, 2, 3, 4]
last = list::pop()
println(list)  # [1, 2, 3]
println(last)  # 4
```

### Joining

```suji
import std:println

# Join with default separator (space)
words = ["hello", "world"]
println(words::join())  # hello world

# Join with custom separator
numbers = [1, 2, 3]
println(numbers::join(","))  # 1,2,3
```

## Functional Methods

### Map

Transform each element:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

# Double each number
doubled = numbers::map(|x| x * 2)
println(doubled)  # [2, 4, 6, 8, 10]

# Convert to strings (println shows them unquoted)
strings = numbers::map(|x| x::to_string())
println(strings)  # [1, 2, 3, 4, 5]
```

### Filter

Keep only elements that match a condition:

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Only even numbers
evens = numbers::filter(|x| x % 2 == 0)
println(evens)  # [2, 4, 6, 8, 10]

# Only numbers > 5
large = numbers::filter(|x| x > 5)
println(large)  # [6, 7, 8, 9, 10]
```

### Fold

Combine elements into a single value:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]

# Sum
sum = numbers::fold(0, |acc, x| acc + x)
println(sum)  # 15

# Product
product = numbers::fold(1, |acc, x| acc * x)
println(product)  # 120
```

### Sum and Product

Convenient shortcuts for fold:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
println(numbers::sum())      # 15
println(numbers::product())  # 120
```

### Chain Operations

Combine multiple operations:

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filter evens, square them, filter > 20, sum
result = numbers
  ::filter(|x| x % 2 == 0)      # [2, 4, 6, 8, 10]
  ::map(|x| x * x)              # [4, 16, 36, 64, 100]
  ::filter(|x| x > 20)          # [36, 64, 100]
  ::sum()                       # 200

println(result)  # 200
```

## Searching Methods

### Contains

```suji
import std:println

fruits = ["apple", "banana", "cherry"]

println(fruits::contains("banana"))   # true
println(fruits::contains("grape"))    # false
```

### Index Of

Find position of element:

```suji
import std:println

fruits = ["apple", "banana", "cherry"]

println(fruits::index_of("banana"))  # 1
println(fruits::index_of("grape"))   # -1 (not found)
```

## Sorting and Reversing

### Sort

```suji
import std:println

# Sort numbers
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
sorted = numbers::sort()
println(sorted)  # [1, 1, 2, 3, 4, 5, 6, 9]

# Sort strings
fruits = ["cherry", "apple", "banana"]
sorted = fruits::sort()
println(sorted)  # [apple, banana, cherry]
```

`sort()` takes no arguments: there is no `sort_by()` and no comparator. To sort by
a derived key, build a list of `"key|value"` strings, sort that, and map back —
or sort a list of the keys and look values up in a map.

### Reverse

```suji
import std:println

list = [1, 2, 3, 4, 5]
reversed = list::reverse()
println(reversed)  # [5, 4, 3, 2, 1]
println(list)      # [1, 2, 3, 4, 5] (original unchanged)
```

## Min, Max, and Average

### Min and Max

```suji
import std:println

scores = [85, 92, 78, 96, 88]
println(scores::min())  # 78
println(scores::max())  # 96
```

### Average

```suji
import std:println

numbers = [1, 2, 3, 4]
println(numbers::average())   # 2.50

empty = []
println(empty::average())    # nil
```

`min()`, `max()`, `sum()`, `product()` and `average()` require numeric elements.
`average()` is the only one that returns `nil` for an empty list.

## First and Last

```suji
import std:println

items = ["first", "middle", "last"]
println(items::first())  # first
println(items::last())   # last

# With default values
empty = []
println(empty::first("n/a"))  # n/a
println(empty::last(0))        # 0
```

## Methods That Do Not Exist

The complete list method set is `push`, `pop`, `length`, `join`, `index_of`,
`filter`, `map`, `fold`, `sum`, `product`, `average`, `contains`, `reverse`,
`sort`, `min`, `max`, `first`, `last`, `to_string` (plus the `is_*` predicates).
Familiar names from other languages are missing; here is what to use instead:

| You might reach for | Use instead |
|---|---|
| `each()` / `for_each()` | `loop through xs with x { … }` |
| `reduce()` | `fold(initial, fn)` |
| `any()` / `all()` | a `loop` with an early `return`, or `filter(...)::length()` |
| `find()` | `filter(...)::first(nil)` |
| `is_empty()` | `xs::length() == 0` |
| `slice()` / `take()` / `drop()` | slice syntax `xs[1;3]`, `xs[;n]`, `xs[n;]` |
| `unique()` | a `seen` map (see [Remove Duplicates](#remove-duplicates-preserving-order)) |
| `zip()` / `enumerate()` | `(0..xs::length())::map(\|i\| …)` |
| `flatten()` / `flat_map()` | `fold([], \|acc, x\| acc + x)` |
| `sort_by()` | `sort()` on a derived key list |
| `insert()` / `remove()` | rebuild with slices and `+` |
| `count()` | `filter(...)::length()` |
| `get()` / `set()` | index syntax `xs[i]` and `xs[i] = v` |


## Common Patterns

### Building Lists

```suji
import std:println

# Range literals
numbers = 0..10     # [0, 1, 2, ..., 9]
inclusive = 0..=10  # [0, 1, 2, ..., 10]

# List comprehension style using map
squares = (0..10)::map(|x| x * x)
println(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

### Processing with Loops

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
doubled = []

loop through numbers with n {
    doubled::push(n * 2)
}

println(doubled)  # [2, 4, 6, 8, 10]
```

## Common Pitfalls

### Pitfall 1: Index Out of Bounds

```suji
import std:println

list = [1, 2, 3]

# This would terminate the program:
# item = list[10]  # Runtime error: Index out of bounds

# Check first
item = match {
    list::length() > 10 => list[10],
    _ => nil,
}
println(item)  # nil

# Or use first/last with defaults
println(list::first(nil))  # 1
```

### Pitfall 2: Modifying While Iterating

```suji
import std:println

# Don't grow a list while iterating it
list = [1, 2, 3, 4, 5]
loop through list with item {
    # list::push(item)  # Dangerous! Keeps extending what you iterate
    continue
}

# Build a new list instead
new_list = []
loop through list with item {
    new_list::push(item * 2)
}
println(new_list)  # [2, 4, 6, 8, 10]
```

### Pitfall 3: Methods Return New Lists

```suji
import std:println

list = [1, 2, 3]
reversed = list::reverse()  # Returns a new list

# Original unchanged
println(list)      # [1, 2, 3]
println(reversed)  # [3, 2, 1]

# push() modifies the list
list::push(4)
println(list)  # [1, 2, 3, 4]
```

### Pitfall 4: Empty List Edge Cases

```suji
import std:println

empty = []

# Error on empty
# first = empty[0]  # Runtime error

# Check first (note the comma after the final arm)
first = match empty::length() {
    0 => nil,
    _ => empty[0],
}
println(first)  # nil

# The same check on one line
last = match empty::length() { 0 => nil, _ => empty[-1], }
println(last)  # nil

# Or let first()/last() supply the default
println(empty::first("n/a"))  # n/a
```

There is no `is_empty()` method — compare `length()` with `0`.

## Performance Considerations

Every one of `map`, `filter` and `fold` is eager and allocates a fresh list, so a
long chain walks the data once per stage. Ranges are materialised too: `0..1000000`
really does build a list of a million numbers.

### Method Chaining

```suji
import std:println

list = [3, -1, 4, -5, 9]

# Readable - methods can be chained across lines
result = list
  ::filter(|x| x > 0)
  ::map(|x| x * 2)
  ::sum()

println(result)  # 32
```

### Avoid Repeated Concatenation

```suji
import std:println

items = [1, 2, 3]

# Slow for many items (O(n²)) - builds a new list on every iteration
result = []
loop through items with item {
    result = result + [item]
}
println(result)  # [1, 2, 3]

# Use push (amortised O(1) per item)
result = []
loop through items with item {
    result::push(item)
}
println(result)  # [1, 2, 3]
```

## Examples

### Remove Duplicates Preserving Order

There is no `unique()` method, so track what you have seen in a map:

```suji
import std:println

remove_duplicates = |list| {
    seen = {}
    result = []

    loop through list with item {
        seen::contains(item) && continue
        seen[item] = true
        result::push(item)
    }

    result
}

numbers = [1, 2, 2, 3, 1, 4, 3, 5]
println(remove_duplicates(numbers))  # [1, 2, 3, 4, 5]
```

### Moving Average

```suji
import std:println

moving_average = |values, window| {
    result = []
    
    loop through 0..(values::length() - window + 1) with i {
        window_values = values[i;i + window]
        avg = window_values::sum() / window
        result::push(avg)
    }
    
    result
}

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
averages = moving_average(data, 3)
println(averages)  # [2, 3, 4, 5, 6, 7, 8, 9]
```

### Transpose Matrix

```suji
import std:println

transpose = |matrix| {
    match matrix::length() {
        0 => [],
        _ => {
            cols = matrix[0]::length()
            # Bind the range first: a line starting with "(" would otherwise be
            # read as a call on the previous line's value.
            indices = 0..cols
            indices::map(|col| matrix::map(|row| row[col]))
        }
    }
}

matrix = [
    [1, 2, 3],
    [4, 5, 6]
]

transposed = transpose(matrix)
println(transposed)  # [[1, 4], [2, 5], [3, 6]]
```

## Best Practices

### DO:
- Use functional methods (map, filter, fold)
- Use range literals (`0..10`) for sequences
- Check list length before accessing indices
- Use meaningful variable names
- Use `first()` and `last()` with defaults for safe access

### DON'T:
- Modify lists while iterating
- Ignore index out of bounds errors
- Use repeated concatenation in loops
- Forget that most methods return new lists (except push/pop)

## Next Steps

- Learn about [Maps](maps.md) for key-value collections
- Explore [Tuples](tuples.md) for fixed-size collections
- Study [Functional Programming](../../functions/higher-order.md) patterns
- Check out [Data Transformation](../../cookbook/data-transformation.md) recipes

## See Also

- [Maps](maps.md)
- [Tuples](tuples.md)
- [Higher-Order Functions](../../functions/higher-order.md)
- [Pipe Operators](../operators/pipe-apply.md)
