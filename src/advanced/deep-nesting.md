# Deep Nesting

Reading, writing and walking maps and lists that are many levels deep.

## Overview

Configuration files, JSON documents and API responses all arrive as maps containing lists containing maps. Suji handles these with two postfix operators that chain freely:

- `:` reads a map key written as a bare identifier — `config:server:port`
- `[]` indexes a list, or reads a map key given by any expression — `rows[0]`, `m["a b"]`

### Key Characteristics

- **Chains mix both operators** - `data[0]:users[1]:config:preferences:email`
- **Chains are assignable** - the same expression works on the left of `=`
- **Depth is not a problem** - ten levels behave exactly like two
- **Missing keys are fatal** - reading an absent key aborts the program
- **`::get(key, default)` is the safe alternative**

## Reading Nested Values

### Maps

```suji
import std:println

config = {
    user: {
        profile: {
            settings: {
                display: {
                    theme: "light",
                    layout: "grid"
                },
                notifications: true
            },
            avatar: "user.png"
        },
        name: "Alice"
    },
    version: "1.0"
}

println(config:user:profile:settings:display:theme)    # light
println(config:user:name)                              # Alice
println(config:version)                                # 1.0
```

Bracket notation does the same job and is required when a key is not a bare identifier — because it contains a space or a dash, or because it is computed:

```suji
import std:println

m = { "content-type": "text/plain", "max size": 1024 }
key = "content-type"

println(m["content-type"])    # text/plain
println(m[key])               # text/plain
println(m["max size"])        # 1024
```

### Lists

Indices chain the same way:

```suji
import std:println

matrix = [[[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]]

println(matrix[0][1][1][3])    # 16
println(matrix[0][0][0][0])    # 1
```

### Mixed chains

Real data alternates between the two. Read it in one expression:

```suji
import std:println

data = [{
    users: [
        { name: "Alice", config: { preferences: { notifications: { email: false } } } },
        { name: "Bob", config: { preferences: { notifications: { email: true } } } }
    ],
    count: 2
}]

println(data[0]:users[1]:name)                                    # Bob
println(data[0]:users[1]:config:preferences:notifications:email)  # true
println(data[0]:count)                                            # 2
```

Depth really is unlimited in practice:

```suji
import std:println

deep = { l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: { l9: { l10: "bottom" } } } } } } } } } }

println(deep:l1:l2:l3:l4:l5:l6:l7:l8:l9:l10)    # bottom
```

## Assigning Through a Chain

Any chain you can read, you can also assign to. The intermediate containers must already exist; only the final key may be new.

```suji
import std:println

config = { server: { http: { port: 8080 } } }

# Update an existing leaf
config:server:http:port = 9090
println(config:server:http:port)    # 9090

# Add a new leaf to an existing map
config:server:http:tls = true
println(config:server:http:tls)     # true

# Add a whole new subtree
config:server:grpc = { port: 50051 }
println(config:server:grpc:port)    # 50051
```

Lists work identically, including nested ones:

```suji
import std:println

matrix = [[[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]]

matrix[0][1][1][3] = 99
println(matrix[0][1][1][3])    # 99
```

And mixed chains:

```suji
import std:println

data = [{ users: [{ name: "Alice", tags: ["a"] }] }]

data[0]:users[0]:name = "Ada"
data[0]:users[0]:tags[0] = "b"

println(data[0]:users[0]:name)       # Ada
println(data[0]:users[0]:tags[0])    # b
```

### Creating a missing level

Assigning through a level that does not exist yet fails, so create it first:

```suji
import std:println

config = { server: {} }

match config:server::contains("http") {
    false => { config:server:http = {} }
    _ => { nil }
}

config:server:http:port = 8080
println(config:server:http:port)    # 8080
```

## Missing Keys Are Fatal

Reading a key that is not present raises `[404] Key not found` and terminates the program — and in a long chain, the failure happens at the first missing link:

```text
[404] Error: Key not found
   ╭─[ script.si:4:9 ]
   │
 4 │ println(config:server:grpc:port)
   │         ─────────┬────────
   │                  ╰────────── Key 'grpc' not found in map
   │
   │ Note 1: Check array/map bounds and key existence
───╯
Error: Key not found: Key 'grpc' not found in map
```

`::get(key, default)` never fails, so it is the right tool at every level where the key is optional:

```suji
import std:println

config = { server: { http: { port: 8080 } } }

println(config:server::get("http")::get("port", 80))    # 8080
println(config:server::get("grpc", {})::get("port", 0))  # 0
```

Note the `{}` default in the second call: it keeps the chain going by supplying an empty map to the next `::get()`.

### A reusable safe reader

For deep or variable paths, walk a list of keys and bail out at the first miss:

```suji
import std:println

get_path = |root, path| {
    node = root
    loop through path with key {
        !node::is_map() && return nil
        !node::contains(key) && return nil
        node = node::get(key)
    }
    return node
}

config = { server: { http: { port: 8080 } } }

println(get_path(config, ["server", "http", "port"]))    # 8080
println(get_path(config, ["server", "grpc", "port"]))    # nil
println(get_path(config, ["nope"]))                      # nil
```

## Building Nested Structures

The literal form is usually clearest:

