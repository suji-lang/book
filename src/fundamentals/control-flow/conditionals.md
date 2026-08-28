# Conditional Logic

Suji has no `if`, `else` or `elif`, no ternary operator, and no `and`/`or`/`not`
keywords. `match` is the **only** conditional construct, in two forms; logical
operators (`&&`, `||`, `!`) combine boolean conditions and drive guard clauses for
early returns.

## Using Match for Conditionals

`match` is Suji's only conditional construct, and it comes in two forms:

- the **subject form**, `match value { pattern => body, … }`, which compares
  patterns against a value
- the **condition-only form**, `match { condition => body, … }`, where every arm
  is a boolean expression evaluated in order

Both are expressions: they evaluate to the body of the first matching arm, or to
`nil` if no arm matches. Every arm whose body is a bare expression needs a
trailing comma, **including the last one** — see
[Match Expressions](match.md) for the full rule.

### Basic Conditional

```suji
import std:println

age = 25

# Match on boolean condition
match age >= 18 {
    true => println("Adult"),
    false => println("Minor"),
}
```

### Multiple Conditions

```suji
import std:println

score = 85

# Use conditional match for ranges
status = match {
    score >= 90 => "A",
    score >= 80 => "B",
    score >= 70 => "C",
    score >= 60 => "D",
    _ => "F",
}

println(status)  # B
```

### Match as Expression

Match expressions return values:

```suji
import std:println

age = 25
status = match age >= 18 {
    true => "adult",
    false => "minor",
}

println(status)  # adult
```

### Nested Conditions

```suji
import std:println

user = {is_active: true, is_admin: false}

# Use nested match or combine conditions
match user:is_active {
    true => match user:is_admin {
        true => println("Active admin"),
        false => println("Active user"),
    },
    false => println("Inactive user"),
}

# Or combine conditions
match {
    user:is_active && user:is_admin => println("Active admin"),
    user:is_active => println("Active user"),
    _ => println("Inactive user"),
}
```

## Guard Clauses

Use logical operators (`&&` and `||`) for early returns. Read a possibly-missing
map key with `::get(key, default)` — a plain `user:name` on a map that lacks the
key raises `Key not found` and terminates the program:

```suji
import std:println

validate_user = |user| {
    # Guard: return early if nil
    user == nil && return "User is required"

    # Guard: return early if name is missing or empty
    name = user::get("name", "")
    name::length() == 0 && return "Name is required"

    # Guard: return early if too young
    user::get("age", 0) < 18 && return "Must be 18 or older"

    # All guards passed
    "Valid"
}

println(validate_user({name: "Alice", age: 30}))  # Valid
println(validate_user({age: 30}))                 # Name is required
println(validate_user(nil))                       # User is required
```

### Guard Pattern Explained

Guard clauses use short-circuit evaluation:
- `condition && return value` - returns if condition is true
- `condition || return value` - returns if condition is false

The condition must be a real boolean. There is no truthiness in Suji, so write
`x == nil` or `name::length() == 0` rather than relying on the value itself, and
note that `x || "default"` is a type error rather than a defaulting idiom.

```suji
import std:println

process = |x| {
    # Return early if x is nil
    x == nil && return "nil"
    
    # Return early if x is negative
    x < 0 && return "negative"
    
    # Main logic
    "positive: ${x}"
}

println(process(5))   # positive: 5
println(process(-1))  # negative
println(process(nil)) # nil
```

## Common Patterns

### Range Checking

```suji
import std:println

temperature = 25

status = match {
    temperature < 0 => "Freezing",
    temperature < 20 => "Cold",
    temperature < 30 => "Comfortable",
    _ => "Hot",
}

println(status)  # Comfortable
```

### Checking Before Acting

Runtime errors cannot be caught, so a conditional is how you avoid them. Test the
dangerous condition first and pick a safe branch:

```suji
import std:println

divide = |a, b| {
    match {
        b == 0 => nil,
        _ => a / b,
    }
}

println(divide(10, 2))  # 5
println(divide(10, 0))  # nil
```

### Type Checking

```suji
import std:println

process_value = |value| {
    match {
        value::is_number() => println("Number: ${value}"),
        value::is_string() => println("String: ${value}"),
        value::is_bool() => println("Boolean: ${value}"),
        _ => println("Unknown type"),
    }
}

process_value(42)      # Number: 42
process_value("hello") # String: hello
process_value(true)    # Boolean: true
```

### Ternary-Style

For simple true/false conditionals:

```suji
import std:println

age = 25
status = match age >= 18 {
    true => "adult",
    false => "minor",
}

println(status)  # adult
```

## Best Practices

### DO:
- Use `match` for all conditional logic
- Use guard clauses (`&& return`) for early validation
- Use conditional match (`match { condition => ... }`) for multiple conditions
- Keep match expressions readable
- Use pattern alternation (`|`) for multiple matching values

### DON'T:
- Try to use `if`, `else`, `elif` or a ternary operator (none of them exist in Suji)
- Write `and`, `or` or `not` — the operators are `&&`, `||` and `!`
- Rely on truthiness: `x || "default"` is a type error, not a default
- Nest match expressions too deeply (extract to functions)
- Forget the default case (`_`) in match, unless `nil` is the answer you want
- Omit the trailing comma after the last expression arm
- Use complex boolean expressions in guards (extract to variables)

## Comparison with Other Languages

If you're coming from languages with `if` statements:

| Other Language | Suji Equivalent |
|----------------|-----------------|
| `if (condition) { ... }` | `match { condition => { ... } }` |
| `if (condition) { ... } else { ... }` | `match { condition => { ... } _ => { ... } }` |
| `if (x) return y` | `x && return y` (guard clause; `x` must be boolean) |
| `if (!x) return y` | `x \|\| return y` (guard clause; `x` must be boolean) |
| `if-else if-else` chain | `match { condition1 => ..., condition2 => ..., _ => ..., }` |
| `condition ? a : b` | `match { condition => a, _ => b, }` |
| `x = y ?? "default"` | `m::get("y", "default")`, or `match { y == nil => "default", _ => y, }` |

## See Also

- [Match Expressions](match.md) - Complete guide to pattern matching
- [Guard Clauses](guards.md) - Using logical operators for early returns
- [Logical Operators](../operators/logical.md) - Understanding `&&` and `||`
- [Loops](loops.md) - Iteration and repetition
