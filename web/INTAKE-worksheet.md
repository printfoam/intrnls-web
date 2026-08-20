# intrnls.com — intake worksheet

**For:** Matthew. **Purpose:** answer these and pull the listed assets, and the site can go live.
Type answers inline. `SKIP` and `DON'T KNOW YET` are both real answers — see the note on what
happens to a blank at launch.

> ### ⚠ Read this once before you start
> On the pages right now, every unanswered item shows as a **visibly empty dashed chip**. That was
> right for review — it stops us inventing facts. **It is not a state you can publish in.** At
> launch each item has to be either **filled** or **removed**, so for anything you mark `SKIP` I'll
> delete the slot and close the layout around it. Nothing ships as a dashed placeholder.

---

## 0 · Two decisions, before anything else

**0.1 — Which Squarespace version is intrnls.com on?**
Log in → open **Design**. If you can browse and swap *templates*, it's 7.0. If there's no template
switcher, it's 7.1.

```
Answer:  7.0  /  7.1  /  not sure
```

*Why it matters:* 7.0 has Developer Mode — a hosted git repo where a push deploys live, which means
this repo could drive the real site. 7.1 has no template-level code access, so the only options are
pasting code into Code Injection (our design fights their template) or hosting the static site
somewhere else and pointing the domain at it. **On 7.1, my recommendation is to host it as a static
site and keep Squarespace only for anything commerce-shaped.**

**0.2 — "Studio" or "company"?**
The copywriters set a deliberate rule: *"studio", never "vendor" or "service provider"*. You floated
changing it. It appears about a dozen times, so it's one find-and-replace either way.

```
Answer:  keep "studio"  /  change to "company"  /  something else: ..........
```

---

## 1 · Contact details — highest value, fill once

These come from **one shared footer**, so answering here fills **all six pages**.

```
Email ...........................................
Phone ...........................................
Location, as you want it shown (e.g. "Madison, WI")
    ...........................................
Social 1 — name + URL ...........................
Social 2 — name + URL ...........................
```

The Contact page shows a fuller block. Leave blank to omit:

```
Street address ..................................
Hours ...........................................
```

---

## 2 · Commitments — these print as promises

Only fill what you're willing to be held to. Blank is safer than aspirational.

```
Response time — e.g. "We reply within two business days"
    ...........................................
Minimum engagement — e.g. "Engagements start at $X"
    ...........................................
Engagements at once — e.g. "Three at a time"
    ...........................................
```

**Privacy line** — one true sentence about where a contact-form message goes. Can't be written until
the form is wired, so it's paired with 5.1 below.

```
    ...........................................
```

---

## 3 · The three project cards

Home and Work show the same three. Drafts exist for **direct air capture**, **consumer electronics**
and **defense**, all parked pending clearance. The rule the copy team set: **described by sector, not
by name** — the shape of the problem is the point.

```
PROJECT 1
  Sector .....................  Year ......
  Title, ~40 chars ...........................................
  Summary, ~90 chars .........................................
  Cleared to publish?   yes / no / need to ask: ..............

PROJECT 2
  Sector .....................  Year ......
  Title ......................................................
  Summary ....................................................
  Cleared to publish?   yes / no / need to ask: ..............

PROJECT 3
  Sector .....................  Year ......
  Title ......................................................
  Summary ....................................................
  Cleared to publish?   yes / no / need to ask: ..............
```

**If none clear in time:** say so and I'll cut the Work page and the Home work section rather than
ship three empty cards. That's a clean removal, not a hack.

---

## 4 · Proof row (Home)

Currently three reserved chips. **Most likely thing to cut** — an empty proof row is worse than no
proof row.

```
Client mark — a logo we have permission to show ..............
A number we can source .......................................
    ...and where it comes from ...............................
A named quote, with the person's permission ..................

Or:  CUT THE PROOF ROW  ☐
```

---

## 5 · Assets to pull

Sizes below are **2× for retina**. Bigger is fine — I'll downscale. JPG for photographs, PNG only
for anything with flat colour or transparency.

| # | Where | Ratio | Pull at least | Notes |
|---|---|---|---|---|
| 5.2 | **Home hero** | 16:6 | **2400 × 900** | ⚠ Crops to **4:3 on phones** — the subject must survive both. Keep it centred and away from the edges. |
| 5.3 | Work cards ×3 | 4:3 | 1200 × 900 each | One per project. Only needed for projects that clear. |
| 5.4 | What We Do — process | 16:6 | 2400 × 900 | Same phone crop caveat. |
| 5.5 | About — studio | 16:6 | 2400 × 900 | The room where it happens. |
| 5.6 | Portrait — Matthew | 3:4 | 900 × 1200 | Displays ~352px wide, so it doesn't need to be huge. |
| 5.7 | Portrait — David | 3:4 | 900 × 1200 | Same. |
| 5.8 | Link preview | 1.91:1 | 1200 × 630 | Shown when the URL is pasted into Slack, iMessage, LinkedIn. |

**The art director's brief for the hero, worth honouring:** *one photograph — a machine, an assembly,
or a part in hand. Something real and internal. Not an abstract render; the name promises otherwise.*

```
For each: file path, or "need to shoot it", or "use <describe it>"
5.2 Home hero ................................................
5.3 Work images ..............................................
5.4 Process ..................................................
5.5 Studio ...................................................
5.6 Matthew portrait .........................................
5.7 David portrait ...........................................
5.8 Link preview .............................................
```

**5.1 — Where should contact-form messages go?**
Right now the form validates and stops; nothing sends. To wire it I need a destination — an inbox, a
form service, or your Squarespace form.

```
Answer: ......................................................
```

---

## 6 · Tag chips — about twenty of them

Short labels under the capability cards on Home and What We Do. The copy deck never covered these.
Three to five words each, or cut them.

```
Under "Materials" ............................................
Under "Design + prototyping" .................................
Under "Pilot → commercialization" ............................

Or:  CUT THE TAG CHIPS  ☐
```

---

## 7 · Not needed yet

The case-study template's fields (client, role, duration, results, quote) only matter once a project
clears. Skip unless you want to shape it now.

---

## What I do with this

1. Fill every answered slot; **delete every slot you skip** and close the layout around it.
2. Drop the images in, sized and compressed.
3. Wire the contact form if 5.1 has an answer — and only report success on a real acknowledgement.
4. Re-run the checks and re-screenshot every page.
5. Hand you a zip plus the deploy route that matches your answer to 0.1.

**The three that unblock the most:** 0.1 (Squarespace version), 1 (contact details), 5.2 (the hero
photograph). Those three alone take it from "skeleton" to "publishable".
