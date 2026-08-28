# Cookbook

Practical recipes for common programming tasks in Suji.

## Overview

The Cookbook provides ready-to-use solutions for everyday programming challenges. Each recipe includes:

- Complete working code
- Step-by-step explanations
- Real-world use cases
- Common variations
- Best practices

Every code block on these pages is a complete program: it creates whatever input it needs — a literal, or a temp file it cleans up afterwards — so you can copy one into `recipe.si` and run `suji recipe.si` unchanged. The only exception is [HTTP with curl](http.md), whose recipes make real network requests.

## Recipe Categories

### File Processing

Work with files efficiently:

- **[Reading Files Line by Line](file-processing.md#reading-line-by-line)** - Stream a file with `read_line()` instead of loading it
- **[Processing CSV Files](file-processing.md#csv-processing)** - Parse and transform CSV data
- **[Log File Analysis](file-processing.md#log-analysis)** - Extract insights from log files
- **[Batch File Operations](file-processing.md#batch-operations)** - Rename, copy or back up many files
- **[Directory Traversal](file-processing.md#directory-traversal)** - Walk directory trees with `find`
- **[Checking a File Exists](file-processing.md#checking-whether-a-file-exists)** - Test paths without aborting the script

### Data Transformation

Transform data between formats:

- **[JSON to YAML](data-transformation.md#json-to-yaml)** - Convert between data formats
- **[CSV to JSON](data-transformation.md#csv-to-json)** - Transform tabular data
- **[Data Filtering](data-transformation.md#filtering)** - Filter datasets with predicates
- **[Nested Data Manipulation](data-transformation.md#nested-data)** - Work with complex structures
- **[Aggregation and Grouping](data-transformation.md#aggregation)** - Summarize data
- **[Data Validation](data-transformation.md#validation)** - Validate data structures

### Configuration Management

Manage application configuration:

- **[Loading Config](config-management.md#loading)** - Read from multiple sources
- **[Environment Settings](config-management.md#environments)** - Handle different environments
- **[Config Validation](config-management.md#validation)** - Ensure valid configuration
- **[Config Merging](config-management.md#merging)** - Combine configuration objects
- **[Type-Safe Access](config-management.md#type-safe-access)** - Access config safely

### Working with APIs

HTTP and API integration:

- **[Making HTTP Requests](apis.md#http-requests)** - GET, POST, PUT, DELETE with `curl`
- **[JSON API Consumption](apis.md#json-apis)** - Parse API responses
- **[Authentication](apis.md#authentication)** - Handle API keys and tokens
- **[Error Handling](apis.md#error-handling)** - Graceful failure handling
- **[Rate Limiting](apis.md#rate-limiting)** - Respect API limits
- **[Pagination](apis.md#pagination)** - Handle paginated responses

### Text Processing

String manipulation and regex:

- **[Email Validation](text-processing.md#email-validation)** - Validate email formats
- **[URL Extraction](text-processing.md#url-extraction)** - Extract URLs from text
- **[Log Parsing](text-processing.md#log-parsing)** - Parse structured logs
- **[Template Generation](text-processing.md#template-generation)** - Generate text from templates
- **[Text Search and Replace](text-processing.md#text-search-and-replace)** - Normalize and rewrite text

### Scripting Tasks

Automation and workflows:

- **[Script Arguments](scripting.md#script-arguments)** - Read `env:args` safely
- **[Standard Input](scripting.md#reading-standard-input)** - Consume piped input
- **[Shell Commands](scripting.md#running-shell-commands)** - Backticks, quoting and failure handling
- **[Pipelines](scripting.md#pipelines)** - Pipe closures into commands and back
- **[Retry and Poll Loops](scripting.md#retry-and-poll-loops)** - Wait for something to become ready
- **[Backup Script](scripting.md#worked-example-backup-script)** - A complete worked script

## Quick Examples

### Read and Process CSV

```suji
import std:csv
import std:io
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("name,age\nAlice,34\nBob,12\nCarol,29\n")
f::close()

file = io:open(path)
rows = csv:parse(file::read_all())
file::close()

adults = rows[1;]
    ::filter(|row| row[1]::to_number() >= 18)
    ::map(|row| row[0])

println("Adults: ${adults::join(", ")}")  # Adults: Alice, Carol

os:rm(path)
```

### Parse API Data

```suji
import std:json
import std:println

text = '[{"name": "Alice"}, {"name": "Bob"}]'
users = json:parse(text)

println("Loaded ${users::length()} users")  # Loaded 2 users
```

Swap the literal for `` `curl -fsSL <url>` `` to read the same shape off the network — see [HTTP with curl](http.md).

### Process Log Files

```suji
import std:io
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("INFO started\nERROR disk full\nERROR disk full\n")
f::close()

file = io:open(path)
lines = file::read_lines()
file::close()

errors = lines::filter(|line| line ~ /ERROR/)
println("Found ${errors::length()} errors")  # Found 2 errors

os:rm(path)
```

### Generate Report

```suji
import std:io
import std:os
import std:println

data = { total: 12500, average: 4166.67 }

report = """<html>
<head><title>Sales Report</title></head>
<body>
    <h1>Sales Report</h1>
    <p>Total Sales: ${data:total}</p>
    <p>Average: ${data:average}</p>
</body>
</html>"""

path = `mktemp`
out_file = io:open(path, true, true)  # create=true, truncate=true
out_file::write(report)
out_file::close()

println(`grep -c '<p>' ${path}`)  # 2

os:rm(path)
```

## How to Use This Cookbook

1. **Browse by Category** - Find recipes related to your task
2. **Copy and Adapt** - Start with working code, modify for your needs
3. **Understand the Pattern** - Learn the underlying approach
4. **Experiment** - Try variations and extensions

## Common Patterns

### Defensive Checking Pattern

Suji has no exceptions: a runtime error prints a diagnostic and ends the process. The only strategy is to check before you act, and to return a `(value, error)` tuple instead of throwing.

```suji
import std:io
import std:println

exists = |p| `test -f "${p}" && echo yes || echo no` == "yes"

process_file = |filename| {
    !exists(filename) && return (nil, "File not found")

    file = io:open(filename)
    content = file::read_all()
    file::close()

    return (content::length(), nil)
}

size, error = process_file("/no/such/file")

match {
    error != nil => { println("Error: ${error}") },
    _ => { println("Read ${size} bytes") },
}
```

Output:

```text
Error: File not found
```

### Pipeline Pattern

Chain transformations with method calls, or compose named steps with `>>`:

```suji
import std:println

validate = |xs| xs::filter(|x| x::is_number())
transform = |xs| xs::map(|x| x * 2)
summarize = |xs| xs::sum()

pipeline = validate >> transform >> summarize

println(pipeline([1, "two", 3, 4]))  # 16
```

### Configuration Pattern

Layer defaults, file values and environment variables, then validate the result:

```suji
import std:env
import std:println

defaults = { port: 8080, log_level: "info" }
file_config = { log_level: "debug" }

# merge mutates the receiver, so copy the defaults first
config = defaults
config::merge(file_config)

override = env:var::get("APP_PORT", nil)
match { override != nil => { config["port"] = override::to_number() } }

println("${config:port} / ${config:log_level}")  # 8080 / debug
```

## Tips for Success

### DO:
- Start with working examples
- Check for missing keys, missing files and empty lists before using them
- Use `map::get(key, default)` for anything optional
- Break complex tasks into small named functions
- Guard shell commands that may fail with `|| true`

### DON'T:
- Expect `try`/`catch`, `if`/`else`, `for` or `while` — Suji has none of them
- Rely on truthiness; `&&`, `||` and `!` require real booleans
- Read a huge file with `read_all()` when `read_line()` will do
- Hardcode configuration or absolute paths
- Assume a non-zero exit status from a command is recoverable

## Next Steps

Start with the recipe category most relevant to your task:

1. **[File Processing](file-processing.md)** - Working with files and directories
2. **[Data Transformation](data-transformation.md)** - Converting and filtering data
3. **[Configuration](config-management.md)** - Managing app configuration
4. **[APIs](apis.md)** - HTTP requests and API integration
5. **[Text Processing](text-processing.md)** - String manipulation and regex
6. **[Scripting](scripting.md)** - Automation and workflows

## See Also

- [Standard Library](../stdlib/README.md) - Built-in modules reference
- [Functions](../functions/README.md) - Function programming guide
- [Examples](../examples/README.md) - Complete example programs
