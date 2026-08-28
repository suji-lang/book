# Control Flow

Control flow determines the order in which code executes based on conditions and iteration needs.

## Overview

Suji provides two control flow constructs: `loop` (with `break` and `continue`) and `match` expressions. There is no `if`, `else`, `while` or `for`, and no `try`/`catch`. Guard clauses using logical operators enable early returns.

One rule catches almost everybody: in a `match`, an arm whose body is a bare
expression must be followed by a comma, **including the final arm**. Only arms
with `{ … }` block bodies may omit it.

## Control Flow Constructs

### Conditional Logic

Suji does not have `if` or `else` statements. Use `match` expressions for all conditional logic:

#### Match for Conditionals

```suji
import std:println

age = 25

# Match on boolean condition
match age >= 18 {
    true => println("Adult"),
    false => println("Minor"),
}
```

#### Multiple Conditions

```suji
import std:println

score = 85

# Use conditional match for ranges
match {
    score >= 90 => println("A"),
    score >= 80 => println("B"),
    score >= 70 => println("C"),
    score >= 60 => println("D"),
    _ => println("F"),
}
```

[Learn more about Conditional Logic →](conditionals.md)

### Loops

Repeat code multiple times:

#### Infinite Loop

```suji
import std:println

count = 0
loop {
    count = count + 1
    count > 5 && break
    println(count)
}
```

#### Loop Through Lists

```suji
import std:println

fruits = ["apple", "banana", "cherry"]

loop through fruits with fruit {
    println(fruit)
}

# Lists have no index binding — keep a counter or iterate the indices
loop through 0..fruits::length() with index {
    println("${index}: ${fruits[index]}")
}
```

#### Loop Through Maps

Two bindings are for maps only:

```suji
import std:println

config = {port: 8080, host: "localhost"}

loop through config with key, value {
    println("${key} = ${value}")
}
```

[Learn more about Loops →](loops.md)

### Pattern Matching

Match values against patterns:

```suji
import std:println

grade = |score| {
    match {
        score >= 90 => "A",
        score >= 80 => "B",
        score >= 70 => "C",
        score >= 60 => "D",
        _ => "F",
    }
}

println(grade(85))  # B
```

#### With Tuple Patterns

Tuple patterns compare element by element. Elements are literals or `_` — they do
not bind, so use a destructuring assignment when you need the parts:

```suji
import std:println

point = (10, 20)

match point {
    (0, 0) => println("Origin"),
    (0, _) => println("On the Y-axis"),
    (_, 0) => println("On the X-axis"),
    _ => println("Elsewhere"),
}

x, y = point
println("Point at ${x}, ${y}")
```

#### With Regex

```suji
import std:println

text = "Call 555-1234"

match text {
    /\d{3}-\d{4}/ => {
        words = text::split(" ")
        phones = words::filter(|w| w ~ /^\d{3}-\d{4}$/)
        match { phones::length() > 0 => { println("Phone: " + phones[0]) } }
    },
    _ => println("No phone found"),
}
```

[Learn more about Pattern Matching →](match.md)

### Guard Clauses

Early returns using logical operators:

```suji
import std:println

process_user = |user| {
    # Guard: return early if nil
    user == nil && return "Error: No user"

    # Guard: return early if inactive (::get avoids a "Key not found" error)
    user::get("is_active", false) == false && return "Error: Inactive user"

    # Main logic
    "User ${user::get("name", "?")} processed"
}

println(process_user(nil))                              # Error: No user
println(process_user({name: "Ada"}))                    # Error: Inactive user
println(process_user({name: "Ada", is_active: true}))   # User Ada processed
```

Guards are the *only* way to deal with failure: a runtime error terminates the
program and cannot be caught, so validate before acting.

[Learn more about Guard Clauses →](guards.md)

## Control Flow Comparison

### When to Use Each Construct

| Construct | Use When | Example |
|-----------|----------|---------|
| **Match** | All conditional logic | Check if user is admin, grade calculator |
| **Loop** | Repeat until condition | Read until EOF |
| **Loop Through** | Iterate collections | Process each item in list |
| **Guards** | Validate inputs, early exits | Check preconditions |

## Common Patterns

### Early Return Pattern

```suji
import std:println

transform = |xs| xs::map(|n| n * 2)

process_data = |data| {
    # Validate and return early on failure
    data == nil && return nil
    data::length() == 0 && return nil

    # Main processing logic
    transform(data)
}

println(process_data(nil))        # nil
println(process_data([]))         # nil
println(process_data([1, 2, 3]))  # [2, 4, 6]
```

### Switch-Style Match

```suji
import std:println

handle_command = |cmd| {
    match cmd {
        "start" => println("Starting..."),
        "stop" => println("Stopping..."),
        "restart" => println("Restarting..."),
        "status" => println("Running"),
        _ => println("Unknown command"),
    }
}

handle_command("stop")    # Stopping...
handle_command("deploy")  # Unknown command
```

