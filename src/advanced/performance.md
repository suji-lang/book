# Performance Considerations

Best practices and optimization tips for writing efficient Suji code.

## How Suji Executes Your Code

Knowing the execution model tells you which optimisations are worth attempting:

- **Tree-walking AST interpreter.** Every expression is re-walked each time it is evaluated, so per-operation constant factors are high compared with a compiled language.
- **No JIT, no parallelism, no lazy sequences, no tail-call optimisation.**

The practical consequence: algorithmic choices — how many times you touch each element, how much you allocate — dominate. Micro-tuning individual expressions rarely pays off. Measure before and after any change.

## Measuring

There are two timing primitives: `os:uptime_ms()` and `time:now():epoch_ms`. Both are millisecond-resolution, so a single fast operation will measure as `0` — repeat the work enough times to get a signal.

```suji
import std:println
import std:os

benchmark = |work| {
    start = os:uptime_ms()
    work()
    return os:uptime_ms() - start
}

elapsed = benchmark(|| (1..=100000)::sum())

println(elapsed::is_number())    # true
println(elapsed >= 0)            # true
```

`time:now()` returns a map, so subtract the `epoch_ms` field rather than the maps themselves:

```suji
import std:println
import std:time

start = time:now():epoch_ms
total = (1..=1000)::sum()
elapsed = time:now():epoch_ms - start

println(elapsed >= 0)    # true
```

Compare two implementations by running both and reporting the ratio at runtime. Do not trust numbers written into documentation, including this page — measure on your own machine and your own data.

## Everything Is Eager

### `map`, `filter` and `fold` allocate

List methods are not lazy. Each stage walks the whole list and builds a brand-new list, so a three-stage chain over a million elements allocates three million-element lists.

```suji
import std:println

data = 1..=10

# Three passes, two intermediate lists
result = data
  ::filter(|x| x > 2)
  ::map(|x| x * 2)
  ::fold(0, |acc, x| acc + x)

println(result)    # 104
```

That chain is perfectly good style for small and medium lists — clarity is worth an allocation. When the list is large, collapse the passes into one:

```suji
import std:println

data = 1..=10

# One pass, no intermediate lists
result = data::fold(0, |acc, x| match {
    x > 2 => acc + x * 2,
    _ => acc,
})

println(result)    # 104
```

Filtering before mapping is also worth doing when the filter is selective, since it shrinks the input to the more expensive stage:

```suji
import std:println

data = 1..=10

cheap_first = data::filter(|x| x % 2 == 0)::map(|x| x * x)
println(cheap_first::sum())    # 220
```

### Ranges materialise complete lists

`a..b` and `a..=b` are **not** lazy iterators — they build the whole list immediately. `0..1000000` allocates a million elements before the loop body runs even once.

```suji
import std:println

r = 0..1000
println(r::is_list())     # true
println(r::length())      # 1000
```

For a large counted loop where you do not need the list, use an explicit counter:

```suji
import std:println

i = 0
total = 0
loop {
    i >= 1000 && break
    total = total + i
    i++
}

println(total)    # 499500
```

For moderate sizes, `loop through 0..n with i` is clearer and the allocation is not worth worrying about.

## Strings Are Character-Indexed

Strings are UTF-8, and `length()` and indexing count **characters**, not bytes. That means indexing is a scan from the start of the string, so indexing in a loop is quadratic.

```suji
import std:println

s = "hello world"

println(s::length())    # 11
println(s[0])           # h
println(s[6;])          # world
```

Convert once instead of indexing repeatedly:

```suji
import std:println

s = "hello"

# Good: one conversion, then cheap list access
chars = s::to_list()
loop through chars with c {
    println(c)
}
# h
# e
# l
# l
# o
```

### Concatenation in a loop

Each `+` builds a new string. Collect the pieces and `join` once:

```suji
import std:println

items = ["a", "b", "c"]

# Slower: a new string per iteration
result = ""
loop through items with item {
    result = result + item
}
println(result)    # abc

# Faster: one allocation at the end
println(items::join(""))    # abc
```

Interpolation is a single build step, so prefer it over a chain of `+`:

```suji
import std:println

name = "Ada"
count = 3

println("Hello ${name}, you have ${count} messages")
# Hello Ada, you have 3 messages
```

## Recursion Has a Hard Limit

There is no tail-call optimisation. Every call consumes a native stack frame, and a few hundred frames deep the interpreter aborts with a stack overflow that you cannot catch. The ceiling depends on the function: a simple `1 + f(n - 1)` recursion survives 600 levels but not 700, and an accumulator-passing version survives 700 but not 900. Recursion is fine for shallow, tree-shaped work; it is not a substitute for a loop.

```suji
import std:println

# Fine: depth is bounded and small
depth = |n| match {
    n == 0 => 0,
    _ => 1 + depth(n - 1),
}

println(depth(500))    # 500
```

Rewrite deep recursion as iteration:

```suji
import std:println

# Recursive sum would overflow for large n
total = 0
loop through 1..=10000 with i {
    total = total + i
}

println(total)    # 50005000
```

### Memoise repeated subproblems

A map makes exponential recursion linear, and keeps the depth low enough to be safe:

```suji
import std:println

memo = {}

fib = |n| {
    memo::contains(n) && return memo::get(n)
    value = match {
        n < 2 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
    memo[n] = value
    return value
}

println(fib(30))    # 832040
```

