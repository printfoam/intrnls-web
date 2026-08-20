# intrnls.com — art direction for the skeleton site

**Status:** v0.1 skeleton. `index.html` is the **reference page** — every other page is built to
match it. Copy is placeholder and is written by a separate session; what is being approved here is
the visual system, not the words.

**Canon:** `brand/tokens.css` (synced verbatim to `web/css/tokens.css`) + the intrnls.com hero.
Anything else is a claim to check against those. `web/css/site.css` declares **no palette** — every
colour resolves to a token variable, and derived values use `color-mix()` over tokens only.

```
grep -nE "#[0-9a-fA-F]{3,8}" web/css/site.css      # must print nothing
```

Renders: `design/web-skeleton/home-desktop-1440.png`, `home-mobile-390.png`,
`home-desktop-fold.png`, `home-a11y-states.png`.

---

## 1. The page set

Home · What We Do · Work · About · Contact. **Keep it** — five is right for a skeleton.

Two notes, because the set has one real weakness:

- **What We Do and Work collide unless you hold the line:** *What We Do = what we can do for you*
  (capability, process, how an engagement runs). *Work = proof of having done it* (projects). If a
  sentence could live on either page, it belongs on What We Do.
- **Work is the page that can embarrass us.** Three empty project cards read worse than no page at
  all. The original recommendation was: don't ship `/work` until there are three publishable pieces,
  and until then drop it from the nav.
  **OVERTURNED by operator decision, 2026-08-16 — Work is in the nav.** The reason is worth keeping:
  hiding it from the nav *alone* was incoherent, because the Home hero (`See the work`), the Home
  section link (`All work`) and the footer on all six pages still pointed at it, and Home previews
  the same three empty cards. It was hidden from one door out of four. The choice was consistency or
  concealment, and half-concealment is the one option that is simply wrong.
  It also turned out the copy carries it: *"Almost everything we do is under agreement, so this page
  is short and will stay that way"* reads as discretion, not as an unfinished page.

**Nav order at launch:** What we do · Work · About · **Contact** (bordered, not filled).
Flip to **Work first** the day there are three or more pieces — a studio that leads with work is
more confident, and the order change is a one-line edit.

**Home is not in the nav.** The wordmark is the home link. Four items plus a CTA is already the
maximum a header should carry.

---

## 2. Ground per page — and the rule behind it

> **Lab (black) is for impression and assertion. Cashmere (white) is for reading and looking.**

| Page | Ground | Why |
|---|---|---|
| **Home** | **Lab** | The one impression we get. The gradient and the acid green only detonate on black; on white the same page is a competent studio site instead of ours. |
| What We Do | Cashmere | The longest-copy page on the site. Sustained reading wants the light ground. |
| Work (index + case study) | Cashmere | Photographs and captions. White is a gallery wall; black fights every product shot that isn't lit for it. |
| About | Lab | An assertion of stance, and portraits are dramatic on black. |
| Contact | Lab | Short, one focal point (the form). Form fields on black with a green focus ring are also exactly what the cockpit looks like — the marketing site and the tools shake hands here. |

Journey: **dark → light → light → dark → dark.** You arrive dark, go light to learn and look,
come back dark to commit. That arc is the point; don't shuffle it for variety.

**The alternative I rejected:** an all-Lab site. More aggressive, and Matthew will like it on sight
— but it makes the long-copy pages harder to read and it throws away the light/dark duality that is
literally the two founders. Say the word and it's a one-attribute change per page.

### One ground flip per page — maximum

A page may contain **exactly one** full-bleed band on the opposite ground, and only where it earns
it. On Home that is the **Work teaser** (`<section data-ground="cashmere">`), which both serves the
photography and gives a long black page its breath. Two flips and the page reads as stripes.

---

## 3. The one gradient moment

**Rule: ONE gradient moment per page — at most.** Usually that is a `.grad` phrase of one to
three words inside the `h1`; on a case study it's the project title.

⚠ **The moment is not always text (amended 2026-08-20).** An image can *be* the gradient, and when
it is, gradient text on top of it is the second moment — precisely what this rule exists to
prevent. So `check.py` enforces **at most one**, not exactly one: zero is legal when an image
spends the moment, two is never legal. What no checker can judge is a page with *no* focal moment
— that stays with whoever reviews it.

**Home is no longer the example of that, and the reversal is the point (2026-08-20).** Home briefly
ran a saturated magenta→orange hero and its `h1` gave up its `.grad` for the day, because two
gradients were touching. That hero was an abstract *render* — which the brief for this slot rules
out — and it has been replaced by a real photograph: a shaft coupling and bearing stack on the
bench, cool greys and silver, one blue panel, a green board. It does not compete with gradient type
at all, so **the moment went back to the `h1`** on *"on the inside"*, and Home carries exactly one
`.grad` again. The rule outlived its example, which is the test of a rule.

- The **1px gradient rule under the header is chrome, not the moment.** It is the same signature the
  cockpit surfaces use, so the site and the tools read as one company. It never gets thicker.
- **Never gradient at body size.** The crimson tail is ~3.6:1 on black — legal for large text
  (≥24px, or ≥18.66px bold), not for a paragraph. Display sizes only.
- The CTA band is the second-loudest thing on the page and it uses **acid green, not gradient**,
  precisely because the hero already spent the moment.

**Acid green** is reserved for **primary action and "go"**. On Home it is filled exactly twice —
hero and CTA band — and both are the same action. The header Contact button is deliberately
*outlined*, so the hero button stays the hottest thing on screen.

---

## 4. Type

Stack: **Cera Pro → Poppins → system-ui**. Poppins is **self-hosted** in `web/fonts/`
(latin subset, weights 400/500/600/700/800, ~8 KB each) — **no CDN call, works offline**. When the
licensed Cera Pro files land, drop them in the same folder and add `@font-face` blocks *above* the
Poppins ones; the stack already prefers Cera.

Mono (`--intrnls-font-mono`) is the technical voice: eyebrows, indices, metadata, slot labels,
the footer rule. Always uppercase, always `letter-spacing:.18em`. **No Calibri, ever.**

