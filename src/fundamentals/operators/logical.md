# Logical Operators

Logical operators combine boolean expressions and short-circuit.

Suji does **not** have general truthiness: only `true` counts as true in boolean
contexts. The operators are `&&`, `||` and `!` — the words `and`, `or` and `not` are
not keywords in Suji and using them produces an `Undefined variable` error.

Crucially, `&&` and `||` always evaluate to a **boolean**, never to one of their
operands. That means the `x || "default"` idiom from other languages does not exist
here: `nil || "default"` fails with
`Type error: Logical OR requires boolean operands`. See
[Default Values](#default-values) below for what to write instead.

## Overview

Logical operators are essential for building complex conditions in match expressions, loops, and filters.

## The Three Logical Operators

### AND (`&&`)

Returns `true` only if both operands are `true`:

```suji
import std:println

println(true && true)    # true
println(true && false)   # false
println(false && true)   # false
println(false && false)  # false
```

### OR (`||`)

Returns `true` if at least one operand is `true`:

```suji
import std:println

println(true || true)    # true
println(true || false)   # true
println(false || true)   # true
println(false || false)  # false
```

### NOT (`!`)

Negates a boolean value:

```suji
import std:println

println(!true)           # false
println(!false)          # true
println(!!true)          # true (double negation)
```

## Short-Circuit Evaluation

Logical operators use short-circuit evaluation for efficiency and safety.

### AND Short-Circuit

If the left side is `false`, the right side is NOT evaluated:

```suji
import std:println

# Right side never evaluated (no error!)
result = false && (10 / 0)
println(result)  # false

# This is useful for safe operations
user = nil
is_admin = user != nil && user:is_admin == true
println(is_admin)  # false - no error accessing nil, because user != nil is false
```

### OR Short-Circuit

If the left side is `true`, the right side is NOT evaluated:

```suji
import std:println

# Right side never evaluated
result = true || (10 / 0)
println(result)  # true

# `||` short-circuits on boolean `true`, and its result is always a boolean.
#
# If you want a default when a value may be `nil`, use `match`:
maybe_timeout_ms = nil
timeout_ms = match maybe_timeout_ms {
    nil => 1000,
    _ => maybe_timeout_ms,
}
println(timeout_ms)  # 1000
```

Note the `_` arm rather than a binding: patterns cannot bind variables in Suji, and a
bare identifier in a pattern is treated as a string literal.

## Combining Conditions

### Multiple AND

All conditions must be true:

```suji
import std:println

age = 25
has_license = true
has_insurance = true

can_drive = age >= 18 && has_license && has_insurance
println(can_drive)  # true
```

### Multiple OR

At least one condition must be true:

```suji
import std:println

day = "Sunday"
is_national_holiday = false
is_regional_holiday = false

is_weekend = day == "Saturday" || day == "Sunday"
is_holiday = is_national_holiday || is_regional_holiday

day_off = is_weekend || is_holiday
println(day_off)  # true
```

### Mixed AND/OR

```suji
import std:println

# Must be adult AND (have license OR have permit)
age = 17
has_license = false
has_permit = true

can_drive = age >= 18 && (has_license || has_permit)
println(can_drive)  # false (not adult)

age = 18
can_drive = age >= 18 && (has_license || has_permit)
println(can_drive)  # true (adult with permit)
```

## Operator Precedence

Lowest to highest:

1. **OR (`||`)** - lowest
2. **AND (`&&`)**
3. **NOT (`!`)** - highest (it sits with the other unary operators, above `*`/`/` and
   below `^`)

All three bind *less* tightly than the comparison and regex operators, so
`a == b && c > d` groups the way you would expect without parentheses.

```suji
import std:println

# NOT first, then AND, then OR
result = true || false && !false
# Parsed as: true || (false && (!false))
println(result)  # true

# Use parentheses for clarity
result = (true || false) && (!false)
println(result)  # true
```

## Common Patterns

### Validation

Reading a **missing** map key raises `Key not found`, so `user:name != nil` is only
safe when the key is known to exist. Use `::get(key, default)` to read defensively:

```suji
import std:println

validate_user = |user| {
    name = user::get("name", "")
    email = user::get("email", "")
    age = user::get("age", 0)

    has_name = name::length() > 0
    has_email = email ~ /^[^@]+@[^@]+$/
    is_adult = age >= 18

    has_name && has_email && is_adult
}

println(validate_user({name: "Alice", email: "alice@example.com", age: 30}))  # true
println(validate_user({name: "Bob"}))                                        # false
```

### Range Checking

```suji
import std:println

in_range = |value, min_val, max_val| {
    value >= min_val && value <= max_val
}

println(in_range(5, 0, 10))   # true
println(in_range(15, 0, 10))  # false
```

### Default Values

There is no `||` fallback and no `??` operator. Use `map::get(key, default)` for maps,
and `match` for anything else:

```suji
import std:println

get_name = |user| {
    preferred = user::get("preferred_name", nil)
    first = user::get("first_name", nil)

    match {
        preferred != nil => preferred,
        first != nil => first,
        _ => "Anonymous",
    }
}

println(get_name({preferred_name: "Ada"}))  # Ada
println(get_name({first_name: "Grace"}))    # Grace
println(get_name({}))                       # Anonymous
```

Or, when a single default suffices, let `get` do the work:

```suji
import std:println

user = {}
println(user::get("first_name", "Anonymous"))  # Anonymous
```

### Guard Clauses

```suji
import std:println

process_user = |user| {
    # Early returns with logical checks (guard clauses)
    invalid = user == nil || !user::get("is_active", false)
    invalid && return "Invalid user"

    unauthorized = user::get("age", 0) < 18 || !user::get("has_consent", false)
    unauthorized && return "Unauthorized"

    "Processing user..."
}

println(process_user(nil))                                            # Invalid user
println(process_user({is_active: true, age: 12}))                     # Unauthorized
println(process_user({is_active: true, age: 30, has_consent: true}))  # Processing user...
```

### Access Control

```suji
import std:println

can_edit = |user, document| {
    is_owner = user:id == document:owner_id
    is_admin = user:role == "admin"
    is_collaborator = document:collaborators::contains(user:id)

    is_owner || is_admin || is_collaborator
}

alice = {id: 1, role: "member"}
doc = {owner_id: 2, collaborators: [1, 5]}
println(can_edit(alice, doc))  # true (collaborator)
```

## De Morgan's Laws

Useful equivalences for simplifying logical expressions:

### NOT (A AND B) = (NOT A) OR (NOT B)

```suji
import std:println

a = true
b = false

# These are equivalent:
result1 = !(a && b)
result2 = !a || !b

println(result1 == result2)  # true
```

### NOT (A OR B) = (NOT A) AND (NOT B)

```suji
import std:println

a = true
b = false

# These are equivalent:
result1 = !(a || b)
result2 = !a && !b

println(result1 == result2)  # true
```

## Truth Tables

### AND (`&&`)

| A | B | A && B |
|---|---|--------|
| T | T | T |
| T | F | F |
| F | T | F |
| F | F | F |

### OR (`||`)

| A | B | A \|\| B |
|---|---|----------|
| T | T | T |
| T | F | T |
| F | T | T |
| F | F | F |

### NOT (`!`)

| A | !A |
|---|----|
| T | F |
| F | T |

## Common Pitfalls

### Pitfall 1: Confusing `&&` with `,`

```suji
import std:println

age = 20
has_license = true

# Wrong - this is a tuple of two booleans, not a logical AND
conditions = (age >= 18, has_license)
println(conditions)  # (true, true)

# Correct - logical AND
can_drive = age >= 18 && has_license
println(can_drive)  # true
```

### Pitfall 2: Unnecessary Comparisons

```suji
is_valid = true

# Redundant comparison
match is_valid == true {
    true => {
        # ...
    },
    false => {},
}

# Use directly
match is_valid {
    true => {
        # ...
    },
    false => {},
}
```

### Pitfall 3: Incorrect Negation

```suji
is_valid = true

# Wrong (redundant comparison)
match is_valid == false {
    true => {
        # ...
    },
    false => {},
}

# Correct (use negation)
match !is_valid {
    true => {
        # ...
    },
    false => {},
}
```

### Pitfall 4: Complex Conditions Without Parentheses

```suji
import std:println

a = true
b = false
c = true
d = true
e = false

# Hard to read
match (a && b) || (c && d) || e {
    true => println("matched"),
    false => {},
}

# Clear with parentheses (same as above, but explicit)
match ((a && b) || (c && d) || e) {
    true => println("matched"),
    false => {},
}
```

### Pitfall 5: Side Effects in Conditions

```suji
import std:println

# Don't rely on side effects: with short-circuiting, whether the right-hand side
# runs at all depends on the left-hand side.

# Separate side effects from conditions
counter = 0
limit = 5

counter++
match counter <= limit {
    true => println("within limit"),
    false => {},
}
```

## Best Practices

### DO:
- Use parentheses for complex conditions
- Leverage short-circuit evaluation for safety
- Keep conditions simple and readable
- Use meaningful boolean variable names
- Extract complex logic into named variables

### DON'T:
- Compare booleans to `true`/`false`
- Create deeply nested logical expressions
- Put side effects in conditional expressions
- Forget operator precedence
- Mix too many conditions without structure

## Examples

### Permission System

```suji
import std:println

has_permission = |user, resource, action| {
    # Admin can do anything
    user:role == "admin" && return true
    
    # Owner can do anything with their resource
    resource:owner_id == user:id && return true
    
    # Check specific permissions
    permission_key = "${resource:type}:${action}"
    user:permissions::contains(permission_key)
}

editor = {role: "editor", id: 7, permissions: ["post:read", "post:write"]}
post = {type: "post", owner_id: 99}

println(has_permission(editor, post, "write"))   # true
println(has_permission(editor, post, "delete"))  # false
```

### Input Validation

```suji
import std:println

validate_password = |password| {
    long_enough = password::length() >= 8
    has_upper = password ~ /[A-Z]/
    has_lower = password ~ /[a-z]/
    has_digit = password ~ /[0-9]/
    has_special = password ~ /[!@#$%^&*]/
    
    # All conditions must be true
    long_enough && has_upper && has_lower && has_digit && has_special
}

println(validate_password("Passw0rd!"))  # true
println(validate_password("password"))   # false
```

### Feature Flags

```suji
import std:println

global_features = {dark_mode: true, beta_search: false}

is_feature_enabled = |feature_name, user| {
    # Check global flag, defaulting to off
    global_enabled = global_features::get(feature_name, false)

    # Check user-specific override
    user_enabled = user:feature_flags::get(feature_name, nil)

    # User override takes precedence
    match user_enabled {
        nil => global_enabled,
        _ => user_enabled,
    }
}

user = {feature_flags: {beta_search: true}}

println(is_feature_enabled("dark_mode", user))    # true (global)
println(is_feature_enabled("beta_search", user))  # true (user override)
println(is_feature_enabled("unknown", user))      # false (default)
```

### Eligibility Check

```suji
import std:println

is_eligible_for_loan = |applicant| {
    # Must meet all criteria
    age_ok = applicant:age >= 21 && applicant:age <= 65
    income_ok = applicant:annual_income >= 30000
    credit_ok = applicant:credit_score >= 650
    employed = applicant:employment_status == "employed"
    
    # No disqualifying factors
    no_bankruptcy = !applicant:has_bankruptcy
    no_defaults = !applicant:has_loan_defaults
    
    # All positive criteria AND no negative factors
    age_ok && income_ok && credit_ok && employed && no_bankruptcy && no_defaults
}

applicant = {
    age: 34,
    annual_income: 52000,
    credit_score: 710,
    employment_status: "employed",
    has_bankruptcy: false,
    has_loan_defaults: false,
}

println(is_eligible_for_loan(applicant))  # true
```

## Next Steps

- Learn about [Relational Operators](relational.md) to create conditions
- Explore [Conditional Logic](../control-flow/conditionals.md)
- Study [Boolean Data Type](../data-types/booleans.md)
- Check out [Pattern Matching](../control-flow/match.md)

## See Also

- [Booleans](../data-types/booleans.md)
- [Relational Operators](relational.md)
- [Conditional Logic](../control-flow/conditionals.md)
- [Match Expressions](../control-flow/match.md)
