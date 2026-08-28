# HTTP with `curl` (Cookbook)

Suji has no built-in HTTP client. Use shell commands (e.g. `curl`) plus Suji's stdlib modules like `std:json` to work with HTTP APIs.

The pattern is always the same: a backtick command returns the response body as a **string**, and `json:parse` turns that string into maps and lists.

<!-- verify: skip -->
```suji
import std:json
import std:println

text = `curl -fsSL https://jsonplaceholder.typicode.com/users/1`
user = json:parse(text)

println(user:name)          # Leanne Graham
println(user:company:name)  # Romaguera-Crona
```

Every recipe on this page is a real request against
[JSONPlaceholder](https://jsonplaceholder.typicode.com), a public test API that
returns fixed data, so you can run each block verbatim and get the output shown
in the comments. These are the only blocks in the book that need network access.

## GET JSON and parse it

Once the body is parsed, it is ordinary Suji data — `filter`, `fold` and indexing all work on it:

<!-- verify: skip -->
```suji
import std:json
import std:println

text = `curl -fsSL 'https://jsonplaceholder.typicode.com/todos?userId=1'`
todos = json:parse(text)

done = todos::filter(|t| t:completed)
summary = "${todos::length()} todos, ${done::length()} completed"

println(summary)  # 20 todos, 11 completed
```

Quote the URL in the shell command whenever it contains `?` or `&`, as above. Unquoted, the shell treats them as a glob and a background-job separator.

## Inspect status codes

Ask `curl` to print only the status code, then branch on the string it returns:

<!-- verify: skip -->
```suji
import std:println

url = "https://jsonplaceholder.typicode.com/users/999"

status = `curl -s -o /dev/null -w '%{http_code}' ${url}`

message = match status {
    "200" => "healthy",
    "404" => "no such endpoint",
    "500" | "502" | "503" => "server error",
    _ => "unexpected status ${status}",
}

println(message)  # no such endpoint
```

Note that `-f` is deliberately absent here. With `-f`, `curl` exits non-zero on a 4xx/5xx response, and a non-zero exit status from a backtick command is a runtime error that **terminates the script** — there is no way to catch it. Reading the status code as a string keeps the decision in Suji.

## POST JSON

Long `curl` invocations read better when the parts are named first. Interpolating a value you wrote yourself, like the URL and header below, is safe:

<!-- verify: skip -->
```suji
import std:json
import std:println

url = "https://jsonplaceholder.typicode.com/posts"
head = "Content-Type: application/json"
data = '{"title":"hello","userId":1}'

body = `curl -fsSL -X POST -H '${head}' --data '${data}' ${url}`
created = json:parse(body)

println(created:id)     # 101
println(created:title)  # hello
```

A body built at runtime is a different matter. Never interpolate `json:generate` output into a command — a value containing a quote or a `$` would break the command or inject into it. Write the payload to a file and let `curl` read it with `--data @file`:

<!-- verify: skip -->
```suji
import std:io
import std:json
import std:os
import std:println

url = "https://jsonplaceholder.typicode.com/posts"
head = "Content-Type: application/json"

payload = json:generate({ title: "hello", userId: 1 })

p = `mktemp`
f = io:open(p, true, true)
f::write(payload)
f::close()

body = `curl -fsSL -X POST -H '${head}' --data @${p} ${url}`

os:rm(p)

println(json:parse(body):id)  # 101
```

## Requests that are allowed to fail

A failing request aborts the script. This program prints nothing — it dies on line 3:

<!-- verify: skip -->
```suji
import std:println

body = `curl -fsSL https://jsonplaceholder.typicode.com/nope`

println(body)
```

```text
[406] Error: Shell command failed
Shell command 'curl -fsSL https://jsonplaceholder.typicode.com/nope' failed with
exit code 56: curl: (56) The requested URL returned error: 404
```

The script itself exits with status 1. The inner number is `curl`'s own exit code and varies between `curl` versions; what matters is that it is non-zero.

Since a non-zero exit terminates the script, make the shell itself absorb the failure and return something you can test:

<!-- verify: skip -->
```suji
import std:json
import std:println

body = `curl -fsSL https://jsonplaceholder.typicode.com/nope || true`

result = match {
    body::length() == 0 => "request failed",
    _ => "got ${json:parse(body)::length()} records",
}

println(result)  # request failed
```

The same trick covers connectivity checks:

<!-- verify: skip -->
```suji
import std:println

url = "https://jsonplaceholder.typicode.com"

up = `curl -fsS -o /dev/null ${url} && echo up || echo down`

println(up)  # up
```

## Notes

- `curl` output is a string with the trailing newline trimmed; parse structured responses with `std:json:parse`, `std:yaml:parse`, etc.
- Only stdout is captured. Add `-s` to silence the progress meter, which `curl` writes to stderr.
- Interpolating **runtime data** into a command is a shell injection risk — prefer `--data @file` for bodies, and `percent_encode` from `std:encoding` for query parameters.
- There is no timeout inside Suji, so `curl --max-time` is worth setting on every call in a long-running script.

## See Also

- [Working with APIs](apis.md)
- [JSON Module](../stdlib/data-formats/json.md)
- [Shell Integration Best Practices](../advanced/shell-integration.md)
