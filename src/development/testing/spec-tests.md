# Spec Tests

The 650 programs in `spec/` are the executable definition of Suji. Their format is strict.

## The Rules

| Rule | Why |
|---|---|
| One assertion per file | The runner only reads the last line of output |
| `import std:println` at the top | There is no prelude; nothing prints without it |
| Exactly one `println(...)` at the end | That line's output is what gets compared |
| Expected output in a trailing `#` comment on that line | The runner extracts the text after `# ` |
| Two spaces before the `#` | House style, consistent across the suite |
| Blank line after the imports | House style |
| Blank line before the final `println` | House style |
| **No trailing blank line** | The runner uses `tail -n 1`; a blank last line means an empty expectation |
| Named `feature_area_NN.si` | Two-digit, zero-padded counter |
| Deterministic output | The comparison is exact |

## A Correct Spec File

`spec/pipe_apply_01.si`:

```suji
import std:println

inc = |x| x + 1
result = 3 |> inc

println(result)  # 4
```

The file ends immediately after that line — no trailing newline beyond the one
terminating it, and no blank line.

## How the Runner Compares

`scripts/verify_spec.sh` changes into `spec/` so that relative imports resolve,
then for each file:

1. Takes the **last line of the file** and strips everything up to and including
   the first `# `, giving the expected string.
2. Runs `../target/release/suji <file>`, discards stderr, takes the **last line
   of stdout**, and strips ANSI colour codes.
3. Compares the two strings exactly.

Two consequences follow from step 1. First, the expectation lives in the source
file, so a spec file documents itself. Second, anything after the last `#` on
the last line is the expectation — including nothing at all.

Run the suite with:

```bash
make verify_spec
```

A failure reports both sides:

```text
FAIL: my_feature_01.si - Expected '4', got '5'
```

## Broken Spec Files

Each of these looks fine and fails.

**A trailing blank line.** The runner reads the blank last line, so the
expectation becomes the empty string:

```text
import std:println

println(3 |> inc)  # 4
                          <- this blank line breaks the file
```

The reported failure is `Expected '', got '4'`, which is the signature of this
mistake.

**A missing comma after the final match arm.** Every bare-expression arm needs a
trailing comma, including the last:

```text
import std:println

result = match 2 { 1 => "one", 2 => "two" }   # parse error

println(result)  # two
```

Adding the comma after `"two"` fixes it.

**More than one `println`.** Only the last line of output is compared, so the
earlier assertion is silently ignored:

```text
import std:println

println(1 + 1)  # 2
println(2 + 2)  # 4
```

Split this into two files.

**A missing `import std:println`.** The program fails with
`Undefined variable: println` and produces no stdout at all.

**Non-deterministic output.** A spec that prints `time:now():epoch_ms`, a UUID,
a random number, or a hostname can never match a fixed expectation. If a feature
depends on the environment, assert on something stable about the result instead:

```suji
import std:println
import std:uuid

id = uuid:v4()

println(id::length())  # 36
```

## Naming and Placement

Files sit directly in `spec/` — the runner only globs `*.si` in that directory
and ignores subdirectories. Name a file after its feature area with a
zero-padded counter, matching the neighbours you find there:

```text
spec/list_methods_07.si
spec/operator_precedence_03.si
spec/pipe_apply_01.si
```

Keep the body minimal. A spec file should isolate one behaviour, so avoid
constructs unrelated to what is being tested.

## Adding One

1. Find the existing family: `ls spec/ | grep <feature>`.
2. Create the next number in that sequence.
3. Write the smallest program that exhibits the behaviour.
4. Run it directly first — `target/release/suji spec/my_feature_01.si` — and
   paste the real output into the trailing comment.
5. Run `make verify_spec` and confirm the new file passes along with the rest.

Never guess the expected output. Run the program and copy what it actually
prints, otherwise the spec encodes a wish rather than a fact.

## See Also

- [Testing](../testing.md)
- [Writing Tests](writing-tests.md)
- [Contributing](../contributing.md)
- [Syntax Reference](../../appendices/syntax-reference.md)
