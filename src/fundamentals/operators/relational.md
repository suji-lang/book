# Relational Operators

Relational operators compare values and return boolean results.

## Overview

Relational (comparison) operators test relationships between values. They're essential for conditional logic, sorting, and filtering operations.

This page covers both **equality** (`==`, `!=`) and **ordering** (`<`, `<=`, `>`, `>=`). The two behave differently across types: equality between mismatched types simply returns `false`, while ordering between mismatched types is a runtime type error.

## Operators

### Equal To (`==`)

Tests if two values are equal.

```suji
import std:println

println(5 == 5)       # true
println(5 == 3)       # false
println("a" == "a")   # true
println("a" == "A")   # false
println(true == true) # true
```

**Works with**: every type. Lists, maps and tuples compare **by value**.

**Type-strict**: `5 == "5"` is `false` (number ≠ string) — comparing different types
is never an error, it is just `false`.

### Not Equal To (`!=`)

Tests if two values are not equal.

```suji
import std:println

println(5 != 3)       # true
println(5 != 5)       # false
println("a" != "b")   # true
println("a" != "a")   # false
```

**Equivalent to**: `!(a == b)`

### Less Than (`<`)

Tests if left value is less than right value.

```suji
import std:println

println(3 < 5)      # true
println(5 < 3)      # false
println(5 < 5)      # false
println("a" < "b")  # true (lexicographic)
```

**Works with**: Numbers, strings (lexicographic comparison). Anything else — including
two booleans, two lists, or a number and a string — is a runtime type error.

### Less Than or Equal (`<=`)

Tests if left value is less than or equal to right value.

```suji
import std:println

println(3 <= 5)     # true
println(5 <= 5)     # true
println(7 <= 5)     # false
println("a" <= "a") # true
```

### Greater Than (`>`)

Tests if left value is greater than right value.

```suji
import std:println

println(5 > 3)      # true
println(3 > 5)      # false
println(5 > 5)      # false
println("b" > "a")  # true (lexicographic)
```

**Works with**: Numbers, strings (lexicographic comparison)

### Greater Than or Equal (`>=`)

Tests if left value is greater than or equal to right value.

```suji
import std:println

println(5 >= 3)     # true
println(5 >= 5)     # true
println(3 >= 5)     # false
println("b" >= "b") # true
```

## Type Compatibility

### Numbers

All relational operators work with numbers:

```suji
import std:println

println(3.14 < 3.15)   # true
println(100 >= 50)     # true
println(42 == 42.0)    # true (there is only one number type)
println(0 != -0)       # false (both zero)
```

### Strings

Strings use **lexicographic** (dictionary) ordering:

```suji
import std:println

println("a" < "b")      # true
println("apple" < "banana")  # true
println("A" < "a")      # true (uppercase before lowercase)
println("10" < "2")     # true (string comparison, not numeric)
```

**Note**: String comparison is case-sensitive and uses Unicode code points.

### Booleans

Booleans can be compared for equality:

```suji
import std:println

println(true == true)   # true
println(true == false)  # false
println(true != false)  # true
```

**Note**: Order comparisons are not supported for booleans — `true < false` fails with
`Type error: Cannot compare boolean and boolean`.

### Nil

Nil can be compared for equality:

```suji
import std:println

println(nil == nil)     # true
println(nil != nil)     # false
println(5 == nil)       # false
println("text" != nil)  # true
```

### Collections

Lists, maps and tuples support **equality only**. They are compared element by
element (maps by key/value pairs):

```suji
import std:println

println([1, 2] == [1, 2])        # true
println([1, 2] == [2, 1])        # false
println([1, 2] == [1, 2, 3])     # false
println((1, 2) == (1, 2))        # true
println({a: 1} == {a: 1})        # true
```

There is **no** ordering for collections: `[1, 2] < [1, 3]` fails with
`Type error: Cannot compare list and list`. To sort a list of lists you would have to
compare a derived scalar (e.g. an element or a length) yourself.

## Common Patterns

### Range Checking

```suji
import std:println

age = 25

match { age >= 18 && age < 65 => { println("Working age") } }

# Numeric ranges
score = 85
match { score >= 80 && score < 90 => { println("Grade: B") } }
```

### Boundary Validation

```suji
import std:println

validate_percentage = |value| {
    match { value < 0 || value > 100 => {
        println("Error: Must be between 0 and 100")
        return false
    } }
    true
}

println(validate_percentage(50))   # true
println(validate_percentage(150))  # prints the error, then false
```

### Sorting

```suji
import std:println

numbers = [5, 2, 8, 1, 9]

sorted = numbers::sort()
println(sorted)  # [1, 2, 5, 8, 9]
```

### Finding Min/Max

```suji
import std:println

find_min = |list| {
    list::length() == 0 && return nil
    
    min = list[0]
    loop through list with item {
        match { item < min => { min = item } }
    }
    min
}

numbers = [5, 2, 8, 1, 9]
println(find_min(numbers))  # 1
```

