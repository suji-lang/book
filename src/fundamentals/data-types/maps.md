# Maps

Maps are insertion-ordered key-value collections, perfect for structured data and JSON-like objects.

## Overview

Maps associate keys with values, providing fast lookups and flexible data structures.

### Key Characteristics

- **Key-value pairs** - Associate data with unique keys
- **Insertion-ordered** - `keys()`, `values()`, `to_list()` and `loop through`
  all visit entries in the order they were inserted
- **Keys are strings, numbers or booleans** - not lists, maps or nil
- **Nested access** - Convenient syntax for deep properties, and those chains are
  assignable
- **Missing keys raise** - `m:absent` is a runtime error, not `nil`; use
  `m::get(k, default)` or `m::contains(k)`
- **JSON-compatible** - Natural mapping to JSON objects

### When to Use Maps

Use maps for:
- Structured data (user profiles, configuration)
- JSON-like data structures
- Key-based lookups
- Dictionaries and associations
- Optional/sparse data

## Syntax

### Creating Maps

```suji
import std:println

# Empty map
empty = {}

# With initial data
user = {
    name: "Alice",
    age: 30,
    email: "alice@example.com"
}

# Nested maps
config = {
    database: {
        host: "localhost",
        port: 5432
    },
    features: {
        dark_mode: true,
        notifications: false
    }
}

println(empty)            # {}
println(user)             # {name: Alice, age: 30, email: alice@example.com}
println(config:database)  # {host: localhost, port: 5432}
```

Bare identifier keys (`name:`) and quoted keys (`"name":`) mean the same thing.
Bare keys are only recognised where a map is expected, though: as the entire body
of a match arm or a lambda, `{ name: "x" }` is parsed as a block and fails. Quote
the keys or wrap the literal in parentheses in those positions.

### Accessing Values

```suji
import std:println

user = {name: "Alice", age: 30}

# Colon notation (preferred)
println(user:name)    # Alice
println(user:age)     # 30

# Bracket notation
println(user["name"]) # Alice

# Nested access
config = {db: {host: "localhost"}}
println(config:db:host)  # localhost

# A missing key is a runtime error, not nil:
# println(user:phone)  # Error: Key not found: Key 'phone' not found in map
```

Use `::get()` (below) whenever a key might be absent — Suji has no way to recover
from the *Key not found* error once it happens.

### Setting Values

```suji
import std:println

user = {name: "Alice"}

# Add/update with direct assignment
user["age"] = 30
user["email"] = "alice@example.com"

println(user)
# {name: Alice, age: 30, email: alice@example.com}

# Multiple updates
user["age"] = 31
user["city"] = "Boston"
println(user)
# {name: Alice, age: 31, email: alice@example.com, city: Boston}

# Nested chains are assignable too
profile = {user: {name: "Alice"}}
profile:user:name = "Bob"
println(profile)  # {user: {name: Bob}}
```

There is no `map::set(key, value)` method — assignment is the only way to write a
key.

## Map Methods

### Get Value

```suji
import std:println

user = {name: "Alice", age: 30}

# Get with default
email = user::get("email", "no-email@example.com")
println(email)  # no-email@example.com

# Returns nil if not found and no default
phone = user::get("phone")
println(phone)  # nil
```

### Check if Key Exists

```suji
import std:println

user = {name: "Alice", age: 30}

println(user::contains("name"))    # true
println(user::contains("email"))   # false
```

The method is `contains()`, not `has()`.

### Keys and Values

```suji
import std:println

user = {name: "Alice", age: 30, city: "Boston"}

# Get all keys, in insertion order
keys = user::keys()
println(keys)  # [name, age, city]

# Get all values, in the same order
values = user::values()
println(values)  # [Alice, 30, Boston]

# Get key-value pairs as a list of tuples
entries = user::to_list()
println(entries)  # [(name, Alice), (age, 30), (city, Boston)]
```

`to_list()` is the pair-list accessor; there is no `entries()`. Remember that the
pairs are tuples, so unpack them by destructuring (`k, v = pair`) rather than
indexing — see [Tuples](tuples.md).

### Size

```suji
import std:println

user = {name: "Alice", age: 30}
println(user::length())  # 2

empty = {}
println(empty::length())  # 0
```

There is no `is_empty()`; compare `length()` with `0`.

### Remove Key

```suji
import std:println

user = {name: "Alice", age: 30, email: "alice@example.com"}

# Remove a key (mutates the map, returns true if the key was present)
println(user::delete("email"))  # true
println(user)  # {name: Alice, age: 30}
```

The method is `delete()`, not `remove()`.

### Merge Maps

```suji
import std:println

defaults = {theme: "light", lang: "en"}
user_prefs = {theme: "dark"}

# Merge (user_prefs overwrites defaults)
defaults::merge(user_prefs)
println(defaults)  # {theme: dark, lang: en}
```

`merge()` **mutates the receiver** and returns `nil`, so `merged = a::merge(b)`
would leave `merged` as `nil`. Merge into the map you want to end up with.

