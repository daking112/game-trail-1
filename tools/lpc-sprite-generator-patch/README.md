# LPC Random Sprite Generator — verified patch

Adds a "🎲 LPC Random Design Lab" panel to the official Universal LPC
Spritesheet Character Generator's Advanced Tools section: random single
characters, themed modes, a free-text design brief that biases asset
selection, and batch export (PNG + JSON + manifest + credits, zipped).

This patch was tested end-to-end against the real generator (type-check,
lint, production build, and a headless-browser run that clicked both
"Generate 1" and "Generate N + ZIP" and confirmed a character actually
rendered and a real ZIP downloaded).

## Important: use the correct upstream repo

The original project moved. Do **not** use `sanderfrenken/Universal-LPC-Spritesheet-Character-Generator`
— that one is retired, has no npm/Vite build, and this patch will not apply to it.

Use the current, actively maintained repo instead:
https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator

## Setup

1. Clone the real repo:
   ```
   git clone https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator.git
   cd Universal-LPC-Spritesheet-Character-Generator
   ```
2. Copy the 4 files from this patch's `sources/` folder into the matching
   paths in the cloned repo, overwriting:
   - `sources/components/App.ts`
   - `sources/components/advanced/AdvancedTools.ts`
   - `sources/state/random.ts` (new file)
   - `sources/canvas/download.ts`
3. Install and run (requires Node.js >= 22.18):
   ```
   npm install
   npm run dev
   ```
4. Open the local URL Vite prints, expand **Advanced Tools**, and use
   **LPC Random Design Lab**.

## What you get

- Design modes: Balanced, Chaos, Human, Creature, Monster, Warrior, Mage,
  Ranger, Forest
- Optional design brief text field that biases which assets get picked
  (e.g. "creepy swamp creature with horns, wings and heavy armor")
- Optional numeric seed for reproducible results
- "Generate 1" — randomizes and renders one character in the live preview
- "Generate N + ZIP" (up to 100) — downloads a ZIP with `random_NNN.png`,
  `random_NNN.json` per character, plus `manifest.json` and `credits.txt`

The design brief is local keyword matching only — no cloud AI involved.

## Known non-issue

You may see `Failed to load image: .../climb.png` (or similar) messages
in the browser console for some randomly chosen combinations. This is
pre-existing, expected behavior in the base generator — not every asset
has art for every animation (e.g. "climb"), and the renderer already
handles this gracefully (it skips the missing frame; nothing crashes,
downloads still work).
