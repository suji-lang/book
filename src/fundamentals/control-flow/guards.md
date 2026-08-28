# Guard Clauses

Guard clauses use logical operators (`&&` and `||`) for early returns and short-circuit control flow.

## Overview

Guard clauses improve code readability by handling edge cases and validation upfront, avoiding deep nesting. Suji uses logical operators for short-circuit evaluation to enable early returns.

They matter more in Suji than in most languages, because there is **no error
handling construct at all** — no `try`, no `catch`, no `throw`, no `Result` type.
A runtime error prints a diagnostic and terminates the process with exit code 1,
and nothing can intercept it. The only way to survive a bad input is to check for
it *before* performing the operation that would fail.

Both operands of `&&` and `||` must be real booleans. There is no truthiness, so a
guard condition is always an explicit comparison such as `x == nil`,
`xs::length() == 0` or `m::contains("k")`.

## Basic Guard Clause

```suji
import std:println

process_user = |user| {
    # Guard: return early if nil
    user == nil && return "Error: No user provided"
    
    # Main logic
    "Processing ${user:name}"
}

println(process_user(nil))  # Error: No user provided
```

## Multiple Guards

Read possibly-missing map keys with `::get(key, default)`. A plain `order:items`
on a map without that key raises `Key not found` and ends the program, which
defeats the purpose of a guard:

```suji
import std:println

validate_order = |order| {
    # Guard 1: nil check
    order == nil && return "Order is required"

    # Guard 2: empty items
    order::get("items", [])::length() == 0 && return "Order must have items"

    # Guard 3: invalid total
    order::get("total", 0) <= 0 && return "Order total must be positive"

    # All guards passed - main logic
    "Order ${order::get("id", "?")} is valid"
}

println(validate_order(nil))                                     # Order is required
println(validate_order({items: []}))                             # Order must have items
println(validate_order({id: 7, items: ["book"], total: 0}))      # Order total must be positive
println(validate_order({id: 7, items: ["book"], total: 12.50}))  # Order 7 is valid
```

## Guard Pattern Explained

Instead of nested conditions, use guard clauses for flat, readable code:

```suji
import std:println

# Guards (clear and flat)
process = |user| {
    # Guard clauses - return early on failure
    user == nil && return "No user"
    user::get("is_active", false) == false && return "User inactive"
    user::get("permissions", [])::contains("edit") == false && return "No permission"

    # Main logic (not nested)
    "Success"
}

println(process(nil))                                            # No user
println(process({is_active: false}))                             # User inactive
println(process({is_active: true, permissions: ["read"]}))       # No permission
println(process({is_active: true, permissions: ["read", "edit"]}))  # Success
```

## Guards in Loops

```suji
import std:println

items = [
    {name: "a", valid: true},
    {name: "b", valid: false},
    {name: "c", valid: true},
]

loop through items with item {
    # Skip invalid items
    item:valid == false && continue

    # Process valid item
    println("processing ${item:name}")
}
```

`break` and `continue` also work with a label on an enclosing `loop as name { … }`,
so a guard deep inside nested loops can abandon the outer one.

## Logical Operators for Guards

### Short-Circuit AND (`&&`)

Use `&&` to return early when condition is true:

```suji
import std:println

# Return early if condition is true
validate = |x| {
    x == nil && return "nil"
    x < 0 && return "negative"
    "valid: ${x}"
}

println(validate(5))   # valid: 5
println(validate(-1))  # negative
println(validate(nil)) # nil
```

### Short-Circuit OR (`||`)

Use `||` to return early when condition is false:

```suji
import std:println

# Return early if condition is false
process = |x| {
    x != nil || return "nil required"
    x > 0 || return "must be positive"
    "processing ${x}"
}

println(process(5))   # processing 5
println(process(0))   # must be positive
println(process(nil)) # nil required
```

### Watch the Precedence

`&&` binds tighter than `||`, so an alternative-condition guard needs parentheses.
Written without them, `i < 0 || i >= xs::length() && return nil` groups as
`i < 0 || (i >= … && return nil)` and never returns when `i` is negative:

