# Booleans

Booleans represent logical truth values: `true` or `false`.

## Overview

Booleans are fundamental for control flow, conditionals, and logical operations.

### Key Characteristics

- **Two values** - Only `true` or `false`
- **Logical operators** - `&&`, `||`, `!` (there are no `and`/`or`/`not` keywords)
- **Comparison results** - All comparisons return booleans
- **Short-circuit evaluation** - Efficient logical operations
- **No truthiness** - Other types are not "falsy"; `!nil` and `nil || "x"` are
  type errors, and a conditional `match` only takes an arm that tests `true`

### When to Use Booleans

Use booleans for:
- Conditional logic (match)
- Flags and toggles
- Validation results
- State tracking (enabled/disabled, active/inactive)
- Filter conditions

## Syntax

### Boolean Literals

```suji
import std:println

# The two boolean values
is_valid = true
is_active = false

# In expressions
user_logged_in = true
debug_mode = false

println(is_valid)   # true
println(debug_mode) # false
```

## Logical Operators

### AND (`&&`)

Both operands must be true:

```suji
import std:println

println(true && true)     # true
println(true && false)    # false
println(false && true)    # false
println(false && false)   # false

# Short-circuit: second operand not evaluated if first is false
result = false && (10 / 0)  # No error - second part not evaluated
```

### OR (`||`)

At least one operand must be true:

```suji
import std:println

println(true || true)     # true
println(true || false)    # true
println(false || true)    # true
println(false || false)   # false

# Short-circuit: second operand not evaluated if first is true
result = true || (10 / 0)   # No error - second part not evaluated
```

### NOT (`!`)

Negates a boolean value:

```suji
import std:println

println(!true)            # false
println(!false)           # true
println(!!true)           # true (double negation)
```

## Comparison Operators

All comparison operators return booleans:

### Equality

```suji
import std:println

println(5 == 5)           # true
println(5 == 6)           # false
println(5 != 6)           # true
println("hello" == "hello") # true
```

### Relational

```suji
import std:println

println(5 < 10)           # true
println(5 > 10)           # false
println(5 <= 5)           # true
println(10 >= 10)         # true
```

### String Comparison

```suji
import std:println

println("apple" < "banana")   # true (lexicographic)
println("zebra" > "aardvark") # true
```

## Compound Conditions

### Combining Operators

```suji
import std:println

age = 25
has_license = true

# Can drive if adult with license
can_drive = age >= 18 && has_license
println(can_drive)  # true

# Student or senior discount
age = 70
is_student = false
gets_discount = is_student || age >= 65
println(gets_discount)  # true
```

### Operator Precedence

```suji
import std:println

# NOT has highest precedence
println(!false && true)          # true  (parsed as (!false) && true)

# AND before OR
println(true || false && false)  # true  (parsed as true || (false && false))

# Use parentheses for clarity
println((true || false) && false)  # false
```

## Short-Circuit Evaluation

### AND Short-Circuit

```suji
import std:println

# Second expression only evaluated if first is true
check_user = |user| {
    user != nil && user:is_active
}

# Safe - doesn't error on nil user
println(check_user(nil))  # false
```

### OR Short-Circuit

```suji
import std:println

# The right side is only evaluated when the left side is not `true`
is_weekend = |day| day == "sat" || day == "sun"

println(is_weekend("sat"))  # true
println(is_weekend("mon"))  # false

# Falling back to a default needs a match: `||` will not accept a non-boolean
get_name = |user| {
    match user != nil && user:name != nil {
        true => user:name,
        false => "Guest",
    }
}

println(get_name(nil))              # Guest
println(get_name({name: "Alice"}))  # Alice
```

## Truthiness

Suji has **no truthiness**. Only the value `true` is true, and non-boolean values
are never coerced:

- `true && expr` evaluates `expr`, which must itself be a boolean
- anything other than `true` on the left of `&&` behaves like `false` and
  short-circuits, without complaining about its type
- a non-boolean on the **right** of `&&`/`||` is a type error once it is reached:
  `true && 5` fails with *Logical AND requires boolean operands*, and
  `nil || "default"` fails with *Logical OR requires boolean operands*
- `!` always requires a boolean: `!nil` and `!5` are type errors

```suji
import std:println

# Only boolean `true` counts as true on the left:
println(true && true)       # true
println(5 && true)          # false
println("hello" && true)    # false

# Use comparisons so both sides are really booleans:
text = "hello"
println(text != "" && true) # true
```

Because `||` is strict about its right-hand side, the `value || fallback` idiom
from other languages does not exist in Suji. Use a `match` or, for maps,
`map::get(key, default)`:

```suji
import std:println

settings = {"retries": 3}

# NOT: settings:timeout || 30      (type error, and a missing key raises anyway)
timeout = settings::get("timeout", 30)
println(timeout)  # 30
```

### Converting to Boolean

```suji
import std:println

# Nil check
value = nil
is_present = value != nil
println(is_present)  # false

# Empty check
list = []
is_empty = list::length() == 0
println(is_empty)  # true

# Non-empty
text = "hello"
has_text = text::length() > 0
println(has_text)  # true
```

## Common Patterns

### Validation

```suji
import std:println

validate_user = |user| {
    has_name = user:name != nil && user:name::length() > 0
    has_email = user:email != nil && user:email ~ /^[^@]+@[^@]+$/
    is_adult = user:age != nil && user:age >= 18
    
    has_name && has_email && is_adult
}

user = {
    name: "Alice",
    email: "alice@example.com",
    age: 30
}

println(validate_user(user))  # true
```

Note that `user:name` raises *Key not found* if the key is absent, so
`user:name != nil` only guards against an explicit `nil` value. To tolerate
missing keys, read them with `user::get("name")`, which returns `nil` instead.