### Iterator Pattern

```suji
import std:println

items = ["skip me", "a", "b", "c"]
index = 0

loop through items with item {
    index = index + 1

    index == 1 && continue  # Skip first

    index > 3 && break  # Stop after the third

    println(item)
}
```

### State Machine

```suji
import std:println

state = "idle"

process_event = |event| {
    state = match (state, event) {
        ("idle", "start") => "running",
        ("running", "pause") => "paused",
        ("paused", "resume") => "running",
        ("running", "stop") => "idle",
        _ => state,  # No change
    }
}

process_event("start")
println(state)  # running

process_event("bogus")
println(state)  # running
```

## Nested Control Flow

### Nested Conditions

```suji
import std:println

check_access = |user, resource| {
    # Use guards for early returns
    user == nil && return false
    user::get("is_active", false) == false && return false
    user::get("permissions", [])::contains(resource)
}

println(check_access(nil, "reports"))                                       # false
println(check_access({is_active: true, permissions: ["logs"]}, "reports"))  # false
println(check_access({is_active: true, permissions: ["reports"]}, "reports"))  # true
```

### Nested Loops

```suji
import std:println

matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

loop through matrix with row {
    loop through row with cell {
        println(cell)
    }
}
```

### Match with Nested Conditions

```suji
import std:println

categorize = |value| {
    match {
        value::is_number() => {
            match {
                value < 0 => "negative",
                value == 0 => "zero",
                _ => "positive",
            }
        },
        value::is_string() => "text",
        _ => "unknown",
    }
}

println(categorize(-4))     # negative
println(categorize("hi"))   # text
println(categorize(nil))    # unknown
```

## Best Practices

### DO:
- Use guard clauses for early validation
- Prefer `match` for all conditional logic
- Use `loop through` for collections
- Keep nesting shallow (max 2-3 levels)
- Use meaningful condition names

### DON'T:
- Try to use `if` statements (they don't exist in Suji)
- Forget the trailing comma after the last expression arm of a `match`
- Assume a bare identifier pattern binds — it is a string literal
- Create deeply nested match expressions
- Use loops where functional methods work better
- Ignore break/continue for complex loop logic
- Write long match expressions (extract to functions)
- Forget the default case (`_`) in match

## Common Pitfalls

### Pitfall 1: Missing Comma After the Last Arm

This is the most common parse error in Suji code. Expression arms need commas,
last arm included:

```text
match value { 1 => "one", 2 => "two" }    # [201] Error: Unexpected token
```

```suji
import std:println

value = 2

println(match value { 1 => "one", 2 => "two", })  # two
```

### Pitfall 2: Missing Default Case

A `match` that matches nothing evaluates to `nil` rather than raising, so a
missing `_` arm shows up as an unexpected `nil` later:

```suji
import std:println

value = 3

# No default case
println(match value {
    1 => "one",
    2 => "two",
})  # nil

# Always have a default when nil is not the answer you want
println(match value {
    1 => "one",
    2 => "two",
    _ => "other",
})  # other
```

### Pitfall 3: Infinite Loops

```suji
import std:println

count = 0
done = || count >= 3

# No exit condition
# loop {
#     println("forever")   # Never breaks!
# }

# Have clear exit
loop {
    done() && break
    count = count + 1
    println(count)
}
```

### Pitfall 4: Binding Patterns That Do Not Exist

Patterns cannot introduce variables. `n` below is the string `"n"`, so nothing
matches and the result is `nil`:

```suji
import std:println

println(match 5 { n => n * 2, })  # nil

n = 5
println(match { n > 0 => n * 2, _ => 0, })  # 10
```

## Performance Considerations

### Match Arms Are Tested in Order

There is no jump table: the interpreter walks the arms top to bottom, so put the
cheapest and most likely conditions first.

```suji
import std:println

handle = |key| {
    match key {
        "a" => "handled a",
        "b" => "handled b",
        "c" => "handled c",
        _ => "handled default",
    }
}

println(handle("b"))  # handled b
println(handle("z"))  # handled default
```

### Loop vs Functional Methods

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6]

# Loop with state mutation
total = 0
loop through numbers with n {
    match { n % 2 == 0 => { total = total + n } }
}
println(total)  # 12

# Functional pipeline (shorter, though it allocates an intermediate list)
total = numbers::filter(|n| n % 2 == 0)::sum()
println(total)  # 12
```

## Next Steps

Explore each control flow construct in detail:

1. **[Conditional Logic](conditionals.md)** - Using match for conditionals
2. **[Loops](loops.md)** - Iteration and repetition
3. **[Match](match.md)** - Pattern matching
4. **[Guards](guards.md)** - Early returns and validation

## See Also

- [Operators](../operators/)
- [Functions](../../functions/)
- [Pattern Matching](match.md)
- [Error Handling](../../advanced/error-handling.md)
