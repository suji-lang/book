# Type Checking Methods

Suji provides type checking methods that allow you to determine the type of a value at runtime. These methods are available on all values and return boolean results.

## Overview

All types support a set of type checking methods that return `true` if the value is of the specified type, and `false` otherwise. These methods are useful for runtime type validation and conditional processing based on type.

## Available Methods

All values support these type checking methods:

- `value::is_number()` - returns `true` if value is a number
- `value::is_bool()` - returns `true` if value is a boolean
- `value::is_string()` - returns `true` if value is a string
- `value::is_list()` - returns `true` if value is a list
- `value::is_map()` - returns `true` if value is a map
- `value::is_stream()` - returns `true` if value is a stream
- `value::is_function()` - returns `true` if value is a function
- `value::is_tuple()` - returns `true` if value is a tuple
- `value::is_regex()` - returns `true` if value is a regex

Every type has all of these methods available, and each method returns `true` only when called on its corresponding type. The `nil` type also supports all these methods and returns `false` for all of them.

Numbers have one additional predicate:

- `number::is_int()` - returns `true` if the number has no fractional part

`is_int()` is **only** available on numbers; calling it on a string or any other type raises a `Method error` and terminates the program.

### What does not exist

This list is complete. In particular, there is:

- **No `is_nil()`** - test for nil with `value == nil`
- **No `is_boolean()`** - the method is called `is_bool()`
- **No `type()`, `type_of()` or `typeof`** - there is no way to obtain a type as a value; you ask a yes/no question with a predicate instead

## Testing for Nil

Because there is no `is_nil()`, comparisons are how you detect `nil`. Every predicate returns `false` for `nil`, so a chain of predicates falls through to the catch-all arm:

```suji
import std:println

describe = |value| match {
    value == nil => "nothing",
    value::is_number() => "number",
    value::is_string() => "string",
    _ => "something else",
}

println(describe(nil))       # nothing
println(describe(42))        # number
println(describe("hi"))      # string
println(describe([1, 2]))    # something else
```

`nil` is also a valid pattern in the subject form of `match`:

```suji
import std:println

value = nil

println(match value {
    nil => "missing",
    _ => "present",
})    # missing
```

## Integer Checks

```suji
import std:println

println((42)::is_int())      # true
println((3.5)::is_int())     # false
println((42.0)::is_int())    # true
println((10 / 2)::is_int())  # true

# Guard the check so it only runs on numbers
is_whole = |v| v::is_number() && v::is_int()

println(is_whole(7))        # true
println(is_whole("7"))      # false
```

## Basic Usage

```suji
import std:println

# Number type checking
x = 42
println(x::is_number())    # true
println(x::is_string())    # false
println(x::is_list())      # false

# String type checking
s = "hello"
println(s::is_string())    # true
println(s::is_number())    # false
println(s::is_map())       # false

# Boolean type checking
b = true
println(b::is_bool())      # true
println(b::is_number())    # false

# List type checking
lst = [1, 2, 3]
println(lst::is_list())    # true
println(lst::is_tuple())   # false
println(lst::is_map())     # false

# Map type checking
m = { a: 1, b: 2 }
println(m::is_map())       # true
println(m::is_list())      # false

# Tuple type checking
t = (1, 2, 3)
println(t::is_tuple())     # true
println(t::is_list())      # false

# Function type checking
f = |x| x + 1
println(f::is_function())  # true
println(f::is_number())    # false

# Stream type checking
import std:io
stream = io:stdout
println(stream::is_stream())   # true
println(stream::is_string())   # false

# Regex type checking
pattern = /^[a-z]+$/
println(pattern::is_regex())    # true
println(pattern::is_string())  # false
println(pattern::is_number())  # false

# Nil type checking
n = nil
println(n::is_number())    # false
println(n::is_string())    # false
println(n::is_list())      # false
println(n::is_map())       # false
println(n::is_tuple())     # false
println(n::is_bool())      # false
println(n::is_function())  # false
println(n::is_stream())    # false
println(n::is_regex())     # false
```

