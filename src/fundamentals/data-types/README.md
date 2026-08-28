# Data Types

Suji provides a rich set of data types for representing different kinds of values.

## Overview

Understanding data types is fundamental to writing effective Suji programs. This chapter covers all built-in types, their characteristics, operations, and best practices.

## Type System

Suji uses **dynamic typing** - variables can hold any type of value, and types are checked at runtime. However, the type system is **strong** - operations between incompatible types raise errors rather than coercing values.

```suji
# Dynamic typing - no type declarations needed
name = "Alice"      # String
age = 30            # Number
active = true       # Boolean

# Strong typing - no automatic coercion
# result = "5" + 3  # Error: Can't add string and number

# Explicit conversion required
result = "5"::to_number() + 3  # Works: 8
```

There is also no truthiness. `!` and the right-hand side of `&&`/`||` require an
actual boolean — `!nil` and `nil || "default"` are type errors — and a
conditional `match` only takes an arm whose test is exactly `true`. `nil`, `0`
and `""` are not "falsy"; they simply are not booleans. See
[Booleans](booleans.md) for the details.

## Core Types

### Primitive Types

Simple, fundamental types:

- **[Numbers](numbers.md)** - A single fixed-precision decimal number type
- **[Booleans](booleans.md)** - Logical true/false values
- **[Strings](strings.md)** - Unicode text with interpolation
- **[Nil](nil.md)** - Represents absence of a value

### Collection Types

Types for grouping multiple values:

- **[Lists](lists.md)** - Ordered, indexed sequences
- **[Maps](maps.md)** - Key-value dictionaries
- **[Tuples](tuples.md)** - Fixed-size, immutable collections

### Special Types

Types with unique behaviors:

- **[Regular Expressions](regex.md)** - Pattern matching
- **[Functions](functions.md)** - First-class callable values
- **[Streams](streams.md)** - I/O handles for files and standard streams

## Type Characteristics

### Immutability

Strings and tuples are immutable. Lists and maps are mutable (some methods modify the value in place).

```suji
import std:println

# Lists are mutable
list = [1, 2, 3]
list::push(4)
println(list)  # [1, 2, 3, 4]

# Strings are immutable
text = "hello"
upper = text::upper()
println(text)   # hello (unchanged)
println(upper)  # HELLO
```

### Type Checking

Check types at runtime:

```suji
import std:println

value = 42

println(value::is_number())      # true
println(value::is_string())      # false
println(value::is_bool())        # false

text = "hello"
println(text::is_string())       # true
```

### Type Conversion

Explicit conversion between types:

```suji
import std:println

# Number to string
num = 42
str = num::to_string()
println(str)  # 42

# String to number
text = "123"
num = text::to_number()
println(num)  # 123

# Tuple to list
tuple = (1, 2, 3)
list = tuple::to_list()
println(list)  # [1, 2, 3]
```

## Choosing the Right Type

### Use Numbers For:
- Counting, indexing
- Mathematical calculations
- Measurements, coordinates

### Use Strings For:
- Text and messages
- User input/output
- File paths, URLs

### Use Booleans For:
- Conditional logic
- Flags and toggles
- Validation results

### Use Lists For:
- Ordered collections
- Variable-length sequences
- Data transformations

### Use Maps For:
- Structured data
- Key-value associations
- JSON-like objects

### Use Tuples For:
- Multiple return values
- Fixed-size groups
- Coordinate pairs

### Use Functions For:
- Reusable logic
- Callbacks
- Higher-order operations

### Use Regex For:
- Pattern matching
- Text validation
- Data extraction

## Type Hierarchy

```
All Types
├── Primitive
│   ├── Number
│   ├── Boolean
│   ├── String
│   └── Nil
├── Collection
│   ├── List
│   ├── Map
│   └── Tuple
└── Special
    ├── Function
    ├── Regex
    └── Stream
```

## Common Patterns

