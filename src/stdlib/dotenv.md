# Dotenv Files (`std:dotenv`)

Load `KEY=value` pairs from a `.env` file into the process environment.

## Overview

`std:dotenv` exports a single function:

- `load(path = ".env", override = false)` → **Map** of the pairs it applied

`load` reads the file, sets each pair in [`env:var`](env.md), and returns a map
containing only the pairs it actually set. Values already present in the
environment are left alone unless `override` is `true`.

## Quick Start

```suji
import std:dotenv
import std:env
import std:io
import std:println

# create a .env to load
p = `mktemp`
f = io:open(p, true, true)
f::write("APP_NAME=demo\nAPP_PORT=8080\n")
f::close()

loaded = dotenv:load(p)
println(loaded::keys())     # [APP_NAME, APP_PORT]
println(env:var:APP_NAME)   # demo
```

With no arguments, `load()` reads `.env` from the current working directory:

```suji
import std:dotenv

# dotenv:load()               # reads ./.env
# dotenv:load("config/.env")  # reads a specific file
```

## File Format

Each line is trimmed and then interpreted as follows:

| Line | Result |
|---|---|
| `KEY=value` | Sets `KEY` to `value`; both sides are trimmed |
| *(empty)* | Ignored |
| `# comment` | Ignored |
| `KEY=` | Ignored — an empty value is skipped |
| `KEY` | Ignored — no `=` means no pair |

The **first** `=` separates key from value, so values may contain `=` freely:

```suji
import std:dotenv
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("DATABASE_URL=postgres://user:pass@localhost:5432/db\nSPACED = padded \n")
f::close()

loaded = dotenv:load(p)
println(loaded:DATABASE_URL)  # postgres://user:pass@localhost:5432/db
println(loaded:SPACED)        # padded
```

### The Parser Is Deliberately Literal

There is no quote stripping, no inline-comment stripping, no escape processing,
and no `export` prefix handling. Whatever follows the first `=` (after trimming)
becomes the value verbatim:

```suji
import std:dotenv
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("QUOTED=\"hi there\"\nINLINE=bar # trailing\nexport EXPORTED=yes\n")
f::close()

loaded = dotenv:load(p)
println(loaded:QUOTED)                       # "hi there"
println(loaded:INLINE)                       # bar # trailing
println(loaded::contains("EXPORTED"))        # false
println(loaded::contains("export EXPORTED")) # true
```

So write `.env` files without quotes, without trailing comments on value lines,
and without `export`.

## `override`

By default an existing environment variable wins, and the returned map tells you
what was actually applied — an empty map means nothing changed:

```suji
import std:dotenv
import std:env
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("MODE=from-file\n")
f::close()

env:var["MODE"] = "from-shell"

first = dotenv:load(p)
println(first::length())   # 0
println(env:var:MODE)      # from-shell

second = dotenv:load(p, true)
println(second::keys())    # [MODE]
println(env:var:MODE)      # from-file
```

This makes the default order of precedence "real environment beats file", which
is usually what you want for deployment overrides.

## Loading Layered Files

Later loads do not overwrite earlier ones unless you ask them to, so load the
most specific file first:

```suji
import std:dotenv
import std:env
import std:io
import std:println

base = `mktemp`
b = io:open(base, true, true)
b::write("REGION=us-east-1\nTIER=free\n")
b::close()

local = `mktemp`
l = io:open(local, true, true)
l::write("TIER=pro\n")
l::close()

dotenv:load(local)   # wins
dotenv:load(base)    # fills in the rest

println(env:var:TIER)    # pro
println(env:var:REGION)  # us-east-1
```

## Gotchas

- A missing file raises `Stream error: Failed to open '<path>'` and terminates
  the program. Probe first with
  `` `test -e .env && echo yes || echo no` `` if the file is optional.
- Values are always strings; convert with `::to_number()` where needed.
- Reading a key that the file did not define raises `Key not found`; use
  `env:var::get(name, default)`.
- `load` mutates the process environment, so backtick commands started afterwards
  inherit the loaded values.

```suji
import std:dotenv
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("GREETING=hello\n")
f::close()

dotenv:load(p)
println(`echo $GREETING`)  # hello
```

## See Also

- [Environment](env.md)
- [I/O and Streams](io.md)
- [Configuration Management](../cookbook/config-management.md)
