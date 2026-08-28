# Scripting Recipes

Suji is a good glue language: shell commands are part of the syntax, and the standard library covers arguments, environment variables, files, JSON and time. This page collects the patterns you need for day-to-day automation.

Run a script with `suji script.si`. The only other flag is `--print-ast`; everything else your script needs comes from arguments, the environment or stdin.

## Script Arguments

`env:args` is a **value**, not a function — a map-like object keyed by the strings `"0"`, `"1"`, `"2"` and so on, where `"0"` is meant to be the script path. Read it with `::get`, `::contains` and `::length()`:

```suji
import std:env
import std:println

target = env:args::get("1", "")

message = match {
    target::length() == 0 => "usage: report.si <path>",
    _ => "processing ${target}",
}

println(message)  # usage: report.si <path>
```

Two things to know before designing a command line:

- Arguments that start with `-` are consumed by the interpreter and never reach the script, so a Suji script cannot take `--flag` style options. Use positional arguments or environment variables instead.
- Positional arguments are broken in 0.1.22. Every argument overwrites key `"0"`, so `env:args` always holds exactly one entry — the script path when no arguments are given, and otherwise the *last* argument — and `env:args::contains("1")` is always `false`. See [`std:env`](../stdlib/env.md#args-and-argv--command-line-arguments). Until it is fixed, take input from an environment variable or stdin, and always supply a fallback as the recipe above does.

## Reading Standard Input

`io:stdin` is a stream. `read_lines()` drains it into a list, `read_all()` into one string, and `read_line()` reads a single line (`nil` at end of input). All reads are blocking, so guard interactive scripts with `is_terminal()`:

```suji
import std:io
import std:println

# Usage: cat access.log | suji count.si
lines = match io:stdin::is_terminal() {
    true => [],  # nothing piped in — do not block waiting for a human
    _ => io:stdin::read_lines(),
}

errors = lines::filter(|l| l ~ /ERROR/)

println("read ${lines::length()} lines")  # read 0 lines
println("errors: ${errors::length()}")    # errors: 0
```

To prompt a user, write the question first — `io:print` does not add a newline:

```suji
import std:io
import std:println

ask = |question, fallback| {
    !io:stdin::is_terminal() && return fallback

    io:print(question)

    answer = io:stdin::read_line()
    answer == nil && return fallback

    trimmed = answer::trim()
    match {
        trimmed::length() == 0 => fallback,
        _ => trimmed,
    }
}

name = ask("Your name: ", "anonymous")
println("hello ${name}")  # hello anonymous
```

## Environment Variables

`env:var` is a map-like value too. Reading a missing variable with `:NAME` raises an error, so use `::get` with a default:

```suji
import std:env
import std:println

log_level = env:var::get("LOG_LEVEL", "info")
println("log level: ${log_level}")  # log level: info

# Assignments are visible to commands this script runs
env:var["GREETING"] = "hei"
println(`echo $GREETING`)  # hei

println(env:var::contains("HOME"))  # true
```

For per-project settings, `dotenv:load(path)` reads a `.env` file into `env:var` and returns what it loaded.

## Running Shell Commands

A backtick template runs its command through the shell and evaluates to stdout with the trailing newline trimmed. `${...}` interpolation works inside:

```suji
import std:println

name = "world"
println(`echo hello ${name}`)  # hello world

# A whole shell pipeline is fine inside one template
count = `printf 'a\nb\nc\n' | wc -l`::trim()::to_number()
println(count)  # 3
```

**A command that exits non-zero is a fatal error** — the script stops and there is nothing to catch it with. Make the shell return a value instead of an exit status:

```suji
import std:println

# `|| true` swallows the failure and yields an empty string
output = `grep nothing-here /etc/hosts || true`
println(output::length())  # 0

# `&& echo / || echo` turns a test into a string you can match on
state = `test -d /etc && echo present || echo missing`
println(state)  # present

exists = |path| `test -e "${path}" && echo yes || echo no` == "yes"
println(exists("/etc/hosts"))  # true
```

Only stdout is captured; redirect with `2>&1` if you need stderr, and always quote interpolated paths (`"${path}"`) so spaces do not split into extra arguments.

## Pipelines

The `|` operator pipes between closures and shell templates. A closure that reads piped input uses `io:stdin::read_lines()` or `read_all()`; a closure that produces output just prints:

```suji
import std:io
import std:println

produce = || {
    println("alpha")
    println("beta")
    println("gamma")
}

summarize = || {
    lines = io:stdin::read_lines()
    println("${lines::length()} lines, sorted: ${lines::join(",")}")
}

produce() | `sort` | summarize()

matches = produce() | `grep -c ma`
println("matched ${matches::trim()}")
```

Output:

```text
3 lines, sorted: alpha,beta,gamma
matched 1
```

Unlike a plain backtick command, the value of a pipeline keeps its trailing newline — hence the `::trim()`.

## Temp Files and Cleanup

`mktemp` is the simplest way to get a scratch path; `io:open(path, true, true)` creates and truncates it, and `os:rm` / `os:rmdir` clean up:

```suji
import std:io
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)  # create=true, truncate=true
f::write("first\nsecond\n")
f::close()

reader = io:open(path)
lines = reader::read_lines()
reader::close()
println(lines::length())  # 2

dir = `mktemp -d`
`touch ${dir}/a.txt ${dir}/b.txt`
println(`ls -1 ${dir}`::split("\n")::length())  # 2

os:rm(path)
`rm -rf ${dir}`
```

`os:tmp_dir()`, `os:home_dir()` and `os:work_dir()` give you the usual base directories when you would rather build the path yourself.

## Exiting With a Status Code

`os:exit(code)` ends the script immediately. Use it to report failure to whatever called your script:

```suji
import std:os
import std:println

checks = [
    { name: "config readable", ok: true },
    { name: "port free", ok: true },
]

failed = checks::filter(|c| !c:ok)

match {
    failed::length() > 0 => {
        println("FAIL: ${failed::map(|c| c:name)::join(", ")}")
        os:exit(1)
    }
}

println("all ${checks::length()} checks passed")  # all 2 checks passed
os:exit(0)
```

Since there is no exception handling, `os:exit(1)` after printing a message *is* the error handling strategy for scripts.

## Retry and Poll Loops

Combine `loop`, a counter and `time:sleep(ms)`. Always cap the attempts — an unbounded retry loop has no way to be interrupted from inside the language:

```suji
import std:println
import std:time

wait_for = |max_attempts, delay_ms| {
    attempt = 0
    loop {
        attempt++

        # Stand-in for a real health check, e.g.
        #   `curl -fsS -o /dev/null ${url} && echo up || echo down`
        state = `test ${attempt} -ge 3 && echo up || echo down`

        state == "up" && break
        attempt >= max_attempts && break

        time:sleep(delay_ms)
    }
    attempt
}

attempts = wait_for(10, 20)
println("ready after ${attempts} attempts")  # ready after 3 attempts
```

The same shape works for polling a file (`test -f`), a lock, or a queue length.

## Worked Example: Backup Script

A complete script that collects matching files, archives them, verifies the archive and reports a status code — using every pattern above.

```suji
import std:env
import std:io
import std:os
import std:println
import std:time

# Source directory: first argument, then BACKUP_SRC, then a demo directory.
arg = env:args::get("1", "")
configured = match {
    arg::length() > 0 => arg,
    _ => env:var::get("BACKUP_SRC", ""),
}

demo_mode = configured::length() == 0

source = match {
    demo_mode => {
        demo = `mktemp -d`
        `touch ${demo}/notes.txt ${demo}/todo.txt ${demo}/image.png`
        demo
    }
    _ => configured,
}

files = `find ${source} -type f -name '*.txt'`
    ::split("\n")
    ::filter(|p| p::length() > 0)

match {
    files::length() == 0 => {
        println("nothing to back up in ${source}")
        os:exit(0)
    }
}

stamp = time:now():epoch_ms
archive = "${os:tmp_dir()}/backup-${stamp}.tar.gz"
names = files::map(|p| p::split("/")::last(""))

`tar -czf ${archive} -C ${source} ${names::join(" ")}`

ok = `test -s "${archive}" && echo yes || echo no` == "yes"
size = match {
    ok => os:stat(archive):size,
    _ => 0,
}

println("archived ${files::length()} files")
println("archive created: ${ok}")
println("archive is non-empty: ${size > 0}")

# Clean up: never delete a directory the caller asked us to back up
os:rm(archive)
match { demo_mode => { `rm -rf ${source}` } }

os:exit(0)
```

Output:

```text
archived 2 files
archive created: true
archive is non-empty: true
```

## See Also

- [Environment Module](../stdlib/env.md)
- [I/O and Streams](../stdlib/io.md)
- [File Processing Recipes](file-processing.md)
- [CLI Tools Example](../examples/cli-tools.md)
