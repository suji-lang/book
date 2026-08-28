# Multiple Return Values

Functions can return multiple values using tuples, enabling elegant error handling and complex result patterns.

Two rules apply throughout this chapter:

- Return several values with `return a, b`, which builds a tuple.
- Destructure **without** parentheses: `a, b = f()`. A line that begins with `(` is
  parsed as a call on the previous expression, so `(a, b) = f()` does not destructure.

## Basic Multiple Returns

```suji
import std:println

divide_with_remainder = |a, b| {
    quotient = (a / b)::floor()
    return quotient, a % b
}

q, r = divide_with_remainder(17, 5)
println("${q} remainder ${r}")  # 3 remainder 2
```

## Destructuring Returns

### Basic Destructuring

```suji
import std:println

get_coordinates = || (10, 20, 30)

x, y, z = get_coordinates()
println("x:${x}, y:${y}, z:${z}")  # x:10, y:20, z:30
```

### Ignoring Values

Use underscore to ignore unwanted values:

```suji
import std:println

# total, average, min, max
get_stats = || (100, 50, 25, 10)

total, avg, _, _ = get_stats()
println("Total: ${total}, Average: ${avg}")  # Total: 100, Average: 50
```

## Result/Error Pattern

Common pattern for error handling:

```suji
import std:println

safe_divide = |a, b| {
    match { b == 0 => (nil, "Division by zero"), _ => (a / b, nil), }
}

result, error = safe_divide(10, 2)
match error {
    nil => println("Result: ${result}"),   # Result: 5
    _ => println("Error: ${error}"),
}

failed, why = safe_divide(10, 0)
println(why)  # Division by zero
```

Patterns do not bind, so the second arm is `_` and reads `error` directly. This is the
only way to react to a failure: a real division by zero terminates the program, so the
check has to happen before the operation.

## Validation Results

```suji
import std:println

validate_user = |user| {
    # Check multiple conditions
    user:name == nil && return false, "Name is required"
    user:name::length() < 3 && return false, "Name too short"
    user:age < 18 && return false, "Must be 18+"

    return true, nil
}

valid, error = validate_user({name: "Alice", age: 30})
match { valid => println("User is valid"), _ => println("Validation error: ${error}"), }
# User is valid

ok, problem = validate_user({name: "Al", age: 30})
println(problem)  # Name too short
```

## Parsing Results

```suji
import std:println

parse_int = |text| {
    # Validate before converting: to_number() on junk is a runtime error
    match { text ~ /^\d+$/ => (text::to_number(), nil), _ => (nil, "Invalid integer format"), }
}

value, error = parse_int("123")
match error {
    nil => println("Parsed: ${value}"),   # Parsed: 123
    _ => println("Error: ${error}"),
}

bad, why = parse_int("12x")
println(why)  # Invalid integer format
```

## Multiple Validation Results

```suji
import std:println

validate_form = |form| {
    errors = []
    warnings = []

    # Collect errors — get() avoids the "Key not found" error on absent keys
    email = form::get("email")
    phone = form::get("phone")

    match { email == nil => errors::push("Email required"), _ => nil, }
    match { email != nil && !(email ~ /@/) => errors::push("Invalid email"), _ => nil, }

    # Collect warnings
    match { phone == nil => warnings::push("Phone recommended"), _ => nil, }

    return errors, warnings
}

errors, warnings = validate_form({email: "test@example.com"})
println("Errors: ${errors::length()}")      # Errors: 0
println("Warnings: ${warnings::length()}")  # Warnings: 1
```

## Complex State Returns

```suji
import std:println

process_transaction = |account, amount| {
    old_balance = account:balance
    new_balance = old_balance + amount

    status = match {
        new_balance < 0 => "overdrawn",
        new_balance < 100 => "low",
        _ => "ok",
    }

    return new_balance, old_balance, status
}

new_bal, old_bal, status = process_transaction({balance: 150}, -75)

println("Old: ${old_bal}, New: ${new_bal}, Status: ${status}")
# Old: 150, New: 75, Status: low
```

## Option Pattern

Represent optional values:

```suji
import std:println

find_user = |id| {
    users = {
        1: {name: "Alice", age: 30},
        2: {name: "Bob", age: 25},
    }

    user = users::get(id)
    match user {
        nil => (nil, false),
        _ => (user, true),
    }
}

user, found = find_user(1)
match { found => println("Found: ${user:name}"), _ => println("User not found"), }
# Found: Alice

missing, was_found = find_user(99)
println(was_found)  # false
```

