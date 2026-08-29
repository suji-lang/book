# Standard Library Structure

The standard library is imported under the `std` module root:

```suji
import std:println
import std:json
import std:time
```

There is no top-level module for these names: `import json` looks for `json.si` next to
your file and fails. There is also no prelude — even printing needs
`import std:println` in every file that prints.

The available modules are `print`, `println`, `math`, `os`, `path`, `env`, `io`, `time`,
`uuid`, `encoding`, `crypto`, `random`, `json`, `yaml`, `toml`, `csv` and `dotenv`.

## Virtual `std`

In this repository, `std` is provided by embedded Suji source files (see `crates/suji-stdlib/src/std/*.si`). At runtime, the module system resolves `std` without reading from the filesystem.

## `__builtins__`

There is a special virtual module named `__builtins__` that exposes builtin functions implemented by the runtime. The `std` modules are thin wrappers that delegate to these builtins.

For example, the `std:json` module delegates to `__builtins__:json_parse` and `__builtins__:json_generate`.

```suji
import std:json

data = json:parse('{"ok":true}')
text = json:generate(data)
```


