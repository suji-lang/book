# Nil

`nil` represents the absence of a value.

It is its own type with a single value. `println(nil)` prints `nil`, and it
interpolates as `nil` inside a string. The only methods it has are `to_string()`
and the `is_*` type predicates — and note that **there is no `is_nil()`**, so test
for nil with `== nil`.

## Checking for nil

Use equality and conditional match / guards:

```suji
import std:println

value = nil

match { value == nil => { println("Value is nil") } }
match { value != nil => { println("Value exists") } }
# Value is nil
```

`nil` is not "falsy": `!nil` is a type error (*Cannot apply logical NOT to nil*),
and `nil || "default"` is a type error too. Comparing is the only test.

## Returning nil for “not found”

Because there is no exception mechanism, returning `nil` is the normal way to say
"nothing here":

```suji
import std:println

# The keys are quoted: a map literal that is the whole body of a match arm would
# otherwise be parsed as a block.
get_user = |id| match id {
    1 => {"name": "Alice", "age": 30},
    2 => {"name": "Bob", "age": 25},
    _ => nil,
}

user = get_user(1)
match { user != nil => println("Found: ${user:name}"), _ => println("User not found"), }
# Found: Alice

user = get_user(9)
match { user != nil => println("Found: ${user:name}"), _ => println("User not found"), }
# User not found
```

A `match` that has no matching arm also evaluates to `nil`, so an incomplete
`match` yields `nil` rather than raising.

## Nil in collections

### Lists

```suji
import std:println

items = [1, nil, 3, nil, 5]
non_nil = items::filter(|x| x != nil)
println(non_nil)  # [1, 3, 5]
```

### Maps

A **missing key does not read as `nil`** — it raises *Key not found* and
terminates the program. Use `::get()` when the key may be absent:

```suji
import std:println

user = {name: "Alice", age: 30}

# This would abort the script:
# email = user:email   # Error: Key not found: Key 'email' not found in map

email = user::get("email")
println(email)  # nil

match { email != nil => println("Email: ${email}"), _ => println("No email provided"), }
# No email provided
```

`get()` accepts a default as its second argument, which is usually clearer than
checking for `nil` afterwards:

```suji
import std:println

user = {name: "Alice"}
println(user::get("email", "none"))  # none
```

Note that a key whose stored value really is `nil` is indistinguishable from a
missing key when you use `get()` with no default — use `::contains()` if that
distinction matters.

## Default values

Use `match` for defaults. There is no `||` fallback idiom, because `||` requires
boolean operands:

```suji
import std:println

title = nil
title = match { title != nil => title, _ => "Mr./Ms.", }
println(title)  # Mr./Ms.
```

## See Also

- [Booleans](booleans.md)
- [Maps](maps.md)
- [Match Expressions](../control-flow/match.md)
- [Error Handling](../../advanced/error-handling.md)
