#!/usr/bin/env bash
#
# Print the output of every ```suji / ```si block in the given markdown files,
# labelled with the file and the line the block starts on. Unlike
# verify_book.sh, which only checks the exit status, this shows what each block
# actually prints so documented outputs can be compared by eye.
#
# Usage:
#   ./scripts/run_blocks.sh src/cookbook/file-processing.md
#   SUJI=/path/to/suji ./scripts/run_blocks.sh src/stdlib/io.md
#
# With no SUJI= the interpreter is found by scripts/find_suji.sh, which prefers
# one on PATH and otherwise falls back to a neighbouring cargo build.
#
set -uo pipefail

cd "$(dirname "$0")/.."

SUJI="$(./scripts/find_suji.sh)" || exit $?

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

for md in "$@"; do
    [ -f "$md" ] || { echo "missing file: $md" >&2; continue; }

    awk -v dir="$work" '
        BEGIN { n = 0; inblock = 0 }
        {
            if (inblock) {
                if ($0 ~ /^```/) { inblock = 0; close(out); print start, out; next }
                print $0 > out
                next
            }
            if ($0 ~ /^```(suji|si)[ \t]*$/) {
                inblock = 1
                n++
                start = NR + 1
                out = sprintf("%s/block-%04d.si", dir, n)
                printf "" > out
            }
        }
    ' "$md" > "$work/index.txt"

    # Read the index up front: a block that reads stdin would otherwise consume
    # the rest of it and silently skip the remaining blocks.
    while read -r start path; do
        printf '===== %s:%s =====\n' "$md" "$start"
        (cd "$work" && "$SUJI" "$path" </dev/null 2>&1) \
            | sed $'s/\x1b\\[[0-9;]*m//g'
    done < <(cat "$work/index.txt")
done
