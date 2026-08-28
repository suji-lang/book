# CLI & REPL

The `suji` binary does two things: it runs a program file, or it opens an
interactive REPL. This chapter covers both, plus the handful of flags that exist.

## Running a program

```bash
suji script.si
```

Create `greet.si`:

```suji
import std:println

println("Hello from Suji!")
```

Run it:

```bash
suji greet.si
```

```text
Hello from Suji!
```

Relative imports inside the script resolve against the script's own directory,
so you can run it from anywhere.

## Command-line flags

Suji's CLI is deliberately tiny. There is **no** `--help`, `--version`, `-e` or
`-c` flag; the complete set of options is:

| Option | Description |
|--------|-------------|
| `<file>` | Execute a Suji program |
| (no arguments) | Start the REPL |
| `--print-ast` | Parse the file and print the abstract syntax tree instead of running it |

`--print-ast` is a development aid rather than something you need day to day.

```bash
suji --print-ast greet.si        # inspect the parse tree
```

## Exit status

Suji exits with `0` on success and `1` for any diagnosed failure — lexer, parser
or runtime. There are no finer-grained diagnostic codes, and a runtime error
always terminates the program, since Suji has no error-handling construct. Two
failures skip the diagnostic entirely and abort with a Rust panic instead:
numeric overflow exits `101` and a stack overflow exits `134`.

```bash
if suji script.si; then
    echo "Success"
else
    echo "Failed"
fi
```

Your program can choose its own status with `os:exit`, which takes any
non-negative integer:

```suji
import std:os
import std:println

println("done")
os:exit(0)
```

## Script arguments

Arguments arrive through `std:env` as a map keyed by strings, where `"0"` is
meant to be the script path and `"1"` the first argument:

```suji
import std:println
import std:env

println(env:args::get("0", "(unknown)"))
println(env:args::get("1", "(none)"))
println(env:args::length())
```

Run with no arguments, that prints the script's path, `(none)` and `1`.

> **Known bug in 0.1.22:** positional arguments never make it through. Every
> argument overwrites key `"0"`, so `suji args.si alpha beta` leaves
> `env:args` as `{0: beta}` — the last argument, with the script path gone and
> `"1"` still missing. Pass input through an environment variable or stdin until
> this is fixed; see [`std:env`](../stdlib/env.md#args-and-argv--command-line-arguments).

Arguments that begin with `-` are consumed by the interpreter itself and never
reach `env:args` at all, so a script cannot take `--flag` style options.

## Reading standard input

A script can read whatever is piped into it through `io:stdin`:

```suji
import std:println
import std:io

lines = io:stdin::read_lines()

println(lines::length())
```

```bash
printf 'a\nb\nc\n' | suji count.si
```

```text
3
```

`read_all()` returns the whole stream as one string and `read_line()` reads a
single line. All stream reads are eager and blocking.

## Executable scripts

`#` starts a comment in Suji, so a shebang line is valid Suji source:

```suji
#!/usr/bin/env suji

import std:println

println("This is a Suji script!")
```

```bash
chmod +x script.si
./script.si
```

## The REPL

Run `suji` with no arguments:

```bash
suji
```

```text
SUJI Language REPL
Type expressions to evaluate them, or :help for commands
Use Ctrl+C to cancel current input, Ctrl+D or :quit to exit

suji>
```

### How evaluation works

The REPL evaluates each complete input and echoes the value of the last
statement unless that value is `nil`. Bindings persist for the session.

```text
suji> 1 + 1
2
suji> "Hello, " + "World!"
Hello, World!
suji> x = 42
42
suji> x * 2
84
```

Note that values are printed the way `to_string()` renders them, so strings
appear without surrounding quotes.

### Imports are still required

There is no prelude and the REPL adds nothing implicitly — `println` has to be
imported here just as it does in a file:

```text
suji> println("hi")
[401] Error: Undefined variable
suji> import std:println
suji> println("hi")
hi
3
```

That trailing `3` is not a surprise: `println` returns the number of bytes it
wrote, and the REPL echoes the value of the last statement.

### Multi-line input

While braces, brackets or parentheses are unbalanced, the REPL switches to the
continuation prompt `  > ` and keeps reading:

```text
suji> greet = |name| {
  >     "Hello, ${name}!"
  > }
<function>
suji> greet("Alice")
Hello, Alice!
```

Input completeness is judged by bracket balance, so an expression that is
syntactically incomplete without unbalanced brackets (a trailing `+`, say) is
submitted immediately and reports a parse error.

### REPL commands

| Command | Description |
|---------|-------------|
| `:help` | Show the built-in help |
| `:quit` | Exit |
| `:exit` | Exit |
| Ctrl+C | Discard the input being typed |
| Ctrl+D | Exit |
| Arrow Up/Down | Browse this session's history |

Those three colon commands are the only ones; there is no `:load`, `:type`,
`:vars` or `:reset`. History lives in memory only and is not written to disk.

### Things to try in the REPL

Explore data structures:

```text
suji> users = [{name: "Alice", age: 30}, {name: "Bob", age: 25}]
[{name: Alice, age: 30}, {name: Bob, age: 25}]
suji> users[0]:name
Alice
suji> users::map(|u| u:name)
[Alice, Bob]
```

Build a pipeline one stage at a time:

```text
suji> numbers = [1, 2, 3, 4, 5]
[1, 2, 3, 4, 5]
suji> numbers::map(|x| x * 2)
[2, 4, 6, 8, 10]
suji> numbers::map(|x| x * 2)::filter(|x| x > 5)
[6, 8, 10]
suji> numbers::map(|x| x * 2)::filter(|x| x > 5)::sum()
24
```

Check a regular expression:

```text
suji> "user@example.com" ~ /^[^@]+@[^@]+\.[^@]+$/
true
suji> "invalid" ~ /^[^@]+@[^@]+\.[^@]+$/
false
```

Use it as an exact-decimal calculator:

```text
suji> (42 + 8) * 2
100
suji> 100 / 3
33.333333333333333333333333333
suji> 10 ^ 3
1000
```

### REPL limitations

- State is lost when you exit; nothing is saved between sessions.
- A runtime error aborts the current input only — the session survives — but
  there is still no way for your code to catch it.
- Long programs are easier to iterate on in a file; the REPL is best for
  checking one expression at a time.

## A typical workflow

Sketch the logic in the REPL, then move it into a file once it works:

```suji
import std:println
import std:json

data = json:parse('{"users": [{"name": "Alice", "score": 95}, {"name": "Bob", "score": 87}]}')

high_scorers = data:users
    ::filter(|u| u:score >= 90)
    ::map(|u| u:name)

println(json:generate({
    high_scorers: high_scorers,
    count: high_scorers::length(),
}))
```

```text
{"count":1,"high_scorers":["Alice"]}
```

(`json:generate` writes object keys in sorted order, not insertion order.)

## Quick reference

```bash
suji                          # start the REPL
suji script.si                # run a program
suji script.si a b            # run with positional arguments
suji --print-ast script.si    # print the parse tree
printf 'x\n' | suji script.si # feed standard input
```

## Next steps

- [Language Overview](../fundamentals/overview.md) — how the language fits together
- [Data Types](../fundamentals/data-types/README.md) — the eight value types
- [Basic Functions](../functions/basics.md) — lambda syntax and returns
- [Standard Library Overview](../stdlib/README.md) — what you can import

## See Also

- [Installation](installation.md)
- [Environment](../stdlib/env.md)
- [I/O and Streams](../stdlib/io.md)
