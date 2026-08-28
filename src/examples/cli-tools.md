# Building CLI Tools

Create command-line utilities with argument parsing and user interaction.

## Overview

This example demonstrates:
- Reading command-line arguments
- Reading from stdin
- File processing
- User interaction
- Building practical CLI tools

## Prerequisites

- [Environment Module](../stdlib/env.md)
- [I/O and Streams](../stdlib/io.md)

## How Arguments Reach a Script

`env:args` is a **map-like value**, not a function and not a list. It is keyed by strings, with `"0"` intended to be the script path and `"1"` the first argument. Read it with `::get`, `::contains` and `::length()`:

```suji
import std:env
import std:println

println(env:args::length() >= 1)         # true
println(env:args::contains("1"))         # false when no argument was passed
println(env:args::get("1", "(default)")) # (default)
```

Three rules shape every Suji CLI:

- `env:args` is a value: `env:args::get("1", "")`, never `env:args()` or `env:args[1]`.
- Arguments starting with `-` are consumed by the interpreter and never reach the script. The interpreter's only flag is `--print-ast`; there is no `--help` or `--version` to imitate.
- Positional arguments are broken in 0.1.22: every argument overwrites key `"0"`, so `contains("1")` is always `false` and `"0"` holds the *last* argument rather than the script path. See [`std:env`](../stdlib/env.md#args-and-argv--command-line-arguments). Until it is fixed, take input from an environment variable or stdin and always provide a default. Every tool below is written that way.

## Complete Code: Word Counter

```suji
import std:env
import std:io
import std:os
import std:println

# Input: first argument, then WC_FILE, then a demo file.
from_args = env:args::get("1", "")
from_env = env:var::get("WC_FILE", "")

configured = match {
    from_args::length() > 0 => from_args,
    _ => from_env,
}

demo_mode = configured::length() == 0

source = match {
    demo_mode => {
        demo = `mktemp`
        f = io:open(demo, true, true)
        f::write("the quick brown fox\njumps over the lazy dog\n")
        f::close()
        demo
    }
    _ => configured,
}

# Validate before opening: io:open on a missing file terminates the script
match {
    `test -f "${source}" && echo yes || echo no` == "no" => {
        println("Usage: suji word_count.si <filename>  (or set WC_FILE)")
        os:exit(1)
    },
    _ => {},
}

file = io:open(source)
content = file::read_all()
file::close()

lines = content::split("\n")::filter(|l| l::length() > 0)
words = content::replace("\n", " ")::replace("\t", " ")::split(" ")::filter(|w| w::length() > 0)

println("Lines: ${lines::length()}")
println("Words: ${words::length()}")
println("Characters: ${content::length()}")

# Only the demo file is ours to delete
match {
    demo_mode => { os:rm(source) },
    _ => {},
}
```

Output:

```text
Lines: 2
Words: 9
Characters: 44
```

### 1. Resolve the Input

```suji
import std:env
import std:println

source = match {
    env:args::get("1", "")::length() > 0 => env:args::get("1", ""),
    env:var::contains("WC_FILE") => env:var::get("WC_FILE", ""),
    _ => "sample.txt",
}

println(source)  # sample.txt
```

A `match` with no matching arm evaluates to `nil`, so always finish with a `_` arm that supplies a default.

### 2. Validate Before Acting

```suji
import std:println

check = |path| match {
    `test -f "${path}" && echo yes || echo no` == "yes" => "readable",
    _ => "missing",
}

println(check("/etc/hosts"))      # readable
println(check("/no/such/file"))   # missing
```

`os:stat` on a missing path is a fatal error, not a `nil` — check with the shell first. There is no `try`/`catch` to fall back on.

### 3. Process the File

```suji
import std:io
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("alpha beta\ngamma\n")
f::close()

file = io:open(path)
content = file::read_all()
file::close()

words = content::replace("\n", " ")::split(" ")::filter(|w| w::length() > 0)
println("Words: ${words::length()}")  # Words: 3

os:rm(path)
```

### 4. Report Failure with an Exit Code

```suji
import std:os
import std:println

problems = []

match {
    problems::length() > 0 => {
        println("error: ${problems::join("; ")}")
        os:exit(1)
    },
    _ => {},
}

println("ok")  # ok
os:exit(0)
```

## Variation 1: Reading Piped Input

A CLI that reads stdin composes with the rest of the shell. Guard the read with `is_terminal()` so the tool does not hang when nothing is piped in:

```suji
import std:io
import std:println

# Usage: cat access.log | suji filter.si
lines = match io:stdin::is_terminal() {
    true => [],
    _ => io:stdin::read_lines(),
}

errors = lines::filter(|l| l ~ /ERROR/)

match {
    lines::length() == 0 => { println("no input; pipe a file into this script") },
    _ => { println("${errors::length()} of ${lines::length()} lines matched") },
}
```

Output when run with no piped input:

```text
no input; pipe a file into this script
```

To prompt interactively, print the question with `std:print` (no trailing newline) and read one line:

```suji
import std:io
import std:print
import std:println

ask = |question, fallback| match io:stdin::is_terminal() {
    false => fallback,
    _ => {
        print(question)
        answer = io:stdin::read_line()
        match {
            answer == nil => fallback,
            answer::trim()::length() == 0 => fallback,
            _ => answer::trim(),
        }
    }
}

pattern = ask("Search pattern: ", "ERROR")
println("searching for ${pattern}")  # searching for ERROR
```

## Variation 2: File Converter

```suji
import std:io
import std:json
import std:os
import std:println
import std:yaml

# Sample input
input_file = "${os:tmp_dir()}/convert-demo.json"
f = io:open(input_file, true, true)
f::write("""{"service": "api", "port": 8080}""")
f::close()

output_file = "${os:tmp_dir()}/convert-demo.yaml"

extension = |name| {
    parts = name::split(".")
    parts[parts::length() - 1]
}

convert_file = |input, output| {
    file = io:open(input)
    content = file::read_all()
    file::close()

    data = match extension(input) {
        "json" => json:parse(content),
        "yaml" | "yml" => yaml:parse(content),
        _ => {
            println("Unsupported input format: ${extension(input)}")
            os:exit(1)
        },
    }

    text = match extension(output) {
        "json" => json:generate(data),
        "yaml" | "yml" => yaml:generate(data),
        _ => {
            println("Unsupported output format: ${extension(output)}")
            os:exit(1)
        },
    }

    out = io:open(output, true, true)  # create=true, truncate=true
    out::write(text)
    out::close()

    println("Converted ${extension(input)} -> ${extension(output)}")
}

convert_file(input_file, output_file)
println(`cat ${output_file}`)

os:rm(input_file)
os:rm(output_file)
```

Output:

```text
Converted json -> yaml
port: 8080
service: api
```

## Variation 3: Task Runner

```suji
import std:env
import std:io
import std:json
import std:os
import std:println

# Sample tasks.json
tasks_file = "${os:tmp_dir()}/tasks-demo.json"
f = io:open(tasks_file, true, true)
f::write("""{
  "tasks": {
    "greet": {"commands": ["echo hello", "echo world"]},
    "list": {"commands": ["printf 'one\\ntwo\\n' | wc -l"]}
  }
}""")
f::close()

load_tasks = |path| {
    match {
        `test -f "${path}" && echo yes || echo no` == "no" => {
            println("Error: ${path} not found")
            os:exit(1)
        },
        _ => {},
    }

    file = io:open(path)
    config = json:parse(file::read_all())
    file::close()
    config:tasks
}

run_task = |tasks, task_name| {
    match {
        tasks::contains(task_name) == false => {
            println("Error: task '${task_name}' not found")
            println("Available tasks:")
            loop through tasks with name, task {
                println("  - ${name} (${task:commands::length()} commands)")
            }
            os:exit(1)
        },
        _ => {},
    }

    println("Running task: ${task_name}")
    loop through tasks::get(task_name, nil):commands with cmd {
        println("  $ ${cmd}")
        # A command that exits non-zero aborts the script; append `|| true`
        # to keep going after a failure.
        println("  ${`${cmd}`}")
    }
    println("Task completed")
}

tasks = load_tasks(tasks_file)
task_name = env:args::get("1", "greet")  # falls back to the default task
run_task(tasks, task_name)

os:rm(tasks_file)
```

Output:

```text
Running task: greet
  $ echo hello
  hello
  $ echo world
  world
Task completed
```

Because there is no way to inspect a command's exit status, a task runner either lets a failing command abort the whole run (often what you want) or appends `|| true` to every command and checks the output itself.

## Complete Example: Log Analyzer

Options come from environment variables rather than flags, since `-`-prefixed arguments never reach a Suji script:

```suji
import std:env
import std:io
import std:os
import std:println

# Sample log file
log_file = "${os:tmp_dir()}/analyzer-demo.log"
f = io:open(log_file, true, true)
f::write("""[2024-01-15 10:30:00] ERROR: Database connection failed
[2024-01-15 10:30:05] WARN: Retry scheduled
[2024-01-15 10:30:06] INFO: Health check passed
[2024-01-15 10:31:00] ERROR: Database connection failed
""")
f::close()

options = {
    "file": env:var::get("LOG_FILE", log_file),
    "level": env:var::get("LOG_LEVEL", "ERROR"),
    "count": env:var::get("LOG_COUNT", "10")::to_number(),
}

parse_entry = |line| {
    close = line::index_of("]")
    close < 0 && return nil

    rest = line[(close + 2);]
    sep = rest::index_of(": ")
    sep < 0 && return nil

    {
        "timestamp": line[1;close],
        "level": rest[0;sep],
        "message": rest[(sep + 2);],
    }
}

analyze = |options| {
    match {
        `test -f "${options:file}" && echo yes || echo no` == "no" => {
            println("Error: file not found: ${options:file}")
            os:exit(1)
        },
        _ => {},
    }

    file = io:open(options:file)
    lines = file::read_lines()
    file::close()

    entries = []
    loop through lines with line {
        entry = parse_entry(line)
        match {
            entry == nil => {},
            entry:level == options:level => { entries::push(entry) },
            _ => {},
        }
    }

    println("Found ${entries::length()} ${options:level} entries in ${lines::length()} lines")

    shown = 0
    loop through entries with entry {
        shown >= options:count && break
        println("[${entry:timestamp}] ${entry:message}")
        shown++
    }
}

analyze(options)

os:rm(log_file)
```

Output:

```text
Found 2 ERROR entries in 4 lines
[2024-01-15 10:30:00] Database connection failed
[2024-01-15 10:31:00] Database connection failed
```

Usage:

```bash
# Defaults
suji log_analyzer.si

# Point it at a different file and level
LOG_FILE=/var/log/app.log LOG_LEVEL=WARN LOG_COUNT=20 suji log_analyzer.si

# Or feed it through a pipe and read stdin instead
cat /var/log/app.log | suji log_analyzer.si
```

## Exercises

### Beginner
1. Create a file size reporter using `os:stat(path):size`
2. Build a grep clone that filters stdin against a regex
3. Make a utility that renames every `.txt` file in a directory to `.md`

### Intermediate
4. Implement a CSV column selector driven by a `COLUMNS` environment variable
5. Build a markdown to HTML converter that reads stdin and writes stdout
6. Add a `--verbose`-style toggle using an environment variable (`VERBOSE=1`)

### Advanced
7. Build a log analyzer that groups entries by level and prints a summary table
8. Create a file synchronisation tool on top of `rsync` invocations
9. Write a task runner that reads its tasks from YAML and reports per-task timings

## Best Practices

### DO:
- Print a usage line when required input is missing, then `os:exit(1)`
- Validate paths with `test -f` before opening them
- Give every option a default, since a missing key raises an error
- Read configuration from environment variables — flags cannot reach the script
- Guard `io:stdin` reads with `is_terminal()` so the tool never hangs

### DON'T:
- Call `env:args()` — it is a value, not a function
- Rely on `--flag` arguments; the interpreter consumes them
- Assume a failing command can be caught: a non-zero exit ends the script
- Print errors to stdout when they belong on stderr (`print(msg, io:stderr)`)
- Leave temp files behind; clean up with `os:rm`

## See Also

- [Environment Module](../stdlib/env.md)
- [Operating System](../stdlib/os.md)
- [I/O and Streams](../stdlib/io.md)
- [Scripting Recipes](../cookbook/scripting.md)