### Flags and Toggles

```suji
import std:println

# Feature flags
config = {
    dark_mode: true,
    notifications: false,
    beta_features: true
}

# Toggle a flag
config:dark_mode = !config:dark_mode
println(config:dark_mode)  # false (toggled)
```

### Conditional Assignment

```suji
import std:println

# Using match
status = true
message = match status {
    true => "Enabled",
    false => "Disabled",
}
println(message)  # Enabled

# Using ternary-style match (note the comma after the last arm)
is_admin = true
role = match { is_admin => "Administrator", _ => "User", }
println(role)  # Administrator
```

### Guard Clauses

```suji
import std:println

process_user = |user| {
    # Early returns for validation
    user == nil && return "Error: No user"
    !user:is_active && return "Error: User not active"
    user:age < 18 && return "Error: User must be adult"
    
    # Main logic here
    "User processed successfully"
}

println(process_user(nil))  # Error: No user
println(process_user({is_active: false, age: 25}))  # Error: User not active
```

## Boolean Methods

### Type Checking

```suji
import std:println

println(true::is_bool())     # true
println(false::is_bool())    # true
println(1::is_bool())        # false
println("true"::is_bool())   # false
```

### Conversion

```suji
import std:println

# To string
println(true::to_string())   # true
println(false::to_string())  # false

# Parse from string (simple example)
parse_bool = |s| {
    match s {
        "true" => true,
        "false" => false,
        _ => nil,
    }
}
println(parse_bool("true"))   # true
println(parse_bool("false"))  # false
```

## XOR (Exclusive OR)

XOR is true when operands differ:

```suji
import std:println

# Manual XOR
xor = |a, b| {
    (a || b) && !(a && b)
}

println(xor(true, true))       # false
println(xor(true, false))      # true
println(xor(false, true))      # true
println(xor(false, false))     # false

# Simpler: != for booleans
println(true != true)          # false
println(true != false)         # true
```

## Common Pitfalls

### Pitfall 1: Comparing with True/False

```suji
import std:println

is_valid = true

# Unnecessary comparison
println(match { is_valid == true => "yes", _ => "no", })   # yes

# Use the boolean directly
println(match { is_valid => "yes", _ => "no", })           # yes

# Unnecessary comparison
println(match { is_valid == false => "yes", _ => "no", })  # no

# Use negation
println(match { !is_valid => "yes", _ => "no", })          # no
```

### Pitfall 2: Confusing = and ==

```suji
import std:println

# Assignment, not comparison
x = 5
x = 10

# Comparison (use this in conditions)
println(match { x == 10 => "ten", _ => "something else", })  # ten
```

### Pitfall 3: Non-Boolean in Conditionals

```suji
import std:println

# A conditional match only takes an arm whose test is exactly `true`.
# Any other value simply fails to match:
text = "hello"
println(match { text => "matched", _ => "fell through", })       # fell through

# Explicit check
println(match { text != "" => "matched", _ => "fell through", }) # matched

# Numbers are not truthy either
count = 0
println(match { count => "matched", _ => "fell through", })      # fell through

# Explicit comparison
println(match { count == 0 => "matched", _ => "fell through", }) # matched
```

### Pitfall 4: Operator Precedence

```suji
import std:println

# `!` binds tighter than `&&`, so this is (!false) && true
result = !false && true
println(result)  # true

# If you meant to negate the whole conjunction, use parentheses
result = !(false && true)
println(result)  # true
```

## Examples

### All/Any for Lists

Lists have no built-in `any()` or `all()`, so write them yourself with a loop and
an early `return`:

```suji
import std:println

all = |list, predicate| {
    loop through list with item {
        !predicate(item) && return false
    }
    true
}

any = |list, predicate| {
    loop through list with item {
        predicate(item) && return true
    }
    false
}

numbers = [2, 4, 6, 8]

# All even?
all_even = all(numbers, |x| x % 2 == 0)
println(all_even)  # true

# Any odd?
any_odd = any(numbers, |x| x % 2 == 1)
println(any_odd)  # false
```

### Boolean Algebra

```suji
import std:println

# De Morgan's Laws
a = true
b = false

# !(a && b) == !a || !b
println(!(a && b) == (!a || !b))  # true

# !(a || b) == !a && !b
println(!(a || b) == (!a && !b))  # true
```

### State Machine

```suji
import std:println

# A map literal with bare identifier keys is parsed as a block when it is the
# whole body of a match arm, so quote the keys here.
traffic_light = |state| {
    match state {
        "red" => {"running": false, "warning": false},
        "yellow" => {"running": true, "warning": true},
        "green" => {"running": true, "warning": false},
        _ => {"running": false, "warning": false},
    }
}

state = traffic_light("yellow")
println("Running: ${state:running}")      # true
println("Warning: ${state:warning}")      # true
```

## Best Practices

### DO:
- Use boolean values directly in conditionals
- Use descriptive names (`is_active`, `has_permission`)
- Keep conditions simple and readable
- Use short-circuit evaluation for safety
- Prefer early returns for validation

### DON'T:
- Compare booleans to `true` or `false`
- Create complex nested conditions
- Use non-descriptive names (`flag`, `b`, `x`)
- Rely on implicit truthiness (Suji requires explicit booleans)

## Next Steps

- Learn about [Conditional Logic](../control-flow/conditionals.md)
- Explore [Pattern Matching](../control-flow/match.md) with booleans
- Study [Logical Operators](../operators/logical.md) in depth
- Check out [Relational Operators](../operators/relational.md)

## See Also

- [Conditional Logic](../control-flow/conditionals.md)
- [Match Expressions](../control-flow/match.md)
- [Logical Operators](../operators/logical.md)
- [Relational Operators](../operators/relational.md)
