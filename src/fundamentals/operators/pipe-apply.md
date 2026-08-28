# Pipe Apply (`|>` and `<|`)

Pipe-apply operators call functions with **one argument**, but let you choose a convenient reading order.

## Overview

- `value |> f` is equivalent to `f(value)`
- `f <| value` is equivalent to `f(value)`

Both operators require the function side to evaluate to a **function value**; anything
else raises `Pipe apply (|>) requires a function on the right-hand side` (or the
matching left-hand-side error for `<|`).

There is no `|<` operator — the backward form is `<|`.

## Forward apply (`|>`)

Read left-to-right:

```suji
import std:println

trim = |s| s::trim()
upper = |s| s::upper()

result = "  hello  " |> trim |> upper
println(result)  # HELLO
```

## Backward apply (`<|`)

Read right-to-left. `<|` is **right-associative**, so the parentheses are optional:

```suji
import std:println

trim = |s| s::trim()
upper = |s| s::upper()

println <| upper <| trim <| "  hello  "   # HELLO
```

## Precedence

`<|` has the lowest precedence of the two, just above assignment; `|>` binds slightly
tighter, and both bind *looser* than arithmetic. That means the arithmetic on the left
is evaluated before the value is piped:

```suji
import std:println

inc = |x| x + 1

println(1 + 2 |> inc)  # 4 - the same as (1 + 2) |> inc
```

## Notes

- `|>` / `<|` always apply **one** argument. They do not “insert into a parameter list”,
  and there is no partial application syntax — write a lambda returning a lambda if you
  need that.
- If you want to transform collections, prefer list methods:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
result = numbers::filter(|x| x % 2 == 0)::map(|x| x * x)::sum()

println(result)  # 20
```

- If you want to build a reusable function instead of calling one right away, use the
  composition operators `>>` / `<<` (see [Function Composition](composition.md)).
- If you want stdin/stdout piping between stages, use the `|` operator (see [Pipe](pipe.md)).

## See Also

- [Pipe (`|`)](pipe.md)
- [Function Composition (`>>` and `<<`)](composition.md)
- [Operators overview](README.md)
