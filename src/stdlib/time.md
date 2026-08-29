# Time and Dates (`std:time`)

Read the clock, convert between epoch milliseconds and ISO 8601 text, and sleep.

## Overview

`std:time` exports four functions:

| Function | Returns | Description |
|---|---|---|
| `now()` | Map `{epoch_ms, iso, tz}` | The current instant |
| `sleep(ms)` | nil | Block for `ms` milliseconds |
| `parse_iso(text)` | Map `{epoch_ms, tz}` | Parse an ISO 8601 / RFC 3339 timestamp |
| `format_iso(epoch_ms, tz = "Z")` | String | Format epoch milliseconds |

Timestamps are **epoch milliseconds** — a plain number. There is no date value
type, no calendar arithmetic, no `time:format` and no strftime-style patterns.

## Quick Start

```suji
import std:time
import std:println

now = time:now()
println(now:epoch_ms::is_number())  # true
println(now:tz)                     # Z

parsed = time:parse_iso("2023-11-10T15:30:00.000Z")
println(parsed:epoch_ms)                     # 1699630200000
println(time:format_iso(parsed:epoch_ms))    # 2023-11-10T15:30:00.000Z
```

## `now()`

Returns a map with three fields:

| Field | Type | Description |
|---|---|---|
| `epoch_ms` | Number | Milliseconds since the Unix epoch |
| `iso` | String | UTC timestamp with milliseconds, e.g. `2023-11-10T15:30:00.000Z` |
| `tz` | String | Always `"Z"` — `now()` reports UTC |

```suji
import std:time
import std:println

now = time:now()

println(now::keys())            # [epoch_ms, iso, tz]
println(now:iso::length())      # 24
println(now:iso::ends_with("Z"))  # true
println(now:epoch_ms > 1700000000000)  # true
```

`now()` is the timing primitive for measuring elapsed work — `os:uptime_ms()` has
only whole-second resolution:

```suji
import std:time
import std:println

started = time:now():epoch_ms
time:sleep(50)
elapsed = time:now():epoch_ms - started

println(elapsed >= 50)  # true
```

## `sleep(ms)`

Blocks for `ms` milliseconds and returns `nil`. `ms` must be a non-negative
integer: a fraction raises
`Type error: time:sleep requires a non-negative integer milliseconds`, and a
negative value raises `Invalid operation: time:sleep requires non-negative
duration`.

```suji
import std:time
import std:println

time:sleep(100)
println("waited")  # waited
```

A simple retry-with-backoff loop:

```suji
import std:time
import std:println

attempt = 0
result = nil
loop {
    attempt++
    result = `echo ok`
    match {
        result == "ok" => { break }
        attempt >= 3 => { break }
        _ => { time:sleep(50 * attempt) }
    }
}

println("${result} after ${attempt}")  # ok after 1
```

## `parse_iso(text)`

Parses an ISO 8601 / RFC 3339 timestamp and returns `{epoch_ms, tz}`. The
`epoch_ms` value is always UTC; `tz` reports the offset that appeared in the
input, normalised so that a trailing `Z` becomes `"+00:00"`.

```suji
import std:time
import std:println

utc = time:parse_iso("2023-11-10T15:30:00.000Z")
println(utc:epoch_ms)  # 1699630200000
println(utc:tz)        # +00:00

offset = time:parse_iso("2023-11-10T15:30:00.000+05:00")
println(offset:epoch_ms)  # 1699612200000
println(offset:tz)        # +05:00
```

Milliseconds are optional in the input:

```suji
import std:time
import std:println

println(time:parse_iso("2023-11-10T15:30:00Z"):epoch_ms)      # 1699630200000
println(time:parse_iso("2023-11-10T15:30:00.123Z"):epoch_ms)  # 1699630200123
```

Unparsable text raises `Invalid operation: Invalid ISO-8601 time` and terminates
the program, so validate untrusted input before parsing:

```suji
import std:time
import std:println

parse_safe = |text| match {
    text ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}T/ => time:parse_iso(text):epoch_ms,
    _ => nil,
}

println(parse_safe("2023-11-10T15:30:00Z"))  # 1699630200000
println(parse_safe("not a date") == nil)     # true
```

## `format_iso(epoch_ms, tz = "Z")`

Formats epoch milliseconds as an ISO 8601 string with milliseconds. `tz` is
either `"Z"` (the default, meaning UTC) or an offset such as `"+02:00"` or
`"-07:00"`; the wall-clock part is shifted accordingly. An unrecognised offset
raises `Invalid operation: invalid tz offset`.

```suji
import std:time
import std:println

epoch_ms = 1699630200000

println(time:format_iso(epoch_ms))             # 2023-11-10T15:30:00.000Z
println(time:format_iso(epoch_ms, "+02:00"))   # 2023-11-10T17:30:00.000+02:00
println(time:format_iso(epoch_ms, "-07:00"))   # 2023-11-10T08:30:00.000-07:00
println(time:format_iso(0))                    # 1970-01-01T00:00:00.000Z
```

## Arithmetic on Timestamps

Because timestamps are numbers, offsets are ordinary arithmetic:

```suji
import std:time
import std:println

second = 1000
minute = 60 * second
hour = 60 * minute
day = 24 * hour

start = time:parse_iso("2023-11-10T15:30:00.000Z"):epoch_ms

println(time:format_iso(start + hour))       # 2023-11-10T16:30:00.000Z
println(time:format_iso(start + 7 * day))    # 2023-11-17T15:30:00.000Z
println((start - (start - 90 * second)) / second)  # 90
```

Durations are easier to read when formatted yourself:

```suji
import std:println

humanize = |ms| {
    total_seconds = (ms / 1000)::floor()
    minutes = (total_seconds / 60)::floor()
    seconds = total_seconds % 60
    "${minutes}m ${seconds}s"
}

println(humanize(185000))  # 3m 5s
```

## Timestamping Output

```suji
import std:time
import std:println

log = |message| println("[${time:now():iso}] ${message}")

log("started")
println(time:format_iso(time:parse_iso(time:now():iso):epoch_ms)::ends_with("Z"))  # true
```

Date-only strings for filenames come from slicing the ISO text:

```suji
import std:time
import std:println

iso = time:format_iso(1699630200000)
println(iso[0;10])   # 2023-11-10
println(iso[11;19])  # 15:30:00
```

## Gotchas

- There is no formatting language: build custom layouts by slicing the ISO string
  or by doing arithmetic on `epoch_ms`.
- `now():tz` is always `"Z"`; the module never reports the machine's local
  timezone.
- `format_iso` shifts the displayed wall clock for an offset but always describes
  the same instant.
- `sleep` requires an integer; `time:sleep(0.5)` is a type error.
- Parse and offset errors terminate the program.

## See Also

- [Operating System](os.md)
- [Strings](../fundamentals/data-types/strings.md)
- [Numbers](../fundamentals/data-types/numbers.md)
- [TOML](data-formats/toml.md)
