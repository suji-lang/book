# Language Design

The choices behind Suji, and the costs each one carries.

Suji is a scripting language for the kind of work you would otherwise do in a
shell script: gluing commands together, reshaping data, and producing text. Most
of its unusual decisions follow from that goal, and each one buys something at a
price. This page states both halves.

## One Exact Decimal Number Type

There is no `int`, no `float`, and no separate integer type — just a
fixed-precision base-10 decimal. `42` and `42.0` are the same value.

```suji
import std:println

println(0.1 + 0.2)          # 0.3
println(0.1 + 0.2 == 0.3)   # true
println(19.99 * 3)          # 59.97
```

**Why.** Scripts deal in money, percentages, and human-entered quantities.
Binary floating point produces `0.30000000000000004` for the first line above,
which is a bug waiting to be reported by a user rather than a compiler. A single
type also removes an entire category of decisions: no integer division surprise,
no widening rules, no literal suffixes.

**The trade-off.** Precision is fixed at roughly 28–29 significant digits with a
maximum of `79228162514264337593543950335`. This is not arbitrary-precision
arithmetic: exceeding the range aborts the process rather than promoting to a
bignum, and `2::pow(100)` overflows. Repeating divisions round —
`10 / 3` yields `3.3333333333333333333333333333`. Decimal arithmetic is also
slower than hardware floats, which matters in a tight numeric loop.

A related consequence: scale is part of the value, so `1.50` prints as `1.50`
and `2.50 + 1` prints as `3.50`. That is correct for currency and occasionally
surprising elsewhere.

## Strong Dynamic Typing, No Coercion, No Truthiness

Types are checked at runtime and never converted implicitly.

```suji
import std:println

n = 1

println("count: " + n::to_string())   # count: 1
println("count: ${n}")                # count: 1
```

`"a" + 1` is a type error, `"ab" * 3` is a type error, `1 == "1"` is `false`,
and `nil || "default"` is a type error because `||` requires booleans.

**Why.** Silent coercion is the classic source of scripting bugs: a number read
from a file concatenating instead of adding, or an empty string quietly taking
the `else` branch. Suji makes the conversion visible — `::to_string()`,
`::to_number()`, or interpolation.

**The trade-off.** More typing, and the loss of some genuinely convenient
idioms. The absence of truthiness costs the `value || default` pattern
outright; the replacements are `m::get(k, default)`, `xs::first(default)`, and
an explicit `match`.

## `match` as the Only Conditional

There is no `if`, no `else`, no `elif`, no ternary, and no `switch`. Every
branch is a `match`, in one of two forms.

```suji
import std:println

grade = |score| {
    match {
        score >= 90 => "A",
        score >= 80 => "B",
        _ => "F",
    }
}

name = |code| {
    match code {
        200 => "OK",
        404 => "Not Found",
        _ => "Unknown",
    }
}

println(grade(85))    # B
println(name(404))    # Not Found
```

**Why.** One construct means one set of rules. There is no dangling-else
ambiguity, no statement-versus-expression split between `if` and a ternary, and
no question about whether a conditional produces a value — it always does. The
conditional form covers what `if`/`else if` chains do, and the subject form
covers dispatch, so nothing is lost.

**The trade-off.** The comma rule. An arm whose body is a bare expression must
be followed by a comma, *including the last one*, and forgetting it is the most
common syntax error in Suji. A single-branch conditional is also wordier than
`if`, which is why guards are usually written with short-circuit operators
instead:

```suji
import std:println

check = |n| {
    n < 0 && return "negative"
    return "non-negative"
}

println(check(-1))  # negative
```

Pattern matching itself is deliberately shallow: literals, negative numbers,
regex, tuples, alternatives, and `_`. There are no binding patterns, list
patterns, map patterns, range patterns, or `if` guards. That keeps the matcher
small and predictable, at the cost of some destructuring expressiveness — and it
produces one real trap, since a bare identifier in a pattern is read as a string
literal rather than a binding.

## Expression-Oriented Blocks and Implicit Returns

A function body's last expression is its result, and `match` is an expression,
so most functions need no `return` at all.

```suji
import std:println

double = |x| x * 2

classify = |n| {
    match {
        n > 0 => "positive",
        n < 0 => "negative",
        _ => "zero",
    }
}

println(double(21))      # 42
println(classify(-3))    # negative
```

**Why.** Short transformations are the common case in a scripting language, and
`|x| x * 2` reads better than a three-line block. Making `match` an expression
means a branch can be assigned, returned, or piped without restructuring.

**The trade-off.** A bare `{ … }` is a block and not an expression, so
`x = { 1 }` is a parse error, and a map literal with bare identifier keys in a
position where a block is expected — a whole lambda body, or a whole match-arm
body — parses as a block. Quote the keys or add parentheses there.

