# Text Encoding (`std:encoding`)

Encode and decode text as Base64, hex, or percent-encoding.

## Overview

All six functions take **one string** and return a string:

| Function | Description |
|---|---|
| `base64_encode(text)` | Standard Base64 with `=` padding |
| `base64_decode(text)` | Decode Base64; invalid input raises |
| `hex_encode(text)` | Lowercase hex of the UTF-8 bytes |
| `hex_decode(text)` | Decode hex; invalid or odd-length input raises |
| `percent_encode(text)` | Percent-encode every non-alphanumeric character |
| `percent_decode(text)` | Decode `%XX` sequences |

Text is treated as UTF-8, and the decoders must produce valid UTF-8 — these
functions handle text, not arbitrary binary data.

## Quick Start

```suji
import std:encoding
import std:println

text = "hello world"

b64 = encoding:base64_encode(text)
println(b64)                          # aGVsbG8gd29ybGQ=
println(encoding:base64_decode(b64))  # hello world

hex = encoding:hex_encode(text)
println(hex)                          # 68656c6c6f20776f726c64
println(encoding:hex_decode(hex))     # hello world

q = encoding:percent_encode("Hello & welcome!")
println(q)                            # Hello%20%26%20welcome%21
println(encoding:percent_decode(q))   # Hello & welcome!
```

## Base64

```suji
import std:encoding
import std:println

println(encoding:base64_encode("data"))   # ZGF0YQ==
println(encoding:base64_decode("ZGF0YQ==")) # data
println(encoding:base64_encode("héllo"))  # aMOpbGxv
```

Encoding an empty string returns an empty string. Decoding text that is not valid
Base64 raises `Type error: invalid base64`:

```suji
import std:encoding

# encoding:base64_decode("!!!")
# Error: Type error: invalid base64
```

## Hex

Hex encoding is a fixed two characters per byte, so a multi-byte character
produces more than two:

```suji
import std:encoding
import std:println

println(encoding:hex_encode("hi"))     # 6869
println(encoding:hex_encode("héllo"))  # 68c3a96c6c6f
println(encoding:hex_decode("68c3a96c6c6f"))  # héllo
```

Invalid characters and odd-length input both raise `Type error: invalid hex`:

```suji
import std:encoding

# encoding:hex_decode("zz")   # Error: Type error: invalid hex
# encoding:hex_decode("abc")  # Error: Type error: invalid hex — odd length
```

Hex is also the output format of [`std:crypto`](crypto.md) digests, so
`hex_decode` can turn a digest back into its raw bytes only when those bytes
happen to be valid UTF-8 — usually they are not.

## Percent-Encoding

`percent_encode` uses a conservative policy: everything that is not an ASCII
letter or digit is encoded, including `/`, `-`, `_` and `.`. That makes it right
for a single query-string **value**, and wrong for a whole URL.

```suji
import std:encoding
import std:println

println(encoding:percent_encode("a/b?c=d e"))  # a%2Fb%3Fc%3Dd%20e
println(encoding:percent_encode("héllo"))      # h%C3%A9llo
println(encoding:percent_decode("h%C3%A9llo")) # héllo
```

Build a query string by encoding each value separately:

```suji
import std:encoding
import std:println

query = |params| {
    parts = []
    loop through params with k, v {
        parts::push("${encoding:percent_encode(k)}=${encoding:percent_encode(v)}")
    }
    parts::join("&")
}

println(query({"q": "suji lang", "page": "1"}))  # q=suji%20lang&page=1
```

`percent_decode` is lenient: a malformed escape is left as-is rather than raising,
and `+` is **not** treated as a space.

```suji
import std:encoding
import std:println

println(encoding:percent_decode("%ZZ"))  # %ZZ
println(encoding:percent_decode("a+b"))  # a+b
```

## Round Trips

```suji
import std:encoding
import std:println

text = "Grüße, Welt! 42"

println(encoding:base64_decode(encoding:base64_encode(text)) == text)    # true
println(encoding:hex_decode(encoding:hex_encode(text)) == text)          # true
println(encoding:percent_decode(encoding:percent_encode(text)) == text)  # true
```

## Gotchas

- Every argument must be a string; a number raises
  `Type error: argument must be string`.
- Decoders raise on invalid Base64 or hex, and those errors terminate the program.
- Results must be valid UTF-8, so these functions cannot carry arbitrary binary
  payloads.
- `percent_encode` escapes far more than a URL path needs; do not apply it to a
  whole URL.

## See Also

- [Cryptography](crypto.md)
- [UUID](uuid.md)
- [Strings](../fundamentals/data-types/strings.md)
- [HTTP with curl](../cookbook/http.md)
