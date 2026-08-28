# JSON (`std:json`)

Parse and generate JSON text.

## Overview

`std:json` exports exactly two functions:

- `parse(text)` → Suji value
- `generate(value)` → String (compact JSON)

There is no `stringify`, `dump` or `load`, and no pretty-printing option.

## Quick Start

```suji
import std:json
import std:println

data = json:parse('{"name": "Alice", "age": 30}')
println(data:name)  # Alice
println(data:age)   # 30

user = {"name": "Bob", "age": 25, "active": true}
println(json:generate(user))  # {"active":true,"age":25,"name":"Bob"}
```

## Importing

```suji
import std:json                       # json:parse, json:generate
import std:json:parse                 # binds parse
import std:json:generate as to_json   # binds to_json
import std:println

println(to_json(parse('{"a": 1}')))  # {"a":1}
```

## `parse(text)`

Parses a JSON document into Suji values.

| JSON | Suji |
|---|---|
| object | Map |
| array | List |
| string | String |
| number | Number |
| `true` / `false` | Boolean |
| `null` | nil |

Any JSON value works at the top level, not just objects and arrays:

```suji
import std:json
import std:println

println(json:parse("42"))        # 42
println(json:parse('"text"'))    # text
println(json:parse("[1,2,3]"))   # [1, 2, 3]
println(json:parse("null") == nil)  # true
```

Nested structures are read with `:` for map keys and `[]` for list indices, and
the chains can be combined:

```suji
import std:json
import std:println

text = '''
{
    "company": {
        "name": "Acme Corp",
        "employees": [
            {"name": "Alice", "role": "Engineer"},
            {"name": "Bob", "role": "Designer"}
        ]
    }
}
'''

data = json:parse(text)
println(data:company:name)                  # Acme Corp
println(data:company:employees[0]:name)     # Alice
println(data:company:employees::length())   # 2
```

Malformed input raises a runtime error that terminates the program:

```suji
import std:json

# json:parse('{"name": "Alice"')
# Error: JSON parse error: Invalid JSON: EOF while parsing an object at line 1 column 16
```

## `generate(value)`

Converts a Suji value to a compact JSON string.

```suji
import std:json
import std:println

data = {
    "name": "Alice",
    "hobbies": ["reading", "coding"],
    "active": true,
    "manager": nil,
}

println(json:generate(data))
# {"active":true,"hobbies":["reading","coding"],"manager":null,"name":"Alice"}
```

Notable details:

- **Keys are sorted alphabetically**, not kept in insertion order.
- Output is compact: no spaces, no newlines, no trailing newline.
- `nil` becomes `null`.
- Tuples are written as arrays.
- Strings are escaped as JSON requires.

```suji
import std:json
import std:println

println(json:generate((1, 2)))  # [1,2]
println(json:generate({"text": "l1\nl2", "q": "say \"hi\""}))
# {"q":"say \"hi\"","text":"l1\nl2"}
```

Functions, streams and regexes have no JSON representation:

```suji
import std:json

# json:generate({"action": |x| x + 1})
# Error: JSON generation error: Function values cannot be converted to JSON
```

## Reading Optional Fields

A missing map key raises `Key not found`, so use `get` and `contains` for fields
that may be absent:

```suji
import std:json
import std:println

data = json:parse('{"name": "Alice"}')

println(data::get("email", "unknown"))  # unknown
println(data::contains("email"))        # false
println(data:name)                      # Alice
```

The same applies to nested maps — check each level you are not sure about:

```suji
import std:json
import std:println

config = json:parse('{"server": {"port": 8080}}')

server = config::get("server", {})
port = server::get("port", 3000)
tls = server::get("tls", false)

println("${port} ${tls}")  # 8080 false
```

## Round-Tripping Numbers

Suji numbers are fixed-precision decimals, so ordinary decimal values survive a
round trip exactly:

```suji
import std:json
import std:println

data = {"value": 1.23456789012345}
parsed = json:parse(json:generate(data))

println(parsed:value == data:value)  # true
println(0.1 + 0.2 == 0.3)            # true
```

## Files

```suji
import std:io
import std:json
import std:println

p = `mktemp`

out = io:open(p, true, true)
out::write(json:generate({"users": [{"name": "Alice"}, {"name": "Bob"}]}))
out::close()

f = io:open(p)
data = json:parse(f::read_all())
f::close()

println(data:users::length())     # 2
println(data:users[1]:name)       # Bob
```

## Transforming Parsed Data

Lists of maps combine well with `map`, `filter` and `fold`. Note that a map
literal as a whole lambda body must use quoted keys or be wrapped in a block:

```suji
import std:json
import std:println

input = '[{"first":"Alice","last":"Smith","status":"active"},{"first":"Bob","last":"Jones","status":"inactive"}]'
users = json:parse(input)

active = users::filter(|u| u:status == "active")
summary = active::map(|u| {
    {
        "full_name": "${u:first} ${u:last}",
        "active": true,
    }
})

println(json:generate(summary))  # [{"active":true,"full_name":"Alice Smith"}]
```

## Merging Documents

`merge` mutates the receiving map and returns `nil`, so merge first and then
generate:

```suji
import std:json
import std:println

base = json:parse('{"a": 1, "b": 2}')
override = json:parse('{"b": 3, "c": 4}')

base::merge(override)
println(json:generate(base))  # {"a":1,"b":3,"c":4}
```

## Shell and HTTP

JSON pairs naturally with backtick commands, for example a `curl` call. A
non-zero exit status from the command terminates the script, so `-f` plus a
fallback is worth using in real scripts:

```suji
import std:json
import std:println

# body = `curl -fsS https://api.example.com/users || echo '[]'`
# users = json:parse(body)

body = `printf '[{"id":1},{"id":2}]'`
users = json:parse(body)
println(users::length())  # 2
```

## Gotchas

- `generate` sorts keys, so generated text will not match the order you wrote
  the map in.
- There is no pretty-printer; pipe through an external tool
  (`` `printf '%s' "${text}" | python3 -m json.tool` ``) if you need indentation.
- Parse and generation errors terminate the program; validate input before
  parsing untrusted text.
- Bare identifier keys in a map literal are only recognised where a map is
  expected — use quoted keys when a map literal is a lambda or match-arm body.

## See Also

- [Data Formats](README.md)
- [YAML](yaml.md)
- [TOML](toml.md)
- [Maps](../../fundamentals/data-types/maps.md)
- [Lists](../../fundamentals/data-types/lists.md)
- [HTTP with curl](../../cookbook/http.md)
