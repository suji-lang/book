# YAML (`std:yaml`)

Parse and generate YAML text.

## Overview

`std:yaml` exports exactly two functions:

- `parse(text)` → Suji value
- `generate(value)` → String

There is no `stringify`, `dump` or `load`.

## Quick Start

```suji
import std:yaml
import std:println

config = yaml:parse("""
name: Alice
age: 30
hobbies:
  - reading
  - coding
""")

println(config:name)          # Alice
println(config:hobbies[1])    # coding
println(yaml:generate({"name": "Bob", "age": 25}))
```

## `parse(text)`

Mappings become maps, sequences become lists, scalars become strings, numbers,
booleans or nil.

| YAML | Suji |
|---|---|
| mapping | Map |
| sequence | List |
| quoted or plain scalar | String |
| number | Number |
| `true` / `false` | Boolean |
| `null` or an empty value | nil |

```suji
import std:yaml
import std:println

data = yaml:parse("""
enabled: true
retries: 3
ratio: 0.75
label: staging
missing:
""")

println(data:enabled)          # true
println(data:retries + 1)      # 4
println(data:ratio)            # 0.75
println(data:label)            # staging
println(data:missing == nil)   # true
```

A sequence at the top level parses into a list:

```suji
import std:yaml
import std:println

println(yaml:parse("- 1\n- 2\n- 3"))  # [1, 2, 3]
```

### Comments and Block Scalars

Comments are ignored, `|` keeps line breaks and `>` folds them into spaces:

```suji
import std:yaml
import std:println

doc = yaml:parse("""
# deployment settings
region: eu-west-1  # inline comment
notes: |
  line one
  line two
summary: >
  folded across
  two lines
""")

println(doc:region)              # eu-west-1
println(doc:notes::split("\n")::length())  # 3
println(doc:summary::trim())     # folded across two lines
```

### Nested Access

```suji
import std:yaml
import std:println

config = yaml:parse("""
database:
  host: localhost
  port: 5432
servers:
  - name: web-1
    port: 8080
  - name: web-2
    port: 8081
""")

println(config:database:port)      # 5432
println(config:servers[1]:name)    # web-2
println(config:servers::length())  # 2
```

## `generate(value)`

Converts a Suji value to YAML. Unlike JSON and TOML generation, **map keys keep
their insertion order**, and the result has no trailing newline and no leading
`---` marker.

```suji
import std:yaml
import std:println

println(yaml:generate({"server": {"host": "localhost", "ports": [80, 443]}}))
```

Output:

```yaml
server:
  host: localhost
  ports:
    - 80
    - 443
```

Scalars that would otherwise be read back as something else are quoted
automatically — including the strings `"yes"`, `"1"` and `""`, and the key `on`:

```suji
import std:yaml
import std:println

println(yaml:generate({"a": "yes", "b": "1", "c": "with: colon", "d": ""}))
```

Output:

```yaml
a: "yes"
b: "1"
c: "with: colon"
d: ""
```

Functions, streams and regexes cannot be serialized:

```suji
import std:yaml

# yaml:generate({"action": |x| x + 1})
# Error: YAML generation error: Function values cannot be converted to YAML
```

## Files

```suji
import std:io
import std:yaml
import std:println

p = `mktemp`

out = io:open(p, true, true)
out::write(yaml:generate({"server": {"host": "0.0.0.0", "port": 8080}}))
out::close()

f = io:open(p)
config = yaml:parse(f::read_all())
f::close()

println(config:server:port)  # 8080
```

## Reading Optional Settings

A missing key raises `Key not found`, so read optional settings through `get`:

```suji
import std:yaml
import std:println

config = yaml:parse("server:\n  port: 8080\n")
server = config::get("server", {})

println(server::get("port", 3000))     # 8080
println(server::get("host", "0.0.0.0"))  # 0.0.0.0
```

## Gotchas

- Only the **first document** of a multi-document stream is returned; text after
  a `---` separator is ignored.
- **Merge keys are not expanded.** `<<: *anchor` is kept as a literal `<<` key
  rather than being merged into the mapping, so avoid anchor-based reuse in files
  you intend to parse.
- Comments are dropped on parse, so a parse-then-generate round trip loses them.
- Indentation in a `"""…"""` literal is part of the string, so keep YAML written
  inline flush against the left margin.
- Parse and generation errors terminate the program.

## See Also

- [Data Formats](README.md)
- [JSON](json.md)
- [TOML](toml.md)
- [I/O and Streams](../io.md)
- [Configuration Management](../../cookbook/config-management.md)
