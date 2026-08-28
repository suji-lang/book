# Syntax Reference

Every piece of Suji syntax on one page, with the things that look like Suji but are not.

## Reserved Words

Suji has exactly thirteen keywords:

```text
break   continue   export   import   loop   match   return
as      through    with     true     false  nil
```

`_` is a wildcard in patterns and destructuring targets. Everything else is an
identifier, including words familiar from other languages: `if`, `else`, `while`,
`for`, `fn`, `def`, `let`, `var`, `const`, `class`, `try`, `catch`, `throw`,
`and`, `or`, and `not` are **not** keywords. Writing `if x > 1 { … }` produces
`Undefined variable: if`.

## Comments and Separators

| Form | Meaning |
|---|---|
| `# text` | Line comment, runs to end of line |
| newline | Ends a statement |
| `;` | Optional statement separator |

There are no block comments.

```suji
import std:println

a = 1; b = 2  # two statements on one line

println(a + b)  # 3
```

A bare `{ … }` is a block, not an expression, so `x = { 1 }` is a parse error.

## Numbers

There is one numeric type: an exact base-10 decimal. `42` and `42.0` are the
same type; there is no separate integer type.

```suji
import std:println

println(0.1 + 0.2)   # 0.3
println(7 / 2)       # 3.50
println(1.50)        # 1.50
```

Literals accept decimal digits and at most one `.`. These forms **do not exist**:

| Not supported | Write instead |
|---|---|
| `0xFF`, `0o77`, `0b1010` | decimal digits only |
| `1_000_000` | `1000000` |
| `3e8`, `6.626e-34` | `300000000`, or a product such as `6.626 * 0.0000000000000000000000000000001` |
| `-5` as a literal | `-5` is unary minus applied to `5` |

Precision is roughly 28–29 significant digits, with a maximum of
`79228162514264337593543950335`. Exceeding it aborts the program.

## Strings

| Form | Notes |
|---|---|
| `"text"` | Double-quoted |
| `'text'` | Single-quoted, identical behaviour |
| `"""text"""` | Triple-quoted, spans newlines |
| `'''text'''` | Triple-quoted, single-quote flavour |

Interpolation is `${expr}` and works in every string form and in backtick shell
templates. The escape set is closed:

| Escape | Produces |
|---|---|
| `\n` | newline |
| `\t` | tab |
| `\r` | carriage return |
| `\"` | `"` |
| `\'` | `'` |
| `` \` `` | backtick |
| `\\` | backslash |
| `\$` | literal `$`, suppressing interpolation |

Any other escape is a lex error. `\u0041`, `\u{1F600}` and `\0` are not
supported, and there are no raw strings.

```suji
import std:println

who = "world"

println("Hello, ${who}!")     # Hello, world!
println("tab:\tdone")         # tab:	done
println("literal \${who}")    # literal ${who}
```

## Booleans and Nil

`true`, `false` and `nil` are literals. There is no truthiness: `&&`, `||` and
`!` require boolean operands, and `nil || "default"` is a type error rather than
a defaulting idiom.

```suji
import std:println

x = nil

println(x == nil)   # true
println(!false)     # true
```

## Lists, Maps and Tuples

```suji
import std:println

xs = [1, "two", true]                # heterogeneous, 0-based
m  = {a: 1, "b": 2, 3: "c"}          # insertion-ordered
t  = (1, 2)                          # fixed size

println(xs::length())   # 3
println(m::keys())      # [a, b, 3]
println(t::to_list())   # [1, 2]
```

Map keys may be bare identifiers, strings, numbers or booleans. Map literals
with bare identifier keys are only recognised where a map is expected — as a
whole match-arm body or lambda body, `{ name: "x" }` parses as a block, so quote
the keys or wrap the literal in parentheses there.

Tuples are **not indexable**: `t[0]` is a type error and there is no `t::get(0)`.
Destructure with `a, b = t`, or convert with `t::to_list()`.

## Indexing and Slicing

| Form | Meaning |
|---|---|
| `xs[i]` | Element at `i` (lists, strings) |
| `xs[-1]` | Element counted from the end |
| `xs[a;b]` | Slice from `a` up to but excluding `b` |
| `xs[;b]` | Slice from the start |
| `xs[a;]` | Slice to the end |

The slice separator is a **semicolon**, not a colon; `:` is reserved for map
access.

```suji
import std:println

xs = [10, 20, 30, 40, 50]

println(xs[0])     # 10
println(xs[-1])    # 50
println(xs[1;3])   # [20, 30]
println(xs[;2])    # [10, 20]
println(xs[3;])    # [40, 50]

s = "hello"

