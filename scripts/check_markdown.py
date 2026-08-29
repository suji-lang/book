#!/usr/bin/env python3
"""Structural checks for the book's markdown.

  python3 scripts/check_markdown.py

Reports three classes of breakage that mdBook itself will not complain about:

  * links to files that do not exist
  * `#anchor` links that match no heading on the target page
  * table rows whose column count differs from the header, which is almost always
    an unescaped `|` in a cell (writing `||`, `|>` or a lambda without `\\|`)

Exits non-zero if anything is found.
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parent.parent / "src"

LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
HEADING = re.compile(r"^#{1,6}\s+(.*?)\s*$")
INLINE_CODE = re.compile(r"`([^`]*)`")
EXPLICIT_ID = re.compile(r'<a\s+(?:id|name)="([^"]+)"')


def slugify(text):
    """Mirror mdbook::utils::normalize_id: keep alphanumerics, '-' and '_', turn
    each space into a hyphen, drop everything else. Note that a dropped
    character between two spaces (an em dash, say) leaves a double hyphen."""
    text = INLINE_CODE.sub(r"\1", text)
    out = []
    for ch in text.lower():
        if ch.isalnum() or ch in "-_":
            out.append(ch)
        elif ch == " ":
            out.append("-")
    return "".join(out)


def outside_fences(lines):
    in_fence = False
    for n, line in enumerate(lines, 1):
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence:
            yield n, line


def anchors_of(page):
    found = set()
    for _, line in outside_fences(page.read_text().splitlines()):
        m = HEADING.match(line)
        if m:
            found.add(slugify(m.group(1)))
        found.update(m.group(1) for m in EXPLICIT_ID.finditer(line))
    return found


def cells(line):
    parts = re.split(r"(?<!\\)\|", line.strip())
    if parts and parts[0] == "":
        parts = parts[1:]
    if parts and parts[-1] == "":
        parts = parts[:-1]
    return parts


def check_links(pages):
    anchor_cache = {}
    problems = []
    for md in pages:
        for m in LINK.finditer(md.read_text()):
            target = m.group(1).strip()
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            path, _, anchor = target.partition("#")
            page = md if not path else (md.parent / path).resolve()
            if not page.exists():
                problems.append(f"{md.relative_to(SRC)} -> {target} (no such file)")
                continue
            if not anchor or page.suffix != ".md":
                continue
            if page not in anchor_cache:
                anchor_cache[page] = anchors_of(page)
            if anchor not in anchor_cache[page]:
                problems.append(f"{md.relative_to(SRC)} -> {target} (no such heading)")
    return problems


def check_tables(pages):
    problems = []
    for md in pages:
        rows = [
            (n, line)
            for n, line in outside_fences(md.read_text().splitlines())
            if line.strip().startswith("|")
        ]
        width = None
        previous_line = None
        for n, line in rows:
            if previous_line is None or n != previous_line + 1:
                width = len(cells(line))  # a new table starts here
            elif len(cells(line)) != width:
                problems.append(
                    f"{md.relative_to(SRC)}:{n}: {len(cells(line))} cells, "
                    f"header has {width}\n    {line.strip()[:120]}"
                )
            previous_line = n
    return problems


def main():
    pages = sorted(SRC.rglob("*.md"))
    problems = check_links(pages) + check_tables(pages)
    for p in problems:
        print(p)
    print(f"\npages: {len(pages)}  problems: {len(problems)}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
