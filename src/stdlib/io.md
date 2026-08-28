# I/O and Streams (`std:io`)

Open files and work with the standard streams.

## Overview

`std:io` exports one function and three stream values:

| Export | Kind | Description |
|---|---|---|
| `open(path, create = false, truncate = false)` | Function → Stream | Open a file for reading and writing |
| `stdin` | Stream | Standard input |
| `stdout` | Stream | Standard output |
| `stderr` | Stream | Standard error |

`stdin`, `stdout` and `stderr` are **values, not functions** — write
`io:stdout`, never `io:stdout()`.

There are no `io:read_file` / `io:write_file` helpers: reading a whole file means
opening a stream and calling `read_all()` on it.

## Quick Start

```suji
import std:io
import std:println

p = `mktemp`

f = io:open(p, true, true)   # create = true, truncate = true
f::write("first\nsecond\n")
f::close()

r = io:open(p)
println(r::read_all())
r::close()
```

## `open(path, create = false, truncate = false)`

Opens `path` and returns a stream. The stream is always readable **and**
writable.

- `create` — create the file when it does not exist. With `create = false`
  (the default) a missing file raises `Stream error: Failed to open '<path>'`.
- `truncate` — empty the file on open.

```suji
import std:io
import std:println

p = `mktemp`

# create and overwrite from scratch
out = io:open(p, true, true)
out::write("data\n")
out::close()

# read an existing file
r = io:open(p)
println(r::read_all())  # data
r::close()
```

Opening a file that does not exist without `create` terminates the program:

```suji
import std:io

# io:open("no-such-file.txt")
# Error: Stream error: Failed to open 'no-such-file.txt': No such file or directory
```

Since there is no way to trap a runtime error, test for the file first with a
shell command:

```suji
import std:io
import std:println

p = `mktemp`
exists = `test -e "${p}" && echo yes || echo no`

content = match exists {
    "yes" => {
        f = io:open(p)
        text = f::read_all()
        f::close()
        text
    }
    _ => { "" }
}

println(content::length())  # 0
```

## Stream Methods

All stream reads are **eager and blocking** — there are no lazy iterators.

| Method | Returns | Description |
|---|---|---|
| `read(chunk_kb = 8)` | String or nil | Read up to `chunk_kb` kilobytes from the current position; `nil` at end of input |
| `read_line()` | String or nil | Read one line without its newline; `nil` at end of input |
| `read_all()` | String | Read everything from the current position to end of input; `""` at end of input |
| `read_lines()` | List | Read the rest of the stream and split it into lines; `[]` at end of input |
| `write(text)` | Number | Write `text`, returns the number of bytes written |
| `is_terminal()` | Boolean | Whether the stream is attached to a terminal |
| `close()` | nil | Close the stream |
| `to_string()` | String | Display form of the stream |

### Reading Line by Line

`read_lines()` returns a list, which can then be iterated. A stream itself is
**not** iterable — `loop through f { … }` is a runtime error.

```suji
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("alpha\nbeta\ngamma\n")
f::close()

r = io:open(p)
loop through r::read_lines() with line {
    println(line::upper())
}
r::close()
```

`read_line()` reads one line at a time and returns `nil` once the input is
exhausted:

```suji
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("one\ntwo\n")
f::close()

r = io:open(p)
println(r::read_line())        # one
println(r::read_line())        # two
println(r::read_line() == nil) # true
r::close()
```

### Reading in Chunks

`read(chunk_kb)` reads at most `chunk_kb` kilobytes and advances the position,
which keeps memory use bounded for large files. It returns `nil` once the end of
input is reached, which is the signal to stop.

```suji
import std:io
import std:println

p = `mktemp`
`yes aaaaaaaaaa | head -n 2000 > "${p}"`

f = io:open(p)
total = 0
loop {
    chunk = f::read(4)
    match {
        chunk == nil => { break }
        _ => { total += chunk::length() }
    }
}
f::close()

println(total)  # 22000
```

### Writing

`write(text)` returns the number of bytes written and starts at the stream's
current position. **There is no append mode**: reopening a file and writing
overwrites from the beginning of the file rather than adding to the end.

```suji
import std:io
import std:println

p = `mktemp`

f = io:open(p, true, true)
f::write("abcdef")
f::close()

# writing again starts at offset 0 and overwrites in place
g = io:open(p)
println(g::write("XY"))  # 2
g::close()

r = io:open(p)
println(r::read_all())   # XYcdef
r::close()
```

To add to a file, read it, concatenate, then write the whole thing back with
`truncate = true`:

```suji
import std:io
import std:println

p = `mktemp`
first = io:open(p, true, true)
first::write("line 1\n")
first::close()

r = io:open(p)
existing = r::read_all()
r::close()

out = io:open(p, true, true)
out::write(existing + "line 2\n")
out::close()

check = io:open(p)
println(check::read_lines())  # [line 1, line 2]
check::close()
```

## The Standard Streams

`io:stdout` and `io:stderr` are writable; `io:stdin` is readable. They can be
passed as the second argument to `print` / `println`.

```suji
import std:io
import std:println

println("progress goes to stderr", io:stderr)
println("results go to stdout", io:stdout)
```

`is_terminal()` distinguishes an interactive run from a redirected or piped one:

```suji
import std:io
import std:println

interactive = io:stdout::is_terminal()
println(interactive::is_bool())  # true
```

### Reading Piped Input

A closure on the right of `|` receives the previous stage's output on `io:stdin`:

```suji
import std:io
import std:println

count_lines = || {
    lines = io:stdin::read_lines()
    println("lines: ${lines::length()}")
}

`printf 'alpha\nbeta\ngamma\n'` | count_lines()
```

`read_all()` grabs the whole piped payload at once:

```suji
import std:io
import std:println

shout = || {
    println(io:stdin::read_all()::trim()::upper())
}

`echo hello` | shout()
```

## Gotchas

- `io:open` never appends; use read-concatenate-rewrite as shown above.
- Any method call on a closed stream raises
  `Stream error: Operation on closed stream`.
- `read_all()` on `io:stdin` blocks until the input is closed, so avoid it in a
  program that is meant to run interactively without piped input.
- Reads are relative to the stream position, and each read type signals
  exhaustion differently: at end of input `read_all()` returns `""`,
  `read_lines()` returns `[]`, and `read(n)` / `read_line()` return `nil`.
- Streams are not iterable and have no `length()`; call `read_lines()` first.

## See Also

- [Print Functions](core.md)
- [Streams](../fundamentals/data-types/streams.md)
- [Operating System](os.md)
- [Paths](path.md)
- [Shell Integration Best Practices](../advanced/shell-integration.md)
