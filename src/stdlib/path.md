# Paths (`std:path`)

Build and take apart filesystem paths as strings.

## Overview

`std:path` exports five functions, all of them purely textual — none of them
touches the filesystem:

| Function | Returns | Description |
|---|---|---|
| `is_abs(p)` | Boolean | Whether `p` is an absolute path |
| `join(parts)` | String | Join the parts of **one list** into a path |
| `dirname(p)` | String | Everything before the final component |
| `basename(p)` | String | The final component |
| `extname(p)` | String | The extension, including the leading dot |
| `normalize(p)` | String | Collapse `.` and `..` segments lexically |

There is no `path:exists`, `path:absolute`, `path:extension`, `path:read` or
`path:write`. Use [`std:os`](os.md) for metadata and [`std:io`](io.md) for
contents.

## Quick Start

```suji
import std:path
import std:println

full = path:join(["/var", "data", "users.json"])
println(full)                  # /var/data/users.json

println(path:dirname(full))    # /var/data
println(path:basename(full))   # users.json
println(path:extname(full))    # .json
println(path:is_abs(full))     # true
```

## `is_abs(p)`

```suji
import std:path
import std:println

println(path:is_abs("/etc/hosts"))  # true
println(path:is_abs("etc/hosts"))   # false
println(path:is_abs("~/notes"))     # false
```

`~` is not expanded — use `os:home_dir()` when you need the home directory.

## `join(parts)`

Takes a **single list** of components and joins them with the platform
separator. It is a one-argument function: `path:join("a", "b")` raises
`Arity mismatch: Function expects 1 arguments, got 2`.

```suji
import std:path
import std:println

println(path:join(["home", "user", "file.txt"]))  # home/user/file.txt
println(path:join(["/etc", "nginx", "nginx.conf"]))  # /etc/nginx/nginx.conf
```

An absolute component discards everything before it, and `..` segments are kept
until you normalize:

```suji
import std:path
import std:println

println(path:join(["a", "/b"]))          # /b
println(path:join(["a/b", "../c"]))      # a/b/../c
println(path:normalize(path:join(["a/b", "../c"])))  # a/c
```

Combine it with `std:os` to build paths relative to a well-known directory:

```suji
import std:os
import std:path
import std:println

log_file = path:join([os:tmp_dir(), "demo", "run.log"])
println(path:basename(log_file))  # run.log
println(path:extname(log_file))   # .log
```

## `dirname(p)`

Returns the parent portion of the path. A bare filename has `"."` as its
directory, and the root is its own parent.

```suji
import std:path
import std:println

println(path:dirname("/home/user/file.txt"))  # /home/user
println(path:dirname("file.txt"))             # .
println(path:dirname("/"))                    # /
```

## `basename(p)`

Returns the final component. A trailing separator is ignored.

```suji
import std:path
import std:println

println(path:basename("/home/user/file.txt"))  # file.txt
println(path:basename("/a/b/"))                # b
println(path:basename("archive.tar.gz"))       # archive.tar.gz
```

## `extname(p)`

Returns the extension including the dot, or `""` when there is none. Only the
last extension is returned, and a leading-dot filename such as `.gitignore`
counts as having no extension.

```suji
import std:path
import std:println

println(path:extname("report.pdf"))     # .pdf
println(path:extname("archive.tar.gz")) # .gz
println(path:extname("README"))         #
println(path:extname(".gitignore"))     #
```

Strip an extension by combining `basename` with `dirname` and `join`:

```suji
import std:path
import std:println

swap_extension = |p, ext| {
    name = path:basename(p)
    stem = name[0;name::length() - path:extname(p)::length()]
    path:join([path:dirname(p), stem + ext])
}

println(swap_extension("/tmp/notes/report.md", ".html"))  # /tmp/notes/report.html
```

## `normalize(p)`

Collapses `.` and `..` segments and redundant separators. It is a purely
lexical operation: symlinks are not resolved, the path need not exist, and a
relative path stays relative.

```suji
import std:path
import std:println

println(path:normalize("/home/user/../user/./file.txt"))  # /home/user/file.txt
println(path:normalize("a/./b/../c"))                     # a/c
println(path:normalize("./a//b/"))                        # a/b
println(path:normalize("../x"))                           # ../x
```

## Working with Filesystem Metadata

`std:path` says nothing about whether a path exists. Pair it with `os:stat`,
guarding the call because `os:stat` raises on a missing path:

```suji
import std:io
import std:os
import std:path
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("hello\n")
f::close()

exists = `test -e "${p}" && echo yes || echo no`
size = match exists {
    "yes" => os:stat(p):size,
    _ => 0,
}

println("${path:basename(p)::length() > 0} ${size}")  # true 6
```

## Gotchas

- `join` takes one list, not a variable number of arguments.
- `normalize` never consults the filesystem, so it cannot resolve symlinks and
  cannot turn a relative path into an absolute one; prefix `os:work_dir()`
  yourself when you need that.
- `extname` includes the dot, so comparisons are against `".json"`, not
  `"json"`.
- Separators follow the host platform, so hard-coding `/` in a joined path
  defeats the point of `join`.

## See Also

- [I/O and Streams](io.md)
- [Operating System](os.md)
- [Strings](../fundamentals/data-types/strings.md)
