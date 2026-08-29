# Environment (`std:env`)

Read and write environment variables, and reach the script's command-line
arguments.

## Overview

`std:env` exports three **values** — not functions:

| Export | Kind | Description |
|---|---|---|
| `var` | Map-like object | The live process environment |
| `args` | Map | Command-line arguments, keyed by `"0"`, `"1"`, … |
| `argv` | Map | The same snapshot as `args` |

Because these are values, they are used without call parentheses:
`env:var:HOME`, `env:args["0"]`. There is no `env:get(...)` and no `env:args()`.

## Quick Start

```suji
import std:env
import std:println

println(env:var::contains("PATH"))            # true
println(env:var::get("NO_SUCH_VAR", "none"))  # none

env:var["APP_MODE"] = "debug"
println(env:var:APP_MODE)                     # debug
```

## `var` — The Process Environment

`env:var` behaves like a map of strings to strings, and it is *live*: assigning
to it changes the environment of the running process, so child processes started
with backticks see the new value.

### Reading

```suji
import std:env
import std:println

home = env:var:HOME          # bare-identifier key
path = env:var["PATH"]       # any string expression as key

println(home::is_string())   # true
println(path::is_string())   # true
```

A missing variable **raises** `Key not found: Environment variable not found`,
which terminates the program. Use `get` with a default, or `contains`, for
anything that may be absent:

```suji
import std:env
import std:println

port = env:var::get("DEMO_PORT", "8080")
println(port)  # 8080

println(env:var::contains("DEMO_PORT"))  # false
```

### Writing

```suji
import std:env
import std:println

env:var["GREETING"] = "hello"
println(`echo $GREETING`)  # hello
```

`merge` sets several variables at once, and `delete` removes one:

```suji
import std:env
import std:println

env:var::merge({"SERVICE": "api", "REGION": "eu-west-1"})
println(env:var:SERVICE)             # api

println(env:var::delete("SERVICE"))  # true
println(env:var::contains("SERVICE"))  # false
```

### Methods

`env:var` supports the map methods:

| Method | Returns | Description |
|---|---|---|
| `get(name, default = nil)` | String or default | Safe read |
| `contains(name)` | Boolean | Whether the variable is set |
| `keys()` | List | All variable names |
| `values()` | List | All variable values |
| `to_list()` | List | `(name, value)` tuples |
| `length()` | Number | Number of variables |
| `delete(name)` | Boolean | Unset a variable |
| `merge(map)` | nil | Set every pair in `map` |

```suji
import std:env
import std:println

env:var::merge({"DEMO_ONE": "1", "DEMO_TWO": "2"})

demo = env:var::keys()::filter(|k| k::starts_with("DEMO_"))
println(demo::sort())  # [DEMO_ONE, DEMO_TWO]
```

## `args` and `argv` — Command-Line Arguments

`env:args` and `env:argv` are maps captured at startup and keyed by **strings**,
so index them with `"0"`, `"1"`, … and never with the numbers `0`, `1`.
Interpreter flags (anything starting with `-`) are consumed by the CLI and never
appear here.

```suji
import std:env
import std:println

println(env:args::is_map())                    # true
println(env:args::get("0", nil)::is_string())  # true
```

The intended layout is `"0"` for the script path and `"1"`, `"2"`, … for the
script's own arguments.

> **Known bug in 0.1.22: positional arguments do not work.** Every argument is
> written back to key `"0"`, so the map always holds exactly one entry: the
> script path when the script is run with no arguments, and otherwise the *last*
> argument. Keys `"1"` and up are never populated.
>
> ```bash
> suji script.si            # env:args is {0: script.si}
> suji script.si build      # env:args is {0: build}
> suji script.si build fast # env:args is {0: fast}
> ```
>
> Until this is fixed, treat `env:args` as unreliable for anything but a single
> value, read it defensively, and pass multiple inputs another way.

```suji
import std:env
import std:println

println(env:args::length())        # 1
println(env:args::contains("1"))   # false
```

Read the value defensively and do not rely on higher indices:

```suji
import std:env
import std:println

first = env:args::get("1", nil)
println(first == nil)  # true
```

For scripts that need several inputs, prefer environment variables or a single
argument that you split yourself:

```suji
import std:env
import std:println

# TARGETS="a,b,c" suji script.si
raw = env:var::get("TARGETS", "")
targets = match {
    raw == "" => [],
    _ => raw::split(","),
}

println(targets::length())  # 0
```

## Gotchas

- `env:var`, `env:args` and `env:argv` are values; calling them
  (`env:var()`) is an error.
- Environment values are always strings — convert with `::to_number()` when you
  need arithmetic, and validate first because an unparsable string is a runtime
  error.
- Reading a missing variable with `:` or `[]` terminates the program; `get` is
  the safe form.
- `args` and `argv` are snapshots taken at startup, so mutating them has no
  effect on anything else.

## See Also

- [Dotenv Files](dotenv.md)
- [Operating System](os.md)
- [Maps](../fundamentals/data-types/maps.md)
- [CLI and REPL](../getting-started/cli-repl.md)
