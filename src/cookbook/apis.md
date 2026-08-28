# Working with APIs

Use backtick shell commands (e.g. `curl`) and parse responses with `std:json`, `std:yaml`, etc.

See also: [HTTP with curl](http.md)

Recipes about request mechanics make real calls against
[JSONPlaceholder](https://jsonplaceholder.typicode.com) and are marked as needing
network access. Recipes about handling a response use a literal body instead, so
the shape under discussion is visible in the block itself.

## HTTP Requests

Naming the base URL and wrapping the call in a helper keeps the call sites short. Quote the interpolated URL so a `?` or `&` in the path reaches `curl` intact:

<!-- verify: skip -->
```suji
import std:json
import std:println

api = "https://jsonplaceholder.typicode.com"

get = |path| json:parse(`curl -fsSL "${api}${path}"`)

user = get("/users/1")
println(user:name)               # Leanne Graham

todos = get("/todos?userId=1")
println(todos::length())         # 20
```

## JSON APIs

A response body is just a string, so parsing is one call. From there it is ordinary map and list work:

```suji
import std:json
import std:println

body = """{
  "count": 3,
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"},
    {"id": 3, "name": "Carol", "role": "admin"}
  ]
}"""

data = json:parse(body)

admins = data:users
    ::filter(|u| u:role == "admin")
    ::map(|u| u:name)

println("${data:count} users")             # 3 users
println("admins: ${admins::join(", ")}")   # admins: Alice, Carol
```

Missing keys raise `Key not found`, so read anything optional with `::get`:

```suji
import std:json
import std:println

data = json:parse('{"name": "Alice"}')

println(data::get("name", "unknown"))   # Alice
println(data::get("email", "unknown"))  # unknown
```

## Authentication

Keep credentials in the environment, never in the source file, and check that they are present before making the call:

```suji
import std:env
import std:println

token = env:var::get("API_TOKEN", nil)

match token {
    nil => println("API_TOKEN is not set; skipping the request"),
    _ => {
        # A token with spaces or shell metacharacters must stay quoted.
        auth = "Authorization: Bearer ${token}"
        println(`curl -fsSL -H "${auth}" https://api.example.com/me`)
    },
}
```

Output when the variable is unset:

```text
API_TOKEN is not set; skipping the request
```

For header-heavy requests, a config file read with `std:dotenv` or a `~/.netrc` handled by `curl --netrc` keeps secrets out of the process listing.

## Error Handling

Suji has no `try`/`catch`, and a command that exits non-zero terminates the script. Make the shell return a value you can inspect instead:

```suji
import std:json
import std:println

# `curl -fsSL "${url}" || true` yields "" when the request fails,
# which is what this empty body stands for.
body = ""

summary = match {
    body::length() == 0 => "request failed or returned nothing",
    _ => "parsed ${json:parse(body)::length()} records",
}

println(summary)  # request failed or returned nothing
```

[HTTP with curl](http.md#requests-that-are-allowed-to-fail) shows the same guard against a live endpoint.

The other half of defensive API code is validating the payload before using it:

```suji
import std:json
import std:println

data = json:parse('{"error": "rate limited"}')

result = match {
    data::contains("error") => "API error: ${data:error}",
    data::contains("users") => "got ${data:users::length()} users",
    _ => "unrecognised response",
}

println(result)  # API error: rate limited
```

## Rate Limiting

`time:sleep(ms)` between calls is the simplest way to stay under a quota:

```suji
import std:println
import std:time

endpoints = ["/users", "/repos", "/issues"]
delay_ms = 20  # a real client would use several hundred milliseconds

results = []

loop through endpoints with endpoint {
    # Real call: results::push(`curl -fsSL "${api}${endpoint}"`)
    results::push("ok")
    time:sleep(delay_ms)
}

waited = endpoints::length() * delay_ms
println("${results::length()} requests, at least ${waited}ms waiting")
```

Output:

```text
3 requests, at least 60ms waiting
```

If the API reports its own limits (for example `X-RateLimit-Remaining`), fetch the headers with `curl -sD -` and slow down when the remaining count gets low.

## Pagination

Request pages in a `loop` and stop when one comes back short. The safety valve matters: without it a misbehaving API that always returns a full page would loop forever.

<!-- verify: skip -->
```suji
import std:json
import std:println

api = "https://jsonplaceholder.typicode.com"
per_page = 40

all_items = []
page = 1

loop {
    url = "${api}/posts?_page=${page}&_limit=${per_page}"
    items = json:parse(`curl -fsSL "${url}"`)

    all_items = all_items + items
    items::length() < per_page && break

    page++
    page > 50 && break  # a broken API cannot loop forever
}

println("fetched ${all_items::length()} items over ${page} pages")
```

```text
fetched 100 items over 3 pages
```

## Notes

- Backtick commands raise a runtime error if the command exits non-zero; `curl -f` turns a non-2xx response into exactly that, so add `|| true` when you want to handle failure yourself.
- Only stdout is captured, and the trailing newline is trimmed.
- `curl --max-time` is worth setting on every call: there is no timeout mechanism inside Suji.

## See Also

- [HTTP with curl](http.md)
- [JSON Module](../stdlib/data-formats/json.md)
- [Environment Module](../stdlib/env.md)
