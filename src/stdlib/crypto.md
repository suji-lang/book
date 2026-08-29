# Cryptography (`std:crypto`)

Hash functions and HMAC-SHA256, returned as lowercase hex digests.

## Overview

`std:crypto` exports five functions. Every argument must be a **string**, and
every result is a lowercase hex string.

| Function | Digest | Hex length |
|---|---|---|
| `md5(text)` | 128-bit | 32 |
| `sha1(text)` | 160-bit | 40 |
| `sha256(text)` | 256-bit | 64 |
| `sha512(text)` | 512-bit | 128 |
| `hmac_sha256(key, text)` | 256-bit | 64 |

There is no generic `crypto:hmac`, no other HMAC variant, no raw/binary output
mode, no incremental hashing and no password-hashing function such as bcrypt or
argon2.

## Quick Start

```suji
import std:crypto
import std:println

println(crypto:sha256("Hello, World!"))
# dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f

println(crypto:hmac_sha256("secret-key", "message to sign"))
# 5e2a3d8758df91e8fb93c09d4141c12ccc1f986cc67edccad3ebc5463c9bb136
```

## Hash Functions

### `md5(text)`

```suji
import std:crypto
import std:println

println(crypto:md5("Hello, World!"))  # 65a8e27d8879283831b664bd8b7f0ad4
println(crypto:md5(""))               # d41d8cd98f00b204e9800998ecf8427e
```

MD5 is cryptographically broken. Use it only for non-security purposes such as
cache keys or change detection.

### `sha1(text)`

```suji
import std:crypto
import std:println

println(crypto:sha1("Hello, World!"))  # 0a0a9f2a6772942557ab5355d76af442f8f65e01
```

SHA-1 is also considered weak; prefer SHA-256 for anything new.

### `sha256(text)`

The general-purpose choice.

```suji
import std:crypto
import std:println

println(crypto:sha256("Hello, World!"))
# dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f

println(crypto:sha256(""))
# e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### `sha512(text)`

```suji
import std:crypto
import std:println

digest = crypto:sha512("Hello, World!")
println(digest::length())  # 128
println(digest[0;32])      # 374d794a95cdcfd8b35993185fef9ba3
```

## `hmac_sha256(key, text)`

Computes a keyed message authentication code. Both arguments are strings; the key
comes first.

```suji
import std:crypto
import std:println

signature = crypto:hmac_sha256("secret-key", "message to sign")
println(signature)
# 5e2a3d8758df91e8fb93c09d4141c12ccc1f986cc67edccad3ebc5463c9bb136

verify = |key, message, expected| crypto:hmac_sha256(key, message) == expected

println(verify("secret-key", "message to sign", signature))  # true
println(verify("wrong-key", "message to sign", signature))   # false
```

Keep the key out of the source and read it from the environment:

```suji
import std:crypto
import std:env
import std:println

env:var["WEBHOOK_SECRET"] = "s3cr3t"  # normally set outside the script

secret = env:var::get("WEBHOOK_SECRET", "")
payload = '{"event":"push"}'

println(crypto:hmac_sha256(secret, payload)::length())  # 64
```

Comparison with `==` is not constant time, so it can in principle leak timing
information. Suji offers no constant-time comparison primitive.

## Text and Encoding

The input is a Suji string, hashed as UTF-8, so non-ASCII text hashes
consistently:

```suji
import std:crypto
import std:println

println(crypto:sha256("héllo"))
# 3c48591d8d098a4538f5e013dfcf406e948eac4d3277b10bf614e295d6068179
```

Non-string arguments raise `Type error: argument must be string`, so convert
first:

```suji
import std:crypto
import std:println

println(crypto:md5(42::to_string()))  # a1d0c6e83f027327d8461063f4ac58a6
```

For base64 or hex conversions of the data itself — rather than a digest of it —
see [`std:encoding`](encoding.md).

## Examples

### File Checksum

```suji
import std:crypto
import std:io
import std:println

p = `mktemp`
f = io:open(p, true, true)
f::write("important contents\n")
f::close()

checksum = |path| {
    stream = io:open(path)
    content = stream::read_all()
    stream::close()
    crypto:sha256(content)
}

println(checksum(p))
# 8dd64c9b0c49e80ad4361b4604284ec5c2b20613faed29af2fc5fd9cd922db3a
```

### Content-Addressed Storage

```suji
import std:crypto
import std:io
import std:os
import std:path
import std:println

root = `mktemp -d`

store = |content| {
    key = crypto:sha256(content)
    out = io:open(path:join([root, key]), true, true)
    out::write(content)
    out::close()
    key
}

load = |key| {
    f = io:open(path:join([root, key]))
    content = f::read_all()
    f::close()
    content
}

key = store("Important data")
println(key::length())      # 64
println(load(key))          # Important data
```

### Deduplicating by Digest

```suji
import std:crypto
import std:println

documents = ["alpha", "beta", "alpha", "gamma"]

seen = []
unique = []
loop through documents with doc {
    digest = crypto:sha256(doc)
    match {
        seen::contains(digest) => { continue }
        _ => {
            seen::push(digest)
            unique::push(doc)
        }
    }
}

println(unique)  # [alpha, beta, gamma]
```

### Cache Key from Parameters

Because `json:generate` sorts keys, two equal maps produce the same key
regardless of the order they were built in:

```suji
import std:crypto
import std:json
import std:println

cache_key = |name, params| crypto:md5("${name}:${json:generate(params)}")

a = cache_key("search", {"q": "suji", "page": 1})
b = cache_key("search", {"page": 1, "q": "suji"})

println(a == b)         # true
println(a::length())    # 32
```

### Signed Payload

```suji
import std:crypto
import std:json
import std:println

sign = |secret, data| {
    body = json:generate(data)
    {
        "body": body,
        "signature": crypto:hmac_sha256(secret, body),
    }
}

check = |secret, envelope| {
    crypto:hmac_sha256(secret, envelope:body) == envelope:signature
}

envelope = sign("shared-secret", {"user": "alice", "action": "update"})
println(check("shared-secret", envelope))  # true
println(check("other-secret", envelope))   # false
```

## Gotchas

- All arguments must be strings; numbers and maps raise a type error.
- Digests are hex text, so `::length()` is 32/40/64/128 characters, not bytes.
- Raw hashes are unsuitable for password storage; there is no salted key
  derivation function in the standard library.
- Hashing is one shot over a whole string, so a very large file must be read
  fully into memory first.

## See Also

- [Text Encoding](encoding.md)
- [UUID](uuid.md)
- [Random Numbers](random.md)
- [Environment](env.md)
- [I/O and Streams](io.md)
