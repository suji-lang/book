# Glossary

Terms as this book uses them, which is to say as Suji actually defines them.

## A

**Arm** — One `pattern => body` clause of a [`match`](../fundamentals/control-flow/match.md).
An arm whose body is a bare expression must be followed by a comma, including
the last one; an arm whose body is a `{ … }` block may omit it.

**Arity** — The number of parameters a function declares. Suji checks arity at
call time and raises error 408 on a mismatch, unless the missing parameters have
defaults.

## B

**Backtick template** — A `` `command` `` literal that runs a command through
the shell and evaluates to its stdout with the trailing newline trimmed. Also
called a shell template. See [Shell Integration](../advanced/shell-integration.md).

**Binding** — The association of a name with a value, created by assignment.
Suji has no declaration keyword and no shadowing: assigning inside a nested
scope writes to the outer binding when one exists.

## C

**Closure** — A function that captures its enclosing environment. Suji closures
capture **by reference**, so they can read and mutate the variables they close
over. See [Closures](../functions/closures.md).

**Composition** — Building one function from two with `>>` or `<<`. `f >> g`
means "f then g"; `f << g` means "g then f". See
[Function Composition](../fundamentals/operators/composition.md).

**Conditional match** — The `match { condition => body, … }` form, in which each
arm is a boolean expression rather than a pattern. This is Suji's replacement
for `if`/`else if` chains. See [Conditional Logic](../fundamentals/control-flow/conditionals.md).

## D

**Decimal number** — Suji's only numeric type: an exact base-10 fixed-precision
decimal of roughly 28–29 significant digits. `0.1 + 0.2 == 0.3` is `true`. There
is no integer type and no floating-point type. See [Numbers](../fundamentals/data-types/numbers.md).

**Deep import** — An import that reaches past a module to one of its members,
such as `import std:json:parse`, which binds `parse` directly. See
[Imports](../modules/imports.md).

**Destructuring** — Unpacking a tuple or a multi-value return into several
bindings at once: `a, b = point`. Use `_` to discard a position. See
[Multiple Return Values](../functions/multiple-returns.md).

## E

**Eager** — Evaluated immediately rather than on demand. Suji is eager
throughout: ranges materialise as lists, `map` and `filter` allocate a new list
per step, and stream reads block.

**Expression statement** — A statement that is just an expression evaluated for
its value or its side effects, such as a bare function call.

**Export** — The single value a module makes available, written `export expr`.
A file may have at most one. `export { a: 1, f: |x| x }` makes `module:a` and
`module:f` reachable. See [Exports](../modules/exports.md).

## G

**Guard** — An early exit written with a short-circuit operator, such as
`n < 0 && return nil` or `done || continue`. Suji has no `if` guards inside
match patterns, so guards live either in a conditional match or in these
short-circuit statements. See [Guard Clauses](../fundamentals/control-flow/guards.md).

## H

**Higher-order function** — A function that takes or returns a function.
`list::map`, `list::filter` and `list::fold` are the built-in examples. See
[Higher-Order Functions](../functions/higher-order.md).

## I

**Implicit return** — The value of the last expression in a function body,
returned without a `return` keyword.

**Interpolation** — Embedding an expression in a string or shell template with
`${expr}`. It is the only interpolation syntax, and it does not apply inside
regex literals. See [String Interpolation](../advanced/string-interpolation.md).

**Iterable** — A value `loop through` accepts: a list, a range (which is a
list), or a map. Strings and streams are **not** iterable; convert with
`s::to_list()` or `stream::read_lines()` first.

## L

**Lambda** — A function literal, `|params| body`. Suji has no other way to
define a function; a named function is a lambda assigned to a name. See
[Basic Functions](../functions/basics.md).

## M

**Map** — An insertion-ordered collection of key-value pairs, written
`{a: 1, "b": 2}`. Keys may be strings, numbers, booleans or tuples. Read with
`m:key`, `m["key"]` or `m::get(k, default)`. See [Maps](../fundamentals/data-types/maps.md).

**Match** — Suji's only conditional construct, and always an expression. It has
a subject form (`match value { … }`) and a conditional form (`match { … }`). A
match with no matching arm evaluates to `nil`. See [Match Expressions](../fundamentals/control-flow/match.md).

**Method** — A function attached to a value and called with `::`, as in
`xs::length()`. Methods belong to types, not to modules; module functions are
called with `:`, as in `json:parse(text)`.

**Module** — A unit of importable code: `std` and its submodules, or a local
`.si` file. Local imports use colon-separated path segments relative to the
importing file, never string paths. See [Modules](../modules/README.md).

## N

**Nil** — The absence of a value, written `nil`. It is not falsey — Suji has no
truthiness — so test it with `x == nil`. See [Nil](../fundamentals/data-types/nil.md).

## P

**Pattern** — The left side of a match arm. Suji supports literal, negative
number, regex, tuple, alternative (`|`) and wildcard patterns. It does **not**
support variable binding, so a bare identifier in a pattern is read as a string
literal. See [Pattern Matching](../advanced/pattern-matching.md).

**Pipe apply** — The `|>` and `<|` operators, which apply a value to a function.
`5 |> inc` and `inc <| 5` both call `inc(5)`. See [Pipe Apply](../fundamentals/operators/pipe-apply.md).

**Pipeline** — A chain of stages joined by `|`, where each stage's stdout
becomes the next stage's stdin. Stages are closure calls or shell templates. See
[Pipe](../fundamentals/operators/pipe.md).

**Predicate method** — One of `is_number()`, `is_bool()`, `is_string()`,
`is_list()`, `is_map()`, `is_stream()`, `is_function()`, `is_tuple()`,
`is_regex()`, available on every value. There is no `is_nil()` and no `type()`.
See [Type Checking Methods](../advanced/type-checking.md).

## R

**Range** — `a..b` (exclusive) or `a..=b` (inclusive). A range evaluates
immediately to a list, so `0..1000000` allocates a million elements. Descending
ranges work: `5..1` is `[5, 4, 3, 2]`.

**Regex literal** — A `/pattern/` value used with `~` and `!~` or as a match
pattern. Matching is the only operation: there are no capture groups, no
regex replace and no regex split. See [Regular Expressions](../fundamentals/data-types/regex.md).

## S

**Scale** — The number of decimal places a number carries. Suji preserves it, so
`1.50` prints as `1.50` and `2.50 + 1` prints as `3.50`, while the literal `1.0`
normalises to `1`.

**Shell template** — See **backtick template**.

**Spec test** — A single-assertion `.si` program under `spec/`, whose final
`println` carries the expected output in a trailing `#` comment. See
[Spec Tests](../development/testing/spec-tests.md).

**Stream** — A blocking I/O handle produced by `io:open(path)` or supplied as
`io:stdin`, `io:stdout` and `io:stderr`. All reads are eager. See
[Streams](../fundamentals/data-types/streams.md).

**Subject** — The value between `match` and `{` in the subject form of a match,
against which each pattern is compared.

## T

**Tuple** — A fixed-size ordered group, written `(1, 2)`. Tuples are **not
indexable**: use destructuring or `t::to_list()`. Their only methods are
`length()`, `to_list()` and `to_string()`. See [Tuples](../fundamentals/data-types/tuples.md).

## W

**Wildcard** — `_`, which matches any value in a pattern and discards a position
in destructuring. It is conventionally the last arm of a match; without it, an
unmatched match yields `nil`.

## See Also

- [Syntax Reference](syntax-reference.md)
- [Operator Precedence](precedence.md)
- [Error Codes](error-codes.md)
- [Language Overview](../fundamentals/overview.md)
