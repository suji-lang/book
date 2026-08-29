# Shell Integration Best Practices

Suji can execute shell commands using backticks (`` `...` ``). This is powerful, but you should treat shell execution as an unsafe boundary: validate inputs, quote carefully, and prefer stdlib modules when they exist.

## Basics

A backtick template is sent to the shell and evaluates to the command's **standard output with one trailing newline trimmed**:

```suji
import std:println

name = "world"
out = `echo hello ${name}`

println(out)              # hello world
println(out::length())    # 11
```

The length of `11` is the point: `echo` emitted `hello world\n`, and the newline was trimmed. Only *one* trailing newline is removed, so a command that emits blank lines at the end keeps all but the last:

```suji
import std:println

out = `printf 'x\n\n\n'`
println(out::length())    # 3
```

### stderr is not captured

The value is stdout only. Anything the command writes to stderr goes straight to your terminal. Redirect it into stdout when you want it:

```suji
import std:println

out = `ls /definitely/not/here 2>&1 || true`
println(out::contains("No such file"))    # true
```

## Interpolation

`${expr}` works inside backticks exactly as it does in a string:

```suji
import std:println

dir = `mktemp -d`
`printf 'alpha\nbeta\n' > "${dir}/data.txt"`

println(`wc -l < "${dir}/data.txt"`::trim())    # 2
println(`cat "${dir}/data.txt"`)
# alpha
# beta
```

### Always quote what you interpolate

Interpolation is textual substitution performed *before* the shell parses the command, so an interpolated value containing shell metacharacters becomes shell syntax:

```suji
import std:println

untrusted = "safe; echo INJECTED"

println(`echo ${untrusted}`)
# safe
# INJECTED
```

The `;` started a second command. Double quotes around the interpolation stop that, and also handle spaces in filenames:

```suji
import std:println

untrusted = "safe; echo INJECTED"

println(`echo "${untrusted}"`)    # safe; echo INJECTED
```

Guidelines for anything you did not produce yourself — command-line arguments, environment variables, file contents, parsed data:

- Wrap every interpolation in double quotes: `` `ls "${dir}"` ``
- Validate first when the value must have a known shape (`value ~ /^[a-zA-Z0-9_-]+$/`)
- Remember that a value containing a `"` can still break out of double quotes
- Prefer a stdlib function over a shell command whenever one exists

## Failure Behavior

**A command that exits non-zero is a fatal runtime error.** The script prints a `[406] Shell command failed` diagnostic and exits with status 1. There is no way to read the exit status, and no way to recover — Suji has no `try`/`catch`.

```text
[406] Error: Shell command failed
   ╭─[ script.si:2:9 ]
   │
 2 │ println(`false`)
   │         ┬
   │         ╰── Shell command 'false' failed with exit code 1:
   │
   │ Note 1: Shell commands use backticks: `command`. Check the command syntax and permissions
───╯
Error: Shell command failed: Shell command 'false' failed with exit code 1:
```

That default is often what you want in a script: a failed step stops everything. When it is not, handle the failure **in the shell** and turn the outcome into a string you can match on.

### `|| true` to ignore a failure

```suji
import std:println

out = `grep nonexistent-pattern /etc/hosts || true`
println("[" + out + "]")    # []
```

`grep` exits 1 when it matches nothing; `|| true` makes the whole command succeed and yields an empty string.

### `&& echo` / `|| echo` to capture a status

```suji
import std:println

path = `mktemp`
status = `test -s "${path}" && echo nonempty || echo empty`

println(match status {
    "nonempty" => "has content",
    "empty" => "is empty",
    _ => "unknown",
})    # is empty
```

This is the standard way to ask a yes/no question of the filesystem, since `io:open` on a missing file is itself fatal:

```suji
import std:println

path = `mktemp`
exists = `test -f "${path}" && echo yes || echo no`

println(match exists {
    "yes" => "found",
    _ => "missing",
})    # found
```

### Choose your failure mode deliberately

- Want a failed command to stop the script? Do nothing — that is the default.
- Want to continue regardless? Append `|| true`.
- Want to branch? Append `&& echo ok || echo fail` and `match` on the result.

