# Language Versions

The change history of the Suji language, newest first.

The current version is **0.1.22**, taken from the workspace `Cargo.toml`. Suji is
pre-1.0 and the `0.1.x` series has changed syntax more than once — most recently
slices in 0.1.22 and match arms in 0.1.11 — so treat every version bump as
potentially source-breaking. For the present state of the language see
[Roadmap](../development/roadmap.md); for what each error code means see
[Error Codes](error-codes.md).

## Version 0.1.22

### Slice syntax change (colon to semicolon) — breaking

- Changed the slice separator from `:` to `;`
- Old: `list[start:end]`, `list[:end]`, `list[start:]`, `list[:]`
- New: `list[start;end]`, `list[;end]`, `list[start;]`, `list[;]`
- Resolves the ambiguity between slicing and map access, which share `:`

```suji
import std:println

data = {items: [10, 20, 30, 40], start: 1, end: 3}

println(data:items[data:start;data:end])  # [20, 30]
```

To migrate, search for `:` inside `[ … ]` and replace it with `;`.

### Bugfix: Map literals as standalone expressions

- Map literals can now be used as standalone expressions, not only in `return`
  statements or assignments
- Enables implicit returns of map literals

Note that a map literal with bare identifier keys is still parsed as a block
where a block is expected — as a whole lambda body or match-arm body, quote the
keys or wrap the literal in parentheses.

## Version 0.1.21

### Bugfix: Break and continue with newline-separated identifiers
- Fixed parser bug where `break` and `continue` incorrectly consumed identifiers from next line as labels
- Labels must now be on the same line as the control flow keyword

### Type checking methods
- All types now support type checking methods: `is_number()`, `is_bool()`, `is_string()`, `is_list()`, `is_map()`, `is_stream()`, `is_function()`, `is_tuple()`, `is_regex()`
- Available on all values including `nil`

### std:os:stat function
- Added `os:stat(path, follow_symlinks)` for file/directory metadata
- Returns map with mode, inode, uid, gid, size, timestamps, and type information

### Filesystem operation functions
- Added `os:rm(path)` - remove file
- Added `os:mkdir(path, create_all)` - create directory
- Added `os:rmdir(path)` - remove empty directory

### Random string generation functions
- Added `random:string(allowed_chars, length)` - generate random string from character set
- Added `random:hex_string(length)` - generate hexadecimal string
- Added `random:alpha_string(length, capitals)` - generate alphabetic string
- Added `random:numeric_string(length)` - generate numeric string
- Added `random:alphanumeric_string(length, capitals)` - generate alphanumeric string

## Version 0.1.20

### String trim with custom characters
- `string::trim(chars)` now accepts optional argument to specify which characters to trim
- Default behavior unchanged (trims whitespace)

### Bugfix: Negative integers in match patterns
- Fixed parsing issue where negative integer literals could not be used as match patterns
- Negative integers now work correctly in all match pattern contexts

### std:io:open file creation and truncation control
- Added `create` and `truncate` parameters to `io:open(path, create, truncate)`
- Controls file creation and truncation behavior

## Version 0.1.19

### std:os module
- Added operating system utilities: `name()`, `hostname()`, `uptime_ms()`, `tmp_dir()`, `home_dir()`, `work_dir()`, `exit()`, `pid()`, `ppid()`, `uid()`, `gid()`

### std:dotenv module
- Added `dotenv:load(path, override)` for loading environment variables from `.env` files

### std:csv module
- Added `csv:parse(text, delimiter)` and `csv:generate(rows, delimiter)` for CSV parsing and generation

### std:path module
- Added path utilities: `join()`, `dirname()`, `basename()`, `extname()`, `normalize()`, `is_abs()`

## Version 0.1.18

### Module system: lazy loading
- Modules (including `std`) are now loaded lazily on first access
- Improves startup time and avoids cyclic import recursion

### Inclusive range syntax (..=)
- Added inclusive range variant: `start..=end` includes both endpoints
- Exclusive range unchanged: `start..end` excludes end

### Bugfix: Map and list access with complex expressions
- Fixed limitation where indexing required simple identifiers or literals
- Complex expressions (function calls, method calls, arithmetic, pipelines) now work as indices

### Bugfix: Short-circuit evaluation with statements
- Fixed limitation where logical operators (`&&` and `||`) could not short-circuit to statements
- Now supports `condition && break`, `condition && continue`, `condition && return value`

## Version 0.1.17

### Match syntax changes (optional trailing commas for braced arms)
- Trailing commas now optional for match arms with braced bodies (`=> { ... }`)
- Single-expression arms still require trailing commas, including the final arm

```suji
import std:println

expression_arms = match 1 { 1 => "a", _ => "b", }
braced_arms = match 1 { 1 => { "a" } _ => { "b" } }

println(expression_arms)  # a
println(braced_arms)      # a
```

