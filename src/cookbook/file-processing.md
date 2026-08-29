# File Processing Recipes

Practical recipes for working with files and directories.

Every recipe below creates its own sample input in a temp file, so you can paste any block straight into a `.si` file and run it.

## Reading Line by Line

`stream::read_all()` and `stream::read_lines()` are eager — they pull the whole file into memory. To process a large file one line at a time, loop on `read_line()`, which returns `nil` at end of file.

### Recipe

```suji
import std:io
import std:os
import std:println

# Sample input
path = `mktemp`
f = io:open(path, true, true)
f::write("""INFO  service started
ERROR database connection refused
INFO  retrying
ERROR database connection refused
""")
f::close()

process_large_file = |filename| {
    line_count = 0
    error_count = 0

    file = io:open(filename)
    loop {
        line = file::read_line()
        line == nil && break

        line_count++
        match { line ~ /ERROR/ => { error_count++ } }
    }
    file::close()

    { "lines": line_count, "errors": error_count }
}

stats = process_large_file(path)
println("Processed ${stats:lines} lines, found ${stats:errors} errors")

os:rm(path)
```

Output:

```text
Processed 4 lines, found 2 errors
```

### Use Cases

- Processing log files
- Analyzing large text files
- Streaming data transformation
- Memory-efficient file parsing

## CSV Processing

Parse and transform CSV data with `std:csv`. `csv:parse` returns a list of rows, and every cell is a **string** — convert with `::to_number()` when you need arithmetic.

### Recipe

```suji
import std:csv
import std:io
import std:os
import std:println

# Sample input
path = `mktemp`
f = io:open(path, true, true)
f::write("""customer,amount,date,category
Alice,1200,2024-01-15,retail
Bob,300,2024-01-16,retail
Carol,4500,2024-01-17,wholesale
""")
f::close()

file = io:open(path)
content = file::read_all()
file::close()
rows = csv:parse(content)

# Skip the header row, keep the large orders
large = rows[1;]
    ::filter(|row| row[1]::to_number() > 1000)
    ::map(|row| {
        "customer": row[0],
        "amount": row[1]::to_number(),
        "date": row[2],
        "category": row[3],
    })

total = large::fold(0, |acc, row| acc + row:amount)
println("Large orders: ${large::length()}")
println("Total: ${total}")

# Write the filtered rows back out. csv:generate requires string cells,
# so convert numbers with ::to_string().
body = large::map(|row| [row:customer, row:amount::to_string()])
out_rows = [["customer", "amount"]] + body
out_path = `mktemp`
out_file = io:open(out_path, true, true)  # create=true, truncate=true
out_file::write(csv:generate(out_rows))
out_file::close()

println(`cat ${out_path}`)

os:rm(path)
os:rm(out_path)
```

Output:

```text
Large orders: 2
Total: 5700
customer,amount
Alice,1200
Carol,4500
```

### Variations

#### Convert CSV to JSON

```suji
import std:csv
import std:io
import std:json
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("id,name\n1,Alice\n2,Bob\n")
f::close()

file = io:open(path)
rows = csv:parse(file::read_all())
file::close()

headers = rows[0]
records = rows[1;]::map(|row| {
    record = {}
    loop through 0..headers::length() with i {
        record[headers[i]] = row[i]
    }
    record
})

println(json:generate(records))

os:rm(path)
```

```text
[{"id":"1","name":"Alice"},{"id":"2","name":"Bob"}]
```

## Log Analysis

Extract and analyze information from log files. Suji's regex support is match-only (no capture groups), so pull fields out with `index_of` and slicing.

### Recipe

```suji
import std:io
import std:os
import std:println

# Sample input
path = `mktemp`
f = io:open(path, true, true)
f::write("""[2024-01-15 10:30:00] ERROR: Database connection failed
[2024-01-15 10:30:05] WARN: Retry scheduled
[2024-01-15 10:30:06] INFO: HTTP GET /health 200
[2024-01-15 10:31:00] ERROR: Database connection failed
""")
f::close()

parse_entry = |line| {
    close = line::index_of("]")
    timestamp = match { close >= 0 => line[1;close], _ => "unknown", }

    rest = match { close >= 0 => line[(close + 2);], _ => line, }
    sep = rest::index_of(": ")
    level = match { sep >= 0 => rest[0;sep], _ => "UNKNOWN", }
    message = match { sep >= 0 => rest[(sep + 2);], _ => rest, }

    { "timestamp": timestamp, "level": level, "message": message }
}

analyze_logs = |log_file| {
    errors = []
    warnings = []
    requests = 0

    file = io:open(log_file)
    lines = file::read_lines()
    file::close()

    loop through lines with line {
        entry = parse_entry(line)
        match entry:level {
            "ERROR" => { errors::push(entry) }
            "WARN" => { warnings::push(entry) }
        }
        match { line ~ /HTTP/ => { requests++ } }
    }

    {
        "error_count": errors::length(),
        "warning_count": warnings::length(),
        "request_count": requests,
        "first_error": errors::first(nil),
    }
}

report = analyze_logs(path)
println("Errors: ${report:error_count}")
println("Warnings: ${report:warning_count}")
println("Requests: ${report:request_count}")
println("First error: ${report:first_error:message}")

os:rm(path)
```

Output:

```text
Errors: 2
Warnings: 1
Requests: 1
First error: Database connection failed
```

## Batch Operations

The standard library has no directory listing function, so use the shell for discovery and Suji for the logic. `ls -1` returns one name per line; split it and drop the empty trailing entry.

