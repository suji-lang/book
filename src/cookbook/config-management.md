# Configuration Management

Configuration is usually a combination of:

- Defaults (checked into source control)
- Environment variables (per-deployment)
- Optional config files (per-environment or per-user)

Suji has no `if` statements, so use `match` for branching and guard clauses for early exits.

## Loading

Layer the sources: start from the defaults, overlay the config file, then let environment variables win. `map::merge(other)` mutates the receiver and returns `nil`, so merge into the accumulating config.

```suji
import std:dotenv
import std:env
import std:io
import std:json
import std:os
import std:println

# Sample .env and config file
env_path = `mktemp`
f = io:open(env_path, true, true)
f::write("APP_PORT=9000\n")
f::close()

config_path = `mktemp`
g = io:open(config_path, true, true)
g::write("""{"log_level": "debug", "port": 8081}""")
g::close()

exists = |p| `test -f "${p}" && echo yes || echo no` == "yes"

load_json = |p| {
    file = io:open(p)
    parsed = json:parse(file::read_all())
    file::close()
    parsed
}

dotenv:load(env_path)

config = { port: 8080, log_level: "info" }

# 1. Overlay the config file, if there is one
match { exists(config_path) => { config::merge(load_json(config_path)) } }

# 2. Environment variables win
env_port = env:var::get("APP_PORT", nil)
match { env_port != nil => { config["port"] = env_port::to_number() } }

println("port=${config:port}")            # port=9000
println("log_level=${config:log_level}")  # log_level=debug

os:rm(env_path)
os:rm(config_path)
```

`dotenv:load(path)` returns the map it loaded and also writes the values into `env:var`, so later lookups see them.

## Environments

```suji
import std:env
import std:println

env_name = env:var::get("APP_ENV", "development")

settings = match env_name {
    "production" => { "debug": false, "workers": 8 },
    "staging" => { "debug": false, "workers": 2 },
    _ => { "debug": true, "workers": 1 },
}

println("${env_name}: debug=${settings:debug} workers=${settings:workers}")
```

Output when `APP_ENV` is unset:

```text
development: debug=true workers=1
```

Note the quoted keys: a `{ ... }` with bare identifier keys as a match-arm body is parsed as a block, so quote the keys (or wrap the map in parentheses).

## Validation

There is no exception mechanism, so validation returns a `(ok, message)` tuple that the caller destructures:

```suji
import std:println

validate_config = |config| {
    match {
        !config::contains("port") => return (false, "port is required"),
        !config:port::is_number() => return (false, "port must be a number"),
        config:port < 1 => return (false, "port must be >= 1"),
        config:port > 65535 => return (false, "port must be <= 65535"),
    }

    return (true, nil)
}

ok, message = validate_config({ port: 8080 })
println("${ok} ${message}")  # true nil

ok2, message2 = validate_config({ port: "8080" })
println("${ok2} ${message2}")  # false port must be a number
```

Since a runtime error terminates the process, check `::contains` before reading a key and `::is_number()` before comparing — the order of the arms matters.

## Merging

`map::merge` mutates its receiver. When you need the original left untouched, copy first:

```suji
import std:println

merge = |base, override| {
    out = base       # maps are copied on assignment
    out::merge(override)
    out
}

defaults = { port: 8080, log_level: "info" }
overrides = { port: 9000 }

merged = merge(defaults, overrides)
println(merged)    # {port: 9000, log_level: info}
println(defaults)  # {port: 8080, log_level: info}
```

For a deep merge, recurse when both sides hold a map:

```suji
import std:println

deep_merge = |base, override| {
    out = base
    loop through override with key, value {
        old = out::get(key, nil)
        out[key] = match {
            old::is_map() && value::is_map() => deep_merge(old, value),
            _ => value,
        }
    }
    out
}

result = deep_merge(
    { server: { host: "localhost", port: 8080 }, debug: false },
    { server: { port: 9000 } },
)

println(result)  # {server: {host: localhost, port: 9000}, debug: false}
```

## Type-Safe Access

Configuration values that arrive from files or the environment are often strings. Check the type before using them, and fall back to a default:

```suji
import std:println

get_port = |config| {
    port = config::get("port", nil)
    match {
        port::is_number() => port,
        port::is_string() && port ~ /^\d+$/ => port::to_number(),
        _ => 8080,
    }
}

println(get_port({ port: 3000 }))      # 3000
println(get_port({ port: "3000" }))    # 3000
println(get_port({ port: "http" }))    # 8080
println(get_port({}))                  # 8080
```

`::to_number()` on a non-numeric string is a runtime error, which is why the regex guard comes first.

## See Also

- [Environment Module](../stdlib/env.md)
- [JSON Module](../stdlib/data-formats/json.md)
- [Maps](../fundamentals/data-types/maps.md)
- [Scripting Recipes](scripting.md)