```suji
import std:println

app = {
    name: "demo",
    services: [
        { name: "api", port: 8080 },
        { name: "worker", port: 0 }
    ],
    limits: { memory_mb: 512, cpu: 2 }
}

println(app:services[0]:port)    # 8080
println(app:limits:memory_mb)    # 512
```

Building incrementally works too — assign an empty container, then fill it:

```suji
import std:println

report = {}
report:totals = {}
report:totals:count = 0

rows = []
loop through [3, 5, 7] with n {
    rows::push({ "value": n })
    report:totals:count = report:totals:count + n
}
report:rows = rows

println(report:totals:count)      # 15
println(report:rows::length())    # 3
println(report:rows[1]:value)     # 5
```

Note that `rows` is built as a plain variable and attached at the end. A mutating method cannot be called through a chain — `report:rows::push(x)` raises `Cannot call mutating method on immutable value` — so build the list first, or reassign the whole value:

```suji
import std:println

report = { rows: [1, 2] }

report:rows = report:rows + [3]
println(report:rows::length())    # 3
```

### Maps and lists are copied into function parameters

This surprises people building nested data in helpers: **arguments are passed by value**. Mutating a parameter does not change the caller's structure, but a variable captured from an enclosing scope *is* shared.

```suji
import std:println

m = { a: 1 }

# Parameter: the mutation is lost
by_param = |target| { target["b"] = 2 }
by_param(m)
println(m::contains("b"))    # false

# Capture: the mutation sticks
by_capture = || { m["c"] = 3 }
by_capture()
println(m::contains("c"))    # true
```

So a helper that adds to a nested structure should **return** the new value rather than mutate its argument.

## Walking Nested Structures

### Maps

`loop through map with k, v` gives you both halves of each entry — two bindings are allowed for maps only:

```suji
import std:println

settings = { theme: "dark", layout: "grid", zoom: 2 }

loop through settings with k, v {
    println("${k} = ${v}")
}
# theme = dark
# layout = grid
# zoom = 2
```

`keys()`, `values()` and `to_list()` give the same data as ordinary lists. `to_list()` yields `(key, value)` tuples, which you destructure:

```suji
import std:println

settings = { theme: "dark", zoom: 2 }

println(settings::keys()::join(", "))      # theme, zoom
println(settings::length())                # 2

loop through settings::to_list() with pair {
    k, v = pair
    println("${k} -> ${v}")
}
# theme -> dark
# zoom -> 2
```

### Nested loops

Iterating a structure that alternates lists and maps is just nested loops:

```suji
import std:println

teams = [
    { name: "red", members: ["ann", "bo"] },
    { name: "blue", members: ["cy"] }
]

loop through teams with team {
    loop through team:members with member {
        println("${team:name}/${member}")
    }
}
# red/ann
# red/bo
# blue/cy
```

### Recursive walks

A recursive helper flattens an arbitrarily nested map into `path = value` lines. Return a list and concatenate rather than accumulating into a parameter:

```suji
import std:println

flatten = |root, prefix| {
    out = []
    loop through root with k, v {
        full = match {
            prefix == "" => "${k}",
            _ => "${prefix}.${k}",
        }
        match v::is_map() {
            true => { out = out + flatten(v, full) }
            _ => { out::push("${full} = ${v}") }
        }
    }
    return out
}

config = { server: { http: { port: 8080, host: "localhost" } }, debug: false }

println(flatten(config, "")::join("\n"))
# server.http.port = 8080
# server.http.host = localhost
# debug = false
```

Recursion depth is limited — around 600–700 frames before the interpreter aborts — which is far more than any realistic document nesting, but it does rule out walking cyclic structures.

## Common Patterns

**Reading a parsed document.** `json:parse` returns exactly the nested maps and lists described above:

```suji
import std:println
import std:json

text = '{"meta": {"page": 1}, "items": [{"id": 7, "tags": ["a", "b"]}]}'
doc = json:parse(text)

println(doc:meta:page)          # 1
println(doc:items[0]:id)        # 7
println(doc:items[0]:tags[1])   # b
```

**Round-tripping a config file:**

```suji
import std:println
import std:json
import std:io

path = `mktemp`
f = io:open(path, true, true)
f::write('{"server": {"http": {"port": 8080}}}')
f::close()

g = io:open(path)
config = json:parse(g::read_all())
g::close()

config:server:http:port = 9090
println(json:generate(config))    # {"server":{"http":{"port":9090}}}
```

**Collecting a field from every record:**

```suji
import std:println

users = [
    { profile: { email: "a@x" } },
    { profile: { email: "b@x" } }
]

emails = users::map(|u| u:profile:email)
println(emails::join(", "))    # a@x, b@x
```

**Defaults for an optional subtree:**

```suji
import std:println

settings = { display: { theme: "dark" } }

display = settings::get("display", {})
println(display::get("theme", "light"))     # dark
println(display::get("density", "cosy"))    # cosy

audio = settings::get("audio", {})
println(audio::get("volume", 50))           # 50
```

## See Also

- [Maps](../fundamentals/data-types/maps.md) - key access, `::get()`, `::contains()`
- [Lists](../fundamentals/data-types/lists.md) - indexing and slices
- [Loops](../fundamentals/control-flow/loops.md) - `loop through … with k, v`
- [JSON](../stdlib/data-formats/json.md) - producing nested structures from text
- [Error Handling](error-handling.md) - why a missing key ends the program
