# Module Resolution

This chapter describes how `import` paths are resolved in this repository.

## Standard library (`std`)

`std` is a special, built-in module root. For example:

```suji
import std:println
import std:json
```

## Files and directories

Non-`std` imports are resolved relative to the importing file’s directory. Path segments
are identifiers separated by `:`, and the `.si` extension is always omitted: the file
`lib/util.si` is imported as `lib:util`.

### Importing a single segment: `import one`

Resolution attempts:

1. `one.si` (file)
2. `one/` (directory)

If a file is found, the value exported by that file is imported.

If a directory is found, it is imported as a **module map** built from the `.si` files within it (recursively).

### Importing multiple segments: `import one:two:three`

Let the path segments be `[one, two, three]`. Resolution attempts:

1. **File-as-module**, then key lookup:
   - Load `one.si`.
   - It must export a **map**.
   - Look up `two` in that map, then `three`, etc.
2. **Nested file**:
   - Load `one/two/three.si` (and import its exported value).
3. **Nested directory**:
   - Load `one/two/three/` as a directory module map.

This allows both “module files” (map exports) and “nested file modules” to work naturally.

## Examples

### File module exporting a map

`math.si`:

```suji
export {
    add: |a, b| a + b,
}
```

`main.si`:

```text
import std:println
import math:add

println(add(1, 2))  # 3
```

### Nested file module

`utils/slug.si`:

```suji
export |s| s::lower()::replace(" ", "-")
```

`main.si`:

```text
import std:println
import utils:slug

println(slug("Hello World"))  # hello-world
```

### Directory module

Importing the directory itself yields a map keyed by the basenames it contains. With
`utils/` holding `format.si` and `slug.si`:

```text
import std:println
import utils

println(utils::keys())      # [format, slug]
println(utils:slug("A B"))  # a-b
```