| Token | Value | Use |
|---|---|---|
| `--t-h1` | `clamp(2.625rem, 6.6vw, 5.25rem)` / lh .96 / ls −.035em / 800 | one per page |
| `--t-h2` | `clamp(2rem, 4.2vw, 3.25rem)` / lh 1.04 / ls −.028em / 800 | section headings |
| `--t-h3` | `clamp(1.25rem, 1.6vw, 1.4375rem)` / lh 1.25 / 700 | card + item titles |
| `--t-lede` | `clamp(1.125rem, 1.55vw, 1.3125rem)` / lh 1.55 | standfirst, CTA body |
| `--t-body` | `1.0625rem` / lh 1.65 | running copy |
| `--t-sm` | `.8125rem` | card body, captions, controls |
| `--t-mono` | `.6875rem` + .18em, uppercase | eyebrows, meta, slot labels |

Measure caps at `--measure: 62ch`; standfirsts at 48ch; section decks at 48ch.

**Type sizing is in `rem` with no `px` font-size on `<html>`** — browser zoom and the reader's own
default size both work. That is the text-size control on a marketing site; the bespoke A-/A/A+
widget belongs on tool surfaces, not here. Don't add one.

---

## 5. Spacing, grid, rhythm

- Scale: `--s1…--s10` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px. Use the scale; don't
  invent a 37.
- Content band: `--container: 1200px`, inline padding `clamp(1.25rem, 5vw, 3.5rem)`.
- Vertical rhythm: `--section-y: clamp(4rem, 9vw, 8rem)` top and bottom on every `.band`.
- Radii: `--r-sm .5rem` (controls) · `--r-md .75rem` (asset slots) · `--r-lg 1.125rem` (cards, bands).
- **Section rhythm is always the same four beats:** hairline rule → mono eyebrow → `h2` →
  optional one-line deck; the "see all" link sits top-right on the eyebrow line. Every section on
  every page. The repetition is the rhythm — don't decorate individual sections to differentiate them.
- Breakpoints: **940px** (3-up → 2-up) · **720px** (→ 1-up, nav collapses to a Menu button) ·
  **400px** (hero actions stack full-width). Verified no horizontal scroll from 320 → 2560px.

---

## 6. Component inventory

Everything below already exists in `site.css` and is proven on Home. Build the other four pages out
of these; if a page needs a component that isn't here, it needs a conversation first.

| Component | Class | Notes |
|---|---|---|
| Skip link | `.skip` | First in tab order, ahead of the logo. |
| Header / nav | `.site-head` `.head-bar` `.brand` `.nav` `.nav-toggle` | Sticky, blurred, 1px gradient rule beneath. Active item = colour **+** underline **+** `aria-current`. |
| Hero | `.hero` `.hero-foot` `.hero-actions` | `h1` full width; standfirst and actions sit either side of a hairline. |
| Section header | `.sec-head` `.kicker` `.h2` `.deck` `.sec-more` | The four beats above. |
| Capability card | `.cards` `.card` (`.idx` `.tags`) | Whole card is the link (stretched `::after`); ring shown via `:focus-within`. |
| Work item | `.work-grid` `.work-item` (`.shot` `.meta`) | 4:3 asset slot + mono meta + title + one line. |
| Asset / fact slot | `.slot` `.slot-tag` `.slot-note` | See §7. |
| Proof row | `.proof` `.proof-row` | Deliberately empty. See §7. |
| CTA band | `.cta` `.cta-actions` `.fineprint` | Centred, green, no gradient. |
| Footer | `.site-foot` `.foot-grid` `.foot-rule` | **No wordmark.** See §8. |
| Buttons | `.btn-go` · `.btn-line` · `.btn-text` | One filled green per view, for the primary action only. |

---

## 7. The honesty rule for placeholders

This is a brand rule, not a build convention, and it is the thing most likely to be broken by
someone being helpful.

- **Prose placeholders read finished.** Real length, real shape, so the layout is honestly tested.
  Every one is marked `data-slot="…"` in the HTML — `grep -o 'data-slot="[^"]*"' web/index.html`
  lists the copy session's whole job.
- **Asset and fact placeholders are VISIBLY empty.** Dashed frame, diagonal hatch, mono label
  stating what belongs there and at what ratio. They must never be mistaken for design.
- **Never render an invented fact.** No stand-in client marks, no illustrative metrics, no written
  testimonials, no placeholder address or inbox. The Proof row on Home stays visibly reserved
  *specifically* so that the layout is tested and nobody screenshots a claim we can't stand behind.
  If a slot can't be filled truthfully, it ships empty or it ships not at all.

The headline copy is brand-voice wordplay that asserts nothing factual. That was deliberate —
it survives being screenshotted into a deck before the copy pass lands.

---

## 8. Discernment calls, made on purpose

- **One logo per surface.** The header wordmark is it. **The footer gets no wordmark and no brand
  heading** — the copyright line already names the company, and a second lockup on the same page is
  the duplicate-lockup mistake wearing the costume of a convention. (The favicon is browser chrome,
  not a page surface.)
- **Logo lockups are ground-specific.** The typeset wordmark is a stand-in. When the real art
  lands: **Cashmere → Artboard 3** (white strokes), **Lab → Artboard 1 with its background rect
  removed** (black strokes), **gradient grounds → Artboard 4** stacked and knocked white via
  `filter:brightness(0) invert(1)`, **mark only → Artboard 5**. Never cross them — a mismatched
  stroke shows as a fat outline.
- **Header Contact is outlined, not filled.** Protects the hero's single focal point.
- **The hero carries no artwork.** A two-column hero with an empty plate beside the headline reads
  as a page that failed to load. Type-only hero, then a full-bleed image band beneath it.
- **One focal point per view**, and on Home it is the headline. Everything else is quiet on purpose.

---

## 9. Accessibility — verified, not asserted

Checked by driving a real browser (real Tab presses, a real click, a real Escape). Evidence:
`design/web-skeleton/home-a11y-states.png`.

