# Modules

Modules in Suji are **values** loaded from files and directories. Most modules are **maps** (key/value objects), and importing a module brings that exported value into scope.

## Quick example

Two files in the same directory. `math.si`:

```suji
export {
    PI: 3.14159,
    add: |a, b| a + b,
}
```

`main.si`:

```text
import std:println
import math

println(math:add(math:PI, 2))  # 5.14159
```

Run it with `suji main.si`.

## Imports

Import a module (the value exported by a file or directory). The path is a bare
identifier path, never a string — `import "./my_module.si"` is a parse error:

```text
import my_module
```

Import a specific item from a module (colon-separated path):

```suji
import std:json
import std:json:parse
```

Alias an imported item:

```suji
import std:json:parse as parse_json
```

Notes:

- Imports are **one per statement** (no `import a:b, c`).
- Aliases apply to **item imports** (paths with at least one `:`); `import my_module as m`
  is a parse error.

## Exports

Each `.si` file may contain **exactly one** `export` statement:

- **Map export** (module): `export { key: expr, ... }`
- **Expression export** (leaf): `export <expr>`

See:

- [Imports](imports.md)
- [Exports](exports.md)
- [Module Resolution](resolution.md)
- [Standard Library Structure](stdlib-structure.md)


