# UUID (`std:uuid`)

Generate and validate UUID strings.

## Overview

`std:uuid` exports three functions:

| Function | Returns | Description |
|---|---|---|
| `v4()` | String | A random UUID |
| `v5(namespace, name)` | String | A deterministic UUID derived from a namespace and a name |
| `is_valid(text)` | Boolean | Whether `text` looks like a UUID |

UUIDs are plain lowercase strings of 36 characters — 32 hex digits and 4 hyphens.
Only versions 4 and 5 are available; there is no v1, v3, v6 or v7, and no
function to inspect a UUID's version.

## Quick Start

```suji
import std:uuid
import std:println

id = uuid:v4()
println(id::length())        # 36
println(uuid:is_valid(id))   # true
```

## `v4()`

Generates a random UUID. Two calls essentially never collide, so it is the right
choice for record ids and correlation ids.

```suji
import std:uuid
import std:println

a = uuid:v4()
b = uuid:v4()

println(a != b)                     # true
println(a::split("-")::length())    # 5
```

`v4` draws on the same general-purpose randomness as [`std:random`](random.md),
so treat the values as unique but not secret.

## `v5(namespace, name)`

Derives a UUID by hashing a namespace UUID together with a name. The same inputs
always produce the same output, which makes it useful for stable ids computed
from data you already have.

- `namespace` (String) — a valid UUID
- `name` (String) — any application-defined string

```suji
import std:uuid
import std:println

ns = "550e8400-e29b-41d4-a716-446655440000"

id = uuid:v5(ns, "my-resource-name")
println(id)  # fcd6217c-e6c0-57a2-a5ba-53789713bce1

println(uuid:v5(ns, "my-resource-name") == id)  # true
println(uuid:v5(ns, "other-resource") == id)    # false
```

An invalid namespace raises `Invalid operation: invalid namespace uuid` and
terminates the program, so keep the namespace a literal or a validated value:

```suji
import std:uuid
import std:println

ns = "550e8400-e29b-41d4-a716-446655440000"
println(uuid:is_valid(ns))  # true

stable_id = |namespace, name| match {
    uuid:is_valid(namespace) => uuid:v5(namespace, name),
    _ => nil,
}

println(stable_id("nope", "x") == nil)         # true
println(stable_id(ns, "x")::length())          # 36
```

## `is_valid(text)`

Checks whether a string has UUID shape. Hyphens are optional and hex digits may
be upper or lower case.

```suji
import std:uuid
import std:println

println(uuid:is_valid("550e8400-e29b-41d4-a716-446655440000"))  # true
println(uuid:is_valid("550e8400e29b41d4a716446655440000"))       # true
println(uuid:is_valid("550E8400-E29B-41D4-A716-446655440000"))   # true
println(uuid:is_valid("not-a-uuid"))                             # false
println(uuid:is_valid(""))                                       # false
```

Note that `is_valid` accepts the unhyphenated form, so validate and then
normalise if your storage expects hyphens.

## Examples

### Tagging Records

```suji
import std:json
import std:uuid
import std:println

records = ["alpha", "beta"]
tagged = records::map(|name| {
    {
        "id": uuid:v4(),
        "name": name,
    }
})

println(tagged::length())            # 2
println(tagged[0]:id::length())      # 36
println(json:generate(tagged[1])::contains("beta"))  # true
```

### Stable Ids from Content

```suji
import std:uuid
import std:println

ns = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

id_for = |url| uuid:v5(ns, url)

first = id_for("https://example.com/a")
again = id_for("https://example.com/a")
other = id_for("https://example.com/b")

println(first == again)  # true
println(first == other)  # false
```

## Gotchas

- `v4` values are random per call; do not use one as a cache key for the same
  logical thing across runs — use `v5` for that.
- `v5` requires a valid namespace UUID; anything else is a runtime error.
- `is_valid` checks shape only, not the version or variant bits.
- These are not secrets; use [`std:crypto`](crypto.md) for anything that must be
  unguessable or authenticated.

## See Also

- [Random Numbers](random.md)
- [Cryptography](crypto.md)
- [Text Encoding](encoding.md)
- [Strings](../fundamentals/data-types/strings.md)