## Functional Operations

Maps have **no** `map()`, `filter()` or `each()` methods — those exist only on
lists. Iterate with `loop through m with k, v` and build a new map yourself.

### Map Values

Transform all values:

```suji
import std:println

prices = {apple: 1.00, banana: 0.50, cherry: 2.00}

# Double all prices (manual transformation)
doubled = {}
loop through prices with key, value {
    doubled[key] = value * 2
}
println(doubled)  # {apple: 2, banana: 1, cherry: 4}
```

Two bindings after `with` only work for maps: `loop through some_list with a, b`
is a runtime error.

### Filter

Keep only entries matching condition:

```suji
import std:println

users = {
    alice: {age: 30, active: true},
    bob: {age: 25, active: false},
    charlie: {age: 35, active: true}
}

# Only active users (manual filtering)
active = {}
loop through users with key, val {
    match { val:active => { active[key] = val } }
}
println(active)
# {alice: {age: 30, active: true}, charlie: {age: 35, active: true}}
```

A conditional `match` with no matching arm evaluates to `nil` and does nothing,
which is why the single-armed `match` above works as a filter.

## Common Patterns

### Default Values

```suji
import std:println

get_config = |key, default| {
    config = {timeout: 30, retries: 3}
    config::get(key, default)
}

println(get_config("timeout", 60))    # 30
println(get_config("max_size", 100))  # 100 (default)
```

### Nested Access with Safety

```suji
import std:println

safe_get = |m, path| {
    result = m
    loop through path with key {
        match {
            result::is_map() => { result = result::get(key) }
            _ => { result = nil }
        }
    }
    result
}

data = {user: {profile: {name: "Alice"}}}

# Safe deep access
name = safe_get(data, ["user", "profile", "name"])
println(name)  # Alice

# Returns nil for missing paths
missing = safe_get(data, ["user", "settings", "theme"])
println(missing)  # nil
```

### Building Maps

```suji
import std:println

# From lists of pairs
pairs = [["a", 1], ["b", 2], ["c", 3]]
map = {}
loop through pairs with pair {
    map[pair[0]] = pair[1]
}
println(map)  # {a: 1, b: 2, c: 3}


# From keys and values
keys = ["name", "age", "city"]
values = ["Alice", 30, "Boston"]
user = {}
limit = keys::length()
match { values::length() < limit => { limit = values::length() } }
loop through (0..limit) with i {
    user[keys[i]] = values[i]
}
println(user)  # {name: Alice, age: 30, city: Boston}
```

### Grouping

```suji
import std:println

users = [
    {name: "Alice", role: "admin"},
    {name: "Bob", role: "user"},
    {name: "Charlie", role: "admin"}
]

# Group by role
by_role = {}
loop through users with u {
    role = u:role
    group = by_role::get(role, [])
    group::push(u)
    by_role[role] = group
}
println(by_role)
# {admin: [{name: Alice, role: admin}, {name: Charlie, role: admin}], user: [{name: Bob, role: user}]}
```

`get(role, [])` gives a fresh default list, so the pattern above works even for
the first user in each group. Note that lists have no `group_by()` method — this
loop is the idiom.

## JSON Integration

Maps work naturally with JSON:

```suji
import std:json
import std:println

# Map to JSON (json:generate sorts the keys)
user = {name: "Alice", age: 30, active: true}
json_str = json:generate(user)
println(json_str)  # {"active":true,"age":30,"name":"Alice"}

# JSON to Map
data = json:parse("""
{
    "users": [
        {"name": "Alice", "age": 30},
        {"name": "Bob", "age": 25}
    ]
}
""")

# Access like a map
println(data:users[0]:name)  # Alice
```

## Common Pitfalls

### Pitfall 1: Missing Keys Raise an Error

This is the most common surprise for people coming from other languages: reading
an absent key does **not** give you `nil`, it terminates the program with
*Key not found*.

```suji
import std:println

user = {name: "Alice"}

# This would abort the script:
# age = user:age       # Error: Key not found: Key 'age' not found in map

# Use get() with a default
println(user::get("age", 0))  # 0

# get() with no default yields nil
println(user::get("age"))     # nil

# Or check first
age = match user::contains("age") {
    true => user:age,
    false => 0,
}
println(age)  # 0
```

### Pitfall 2: Key Types

```suji
import std:println

# Keys may be strings, numbers or booleans
map = {1: "one", 2: "two"}
println(map[1])    # one

# A number key and a string key are different keys
map["1"] = "string one"
println(map::length())  # 3

# Lists, maps and nil cannot be keys (Invalid key type)
```

Be consistent: mixing `1` and `"1"` in one map is legal and almost always a bug.

### Pitfall 3: Nested Updates

```suji
import std:println

user = {profile: {name: "Alice"}}

# Access chains are assignable, so you can update in place
user:profile:name = "Bob"
println(user)  # {profile: {name: Bob}}

# Bracket form works the same way
user["profile"]["name"] = "Carol"
println(user)  # {profile: {name: Carol}}
```

