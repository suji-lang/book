# CSV (`std:csv`)

Parse and generate delimiter-separated tabular text.

## Overview

`std:csv` exports exactly two functions:

- `parse(text, delimiter = ",")` → **List of lists of strings**
- `generate(rows, delimiter = ",")` → String

`parse` is purely positional: it does **not** interpret the first row as headers
and never produces maps. Every cell comes back as a string.

## Quick Start

```suji
import std:csv
import std:println

rows = csv:parse("name,age\nAlice,30\nBob,25\n")

println(rows::length())  # 3
println(rows[0])         # [name, age]
println(rows[1][0])      # Alice
println(rows[1][1]::to_number() + 1)  # 31
```

## `parse(text, delimiter = ",")`

Returns a list of rows, each row a list of string cells. Quoted fields may
contain the delimiter, embedded quotes and newlines; empty input yields an empty
list, and blank trailing lines are ignored.

```suji
import std:csv
import std:println

println(csv:parse(""))                     # []
println(csv:parse("a,\"b,c\",d"))          # [[a, b,c, d]]
println(csv:parse("a,\"multi\nline\""))    # [[a, multi
                                           # line]]
```

Every row must have the same number of fields — a ragged row raises
`CSV parse error`:

```suji
import std:csv

# csv:parse("a,b\nc")
# Error: CSV parse error: Invalid CSV: CSV error: record 1 (line: 2, byte: 4):
# found record with 1 fields, but the previous record has 2 fields
```

### Other Delimiters

```suji
import std:csv
import std:println

println(csv:parse("a;b\n1;2", ";"))    # [[a, b], [1, 2]]
println(csv:parse("x\ty", "\t"))       # [[x, y]]
```

### Using the Header Row

Convert rows to maps yourself when you want access by name:

```suji
import std:csv
import std:println

rows = csv:parse("name,age,city\nAlice,30,Boston\nBob,25,NYC\n")
header = rows[0]

records = rows[1;]::map(|row| {
    record = {}
    loop through 0..header::length() with i {
        record[header[i]] = row[i]
    }
    record
})

println(records::length())     # 2
println(records[0]:name)       # Alice
println(records[1]:city)       # NYC
```

### Filtering and Aggregating

```suji
import std:csv
import std:println

rows = csv:parse("name,age\nAlice,30\nBob,17\nCara,42\n")
data = rows[1;]

adults = data::filter(|row| row[1]::to_number() >= 18)
println(adults::length())  # 2

ages = data::map(|row| row[1]::to_number())
println(ages::sum())       # 89
println(ages::max())       # 42
```

## `generate(rows, delimiter = ",")`

Takes a list of lists and returns CSV text ending with a newline. Cells
containing the delimiter, a quote or a newline are quoted and escaped
automatically.

```suji
import std:csv
import std:println

text = csv:generate([["name", "age"], ["Alice", "30"], ["Bob", "25"]])
println(text::trim())
```

Output:

```csv
name,age
Alice,30
Bob,25
```

```suji
import std:csv
import std:println

println(csv:generate([["has \"quote\"", "and,comma"]])::trim())
# "has ""quote""","and,comma"
```

### Every Cell Must Be a String

Numbers and booleans are rejected, so convert before generating:

```suji
import std:csv

# csv:generate([["Alice", 30]])
# Error: CSV generation error: csv:generate expects all cells to be strings
```

```suji
import std:csv
import std:println

people = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]

rows = [["name", "age"]]
loop through people with p {
    rows::push([p:name, p:age::to_string()])
}

println(csv:generate(rows)::trim())
```

Output:

```csv
name,age
Alice,30
Bob,25
```

Rows must be lists: a list of maps or a flat list of strings raises
`CSV generation error: csv:generate expects all rows to be lists`.

## Files

```suji
import std:csv
import std:io
import std:println

p = `mktemp`

out = io:open(p, true, true)
out::write(csv:generate([["name", "age"], ["Alice", "30"], ["Bob", "17"]]))
out::close()

f = io:open(p)
rows = csv:parse(f::read_all())
f::close()

adults = rows[1;]::filter(|row| row[1]::to_number() >= 18)
println(adults::length())  # 1
println(adults[0][0])      # Alice
```

## Gotchas

- `parse` returns lists, never maps: `rows[0]:name` is a type error. Index by
  position, or build maps from the header row as shown above.
- All parsed cells are strings, including numeric columns; use `::to_number()`,
  and validate first because an unparsable value is a runtime error.
- All generated cells must already be strings.
- Ragged rows fail on parse rather than being padded.
- `generate` output ends with a newline; `::trim()` it when printing inline.

## See Also

- [Data Formats](README.md)
- [JSON](json.md)
- [I/O and Streams](../io.md)
- [Lists](../../fundamentals/data-types/lists.md)
