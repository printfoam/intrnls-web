#!/usr/bin/env python3
"""
intrnls.com — chrome sync. The whole build system, on purpose.

WHY THIS AND NOT A FRAMEWORK
    The nav must have ONE source (web/README.md §11: the last time this project shipped
    a nav it grew into seven of them). But the site must also stay plain static HTML that
    opens from disk, deploys by copying a folder, and needs no npm, no bundler and no
    server-side includes.

    So: the pages in git ARE the shipped pages — nothing is generated at deploy time.
    This script only keeps the marked regions inside them identical to the partials in
    web/_include/. You edit web/_include/header.html once; the script rewrites the block
    between the markers in every page, in place.

USE
    python3 web/_include/sync.py            # rewrite the pages
    python3 web/_include/sync.py --check    # exit 1 if any page has drifted (CI / pre-PR)

MARKERS (in a page)
    <!-- @include:header nav=about -->
    ...anything here is overwritten...
    <!-- /@include:header -->

SUBSTITUTIONS applied to a partial as it is written into a page
    {{ROOT}}    ""  for pages at web/, "../" for pages in web/work/ — so relative links
                keep working from disk, at any depth, with no root-relative URLs.
    nav=KEY     adds aria-current="page" to the partial's <a data-nav="KEY">, which is
                what drives the active-item colour + underline in site.css.

Anything under _include/ is source, not a published page. Everything else in web/ is.
"""

from __future__ import annotations

import pathlib
import re
import sys

WEB = pathlib.Path(__file__).resolve().parent.parent
INC = WEB / "_include"

BLOCK = re.compile(
    r"(?P<open><!-- @include:(?P<name>[a-z][a-z0-9-]*)(?P<args>[^>\n]*)-->)"
    r"(?P<body>.*?)"
    r"(?P<close>[ \t]*<!-- /@include:(?P=name) -->)",
    re.S,
)


def render(name: str, args: str, root: str) -> str:
    """Partial -> the exact text that belongs between the markers."""
    src = (INC / f"{name}.html").read_text(encoding="utf-8").rstrip("\n")
    src = src.replace("{{ROOT}}", root)

    m = re.search(r"nav=([a-z0-9-]+)", args)
    if m:
        key = m.group(1)
        needle = f'data-nav="{key}"'
        if needle not in src:
            raise SystemExit(f"sync.py: no data-nav=\"{key}\" in {name}.html")
        # aria-current is the programmatic half of the active state; the visible half
        # (colour + underline) is keyed off it in site.css. Never colour alone.
        src = src.replace(needle, f'{needle} aria-current="page"', 1)
    return "\n" + src + "\n"


def pages() -> list[pathlib.Path]:
    return sorted(p for p in WEB.rglob("*.html") if INC not in p.parents and p.parent != INC)


def process(path: pathlib.Path) -> str:
    depth = len(path.relative_to(WEB).parts) - 1
    root = "../" * depth
    text = path.read_text(encoding="utf-8")

    def sub(m: re.Match) -> str:
        body = render(m.group("name"), m.group("args"), root)
        return m.group("open") + body + m.group("close")

    return BLOCK.sub(sub, text)


def main(argv: list[str]) -> int:
    check = "--check" in argv
    drifted, touched = [], []
    for path in pages():
        before = path.read_text(encoding="utf-8")
        after = process(path)
        if before == after:
            continue
        if check:
            drifted.append(path)
        else:
            path.write_text(after, encoding="utf-8")
            touched.append(path)

    rel = lambda p: p.relative_to(WEB.parent)
    if check:
        for p in drifted:
            print(f"DRIFTED: {rel(p)}")
        print(
            f"{len(drifted)} page(s) out of sync"
            if drifted
            else f"chrome in sync across {len(pages())} page(s)"
        )
        return 1 if drifted else 0

    for p in touched:
        print(f"updated: {rel(p)}")
    print(f"{len(touched)} of {len(pages())} page(s) rewritten")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