### Filtering

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filter by comparison
evens = numbers::filter(|x| x % 2 == 0)
large = numbers::filter(|x| x > 5)
range = numbers::filter(|x| x >= 3 && x <= 7)

println(evens)  # [2, 4, 6, 8, 10]
println(large)  # [6, 7, 8, 9, 10]
println(range)  # [3, 4, 5, 6, 7]
```

### Conditional Logic

```suji
import std:println

classify = |temp| {
    match {
        temp < 0 => "Freezing",
        temp < 15 => "Cold",
        temp < 25 => "Comfortable",
        _ => "Hot",
    }
}

println(classify(-5))   # Freezing
println(classify(20))   # Comfortable
println(classify(30))   # Hot
```

## String Comparison Details

### Lexicographic Order

Strings are compared character by character using Unicode values:

```suji
import std:println

# Character-by-character comparison
println("abc" < "abd")      # true ('c' < 'd')
println("abc" < "abcd")     # true (shorter is less if prefix matches)

# Case sensitivity
println("ABC" < "abc")      # true (uppercase < lowercase in Unicode)
println("apple" < "Apple")  # false

# Numbers as strings
println("10" < "2")         # true ("1" < "2" as strings)
println("10" < "9")         # true ("1" < "9" as strings)
```

### Case-Insensitive Comparison

For case-insensitive comparison, normalize first:

```suji
import std:println

compare_ignore_case = |a, b| {
    a::lower() == b::lower()
}

println(compare_ignore_case("Hello", "hello"))  # true
println(compare_ignore_case("Apple", "APPLE"))  # true
```

## Chaining Comparisons

You can chain comparisons with logical operators:

```suji
import std:println

x = 5

# Multiple conditions
match { x > 0 && x < 10 => { println("x is between 0 and 10") } }

# Range check
in_range = x >= 1 && x <= 100
println(in_range)  # true
```

## Best Practices

### DO:
- Use `==` for equality, not `=` (assignment)
- Compare same types (number with number, string with string)
- Use parentheses for clarity in complex conditions
- Normalize strings before case-insensitive comparison
- Check for nil before comparing

### DON'T:
- Compare different types (5 == "5" is always false)
- Use `=` in conditions (syntax error)
- Forget that string comparison is case-sensitive
- Chain operators without logical connectors (`a < b < c` doesn't work)
- Assume order comparison works for all types

## Examples

### Temperature Converter with Validation

```suji
import std:println

celsius_to_fahrenheit = |c| {
    below_absolute_zero = c < -273.15
    match below_absolute_zero {
        true => {
            println("Error: Below absolute zero")
            return nil
        }
        _ => nil,
    }
    result = (c * 9 / 5) + 32
    result
}

f = celsius_to_fahrenheit(100)
match f {
    nil => {},
    _ => println("${f}°F"),
}
```

Note the local variable before `(c * 9 / 5)`: a line that starts with `(` continues
the previous expression, so it would otherwise be parsed as a call on the `match`
result.

### Grade Calculator

```suji
import std:println

get_grade = |score| {
    (score < 0 || score > 100) && return "Invalid score"
    
    match {
        score >= 90 => "A",
        score >= 80 => "B",
        score >= 70 => "C",
        score >= 60 => "D",
        _ => "F",
    }
}

println(get_grade(85))   # B
println(get_grade(92))   # A
println(get_grade(105))  # Invalid score
```

### List Deduplication

```suji
import std:println

deduplicate = |list| {
    unique = []
    
    loop through list with item {
        found = false
        loop through unique with existing {
            match { existing == item => {
                found = true
                break
            } }
        }
        
        match { !found => { unique::push(item) } }
    }
    
    unique
}

numbers = [1, 2, 2, 3, 3, 3, 4, 5, 5]
result = deduplicate(numbers)
println(result)  # [1, 2, 3, 4, 5]
```

### Binary Search

```suji
import std:println

binary_search = |sorted_list, target| {
    left = 0
    right = sorted_list::length() - 1
    
    loop {
        left > right && return nil  # Not found
        
        mid = ((left + right) / 2)::floor()
        mid_val = sorted_list[mid]
        
        match {
            mid_val == target => return mid,
            mid_val < target => left = mid + 1,
            _ => right = mid - 1,
        }
    }
}

numbers = [1, 3, 5, 7, 9, 11, 13]
index = binary_search(numbers, 7)
println(index)  # 3
```

## Operator Summary

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `==` | Equal | `5 == 5` | `true` |
| `!=` | Not equal | `5 != 3` | `true` |
| `<` | Less than | `3 < 5` | `true` |
| `<=` | Less or equal | `5 <= 5` | `true` |
| `>` | Greater than | `5 > 3` | `true` |
| `>=` | Greater or equal | `5 >= 5` | `true` |

## See Also

- [Logical Operators](logical.md) - AND, OR, NOT
- [Arithmetic Operators](arithmetic.md) - Math operations
- [Matching Operators](matching.md) - Regex matching
- [Control Flow](../control-flow/) - conditionals, loops, match