```suji
import std:println

at = |xs, i| {
    (i < 0 || i >= xs::length()) && return nil
    xs[i]
}

println(at([1, 2, 3], 1))  # 2
println(at([1, 2, 3], 7))  # nil
```

## Guarding Against Runtime Errors

These are the operations that terminate a program, and the check that prevents
each one.

```suji
import std:println

# Division by zero: test the divisor
safe_divide = |a, b| {
    b == 0 && return nil
    a / b
}

println(safe_divide(10, 2))  # 5
println(safe_divide(10, 0))  # nil

# Missing map key: ::get with a default, or ::contains to test
config = {host: "localhost"}
println(config::get("port", 8080))  # 8080
println(config::contains("port"))   # false

# Empty collection: check length before averaging
scores = []
println(match { scores::length() == 0 => "no scores", _ => scores::average(), })  # no scores

# Unparseable number: validate with a regex before converting
to_number_or = |text, default| {
    !(text ~ /^-?\d+(\.\d+)?$/) && return default
    text::to_number()
}

println(to_number_or("42", 0))   # 42
println(to_number_or("abc", 0))  # 0
```

Index access is the same idea: `xs[5]` on a two-element list raises
`Index out of bounds`, so compare against `xs::length()` first, as in the
precedence example above.

### Default Values Pattern

There is no `x || default` idiom — `||` requires booleans, so `nil || "Guest"` is a
type error. Use `::get` on maps, or a `match` when the value is already in hand:

```suji
import std:println

get_name = |user| {
    preferred = user::get("preferred_name", nil)
    preferred != nil && return preferred

    user::get("first_name", "Guest")
}

user1 = {preferred_name: "Alice"}
user2 = {first_name: "Bob"}
user3 = {}

println(get_name(user1))  # Alice
println(get_name(user2))  # Bob
println(get_name(user3))  # Guest
```

## Common Patterns

### Validation Function

Because a failure cannot be raised, report it as a value. A `(ok, error)` tuple is
the usual shape; `return a, b` returns a tuple and `a, b = f()` destructures it:

```suji
import std:println

validate_user = |user| {
    user::get("name", "")::length() == 0 && return false, "Name is required"
    !(user::get("email", "") ~ /^[^@]+@[^@]+$/) && return false, "Valid email is required"
    user::get("age", 0) < 18 && return false, "Must be 18 or older"

    return true, nil
}

valid, error = validate_user({name: "Alice", email: "alice@example.com", age: 30})
match {
    error == nil => println("Valid"),
    _ => println("Error: ${error}"),
}

valid2, error2 = validate_user({name: "Bob", email: "nope", age: 30})
println("${valid2}: ${error2}")  # false: Valid email is required
```

### Resource Access

```suji
import std:println

can_access = |user, resource| {
    # Guard: no user
    user == nil && return false

    # Guard: inactive user
    user::get("is_active", false) == false && return false

    # Guard: no resource
    resource == nil && return false

    # Check permissions
    user::get("permissions", [])::contains(resource::get("type", ""))
}

alice = {is_active: true, permissions: ["report"]}

println(can_access(nil, nil))                     # false
println(can_access(alice, {type: "invoice"}))     # false
println(can_access(alice, {type: "report"}))      # true
```

### Data Processing

```suji
import std:println

process_data = |data| {
    # Guard: nil
    data == nil && return []

    # Guard: wrong type
    data::is_list() == false && return []

    # Guard: empty
    data::length() == 0 && return []

    # Process valid data
    data::filter(|n| n > 0)::map(|n| n * 10)
}

println(process_data(nil))              # []
println(process_data("not a list"))     # []
println(process_data([1, -2, 3]))       # [10, 30]
```

### Command Handler

```suji
import std:println

known = ["start", "stop", "status"]

handle_command = |cmd, user| {
    # Guard: no command
    cmd == nil && return "Command required"
    cmd::length() == 0 && return "Command required"

    # Guard: unauthorized
    user == nil && return "Not authenticated"
    user::get("is_authenticated", false) == false && return "Not authenticated"

    # Guard: unknown command
    known::contains(cmd) == false && return "Unknown command: ${cmd}"

    "Running ${cmd}"
}

session = {is_authenticated: true}

println(handle_command("", session))         # Command required
println(handle_command("start", nil))        # Not authenticated
println(handle_command("deploy", session))   # Unknown command: deploy
println(handle_command("start", session))    # Running start
```

