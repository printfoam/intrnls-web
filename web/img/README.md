# web/img/ — site imagery

Drop assets here using the **exact filenames below**. Named this way, I can wire them without
asking which file is which.

Source files (RAW, PSD, full-res exports) do **not** belong here — this folder ships to the web
host, so anything in it is public. Keep originals wherever you keep originals.

| Filename | Ratio | Pull at least | Where it appears |
|---|---|---|---|
| `hero-home.jpg` | 16:6 | 2400 × 900 | Home hero. ⚠ **Re-crops to 4:3 under 640px** — keep the subject centred or it loses its head on a phone. |
| `process-what-we-do.jpg` | 16:6 | 2400 × 900 | What We Do. Same phone crop. |
| `studio-about.jpg` | 16:6 | 2400 × 900 | About. The room where it happens. |
| `portrait-matthew.jpg` | 3:4 | 900 × 1200 | About. Renders ~352px wide. |
| `portrait-david.jpg` | 3:4 | 900 × 1200 | About. Same. |
| `work-1.jpg` … `work-6.jpg` | 4:3 | 1200 × 900 | Project cards, Home + Work. Only for projects that clear. |
| `og-card.jpg` | 1.91:1 | 1200 × 630 | Link preview in Slack / iMessage / LinkedIn. |

**Format:** `.jpg` for photographs. `.png` only for flat colour or transparency — it is several
times larger for a photograph and buys nothing.

**Size:** bigger than the target is fine, I downscale and compress. Smaller is not — an upscaled
photograph looks soft and there is no fixing it afterwards.

**Transparent cut-outs:** if a portrait comes with the background removed, say so. It is a real
choice, not a detail — a cut-out floats directly on the black ground and can look excellent, but it
has to be deliberate. The alternative is compositing it onto a plate so it matches the other images.

---

## Status — 2026-08-20

Twelve files are here. **All ten site-facing slots are filled** (`work-1.jpg` is the sole
exception — see below), wired with real dimensions and honest alt text (`web/README.md` §15).
**All four Work cards now carry a real photograph, for the first time.**

- `work-4.jpg` (precast) is the printed formwork itself, unfilled — operator-confirmed
  2026-08-20 ("just the form, we haven't filled it yet") — so its alt text says "formwork",
  never "concrete part".
- `work-5.jpg` (burn mask) is a from-scratch re-render, not the earlier recolor patch: a
  synthetic (non-PII) face in acid green #39FF14, operator-supplied 2026-08-20, hue-checked
  against the retired cyan and confirmed clear.
- `work-6.jpg` (wearables) is a composite, not a single frame — two macro stills the operator
  asked to run "together" (a static lattice cross-section + the same material flexed between two
  fingers), project confirmed by the operator 2026-08-20. A third candidate from the same
  delivery (a cross-section with a lab measurement annotation baked into the pixels) was held
  back per the operator ("may be best on its own") — staged, not used, not discarded.

`portrait-david.jpg` is now 1024×1365 (was 432×576) — operator-supplied 2026-08-20, same crop/
frame, just real resolution. Every project photo the site needs is now on the site.

`work-1.jpg` (the wide shot of the bench rig the Home hero was cropped from) is **not published**:
it duplicates the hero's subject, and nobody has said which project it documents. Say the word and
it goes somewhere.

⚠ **The filename is not the assignment.** `work-1/2/3.jpg` were numbered by the session that
cropped them, not by whoever shot them, and the numbers do NOT line up with the card order on
`/work`. Placement was decided by looking at each frame. If you drop in replacements, say which
project each one is.