### Recipe: Batch Rename

```suji
import std:os
import std:path
import std:println

# Sample directory with three files
dir = `mktemp -d`
loop through ["notes.txt", "todo.txt", "image.png"] with name {
    `touch ${dir}/${name}`
}

list_files = |directory| `ls -1 ${directory}`
    ::split("\n")
    ::filter(|n| n::length() > 0)

batch_rename = |directory, pattern, old_ext, new_ext| {
    renamed = 0

    loop through list_files(directory) with file {
        file !~ pattern && continue

        new_name = file::replace(old_ext, new_ext)
        old_path = path:join([directory, file])
        new_path = path:join([directory, new_name])
        `mv ${old_path} ${new_path}`

        renamed++
        println("Renamed: ${file} -> ${new_name}")
    }

    println("Renamed ${renamed} files")
}

batch_rename(dir, /\.txt$/, ".txt", ".md")

`rm -rf ${dir}`
```

Output:

```text
Renamed: notes.txt -> notes.md
Renamed: todo.txt -> todo.md
Renamed 2 files
```

### Recipe: Batch Backup

```suji
import std:os
import std:path
import std:println
import std:time

dir = `mktemp -d`
loop through ["a.json", "b.json", "c.yaml"] with name {
    `touch ${dir}/${name}`
}

backup_files = |directory, pattern| {
    stamp = time:now():epoch_ms
    backup_dir = "${directory}_backup_${stamp}"
    os:mkdir(backup_dir)

    files = `ls -1 ${directory}`
        ::split("\n")
        ::filter(|n| n::length() > 0)

    matching = files::filter(|f| f ~ pattern)

    loop through matching with file {
        source = path:join([directory, file])
        dest = path:join([backup_dir, file])
        `cp ${source} ${dest}`
        println("Backed up: ${file}")
    }

    println("Backed up ${matching::length()} files")
    backup_dir
}

backup_dir = backup_files(dir, /\.json$/)

`rm -rf ${dir} ${backup_dir}`
```

Output:

```text
Backed up: a.json
Backed up: b.json
Backed up 2 files
```

## Directory Traversal

There is no recursive walker in the stdlib either — `find` does the walking and Suji does the work.

### Recipe

```suji
import std:println

dir = `mktemp -d`
`mkdir -p ${dir}/src/nested`
`touch ${dir}/src/main.si ${dir}/src/nested/util.si ${dir}/src/notes.txt`

walk_files = |root| `find ${root} -type f`
    ::split("\n")
    ::filter(|p| p::length() > 0)

all_files = walk_files(dir)
si_files = all_files::filter(|p| p ~ /\.si$/)

println("Found ${all_files::length()} files")
println("Suji sources: ${si_files::length()}")

`rm -rf ${dir}`
```

Output:

```text
Found 3 files
Suji sources: 2
```

### Use Case: Count Lines of Code

```suji
import std:io
import std:println

dir = `mktemp -d`
f1 = io:open("${dir}/a.si", true, true)
f1::write("import std:println\nprintln(1)\n")
f1::close()
f2 = io:open("${dir}/b.si", true, true)
f2::write("x = 1\n")
f2::close()

count_loc = |directory, pattern| {
    total_lines = 0
    file_count = 0

    paths = `find ${directory} -type f`
        ::split("\n")
        ::filter(|p| p::length() > 0)

    loop through paths::filter(|p| p ~ pattern) with filepath {
        file = io:open(filepath)
        total_lines += file::read_lines()::length()
        file::close()
        file_count++
    }

    {
        "files": file_count,
        "lines": total_lines,
        "average": match {
            file_count > 0 => total_lines / file_count,
            _ => 0,
        },
    }
}

stats = count_loc(dir, /\.si$/)
println("Files: ${stats:files}")
println("Total lines: ${stats:lines}")
println("Average: ${stats:average::round()}")

`rm -rf ${dir}`
```

Output:

```text
Files: 2
Total lines: 3
Average: 2
```

## Checking Whether a File Exists

`os:stat` raises a fatal error when the path is missing, and there is no way to catch it — so test first with the shell, which can absorb the failure:

```suji
import std:println

exists = |p| `test -e "${p}" && echo yes || echo no` == "yes"

println(exists("/etc/hosts"))         # true
println(exists("/no/such/file"))      # false
```

Once you know the path exists, `os:stat(path)` gives you `size`, `is_directory`, `mtime` and friends.

## Best Practices

### DO:
- Use `read_line()` in a loop for large files; `read_all()` and `read_lines()` load everything
- Check that a file exists (`test -e` via the shell) before `os:stat` or `io:open`
- Close streams with `::close()` when you are done
- Build paths with `path:join([a, b])` instead of string concatenation
- Quote interpolated paths in shell commands: `` `ls -1 "${dir}"` ``

### DON'T:
- Assume `os:stat` returns `nil` for a missing path — it terminates the script
- Let a shell command that may fail run unguarded; add `|| true` or `&& echo yes || echo no`
- Feed numbers to `csv:generate` — every cell must be a string
- Hardcode file paths that only exist on your machine
- Forget that `csv:parse` keeps the header row as row `0`

## See Also

- [I/O and Streams](../stdlib/io.md)
- [Operating System](../stdlib/os.md)
- [Paths](../stdlib/path.md)
- [CSV Module](../stdlib/data-formats/csv.md)
- [Scripting Recipes](scripting.md)