### std:time module
- Added time utilities: `now()`, `sleep(ms)`, `parse_iso(text)`, `format_iso(epoch_ms, tz)`

### std:uuid module
- Added UUID generation: `v4()`, `v5(namespace_uuid, name)`, `is_valid(text)`

### std:encoding module
- Added encoding utilities: `base64_encode()`, `base64_decode()`, `hex_encode()`, `hex_decode()`, `percent_encode()`, `percent_decode()`

### std:math module
- Added mathematical constants: `PI`, `E`
- Added trigonometric functions: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `atan2()`
- Added logarithmic functions: `log()`, `log10()`, `exp()`

### std:crypto module
- Added hash functions: `md5()`, `sha1()`, `sha256()`, `sha512()`
- Added HMAC: `hmac_sha256(key, text)`

## Version 0.1.16

### Export expressions (maps and leaf values)
- `export` now accepts any expression that evaluates to a value
- Supports both map exports (modules) and leaf exports (single values)

### Import path resolution (files and directories)
- Enhanced import resolution with support for files and directories
- Supports nested module structures

### Special builtins import object (__builtins__)
- Added virtual module `__builtins__` for accessing builtin functions

### Standard library directory (std/) and delegation to builtins
- Standard library now loaded from `std/` directory
- Modules delegate to runtime builtins via `__builtins__`

## Version 0.1.15

### Improvement: Numeric error codes grouped by phase
- Diagnostics gained numeric codes grouped by the phase that raised them,
  starting with lexer (`1xx`), parser (`2xx`) and runtime ranges
- All errors carry spans, so diagnostics can underline the offending expression

The ranges have since shifted: runtime errors moved to `4xx`. See
[Error Codes](error-codes.md) for the current list.

## Version 0.1.14

### Bugfix: function invocation in | pipelines
- Fixed function invocation semantics for `|` pipelines with backtick commands and closures

### Bugfix: operator precedence between | and |> / <|
- Fixed operator precedence so stream pipelines (`|`) bind tighter than apply pipelines (`|>`/`<|`)

## Version 0.1.13

### Formal name change to SUJI
- Language now referred to as **SUJI** or **suji**
- File extension `.si`

### Repository organization
- Source repository split into a Cargo workspace of focused crates: AST,
  diagnostics, lexer, parser, runtime, stdlib, REPL and CLI

## Version 0.1.12

### Compositional function operators (>> and <<)
- Added `f >> g` and `f << g` for composing unary functions

### Pattern alternation in match arms (|)
- Allows multiple patterns in single match arm: `p1 | p2 | p3 => expr`

### Pipe apply with expressions on either side (|>, <|)
- Clarified that `|>` and `<|` accept arbitrary expressions on their expression sides

## Version 0.1.11

### Match syntax changes (=> and trailing commas) — breaking
- Match arms now use `=>` instead of `:`
- Each arm must end with a trailing comma `,`
- Applies to both match statements and match expressions
- 0.1.17 later relaxed the comma requirement for braced arms

## Version 0.1.10

### Runtime error spans and positions
- Runtime errors now include precise source locations with line and column numbers

### Bugfix: String literal interpolation within strings
- Fixed bug where string literals inside interpolation expressions caused errors

### Bugfix: Module method calls in match conditions
- Fixed parsing error where conditional match arms failed with module path plus method invocation

## Version 0.1.9

### Decimal number semantics (rust_decimal)
- Numbers now use base-10 decimal arithmetic via Rust's `rust_decimal`
- Removes binary floating point rounding issues
- Expressions like `0.1 + 0.2 == 0.3` evaluate to `true`

```suji
import std:println

println(0.1 + 0.2)          # 0.3
println(0.1 + 0.2 == 0.3)   # true
```

### std:io:open(path)
- Opens a file as a `stream` for both reading and writing

### Multiple return values and destructuring assignment
- Functions can return multiple values: `return a, b, c`
- Assignments can destructure: `x, y, z = fn_call()`
- Use `_` to discard unneeded values

### Bugfix: Pipe operator requires function invocations
- The `|` pipe operator is used between function invocations, not bare function values

## Version 0.1.8

### Backtick commands in pipes
- Backtick command expressions can be used on either side of the `|` pipe operator

### std:random module
- Added random number generation: `random()`, `integer(a, b)`, `seed(n)`
- Added list helpers: `pick(list)`, `shuffle(list)`, `sample(list, k)`

### Pipe operators (`|>` and `<|`)
- Added `|>` (forward pipe apply) and `<|` (backward pipe apply) operators

## Version 0.1.7

### Rename std:FD to std:io
- `std:FD` module renamed to `std:io`
- Standard streams accessed as `io:stdin`, `io:stdout`, `io:stderr`