- `:focus-visible` — 2px solid, 3px offset, colour from `--accent` (green on Lab, magenta on
  Cashmere automatically). **One override:** the filled-green button and the skip link switch the
  ring to `--fg`, because an accent ring on an accent fill is a ring you cannot see.
- Skip link is the first tab stop and becomes visible on focus.
- Mobile menu is a real `button` with `aria-expanded`; **Escape closes it and returns focus** to it.
- `prefers-reduced-motion: reduce` collapses every transition and animation to 0.01ms.
- Contrast: every text/background pair on both grounds passes WCAG AA — worst case **6.43:1** at
  11px on Cashmere. `--label` steps up to `--fg-quiet` on Cashmere on purpose, because `--fg-muted`
  passes on black and fails at small sizes on white. **Do not demote it back.**
- No horizontal scroll 320 → 2560px. A display line must never be what makes the page scroll
  sideways: **any authored `<br>` that is hidden responsively must have a space after it** (that
  exact bug shipped in the first draft and glued two words into one unbreakable string).
- Status, wherever it appears, is **colour + glyph + label** — never colour alone.

---

## 10. Do-nots

1. No second gradient on a page. No gradient at body size. Never thicken the header's gradient rule.
2. No second ground flip on a page.
3. No raw hex and no second palette — style through `--bg` / `--fg` / `--accent` / `--gradient` /
   `--go` / `--state-*`. Derive with `color-mix()` over tokens.
4. **No cyan (`#22F0FF`) and no amber (`#FFB515`).** Wherever cyan used to mean "electric/alive",
   acid green does now.
