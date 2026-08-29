# Standard Library

Everything Suji ships in `std`, and how to import it.

## Overview

The standard library is small and entirely explicit. **There is no prelude** —
nothing at all is available until you import it, including `println`:

```suji
import std:println

println("hello")  # hello
```

Every module lives under `std`. There is no top-level module, so `import json`
fails with `Invalid operation: Module 'json' not found`; the correct form is
`import std:json`.

## The Complete Module List

These are all of the modules, and the pages below document every function each
one exports.

### Printing

| Import | Provides | Page |
|---|---|---|
| `import std:println` | `println(text = "", out = nil)` | [Print Functions](core.md) |
| `import std:print` | `print(text, out = nil)` | [Print Functions](core.md) |

### Data Formats

| Module | Exports | Page |
|---|---|---|
| `std:json` | `parse`, `generate` | [JSON](data-formats/json.md) |
| `std:yaml` | `parse`, `generate` | [YAML](data-formats/yaml.md) |
| `std:toml` | `parse`, `generate` | [TOML](data-formats/toml.md) |
| `std:csv` | `parse`, `generate` | [CSV](data-formats/csv.md) |

### System

| Module | Exports | Page |
|---|---|---|
| `std:io` | `open`, `stdin`, `stdout`, `stderr` | [I/O and Streams](io.md) |
| `std:env` | `var`, `args`, `argv` | [Environment](env.md) |
| `std:os` | `name`, `hostname`, `uptime_ms`, `tmp_dir`, `home_dir`, `work_dir`, `pid`, `ppid`, `uid`, `gid`, `exit`, `mkdir`, `rm`, `rmdir`, `stat` | [Operating System](os.md) |
| `std:path` | `is_abs`, `join`, `dirname`, `basename`, `extname`, `normalize` | [Paths](path.md) |
| `std:dotenv` | `load` | [Dotenv Files](dotenv.md) |

### Utilities

| Module | Exports | Page |
|---|---|---|
| `std:random` | `random`, `seed`, `integer`, `pick`, `shuffle`, `sample`, `string`, `hex_string`, `alpha_string`, `numeric_string`, `alphanumeric_string` | [Random Numbers](random.md) |
| `std:time` | `now`, `sleep`, `parse_iso`, `format_iso` | [Time and Dates](time.md) |
| `std:uuid` | `v4`, `v5`, `is_valid` | [UUID](uuid.md) |
| `std:encoding` | `base64_encode`, `base64_decode`, `hex_encode`, `hex_decode`, `percent_encode`, `percent_decode` | [Text Encoding](encoding.md) |
| `std:math` | `PI`, `E`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `log`, `log10`, `exp` | [Mathematics](math.md) |
| `std:crypto` | `md5`, `sha1`, `sha256`, `sha512`, `hmac_sha256` | [Cryptography](crypto.md) |

There is no HTTP client module: make requests with backtick shell commands (see
[HTTP with curl](../cookbook/http.md)). There is no logging, testing, regex,
string or collections module either — string and collection operations are
[methods on values](../advanced/type-checking.md) rather than library functions.

## Import Forms

```suji
import std                 # binds std; then std:println(...), std:math:PI
import std:math            # binds math;    math:PI
import std:println         # binds println
import std:json:parse      # deep import, binds parse
import std:println as say  # alias

say("all four forms work")  # all four forms work
```

```suji
import std:json:parse
import std:yaml:generate as to_yaml
import std:println

println(to_yaml(parse('{"port": 8080}')))  # port: 8080
```

## Functions vs. Values

Most exports are functions, but a few are values and must not be called:

| Value | Kind |
|---|---|
| `math:PI`, `math:E` | Numbers |
| `io:stdin`, `io:stdout`, `io:stderr` | Streams |
| `env:var`, `env:args`, `env:argv` | Map-like values |

```suji
import std:env
import std:io
import std:math
import std:println

println(math:PI > 3)                # true
println(io:stderr::is_stream())     # true
println(env:var::contains("PATH"))  # true
```

## Quick Start

### Reading and Writing a File

```suji
import std:io
import std:println

p = `mktemp`

out = io:open(p, true, true)   # create = true, truncate = true
out::write("Hello, World!\n")
out::close()

f = io:open(p)
println(f::read_all()::trim())  # Hello, World!
f::close()
```

### Parsing Configuration

```suji
import std:json
import std:println

config = json:parse('{"server": {"host": "0.0.0.0", "port": 8080}}')

println(config:server:port)                  # 8080
println(config:server::get("tls", false))    # false
```

### Calling an External Command

```suji
import std:json
import std:println

# users = json:parse(`curl -fsS https://api.example.com/users || echo '[]'`)

users = json:parse(`printf '[{"id":1},{"id":2}]'`)
println(users::length())  # 2
```

### Timestamps

```suji
import std:time
import std:println

started = time:now():epoch_ms
time:sleep(20)
println(time:now():epoch_ms - started >= 20)  # true
```

## Error Handling

Standard library functions signal failure by raising a runtime error, and Suji
has **no way to catch one** — the process prints a diagnostic and exits with
status 1. The only strategy is to check before you act:

| Risk | Defensive form |
|---|---|
| Missing map key | `m::get(key, default)`, `m::contains(key)` |
| Missing environment variable | `env:var::get(name, default)` |
| File may not exist | `` `test -e "${p}" && echo yes \|\| echo no` `` before `io:open` / `os:stat` |
| Command may fail | `` `cmd \|\| true` `` — a non-zero exit status otherwise ends the script |
| Empty list | `xs::length() > 0` before `pick`, `first`, indexing |
| Unparsable number | validate with a regex before `::to_number()` |

```suji
import std:env
import std:io
import std:os
import std:println

p = `mktemp`

size = match `test -e "${p}" && echo yes || echo no` {
    "yes" => os:stat(p):size,
    _ => 0,
}

println(size)                                # 0
println(env:var::get("MISSING_VAR", "n/a"))  # n/a
```

See [Error Handling Deep Dive](../advanced/error-handling.md) for the full
picture.

## Common Patterns

### Converting Between Formats

```suji
import std:json
import std:yaml
import std:println

data = yaml:parse("name: demo\nport: 8080\n")
println(json:generate(data))  # {"name":"demo","port":8080}
```

### Processing a File Line by Line

```suji
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("INFO ok\nERROR bad\nWARN hmm\nERROR worse\n")
f::close()

r = io:open(p)
lines = r::read_lines()
r::close()

errors = lines::filter(|line| line ~ /ERROR/)
println(errors::length())  # 2
```

### Building a Path

```suji
import std:os
import std:path
import std:println

target = path:join([os:tmp_dir(), "reports", "summary.csv"])
println(path:extname(target))   # .csv
println(path:basename(target))  # summary.csv
```

## Implementation Note

The standard library is a virtual, embedded module tree: some modules are Suji
source files that delegate to runtime builtins, and others are builtins directly.
Either way they are resolved from inside the interpreter, so there are no files to
install and no package manager involved.

## See Also

- [Print Functions](core.md)
- [Data Formats](data-formats/README.md)
- [Modules](../modules/README.md)
- [Standard Library Structure](../modules/stdlib-structure.md)
- [Cookbook](../cookbook/README.md)
- [Data Types](../fundamentals/data-types/README.md)