## Common Use Cases

### Runtime Type Validation

```suji
import std:println

process = |value| {
    match {
        value::is_number() => value * 2,
        value::is_string() => value + " processed",
        value::is_list() => value::length(),
        _ => nil,
    }
}

println(process(10))        # 20
println(process("data"))    # data processed
println(process([1, 2, 3])) # 3
```

### Type-Safe Function Parameters

```suji
import std:println

safe_divide = |a, b| {
    match {
        !a::is_number() || !b::is_number() => return nil,
        b == 0 => return nil,
        _ => a / b,
    }
}

println(safe_divide(10, 2))      # 5
println(safe_divide(10, 0))      # nil
println(safe_divide("10", 2))    # nil
```

### Conditional Type Handling

```suji
import std:println

format_value = |v| {
    match {
        v::is_string() => '"' + v + '"',
        v::is_number() => v::to_string(),
        v::is_bool() => match v {
            true => "true",
            false => "false",
        },
        v::is_list() => "[list]",
        v::is_map() => "{map}",
        v::is_function() => "<function>",
        v::is_tuple() => "(tuple)",
        v::is_stream() => "<stream>",
        v::is_regex() => "<regex>",
        _ => "nil",
    }
}

println(format_value("hello"))   # "hello"
println(format_value(42))        # 42
println(format_value(true))      # true
println(format_value([1, 2]))   # [list]
println(format_value(nil))       # nil
```

### Type-Based Dispatch

```suji
import std:println

handle = |data| {
    match {
        data::is_string() => {
            println("Processing string: ${data}")
            data::upper()
        },
        data::is_list() => {
            println("Processing list with ${data::length()} items")
            data::sum()
        },
        data::is_map() => {
            println("Processing map with ${data::length()} keys")
            data::keys()::join(", ")
        },
        _ => {
            println("Unknown type")
            nil
        },
    }
}

println(handle("hello"))              # Processing string: hello\nHELLO
println(handle([1, 2, 3]))            # Processing list with 3 items\n6
println(handle({ a: 1, b: 2 }))       # Processing map with 2 keys\na, b
```

### Input Validation

```suji
import std:println

validate_input = |input| {
    match {
        input::is_string() && input::length() > 0 => "Valid string",
        input::is_number() && input > 0 => "Valid positive number",
        input::is_list() && input::length() > 0 => "Valid non-empty list",
        _ => "Invalid input",
    }
}

println(validate_input("hello"))     # Valid string
println(validate_input(""))          # Invalid input
println(validate_input(42))          # Valid positive number
println(validate_input(-5))          # Invalid input
println(validate_input([1, 2]))      # Valid non-empty list
println(validate_input([]))          # Invalid input
```

## Best Practices

### DO:
- Use type checking methods for runtime validation
- Combine with match expressions for type-based dispatch
- Check types before performing type-specific operations
- Use type checks for input validation

### DON'T:
- Overuse type checking (Suji is dynamically typed)
- Check types unnecessarily when types are already known
- Look for `is_nil()`, `is_boolean()` or `type()` - they do not exist
- Call `is_int()` on a value you have not already confirmed is a number

## Implementation Notes

- Type checking methods are available on all values, including `nil`
- Each method performs a runtime type check and returns a boolean result
- `is_int()` is the only predicate restricted to a single type (numbers)
- Because there is no way to recover from a runtime error, predicates are the
  main tool for keeping a program on a valid path - check first, then operate

## See Also

- [Data Types](../fundamentals/data-types/README.md) - Overview of all Suji types
- [Match Expressions](../fundamentals/control-flow/match.md) - Pattern matching with type checks
- [Nil Type](../fundamentals/data-types/nil.md) - Handling nil values
- [Error Handling](error-handling.md) - Validating before you act

