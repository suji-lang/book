# Data Transformation Recipes

Convert, filter, and manipulate data efficiently.

Each recipe writes its own sample input to a temp file so the block runs as-is; replace the temp path with your real file when you adapt it.

## JSON to YAML

Convert between JSON and YAML formats. `std:json` and `std:yaml` both expose exactly `parse(text)` and `generate(value)`.

### Recipe

```suji
import std:io
import std:json
import std:os
import std:println
import std:yaml

# Sample input
json_path = `mktemp`
f = io:open(json_path, true, true)
f::write("""{"service": "api", "port": 8080, "tags": ["web", "public"]}""")
f::close()

file = io:open(json_path)
json_content = file::read_all()
file::close()
data = json:parse(json_content)

yaml_path = `mktemp`
out_file = io:open(yaml_path, true, true)  # create=true, truncate=true
out_file::write(yaml:generate(data))
out_file::close()

println(`cat ${yaml_path}`)

os:rm(json_path)
os:rm(yaml_path)
```

Output:

```text
port: 8080
service: api
tags:
  - web
  - public
```

### Reverse: YAML to JSON

```suji
import std:io
import std:json
import std:os
import std:println
import std:yaml

yaml_path = `mktemp`
f = io:open(yaml_path, true, true)
f::write("service: api\nport: 8080\n")
f::close()

file = io:open(yaml_path)
data = yaml:parse(file::read_all())
file::close()

println(json:generate(data))  # {"port":8080,"service":"api"}

os:rm(yaml_path)
```

## CSV to JSON

Transform tabular data to JSON. Remember that every cell coming out of `csv:parse` is a string.

### Recipe

```suji
import std:csv
import std:io
import std:json
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("""id,name,email,age,active
1,Alice,alice@example.com,34,true
2,Bob,bob@example.com,17,false
""")
f::close()

file = io:open(path)
rows = csv:parse(file::read_all())
file::close()

# Skip the header row and give every column a type
users = rows[1;]::map(|row| {
    "id": row[0]::to_number(),
    "name": row[1],
    "email": row[2],
    "age": row[3]::to_number(),
    "active": row[4] == "true",
})

println(json:generate(users))
println("Converted ${users::length()} rows")

os:rm(path)
```

Output:

```text
[{"active":true,"age":34,"email":"alice@example.com","id":1,"name":"Alice"},{"active":false,"age":17,"email":"bob@example.com","id":2,"name":"Bob"}]
Converted 2 rows
```

## Filtering

Filter datasets with `list::filter` and a predicate closure.

### Recipe

```suji
import std:io
import std:json
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("""[
  {"name": "Alice", "age": 34, "active": true},
  {"name": "Bob", "age": 17, "active": true},
  {"name": "Carol", "age": 41, "active": false}
]""")
f::close()

filter_data = |input_file, output_file, predicate| {
    file = io:open(input_file)
    data = json:parse(file::read_all())
    file::close()

    filtered = data::filter(predicate)

    out_file = io:open(output_file, true, true)  # create=true, truncate=true
    out_file::write(json:generate(filtered))
    out_file::close()

    println("Filtered: ${data::length()} -> ${filtered::length()}")
    filtered
}

out_path = `mktemp`
adults = filter_data(path, out_path, |user| user:active && user:age >= 18)

println(adults::map(|u| u:name)::join(", "))

os:rm(path)
os:rm(out_path)
```

Output:

```text
Filtered: 3 -> 1
Alice
```

Note that `&&` requires booleans on both sides — there is no truthiness in Suji, so write `user:age >= 18`, never `user:age`.

## Nested Data

Work with complex nested structures. Chained key access (`user:profile:contact:email`) reads several levels at once.

### Recipe

