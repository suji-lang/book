#!/usr/bin/env bash
#
# Run every ```suji / ```si code block in the book through the interpreter and
# report the ones that fail. Every example in the book is meant to be a complete
# program that runs on its own, so a failure here is a documentation bug.
#
# Usage:
#   ./scripts/verify_book.sh                     # check the whole book
#   ./scripts/verify_book.sh src/stdlib/io.md    # check specific files
#   SUJI=/path/to/suji ./scripts/verify_book.sh  # use a specific binary
#
# With no SUJI= the interpreter is found by scripts/find_suji.sh, which prefers
# one on PATH and otherwise falls back to a neighbouring cargo build.
#
# A block that is meant to fail (an example of a syntax or runtime error) is
# skipped when the line directly above the opening fence is:
#
#   <!-- verify: skip -->
#
set -uo pipefail

cd "$(dirname "$0")/.."

SUJI="$(./scripts/find_suji.sh)" || exit $?

if [ "$#" -gt 0 ]; then
    files=("$@")
else
    # shellcheck disable=SC2207
    files=($(find src -name '*.md' | sort))
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

total=0
failed=0
skipped=0

for md in "${files[@]}"; do
    [ -f "$md" ] || { echo "missing file: $md" >&2; continue; }

    # Emit one line per block: "<start-line> <skip?> <path>"
    awk -v dir="$work" '
        BEGIN { n = 0; inblock = 0 }
        {
            if (inblock) {
                if ($0 ~ /^```/) {
                    inblock = 0
                    close(out)
                    print start, skip, out
                } else {
                    print $0 > out
                }
                prev = $0
                next
            }
            if ($0 ~ /^```(suji|si)[ \t]*$/) {
                inblock = 1
                n++
                start = NR + 1
                skip = (prev ~ /verify:[ \t]*skip/) ? 1 : 0
                out = sprintf("%s/block-%04d.si", dir, n)
                printf "" > out
                prev = $0
                next
            }
            prev = $0
        }
    ' "$md" > "$work/index.txt"

    # A block that reads standard input (io:stdin) must not inherit this loop's
    # stdin, or it consumes the index and the remaining blocks are never run.
    while read -r start skip path; do
        total=$((total + 1))
        if [ "$skip" = "1" ]; then
            skipped=$((skipped + 1))
            continue
        fi
        if ! output="$("$SUJI" "$path" </dev/null 2>&1)"; then
            failed=$((failed + 1))
            message="$(printf '%s\n' "$output" \
                | sed $'s/\x1b\\[[0-9;]*m//g' \
                | grep -m1 -E '^(\[[0-9]+\] )?Error:' || true)"
            [ -n "$message" ] || message="exited non-zero"
            printf 'FAIL %s:%s  %s\n' "$md" "$start" "$message"
        fi
    done < "$work/index.txt"
done

printf '\nblocks: %d  failing: %d  skipped: %d\n' "$total" "$failed" "$skipped"
[ "$failed" -eq 0 ]
