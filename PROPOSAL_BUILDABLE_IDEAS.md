# Buildable Installation Ideas — Speculative Storytelling as Translation

**Constraint:** No poetry. Gesture/motion-based. Implementable with web stack (HTML, CSS, JS, p5.js) + browser-based sensing (MediaPipe Hands/Pose via CDN — no Kinect, no projection required for prototype).

---

## Idea 1: **Untranslatable Words — Three Embodied Rooms**

**Content:** Three words with no direct English equivalent, each becomes one interactive “room.”

| Word        | Origin     | Literal definition (Wall 1)        | Gesture mapping (Wall 2) |
|------------|------------|-------------------------------------|---------------------------|
| **Saudade** | Portuguese | Longing for something/someone absent | Slow movement = fading silhouettes; standing still = particles of “absence” gathering around hands |
| **Mono no aware** | Japanese | Bittersweet awareness of impermanence | Hand height = blossom density; movement speed = rate of petals falling/dissolving |
| **Hüzün** | Turkish | Melancholy that belongs to a place/community | Low hands = dark, heavy visuals; raising hands slowly = light breaking through |

**What I will build:**
- **Phase 1 (Literal):** Single scroll page with the three words + dictionary definitions. At the end, SAM-style rating (click/drag on valence–arousal grid), stored in `localStorage`.
- **Phase 2 (Speculative):** Full-screen p5.js canvas. Webcam + MediaPipe Hands: hand position (x, y, z) and movement speed drive particles and lighting. Three “rooms” = three scenes; user clicks or holds gesture to advance. No poem, only embodied interaction.
- **Phase 3 (Data):** Simple dashboard page: scatter plot (valence vs arousal) for “before” (literal) vs “after” (speculative), using stored ratings. Optional: one metaphor-recall multiple-choice after each phase.

**Tech:** HTML/CSS/JS, p5.js, MediaPipe Hands (CDN), `localStorage` or JSON file for demo data.

---

## Idea 2: **Proverbs — Gesture Reveals the Metaphor**

**Content:** Three proverbs from different languages. Literal translation first; then each proverb becomes one interactive scene where **gesture reveals** the metaphor (e.g. “walls have ears” → hands near edges trigger eyes/ears).

| Proverbs (examples) | Literal (Wall 1) | Interaction (Wall 2) |
|---------------------|------------------|------------------------|
| “Walls have ears”   | Text only        | Hand near left/right edge of screen (or virtual “wall”) → ears/eyes appear on that edge; recede when hand pulls back |
| “Heavy heart”       | Text only        | Hand near chest (center of frame) + slow movement → particles sink, visual “weight”; fast movement → lightens |
| “Time is a river”   | Text only        | Hand moving left → river flows backward; right → forward; hand height = depth/speed of current |

**What I will build:**
- **Phase 1:** One page with the three proverbs (literal English). SAM rating + store.
- **Phase 2:** Full-screen p5.js + MediaPipe Hands. Three scenes in sequence. Each scene: hand position (normalized to canvas edges) and hand openness (fist vs open palm) drive the metaphor (ears, weight, river). Clear “next” trigger (e.g. open palm held 2 sec) to advance.
- **Phase 3:** Same as Idea 1 — scatter plot comparing literal vs speculative ratings.

**Tech:** Same as Idea 1. Gesture logic: distance from canvas edge, palm open/closed, optional simple pose (hand near chest via MediaPipe Pose).

---

## Idea 3: **One Motif, Three Cultures — You Are the Protagonist**

**Content:** One narrative motif (e.g. “the forbidden door”) in three short literal versions (e.g. from Arabic, Japanese, Eastern European folktale). Then one speculative space where the user **is** the one opening the door; gesture controls what lies behind it.

**Literal (Wall 1):** Three text blocks (same motif, three cultures). SAM after reading.

**Speculative (Wall 2):** Single scene: a “door” (vertical bar or abstract shape) in the center. User’s hand position and “reach” (hand forward toward camera = opening) control:
- Door opening (angle or scale).
- What appears behind: abstract shapes, particles, or layered imagery that blend the three cultural “versions” (e.g. different color palettes or motion per culture). Which culture dominates could be tied to hand x-position (left / center / right).

**What I will build:**
- **Phase 1:** One page with three short motif texts. SAM + store.
- **Phase 2:** One p5.js scene: door + hand-driven opening + simple “three zones” (left/center/right) for cultural emphasis. MediaPipe Hands for reach (z) and x.
- **Phase 3:** Same dashboard as Ideas 1–2.

**Tech:** Same stack. Slightly simpler than Ideas 1–2 (one scene, one metaphor: opening).

---

## Recommendation

- **Easiest to build and test quickly:** **Idea 3** (one motif, one door, clear gesture: reach to open).
- **Strongest fit with your paper (metaphor + culture):** **Idea 2** (proverbs) or **Idea 1** (untranslatable words).
- **Best balance of “wow” and buildability:** **Idea 1** (three distinct emotional rooms, clear SAM before/after).

---

## Deliverables I Can Implement

For whichever idea you choose, I can deliver:

1. **Phase 1:** `literal.html` — text content + SAM grid (valence/arousal) + save to `localStorage`.
2. **Phase 2:** `speculative.html` — full-screen p5.js + MediaPipe Hands (and optionally Pose), gesture logic, 1–3 scenes, “next” control.
3. **Phase 3:** `dashboard.html` — read stored ratings, scatter plot (literal vs speculative), optional bar chart for metaphor recall.
4. **Shared:** `js/sam.js`, `js/gesture.js`, `css/installation.css` so the three phases share styling and logic.

If you tell me which idea (1, 2, or 3) you want, I’ll scaffold that one next (starting with Phase 1 + a minimal Phase 2 so you can test gesture on your machine).