Suji has no `Option` type; a `(value, found)` pair is the idiom, and `map::get(key)`
returns `nil` instead of raising when the key is absent.

## Tuples of Structures

Tuple elements can be any value, including maps:

```suji
import std:println

get_user_with_address = || {
    person = {name: "Alice", age: 30}
    address = {city: "Boston", zip: "02101"}
    return person, address
}

user, address = get_user_with_address()
println("${user:name} lives in ${address:city}")  # Alice lives in Boston
```

## Common Patterns

### Success/Failure

```suji
import std:println

try_operation = |input| {
    success = input != nil

    match {
        success => (input::upper(), nil),
        _ => (nil, "no input given"),
    }
}

data, error = try_operation("payload")
println(data)  # PAYLOAD

nothing, problem = try_operation(nil)
println(problem)  # no input given
```

### Before/After State

```suji
import std:println

update_counter = |current| {
    before = current
    after = current + 1
    return before, after
}

old, new = update_counter(5)
println("Changed from ${old} to ${new}")  # Changed from 5 to 6
```

### Min/Max Pair

```suji
import std:println

get_range = |list| {
    match list::length() {
        0 => (nil, nil),
        _ => (list::min(), list::max()),
    }
}

lowest, highest = get_range([3, 1, 4, 1, 5, 9])
println("Min: ${lowest}, Max: ${highest}")  # Min: 1, Max: 9
```

### Split Result

```suji
import std:println

partition_by_predicate = |list, pred| {
    matching = []
    non_matching = []

    loop through list with item {
        match pred(item) {
            true => { matching::push(item) },
            false => { non_matching::push(item) },
        }
    }

    return matching, non_matching
}

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens, odds = partition_by_predicate(numbers, |x| x % 2 == 0)

println("Evens: ${evens}")  # [2, 4, 6, 8, 10]
println("Odds: ${odds}")    # [1, 3, 5, 7, 9]
```

## Best Practices

### DO:
- Use tuples for multiple related values
- Use (value, error) pattern for operations that can fail
- Destructure immediately when possible
- Use underscore for unwanted values
- Keep tuple size reasonable (2-4 elements)

### DON'T:
- Return large tuples (use maps instead)
- Mix unrelated values in tuples
- Forget to check error values
- Overuse tuples when single value suffices
- Create deeply nested tuples

## Tuples Are Not Indexable

Destructuring is the only cheap way into a tuple. `t[0]` is a type error, and there is
no `t::get(0)` or `t::first()`; the fallback is `to_list()`, which copies:

```suji
import std:println

function_returning_tuple = || (1, 2)

# Preferred
a, b = function_returning_tuple()
println("${a} ${b}")  # 1 2

# Works, but allocates a list
values = function_returning_tuple()::to_list()
println(values[0])  # 1

# values = function_returning_tuple()
# values[0]
# => Type error: Cannot index tuple
```

Tuples also support `length()` and `to_string()`.

## Examples

### HTTP Response Pattern

```suji
import std:println

fetch_data = |url| {
    # Simulated HTTP response
    status = 200
    data = {users: ["Alice", "Bob"]}

    return status, data, nil
}

status, data, error = fetch_data("https://api.example.com")

match status {
    200 => println("Success: ${data}"),
    _ => println("Error: ${error}"),
}
# Success: {users: [Alice, Bob]}
```

### Database Query Result

```suji
import std:println

query_users = |conditions| {
    # Simulated query
    rows = [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]

    return rows, rows::length(), false
}

users, total, has_more = query_users({active: true})
println("Found ${total} users")  # Found 2 users
```

### Parser Result

```suji
import std:println

parse_command = |input| {
    parts = input::split()

    match parts::length() {
        0 => (nil, nil, "Empty command"),
        1 => (parts[0], [], nil),
        _ => (parts[0], parts[1;], nil),
    }
}

cmd, args, error = parse_command("git commit -m message")
println(cmd)   # git
println(args)  # [commit, -m, message]
```

## See Also

- [Tuples](../fundamentals/data-types/tuples.md)
- [Function Basics](basics.md)
- [Error Handling](../advanced/error-handling.md)
- [Pattern Matching](../fundamentals/control-flow/match.md)
