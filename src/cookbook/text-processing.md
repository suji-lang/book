# Text Processing Recipes

String manipulation and regex patterns for common tasks.

Suji's regex support answers one question — *does this match?* There are no capture groups, no regex replace and no regex split, so extraction is done with `index_of`, slicing (`s[a;b]`) and `split`.

## Email Validation

Validate email addresses with regex.

```suji
import std:println

email_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

validate_email = |email| email ~ email_pattern

println(validate_email("user@example.com"))  # true
println(validate_email("user@localhost"))    # false
println(validate_email("not an email"))      # false
```

## URL Extraction

Extract URLs from text by splitting into words and matching each one.

```suji
import std:println

extract_urls = |text| {
    words = text::replace("\n", " ")::replace("\t", " ")::split(" ")
    words::filter(|w| w::length() > 0 && w ~ /^https?:\/\/.+$/)
}

text = "Visit https://example.com or http://test.org for more info"
urls = extract_urls(text)

println(urls::length())     # 2
println(urls::join(", "))   # https://example.com, http://test.org
```

Trailing punctuation is part of the word, so trim it when the text is prose:

```suji
import std:println

clean = |w| w::trim(".,;:!?)")
println(clean("https://example.com."))  # https://example.com
```

## Log Parsing

Parse structured log entries. Locate the delimiters with `index_of`, then slice.

```suji
import std:println

parse_log_line = |line| {
    close = line::index_of("]")
    close < 0 && return nil

    timestamp = line[1;close]
    rest = line[(close + 2);]

    sep = rest::index_of(": ")
    sep < 0 && return nil

    {
        "timestamp": timestamp,
        "level": rest[0;sep],
        "message": rest[(sep + 2);],
    }
}

line = "[2024-01-15 10:30:00] ERROR: Database connection failed"
entry = parse_log_line(line)

println(entry:level)      # ERROR
println(entry:message)    # Database connection failed
println(entry:timestamp)  # 2024-01-15 10:30:00
```

A malformed line returns `nil`, so check before reading fields:

```suji
import std:println

describe = |entry| match {
    entry == nil => "unparsable line",
    _ => entry:level,
}

println(describe(nil))                     # unparsable line
println(describe({ level: "WARN" }))       # WARN
```

## Template Generation

Generate text from templates. `string::replace` takes plain strings, so `{{name}}`-style placeholders are the easiest scheme.

```suji
import std:println

render = |tmpl, data| {
    result = tmpl
    loop through data with key, value {
        result = result::replace("{{${key}}}", value::to_string())
    }
    result
}

email_template = """Hello {{name}},

Your order #{{order_id}} has been shipped.

Total: \${{total}}"""

message = render(email_template, {
    name: "Alice",
    order_id: "12345",
    total: "99.99",
})

println(message)
```

Output:

```text
Hello Alice,

Your order #12345 has been shipped.

Total: $99.99
```

Note the `\$` escape: `${...}` is string interpolation everywhere in Suji, so a literal dollar sign in front of a brace must be escaped.

## Text Search and Replace

Collapsing runs of a separator is the same shape every time: split on it, drop the empty pieces, and join. No character loop is needed.

```suji
import std:println

normalize_whitespace = |text| text
    ::replace("\n", " ")
    ::replace("\t", " ")
    ::split(" ")
    ::filter(|w| w::length() > 0)
    ::join(" ")

messy = "  too    many \n\t spaces  "

println(normalize_whitespace(messy))  # too many spaces
```

When the rule is per-character, strings are not iterable — call `::to_list()` for a list of single-character strings. Map each character, then collapse with the same split-filter-join:

```suji
import std:println

slugify = |text| {
    out = ""
    loop through text::lower()::to_list() with ch {
        out = out + match {
            ch ~ /^[a-z0-9]$/ => ch,
            _ => "-",
        }
    }
    out::split("-")::filter(|p| p::length() > 0)::join("-")
}

println(slugify("Hello World!"))              # hello-world
println(slugify("  Suji: A Small Language"))  # suji-a-small-language
```

Plain substring replacement needs no loop at all:

```suji
import std:println

println("2024-01-15"::replace("-", "/"))          # 2024/01/15
println("a,b,,c"::split(",")::filter(|p| p::length() > 0)::join("|"))  # a|b|c
```

## Complete Example: Markdown Parser

Simple line-based markdown to HTML converter (headers + paragraphs).

```suji
import std:println

wrap = |tag, text| "<${tag}>${text}</${tag}>"

markdown_to_html = |md| {
    out = []

    loop through md::split("\n") with line {
        match {
            line::starts_with("## ") => { out::push(wrap("h2", line[3;])) },
            line::starts_with("# ") => { out::push(wrap("h1", line[2;])) },
            line::trim()::length() == 0 => {},
            _ => { out::push(wrap("p", line)) },
        }
    }

    out::join("\n")
}

md = "# Title\n\nAn opening paragraph.\n\n## Section\n\nMore text."
println(markdown_to_html(md))
```

Output:

```text
<h1>Title</h1>
<p>An opening paragraph.</p>
<h2>Section</h2>
<p>More text.</p>
```

## See Also

- [Regular Expressions](../fundamentals/data-types/regex.md)
- [Strings](../fundamentals/data-types/strings.md)
- [Matching Operators](../fundamentals/operators/matching.md)
- [Regex Matching Example](../examples/regex-matching.md)
