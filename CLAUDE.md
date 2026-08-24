# intrnls-web — project memory

This repo IS intrnls.com. **A push to `main` is live on the internet within about a minute**
(GitHub Pages deploys `web/` via `.github/workflows/pages.yml`). There is no staging tier —
the checks and your own eyes are the staging tier. Act accordingly.

## Read first

**`web/README.md` is the durable memory for this site** — the full art-direction spec, every
design decision and its reversal, and the punch list of what is still open. Read it before
changing anything visual, and **add to it** when you make a decision the next session would
otherwise re-derive. `web/img/README.md` owns asset naming, sizes, and the status table.

## The rules (each one earned the hard way)

1. **Run `python3 web/check.py` before every commit — 7/7 or it doesn't ship.** Needs only
   Python 3 and a Chromium-family browser (in a sandbox, it passes `--no-sandbox` itself).
   If you edit `check.py`, also run `python3 web/check.py --self-test` (15/15 mutations caught).
2. **Never edit a GENERATED BLOCK in a page.** Header/footer/head-common live in
   `web/_include/*.html`; edit the include, then `python3 web/_include/sync.py`. Check 2
   fails on drift.
3. **`web/css/tokens.css` is a verbatim synced copy of `brand/tokens.css`** — edit the brand
   file and re-copy, never the web copy. `site.css` declares zero raw hex; everything styles
   through tokens (check 1 enforces this).
4. **Never fill a fact slot with something invented.** Empty dashed `.slot-tag` chips and
   `.slot` plates are deliberate: a missing fact stays visibly missing until the operator
   supplies the real one. Prose can read finished; facts cannot be guessed.
5. **The false-caption rule.** A photograph may only appear under a project it actually
   depicts, confirmed by the operator — not inferred from a filename or by elimination.
   One project's photo under another project's title is the one mistake this site was built
   to never make. When a mapping is ambiguous, ask; don't infer-and-publish.
6. **The contact form is deliberately inert** (`SEND = null` in `web/js/contact-form.js`,
   with a documented seam for a real handler). Known, intentional, not "temp stuff" — don't
   fix it, don't flag it.
7. **`web/fonts/OFL.txt` must ship with the fonts** (OFL 1.1 clause 2) and **`web/CNAME`
   must stay** (it binds the custom domain). Any deploy change that could drop either is a
   bug. `THIRD-PARTY-NOTICES.md` has the licence reasoning; no `LICENSE` file is deliberate
   (all rights reserved) — do not add one.
8. **Claims match reality.** No numbers, client names, or credentials print anywhere unless
   the operator cleared them; cut copy is cut, not pending (see the "NUMBERS ARE CUT" comments).
   When the site's state changes, update the HTML comments that describe it — a stale comment
   misleads the next editor as surely as stale copy misleads a reader.

## History and boundaries

Split from a private internal repo on 2026-08-20 so the public site needs no access to
the private work. **Never copy content from that repo into this one** beyond what already
lives here — this repo is public. Design-process material (rejected candidates, raw photo
deliverables) stays in the private repo's `design/` tree; only publish-ready assets belong
in `web/img/`.

## Roles

`.claude/agents/` carries two seats: the **art-director** (brand law, palette doctrine,
composition taste — produces renders, never descriptions) and the **ux-engineer**
(IA, interaction, accessibility, the front-end build — ships browser-verified code).
Use them for their kind of work; the descriptions say when.

## Verifying visually

Screenshot headless (any Chromium: `chromium --headless --no-sandbox --screenshot=out.png
--window-size=1280,2600 "file://$PWD/web/work.html"`) and LOOK at the result before calling
visual work done. The checks catch contrast and overflow; they cannot catch ugly or wrong.