println(s[1])      # e
println(s[1;3])    # el
```

Strings are indexed and sliced by character, not byte. An out-of-range index is
a fatal runtime error.

## Map Access

| Form | Meaning |
|---|---|
| `m:key` | Bare identifier key |
| `m["key"]` | Any expression as key |
| `m::get(k, default)` | Safe read, no error when missing |
| `m::contains(k)` | Membership test |

A missing key read through `m:key` or `m[k]` raises `Key not found` and
terminates the program. Access chains nest to any depth and are assignable.

```suji
import std:println

data = {users: [{email: "a@example.com"}]}

println(data:users[0]:email)        # a@example.com
println(data::get("missing", "-"))  # -

data:users[0]:email = "b@example.com"

println(data:users[0]:email)        # b@example.com
```

## Method Calls

Methods use `::` and exist on values, not on modules. Chains may break across
lines with a leading `::`.

```suji
import std:println

result = [1, 2, 3, 4]
    ::map(|x| x * 2)
    ::filter(|x| x > 4)
    ::sum()

println(result)  # 14
```

## Variables and Assignment

There is no declaration keyword — assignment creates or updates a binding. There
is no shadowing: assigning inside a nested scope writes to the outer variable if
one exists.

| Form | Meaning |
|---|---|
| `x = expr` | Bind or rebind |
| `x += expr` | Also `-=`, `*=`, `/=`, `%=` |
| `x++`, `x--` | Postfix statements that mutate `x` |
| `a, b = expr` | Destructure a tuple or multi-value return |
| `a, _ = expr` | Discard a position |

There is no prefix `++x`.

```suji
import std:println

n = 5
n += 3
n++

println(n)  # 9

pair = (1, 2)
a, b = pair

println("${a} ${b}")  # 1 2
```

## Functions

Functions are lambdas assigned to names; there is no `fn` or `def` form.

| Form | Meaning |
|---|---|
| `\|x\| expr` | One parameter, expression body |
| `\|x, y\| { … }` | Block body |
| `\|\| expr` | No parameters |
| `\|a, b = 10\| …` | Default parameter value |
| `return expr` | Explicit return |
| `return a, b` | Return a tuple |

The last expression of a body is returned implicitly. Recursion works through
the assigned name, but there is no tail-call optimisation, so depth is bounded
by the native stack. There are no variadic parameters and no keyword arguments.

```suji
import std:println

add = |a, b = 10| a + b

minmax = |xs| {
    return xs::min(), xs::max()
}

lo, hi = minmax([3, 1, 4])

println(add(1))        # 11
println(add(1, 2))     # 3
println("${lo} ${hi}") # 1 4
```

Closures capture the enclosing environment by reference and can mutate what they
capture.

```suji
import std:println

make_counter = || {
    count = 0
    return || {
        count++
        return count
    }
}

next = make_counter()
next()

println(next())  # 2
```

## Match

`match` is the only conditional construct. It has two forms and is always an
expression.

```suji
import std:println

value = 2

subject = match value {        # patterns compared against the subject
    1 => "one",
    2 => "two",
    _ => "other",
}

conditional = match {          # each arm is a boolean expression
    value > 10 => "big",
    _ => "small",
}

println(subject)      # two
println(conditional)  # small
```

### The Comma Rule

An arm whose body is a bare expression **must** be followed by a comma,
including the last arm. An arm whose body is a `{ … }` block may omit it. This
is the most common syntax error in Suji code:

```text
match x { 1 => "one", _ => "other" }     # parse error: no comma after last arm
match x { 1 => "one", _ => "other", }    # correct
match x { 1 => { "one" } _ => { "other" } }  # also correct
```

A `match` with no matching arm evaluates to `nil` rather than raising an error.

### Patterns

| Supported | Example |
|---|---|
| Number, string, boolean, `nil` literals | `1`, `"a"`, `true`, `nil` |
| Negative numbers | `-1` |
| Regex literals | `/^h/` |
| Tuple patterns | `(1, 2)`, `(1, _)` |
| Alternatives | `1 \| 2 \| 3` |
| Wildcard | `_` |

| Not supported | Note |
|---|---|
| Variable binding | A bare identifier is read as a **string literal** |
| List patterns `[a, b]` | Use indexing after a length check |
| Map patterns | Use `m::get` / `m::contains` in a conditional match |
| Range patterns `1..10` | Use a conditional match with comparisons |
| `if` guards | Use a conditional match |
| Interpolated strings | Not allowed as patterns |

Because a bare identifier is a string literal, `match 5 { n => n * 2, }` yields
`nil`, not `10`.

```suji
import std:println

classify = |v| {
    match v {
        0 => "zero",
        1 | 2 | 3 => "small",
        -1 => "minus one",
        /^[a-z]+$/ => "lowercase word",
        _ => "other",
    }
}