```suji
import std:json
import std:println

data = json:parse("""{
  "users": [
    {
      "id": 1,
      "profile": {
        "name": "Alice",
        "contact": {"email": "alice@example.com"},
        "address": {"city": "Oslo", "country": "NO"}
      },
      "permissions": [{"role": "admin"}, {"role": "billing"}]
    }
  ]
}""")

transform_nested = |data| data:users::map(|user| {
    "id": user:id,
    "name": user:profile:name,
    "email": user:profile:contact:email,
    "city": user:profile:address:city,
    "roles": user:permissions::map(|p| p:role),
})

flattened = transform_nested(data)
println(json:generate(flattened))
```

Output:

```text
[{"city":"Oslo","email":"alice@example.com","id":1,"name":"Alice","roles":["admin","billing"]}]
```

### Safe Access Pattern

Reading a missing key raises `Key not found`, and there is no way to catch it. Walk the path with `::get(key, nil)` instead, which yields `nil` for a missing key. `nil::is_map()` is `false` rather than an error, so one guard covers both a missing key and a non-map value part-way down the path:

```suji
import std:println

safe_get = |data, path| {
    result = data
    loop through path with key {
        result = match {
            !result::is_map() => nil,
            _ => result::get(key, nil),
        }
    }
    result
}

user = { profile: { contact: { email: "alice@example.com" } } }

println(safe_get(user, ["profile", "contact", "email"]))  # alice@example.com
println(safe_get(user, ["profile", "phone", "mobile"]))   # nil
```

## Aggregation

Summarize and group data.

### Recipe: Group By

There is no `list::group_by`, but the map methods make it a five-line helper:

```suji
import std:println

group_by = |list, key_fn| {
    result = {}
    loop through list with item {
        key = key_fn(item)
        group = result::get(key, [])
        group::push(item)
        result[key] = group
    }
    result
}

users = [
    { role: "admin", name: "Alice" },
    { role: "user", name: "Bob" },
    { role: "admin", name: "Carol" },
]

by_role = group_by(users, |u| u:role)

loop through by_role with role, members {
    println("${role}: ${members::map(|m| m:name)::join(", ")}")
}
```

Output:

```text
admin: Alice, Carol
user: Bob
```

### Recipe: Aggregation

`sum`, `average`, `min` and `max` are list methods, so most summaries need no folding at all:

```suji
import std:println

sales = [
    { customer: "Alice", amount: 1200 },
    { customer: "Bob", amount: 300 },
    { customer: "Carol", amount: 4500 },
]

aggregate = |data| {
    amounts = data::map(|x| x:amount)
    {
        "total": data::length(),
        "sum": amounts::sum(),
        "average": match {
            amounts::length() > 0 => amounts::average(),
            _ => 0,
        },
        "max": amounts::max(),
        "min": amounts::min(),
    }
}

stats = aggregate(sales)
println("Count: ${stats:total}")
println("Sum: ${stats:sum}")
println("Average: ${stats:average}")
println("Range: ${stats:min} - ${stats:max}")
```

Output:

```text
Count: 3
Sum: 6000
Average: 2000
Range: 300 - 4500
```

`::average()` returns `nil` for an empty list, and `::min()` / `::max()` only work on lists of numbers, which is why the guard is there.

## Validation

Validate data structures before processing them. Collect the problems in a list and return a `(ok, errors)` tuple.

### Recipe

```suji
import std:println

validate_user = |user| {
    errors = []

    # && short-circuits, so the key check protects the value check
    has_name = user::contains("name") && user:name::length() > 0
    has_email = user::contains("email") && user:email ~ /^[^@]+@[^@]+$/
    has_age = user::contains("age") && user:age >= 0 && user:age <= 150

    match { !has_name => { errors::push("Name is required") } }
    match { !has_email => { errors::push("Valid email required") } }
    match { !has_age => { errors::push("Valid age required") } }

    match errors::length() {
        0 => (true, nil),
        _ => (false, errors),
    }
}

validate_dataset = |users| {
    results = users::map(|user| {
        valid, errors = validate_user(user)
        { "user": user, "valid": valid, "errors": errors }
    })

    {
        "total": users::length(),
        "valid": results::filter(|r| r:valid)::length(),
        "invalid": results::filter(|r| !r:valid)::length(),
        "results": results,
    }
}

report = validate_dataset([
    { name: "Alice", email: "alice@example.com", age: 34 },
    { name: "Bob", email: "not-an-email", age: 17 },
    { name: "", email: "carol@example.com", age: 200 },
])

println("Valid: ${report:valid}/${report:total}")
loop through report:results with r {
    r:valid && continue
    println("${r:user:name} -> ${r:errors::join("; ")}")
}
```

