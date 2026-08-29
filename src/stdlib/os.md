# Operating System (`std:os`)

Inspect the host and the current process, and create or remove files and
directories.

## Overview

`std:os` exports:

| Function | Returns | Description |
|---|---|---|
| `name()` | String | `"linux"`, `"darwin"` or `"windows"` |
| `hostname()` | String | Host name |
| `uptime_ms()` | Number | Milliseconds since the machine booted |
| `tmp_dir()` | String | Temporary directory |
| `home_dir()` | String | Current user's home directory |
| `work_dir()` | String | Current working directory |
| `pid()` | Number | Process id |
| `ppid()` | Number | Parent process id |
| `uid()` | Number | User id |
| `gid()` | Number | Group id |
| `exit(code)` | — | Terminate the process with `code` |
| `mkdir(path, create_all = true)` | nil | Create a directory |
| `rm(path)` | nil | Delete a file |
| `rmdir(path)` | nil | Delete an empty directory |
| `stat(path, follow_symlinks = false)` | Map | File metadata |

There is **no** `os:exec` — run external commands with backtick shell templates.
There is no `os:env` either; environment variables live in [`std:env`](env.md).
Directory listing and file moves are not part of the module; use the shell
(`` `ls -1 dir` ``, `` `mv a b` ``).

## Quick Start

```suji
import std:os
import std:println

println(os:name()::is_string())    # true
println(os:work_dir()::is_string())  # true
println(os:pid() > 0)              # true
```

## Host and Process Information

```suji
import std:os
import std:println

platform = os:name()
println(["linux", "darwin", "windows"]::contains(platform))  # true

println(os:hostname()::length() > 0)  # true
println(os:uid() >= 0)                # true
println(os:gid() >= 0)                # true
println(os:ppid() > 0)                # true
```

### Platform Branching

```suji
import std:os
import std:println

opener = match os:name() {
    "darwin" => "open",
    "linux" => "xdg-open",
    _ => "start",
}

println(opener::is_string())  # true
```

### Directories

`tmp_dir()`, `home_dir()` and `work_dir()` return absolute paths.

```suji
import std:os
import std:path
import std:println

cache = path:join([os:home_dir(), ".cache", "demo"])
println(path:is_abs(cache))  # true

scratch = path:join([os:tmp_dir(), "demo-work"])
os:mkdir(scratch)
println(os:stat(scratch):is_directory)  # true
os:rmdir(scratch)
```

### `uptime_ms()`

Milliseconds since the machine booted, derived from a whole-second value — so it
is not useful for timing short operations. Use `time:now():epoch_ms` for that.

```suji
import std:os
import std:println

println(os:uptime_ms() > 0)  # true
```

### `exit(code)`

Terminates the process immediately with the given exit status. Nothing after it
runs.

```suji
import std:os
import std:println

status = 0
match {
    status != 0 => { os:exit(status) }
    _ => { println("continuing") }
}
```

## Files and Directories

### `mkdir(path, create_all = true)`

Creates a directory. With the default `create_all = true` any missing parents are
created too and an existing directory is not an error. With `create_all = false`
the parent must already exist.

```suji
import std:os
import std:path
import std:println

root = `mktemp -d`
nested = path:join([root, "a", "b", "c"])

os:mkdir(nested)
println(os:stat(nested):is_directory)  # true

os:mkdir(nested)  # idempotent with create_all = true
println(os:stat(nested):is_directory)  # true
```

### `rm(path)` and `rmdir(path)`

`rm` deletes a file and `rmdir` deletes an **empty** directory. Using `rm` on a
directory raises `Invalid operation: Cannot remove directory '<path>'; use
os:rmdir`.

```suji
import std:io
import std:os
import std:path
import std:println

root = `mktemp -d`
file = path:join([root, "note.txt"])

f = io:open(file, true, true)
f::write("temporary\n")
f::close()

os:rm(file)
println(`test -e "${file}" && echo yes || echo no`)  # no

os:rmdir(root)
println(`test -e "${root}" && echo yes || echo no`)  # no
```

To remove a non-empty tree, delete the contents first or shell out to
`` `rm -rf dir` ``.

### `stat(path, follow_symlinks = false)`

Returns a map of metadata. `follow_symlinks = false` (the default) describes the
link itself; passing `true` describes the target.

| Field | Type | Description |
|---|---|---|
| `size` | Number | Size in bytes |
| `is_directory` | Boolean | Whether the path is a directory |
| `is_symlink` | Boolean | Whether the path is a symbolic link |
| `mtime` | Number | Last modification time, epoch milliseconds |
| `atime` | Number | Last access time, epoch milliseconds |
| `ctime` | Number | Creation time, epoch milliseconds |
| `link` | String or nil | Symlink target, `nil` when not a symlink |
| `inode` | Number | Inode number (`0` on Windows) |
| `mode` | Number | Raw Unix mode bits (file attributes on Windows) |
| `uid` | Number | Owning user id (`0` on Windows) |
| `gid` | Number | Owning group id (`0` on Windows) |

```suji
import std:io
import std:os
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("0123456789")
f::close()

s = os:stat(p)
println(s:size)          # 10
println(s:is_directory)  # false
println(s:is_symlink)    # false
println(s:link)          # nil
println(s:mtime > 0)     # true
```

Permission bits are the low nine bits of `mode`, so `mode % 512` gives the
familiar octal value as a decimal number (`384` is `0600`):

```suji
import std:io
import std:os
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("x")
f::close()

`chmod 640 "${p}"`
println(os:stat(p):mode % 512)  # 416
```

Following a symlink changes both `is_symlink` and `size`:

```suji
import std:io
import std:os
import std:path
import std:println

root = `mktemp -d`
target = path:join([root, "target.txt"])
link = path:join([root, "link.txt"])

f = io:open(target, true, true)
f::write("hello world\n")
f::close()
`ln -s "${target}" "${link}"`

println(os:stat(link):is_symlink)        # true
println(os:stat(link):link == target)    # true
println(os:stat(link, true):is_symlink)  # false
println(os:stat(link, true):size)        # 12
```

## Checking Whether a Path Exists

`os:stat` **raises** on a missing path rather than returning `nil`, and there is
no way to trap a runtime error, so probe with the shell before calling it:

```suji
import std:os
import std:println

p = `mktemp`

exists = `test -e "${p}" && echo yes || echo no`
size = match exists {
    "yes" => os:stat(p):size,
    _ => 0,
}

println(size)  # 0
```

The same pattern distinguishes files from directories:

```suji
import std:println

d = `mktemp -d`
kind = `test -d "${d}" && echo dir || echo file`
println(kind)  # dir
```

## Gotchas

- `os:stat` on a missing path terminates the program with
  `Invalid operation: Failed to stat '<path>'`.
- `os:rm` refuses directories and `os:rmdir` refuses non-empty directories.
- `uptime_ms()` measures machine uptime, not process or wall-clock time.
- A backtick command that exits non-zero terminates the script, which is why the
  existence probes above end in `|| echo no`.
- `mode`, `uid`, `gid` and `inode` are placeholders on Windows.

## See Also

- [I/O and Streams](io.md)
- [Paths](path.md)
- [Environment](env.md)
- [Time and Dates](time.md)
- [Shell Integration Best Practices](../advanced/shell-integration.md)