### Rename std:ENV to std:env:var
- `std:ENV` module renamed to `std:env:var`
- Environment variables accessed via `var`

### stream::read_line()
- Added method to read a single line from a stream

### stream::is_terminal()
- Added method to check if stream is attached to a terminal

### std:env:args and std:env:argv
- Added command-line arguments access

### Pipe operator (|)
- Added pipe operator `|` that connects stdout of source closure to stdin of destination closure

## Version 0.1.6

### ENV map (std)
- Added `ENV` map under `std` module for environment variables

### List first/last default parameter
- `list::first(default=nil)` and `list::last(default=nil)` accept an optional default value

### List average method
- Added `list::average()` for arithmetic mean

### Stream type
- Added `stream` data type for blocking I/O over file descriptors

### FD streams (std)
- Added `FD` value under `std` module for standard streams

### std:print function
- Added `std:print(text, out)` for writing to streams

### std:println function
- Added `std:println(text, out)` as wrapper around `std:print`

## Version 0.1.5

### New string methods
- Added: `contains()`, `starts_with()`, `ends_with()`, `replace()`, `trim()`, `upper()`, `lower()`, `reverse()`, `repeat()`

### New list methods
- Added: `push(item)`, `pop()`, `length()`, `join(separator=" ")`, `index_of()`, `contains()`, `filter()`, `map()`, `fold()`, `sum()`, `product()`, `reverse()`, `sort()`, `min()`, `max()`, `first(default=nil)`, `last(default=nil)`, `average()`

### New map methods
- Added: `get(key, default)`, `merge(other_map)`

### New number methods
- Added: `abs()`, `ceil()`, `floor()`, `round()`, `sqrt()`, `pow(exponent)`, `min(other)`, `max(other)`

### New tuple methods
- Added: `length()`, `to_list()`, `to_string()`

### Multiline string support
- Added triple quotes `"""` and `'''` for multiline strings

## Version 0.1.4

### YAML module
- Added `std:yaml` module with `parse()` and `generate()` functions

### TOML module
- Added `std:toml` module with `parse()` and `generate()` functions

### Bugfix: Deep nesting support for maps and lists
- Fixed limitation where access was restricted to 2-3 levels of nesting
- Now supports arbitrary depth

### Bugfix: Method calling in conditional match conditions
- Fixed limitation where conditional match statements could not use method calls

### Bugfix: Deep nesting support for import statements
- Fixed limitation where imports were restricted to 2-3 levels of nesting

### Single quote string support
- Single quotes now supported for string literals with same functionality as double quotes

## Version 0.1.3

### Match without expression
- Match statements can now be used without expression: `match { condition => ... }`

### New map methods
- Added: `keys()`, `values()`, `to_list()`, `length()`

### JSON module
- Added `std:json` module with `parse()` and `generate()` functions

## Version 0.1.2

### String indexing
- Strings now support single character indexing with same syntax as lists

### Descending ranges
- Range literals now support descending ranges where start > end

### List concatenation
- Lists can now be concatenated using the `+` operator

### Wildcards in tuple patterns
- Match statements support wildcard patterns (`_`) within tuple patterns

### Map iteration
- Maps can be iterated using `loop through map with key, value`

### Map contains method
- Added `map::contains(key)` method

### Bugfixes
- Return statements in match arms
- Map literals in match arms
- Nil comparisons in match arms

## Version 0.1.1

### Variable scope changes
- No variable shadowing: assignment in nested scope assigns to parent variable

### New operators
- Compound assignment operators: `+=`, `-=`, `*=`, `/=`, `%=`

### New type methods
- Cast methods: `string::to_number()`, `number::to_string()`, `string::to_list()`
- Number validation: `number::is_int()`

### New iterator methods
- List iterator methods: `filter()`, `map()`, `fold()`, `sum()`, `product()`

### New search methods
- `list::index_of(elem)`, `string::index_of(substring)`

### New string slicing
- String slicing works same as list slicing

### Complex assignments
- Support for nested assignments to complex data structures

### Optional return statements
- Functions can omit `return` keyword - automatically return last expression

### Match expressions
- Match statements are expressions that evaluate to value of matching branch

### Optional braces for single expressions
- Match branch blocks and function bodies can omit curly braces for single expressions

### Semicolon statement separators
- Semicolons can be used as statement separators

### Null type
- Added `nil` type representing absence of value

## Version 0.1.0

Initial release with core features:
- Basic data types (Number, Boolean, String, List, Map, Tuple, Regex)
- Control flow (loops, match)
- Functions and closures
- Modules and imports
- String interpolation
- Regular expressions
- Shell integration

## See Also

- [Roadmap](../development/roadmap.md)
- [Syntax Reference](syntax-reference.md)
- [Error Codes](error-codes.md)
- [Language Design](../development/design.md)