Note that `memo` is a captured variable, not a parameter — that matters, as the next section explains.

## Arguments Are Copied

Maps and lists are **passed by value**. Handing a large structure to a function copies it, and mutations inside the function are lost. Variables captured from an enclosing scope are shared instead.

```suji
import std:println

m = { a: 1 }

by_param = |target| { target["b"] = 2 }
by_param(m)
println(m::contains("b"))    # false

by_capture = || { m["c"] = 3 }
by_capture()
println(m::contains("c"))    # true
```

So for a hot loop over a big structure, prefer a closure over the structure, or pass only the slice you need — not the whole document.

## Streams Read Eagerly

`read_all()` and `read_lines()` load the entire file into memory. They are convenient and fine for configuration files and modest data, but they are not streaming.

```suji
import std:println
import std:io

path = `mktemp`
f = io:open(path, true, true)
loop through 1..=5 with i {
    f::write("line ${i}\n")
}
f::close()

g = io:open(path)
lines = g::read_lines()      # whole file in memory
g::close()

println(lines::length())     # 5
println(lines[0])            # line 1
```

`read_line()` is the one incremental reader: it returns the next line without its newline, and `nil` at end of file. Use it when the file may be larger than memory.

```suji
import std:println
import std:io
import std:os

path = `mktemp`
f = io:open(path, true, true)
loop through 1..=1000 with i {
    f::write("row ${i}\n")
}
f::close()

# Constant memory: one line at a time
g = io:open(path)
matching = 0
loop {
    line = g::read_line()
    line == nil && break
    match { line ~ /^row 1[0-9][0-9]$/ => { matching++ } }
}
g::close()
os:rm(path)

println(matching)    # 100
```

### Batch your writes

Each `write()` is a syscall. Build the text and write once when you can:

```suji
import std:println
import std:io
import std:os

path = `mktemp`
items = [1, 2, 3, 4, 5]

content = items::map(|i| i::to_string())::join("\n")
out = io:open(path, true, true)
out::write(content)
out::close()

check = io:open(path)
println(check::read_all())
check::close()
os:rm(path)
# 1
# 2
# 3
# 4
# 5
```

## Choosing Data Structures

- **Lists** are positional. `xs[i]` is a direct index, but `contains()` and `index_of()` scan linearly — inside a loop that becomes quadratic. Build a map when you need repeated membership tests.
- **Maps** are keyed lookups and keep insertion order. Prefer them for "have I seen this?" questions.
- **Tuples** are fixed-size and cannot be indexed; they are for returning a couple of values, not for storage.

```suji
import std:println

names = ["ann", "bo", "cy"]

# Slow inside a loop: linear scan each time
println(names::contains("bo"))    # true

# Faster for repeated tests: build a lookup map once
seen = {}
loop through names with n {
    seen[n] = true
}

println(seen::contains("bo"))     # true
println(seen::contains("zed"))    # false
```

## Hoist Work Out of Loops

Anything that does not depend on the loop variable belongs above the loop:

```suji
import std:println

items = ["Ada", "Bo", "Cy"]
prefix = "user:"::upper()

out = []
loop through items with item {
    out::push(prefix + item::upper())
}

println(out::join(","))    # USER:ADA,USER:BO,USER:CY
```

Early exit avoids the rest of the work entirely:

```suji
import std:println

find_first = |xs, predicate| {
    loop through xs with item {
        predicate(item) && return item
    }
    return nil
}

println(find_first([1, 5, 9], |x| x > 4))     # 5
println(find_first([1, 2], |x| x > 100))      # nil
```

## Performance Checklist

### DO:
- Measure with `os:uptime_ms()` before and after a change
- Collapse multi-stage list chains into one pass when lists are large
- Collect strings and `join` once instead of concatenating in a loop
- Convert a string to a list once rather than indexing it repeatedly
- Use a map for repeated membership tests
- Use `read_line()` when a file may not fit in memory
- Memoise expensive recursive computations
- Batch writes into a single `write()`
- Exit loops early with `break` or `return`

### DON'T:
- Expect `map`/`filter`/`fold` or ranges to be lazy — they are not
- Materialise a huge range just to count
- Recurse deeply; there is no tail-call optimisation
- Pass large maps and lists as arguments in hot code — they are copied
- Assume `read_lines()` streams; it loads the whole file
- Optimise before measuring

## When to Optimize

1. **Measure first**: don't guess, time it
2. **Find the real bottleneck**: usually I/O or an accidental quadratic loop
3. **Fix the algorithm**: constant-factor tweaks rarely matter in an interpreter
4. **Keep it readable**: an eager three-stage chain is fine until it isn't
5. **Re-measure**: confirm the change actually helped

## See Also

- [Lists](../fundamentals/data-types/lists.md) - `map`, `filter`, `fold` and their costs
- [Strings](../fundamentals/data-types/strings.md) - character indexing
- [Loops](../fundamentals/control-flow/loops.md) - ranges and `break`
- [Streams](../fundamentals/data-types/streams.md) - `read_line()` vs `read_all()`
- [Time Module](../stdlib/time.md) and [OS Module](../stdlib/os.md) - timing primitives
- [File Processing](../cookbook/file-processing.md)
