#!/usr/bin/env bash
#
# Print an absolute path to the Suji interpreter, or explain on stderr why none
# could be found and exit non-zero.
#
# Both scripts/verify_book.sh and scripts/run_blocks.sh get their interpreter
# from here, so that the two cannot drift apart about where it lives.
#
# Search order:
#
#   1. $SUJI, if set. An explicit choice always wins, and is an error if it is
#      not executable rather than something to fall back from.
#   2. A `suji` on PATH, which is what an installed interpreter looks like.
#   3. The cargo build directories of a checkout beside this one. This is the
#      path you would otherwise be passing as SUJI= by hand while working on the
#      interpreter and the book together, so it is the default instead.
#
set -uo pipefail

cd "$(dirname "$0")/.."

if [ -n "${SUJI:-}" ]; then
    candidates=("$SUJI")
else
    candidates=(
        "$(command -v suji || true)"
        ../suji-internal/target/release/suji
        ../target/release/suji
        ../target/debug/suji
    )
fi

for candidate in "${candidates[@]}"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
        # Absolute: callers run the interpreter after cd'ing into a scratch
        # directory, so a relative path would no longer resolve.
        printf '%s\n' "$(cd "$(dirname "$candidate")" && pwd)/$(basename "$candidate")"
        exit 0
    fi
done

if [ -n "${SUJI:-}" ]; then
    echo "error: SUJI=$SUJI is not an executable file." >&2
else
    echo "error: no suji binary found. Install one so that it is on PATH, or" >&2
    echo "       build one with 'cargo build --release' in a checkout beside" >&2
    echo "       this one, or set SUJI=/path/to/suji." >&2
fi
exit 2
