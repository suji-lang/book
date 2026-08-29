# Module Organization

Organize code using files and directories that mirror your import paths.

## File modules

Use a `.si` file for a small module:

```
project/
  main.si
  math.si
```

From `main.si`, import it with:

```text
import math
```

## Directory modules

Use directories for larger modules:

```
project/
  main.si
  utils/
    slug.si
    format.si
```

Import nested modules with colon paths:

```text
import utils:slug
import utils:format
```

Each directory level is one path segment, so `utils/text/slug.si` is `utils:text:slug`.
Imports are resolved relative to the importing file, and there is no way to reach
upwards out of that directory — keep entry points at or above the modules they use.

## Guidelines

- Keep modules small and focused.
- Prefer map exports (`export { ... }`) for modules you want to index into with `:`.
- Give a module the name you want at the call site: the binding is the last path segment,
  and only multi-segment paths can be aliased with `as`.
- Avoid circular dependencies; split shared helpers into a separate module.


