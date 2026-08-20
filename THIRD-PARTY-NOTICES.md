# Third-party notices — intrnls.com

**This file is an INDEX, not a licence text.** Every entry points at the *genuine upstream text*
and says where that text lives. Nothing here is hand-written, reconstructed, summarised or
paraphrased from a licence.

Split out of the private source repo's `THIRD-PARTY-NOTICES.md` on 2026-08-20, scoped to only
what this repo actually ships — that file also covered an unrelated private host-side stack which
has no bearing on this site. The verification work below (hashes, provenance) carried over
unchanged; only the framing changed, from *latent, not yet deployed* to **LIVE**, because this
repo is the thing that deploys it.

---

## 🟢 LIVE

### Poppins — latin subset, weights 400/500/600/700/800 — SIL Open Font License 1.1

| | |
|---|---|
| Vendored at | `web/fonts/poppins-latin-{400,500,600,700,800}.woff2` (5 files, 7,748–8,000 bytes each) |
| Referenced by | `web/css/site.css` — five `@font-face` blocks; `web/_include/head-common.html` preloads the 800 |
| Licence text in-tree | `web/fonts/OFL.txt` — **verbatim upstream.** Byte-identical to `google/fonts` `ofl/poppins/OFL.txt`, re-fetched and compared 2026-08-15 |
| Copyright, as the binaries themselves state it | `Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)` — name ID 0, read out of all five files. Identical to the first line of the committed `OFL.txt` |
| Licence, as the binaries themselves state it | URL only — name ID 14 = `https://scripts.sil.org/OFL`. Name ID 13 (the licence description) is absent from all five: the subsetter stripped it — which is precisely why the stand-alone `OFL.txt` is load-bearing and not decoration |
| Do we modify them? | No. Byte-for-byte copies. The only difference from upstream is the filename on disk |

**Provenance — established by hash.** All five files are byte-identical to the latin subsets
`fonts.gstatic.com` serves for Poppins `v24`, hashed 2026-08-15:

| Weight | Upstream file at `fonts.gstatic.com/s/poppins/v24/` | Bytes | `sha256` |
|---|---|---|---|
| 400 | `pxiEyp8kv8JHgFVrJJfecg.woff2` | 7,884 | `7d93459d86585bfcdbb7e0376056226adb25821ee54b96236fe2123e9560929f` |
| 500 | `pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2` | 7,748 | `cd36de204aca2d5fa263a731f7c20009b5e3d754ba1f1e03c33e93a48f3e7446` |
| 600 | `pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2` | 8,000 | `f4e80d9dfd374d02989b87a27b5ed4cb78fbb177c27f1478e9a8b0afb7513149` |
| 700 | `pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2` | 7,816 | `9338e65fc077355c7a87ae0d64cc101e23b9bf8ad78ae65f0f319c857311b526` |
| 800 | `pxiByp8kv8JHgFVrLDD4Z1xlFQ.woff2` | 7,824 | `60bf0aba6526436f3930c58c12047687fbb6bff4dd180cce4613458ed3439ea2` |

`web/fonts/OFL.txt` is `sha256 6be04893d770899a015649c7aa3b582f871b272f8747a92b78b17c3e5c8b2573`,
diffed clean against `raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt`.
Corroborated a second way: the copyright line of that text and name ID 0 of every binary are the
same string. **Which exact URL was originally fetched is unrecorded** (`UNKNOWN`, not guessed) —
immaterial here, since the obligation attaches to what the bytes are, and the bytes are proven
identical to current upstream regardless of which mirror served them.

**What OFL 1.1 asks for, checked against these files:**

- **Clause 2 (notice + licence must travel with every copy) — satisfied by construction.**
  `OFL.txt` sits in `web/fonts/` alongside the binaries, `web/css/site.css` points to this file
  in a comment next to the `@font-face` rules, and the GitHub Pages deploy (`web/` → Pages
  artifact, `.github/workflows/pages.yml`) ships the whole `web/` tree — there is no build step
  that could emit only HTML/CSS-referenced files and silently drop `OFL.txt`.
- **Clause 3 (Reserved Font Name) — does not apply.** No Reserved Font Name is declared in
  `web/fonts/OFL.txt` (a bare copyright line, no `with Reserved Font Name …` suffix), and no
  Modified Version was made — the subsetting is upstream's act, our copies are byte-identical,
  and the internal font name (read from name IDs 1/4/6) is unchanged. Only the on-disk filename
  differs from upstream.
- **Clauses 1 and 5** — the Font Software isn't sold by itself (clause 1), and it stays under OFL
  as vendored (clause 5); clause 5 also states the license does not extend to documents created
  *using* the font, i.e. this website's own content.

---

## ✅ Our outbound licence — all rights reserved

No `LICENSE` file is deliberate, not an oversight — see the repo's root `README.md`. Publishing
no terms means all rights reserved by default. This section exists only to say that plainly, so
someone doesn't "fix" it by adding a permissive license later without it being a real decision.
