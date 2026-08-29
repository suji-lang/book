# Streams

Streams represent readable/writable handles (files, stdin/stdout/stderr).

All stream reads are **eager and blocking**: `read_all()` and `read_lines()`
return the whole contents as a string or a list of strings. There are no lazy
iterators, and a stream is not itself iterable — `loop through some_stream` fails
with a runtime error. Iterate `stream::read_lines()` instead.

## Getting streams

```suji
import std:io
import std:println

stdin = io:stdin
stdout = io:stdout
stderr = io:stderr

println(stdout::is_stream())  # true
```

Open a file. `io:open(path, create = false, truncate = false)` raises a runtime
error if the file does not exist and `create` is `false`:

```suji
import std:io
import std:println

path = `mktemp`

# create = true, truncate = true
f = io:open(path, true, true)
f::close()

# Now it exists, so a plain open works
f = io:open(path)
println(f::read_all())  # (empty file)
f::close()

`rm -f ${path}`
```

## Methods

Streams support:

- `stream::read(chunk_kb=8)` → String | nil
- `stream::read_line()` → String | nil
- `stream::read_all()` → String
- `stream::read_lines()` → List[String]
- `stream::write(text)` → Number (bytes written)
- `stream::is_terminal()` → boolean
- `stream::close()` → nil
- `stream::to_string()` → String

That is the complete list. There is no `seek`, no `flush`, no `each_line`, and no
`io:read_file` / `io:write_file` convenience function.

## Examples

### Write a file

```suji
import std:io
import std:println

path = `mktemp`

out = io:open(path, true, true)
println(out::write("Report\n"))  # 7 (bytes written)
out::write("======\n")
out::close()

`rm -f ${path}`
```

### Read line by line

`read_lines()` reads the whole file up front and gives you a list, which you then
loop over:

```suji
import std:io
import std:println

path = `mktemp`
out = io:open(path, true, true)
out::write("first\n\nsecond\n")
out::close()

f = io:open(path)
loop through f::read_lines() with line {
    match { line::trim()::length() > 0 => println(line), _ => nil, }
}
f::close()
# first
# second

`rm -f ${path}`
```

Note the comma after the final `_ => nil` arm: a match arm whose body is a bare
expression always needs a trailing comma, including the last one.

### Writing to stderr

`std:print` and `std:println` take an optional stream as their second argument:

```suji
import std:io
import std:println

println("this goes to stderr", io:stderr)
println("this goes to stdout")
```

## See Also

- [Strings](strings.md)
- [io Module](../../stdlib/io.md)
- [Shell Integration](../../advanced/shell-integration.md)
