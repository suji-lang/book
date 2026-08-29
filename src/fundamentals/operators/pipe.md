# Pipe (`|`)

The pipe operator `|` builds **pipelines** where the **stdout** of one stage becomes the **stdin** of the next.

This is different from pipe-apply (`|>` / `<|`), which passes values as function arguments. Note that `|<` is not an operator in Suji; the backward pipe-apply is spelled `<|`.

## What can appear in a pipeline?

In this repository, each stage must be either:

- A **function invocation** (e.g. `stage()` or `stage(arg)`), or
- A **backtick command template** (e.g. `` `cat file.txt` ``)

Stages communicate via stdin/stdout (not via return values). A bare function *name*
is not a valid stage — you must call it.

## Example: shell → Suji → shell

```suji
import std:io

# Read all input from stdin, uppercase it, write to stdout
upper = || {
    text = io:stdin::read_all()
    io:stdout::write(text::upper())
}

`printf "hello\n"` | upper() | `wc -c`
```

## The value of a pipeline

A pipeline expression evaluates to the **captured stdout of its last stage**, with the
trailing newline trimmed (the same rule as a plain backtick template). Nothing is
printed automatically when the last stage is a backtick command, so assign it if you
want to see it:

```suji
import std:io
import std:println

upper = || {
    text = io:stdin::read_all()
    io:stdout::write(text::upper())
}

bytes = `printf "hello\n"` | upper() | `wc -c`
println("bytes: ${bytes::trim()}")  # bytes: 6
```

## Example: processing lines

Reading a stream is eager: `read_lines()` returns the whole input as a list of lines.
This example creates its own input file so it runs anywhere:

```suji
import std:io
import std:println

path = `mktemp`
`printf 'alpha\n\nbeta\n\ngamma\n' > ${path}`

only_non_empty = || {
    lines = io:stdin::read_lines()
    loop through lines with line {
        match { line::trim()::length() > 0 => { io:stdout::write(line + "\n") } }
    }
}

kept = `cat ${path}` | only_non_empty() | `head -n 2`
println(kept)  # alpha, then beta on the next line

`rm ${path}`
```

## Notes

- `|` is implemented by redirecting `std:io` streams for each stage and capturing stdout between stages.
- A stage whose command exits non-zero raises a runtime error that **terminates the
  script** — there is no way to trap it. Defensive tricks such as `` `cmd || true` ``
  keep the shell happy.
- `|` sits between `|>` and `>>` in the precedence table: lower than composition,
  higher than the pipe-apply operators.
- If you want to pass values through a chain (not stdin/stdout), use list/string methods (`::map`, `::filter`, …) or pipe-apply (`|>` / `<|`).

## See Also

- [Pipe Apply (`|>` and `<|`)](pipe-apply.md)
- [Function Composition (`>>` and `<<`)](composition.md)
- [Operators overview](README.md)