Every key along the chain must already exist, though — assigning through a
missing intermediate key raises *Key not found*.

### Pitfall 4: Iteration Order

Maps preserve insertion order, so iteration is deterministic — but insertion
order is rarely the order you want to *display*. Sort the keys when presentation
matters:

```suji
import std:println

map = {c: 3, a: 1, b: 2}

# Insertion order
println(map::keys())  # [c, a, b]

# Sorted order
loop through map::keys()::sort() with key {
    println("${key}: ${map[key]}")
}
# a: 1
# b: 2
# c: 3
```

Note that `json:generate()` sorts keys, so a round-trip through JSON does not
preserve insertion order.

## Performance Considerations

### Lookups are Fast

Map lookups are O(1) average case - very fast even for large maps:

```suji
import std:println

# Build a map with 1000 entries
large_map = {}
loop through 0..1000 with i {
    large_map[i] = i * i
}

# Lookup cost does not grow with the map
println(large_map[999])            # 998001
println(large_map::get(5000, nil)) # nil
```

### Choose Right Data Structure

```suji
import std:println

# Use a map for key-based lookup
user_by_id = {
    123: {name: "Alice"},
    456: {name: "Bob"}
}
println(user_by_id[456]:name)  # Bob

# A list needs a scan for the same question
users_list = [{id: 123, name: "Alice"}, {id: 456, name: "Bob"}]
found = users_list::filter(|u| u:id == 456)::first(nil)
println(found:name)  # Bob
```

## Examples

### Configuration Merging

```suji
import std:println

# merge() mutates `defaults`, so return it explicitly rather than the nil
# that merge() itself gives back.
merge_config = |defaults, user_config| {
    defaults::merge(user_config)
    defaults
}

defaults = {
    theme: "light",
    lang: "en",
    notifications: true,
    timeout: 30
}

user = {
    theme: "dark",
    lang: "es"
}

final = merge_config(defaults, user)
println(final)
# {theme: dark, lang: es, notifications: true, timeout: 30}
```

### Object Transformation

```suji
import std:println

# Transform user object. The keys are quoted because a map literal that is the
# whole body of a lambda would otherwise be read as a block.
transform_user = |user| {
    {
        "full_name": "${user:first_name} ${user:last_name}",
        "contact": user:email,
        "is_adult": user:age >= 18,
    }
}

user = {
    first_name: "Alice",
    last_name: "Smith",
    age: 30,
    email: "alice@example.com"
}

transformed = transform_user(user)
println(transformed)
# {full_name: Alice Smith, contact: alice@example.com, is_adult: true}
```

### Counting Occurrences

```suji
import std:println

count_occurrences = |items| {
    counts = {}
    loop through items with item {
        current = counts::get(item, 0)
        counts[item] = current + 1
    }
    counts
}

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
result = count_occurrences(words)
println(result)  # {apple: 3, banana: 2, cherry: 1}
```

### Index By Key

```suji
import std:println

index_by = |list, key| {
    result = {}
    loop through list with item {
        id = item[key]
        result[id] = item
    }
    result
}

users = [
    {id: 1, name: "Alice"},
    {id: 2, name: "Bob"},
    {id: 3, name: "Charlie"}
]

by_id = index_by(users, "id")
println(by_id[2])  # {id: 2, name: Bob}
```

## Methods That Do Not Exist

The complete map method set is `keys`, `values`, `to_list`, `get`, `contains`,
`delete`, `length`, `merge`, `to_string` (plus the `is_*` predicates).

| You might reach for | Use instead |
|---|---|
| `set(k, v)` | assignment `m[k] = v` |
| `has(k)` | `contains(k)` |
| `remove(k)` | `delete(k)` |
| `entries()` | `to_list()` |
| `is_empty()` | `m::length() == 0` |
| `each()` | `loop through m with k, v { … }` |
| `map()` / `filter()` | a loop that builds a new map |

## Best Practices

### DO:
- Use consistent key types (usually strings)
- Read possibly-absent keys with `get(key, default)` — direct access raises
- Use `contains(key)` before writing through a nested chain
- Use maps for structured data
- Leverage JSON integration

### DON'T:
- Assume a missing key gives you `nil`
- Expect `merge()` or `delete()` to return a new map — they mutate in place
- Rely on insertion order surviving a JSON round-trip
- Mix different conventions for key naming

## Next Steps

- Learn about [Tuples](tuples.md) for fixed-size collections
- Explore [JSON](../../stdlib/data-formats/json.md) for data serialization
- Study [Pattern Matching](../control-flow/match.md) with maps
- Check out [Data Transformation](../../cookbook/data-transformation.md) recipes

## See Also

- [Tuples](tuples.md)
- [Lists](lists.md)
- [JSON Module](../../stdlib/data-formats/json.md)
- [YAML Module](../../stdlib/data-formats/yaml.md)