## Trailing newline behavior

- **Standalone** backticks trim one trailing newline from stdout.
- Backticks **inside a `|` pipeline** do **not** trim trailing newlines; pipe stages operate on raw bytes.

```suji
import std:println

standalone = `echo hi`
piped = `echo hi` | `cat`

println(standalone::length())    # 2
println(piped::length())         # 3
```

Use `::trim()` when a pipeline result feeds into string comparisons or `to_number()`.

## Streaming pipelines (`|`)

Use `|` to connect stdout of one stage to stdin of the next. Each stage must be either:

- an **invocation** (e.g. `producer()` / `sink()`), or
- a backtick command (e.g. `` `grep foo` ``)

Passing a bare function name is an error: `` `echo hi` | up `` raises `Pipe requires function invocations`. Write `up()`.

```suji
import std:io
import std:println

producer = || {
    println("alpha")
    println("beta")
    println("gamma")
}

collector = || {
    lines = io:stdin::read_lines()
    lines::join(",")
}

out = producer() | `grep beta` | collector()
println(out)  # beta
```

A closure stage reads its input from `io:stdin` — `read_lines()` for a list of lines, `read_all()` for the whole text — and whatever it prints becomes the next stage's input.

```suji
import std:io
import std:println

shout = || io:stdin::read_all()::trim()::upper()

println(`printf 'a\nb\n'` | shout())
# A
# B
```

Shell-only pipelines work too, and are often the clearest way to express a text transformation:

```suji
import std:println

words = `echo "the quick brown fox"` | `tr ' ' '\n'` | `sort`
println(words::trim())
# brown
# fox
# quick
# the
```

A non-zero exit anywhere in the pipeline is still fatal, so add `|| true` to the stage that may legitimately find nothing.

## Prefer stdlib for "local" tasks

Reaching for the shell has real costs: a process spawn per command, quoting hazards, and platform differences between macOS and Linux. Use the standard library when it covers the job:

- **files/streams**: `std:io` (`io:open`, `io:stdin`, `io:stdout`, `io:stderr`)
- **filesystem metadata + ops**: `std:os` (`os:stat`, `os:mkdir`, `os:rm`, `os:rmdir`)
- **paths**: `std:path` (`path:join`, `path:dirname`, `path:basename`, `path:extname`)
- **environment**: `std:env` (`env:var`, `env:args`)
- **parsing structured data**: `std:json`, `std:yaml`, `std:toml`, `std:csv`

```suji
import std:println
import std:io
import std:path

file = `mktemp`

# Shell round-trip
`printf 'from shell\n' > "${file}"`

# Same job, no subprocess
f = io:open(file, true, true)
f::write("from stdlib\n")
f::close()

g = io:open(file)
println(g::read_all()::trim())    # from stdlib
g::close()

# Path handling without calling out to dirname/basename
neighbour = path:join([path:dirname(file), "next"])
println(file::starts_with("/"))                  # true
println(neighbour::ends_with("/next"))           # true
```

For HTTP requests in this repo, use `curl`:

- [HTTP with curl](../cookbook/http.md)

## Common Patterns

**Capture a single value:**

```suji
import std:println

host = `hostname`
println(host::length() > 0)    # true
```

**Count something without a subprocess loop:**

```suji
import std:println

lines = `printf 'a\nb\nc\n'`::split("\n")
println(lines::length())    # 3
```

**Write a temp file, process it, clean up:**

```suji
import std:println
import std:os

path = `mktemp`
`printf '3\n1\n2\n' > "${path}"`

sorted = `sort -n "${path}"`
println(sorted::split("\n")::join(","))    # 1,2,3

os:rm(path)
println(`test -f "${path}" && echo yes || echo no`)    # no
```

## See Also

- [String Interpolation](string-interpolation.md) - building commands safely
- [Error Handling](error-handling.md) - why a non-zero exit ends the script
- [Streams](../fundamentals/data-types/streams.md) - `io:stdin` in pipeline stages
- [Pipe Operator](../fundamentals/operators/pipe.md)
- [OS Module](../stdlib/os.md) and [Path Module](../stdlib/path.md)
