# Module System

Modules are loaded when their `import` statement runs, and each module is evaluated once.

## Loading and caching

The first `import` of a module loads and evaluates it; later imports of the same module —
including imports of individual keys, and imports from other files — reuse the cached
value. Top-level side effects in a module therefore happen exactly once.

```suji
import std:println
import std:random

# The import above loaded std:random once; both calls use that same module
println(random:integer(1, 10))
println(random:integer(1, 10))
```

A local module that prints while loading shows this clearly. Given `lib/util.si`:

```suji
import std:println

println("loading lib/util")

export {
    value: 1,
}
```

importing it twice from the same file still prints once:

```text
import std:println
import lib:util
import lib:util:value

println(value)
# loading lib/util
# 1
```

## Directory modules are maps

Importing a directory produces a map-like module where keys correspond to contained `.si` files (and subdirectories) by basename.

See: [Module Resolution](resolution.md)


