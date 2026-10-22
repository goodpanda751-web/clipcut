# ClipCut — based on OpenCut Classic (MIT)

ClipCut is Muhammad's rebrand of the working OpenCut Classic codebase
(opencut-app/opencut-classic, MIT License — see LICENSE, attribution kept).
The repo Muhammad linked, opencut-app/opencut (main), is a ground-up
rewrite that is **not a usable editor yet** — its own README says the
classic version "is the one to reach for today". So ClipCut is built on
Classic, not on the unfinished rewrite.

Branding: name is **ClipCut**, CapCut-style look (dark, simple, muted).
CapCut's own name, logo, templates, effects and music are ByteDance
property and cannot be copied — ClipCut uses its own name/assets with
the same *style and feature set*, built legitimately.

## CapCut Pro feature map — checked against this codebase, 2026-10-23

### Already in OpenCut Classic (so already in ClipCut)
- Multi-track timeline: split, trim, duplicate, ripple, clipboard, keyframes + curves
- Keyframe animation for properties and effect parameters
- Masks: built-in shapes, freeform/custom masks, invert
- Effects system (blur etc.), gradients, text with backgrounds/typography
- Stickers library, sounds search, subtitles (SRT/ASS import + subtitle text elements)
- Retime / speed, audio separation folder, canvas ratios in preview
- Export: MP4 / WebM, quality low → very_high, fps options, real file download
- Projects saved locally in the browser (privacy-first, no account needed)

### To add for CapCut Pro parity (in build order)
1. ~~**Auto captions**~~ — CORRECTION (Phase 1 inspection, 2026-10-23):
   Classic already has full local Whisper transcription
   (`src/transcription/`, `src/services/transcription/`, Captions panel
   with language picker + SRT/ASS import). Phase 1 completed it by
   adding the missing **model picker** (Tiny/Small/Medium/Large v3 Turbo).
2. **Background removal / chroma key** — one-click BG remove + green screen
3. ~~**Transitions library**~~ — DONE in Phase 1, see below.
4. ~~**Filters / LUTs + adjustment**~~ — DONE in Phase 1 (colour grade;
   HSL/LUT file import still to come), see below.
5. **Templates** — ready-made 9:16 templates with replaceable clips/text
6. **Text-to-speech + auto lyrics styling** — TTS voices, animated caption styles
7. **Body/face effects & beauty** — smoothing/retouch (heavy; later phase)
8. **Cloud / Pro extras that cannot be cloned** — CapCut's licensed music
   library, its proprietary AI models and paid template marketplace.
   ClipCut substitutes: royalty-free sounds (existing sounds search) and
   locally-run models only.

### Known limits inherited from Classic
- Editor is **not optimised for mobile/iPad yet** (there is a mobile-gate
  warning in the code — "things will break"). Desktop browser first;
  a real mobile UI is a separate phase, not a re-skin.
- Desktop app in Classic is GPUI "in progress" — not a finished .exe.
  Windows/Android packaging comes after the web editor is verified,
  same lesson as ClipForge: verify in browser first, package second.

## Phase 1 — built 2026-10-23 (auto captions + transitions + filters)

**Filters / Adjustment (new, full stack)**
- Rust: new `color_adjust.wgsl` shader (brightness / contrast /
  saturation / warmth), registered as a second pipeline in
  `rust/crates/effects/src/pipeline.rs`; `pack_effect_uniforms` is now
  per-shader. Verified: `cargo check -p effects` passes (Rust 1.99.1).
- Web: `src/effects/definitions/color-adjust.ts` — "Colour Adjust"
  effect (4 sliders, -100..100) registered next to Blur, so it also
  appears in the Effects tab; 8 one-tap presets (Vivid, Warm, Cool,
  Mono, Fade, Punch, Soft, Drama).
- The previously placeholder **Adjustment tab is now a real panel**
  (`src/effects/components/adjustment-view.tsx`): tap a preset → a
  Colour Adjust effect clip is inserted at the playhead.
- WASM rebuild DONE 2026-10-23 ~03:11 PKT: `wasm-pack build
  rust/wasm --target bundler --out-dir pkg` succeeded from this code
  (release compile 4m49s; `wasm-opt` disabled via
  `[package.metadata.wasm-pack.profile.release] wasm-opt = false` in
  `rust/wasm/Cargo.toml` because the binaryen download failed).
  The built `opencut_wasm_bg.wasm` (4.37 MB) contains the
  `color-adjust` shader strings. Linked locally:
  `apps/web/node_modules/opencut-wasm` → `rust/wasm/pkg`, so the web
  app now uses the ClipCut build, not the published package.
  Dev server runs at http://localhost:3000 (Next.js, HTTP 200).
- Live verification 2026-10-23 ~03:14 PKT (server-side, because the
  live-browser tool could not open local pages this run): landing
  page serves `<title>ClipCut</title>`; `/projects` and
  `/editor/<id>` routes compile and return HTTP 200 with no compile
  errors in the dev log (only a Google Fonts download warning in
  this sandbox). The compiled client chunks contain the Phase 1 UI
  ("Spin In", "Slide Left", "Vivid", "Colour Adjust",
  "Generate transcript", "Welcome to ClipCut"), and the WASM file
  served to the editor is the local `rust/wasm/pkg` build
  (4,373,708 bytes — the ClipCut build with `color-adjust`), not
  the npm package. NOT yet verified: an actual visual click-through
  of the panels and a real filter render on a clip — that needs the
  app opened in a real browser, which means hosting it somewhere
  reachable (the dev server only runs on Alder's machine).

**Transitions (new)**
- `src/transitions/` — 6 transitions (Fade, Zoom In, Zoom Out,
  Slide Left, Slide Up, Spin In) expressed as keyframes on the two
  clips at a cut (the timeline model has no transition object), using
  `editor.timeline.upsertKeyframes`, so they undo/edit like any
  keyframes. `find-cut.ts` locates the cut nearest the playhead
  (main + overlay tracks).
- The previously placeholder **Transitions tab is now a real panel**
  with a duration picker (0.3 / 0.5 / 1.0s) and plain status messages.

**Auto captions (completed, not built from scratch)**
- Core already existed (local Whisper via @huggingface/transformers,
  worker + service, chunking, insert-as-text-track).
- Phase 1 added the missing **model picker** in the Captions panel —
  the service already accepted `modelId` but the UI never passed one,
  so every user was silently locked to Whisper Small.

## Rebrand done in this clone (2026-10-23)
- `apps/web/src/site/brand.ts` — SITE_INFO title/description → ClipCut
- `apps/web/public/manifest.json` — PWA name/description → ClipCut
- First-run strings: onboarding welcome, mobile-gate, editor Chrome hint → ClipCut
- Root `package.json` name → clipcut
- Internal `@opencut/*` workspace package names, LICENSE and OpenCut
  attribution are intentionally kept — MIT requires it and renaming
  internal packages would break imports for no user benefit.
- Still to do: ClipCut logo/icons (current icons are OpenCut's),
  landing page copy, and SITE_URL once a domain/repo exists.
