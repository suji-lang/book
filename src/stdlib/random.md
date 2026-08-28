# Random Numbers (`std:random`)

Random numbers, selections, shuffling, and random string generation.

## Overview

`std:random` exports:

| Function | Returns | Description |
|---|---|---|
| `random()` | Number | A value in \([0, 1)\) |
| `seed(value = nil)` | nil | Seed the generator; `nil` reseeds from the system |
| `integer(a, b)` | Number | An integer in \([a, b)\) |
| `pick(xs)` | Any | One element of `xs` |
| `shuffle(xs)` | List | A new list with the elements reordered |
| `sample(xs, k)` | List | Up to `k` distinct elements of `xs` |
| `string(allowed_chars, length)` | String | Characters drawn from `allowed_chars` |
| `hex_string(length = 16)` | String | Lowercase hex characters |
| `alpha_string(length = 16, capitals = true)` | String | Letters |
| `numeric_string(length = 16)` | String | Digits |
| `alphanumeric_string(length = 16, capitals = true)` | String | Letters and digits |

There is no `random:int` and no `random:float` — the names are `integer` and
`random`.

This is a general-purpose generator, not a cryptographically secure one. Do not
use it for keys, tokens or passwords.

## Quick Start

```suji
import std:random
import std:println

value = random:random()
println(value >= 0 && value < 1)  # true

roll = random:integer(1, 7)       # 1 through 6
println(roll >= 1 && roll < 7)    # true

println(random:pick(["rock", "paper", "scissors"])::is_string())  # true
println(random:hex_string(8)::length())  # 8
```

## `random()`

A number in \([0, 1)\).

```suji
import std:random
import std:println

random:seed(7)
println(random:random())  # 0.030317360865101395
```

## `seed(value = nil)`

Seeding makes a run reproducible, which is what makes the examples on this page
verifiable. Calling `seed()` with no argument reseeds from the system, restoring
unpredictable output.

```suji
import std:random
import std:println

random:seed(7)
first = random:random()

random:seed(7)
second = random:random()

println(first == second)  # true
```

## `integer(a, b)`

An integer in the half-open range \([a, b)\) — `b` is never returned. Use
`integer(1, 7)` for a six-sided die.

```suji
import std:random
import std:println

random:seed(7)
rolls = []
loop through 0..5 with i {
    rolls::push(random:integer(1, 7))
}

println(rolls)  # [1, 2, 1, 4, 2]
```

## `pick(xs)`

Returns one element of a list. An empty list raises
`Index out of bounds: Index 0 out of bounds for length 0`, so check the length
first.

```suji
import std:random
import std:println

random:seed(7)
choices = ["rock", "paper", "scissors"]

pick_safe = |xs| match {
    xs::length() == 0 => nil,
    _ => random:pick(xs),
}

println(pick_safe(choices))  # rock
println(pick_safe([]) == nil)  # true
```

## `shuffle(xs)`

Returns a **new** list with the elements reordered; the argument is left
untouched.

```suji
import std:random
import std:println

random:seed(7)
original = [1, 2, 3, 4, 5]
shuffled = random:shuffle(original)

println(shuffled)  # [3, 5, 4, 1, 2]
println(original)  # [1, 2, 3, 4, 5]
```

## `sample(xs, k)`

Returns up to `k` **distinct** elements, chosen without replacement. Asking for
more than the list holds returns everything, in the original order.

```suji
import std:random
import std:println

random:seed(1)
println(random:sample([1, 2, 3, 4, 5], 3))  # [5, 4, 3]
println(random:sample([1, 2, 3], 10))       # [1, 2, 3]
```

## Random Strings

`string(allowed_chars, length)` draws from a character set you supply; the other
four helpers use fixed alphabets and default to a length of 16.

```suji
import std:random
import std:println

random:seed(7)
println(random:string("ACGT", 12))  # ACAGCTACAGGA
```

```suji
import std:random
import std:println

random:seed(7)
println(random:hex_string(8))            # 04284f24
println(random:alpha_string(10))         # GlhBETgtud
println(random:numeric_string(6))        # 564347
println(random:alphanumeric_string(12))  # OQ43B5Zc7TiA
```

`capitals = false` restricts `alpha_string` and `alphanumeric_string` to
lowercase:

```suji
import std:random
import std:println

random:seed(7)
println(random:alpha_string(10, false))         # ahdohyegds
println(random:alphanumeric_string(12, false))  # wadnw56usxon
```

Defaults produce 16 characters:

```suji
import std:random
import std:println

println(random:hex_string()::length())           # 16
println(random:alpha_string()::length())         # 16
println(random:numeric_string()::length())       # 16
println(random:alphanumeric_string()::length())  # 16
```

## Examples

### Weighted Choice

```suji
import std:random
import std:println

random:seed(7)

weighted = |options| {
    total = options::fold(0, |acc, o| acc + o:weight)
    target = random:random() * total
    running = 0
    chosen = nil
    loop through options with o {
        running += o:weight
        match {
            chosen == nil && running > target => { chosen = o:name }
        }
    }
    chosen
}

options = [
    {"name": "common", "weight": 80},
    {"name": "rare", "weight": 19},
    {"name": "legendary", "weight": 1},
]

println(weighted(options))  # common
```

### Random Test Data

```suji
import std:random
import std:println

random:seed(7)

make_user = || {
    {
        "id": random:hex_string(8),
        "name": random:alpha_string(6),
        "age": random:integer(18, 65),
    }
}

users = []
loop through 0..3 with i {
    users::push(make_user())
}

println(users::length())              # 3
println(users[0]:id::length())        # 8
println(users[0]:age >= 18)           # true
```

### Sampling Rows

```suji
import std:random
import std:println

random:seed(7)
rows = 1..=100
sampled = random:sample(rows, 5)

println(sampled::length())  # 5
println(sampled::sort())    # [4, 15, 28, 31, 55]
```

## Gotchas

- `integer(a, b)` excludes `b`.
- `pick` on an empty list is a runtime error rather than `nil`.
- `shuffle` returns a new list, so `random:shuffle(xs)` alone does nothing
  visible — assign the result.
- Seeded sequences depend on the order of every call to the module, so inserting
  an extra call changes everything after it.
- Not suitable for security; use it for simulation, sampling and test data.

## See Also

- [UUID](uuid.md)
- [Cryptography](crypto.md)
- [Mathematics](math.md)
- [Lists](../fundamentals/data-types/lists.md)