5. Don't edit `web/css/tokens.css` — re-sync it from `brand/tokens.css`.
6. No webfont CDN. Self-host, or the site breaks offline and leaks a request.
7. No filled-green button that isn't the primary action; never two on one screen doing different things.
8. No wordmark in the footer. No second logo anywhere on a surface.
9. No invented facts in any slot, not even for one screenshot.
10. No horizontal scroll in the chrome; the nav collapses, it never scrolls sideways.
11. No theme/ground toggle on the marketing site — the ground is an art-direction decision per page,
    not a user preference. (Tool surfaces are the opposite; that's fine.)
12. No icon-only nav — glyph **and** label, always.

---

## 11. Left for the ux-engineer

Deliberately not built, because they're implementation decisions or need content that doesn't exist:

- **The other four pages.** Grounds are assigned in §2; every component they need is in §6.
- **A real page shell / include.** Header, footer and the `<head>` block are duplicated by hand
  right now. Factor them however the eventual host wants (static include, SSG partial, component) —
  but **one source for the header**, since the last time this project shipped a nav it grew into
  seven of them (`design/reviews/cohesion-review-2026-07-23.md`).
- **The contact form.** Fields, validation, error and success states. Error state must be
  colour + glyph + label, and errors must be programmatically associated with their field.
- **Work case-study template** — I've specified the index card, not the detail page.
- **Image pipeline** — every `.slot` becomes a `<picture>` with real dimensions, `loading="lazy"`
  below the fold, and honest `alt` text. Hold the ratios (16:6 hero, 4:3 work card).
- **`prefers-color-scheme`** — currently ignored on purpose; ground is authored, not sniffed. If
  we ever want to honour it, that's a brand decision, not a CSS one. Ask first.
- **Metadata:** page titles, meta descriptions, Open Graph image, sitemap. The OG image is an
  art-direction job — flag it to me, don't improvise one.

---

## 12. Built out — the other four pages, the shell, the form  *(ux-engineer, 2026-08-15)*

§11 is now built. This section is the handover: how the site is put together, what is new, what
needs the art director's eye, and what was verified rather than asserted.

### 12.1 The page set as shipped

| File | Ground | Gradient moment | Filled green | Opposite-ground band |
|---|---|---|---|---|
| `index.html` | Lab | *on the inside* | hero + CTA (as approved) | Work teaser (Cashmere) |
| `what-we-do.html` | Cashmere | *one way through* | CTA only | CTA band (Lab) |
| `work.html` | Cashmere | *not promises* | CTA only | CTA band (Lab) |
| `work/_case-study-template.html` | Cashmere | project title | CTA only | CTA band (Lab) |
| `about.html` | Lab | *made of* | CTA only | "How we work" (Cashmere) |
| `contact.html` | Lab | *inside* | the Send button | none |

**Work is not in the header nav** (§1's recommendation). It is reachable from the footer and the
Home teaser, so it is not orphaned. To advertise it: uncomment one line in
`web/_include/header.html` and run `sync.py`.

**Interior pages spend their filled green once, on the closing CTA**, not in the hero — the hero
gets a `.btn-line`. Home keeps its approved two.

### 12.2 The include: `web/_include/` + `sync.py`

One source for the header, and still plain static HTML with no build step, no npm, no bundler:

```
python3 web/_include/sync.py            # push the partials into every page
python3 web/_include/sync.py --check    # exit 1 if any page has drifted — run before a PR
```

- Sources: `_include/header.html`, `_include/footer.html`, `_include/head-common.html`.
- Pages carry `<!-- @include:header nav=about -->` … `<!-- /@include:header -->`; the script
  rewrites what is **between** the markers, in place.
- **The pages in git are the pages that ship.** Nothing is generated at deploy time; the site is
  still a folder you can copy to a host or open from disk. The script is a maintenance tool, not a
  build step. (Chosen over a JS `fetch()` include, which breaks `file://` and puts the nav behind
  scripting, and over an SSG, which the brief ruled out.)
- `{{ROOT}}` in a partial becomes `""` at the web root and `"../"` in `web/work/` — so links stay
  relative and every page opens from disk.
- `nav=KEY` marks the matching link `aria-current="page"`; the visible state is colour **+**
  underline, keyed off that attribute.
- Anything under `_include/` is source, not a published page.

**Adding a page:** copy the `<head>` block and the two marker pairs from any page, set
`data-ground`, write the body, run `sync.py`. Add it to `_include/header.html` only if it belongs
in the nav.

### 12.3 New components — flagged, because §6 says a new one needs a conversation

Four, all in `site.css` §14–15, all layout/state only, all colour resolving to tokens:

- **`.split`** — mono label column + prose column. The long-copy workhorse (What We Do's
  capabilities, About's stance, every case-study section). §6 had no two-column content grid.
- **`.factsheet`** — the `dl` for case-study role/duration/disciplines and Contact's details.
- **`.notice`** — an editorial aside that is true *about the artefact* ("this page is a template",
  "this form is not connected"). Never a place to park a claim about a client.
- **The form** (`.form`, `.field`, `.input`, `.field-err`, `.err-summary`) — assigned in §11.

Plus small extensions: `.duo` (two equal content columns), `.gallery`, `.crumbs`, `.pager`,
`.cards[data-cols="4"|"2"]`, extra plate ratios `.shot-wide` / `.shot-portrait` / `.shot-square`,
and two spacing utilities (`.gap-top`, `.gap-bottom`) so no page carries an inline style.

**`.tags`, `.meta` and `.shot` were unscoped** from `.card` / `.work-item`. `.shot` was a genuine
bug: the same markup in a case-study gallery collapsed to a content-height strip because the 4:3
ratio was scoped to `.work-item`.

### 12.4 The contact form

**Inert on purpose.** No endpoint, no mail service, no third party — verified: a full valid
submission makes **zero** network requests. The seam is one named constant, `SEND`, at the top of
`js/contact-form.js`, with the replacement written out in the comment above it. An unwired submit
ends in an honest *"This form is not connected yet"* — never a success message for something that
was never sent.

Every state is **colour + glyph + word**; errors are wired to their field with `aria-describedby`
and `aria-invalid`; the summary is `role="alert"` + `tabindex="-1"` and each item is a link to the
field that failed. Errors appear on submit and on blur, and clear the moment a field is fixed —
never raised mid-typing.

Look at all six states without submitting anything:

```
contact.html                      contact.html?state=invalid        contact.html?state=submitting
contact.html?state=success        contact.html?state=server-error   contact.html?state=unwired
```

`?state=` only ever paints; it never sends and never fakes a send.

### 12.5 Two bugs fixed in code that was already here — flagging, not sneaking

1. **`.btn-go` on a nested ground was 1.36:1.** The old rule had a `[data-ground="cashmere"]
   .btn-go` override that matched by *ancestry*, so the green button inside a Lab CTA band on a
   Cashmere page took the Cashmere fill while `--go-ink` resolved to neat acid green from the
   nearer Lab scope: white text on acid green. Now ground-scoped **variables**
   (`--go-fill` / `--go-fill-ink` / `--go-fill-hover`), which resolve from the nearest ground.
   Home is pixel-unchanged; every interior page's CTA was affected.
2. **`index.html`'s links pointed at `/what-we-do/`-style directory URLs** that resolve nowhere in
   this tree. Rewritten to the real filenames. Its chrome now comes from the include (so its nav
   lost Work, per §1), its inline script moved to `js/site.js`, and `<main>` gained `tabindex="-1"`.
   **No design change to the Home page.**

### 12.6 Judgement calls the spec didn't cover — ART DIRECTOR, these are yours to overrule

- **Headline placeholders on the four new pages** are brand-voice and assert nothing factual
  ("Three ways in, one way through", "Proof, not promises", "What we're made of"). They are still
  copy slots.
- **About's ground flip is the "How we work" band**, not the portraits — §2 says portraits are
  dramatic on black, so they stay on Lab.
- **The case-study gallery is two plates at the same ratio** so the captions line up. Swap either
  for `.shot-wide` / `.shot-portrait` and expect them to stagger.
- **A portrait plate is capped at 22rem.** Uncapped, an empty 3:4 slot is ~700px tall and becomes
  the loudest thing on the About page.
- **No filter on Work.** With three placeholder cards a discipline filter is theatre. The comment
  in `work.html` says where it goes at ~6 pieces, and it must never be the only route to a project.
- **Contact's hero carries a `.btn-text` shortcut to the form** — it fills the hero-foot's right
  column and earns its place on a phone.
- **No-JS:** the Menu button is hidden and the nav stacks open (a one-line inline script in `<head>`
  sets `.js` before first paint). A phone with scripting off gets the whole nav, not a dead control.
- **`<main tabindex="-1">`** so the skip link moves focus, not just scroll position (Safari will not
  forward focus otherwise). Chrome draws its 2px ring around `main` after a skip; it sits at the
  viewport edges and is effectively invisible. Say the word if you want it suppressed.

### 12.7 Open Graph — still yours

`og:title` / `og:description` / `og:image` are a **commented block** in
`_include/head-common.html`. The image is an art-direction job and was deliberately **not**
improvised. Nothing else is missing from `<head>`: every page has its own `<title data-slot>` and
`<meta name="description" data-slot>`.

### 12.8 Verified, not asserted

Driven with a real browser (Chromium 141, real Tab presses, a real click, a real Escape, a real
submit):

- **No horizontal scroll, 320 → 2560px**, on all six pages and in all five form states.
- **WCAG AA on every text/background pair** — measured by walking every element with direct text,
  computing the effective background and the ratio. Zero failures on six pages plus five form
  states. (The crimson error ink is lifted with white on Lab: neat crimson is 4.16:1 on black and
  fails at 13px. Do not demote it back.) Error and success states re-checked in **greyscale**.
- **Skip link is the first tab stop on every page**, becomes visible on focus, and moves focus into
  `main`.
- **Escape closes the mobile menu and returns focus** to the Menu button; `aria-expanded` tracks.
- **`prefers-reduced-motion: reduce`** collapses transitions to 0.01ms and `scroll-behavior` to auto.
- **Form:** empty submit marks three fields `aria-invalid`, shows three messages, announces a
  summary and takes focus to it; every `aria-describedby` resolves; a summary link moves focus to
  its field; a fixed field clears live; a bad email is caught on blur; a valid submit holds the
  "Sending" state for a legible minimum, then reports honestly. **Zero network requests.**
- Heading order has no jumps on any page; one `h1`, one `.grad`, one `.brand`, at most one
  opposite-ground band, and at most one filled green per page — asserted by the audit, not by eye.

Renders (`design/web-skeleton/`): `what-we-do-`, `work-`, `case-study-`, `about-`, `contact-`
`{desktop-1440,mobile-390}.png`; `contact-state-{empty,focus,invalid,submitting,success,`
`server-error,unwired}.png`; `skeleton-a11y-skiplink.png`; `skeleton-a11y-menu-open-390.png`.

### 12.9 Left undone, deliberately

- **The copy.** Every replaceable string is `data-slot="…"`:
  `grep -ro 'data-slot="[^"]*"' web/*.html web/work/*.html` is the copy session's whole job.
- **Every asset and every fact slot is still empty** — no client, no metric, no quote, no name, no
  inbox, no address, no portrait. Nothing on this site can be screenshotted as a claim.
- **The image pipeline** (§11) — `.slot` → `<picture>` — needs real files.
- **A sitemap** and the OG image.
- **Only Chromium was driven.** Safari and Firefox are UNVERIFIED here; the two places that could
  differ are the skip-link focus target (already handled with `tabindex="-1"`) and the native
  `<select>` popup.

---

## 13. Copy deck v1.1 landed  *(ux-engineer, 2026-08-16)*

Every prose slot on the site now carries final copy, verbatim from the deck. This section is the
handover: what changed beyond a fill-in, what is **still reserved** (the launch punch list), and
the judgement calls that are the copywriter's or the art director's to overrule.

### 13.1 Changes that were not a fill-in

- **Primary CTA label** is `Bring us a hard problem` on every hero button and every CTA band, all
  six pages. The header Contact button is unchanged (still `.btn-line`, still "Contact").
- **The three capability axes were renamed** — Design / Engineering / Making became **Materials**,
  **Design + prototyping**, **Pilot → commercialization**. Three things move together and must stay
  together: the Home cards, the What We Do section **ids** (`#materials`, `#design-prototyping`,
  `#pilot` — the Home hrefs point at them), and the Contact form's `kind` options and values.
- **`eng-headline` on What We Do** is *Who we work with.* (the deck marks it replaced, not kept).
- **About's name and role slots are filled** — `Matthew Pearlson` / `David Walker`, both
  `Co-founder`, as an `h3` + `.meta` rather than a reserved chip. The deck states both inside the
  bios it wrote, so they are its facts, not stand-ins; a reserved NAME chip above a bio that names
  the person reads as a bug. The portraits stay reserved. Revert is two lines.
- **The three Work cards on `index.html` and `work.html` stay reserved.** The deck drafted three
  sector descriptors and marked every one *pending partner clearance* (Open Item 4). The drafted
  text is parked in an HTML comment beside each card, clearly labelled, and **none of it prints**.
  Each card also lost its link: on `work.html` they pointed at the case-study *template*.

### 13.2 One CSS change, and why

`.cards .card .h3 { min-height: 2.5em }` above 720px. Real copy put titles of very different
lengths in one row ("Materials" beside "Pilot → commercialization"); one wrapping to two lines
dropped that card's body a line below its siblings and the row read ragged. It is a floor, not a
cap, and it is not applied at 1-up, where there is no row to align to. Nothing else in `site.css`
moved; it still declares no palette (`grep -nE "#[0-9a-fA-F]{3,8}" web/css/site.css` prints nothing).

### 13.3 STILL RESERVED — the launch punch list

Nothing below prints a value. Each is a `.slot-tag` (mono, dashed underline) or a `.slot` plate, so
it is visibly unfilled rather than mistakable for design.

| Reserved | Where | Unblocked by |
|---|---|---|
| Response time | CTA fineprint, 5 pages | a real commitment we will honour (deck Open Item 5) |
| Privacy line | Contact, under Send | wiring the form and knowing where a message goes (Open Item 6) |
| Minimum engagement · Engagements at once | What We Do, engagement column | real numbers (Open Item 5) |
| Project title ×3 · Summary line ×3 · Sector · Year | Work cards, Home + Work | **partner clearance** (Open Item 4) |
| ~~Every image plate~~ → **3 work plates + the 3 case-study plates** | Work + Home cards; case-study template | a shoot for consumer wearables, precast concrete and the burn mask (§15) |
| Client · Role · Duration · Result ×2 · Named quote | case-study template | per project, with sources |
| Tag chips | Home cards ×9, What We Do ×9, case study ×2 | **no deck entry — a real gap, not an oversight** |
| ~~OG title / description / image~~ | — | **done 2026-08-20 (§15.4)** — but the DOMAIN in the absolute URLs is still an assumption |

**`/work` does not ship until three cards are cleared** (§1 and deck Open Item 4). It is already out
of the header nav.

### 13.4 Copy gaps flagged, not guessed

Both are commented in place, one word each, and belong to the copywriter:

- **What We Do → the `Shapes` kicker** above the engagement meta column. The section is now "Who we
  work with." and the items are criteria, not shapes.
- **Contact → the `Start a project` section eyebrow.** The deck retires that phrase as the CTA verb
  site-wide but gives no replacement for an eyebrow. It is the last instance of it on the site.

Also worth a copy editor's eye: each About bio opens by repeating the name and role now printed
above it ("Matthew Pearlson, co-founder. …"). Left verbatim because the deck is final.

### 13.5 Verified, not asserted — re-run after the copy landed

Chromium 141 driven again on all six pages plus five form states: **no horizontal scroll 320 →
2560px** (13 widths); **WCAG AA on every text/background pair on both grounds**, worst case
**6.43:1**, zero failures — and the checker was mutation-tested (grey-on-black text and a 4000px
box are both caught); **one `h1`, one `.grad`, one `.brand`, at most one opposite-ground band and
at most one filled green per page**; no heading-level jumps; every `aria-describedby` /
`aria-labelledby` / `aria-controls` and every in-page anchor resolves, and every local `href`
resolves on disk; **skip link is the first tab stop**; **Escape closes the mobile menu and returns
focus**, `aria-expanded` tracking; `prefers-reduced-motion: reduce` collapses everything to 0.01ms;
every form state is **glyph + word + colour**; `sync.py --check` clean.

Two things that look like findings and are not: on `contact.html?state=…` the first Tab is not the
skip link, because the page has deliberately placed focus on the alert or the success block — which
is what a real submit does; and `home-a11y-states.png` was rebuilt from fresh captures because the
shipped plate showed the retired CTA label and a nav item that no longer exists.

**Renders in `design/web-skeleton/` are all post-copy** except nothing — every PNG was regenerated,
plus `contact-state-kind-select.png`, which evidences the renamed select options (the native popup
cannot be screenshotted). Safari and Firefox remain UNVERIFIED.

### 13.6 Operator answers applied — and one copy rule OVERTURNED  *(ux-engineer, 2026-08-19)*

From the settled part of `web/INTAKE-worksheet.md`. Everything else on that sheet — project
cards, images, response time, minimum engagement, engagements-at-once, the privacy line — is
still open and still reserved.

**⚠ "studio" is retired. The word is "company". Do not restore it.**
Copy deck v1.1 set a deliberate voice rule — *"studio", never "vendor" or "service provider"*
(worksheet 0.2, §13 above). **Matthew overruled it on 2026-08-19**: change to "company". That is
the operator's call on his own company's name for itself, so it outranks the deck. A future
session that finds "company" in the prose and reaches for the deck's rule is reading a rule that
has been overturned — leave it. Twelve sources changed (one of them the shared footer, which
prints on all six pages).

Two families of "studio" were **deliberately left**, because neither is the site's voice:

- **The About image slot** — `aria-label="…studio photograph…"`, the `Studio image · 16:6 · slot`
  chip, its slot-note, and `studio-about.jpg` in `img/README.md`. These NAME an asset and brief a
  photographer about a room; renaming the file would desync the asset list from the slot for no
  gain, and the chips are deleted at launch anyway.
- **What We Do's slot-note** — *"a stock workshop reads as a stock studio"* is the stock-photo
  idiom, not us describing ourselves.

Two lines the swap costs something, and both are the copywriter's — left verbatim rather than
rewritten, because a replacement would be invented copy:

- What We Do → *"We're a company, not a bureau."* The original leaned on studio-vs-bureau.
- Home hero standfirst → *"We are a small **company** … the kind a leading **company** has already
  tried to solve"*. The echo is new; the second "company" is the client, and was always there.
`<dt>Studio</dt>` on the Contact factsheet became `<dt>Address</dt>` — "Company" over a street
address reads wrong, and the `dd` under it was always the address.

**Facts now printing** (were reserved in §13.3, rows removed):

| Fact | Value | Where |
|---|---|---|
| Email | `contact@intrnls.com` | footer ×6 + Contact factsheet, real `mailto:` |
| Phone | `+1 414-245-2774` | same, real `tel:+14142452774` — E.164 in the href, his formatting on screen |
| Location | `Wales, WI` | footer ×6 |
| Address | `230 James St. Suite C, Wales, WI 53183` | Contact factsheet, full row |

**Removed outright — not deferred, not reserved:**

- **Social ×2 and the whole "Elsewhere" column.** No accounts given, so the heading went with the
  slots and `.foot-grid` is **three** columns (`1.4fr repeat(2,1fr)`), not four with a hole.
- **Hours**, on the operator's word. The factsheet is three facts; `.fact-wide` gives the street
  address the full row so nothing sits beside an empty cell.
- **Home's Proof row** — heading, paragraph and all three chips. Work band now meets the CTA band
  directly; both are `.band`, so the padding and the hairline between sections are what they
  always were. `.proof*` **stays in `site.css`** — the case study's Results row still uses it.

`.foot-grid li` now carries the size/colour that was on `.foot-grid li a`, because that column
mixes two links with one plain line and they must set the same. `check.py` passes 7/7, and Home,
About and Contact were re-rendered at 1440 and 390 into `design/web-skeleton/`.

---

## 14. Checks — `web/check.py`  *(ux-engineer, 2026-08-16)*

Everything §13.5 claims was verified by hand, in a script that was thrown away afterwards. This
section is that verification turned into something you can run. **If you change this site, run
this before you push.**

```bash
python3 web/check.py
```

No arguments, no install, no `npm`, no `pip`. Standard library plus any Chromium-family browser —
Chrome, Chromium, Edge or Brave. Discovery is **cross-platform on purpose**, because this file gets
handed to reviewers who are not on this container: it checks the usual install locations on macOS
(`/Applications/…`), Windows (`C:\Program Files\…`, including the `/mnt/c/…` forms for WSL and Git
Bash), and Linux, then `$PATH`. Override with `--chromium PATH` or the `CHROMIUM` env var. It works
from any directory and finds the site relative to itself.

⚠ **A Linux-only search list was the original bug here.** On a reviewer's Mac it found nothing, both
browser checks reported NOT RUN, and the run exited 2 — which reads as *"the site is broken"* when
the truth is *"the checker cannot see."* A bad `--chromium` path also raised a raw `subprocess`
traceback instead of a diagnosis. Both fixed; the failure text now names the fix rather than dumping
every path it tried or an internal variable name.

**Exit status is the answer.** `0` everything ran and passed · `1` a check ran and failed · `2` a
check could not run. There is no fourth state, and in particular there is no "passed the bits it
could manage".

### 14.1 What each check covers

| # | Check | What it means | Needs a browser |
|---|---|---|---|
| 1 | **palette** | Zero raw hex in `css/site.css`. Style through `--bg` / `--fg` / `--accent` / `--go`, or derive with `color-mix()` over a token. `tokens.css` is exempt — it *is* the palette (§10.3). | no |
| 2 | **include** | No chrome drift: wraps `_include/sync.py --check`, so a header edited in one page and not the partial is caught (§12.2). | no |
| 3 | **contrast** | WCAG AA on **every element with direct text**, on both grounds, all six pages — real computed colours, the effective background composited through transparent ancestors, and the large-text threshold applied by actual font size and weight. | **yes** |
| 4 | **overflow** | No horizontal scroll at 320, 360, 390, 414, 640, 720, 768, 940, 1024, 1280, 1440, 1920, 2560px. On a failure it names the outermost element that sticks out (§9). | **yes** |
| 5 | **structure** | Per page: exactly one `h1`, one `.grad` gradient moment, one `.brand`; at most one opposite-ground band (§2); at most one filled-green **action**; no heading-level jumps. | no |
| 6 | **refs** | Every local `href`/`src` resolves on disk, every in-page anchor has its id, **every cross-page fragment exists in the file it points at**, and every `aria-describedby` / `aria-labelledby` / `aria-controls` / `label[for]` resolves. Root-absolute paths are a failure — this site must open from disk. | no (also re-runs live) |
| 7 | **reserved** | No `[[marker]]` reaches rendered text, and none of the Work-card copy parked in a comment awaiting partner clearance is printing (§13.1, deck Open Item 4). | no (also re-runs live) |

Two notes on judgement calls baked into check 5:

- **"one filled-green action", not "one filled-green button".** Home fills green twice — hero and
  CTA band — and §3 allows that because both are *the same action*. The check dedupes `.btn-go` by
  destination and label, which is what do-not #7 is actually about: never two on one screen doing
  **different** things. Add a filled-green "Download the deck" beside the CTA and it fails.
- Checks 6 and 7 run **twice** where a browser is available: once over the authored HTML, once over
  the live DOM. The second pass catches an id or a string that only exists after script runs.

### 14.2 When one fails

The report names the check, the file, the element (with its source line for the static checks) and
what is wrong. In order of how often you will see them:

- **refs** — you renamed a section id and something still points at the old one. Fix the pointer or
  put the id back. This is the check most likely to catch you, because Home links into What We Do's
  `#materials` / `#design-prototyping` / `#pilot`.
- **include** — run `python3 web/_include/sync.py`. If the change belongs everywhere, make it in
  `web/_include/` first; the page block is overwritten, never the source.
- **palette** — the line is printed. Replace the hex with the token that means it.
- **contrast** — the ratio, the requirement, the size and the weight are all printed. Step the ink
  up a token (`--fg-muted` → `--fg-quiet` → `--fg`); do not invent a colour.
- **structure / reserved** — read the rule in §2, §3 or §13.3 before you "fix" it. These usually
  mean the page gained something it should not have, not that the check is wrong.

**Do not make a check pass by deleting it.** If a check is genuinely wrong, say so in the PR.

### 14.3 Proving the checker can fail

```bash
python3 web/check.py --self-test
```

A check that passes because it found nothing to look at is worse than no check at all. `--self-test`
copies the site to a temp directory, breaks it **fifteen** different ways — raw hex, a drifted
include block, grey-on-black text, a 4000px box, a duplicate `h1`, a second gradient, a second
ground band, a heading jump, a second filled-green action, a dangling anchor, a dangling file href,
a renamed cross-page fragment, a dangling `aria-describedby`, a leaked `[[marker]]`, and an
un-cleared Work-card draft printed to the page — and fails unless **every one** is caught and named.
It restores the copy and deletes it. It takes about four seconds. Run it after you touch `check.py`.

If Chromium is missing, the two browser mutations report **BROKEN**, not MISSED, and the self-test
exits non-zero: it will not tell you a check is sound when it never got to try it.

The ordinary run helps here too — it prints *how much* each check looked at (element counts,
per-ground counts, widths swept, references resolved). **A number that quietly drops is the thing
to notice.** At the time of writing: 425 elements with direct text measured (cashmere 234, lab 191),
78 width measurements, 101 local href/src, 11 anchors, 43 aria references, 12 parked draft phrases
confirmed un-printed.

### 14.4 What it does NOT cover — read this before you trust a green run

- **One browser.** Chromium only. Safari and Firefox are still UNVERIFIED (§12.9), and a passing
  run says nothing about either.
- **No visual regression.** Nothing compares against the renders in `design/web-skeleton/`. The
  page can pass every check and look broken; layout, rhythm, crop and type colour are still a human
  looking at the screen.
- **No check can tell you whether the copy is TRUE.** Check 7 proves that un-cleared text is not
  printing. It cannot know whether a *cleared* sentence is accurate, whether a metric is real, or
  whether we can honour a response time we advertise. Every fact on this site is still §7's problem
  and a human's signature.
- **Keyboard and interaction paths are not automated.** Skip link as first tab stop, Escape closing
  the mobile menu and returning focus, `prefers-reduced-motion`, and the five contact-form states
  were all driven by hand (§12.8, §13.5) and are **not** in this harness. Re-drive them by hand when
  you touch the header, the form or `site.js`.
- **Contrast is measured at 1440px**, on the default state of each page. A colour that only appears
  on hover, on focus, or inside a form error state is not measured.
- **Gradient text is skipped by check 3** — it paints through its background and has no foreground
  colour to measure. It is governed by the display-size rule in §3 instead, which is a human's job.
- **Six pages, no form states.** `contact.html?state=…` is not visited.

### 14.5 One correction to §13.5

§13.5 reports the worst text/background pair as **6.43:1**. That is the true figure for `--fg-quiet`
on pure white — but it is not the site's worst pair. `check.py` measures the worst as **5.81:1**:
the same `--fg-quiet` ink on the `#F3F3F3` panel surface, at 13px on Cashmere. It passes AA (needs
4.5:1) with room, so nothing on the site is wrong — but the number in §13.5 is the worst pair the
hand-run happened to look at, not the worst pair that exists. The committed checker now prints the
real one on every run, which is the reason to have a committed checker.

---

## 15. Real photography wired in  *(ux-engineer, 2026-08-20)*

Nine files landed in `web/img/`, already cropped to the exact slot ratios. Six of them are on the
site. This section says where each one went, what it is, and — more usefully — **what is still
missing and why nothing was moved around to hide it.**

### 15.1 Where each photograph went

| File | Placed | What is actually in the frame |
|---|---|---|
| `hero-home.jpg` | Home hero, **eager** | A flexible shaft coupling joining a shaft to a bearing stack on a bench; green board and a blue fixture behind. Cool greys and silver. |
| `process-what-we-do.jpg` | What We Do | Someone in a lab coat holding out a pale yellow printed block of wavy fins. |
| `studio-about.jpg` | About | Shop shelving, red parts bins, hand-written labels — the mess, which is what the slot asked for. |
| `work-3.jpg` | **Home** work card 1 (contactors) | A hand holding a white printed block of wavy fins, backlit by the sun. |
| `work-2.jpg` | **Work** card 1 (contactors) | The wet test rig: a clear tank with media in it, six flow meters on a manifold. |
| `portrait-matthew.jpg` · `portrait-david.jpg` | About, People | See §15.3. |
| `og-card.jpg` | Link preview, all pages | The hero frame at 1.91:1. |
| `work-1.jpg` | **NOWHERE — see §15.2** | A wide shot of the same bench rig the hero was cropped from. |

Every image carries its file's real `width`/`height`, an `alt` written from the frame, and
`loading="lazy" decoding="async"` — except the Home hero, which is above the fold and instead
gets `fetchpriority="high"` and no `loading` attribute.

They are plain `<img>`, not the `<picture>` §11 sketched. A `<picture>` with one `<source>` buys
nothing; it becomes worth writing the day there is a second rendition per slot. **That day is
worth scheduling:** the 2400px hero is served whole to a 390px phone, which is the site's one real
piece of waste (§15.5).

One CSS block was added (`site.css` §15, `img.hero-media` / `img.shot*`): a filled plate and an
empty one now hold the same box, so a half-filled page does not reflow as slots are replaced.
`height:auto` there is load-bearing — see the comment.

### 15.2 The gap nobody should paper over: four projects, one photographed

**Three of the four cards on `/work` still have a reserved plate, and that is correct.** The
supplied photographs show the contactor work (two of them) and a bench rig (one). **Nothing in
`web/img/` shows a consumer wearable, precast concrete or a burn mask.** Putting a contactor
photograph under *"Lighter blocks. Same strength."* would caption one project with another's work —
the single thing §7 forbids outright — so the plates stay, visibly pending.

- The mismatch is **not** the file numbering. `work-1/2/3.jpg` were named by the session that
  cropped them, not by the operator; the intake worksheet's *"Work images"* line (§5.3) was never
  filled in. Wiring 1→card 1, 2→card 2, 3→card 3 would have put a water tank under the wearables
  card. Subject, not filename, decided placement.
- `work-1.jpg` is **unplaced**, deliberately. It is a wide shot of the rig the hero was cropped
  from, so publishing it on Home would print the same subject twice on one page, and no one has
  said which project it documents. **Operator question:** which project is the bench rig, and does
  the tank photograph belong to the contactor work as assumed?
- **Do not rebalance the grid to make the gap disappear.** A 2×2 with one photograph reads as work
  in progress, which is the truth. It fills with a shoot, not with a layout change.

`work.html`'s grid *was* silently broken, and that is fixed: it has carried `data-cols="2"` since
the fourth project cleared, but `data-cols` was only ever implemented for `.cards`, so the four
cards rendered 3-up with the fourth orphaned in its own row — exactly what the attribute was added
to prevent. Two selectors in `site.css`, flagged rather than slipped in.

### 15.3 The portraits do not match, and the frames do

Matthew: outdoors, warm light, foliage, polo shirt. David: indoor studio, grey seamless, navy
suit — and his file is **432×576**, the only asset on the site under 2× for its slot (~1.2× at the
352px cap). Both are placed so About is complete.

What is controlled is the frame: same class, same 3:4, same 22rem cap, same radius, same distance
to the name. So the difference reads as two photographs taken on two days — which it is — rather
than as a layout that broke. **Nothing was retouched, recoloured or cropped to fake a match.**
On the Lab ground the tell is background luminance: Matthew's dark foliage sinks into the black
page, David's grey studio wall sits on it as a bright rectangle. At 390px they stack and are never
seen side by side, so the phone barely shows it. One session with a camera fixes it properly.

### 15.4 Open Graph is live — with one assumption to correct

The commented block in `_include/head-common.html` is on. It is **split on purpose**: `og:title` /
`og:description` / `og:url` are per page and sit in each page's `<head>` above the include marker,
mirroring that page's `<title>` and meta description word for word; only the genuinely shared tags
(`og:type`, `og:image`, `og:image:*`, `og:site_name`, `twitter:card`) live in the partial. Moving
the per-page half into the partial would give every page Home's title in every link preview.

⚠ **`og:image` and `og:url` must be absolute, and we have no domain.** They assume
`https://intrnls.com/`. If the site ships anywhere else, `grep -rn 'https://intrnls.com' web/` and
fix all seven, or every link preview breaks. The case-study template deliberately has **no**
`og:url` — it is a template and has no address.

### 15.5 Verified, and the numbers

`python3 web/check.py` passes 7/7 and `--self-test` still catches all 15. The two-`.grad` mutation
was re-confirmed with Home back at one `.grad`: it reports 3 and fails, as it should.

Counts moved, and every move is accounted for — `405 → 397` elements with direct text (the eight
slot labels that photographs replaced), `25 → 26` skipped (Home's restored gradient phrase),
`108 → 114` local `href`/`src` (six new images). **`0` parked draft phrases is not a regression:**
the Work-card drafts were cleared on 2026-08-19, and the check 7 mutation plants its own parked
comment, so it still bites.

Page weight, uncompressed, everything a cold visit pulls (HTML + CSS + JS + all five fonts +
every image on the page): About **435 KB** · Home **389 KB** · Work **335 KB** · What We Do
**252 KB** · Contact and the case-study template **104 KB**. Images are 84% of the heaviest page;
CSS + JS + fonts are 83 KB flat, and gzip does not touch the JPEGs. Nothing here needs an
optimisation pass — but a phone downloading the 202 KB, 2400px-wide hero to show it 390px wide is
the one line worth fixing, and `srcset` is how.

All six pages re-rendered at 1440 and 390 into `design/web-skeleton/`, plus `home-desktop-fold.png`,
and every one was looked at. Only Chromium — Safari and Firefox remain UNVERIFIED (§12.9).