### Type Guards

```suji
import std:println

process_value = |value| {
    match {
        value::is_number() => "Number: ${value}",
        value::is_string() => "String: ${value}",
        value::is_bool() => "Boolean: ${value}",
        _ => "Unknown type",
    }
}

println(process_value(42))      # Number: 42
println(process_value("hello")) # String: hello
println(process_value(true))    # Boolean: true
```

### Type-Safe Operations

```suji
import std:println

safe_add = |a, b| {
    match { a::is_number() && b::is_number() => a + b, _ => nil, }
}

println(safe_add(5, 3))      # 8
println(safe_add("5", 3))    # nil
```

### Polymorphic Functions

```suji
import std:println

length_of = |value| {
    match {
        value::is_string() => value::length(),
        value::is_list() => value::length(),
        value::is_map() => value::length(),
        _ => 0,
    }
}

println(length_of("hello"))        # 5
println(length_of([1, 2, 3]))      # 3
println(length_of({a: 1, b: 2}))   # 2
```

## Performance Considerations

### Memory Usage

Different types have different memory characteristics:

- **Numbers**: Fixed size (a 128-bit decimal)
- **Booleans**: Fixed size
- **Strings**: Variable, proportional to length
- **Lists**: Variable, grows with elements
- **Maps**: Variable, based on number of keys
- **Functions**: Small closure overhead

### Operation Costs

- **Number operations**: Decimal arithmetic is done in software, so it is
  slower than hardware floating point but exact in base 10
- **String concatenation**: Can be slow for many ops (build a list and
  `::join()` instead)
- **String indexing**: O(n) — indexes and `length()` count characters, not bytes
- **List access**: O(1) by index, O(n) by value
- **Map access**: O(1) average for lookups
- **Function calls**: Small overhead (closure capture); there are no tail calls,
  so deep recursion will overflow the stack

## Best Practices

### DO:
- Use the most appropriate type for your data
- Check types when accepting external input
- Convert types explicitly
- Document expected types in functions
- Use type-safe helper functions

### DON'T:
- Expect implicit type coercion — there is none
- Mix types without validation
- Ignore nil possibilities
- Use strings when numbers are more appropriate
- Assume list and map methods copy: `push`, `pop`, `merge` and `delete` mutate
  the value in place

## Quick Reference

| Type | Literal | Example | Mutable? |
|------|---------|---------|----------|
| Number | `42`, `3.14` | `age = 30` | Immutable |
| Boolean | `true`, `false` | `active = true` | Immutable |
| String | `"text"`, `'text'` | `name = "Alice"` | Immutable |
| Nil | `nil` | `optional = nil` | Immutable |
| List | `[...]` | `nums = [1, 2, 3]` | Mutable |
| Map | `{...}` | `user = {name: "Alice"}` | Mutable |
| Tuple | `(...)` | `point = (10, 20)` | Immutable |
| Function | `\|x\| x * 2` | `double = \|x\| x * 2` | Immutable |
| Regex | `/pattern/` | `email = /^.+@.+$/` | Immutable |
| Stream | (I/O handles) | `s = io:open("file.txt")` | I/O |

Mutable types are changed in place by a few methods (`list::push`, `list::pop`,
`map::merge`, `map::delete`) and by index assignment; every other method returns
a new value and leaves the receiver alone.

## Next Steps

Start with the primitive types to build a solid foundation:

1. **[Numbers](numbers.md)** - Learn arithmetic and math operations
2. **[Strings](strings.md)** - Master text manipulation
3. **[Booleans](booleans.md)** - Understand logical operations
4. **[Lists](lists.md)** - Work with collections
5. **[Maps](maps.md)** - Handle structured data

Then explore special types for advanced use cases.

## See Also

- [Language Overview](../overview.md)
- [Operators](../operators/)
- [Type Checking](../../advanced/type-checking.md)
- [Performance Guide](../../advanced/performance.md)
