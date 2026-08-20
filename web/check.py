#!/usr/bin/env python3
"""
intrnls.com — the site's check harness.  One file, no dependencies.

    python3 web/check.py              run every check, print a report
    python3 web/check.py --self-test  mutation-test the harness itself
    python3 web/check.py --help       usage

EXIT STATUS
    0   every check ran and passed
    1   a check ran and FAILED (the report names the file and the element)
    2   a check could not RUN (no Chromium, browser crash, sync.py missing).
        Never silently green: a skipped check is a non-zero exit, always.

WHAT IT CHECKS   (numbers are stable; the report and README §14 use them)
    1  palette      — zero raw hex in css/site.css
    2  include      — no chrome drift (wraps _include/sync.py --check)
    3  contrast     — WCAG AA on every element with direct text, both grounds   [browser]
    4  overflow     — no horizontal scroll, 320 → 2560px                        [browser]
    5  structure    — one h1 / one .brand, <=1 .grad, <=1 opposite-ground band,
                      <=1 filled-green ACTION, no heading-level jumps
    6  refs         — every local href/src, in-page anchor, cross-page fragment
                      and aria-describedby/labelledby/controls resolves
    7  reserved     — no "[[...]]" marker and no uncleared Work-card draft copy
                      reaches rendered text

Checks 1, 2, 5, 6, 7 are static: they parse the HTML and CSS and need nothing but
Python.  Checks 3 and 4 must render, so they drive a real Chromium over the
DevTools protocol (a ~120-line WebSocket client lives at the bottom of this file,
so that "no dependencies" stays true).  Checks 6 and 7 ALSO re-run against the live
DOM when a browser is available, which catches an id or a string injected by JS.

WHY NO FRAMEWORK
    Same reason as _include/sync.py: this site is plain static HTML that opens from
    disk and deploys by copying a folder.  A checker that needs `npm install` is a
    checker that stops being run.

WHY --self-test EXISTS
    A check that passes because it found nothing to look at is worse than no check.
    --self-test copies the site to a temp directory, breaks it fourteen different
    ways, and fails unless every break is caught and named.  Run it after you touch
    this file.  The report also prints how many elements each check actually
    measured — a number that quietly drops to zero is the failure mode to watch.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import os
import pathlib
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #

WEB = pathlib.Path(__file__).resolve().parent

# The six published pages, in journey order.  Anything else under web/ that is not
# a partial is a page too — PAGES is asserted against the tree by check_pages_list.
PAGES = [
    "index.html",
    "what-we-do.html",
    "work.html",
    "about.html",
    "contact.html",
    "work/_case-study-template.html",
]

# The sweep from README §9.  320 is the narrowest phone we support; 2560 is a
# desktop at full width.  The middles are the real breakpoints plus the awkward
# gaps either side of them.
WIDTHS = [320, 360, 390, 414, 640, 720, 768, 940, 1024, 1280, 1440, 1920, 2560]

# Where to look for a browser, in order.  This list is CROSS-PLATFORM on purpose:
# this file is handed to reviewers on macOS and Windows, and a Linux-only search
# would report both browser checks as NOT RUN on their machine — an exit-2 that
# looks like the site is broken when it is only the checker that cannot see.
# Any Chromium-family browser works; the checks drive it over CDP.
# Override with --chromium PATH or the CHROMIUM env var.
CHROMIUM_CANDIDATES = [
    os.environ.get("CHROMIUM") or "",
    # --- this repo's container ---
    "/opt/pw-browsers/chromium",
    # --- linux ---
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/microsoft-edge",
    "/snap/bin/chromium",
    # --- macOS ---
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    # --- windows (incl. running python from WSL/Git Bash against a native install) ---
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
    "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    # --- whatever is on PATH ---
    shutil.which("chromium") or "",
    shutil.which("chromium-browser") or "",
    shutil.which("google-chrome") or "",
    shutil.which("chrome") or "",
    shutil.which("msedge") or "",
    shutil.which("brave") or "",
]

# A raw colour in site.css.  3/4/6/8 hex digits, not followed by a word character
# (so `#fade` as an id selector would be flagged too — deliberately: read the line
# the report prints and decide).  tokens.css is exempt; it IS the palette.
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9A-Za-z_-])")

# A templating marker that must never survive into rendered text.
MARKER_RE = re.compile(r"\[\[[^\]\n]{0,80}\]\]")

# The Work cards park their un-cleared draft copy in a comment beside each card
# (README §13.1 / deck Open Item 4).  This finds those comments so check 7 can
# prove none of that text is printing.
QUEUED_RE = re.compile(r"QUEUED,\s*AWAITING PARTNER CLEARANCE\s*:(?P<body>.*)", re.S | re.I)

SKIP_HREF_SCHEMES = ("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:", "#")

CHECKS = {
    1: "palette      zero raw hex in css/site.css",
    2: "include      chrome partials in sync across every page",
    3: "contrast     WCAG AA on every element with direct text",
    4: "overflow     no horizontal scroll, 320 -> 2560px",
    5: "structure    one h1 / .brand, <=1 .grad, one flip, one green action, no heading jumps",
    6: "refs         every local href/src, anchor and aria id reference resolves",
    7: "reserved     no [[marker]] and no uncleared draft copy in rendered text",
}
BROWSER_CHECKS = {3, 4}


# --------------------------------------------------------------------------- #
# Findings
# --------------------------------------------------------------------------- #

class Report:
    """Collects findings.  A finding always names a check, a file and an element."""

    def __init__(self) -> None:
        self.findings: list[tuple[int, str, str, str]] = []
        self.notes: dict[int, list[str]] = {}
        self.ran: set[int] = set()
        self.skipped: dict[int, str] = {}

    def fail(self, check: int, file: str, element: str, message: str) -> None:
        self.findings.append((check, file, element, message))

    def note(self, check: int, text: str) -> None:
        """What the check actually looked at.  Printed on pass as well as fail."""
        self.notes.setdefault(check, []).append(text)

    def done(self, *checks: int) -> None:
        self.ran.update(checks)

    def skip(self, check: int, why: str) -> None:
        self.skipped[check] = why

    def of(self, check: int) -> list[tuple[int, str, str, str]]:
        return [f for f in self.findings if f[0] == check]


# --------------------------------------------------------------------------- #
# A very small HTML tree.  Enough for ids, classes, attributes and text; not a
# browser.  Everything it is used for is authored markup, not computed layout.
# --------------------------------------------------------------------------- #

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}
NO_TEXT = {"script", "style", "template", "head", "title", "noscript"}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent", "line")

    def __init__(self, tag: str, attrs: dict[str, str], parent=None, line: int = 0):
        self.tag = tag
        self.attrs = attrs
        self.children: list = []          # Node | str
        self.parent = parent
        self.line = line

    # -- convenience ------------------------------------------------------- #
    @property
    def classes(self) -> list[str]:
        return (self.attrs.get("class") or "").split()

    def walk(self):
        for c in self.children:
            if isinstance(c, Node):
                yield c
                yield from c.walk()

    def text(self) -> str:
        """Visible text, comments and <script>/<style> excluded."""
        if self.tag in NO_TEXT:
            return ""
        out = []
        for c in self.children:
            out.append(c if isinstance(c, str) else c.text())
        return " ".join(x for x in out if x)

    def describe(self) -> str:
        """`tag.class#id "first few words"` — how a finding names an element."""
        bit = self.tag
        if self.attrs.get("id"):
            bit += "#" + self.attrs["id"]
        if self.classes:
            bit += "." + ".".join(self.classes[:3])
        txt = squash(self.text())[:42]
        if txt:
            bit += f' "{txt}"'
        return f"line {self.line}  {bit}"


class _Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#document", {})
        self.stack = [self.root]
        self.comments: list[str] = []

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs},
                    self.stack[-1], self.getpos()[0])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs},
                    self.stack[-1], self.getpos()[0])
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return
        # stray close tag: ignore, the same way a browser does

    def handle_data(self, data):
        if data.strip():
            self.stack[-1].children.append(data)

    def handle_comment(self, data):
        self.comments.append(data)


def parse_html(path: pathlib.Path):
    p = _Parser()
    p.feed(path.read_text(encoding="utf-8"))
    p.close()
    return p.root, p.comments


def squash(s: str) -> str:
    return " ".join(s.split())


# --------------------------------------------------------------------------- #
# CHECK 1 — zero raw hex in site.css
# --------------------------------------------------------------------------- #

def check_palette(root: pathlib.Path, rep: Report) -> None:
    css = root / "css" / "site.css"
    if not css.exists():
        rep.skip(1, f"{css} not found")
        return
    lines = css.read_text(encoding="utf-8").splitlines()
    for n, line in enumerate(lines, 1):
        for m in HEX_RE.finditer(line):
            rep.fail(1, "css/site.css", f"line {n}  {squash(line)[:70]}",
                     f"raw hex {m.group(0)} — style through --bg/--fg/--accent/--go, "
                     f"or derive with color-mix() over a token")
    rep.note(1, f"{len(lines)} lines scanned (tokens.css is exempt — it is the palette)")
    rep.done(1)


# --------------------------------------------------------------------------- #
# CHECK 2 — include drift
# --------------------------------------------------------------------------- #

def check_include(root: pathlib.Path, rep: Report) -> None:
    sync = root / "_include" / "sync.py"
    if not sync.exists():
        rep.skip(2, f"{sync} not found")
        return
    try:
        proc = subprocess.run([sys.executable, str(sync), "--check"],
                              capture_output=True, text=True, timeout=120)
    except Exception as exc:                       # noqa: BLE001 - report, never swallow
        rep.skip(2, f"could not run sync.py --check: {exc}")
        return
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0:
        for line in out.splitlines():
            if line.startswith("DRIFTED:"):
                page = line.split(":", 1)[1].strip()
                rep.fail(2, page, "chrome include block",
                         "drifted from _include/ — run: python3 web/_include/sync.py")
        if not rep.of(2):
            rep.fail(2, "web/", "sync.py --check", out or f"exit {proc.returncode}")
    rep.note(2, squash(out) or "sync.py --check produced no output")
    rep.done(2)


# --------------------------------------------------------------------------- #
# CHECK 5 — structural invariants, per page
# --------------------------------------------------------------------------- #

def check_structure(root: pathlib.Path, rep: Report, pages: list[str]) -> None:
    seen = 0
    for rel in pages:
        path = root / rel
        if not path.exists():
            rep.fail(5, rel, "file", "page listed in PAGES does not exist")
            continue
        doc, _ = parse_html(path)
        nodes = list(doc.walk())
        seen += 1

        def having(cls: str) -> list[Node]:
            return [n for n in nodes if cls in n.classes]

        # -- the wordmark is exactly one; the gradient moment is AT MOST one - #
        # README §3 budgets ONE gradient moment per page. It was written assuming
        # the moment is always .grad text in the h1, so this asked for exactly
        # one. That is too narrow: a full-bleed gradient PHOTOGRAPH can carry the
        # moment instead, and when it does, gradient text on top of it is the
        # second moment — the thing the rule exists to prevent. So: zero .grad is
        # legal, two is not. What this can no longer catch is a page with no focal
        # moment at all; that is a judgement call and it stays with whoever
        # reviews it.
        # (Home was the case that forced this, for about a day: a gradient RENDER
        # in the hero and no .grad in the h1. The render was replaced by a real
        # photograph on 2026-08-20 and the .grad went back — so all six pages
        # currently sit at exactly one. The at-most-one rule stays; it is the
        # correct invariant whether or not any page is currently using the slack.)
        found = having("brand")
        if len(found) != 1:
            where = "; ".join(n.describe() for n in found) or "none on the page"
            rep.fail(5, rel, where,
                     f"{len(found)} .brand (wordmark) — the rule is exactly one per page")

        grads = having("grad")
        if len(grads) > 1:
            where = "; ".join(n.describe() for n in grads)
            rep.fail(5, rel, where,
                     f"{len(grads)} .grad (gradient moment) — the budget is one per "
                     f"page, and a gradient hero image already spends it")

        h1s = [n for n in nodes if n.tag == "h1"]
        if len(h1s) != 1:
            where = "; ".join(n.describe() for n in h1s) or "none on the page"
            rep.fail(5, rel, where, f"{len(h1s)} <h1> — the rule is exactly one per page")

        # -- at most one opposite-ground band ------------------------------ #
        page_ground = ""
        for n in nodes:
            if n.tag == "html" or n.parent is doc:
                page_ground = n.attrs.get("data-ground", page_ground) or page_ground
        bands = [n for n in nodes
                 if n.attrs.get("data-ground") and n.attrs["data-ground"] != page_ground
                 and n.tag != "html"]
        if len(bands) > 1:
            for n in bands:
                rep.fail(5, rel, n.describe(),
                         f"opposite-ground band #{bands.index(n) + 1} of {len(bands)} — "
                         f"page ground is {page_ground!r}; two flips read as stripes")

        # -- at most one filled-green ACTION ------------------------------- #
        # Not one BUTTON: Home fills green twice (hero + CTA band) and both are the
        # same action, which README §3 allows and do-not #7 is actually about
        # ("never two on one screen doing different things").  So: dedupe by what
        # the button DOES — its destination and its label.
        greens = [n for n in nodes if "btn-go" in n.classes]
        actions: dict[tuple[str, str], list[Node]] = {}
        for n in greens:
            key = (n.attrs.get("href") or n.attrs.get("type") or n.tag,
                   squash(n.text()).lower())
            actions.setdefault(key, []).append(n)
        if len(actions) > 1:
            for key, group in actions.items():
                rep.fail(5, rel, group[0].describe(),
                         f"filled-green action {key[0]!r} — {len(actions)} DIFFERENT filled "
                         f"green actions on one page; only the primary action may be filled")

        # -- no heading-level jumps ---------------------------------------- #
        prev = 0
        for n in nodes:
            if len(n.tag) == 2 and n.tag[0] == "h" and n.tag[1] in "123456":
                lvl = int(n.tag[1])
                if prev and lvl > prev + 1:
                    rep.fail(5, rel, n.describe(),
                             f"heading jumps h{prev} -> h{lvl}; a screen reader's outline "
                             f"loses a level here")
                prev = lvl
    rep.note(5, f"{seen} page(s): singletons, ground flips, filled-green actions, heading order")
    rep.done(5)


# --------------------------------------------------------------------------- #
# CHECK 6 — every reference resolves
# --------------------------------------------------------------------------- #

def _fragments(path: pathlib.Path) -> set[str]:
    doc, _ = parse_html(path)
    ids = {n.attrs["id"] for n in doc.walk() if n.attrs.get("id")}
    ids |= {n.attrs["name"] for n in doc.walk() if n.tag == "a" and n.attrs.get("name")}
    return ids


def check_refs(root: pathlib.Path, rep: Report, pages: list[str]) -> None:
    frag_cache: dict[pathlib.Path, set[str]] = {}
    counts = {"href": 0, "anchor": 0, "aria": 0}

    for rel in pages:
        path = root / rel
        if not path.exists():
            continue
        doc, _ = parse_html(path)
        nodes = list(doc.walk())
        ids = {n.attrs["id"] for n in nodes if n.attrs.get("id")}
        frag_cache[path] = ids

        for n in nodes:
            # ---- local href / src resolves on disk ----------------------- #
            for attr in ("href", "src"):
                url = n.attrs.get(attr)
                if url is None:
                    continue
                url = url.strip()
                if not url:
                    rep.fail(6, rel, n.describe(), f"empty {attr}=\"\"")
                    continue
                if url.startswith("/"):
                    counts["href"] += 1
                    rep.fail(6, rel, n.describe(),
                             f"root-absolute {attr}={url!r} — this site must open from disk; "
                             f"use a relative path")
                    continue
                if url.startswith(SKIP_HREF_SCHEMES):
                    if url.startswith("#"):
                        counts["anchor"] += 1
                        frag = url[1:]
                        if frag and frag not in ids:
                            rep.fail(6, rel, n.describe(),
                                     f"in-page anchor {url!r} has no matching id on this page")
                    continue
                counts["href"] += 1
                file_part, _, frag = url.partition("#")
                target = (path.parent / file_part).resolve()
                if not target.exists():
                    rep.fail(6, rel, n.describe(),
                             f"{attr}={url!r} does not resolve on disk "
                             f"(looked for {target})")
                    continue
                # ---- cross-page fragment (the renamed-section-id catcher) - #
                if frag and target.suffix == ".html":
                    if target not in frag_cache:
                        frag_cache[target] = _fragments(target)
                    if frag not in frag_cache[target]:
                        counts["anchor"] += 1
                        rep.fail(6, rel, n.describe(),
                                 f"{attr}={url!r} — {file_part} has no id {frag!r} "
                                 f"(was the section renamed?)")
                    else:
                        counts["anchor"] += 1

            # ---- ARIA id references -------------------------------------- #
            for attr in ("aria-describedby", "aria-labelledby", "aria-controls",
                         "aria-owns", "for"):
                val = n.attrs.get(attr)
                if not val:
                    continue
                if attr == "for" and n.tag != "label":
                    continue
                for ident in val.split():
                    counts["aria"] += 1
                    if ident not in ids:
                        rep.fail(6, rel, n.describe(),
                                 f"{attr}={ident!r} points at an id that is not on this page")

    rep.note(6, f"{counts['href']} local href/src, {counts['anchor']} anchor(s), "
                f"{counts['aria']} aria/label id reference(s) resolved")
    rep.done(6)


# --------------------------------------------------------------------------- #
# CHECK 7 — nothing reserved reaches rendered text
# --------------------------------------------------------------------------- #

def _queued_phrases(comments: list[str]) -> list[str]:
    """Draft copy parked beside a Work card, as normalised word-shingles."""
    out: list[str] = []
    for c in comments:
        m = QUEUED_RE.search(c)
        if not m:
            continue
        body = html.unescape(m.group("body"))
        # entries look like:  title  <words>   /   line  <words>
        for chunk in re.split(r"(?m)^\s*(?:title|line)\s+", body):
            chunk = squash(chunk)
            if len(chunk.split()) >= 3:
                out.append(chunk)
    return out


def _shingles(phrase: str, n: int = 3) -> list[str]:
    words = re.sub(r"[^\w\s·&;-]", " ", phrase.lower()).split()
    if len(words) <= n:
        return [" ".join(words)] if words else []
    return [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]


def check_reserved(root: pathlib.Path, rep: Report, pages: list[str]) -> None:
    checked = 0
    phrases_seen = 0
    for rel in pages:
        path = root / rel
        if not path.exists():
            continue
        doc, comments = parse_html(path)
        body = next((n for n in doc.walk() if n.tag == "body"), doc)
        rendered = squash(body.text())
        norm = " ".join(re.sub(r"[^\w\s·&;-]", " ", rendered.lower()).split())
        checked += 1

        for m in MARKER_RE.finditer(rendered):
            rep.fail(7, rel, f'rendered text ...{rendered[max(0, m.start() - 30):m.end() + 20]}...',
                     f"templating marker {m.group(0)!r} reached the page")

        for phrase in _queued_phrases(comments):
            phrases_seen += 1
            for sh in _shingles(phrase):
                if sh and sh in norm:
                    rep.fail(7, rel, f'rendered text "{sh}"',
                             f"un-cleared Work-card draft is PRINTING — it is parked in a "
                             f"comment awaiting partner clearance: {phrase[:70]!r}")
                    break
    rep.note(7, f"{checked} page(s) of rendered text scanned; {phrases_seen} parked draft "
                f"phrase(s) confirmed still un-printed")
    rep.done(7)


# --------------------------------------------------------------------------- #
# Browser-side: the JS that checks 3, 4 (and re-runs 6 and 7 against the live DOM)
# --------------------------------------------------------------------------- #

AUDIT_JS = r"""
(() => {
  // ---- colour maths (WCAG 2.1) --------------------------------------------
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  // Chrome serialises rgb()/rgba() with 0..255 channels but color-mix() as
  // color(srgb r g b / a) with 0..1 channels. Miss that and every derived colour
  // reads as near-black and the whole check becomes noise.
  const parse = s => {
    const n = (s.match(/[\d.]+/g) || []).map(Number);
    if (/^color\(/.test(s)) {
      const c = n.slice(0, 3).map(v => v * 255);
      if (n.length > 3) c.push(n[3]);
      return c;
    }
    return n;
  };
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a));
  };
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length === 3 || (c.length === 4 && c[3] > 0.95)) return c.slice(0, 3);
      n = n.parentElement;
    }
    const c = parse(getComputedStyle(document.documentElement).backgroundColor);
    return (c.length >= 3 && !(c.length === 4 && c[3] < 0.05)) ? c.slice(0, 3) : [255, 255, 255];
  };
  const groundOf = el => {
    const g = el.closest('[data-ground]');
    return g ? g.dataset.ground : 'default';
  };
  const name = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) s += '.' + cls.split(/\s+/).slice(0, 3).join('.');
    return s;
  };

  const out = { contrast: [], measured: 0, skipped: 0, grounds: {}, worst: null,
                refs: [], marker: [], text: '' };

  // ---- CHECK 3: every element with DIRECT text ----------------------------
  document.querySelectorAll('body *').forEach(el => {
    const txt = [...el.childNodes]
      .filter(n => n.nodeType === 3 && n.textContent.trim())
      .map(n => n.textContent.trim()).join(' ');
    if (!txt) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') { out.skipped++; return; }
    if (el.closest('[hidden]')) { out.skipped++; return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { out.skipped++; return; }
    // Gradient text paints through the background; there is no foreground colour
    // to measure. It is governed by the display-size rule instead (README §3).
    if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' ||
        cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') { out.skipped++; return; }

    const bg = bgOf(el);
    const fg = over(parse(cs.color), bg);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5;
    const ground = groundOf(el);

    out.measured++;
    out.grounds[ground] = (out.grounds[ground] || 0) + 1;
    if (!out.worst || ratio < out.worst.ratio) {
      out.worst = { ratio: +ratio.toFixed(2), need, el: name(el), txt: txt.slice(0, 40), ground };
    }
    if (ratio < need - 1e-6) {
      out.contrast.push({ el: name(el), txt: txt.slice(0, 46), ratio: +ratio.toFixed(2),
                          need, px: +px.toFixed(1), weight: w, ground });
    }
  });

  // ---- CHECK 6 against the LIVE dom (catches ids created by script) -------
  const dead = (sel, attr, split) => {
    document.querySelectorAll(sel).forEach(el => {
      const v = el.getAttribute(attr) || '';
      (split ? v.split(/\s+/) : [v.replace(/^#/, '')]).forEach(id => {
        if (id && !document.getElementById(id)) out.refs.push(attr + '="' + id + '" on ' + name(el));
      });
    });
  };
  dead('a[href^="#"]:not([href="#"])', 'href', false);
  dead('[aria-describedby]', 'aria-describedby', true);
  dead('[aria-labelledby]', 'aria-labelledby', true);
  dead('[aria-controls]', 'aria-controls', true);

  // ---- CHECK 7 against the LIVE dom (catches text injected by script/CSS) --
  out.text = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
  return out;
})()
"""

OVERFLOW_JS = r"""
(() => {
  const de = document.documentElement;
  const sw = de.scrollWidth, cw = de.clientWidth;
  if (sw <= cw + 1) return { ok: true, sw, cw, offenders: [] };
  const offenders = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > cw + 1 || r.left < -1) {
      const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
      // Only name the element if no ancestor is already the offender: report the
      // outermost thing that sticks out, not its whole subtree.
      if (!offenders.some(o => o.node.contains(el))) {
        offenders.push({ node: el,
          label: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
                 (cls ? '.' + cls.split(/\s+/).slice(0, 3).join('.') : '') +
                 ' [' + Math.round(r.left) + ' -> ' + Math.round(r.right) + ']' });
      }
    }
  });
  return { ok: false, sw, cw, offenders: offenders.slice(0, 6).map(o => o.label) };
})()
"""


# --------------------------------------------------------------------------- #
# Browser plumbing: a minimal WebSocket + CDP client (stdlib only)
# --------------------------------------------------------------------------- #

class BrowserUnavailable(RuntimeError):
    """Raised when the browser cannot be started or driven.  Never swallowed."""


class _WS:
    """RFC-6455 client, text frames only.  ~80 lines beats a dependency."""

    def __init__(self, url: str, timeout: float = 60.0):
        m = re.match(r"ws://([^:/]+):(\d+)(/.*)$", url)
        if not m:
            raise BrowserUnavailable(f"unparsable devtools url: {url}")
        host, port, path = m.group(1), int(m.group(2)), m.group(3)
        self.sock = socket.create_connection((host, port), timeout=timeout)
        self.sock.settimeout(timeout)
        self.buf = bytearray()
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(
            f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n".encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise BrowserUnavailable("devtools closed during handshake")
            head += chunk
        header, _, rest = head.partition(b"\r\n\r\n")
        if b" 101 " not in header.split(b"\r\n")[0]:
            raise BrowserUnavailable(f"devtools refused upgrade: {header.splitlines()[0]!r}")
        self.buf += rest

    def _read(self, n: int) -> bytes:
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise BrowserUnavailable("devtools connection closed")
            self.buf += chunk
        out = bytes(self.buf[:n])
        del self.buf[:n]
        return out

    def send(self, text: str) -> None:
        data = text.encode()
        head = bytearray([0x81])
        n = len(data)
        if n < 126:
            head.append(0x80 | n)
        elif n < 1 << 16:
            head.append(0x80 | 126)
            head += struct.pack("!H", n)
        else:
            head.append(0x80 | 127)
            head += struct.pack("!Q", n)
        mask = os.urandom(4)
        head += mask
        self.sock.sendall(bytes(head) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self) -> str:
        payload = bytearray()
        while True:
            b0, b1 = self._read(2)
            fin, op = b0 & 0x80, b0 & 0x0F
            masked, n = b1 & 0x80, b1 & 0x7F
            if n == 126:
                n = struct.unpack("!H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack("!Q", self._read(8))[0]
            mask = self._read(4) if masked else None
            body = self._read(n)
            if mask:
                body = bytes(b ^ mask[i % 4] for i, b in enumerate(body))
            if op == 0x9:                       # ping -> pong, keep reading
                self.sock.sendall(b"\x8a\x80" + os.urandom(4))
                continue
            if op == 0x8:
                raise BrowserUnavailable("devtools sent close")
            if op == 0xA:
                continue
            payload += body
            if fin:
                return payload.decode("utf-8", "replace")

    def close(self) -> None:
        try:
            self.sock.close()
        except OSError:
            pass


class Chrome:
    """Just enough CDP to navigate, resize and evaluate."""

    def __init__(self, binary: str, profile: pathlib.Path):
        self.proc = subprocess.Popen(
            [binary,
             "--headless=new", "--remote-debugging-port=0",
             f"--user-data-dir={profile}",
             "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
             "--no-first-run", "--no-default-browser-check", "--disable-extensions",
             "--disable-background-networking", "--disable-sync",
             "--force-device-scale-factor=1", "--hide-scrollbars",
             "--window-size=1440,900", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        port_file = profile / "DevToolsActivePort"
        deadline = time.time() + 30
        while time.time() < deadline:
            if self.proc.poll() is not None:
                raise BrowserUnavailable(
                    f"chromium exited immediately (status {self.proc.returncode})")
            if port_file.exists():
                txt = port_file.read_text().splitlines()
                if txt and txt[0].strip().isdigit():
                    break
            time.sleep(0.05)
        else:
            self.kill()
            raise BrowserUnavailable("chromium never wrote DevToolsActivePort")
        port = int(txt[0].strip())
        with urlopen(f"http://127.0.0.1:{port}/json/version", timeout=20) as fh:
            ver = json.load(fh)
        self.version = ver.get("Browser", "chromium ?")
        self._id = 0
        self.ws = _WS(ver["webSocketDebuggerUrl"])
        target = self.cmd("Target.createTarget", {"url": "about:blank"}, session=False)
        self.session = self.cmd("Target.attachToTarget",
                                {"targetId": target["targetId"], "flatten": True},
                                session=False)["sessionId"]

    # -- protocol ---------------------------------------------------------- #
    def cmd(self, method: str, params: dict | None = None, session: bool = True) -> dict:
        self._id += 1
        msg = {"id": self._id, "method": method, "params": params or {}}
        if session:
            msg["sessionId"] = self.session
        self.ws.send(json.dumps(msg))
        while True:
            reply = json.loads(self.ws.recv())
            if reply.get("id") != self._id:
                continue                       # an event; we do not subscribe to any
            if "error" in reply:
                raise BrowserUnavailable(f"{method}: {reply['error']}")
            return reply.get("result", {})

    def evaluate(self, expression: str):
        r = self.cmd("Runtime.evaluate",
                     {"expression": expression, "returnByValue": True,
                      "awaitPromise": True, "userGesture": True})
        if "exceptionDetails" in r:
            detail = r["exceptionDetails"]
            text = detail.get("exception", {}).get("description") or detail.get("text")
            raise BrowserUnavailable(f"page script threw: {text}")
        return r["result"].get("value")

    def goto(self, url: str, timeout: float = 30.0) -> None:
        self.cmd("Page.navigate", {"url": url})
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                state = self.evaluate("document.readyState + '|' + location.href")
            except BrowserUnavailable:
                time.sleep(0.05)
                continue
            if state.startswith("complete|") and url.split("#")[0] in state:
                # fonts change metrics, and metrics are what check 4 measures
                self.evaluate("document.fonts.ready.then(() => true)")
                return
            time.sleep(0.05)
        raise BrowserUnavailable(f"page never finished loading: {url}")

    def viewport(self, width: int, height: int = 900) -> None:
        self.cmd("Emulation.setDeviceMetricsOverride",
                 {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": False})
        time.sleep(0.05)                       # let layout settle before measuring

    def kill(self) -> None:
        try:
            self.ws.close()
        except Exception:                       # noqa: BLE001
            pass
        try:
            self.proc.terminate()
            self.proc.wait(timeout=10)
        except Exception:                       # noqa: BLE001
            self.proc.kill()


def find_chromium() -> str | None:
    for cand in CHROMIUM_CANDIDATES:
        if cand and pathlib.Path(cand).exists() and os.access(cand, os.X_OK):
            return cand
    return None


class Serve:
    """Serve the site over http so webfonts load; file:// blocks them and font
    metrics are exactly what the overflow check measures."""

    def __init__(self, root: pathlib.Path):
        handler = partial(_QuietHandler, directory=str(root))
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    @property
    def base(self) -> str:
        return f"http://127.0.0.1:{self.port}/"

    def stop(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()


class _QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):               # noqa: A003 - silence the access log
        pass


# --------------------------------------------------------------------------- #
# The browser pass
# --------------------------------------------------------------------------- #

def run_browser_checks(root: pathlib.Path, rep: Report, pages: list[str],
                       binary: str) -> None:
    server = Serve(root)
    profile = pathlib.Path(tempfile.mkdtemp(prefix="intrnls-check-"))
    chrome = None
    measured = 0
    grounds: dict[str, int] = {}
    skipped = 0
    worst = None
    sweeps = 0
    try:
        chrome = Chrome(binary, profile)
        rep.note(3, f"driven with {chrome.version}")
        for rel in pages:
            if not (root / rel).exists():
                continue
            chrome.goto(server.base + rel)

            # ---- CHECK 4: the width sweep -------------------------------- #
            for w in WIDTHS:
                chrome.viewport(w)
                res = chrome.evaluate(OVERFLOW_JS)
                sweeps += 1
                if not res["ok"]:
                    for label in res["offenders"] or ["(no single element found — "
                                                      "check a min-width or a long token)"]:
                        rep.fail(4, rel, label,
                                 f"at {w}px the page scrolls sideways: "
                                 f"scrollWidth {res['sw']} > clientWidth {res['cw']}")
            chrome.viewport(1440)

            # ---- CHECKS 3, 6-live, 7-live -------------------------------- #
            data = chrome.evaluate(AUDIT_JS)
            measured += data["measured"]
            skipped += data["skipped"]
            for g, n in data["grounds"].items():
                grounds[g] = grounds.get(g, 0) + n
            if data["worst"] and (worst is None or data["worst"]["ratio"] < worst["ratio"]):
                worst = dict(data["worst"], page=rel)
            for row in data["contrast"]:
                rep.fail(3, rel,
                         f"{row['el']} \"{row['txt']}\"",
                         f"{row['ratio']}:1 on {row['ground']} — needs {row['need']}:1 "
                         f"at {row['px']}px/{row['weight']}")
            for dead in data["refs"]:
                rep.fail(6, rel, dead, "dangling reference in the live DOM")
            live = data["text"]
            for m in MARKER_RE.finditer(live):
                rep.fail(7, rel, f"rendered text ...{live[max(0, m.start() - 30):m.end() + 20]}...",
                         f"templating marker {m.group(0)!r} reached the rendered page")
    except BrowserUnavailable as exc:
        for c in BROWSER_CHECKS:
            rep.skip(c, str(exc))
        return
    finally:
        if chrome:
            chrome.kill()
        server.stop()
        shutil.rmtree(profile, ignore_errors=True)

    if measured == 0:
        rep.skip(3, "zero elements measured — the check looked at nothing")
    else:
        rep.note(3, f"{measured} element(s) with direct text measured across "
                    f"{len(pages)} page(s); {skipped} skipped (hidden, zero-size or "
                    f"gradient text)")
        rep.note(3, "by ground: " + ", ".join(f"{g}={n}" for g, n in sorted(grounds.items())))
        if worst:
            rep.note(3, f"worst pair {worst['ratio']}:1 (needs {worst['need']}) — "
                        f"{worst['page']} {worst['el']} \"{worst['txt']}\"")
        rep.done(3)
    if sweeps == 0:
        rep.skip(4, "no widths swept")
    else:
        rep.note(4, f"{sweeps} measurement(s): {len(WIDTHS)} widths "
                    f"({WIDTHS[0]}–{WIDTHS[-1]}px) x {len(pages)} page(s)")
        rep.done(4)


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #

def discover_pages(root: pathlib.Path) -> list[str]:
    """Every published page: all html under web/ except the partials."""
    inc = root / "_include"
    found = sorted(str(p.relative_to(root)).replace(os.sep, "/")
                   for p in root.rglob("*.html") if inc not in p.parents)
    return found


def run_checks(root: pathlib.Path, rep: Report, only: set[int] | None = None,
               pages: list[str] | None = None, binary: str | None = None,
               allow_browser: bool = True) -> Report:
    pages = pages if pages is not None else discover_pages(root)
    want = only or set(CHECKS)

    if 1 in want:
        check_palette(root, rep)
    if 2 in want:
        check_include(root, rep)
    if 5 in want:
        check_structure(root, rep, pages)
    if 6 in want:
        check_refs(root, rep, pages)
    if 7 in want:
        check_reserved(root, rep, pages)

    if allow_browser and want & BROWSER_CHECKS:
        # An explicitly-supplied --chromium/CHROMIUM path is validated HERE rather
        # than left to blow up inside subprocess: a raw traceback reads as "this
        # tool is broken" when the real answer is "that path is wrong".
        why = None
        if binary and not (pathlib.Path(binary).exists()
                           and os.access(binary, os.X_OK)):
            why = (f"--chromium {binary!r} is not an executable file on this "
                   f"machine; omit the flag to search the usual install locations")
            binary = None
        else:
            binary = binary or find_chromium()
            if not binary:
                # Deliberately NOT a dump of every path tried — that reads as a
                # crash. Say what is missing and how to fix it, in one line.
                why = ("no Chrome/Chromium/Edge found on this machine. "
                       "Install one, or point at it: "
                       "python3 web/check.py --chromium '<path to the browser>' "
                       "(or set the CHROMIUM env var). Chrome, Chromium, Edge and "
                       "Brave all work — the checks drive any of them over CDP.")
        if binary:
            run_browser_checks(root, rep, pages, binary)
        else:
            for num in sorted(want & BROWSER_CHECKS):
                rep.skip(num, why)
    return rep


def print_report(rep: Report, root: pathlib.Path, pages: list[str]) -> int:
    w = shutil.get_terminal_size((100, 24)).columns
    bar = "-" * min(w, 78)
    print(f"\nintrnls.com site checks")
    print(f"  root  {root}")
    print(f"  pages {len(pages)}: " + ", ".join(pages))
    print(bar)

    failed = skipped = 0
    for num, title in CHECKS.items():
        finds = rep.of(num)
        if num in rep.skipped:
            state, skipped = "SKIP", skipped + 1
        elif finds:
            state, failed = "FAIL", failed + 1
        elif num in rep.ran:
            state = "pass"
        else:
            state, skipped = "SKIP", skipped + 1
            rep.skipped.setdefault(num, "did not run")
        print(f"{state:>4}  {num}  {title}")
        for line in rep.notes.get(num, []):
            print(f"          . {line}")
        if num in rep.skipped:
            print(f"          ! NOT RUN: {rep.skipped[num]}")
        for _, file, element, message in finds:
            print(f"          x {file}")
            print(f"            {element}")
            print(f"            {message}")
    print(bar)

    if failed == 0 and skipped == 0:
        print(f"PASS — {len(CHECKS)} checks, {len(rep.findings)} findings")
        return 0
    parts = []
    if failed:
        parts.append(f"{failed} check(s) FAILED with {len(rep.findings)} finding(s)")
    if skipped:
        parts.append(f"{skipped} check(s) COULD NOT RUN")
    print("FAIL — " + "; ".join(parts))
    if skipped:
        print("       A skipped check is not a pass — the reason is printed above.")
        print("       Fix it and run again before you trust this result.")
    return 1 if failed else 2


# --------------------------------------------------------------------------- #
# --self-test: prove every check can FAIL
# --------------------------------------------------------------------------- #

def _inject_in_main(text: str, snippet: str, at_end: bool = False) -> str:
    if at_end:
        i = text.rindex("</main>")
        return text[:i] + snippet + text[i:]
    m = re.search(r"<main\b[^>]*>", text)
    return text[:m.end()] + snippet + text[m.end():]


def _mutations(root: pathlib.Path) -> list[tuple[str, int, str, callable]]:
    """(name, expected check, file it should be blamed on, mutate(text)->text)"""
    index = "index.html"
    css = "css/site.css"

    # the parked draft copy, read out of the page's own comment rather than
    # hard-coded here — the checker must not carry un-cleared copy either.
    _, comments = parse_html(root / index)
    parked = (_queued_phrases(comments) or ["Direct air capture sector card"])[0]

    return [
        ("raw hex in site.css", 1, css,
         lambda t: t + "\n.mutation-test{color:#ABCDEF}\n"),
        ("chrome include drifted", 2, index,
         lambda t: t.replace('data-nav="about">About<', 'data-nav="about">Mutated<', 1)),
        ("low-contrast text", 3, index,
         lambda t: _inject_in_main(t, '<p style="background:#000000;color:#111111">'
                                      'mutation low contrast paragraph</p>')),
        ("4000px-wide box", 4, index,
         lambda t: _inject_in_main(t, '<div style="width:4000px;height:4px">&nbsp;</div>')),
        ("duplicate h1", 5, index,
         lambda t: _inject_in_main(t, "<h1>mutation second h1</h1>")),
        # TWO .grad, not one, and it stays two.  The budget is at-most-one, so on a
        # page that starts at ZERO (legal — an image can spend the moment) injecting
        # a single .grad is legal and this mutation would silently stop testing
        # anything.  Injecting two breaks the rule whatever the page starts with, so
        # the mutation keeps biting as pages come and go from the slack.  Home went
        # 1 → 0 → 1 in three days over one hero image; that is exactly why this does
        # not depend on Home's current count.
        ("second gradient moment", 5, index,
         lambda t: _inject_in_main(t, '<span class="grad">mutation a</span>'
                                      '<span class="grad">mutation b</span>')),
        ("second opposite-ground band", 5, index,
         lambda t: _inject_in_main(t, '<section data-ground="cashmere">'
                                      "<p>mutation band</p></section>")),
        ("heading-level jump", 5, index,
         lambda t: _inject_in_main(t, "<h5>mutation jumped heading</h5>", at_end=True)),
        ("second filled-green action", 5, index,
         lambda t: _inject_in_main(t, '<a class="btn btn-go" href="about.html">'
                                      "Mutation other action</a>")),
        ("dangling in-page anchor", 6, index,
         lambda t: _inject_in_main(t, '<a href="#mutation-no-such-id">mutation</a>')),
        ("dangling file href", 6, index,
         lambda t: _inject_in_main(t, '<a href="mutation-no-such-page.html">mutation</a>')),
        ("dangling cross-page fragment", 6, index,
         lambda t: t.replace('what-we-do.html#materials',
                             'what-we-do.html#mutation-renamed-section', 1)),
        ("dangling aria-describedby", 6, index,
         lambda t: _inject_in_main(t, '<p aria-describedby="mutation-no-such-id">mutation</p>')),
        ("[[marker]] in rendered text", 7, index,
         lambda t: _inject_in_main(t, "<p>[[reserved]]</p>")),
        # Plant the parked comment AND print it, rather than only printing text.
        # Once every project cleared, the live pages stopped carrying any QUEUED
        # comment, so a mutation that only printed copy had no mechanism left to
        # trip and reported MISSED.  The guard still has to work for the NEXT
        # project that gets parked, so the mutation now supplies both halves.
        ("un-cleared draft copy printed", 7, index,
         lambda t: _inject_in_main(
             t,
             f"<!-- QUEUED, AWAITING PARTNER CLEARANCE: {parked} -->"
             f"<p>{html.escape(parked)}</p>")),
    ]


def self_test(root: pathlib.Path, binary: str | None) -> int:
    binary = binary or find_chromium()
    work = pathlib.Path(tempfile.mkdtemp(prefix="intrnls-selftest-"))
    site = work / "web"
    shutil.copytree(root, site)
    pages = discover_pages(site)

    print("\nintrnls.com check.py — MUTATION TEST")
    print(f"  copy of the site at {site}")
    print("  each row breaks the site one way and demands the checker catch it")
    print("-" * 78)

    # ---- baseline: what does the UNBROKEN copy already report? ------------ #
    base = Report()
    run_checks(site, base, only={1, 2, 5, 6, 7}, pages=pages, allow_browser=False)
    baseline = {(f[0], f[2], f[3]) for f in base.findings}
    if baseline:
        print(f"  note: the clean copy already has {len(baseline)} static finding(s); "
              f"a mutation must add a NEW one")

    if not binary:
        print("  ! no Chromium — the two browser mutations cannot be proven here")

    # Baseline for the browser checks is per PAGE, because a browser mutation is
    # only ever proven against the page it was injected into.  Two ways to get
    # this wrong, both of which this self-test did before it was itself debugged:
    #   1. mutate index.html and then go and look at about.html -> everything MISSED;
    #   2. take the baseline AFTER applying the mutation -> the mutation lands in
    #      its own baseline, is not "new", and reads as MISSED.
    # So: baselines for every browser target, on the CLEAN copy, before the loop.
    mutations = _mutations(site)
    browser_baseline: dict[str, set] = {}
    browser_broken = ""
    if binary:
        for page in sorted({m[2] for m in mutations if m[1] in BROWSER_CHECKS}):
            clean = Report()
            run_browser_checks(site, clean, [page], binary)
            if clean.skipped:
                browser_broken = "; ".join(clean.skipped.values())
                break
            browser_baseline[page] = {(f[0], f[2], f[3]) for f in clean.findings}
            print(f"  browser baseline for {page}: "
                  f"{'; '.join(clean.notes.get(3, [])[1:2]) or 'no elements measured'}")

    rows, bad = [], 0
    originals = {p: (site / p).read_text(encoding="utf-8")
                 for p in {m[2] for m in mutations}}
    for name, expect, target, mutate in mutations:
        for p, txt in originals.items():
            (site / p).write_text(txt, encoding="utf-8")
        (site / target).write_text(mutate(originals[target]), encoding="utf-8")

        rep = Report()
        known = baseline
        if expect in BROWSER_CHECKS:
            if not binary or browser_broken or target not in browser_baseline:
                rows.append(("BROKEN", name, expect,
                             browser_broken or "no Chromium on this machine "
                                               "— mutation NOT proven"))
                bad += 1
                continue
            known = baseline | browser_baseline[target]
            run_browser_checks(site, rep, [target], binary)
            # A browser that dies mid-run must never read as "the check missed it".
            if rep.skipped:
                rows.append(("BROKEN", name, expect,
                             "browser check did not run: " + "; ".join(rep.skipped.values())))
                bad += 1
                continue
        else:
            run_checks(site, rep, only={expect}, pages=pages, allow_browser=False)

        new = [f for f in rep.findings
               if f[0] == expect and (f[0], f[2], f[3]) not in known]
        if new:
            rows.append(("CAUGHT", name, expect, f"{new[0][1]} :: {new[0][3][:88]}"))
        else:
            rows.append(("MISSED", name, expect,
                         "the checker did not notice — this check cannot fail"))
            bad += 1

    for p, txt in originals.items():
        (site / p).write_text(txt, encoding="utf-8")

    for state, name, expect, detail in rows:
        print(f"  {state:>6}  check {expect}  {name}")
        print(f"          {detail}")
    print("-" * 78)
    shutil.rmtree(work, ignore_errors=True)
    if bad:
        print(f"SELF-TEST FAILED — {bad} of {len(rows)} mutation(s) not caught")
        return 1
    print(f"SELF-TEST PASSED — all {len(rows)} mutations caught and named")
    return 0


# --------------------------------------------------------------------------- #

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        prog="check.py",
        description="intrnls.com site checks. Exit 0 = pass, 1 = a check failed, "
                    "2 = a check could not run.")
    ap.add_argument("--self-test", action="store_true",
                    help="mutation-test the checker itself and exit")
    ap.add_argument("--no-browser", action="store_true",
                    help="skip the two rendering checks (still exits non-zero — "
                         "they are SKIPPED, not passed)")
    ap.add_argument("--chromium", metavar="PATH", help="path to a Chromium binary")
    ap.add_argument("--root", metavar="DIR", default=str(WEB),
                    help="site root (default: the directory holding this script)")
    args = ap.parse_args(argv)

    root = pathlib.Path(args.root).resolve()
    if not (root / "css" / "site.css").exists():
        print(f"check.py: {root} does not look like the site (no css/site.css)")
        return 2

    if args.self_test:
        return self_test(root, args.chromium)

    pages = discover_pages(root)
    missing = [p for p in PAGES if p not in pages]
    extra = [p for p in pages if p not in PAGES]
    rep = Report()
    only = set(CHECKS) - BROWSER_CHECKS if args.no_browser else None
    run_checks(root, rep, only=only, pages=pages, binary=args.chromium)
    if args.no_browser:
        for c in BROWSER_CHECKS:
            rep.skip(c, "--no-browser was passed")
    code = print_report(rep, root, pages)
    if missing:
        print(f"       note: page(s) in PAGES but not on disk: {missing}")
    if extra:
        print(f"       note: page(s) on disk but not in PAGES (checked anyway): {extra}")
    return code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
