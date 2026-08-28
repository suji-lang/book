# Imports

Imports bring modules (and items inside module maps) into the current scope.

## Syntax

```text
import <name>
import <name>:<segment>:...:<item>
import <name>:<segment>:...:<item> as <alias>
```

Where each `<name>/<segment>/<item>/<alias>` is an identifier. Paths are never quoted:
`import "./math.si"` and `import "math"` are parse errors.

## Examples

Import a module value (the file `math.si` next to the importing file):

```text
import math
```

Import a nested item:

```suji
import std:json:parse
import std:json:generate
```

Alias an imported item:

```suji
import std:json:parse as parse_json
```

The name that is bound is always the **last segment** of the path (or the alias), so
`import std:json:parse` gives you `parse`, not `json:parse`.

## Notes

- Imports are **one per statement** (write multiple `import` lines).
- There is no grouped import syntax like `import std:json:parse, generate`.
- An alias needs a path of **two or more segments**. `import math as m` is a parse error;
  write `import lib:math as m`, or import normally and rebind with `m = math`.
- Importing something that does not resolve is an error at import time, not at first use.