## Explicit Imports and No Prelude

Nothing is in scope by default. Even printing requires an import.

```suji
import std:println
import std:json

println(json:generate({ok: true}))  # {"ok":true}
```

**Why.** A script that reads `import std:crypto` at the top declares its
dependencies the way a shell script's `command -v` checks never quite do. It
also keeps the global namespace empty, so user names never collide with the
standard library, and it lets modules load lazily.

**The trade-off.** Boilerplate at the top of every file, and one predictable
first-time error: a snippet copied without its import fails with
`Undefined variable: println`. Import paths are also structural rather than
string-based — `import lib:util` rather than `import "./lib/util.si"` — which
reads well but means paths are constrained to identifier-shaped segments.

## Shell Integration and Two Pipe Families as First-Class

Backtick templates run commands, and `|` connects stages the way a shell does,
while `|>` and `<|` apply values to functions.

```suji
import std:io
import std:println

count = || io:stdin::read_lines()::length()
report = |n| "found ${n}"

`printf 'a\nb\n'` | count() |> report |> println   # found 2
```

**Why.** The alternative — a `subprocess`-style API with argument lists, pipes,
and exit codes — turns a one-line shell idiom into ten lines. Suji instead
treats a command as an expression that evaluates to its stdout. Keeping the two
pipe families separate is what makes this work: `|` moves *bytes* between
processes and closures, while `|>` moves *values* between functions. Conflating
them would make it ambiguous whether a stage is being called or composed.

**The trade-off.** Three pipe-like operators (`|`, `|>`, `<|`) plus two
composition operators (`>>`, `<<`) is a lot of surface for newcomers, and their
relative precedence has to be learned. Shell integration also inherits the
shell's weaknesses: stderr is not captured, the exit code is not observable, and
a non-zero status is fatal.

## Errors as Fatal Diagnostics, Not Exceptions

There is no `try`, no `catch`, no `throw`, no `Result`, and no `Option`. Any
error prints a framed diagnostic and terminates the script with exit status 1.

```suji
import std:println

config = {host: "localhost"}
xs = []

println(config::get("port", 8080))   # 8080
println(config::contains("host"))    # true
println(xs::first("none"))           # none
```

**Why.** For a script, failing loudly at the point of the fault with a source
span and a suggestion is usually the correct behaviour — a half-completed script
that swallowed an error is worse than one that stopped. Removing exceptions also
removes non-local control flow, so reading a function tells you everything about
how it can exit.

**The trade-off.** This is the sharpest edge in the language. There is no error
recovery whatsoever, no cleanup hook, and no way to retry. Every API that could
fail must therefore offer a checking counterpart — `m::get`, `m::contains`,
`xs::first(default)`, `xs::length()` — and any code that must survive a failure
has to test its preconditions first. It also means a long-running script cannot
be made robust against a single bad record; the defensive check has to be there
in advance. Suji is a poor fit for programs that must not stop.

## A Small, Orthogonal Method Set

Methods are called with `::` and the list per type is short and deliberately
non-overlapping. Lists have `map`, `filter`, and `fold` but no `reduce`, `each`,
`any`, `all`, `find`, `unique`, `flatten`, `zip`, or `group_by`. Strings have
`replace` and `trim` but no `capitalize`, `pad_start`, or `slice`. Rounding and
roots are number *methods* rather than `math` functions, so `std:math` holds
only constants, trigonometry, and logarithms.

```suji
import std:println

xs = [1, 2, 3, 4, 5]

evens = xs::filter(|x| x % 2 == 0)
total = xs::fold(0, |acc, x| acc + x)

println(evens)          # [2, 4]
println(total)          # 15
println(16::sqrt())     # 4
println(3.7::floor())   # 3
```

**Why.** One obvious way to do each thing. A small set is memorable, documents
itself in a single table per type, and keeps the surface small enough to specify
exactly.

**The trade-off.** Some operations take a `fold` where another language would
offer a named method, and the gaps are real: no `any`/`all`, no `unique`, no
`zip`, no `sort_by`. Collections are also eager, so `map` and `filter` each
allocate a new list and a range materialises fully — `0..1000000` really does
build a million elements.

## What This Adds Up To

Suji optimises for short programs that are read more often than they are
written, where a wrong answer is worse than no answer. It gives up
arbitrary-precision arithmetic, exception handling, laziness, a rich collection
API, and deep pattern matching to get there. Those are the right trades for a
shell-script replacement and the wrong ones for a long-running service.

## See Also

- [Roadmap](roadmap.md)
- [Contributing](contributing.md)
- [Language Overview](../fundamentals/overview.md)
- [Error Handling Deep Dive](../advanced/error-handling.md)
- [Performance Considerations](../advanced/performance.md)