## Guards vs Match

Use guards for early returns, match for branching:

```suji
import std:println

# Guards for validation
process = |x| {
    x == nil && return "nil"
    x < 0 && return "negative"
    
    # Match for branching logic
    match {
        x > 100 => "very large",
        x > 10 => "large",
        _ => "small",
    }
}

println(process(nil))  # nil
println(process(-1))   # negative
println(process(500))  # very large
```

## Guards Instead of Exceptions

Suji has no exceptions to catch, so validation has to happen up front and failures
travel back as ordinary return values:

```suji
import std:println

safe_divide = |a, b| {
    b == 0 && return nil, "Division by zero"
    return a / b, nil
}

result, error = safe_divide(10, 0)
match {
    error == nil => println("Result: ${result}"),
    _ => println("Error: ${error}"),
}

result2, error2 = safe_divide(10, 2)
println("${result2} ${error2}")  # 5 nil
```

Note what is *not* possible: you cannot write `a / b` first and recover
afterwards. Once `Division by zero` is raised the process is gone.

## Best Practices

### DO:
- Put guards at the start of functions
- Return early on failure cases
- Check for nil before accessing properties
- Prefer `m::get(k, default)` and `m::contains(k)` over a direct `m:k` that can raise
- Use guards to avoid deep nesting
- Make error messages descriptive
- Use `&& return` for positive conditions (return if true)
- Use `|| return` for negative conditions (return if false)
- Parenthesize mixed `&&`/`||` conditions

### DON'T:
- Put guards after main logic
- Expect to recover from a runtime error — there is no `try`/`catch`
- Rely on truthiness; compare explicitly (`x == nil`, `flag == false`)
- Use `x || "default"` as a defaulting idiom — it is a type error
- Create overly defensive guards
- Use guards for normal branching logic (use match instead)
- Forget to return from guards
- Have guards with complex conditions (extract to variables)
- Mix guard patterns inconsistently

## When to Use Guards

### Use Guards For:
- Input validation
- Nil checks
- Permission checks
- Precondition verification
- Preventing operations that would raise (division by zero, missing keys, out-of-range indices)
- Early returns

### Don't Use Guards For:
- Normal branching logic (use `match` instead)
- Complex decision trees (use `match` instead)
- Multiple related conditions (use conditional `match`)

## Examples

### API Handler

Map literals with bare identifier keys are only recognised where a map is
expected, so quote the keys when a map is the whole body of a `return`:

```suji
import std:println

handle_request = |request| {
    # Validate request with guards
    request == nil && return {"status": 400, "error": "No request"}
    !(request::get("method", "") ~ /^(GET|POST|PUT|DELETE)$/) && return {"status": 405, "error": "Invalid method"}
    request::contains("path") == false && return {"status": 400, "error": "Path required"}

    # Process request
    {"status": 200, "path": request:path}
}

println(handle_request(nil))                            # {status: 400, error: No request}
println(handle_request({method: "TRACE", path: "/"}))   # {status: 405, error: Invalid method}
println(handle_request({method: "GET"}))                # {status: 400, error: Path required}
println(handle_request({method: "GET", path: "/ok"}))   # {status: 200, path: /ok}
```

### Form Validation

Collect every problem instead of returning on the first one:

```suji
import std:println

validate_form = |form| {
    errors = []

    username = form::get("username", "")
    match { username::length() < 3 => { errors::push("Username too short") } }

    password = form::get("password", "")
    match { password::length() < 8 => { errors::push("Password too short") } }

    email = form::get("email", "")
    match { !(email ~ /^[^@]+@[^@]+$/) => { errors::push("Invalid email") } }

    errors
}

println(validate_form({username: "al", password: "secret", email: "nope"}))
println(validate_form({username: "alice", password: "supersecret", email: "alice@example.com"}))
```

## See Also

- [Match Expressions](match.md) - Pattern matching for branching logic
- [Logical Operators](../operators/logical.md) - Understanding `&&` and `||`
- [Loops](loops.md) - Using guards in loops
- [Functions](../../functions/) - Guard clauses in functions
