# Pixel Raid — Design System

## Mood
Midnight arcade — dark navy void with neon element glow. Pixel art collectibles meet sci-fi battle arena.

## Color Strategy
**Committed** — Dark theme carries the mood; element colors (Fire/Water/Nature/Lightning/Shadow) are the identity.

## Palette (OKLCH)

### Core Surface
- `--bg`: oklch(0.08 0.01 260) — near-black navy (#07071a)
- `--surface`: oklch(0.12 0.015 260) — slightly lighter navy (#0f0f2a)
- `--ink`: oklch(0.95 0.01 80) — warm white (#f0e8d0)
- `--muted`: oklch(0.55 0.02 260) — dimmed text (#7a7a9a)

### Brand
- `--gold`: oklch(0.78 0.16 85) — primary gold (#d4a827)
- `--gold-glow`: oklch(0.85 0.18 85) — bright gold accent (#e8c840)

### Element Colors
- `--fire`: oklch(0.60 0.22 25) — fire red (#ff3333)
- `--water`: oklch(0.55 0.18 250) — water blue (#3366ff)
- `--nature`: oklch(0.65 0.20 145) — nature green (#33cc33)
- `--lightning`: oklch(0.82 0.18 95) — lightning yellow (#ffcc00)
- `--shadow`: oklch(0.45 0.20 300) — shadow purple (#9933ff)

### Rarity
- `--common`: oklch(0.60 0.02 260) — gray
- `--rare`: oklch(0.55 0.15 250) — blue
- `--epic`: oklch(0.50 0.18 300) — purple
- `--legendary`: oklch(0.78 0.16 85) — gold
- `--mythic`: oklch(0.55 0.22 25) — red

## Typography
- **Display**: `"Press Start 2P"` (Google Fonts) — pixel font for headings
- **Body**: `"VT323"` (Google Fonts) — pixel monospace for stats
- **System fallback**: `monospace`

## Spacing Scale
4px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

## Border Radius
- Cards: 4px (pixel feel)
- Buttons: 6px
- Badges: 3px

## Animation
- Duration: max 300ms
- Easing: ease-out only (no bounce, no elastic)
- `@media (prefers-reduced-motion: reduce)` → instant/crossfade

## Z-Index Scale
1. Void background: 0
2. Game content: 10
3. Card hand: 50
4. Phase bar: 60
5. Overlay/modal: 100
6. Toast/tooltip: 200

## Anti-Patterns to Avoid
- ❌ Cream/sand/beige backgrounds
- ❌ Purple-to-blue gradients (AI slop)
- ❌ Nested cards
- ❌ Gray text on colored backgrounds
- ❌ Bounce/elastic easing
- ❌ Overused fonts (Inter, Arial)
- ❌ Pure black (#000) — always tint toward navy
