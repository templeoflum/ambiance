# AMB · 02 — Reference DNA (real-radio studies)

> Goal of this pass: the device is too big and too in-your-face, and the tactile
> feel is flat. Four real-radio archetypes supply the DNA. Each becomes an
> interactive HTML study in `design/`. The final, AMB·02, takes the best of each.
>
> Three user notes, mapped:
> 1. **Quieter, smaller footprint** → the device should *rest* as a dark silhouette
>    on the desk, and only *bloom* its detail when you get close (LOD). Resting
>    footprint is small; the window isn't a billboard.
> 2. **Detail at levels (LOD)** → resting = silhouette + pilot glow; on engage
>    (hover / focus / resize) the knurling, dials, VU meter, fine type *emerge*.
>    In the Electron app this is `window 'enter'/'blur'`, not a settings page.
> 3. **True tactility** → knobs you *grab and turn* (with momentum + detents + a
>    synthesized click), buttons that *depress*, a VU needle with weight.
>    WebAudio gives each a real sound so the surface talks back to the hand.

---

## Archetype 1 — THE CABINET  (1940s wood/bakelite tabletop: Emerson, Zenith, Majestic)
**Era:** interwar → 1940s tube table sets.
**Material:** walnut/oak veneer, bakelite & catalin knobs, a cloth or painted face,
brass hardware, a glass-fronted dial window.
**The screen IS the dial:** an illuminated frequency scale (warm amber/cream glow, a
red pointer sweeping it). No separate "display" — the tuning *is* the visual. This
dissolves the "glass rectangle on a device" tell that makes the v1 read as software.
**Knobs:** large, faceted bakelite with a single index line; they catch the thumb.
**Feel:** warm, analog, lived-in, cozy. A thing that's been on the desk for 40 years.
**Contributes to AMB·02:** the *illuminated dial-as-screen* idea; warm material; the
"it's old and good, not glossy and new" posture.

## Archetype 2 — THE INSTRUMENT  (Sony ICF-7600D / McIntosh MC275-B / technical tuners)
**Era:** 1970s–80s precision receivers.
**Material:** brushed aluminium / stainless / matte anodised black; tight, engineered.
**The screen IS an instrument:** a linear VU meter with a *needle that has weight and
flick*, red glow, plus fine LED segments. Precision reads here, not decoration.
**Knobs:** detented potting — they *snap* to positions with a real click. Coarse +
fine tuning. Metal with crisp index marks.
**Feel:** serious, exacting, "an object for people who actually listen."
**Contributes to AMB·02:** *detented knobs with a real click*; the *VU needle with
mass*; fine legible type; the engineered-not-decorated restraint.

## Archetype 3 — THE FURNITURE  (Bang & Olufsen Beosound A5 / Balance)
**Era:** contemporary.
**Material:** a single milled anodised-aluminium ring, woven fabric / oak veneer;
sculptural, circular, architectural.
**Posture:** it *disappears into a room* — quiet by default, one clean geometry,
detail revealed only on interaction ("bloom on engage," nothing shouting at rest).
**Feel:** calm, modern, expensive, weighty. The most literal answer to "sits
quietly on the desk."
**Contributes to AMB·02:** the *quiet-at-rest → bloom-on-engage* LOD philosophy;
*one clean material* instead of a busy panel; circular geometry as the base form.

## Archetype 4 (synthesis principle) — MATERIAL & LIGHT
What all four share, and what the v1 was missing:
- **Material has a grain you can read** (veneer, anodising, knurling), not a flat
  gradient rectangle. Real surfaces have direction, edges, screws.
- **Light is emitted from *inside*** (a dial glows from behind the glass; a VU meter
  glows along its scale), not a UI accent colored on top.
- **Controls have mass** — they cast a shadow, seat into the panel, and resist. Flat
  circles that don't move = the "not physical" feeling.
- **The whole thing is quiet until you touch it.** Silence at rest is the point.

---

## The combined form (AMB·02)
A small object on a desk (≈ 360×260 at rest). One clean material (warm anodised
aluminium over a wood veneer base — Cabinet warmth + Furniture quiet). At rest: a
dark body, a single faint pilot glow, a low VU needle sitting at zero. On engage:
- **Tuning = an illuminated dial sweep** (Cabinet) — the screen is a glowing scale,
  not a text panel.
- **Knobs are detented and physical** (Instrument) — grab, turn, it snaps and ticks.
- **One VU needle with weight** (Instrument) — it breathes with the music.
- **Everything blooms out of the dark** (Furniture) — detail is reward, not noise.

Tactility engine (shared `core.js`): grab-to-turn knobs with momentum + detents +
synthesized click; depressing buttons with a settle; a needle with mass. WebAudio
talks back on every interaction. This is the thing that makes it *feel*.
