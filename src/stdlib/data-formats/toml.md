# TOML (`std:toml`)

Parse and generate TOML configuration text.

## Overview

`std:toml` exports exactly two functions:

- `parse(text)` → Map
- `generate(value)` → String

There is no `stringify`, `dump` or `load`.

## Quick Start

```suji
import std:toml
import std:println

config = toml:parse('''
title = "My App"

[server]
host = "localhost"
port = 8080
''')

println(config:title)         # My App
println(config:server:port)   # 8080

println(toml:generate({"title": "My App", "server": {"port": 8080}}))
```

## `parse(text)`

A TOML document is always a table, so `parse` always returns a map.

| TOML | Suji |
|---|---|
| table | Map |
| array | List |
| array of tables | List of maps |
| string | String |
| integer / float | Number |
| `true` / `false` | Boolean |
| date, time, datetime | String |

```suji
import std:toml
import std:println

config = toml:parse('''
name = "myapp"
version = "1.0.0"
ratio = 0.5
enabled = true
tags = ["cli", "tool"]
created = 1979-05-27T07:32:00Z

[dependencies]
lib1 = "^1.0"
''')

println(config:name)              # myapp
println(config:ratio)             # 0.5
println(config:enabled)           # true
println(config:tags)              # [cli, tool]
println(config:created)           # 1979-05-27T07:32:00Z
println(config:dependencies:lib1) # ^1.0
```

Dates and datetimes come back as **strings**, not numbers. Convert with
[`std:time`](../time.md) when you need a timestamp:

```suji
import std:time
import std:toml
import std:println

config = toml:parse('released = 2023-11-10T15:30:00Z\n')
released = time:parse_iso(config:released)

println(released:epoch_ms)  # 1699630200000
```

### Nested and Repeated Tables

Dotted table headers nest maps, and `[[…]]` builds a list of maps:

```suji
import std:toml
import std:println

config = toml:parse('''
[database.primary]
host = "db-1"

[[servers]]
host = "web-1"
port = 8080

[[servers]]
host = "web-2"
port = 8081
''')

println(config:database:primary:host)  # db-1
println(config:servers::length())      # 2
println(config:servers[1]:port)        # 8081

total = config:servers::fold(0, |acc, s| acc + s:port)
println(total)  # 16161
```

## `generate(value)`

Converts a Suji value to TOML. Keys are **sorted alphabetically**, scalars are
emitted before tables, and the result ends with a newline.

```suji
import std:toml
import std:println

println(toml:generate({"title": "app", "ports": [1, 2], "owner": {"name": "Alice"}}))
```

Output:

```toml
ports = [1, 2]
title = "app"

[owner]
name = "Alice"
```

A list of maps becomes an array of tables:

```suji
import std:toml
import std:println

println(toml:generate({"servers": [{"host": "a"}, {"host": "b"}]}))
```

Output:

```toml
[[servers]]
host = "a"

[[servers]]
host = "b"
```

### TOML Has No Null

`nil` cannot be represented, anywhere in the value:

```suji
import std:toml

# toml:generate({"nickname": nil})
# Error: TOML conversion error: TOML does not support nil values
```

Drop empty entries before generating:

```suji
import std:toml
import std:println

record = {"name": "Alice", "nickname": nil}
clean = {}
loop through record with k, v {
    match {
        v != nil => { clean[k] = v }
    }
}

println(toml:generate(clean))  # name = "Alice"
```

Functions, streams and regexes cannot be serialized either.

### Non-Map Values

`generate` expects a table. A scalar or list is wrapped under the key `value`
rather than rejected, which is rarely what you want:

```suji
import std:toml
import std:println

println(toml:generate([1, 2]))  # value = [1, 2]
```

## Files

```suji
import std:io
import std:toml
import std:println

p = `mktemp`

out = io:open(p, true, true)
out::write(toml:generate({"server": {"host": "0.0.0.0", "port": 8080}}))
out::close()

f = io:open(p)
config = toml:parse(f::read_all())
f::close()

println("${config:server:host}:${config:server:port}")  # 0.0.0.0:8080
```

## Reading Optional Settings

```suji
import std:toml
import std:println

config = toml:parse("[server]\nport = 8080\n")
server = config::get("server", {})

println(server::get("port", 3000))    # 8080
println(server::get("workers", 4))    # 4
println(config::contains("logging"))  # false
```

## Gotchas

- `generate` sorts keys, so generated files will not preserve your map's order.
- `nil` values raise a TOML conversion error; strip them first.
- Comments are dropped on parse, so round-tripping a hand-written config loses
  them.
- Dates parse to strings; there is no TOML date type in Suji.
- Parse and generation errors terminate the program.

## See Also

- [Data Formats](README.md)
- [JSON](json.md)
- [YAML](yaml.md)
- [Time and Dates](../time.md)
- [Configuration Management](../../cookbook/config-management.md)
