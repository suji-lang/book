# Data Formats

Convert between text in a structured format and Suji values.

## Overview

Four modules share the same two-function shape — one parser and one generator:

| Module | Functions | Parses into |
|---|---|---|
| [`std:json`](json.md) | `parse(text)`, `generate(value)` | Maps, lists, strings, numbers, booleans, nil |
| [`std:yaml`](yaml.md) | `parse(text)`, `generate(value)` | Maps, lists, strings, numbers, booleans, nil |
| [`std:toml`](toml.md) | `parse(text)`, `generate(value)` | Maps, lists, strings, numbers, booleans |
| [`std:csv`](csv.md) | `parse(text, delimiter = ",")`, `generate(rows, delimiter = ",")` | List of lists of strings |

The names are exactly `parse` and `generate`. There is no `stringify`, `dump`,
`load`, `encode` or `decode`, and no pretty-printing option.

## Quick Start

```suji
import std:json
import std:println

data = json:parse('{"name": "Alice", "roles": ["admin", "dev"]}')
println(data:name)          # Alice
println(data:roles[0])      # admin
println(json:generate(data))  # {"name":"Alice","roles":["admin","dev"]}
```

## Importing

Every module needs an explicit import; there is no prelude and no bare
`import json`.

```suji
import std:json
import std:yaml
import std:toml
import std:csv
import std:println

println(json:generate(yaml:parse("a: 1")))  # {"a":1}
```

Deep imports bind a single function, and aliases keep two modules' functions
apart:

```suji
import std:json:parse as parse_json
import std:yaml:generate as to_yaml
import std:println

println(to_yaml(parse_json('{"port": 8080}')))  # port: 8080
```

## Choosing a Format

| Use | Format |
|---|---|
| API payloads, machine-to-machine exchange | JSON |
| Hand-edited configuration with comments and nesting | YAML |
| Flat, table-oriented configuration | TOML |
| Tabular data, spreadsheet exchange | CSV |

## Converting Between Formats

Because all four parse into ordinary Suji values, conversion is just
parse-then-generate:

```suji
import std:json
import std:yaml
import std:println

config = yaml:parse("""
server:
  host: localhost
  port: 8080
""")

println(json:generate(config))  # {"server":{"host":"localhost","port":8080}}
```

```suji
import std:csv
import std:json
import std:println

rows = csv:parse("name,age\nAlice,30\nBob,25\n")
header = rows[0]
records = rows[1;]::map(|row| {
    {
        "name": row[0],
        "age": row[1]::to_number(),
    }
})

println(json:generate(records))  # [{"age":30,"name":"Alice"},{"age":25,"name":"Bob"}]
println(header::join(","))       # name,age
```

## Key Order

The generators differ in how they order map keys, which matters when you compare
generated text or check it into version control:

```suji
import std:json
import std:toml
import std:yaml
import std:println

m = {"zeta": 1, "alpha": 2}

println(json:generate(m))  # {"alpha":2,"zeta":1}
println(yaml:generate(m))
println(toml:generate(m))
```

JSON and TOML sort keys alphabetically; YAML preserves the map's insertion order.

## Reading and Writing Files

None of these modules touch the filesystem. Combine them with
[`std:io`](../io.md):

```suji
import std:io
import std:json
import std:println

p = `mktemp`

out = io:open(p, true, true)
out::write(json:generate({"version": 2}))
out::close()

f = io:open(p)
config = json:parse(f::read_all())
f::close()

println(config:version)  # 2
```

## Errors

A malformed document raises a runtime error that terminates the program — there
is no way to catch it:

```suji
import std:json

# json:parse("{bad")
# Error: JSON parse error: Invalid JSON: key must be a string at line 1 column 2
```

The generators fail on values with no representation in the target format:
functions, streams and regexes cannot be serialized at all, and TOML additionally
rejects `nil`. Validate or strip such values before generating.

After parsing, treat the result as untrusted: a missing map key raises
`Key not found`, so read optional fields with `get`.

```suji
import std:json
import std:println

data = json:parse('{"name": "Alice"}')

println(data::get("nickname", "(none)"))  # (none)
println(data::contains("name"))           # true
```

## See Also

- [JSON](json.md)
- [YAML](yaml.md)
- [TOML](toml.md)
- [CSV](csv.md)
- [I/O and Streams](../io.md)
- [Maps](../../fundamentals/data-types/maps.md)