println(classify(2))        # small
println(classify(-1))       # minus one
println(classify("abc"))    # lowercase word
println(classify(99))       # other
```

## Loop

`loop` is the only iteration keyword.

| Form | Meaning |
|---|---|
| `loop { … }` | Infinite; needs `break` |
| `loop as name { … }` | Labeled |
| `loop through xs { … }` | Iterate without binding |
| `loop through xs with x { … }` | Bind each element (list or range) |
| `loop through m with k, v { … }` | Bind key and value — maps only |

`break`, `continue`, `break label` and `continue label` are statements. A label
must sit on the same line as the keyword. `break <value>` does not exist, and a
loop always evaluates to `nil`.

```suji
import std:println

total = 0
loop through 1..=4 with n {
    n == 3 && continue
    total += n
}

println(total)  # 7

i = 0
loop {
    i++
    i >= 3 && break
}

println(i)  # 3

loop as outer {
    loop as inner {
        break outer
    }
}

println("done")  # done
```

Iterables are lists, ranges and maps. Iterating a string or a stream is a
runtime error — use `s::to_list()` or `stream::read_lines()` first. Two bindings
on a list is also a runtime error.

## Ranges

| Form | Meaning |
|---|---|
| `a..b` | Exclusive of `b` |
| `a..=b` | Inclusive of `b` |

Ranges evaluate immediately to a list; they are not lazy. Descending ranges
work.

```suji
import std:println

println(1..4)    # [1, 2, 3]
println(1..=4)   # [1, 2, 3, 4]
println(5..1)    # [5, 4, 3, 2]
```

## Regular Expressions

Regex literals are written `/pattern/` and support matching only.

| Operator | Meaning |
|---|---|
| `s ~ /re/` | `true` when the pattern matches |
| `s !~ /re/` | `true` when it does not |

There are no capture groups, no regex-based replace and no regex split.
`/${var}/` is not interpolated. A regex may be stored in a variable and used as
a match-arm pattern.

```suji
import std:println

digits = /^[0-9]+$/

println("2024" ~ digits)          # true
println("hello" !~ digits)        # true
println("a@b.co" ~ /^[^@]+@[^@]+$/)  # true
```

## Shell Templates and Pipelines

A backtick template runs a command through the shell and evaluates to its stdout
with the trailing newline trimmed. `${expr}` interpolation works inside.

```suji
import std:println

word = "suji"

println(`echo hello`)        # hello
println(`echo ${word}`)      # suji
```

stderr is not captured, and a non-zero exit status is a fatal runtime error with
no way to trap it. Guard commands that may fail, for example with
`` `cmd || true` `` or `` `test -f f && echo yes || echo no` ``.

The `|` operator pipes stdout between closures and shell templates. A closure on
the receiving side reads with `io:stdin::read_lines()` or `read_all()`.

```suji
import std:io
import std:println

producer = || {
    println("alpha")
    println("beta")
}

count = || {
    return io:stdin::read_lines()::length()
}

println(producer() | `grep a` | count())  # 2
```

## Operators

Full precedence and associativity live in [Operator Precedence](precedence.md).
The set is:

| Group | Operators |
|---|---|
| Assignment | `=` `+=` `-=` `*=` `/=` `%=` |
| Pipe apply | `\|>` `<\|` |
| Stream pipe | `\|` |
| Composition | `>>` `<<` |
| Logical | `&&` `\|\|` `!` |
| Regex | `~` `!~` |
| Equality | `==` `!=` |
| Relational | `<` `<=` `>` `>=` |
| Range | `..` `..=` |
| Arithmetic | `+` `-` `*` `/` `%` `^` |
| Postfix | `()` `[]` `::` `:` `++` `--` |

`+` concatenates strings and lists but never mixes types: `"a" + 1` is a type
error. `^` requires an integer exponent and is right-associative.

## Modules

Only `std`, the internal `__builtins__`, and local `.si` files are importable.
Nothing is available without an import — there is no prelude, so every program
that prints needs `import std:println`.

| Form | Binds |
|---|---|
| `import std` | `std`, used as `std:println(…)` |
| `import std:math` | `math` |
| `import std:println` | `println` |
| `import std:json:parse` | `parse` |
| `import std:println as say` | `say` |

```suji
import std:println as say
import std:math

say(math:E)  # 2.71828182845904523536
```

Local imports use path segments, not strings — `import "./helpers.si"` is a
parse error. Segments are directory and file names relative to the importing
file, without the `.si` extension:

```text
import helpers          # ./helpers.si       binds `helpers`
import lib:util         # ./lib/util.si      binds `util`
import lib:util:greet   # one key out of util.si's exported map
import lib:util as u    # alias; only legal when the path has 2+ segments
```

A file has at most one `export`, and its value is whatever the export evaluates
to:

```text
export 42                        # `import leaf` binds the number 42
export { value: 1, f: |x| x }    # `util:value` and `util:f` become available
```

## See Also

- [Operator Precedence](precedence.md)
- [Error Codes](error-codes.md)
- [Glossary](glossary.md)
- [Language Overview](../fundamentals/overview.md)
- [Standard Library Overview](../stdlib/README.md)