Output:

```text
Valid: 1/3
Bob -> Valid email required
 -> Name is required; Valid age required
```

The safety here rests on `&&` short-circuiting: when `user::contains("name")` is `false`, `user:name::length()` is never evaluated, so a missing key produces `false` instead of aborting the script. Writing the two checks in the opposite order would crash.

## Complete Example: Data Pipeline

Transform, filter, validate, and aggregate in one pass.

```suji
import std:io
import std:json
import std:os
import std:println

path = `mktemp`
f = io:open(path, true, true)
f::write("""[
  {"timestamp": "2024-01-15T10:00:00Z", "customer_name": "Alice",
   "total_amount": "1200", "line_items": [1, 2], "region": "eu"},
  {"timestamp": "2024-01-15T11:00:00Z", "customer_name": "Bob",
   "total_amount": "0", "line_items": [1], "region": "us"},
  {"timestamp": "2024-01-16T09:00:00Z", "customer_name": "Carol",
   "total_amount": "4500", "line_items": [1, 2, 3], "region": "eu"}
]""")
f::close()

group_by = |list, key_fn| {
    result = {}
    loop through list with item {
        key = key_fn(item)
        group = result::get(key, [])
        group::push(item)
        result[key] = group
    }
    result
}

process_sales_data = |input_file| {
    # 1. Load
    file = io:open(input_file)
    raw_data = json:parse(file::read_all())
    file::close()

    # 2. Transform
    transformed = raw_data::map(|sale| {
        "date": sale:timestamp[0;10],
        "customer": sale:customer_name,
        "amount": sale:total_amount::to_number(),
        "items": sale:line_items::length(),
        "region": sale:region,
    })

    # 3. Filter (valid sales only)
    is_valid = |sale| sale:amount > 0 && sale:customer::length() > 0
    valid_sales = transformed::filter(is_valid)

    # 4. Aggregate
    amounts = valid_sales::map(|s| s:amount)
    by_region = group_by(valid_sales, |s| s:region)
    {
        "total_sales": valid_sales::length(),
        "revenue": amounts::sum(),
        "average_sale": match {
            amounts::length() > 0 => amounts::average(),
            _ => 0,
        },
        "regions": by_region::keys(),
    }
}

summary = process_sales_data(path)
println("Processed ${summary:total_sales} sales")
println("Total revenue: ${summary:revenue}")
println("Average sale: ${summary:average_sale}")
println("Regions: ${summary:regions::join(", ")}")

os:rm(path)
```

Output:

```text
Processed 2 sales
Total revenue: 5700
Average sale: 2850
Regions: eu
```

## Best Practices

### DO:
- Validate data before transforming it
- Read optional keys with `map::get(key, default)`
- Convert CSV cells with `::to_number()` before doing arithmetic
- Keep transformations pure — return new values instead of mutating inputs
- Document the shape of the data a function expects

### DON'T:
- Index into a map with `:key` unless you know the key is present
- Rely on truthiness — `&&`, `||` and `!` need real booleans
- Assume `json:generate` preserves key order (it sorts keys)
- Mix types with `+`; `"total: " + 1` is a type error, use `"total: ${1}"`
- Build deeply nested one-liners when a named helper reads better

## See Also

- [JSON Module](../stdlib/data-formats/json.md)
- [CSV Module](../stdlib/data-formats/csv.md)
- [Lists](../fundamentals/data-types/lists.md)
- [Maps](../fundamentals/data-types/maps.md)
