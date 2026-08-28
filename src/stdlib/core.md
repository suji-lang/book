# Print Functions (`std:print`, `std:println`)

Write text to standard output or to any stream.

## Overview

Printing is not built into the language — there is no prelude, so every program
that prints must import the function it uses:

- `println(text = "", out = nil)` → Number (bytes written)
- `print(text, out = nil)` → Number (bytes written, no trailing newline)

Both live directly under `std`, not inside a submodule:

```suji
import std:println
import std:print

print("Hello, ")
println("world!")
```

## Quick Start

```suji
import std:println

println("Hello, world!")
println(42)
println([1, 2, 3])
println()          # writes just a newline
```

## `println(text = "", out = nil)`

Writes `text` followed by a newline and returns the number of bytes written.

- `text` — any value. Non-string values are converted the same way
  `value::to_string()` converts them. Defaults to `""`, so `println()` prints an
  empty line.
- `out` — a stream to write to. `nil` (the default) means standard output.

```suji
import std:println

n = println("hi")
println(n)  # 3
```

Values are rendered without quotes, and maps and tuples use Suji's own display
form rather than JSON:

```suji
import std:println

println("text")            # text
println(true)              # true
println(nil)               # nil
println([1, 2, 3])         # [1, 2, 3]
println({"a": 1, "b": 2})  # {a: 1, b: 2}
println((1, 2))            # (1, 2)
```

For JSON output use [`std:json`](data-formats/json.md) instead:

```suji
import std:json
import std:println

println(json:generate({"a": 1, "b": 2}))  # {"a":1,"b":2}
```

## `print(text, out = nil)`

Writes `text` with **no** trailing newline and returns the number of bytes
written. Unlike `println`, `text` is required.

```suji
import std:print
import std:println

print("Loading")
print("...")
println(" done")  # Loading... done
```

## Writing to a Stream

Pass a stream as the second argument. `std:io` exposes the standard streams, and
`io:open` returns a writable stream for a file.

```suji
import std:io
import std:println

println("this goes to stderr", io:stderr)
println("this goes to stdout", io:stdout)
```

```suji
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
println("first line", f)
println("second line", f)
f::close()

r = io:open(p)
println(r::read_lines()::length())  # 2
r::close()
```

Because stderr is a separate stream, diagnostics can be kept out of a pipeline's
stdout:

```suji
import std:io
import std:println

report = |label, value| {
    println("processing ${label}", io:stderr)
    println(value)
}

report("row-1", 42)
```

## Interpolation Instead of Concatenation

`+` never mixes types, so build messages with `${...}` interpolation rather than
concatenating a string with a number:

```suji
import std:println

count = 3
println("found ${count} items")  # found 3 items
```

## Gotchas

- Nothing is imported implicitly. A snippet that calls `println` without
  `import std:println` fails with `Undefined variable: println`.
- `println` returns a number, so calling it as the last expression of a function
  makes that function return the byte count rather than `nil`.
- `print` has no default text: `print()` raises an arity mismatch.
- Output is not buffered per line by the language; interleaving `print` to
  stdout and stderr may not appear in source order when both are redirected to
  the same file.

## See Also

- [I/O and Streams](io.md)
- [Strings](../fundamentals/data-types/strings.md)
- [String Interpolation](../advanced/string-interpolation.md)
- [Standard Library Overview](README.md)
