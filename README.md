# intrnls.com

The intrnls marketing site — static HTML/CSS/JS, no build step, no framework, no npm. The pages
in git are the pages that ship.

**Live at:** https://intrnls.com (once DNS is pointed here — see below)

## Structure

- `web/` — the deployable site. Everything in it ships; nothing outside it does.
- `brand/tokens.css` — the design-token source of truth. `web/css/tokens.css` is a verbatim
  synced copy; edit the former, never the latter.
- `.github/workflows/pages.yml` — deploys `web/` to GitHub Pages on every push to `main`.

## Working on this

Start with **`web/README.md`** — the full art-direction spec, build notes, and the complete
punch list of what's still open. It is the durable memory for this project; if you learn
something the next session would waste time rediscovering, add it there.

```bash
python3 web/check.py              # 7 checks: palette, contrast, overflow, structure, refs, ...
python3 web/check.py --self-test  # verifies the checks themselves actually catch things
python3 web/_include/sync.py      # push header/footer/head edits into all 6 pages
```

No install, no dependencies beyond Python 3 and a Chromium-family browser.

## History

This repo was split out of `printfoam/printer-hacking` on 2026-08-20 so the public marketing
site could be hosted on GitHub Pages without making that private repo (firmware
reverse-engineering, internal tooling) public. This repo starts its own git history — it does
not carry that repo's commits. Design-process material (rejected photo candidates, raw
deliverables, screenshots) stayed behind there; nothing here ships that wasn't already meant to.

## Licensing

No `LICENSE` file is deliberate — the absence means all rights reserved by default, which is the
intended position for this repository's own code and content. This does **not** apply to
third-party assets vendored here under their own license — see `THIRD-PARTY-NOTICES.md`.
