# intrnls.com — review handoff

**For:** David, and whoever helps him review this.
**From:** Matthew's session, 2026-08-16.
**What this is:** the intrnls marketing site, built to a skeleton and filled with copy deck v1.1.

---

## The ask

**Three things, in priority order:**

1. **Light copy edits** — word-level. Swap a term, fix a phrase that reads wrong, cut a sentence
   that overclaims. *Example: if "studio" should be "company" throughout, say so.*
2. **Imagery** — tell us what photograph goes in each empty image slot, or point us at files.
3. **Examples and facts** — the blanks. Contact details, the project examples, the numbers. There's
   a fill-in list below; typing straight into it is the most useful thing you can do.

**Please send changes back rather than making them.** Not territorial — practical. The site has
automated checks, a shared header/footer used by all six pages, and deliberately-empty slots that
look like bugs and aren't. An edit that seems local can break something two files away. **Tell us
what to change and we'll do it in minutes.** If it's a genuine one-word typo you'd rather just fix,
see [Fixing something yourself](#if-you-do-want-to-edit-something).

**What we're not asking for:** a redesign, a restructure, or a line-by-line audit. The layout and
the page structure are settled. If something structural is genuinely wrong, say so in a sentence —
but it isn't what we need from this pass.

> ⚠ **One thing to know before you swap a word.** The copywriters set a deliberate voice rule:
> *"studio", never "vendor" or "service provider"* — so "studio" is a choice, not an accident.
> Changing it to "company" is completely fine, it's just a **decision** rather than a typo fix, and
> it lands in about a dozen places. Same for any other term that recurs. Flag it and we'll change
> it everywhere consistently.

---

## How to look at it

No install, no build step, no server, no dependencies.

```bash
unzip intrnls-site-v1.1.zip && open web/index.html
```

Any browser. Everything is a plain file on disk. The fonts are bundled, so it looks right offline.

**Six pages:** `index.html` (Home) → `what-we-do.html` → `work.html` → `about.html` →
`contact.html`, plus `work/_case-study-template.html`.

**Work is in the navigation and is deliberately thin.** Its three project cards are empty pending
partner clearance, and the page says as much: *"Almost everything we do is under agreement, so this
page is short and will stay that way."* It was briefly hidden from the nav, but hiding one door
while the hero, the footer and a Home section all still linked to it wasn't concealment, it was
inconsistency. Showing it and owning it is the deliberate choice.

---

## What is deliberately not finished

This is the part most likely to generate review comments we already know about, so please read it
before writing any of them down.

**The empty dashed chips are not broken.** Every one is a reserved slot holding a place for a fact
we don't have yet or can't publish yet. They are visibly empty *by design*: the rule we built to is
that nothing on the page may be a claim we can't stand behind, so a missing fact stays visibly
missing rather than getting a plausible stand-in.

**Every one of them is itemised in [the fill-in list](#the-fill-in-list) below** — that's the same
set of blanks, laid out so you can answer them.

**The three Work cards are empty for a different and more important reason.** The copy deck drafts
sector descriptions — direct air capture, consumer electronics, defense — and marks every one
*pending partner clearance*. That text is parked in HTML comments beside each card and **must not
be published until a partner clears it.** One of the automated checks fails if it ever reaches a
rendered page. Please don't un-comment it, even to see how it looks.

**The contact form doesn't send anything.** That's deliberate and the page says so on its face. It
validates, shows errors properly, and stops. There's a single commented seam where a real handler
goes.

---

## Things we already know, so you don't need to report them

- **The About bios repeat the name.** The card prints "Matthew Pearlson / CO-FOUNDER" and the bio
  then opens "Matthew Pearlson, co-founder." Left as the copy team wrote it; deleting the leading
  clause is their call.
- **Work's three cards are empty.** Known and deliberate — see above. Not a bug to report.
- **Two copy gaps are flagged in the source, not guessed at**: a section label on What We Do that
  still says "Shapes", and an eyebrow on Contact still reading "Start a project" after that phrase
  was retired everywhere else. Both need one word from the copywriter.
- **The `$30M` figure in Matthew's bio** is his own number; the copy deck notes LinkedIn says
  "multi-million". Shipped as written, flagged as the one line a stranger could challenge.
- **Only Chromium has been tested.** Safari and Firefox are genuinely unverified — the automated
  checks drive Chromium, so they cannot see a Safari-only bug either. **If you open it in Safari or
  Firefox and something looks wrong, that is a real finding and we'd genuinely like it.** It's the
  one gap where five minutes of your time buys something we can't get ourselves.

---

## The fill-in list

**This is the most useful thing you can do.** Type answers inline — a phrase is plenty, "don't
know yet" and "skip" are both real answers, and anything you leave blank simply stays reserved.

Every one of these is currently an empty dashed chip on the live pages.

### Contact details — fill once, appears everywhere

These live in one shared footer, so **answering once fills all six pages.**

```
Email .....................
Phone .....................
Location (city/state) .....
Social link 1 (name + URL)
Social link 2 (name + URL)
```

The Contact page also shows a fuller block:

```
Street address ............
Opening hours .............
```

### Commitments — these print as promises, so only fill what's true

```
Response time (e.g. "We reply within two business days")
    ....................................................
Minimum engagement (e.g. "Engagements start at ...")
    ....................................................
Engagements at once (e.g. "Three at a time")
    ....................................................
Privacy line — where a contact-form message actually goes, once wired
    ....................................................
```

### The three project examples

Home and Work show the same three cards. Each needs four things, and **each needs partner clearance
before it can be published** — drafts exist for direct air capture, consumer electronics and defense
but none is cleared.

```
PROJECT 1   Sector ........  Year ....
            Title (~40 chars) .........................
            Summary (~90 chars) .......................
            Cleared to publish?  yes / no / ask <who>

PROJECT 2   Sector ........  Year ....
            Title .....................................
            Summary ...................................
            Cleared to publish?  yes / no / ask <who>

PROJECT 3   Sector ........  Year ....
            Title .....................................
            Summary ...................................
            Cleared to publish?  yes / no / ask <who>
```

### Proof row — Home

Deliberately empty rather than filled with invented stand-ins.

```
Client mark (a logo we're allowed to show) ...
A number we can source ......................
    ... and its source ......................
A named quote, with permission ..............
```

### Imagery — what photograph goes here

Describe it, name a file, or say "need to shoot it".

```
HOME       Hero image, 16:6 — one photograph. A machine, an assembly,
           or a part in hand. Not a render.
           .................................................

           Work images, 4:3 x3 (one per project card)
           1 ........  2 ........  3 ........

WHAT WE DO Process image, 16:6 ............................

ABOUT      Studio image, 16:6 — the room where it happens
           .................................................
           Portrait, 3:4 — Matthew ........................
           Portrait, 3:4 — David ..........................

SHARED     Link-preview image (shown when the URL is pasted into
           Slack, iMessage, LinkedIn) .....................
```

### Tag chips — about twenty of them

Short labels under the capability cards on Home and What We Do — materials, processes, or
capabilities. The copy deck didn't cover these. Three to five words each, or tell us to delete them.

```
Under "Materials" ..........................
Under "Design + prototyping" ...............
Under "Pilot → commercialization" ..........
```

### Case-study template — only if you want to shape it now

Not needed until a project is cleared.

```
Client ....  Role ....  Duration ....  Result x2 ....  Named quote ....
```

---

## Beyond the blanks — if you have appetite

Genuinely optional, and only you can do these:

- **Is anything on these pages not true, or not defensible?** You know the work; we built the pages.
- **Does "Who we work with" say no in a way we're actually willing to say no?** It commits us in
  writing to turning down small jobs and insisting on the pilot.
- **Anything a technical reader would find sloppy** — a claim without a mechanism, physics stated in
  a way that would make an engineer wince.

---

## There are automated checks — please run them if you touch anything

```bash
python3 web/check.py
```

No arguments, about six seconds. The only requirements are **Python 3 and a Chromium-family browser
you almost certainly already have** — Chrome, Chromium, Edge or Brave all work, and it looks in the
usual install locations on macOS, Windows and Linux. If it can't find yours:

```bash
python3 web/check.py --chromium "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Nothing to install, no npm, no pip. Exit code 0 means pass. Seven checks:

| # | Check | Catches |
|---|---|---|
| 1 | Palette | any raw colour that isn't a brand token |
| 2 | Include drift | a shared header/footer edited in one page instead of the source |
| 3 | Contrast | any text that fails WCAG AA, on both light and dark grounds |
| 4 | Overflow | sideways scrolling at any width from 320 to 2560px |
| 5 | Structure | duplicate `h1`, extra gradient, extra green action, heading-level jumps |
| 6 | References | **any broken link, anchor or ARIA reference** |
| 7 | Reserved | a placeholder marker or un-cleared draft that reached a real page |

**Check 6 is the one that matters most for the kind of edit you're likely to make.** Rename a
section heading and the links pointing at it break silently — this catches that immediately. It
already caught exactly that mistake once during the build.

**You can confirm the checks actually work** rather than taking our word for it:

```bash
python3 web/check.py --self-test
```

That copies the site, breaks it fifteen different ways, and requires every single break to be
caught and named. It's there because a check that passes by looking at nothing is worse than no
check at all.

**If the browser can't be found, the run exits non-zero and says so** rather than quietly passing
the five checks that don't need it. A partial run never prints green.

**What the checks do NOT cover**, stated plainly so nobody trusts them further than they go:
keyboard and interaction paths, browsers other than Chromium, visual regression, and hover/focus
contrast. And **no check can tell you whether the copy is true** — that's the review we're asking
you for.

---

## If you *do* want to edit something

Fine for a typo. Two rules:

1. **Never edit the header or footer inside a page.** They're generated from
   `web/_include/header.html` and `web/_include/footer.html` into all six pages. Edit the include,
   then run `python3 web/_include/sync.py` to push it out. Check 2 fails if you edit in place.
2. **Run `python3 web/check.py` before sending it back.** If it fails, the message names the file,
   the line and the element.

Everything else lives where you'd expect: page text in the six `.html` files, all styling in
`web/css/site.css`. Do not edit `web/css/tokens.css` — it's a synced copy of the brand palette and
gets overwritten.

**Don't reformat, re-indent, or run a formatter over the files.** It turns a two-line change into
an unreviewable diff.

---

## Sending changes back

**Easiest by far: type into [the fill-in list](#the-fill-in-list) and send this file back.** It's a
plain text file — open it in anything, fill in what you know, leave the rest. That alone unblocks
most of what's outstanding.

For copy edits and everything else, whatever's easiest — a list in an email, marked-up screenshots,
comments. Quoting the sentence you want changed is plenty; we can find it.

If you'd rather work in git: branch `claude/intrnls-website-skeleton-kunfud` in
`printfoam/printer-hacking`, everything under `web/`. Please don't push to that branch directly —
open a pull request or send a patch, so the checks run and we can see the change.

---

## One thing that needs a decision, not a review

**Where does this get hosted?**

It's a static folder, so it can go on Netlify, Cloudflare Pages or GitHub Pages as-is, free, with
the domain pointed at it.

The complication is Squarespace. There is **no Squarespace integration available to us** — no
connector exists — so nothing here can be published to Squarespace automatically. The one path that
would let this repo drive a Squarespace site is Developer Mode, and **that is Squarespace 7.0 only;
7.1 has no template-level code access.** Worth someone checking which version intrnls.com is on:
open **Design** in the Squarespace admin — if you can swap templates it's 7.0, if not it's 7.1.

If it's 7.1, putting this design into Squarespace means rebuilding it inside their editor and
losing most of what's described above.

**One hosting note that isn't optional.** The Poppins font files are under the SIL Open Font
License, which requires the licence to travel with them. `web/fonts/OFL.txt` must ship alongside
the fonts. Copying the folder handles it; a build that only emits referenced files would silently
drop it. It's 4 KB. There's a comment at the top of `site.css` saying so, and the reasoning is in
`THIRD-PARTY-NOTICES.md`.

---

## Reference

- `web/README.md` — the full design spec and build notes. §14 documents the checks; §13 is the
  copy-deck landing and the complete punch list of what's still reserved.
- `design/web-skeleton/*.png` — every page rendered at desktop and mobile, plus the contact-form
  states.
