# Operator Precedence

How Suji groups an expression, from the loosest binding to the tightest.

## The Table

Level 1 binds loosest, level 17 tightest. Operators on the same level are
applied in the order given by their associativity.

| Level | Operators | Associativity | Notes |
|---|---|---|---|
| 1 | `=`, destructuring `a, b = …` | right | `a = b = 3` assigns `3` to both |
| 2 | `+=` `-=` `*=` `/=` `%=` | right | Compound assignment |
| 3 | `<\|` | right | Backward pipe apply |
| 4 | `\|>` | left | Forward pipe apply |
| 5 | `\|` | left | Stream pipeline (shell and closures) |
| 6 | `>>` `<<` | left | Function composition |
| 7 | `\|\|` | left | Boolean or |
| 8 | `&&` | left | Boolean and |
| 9 | `~` `!~` | left | Regex match / not-match |
| 10 | `==` `!=` | left | Equality |
| 11 | `<` `<=` `>` `>=` | left | Relational |
| 12 | `..` `..=` | — | Ranges do not chain |
| 13 | `+` `-` | left | Addition, subtraction, concatenation |
| 14 | `*` `/` `%` | left | Multiplication, division, remainder |
| 15 | unary `-` `!` | prefix | Binds looser than `^` |
| 16 | `^` | right | Exponentiation |
| 17 | `()` `[]` `::` `:` `++` `--` | postfix | Call, index, method, map key, increment |

## Surprises Worth Memorising

### `^` is right-associative and needs an integer exponent

```suji
import std:println

println(2 ^ 3 ^ 2)   # 512
println(2 ^ 10)      # 1024
```

`2 ^ 3 ^ 2` groups as `2 ^ (3 ^ 2)`, which is `2 ^ 9`. A non-integer exponent
such as `4 ^ 0.5` is a runtime error; use `16::sqrt()` for roots.

### Unary minus binds looser than `^`

```suji
import std:println

println(-2 ^ 2)     # -4
println((-2) ^ 2)   # 4
```

`-2 ^ 2` is `-(2 ^ 2)`, not `(-2) ^ 2`.

### Ranges sit between comparison and `+`

Arithmetic inside a range endpoint needs no parentheses, but a comparison
against a range does.

```suji
import std:println

println(1 .. 3 + 1)   # [1, 2, 3]
```

`1 .. 3 + 1` groups as `1 .. (3 + 1)`, producing the exclusive range `1..4`.

### `~` binds looser than `==`

This is the opposite of what most people expect. `"abc" ~ /b/ == true` groups as
`"abc" ~ (/b/ == true)` and fails with a type error. Parenthesise the match:

```suji
import std:println

println(("abc" ~ /b/) == true)   # true
```

In practice you rarely need this, because `~` already yields a boolean.

### There are three distinct pipe operators

| Operator | Level | What it does |
|---|---|---|
| `\|>` | 4 | Applies the left value to the right function |
| `<\|` | 3 | Applies the right value to the left function |
| `\|` | 5 | Connects stdout of one stage to stdin of the next |

Because `\|` binds tighter than both apply operators, a shell pipeline is built
first and its result is then piped into a function.

```suji
import std:io
import std:println

count = || io:stdin::read_lines()::length()
label = |n| "lines: ${n}"

`printf 'a\nb\nc\n'` | count() |> label |> println   # lines: 3
```

### `||` versus the empty-parameter lambda

`||` is boolean or, and `|| expr` is a lambda that takes no parameters. The
parser distinguishes them by position: `||` after a value is the operator,
`||` where a value is expected starts a lambda.

```suji
import std:println

flag = true || false     # boolean or
zero = || 42             # lambda with no parameters

println(flag)     # true
println(zero())   # 42
```

Both `&&` and `||` require boolean operands. `nil || "default"` is a type error,
so there is no `||` idiom for defaults — use `m::get(k, default)` or a `match`.

## Worked Examples

Each result below was produced by running the expression.

| Expression | Groups as | Result |
|---|---|---|
| `2 + 3 * 4` | `2 + (3 * 4)` | `14` |
| `2 * 3 ^ 2` | `2 * (3 ^ 2)` | `18` |
| `2 ^ 3 ^ 2` | `2 ^ (3 ^ 2)` | `512` |
| `-2 ^ 2` | `-(2 ^ 2)` | `-4` |
| `10 - 3 - 1` | `(10 - 3) - 1` | `6` |
| `1 .. 3 + 1` | `1 .. (3 + 1)` | `[1, 2, 3]` |
| `true \|\| false && false` | `true \|\| (false && false)` | `true` |
| `1 + 2 \|> inc` | `(1 + 2) \|> inc` | `4` |
| `3 \|> inc >> double` | `3 \|> (inc >> double)` | `8` |
| `double <\| inc <\| 3` | `double <\| (inc <\| 3)` | `8` |

```suji
import std:println

inc = |x| x + 1
double = |x| x * 2

println(2 + 3 * 4)              # 14
println(2 * 3 ^ 2)              # 18
println(10 - 3 - 1)             # 6
println(true || false && false) # true
println(1 + 2 |> inc)           # 4
println(3 |> inc >> double)     # 8
println(double <| inc <| 3)     # 8
```

`3 |> inc >> double` is worth a second look. Composition binds tighter than pipe
apply, so `inc >> double` is built into a single function first and `3` is then
applied to it. Had the grouping been `(3 |> inc) >> double`, the left operand of
`>>` would be the number `4` and composition would fail.

`double <| inc <| 3` shows the right-associativity of `<|`: the innermost apply
`inc <| 3` runs first, and its result is handed to `double`. Left-associative
grouping would try to compose `double` with `inc`, which `<|` does not do.

## Forcing a Grouping

Parentheses always win, and they are the cheapest way to make an expression
readable when several pipe families meet in one line.

```suji
import std:println

value = ((1 + 2) * 3) ^ 2

println(value)  # 81
```

## See Also

- [Syntax Reference](syntax-reference.md)
- [Operators](../fundamentals/operators/README.md)
- [Pipe](../fundamentals/operators/pipe.md)
- [Pipe Apply](../fundamentals/operators/pipe-apply.md)
- [Function Composition](../fundamentals/operators/composition.md)
