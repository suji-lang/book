# Exports

Exports define what a `.si` file provides to importers.

## Rules

- Each file may contain **exactly one** `export` statement. A second one is a parse
  error: *Multiple export statements found*.
- A file with no `export` can still be run directly; it just has nothing to import.
- Exports are either:
  - **Map export**: `export { name: expr, ... }`
  - **Expression export**: `export <expr>`

## Map export (module)

```suji
export {
    add: |a, b| a + b,
    PI: 3.14159,
}
```

This file exports a map. Importers can take the whole module (`import util`, then
`util:add(…)`) or a single key (`import util:add`, then `add(…)`).

## Expression export (leaf)

```suji
answer = 42
export answer
```

If this file is `answer.si`, then `import answer` binds the number 42 itself. Only map
exports can be indexed with `:` or imported key by key.

## Exporting computed modules

```suji
make = || {
    return {
        inc: |x| x + 1,
        double: |x| x * 2,
    }
}

export make()
```

The `export` expression is evaluated once, when the module is first imported, and the
resulting value is cached for every later import.

## See Also

- [Imports](imports.md)
- [Module Resolution](resolution.md)


