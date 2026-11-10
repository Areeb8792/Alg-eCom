# Superdesign Design System — HEAVYWEIGHT

## 1. Brand Identity & Creative Direction
- **Brand Name**: HEAVY / HEAVYWEIGHT CORP. (Est. 2024 / NYC)
- **Aesthetic**: Editorial high-fashion brutalist luxury, minimalist, typography-led, architectural structure.
- **Visual Tenet**: High contrast, stark monochrome with controlled vivid red accent (`#dc2626`), granular texture, sharp dropshadows, oversized condensed editorial typography.

## 2. Color Palette & Tokens
- `--concrete`: `#f2f2f2` (Main canvas / background)
- `--ink`: `#0a0a0a` (Deep editorial black text & dark sections)
- `--red`: `#dc2626` (Badge accent, notifications, critical indicators)
- `--white`: `#ffffff` (Card highlights, floating button canvas)
- `--border-subtle`: `rgba(0, 0, 0, 0.1)` / `border-zinc-200`
- `--text-muted`: `rgba(10, 10, 10, 0.7)` / `text-white/60`

## 3. Typography
- **Headings / Impact**: `'Anton', sans-serif`
  - Properties: `line-height: 0.85`, `letter-spacing: -0.05em`, `text-transform: uppercase`
  - Scale: Hero Display `text-[10vw]`, Section Display `text-5xl` to `text-6xl`, Massive Background `text-[25vw]`
- **Body / Metadata**: `'Space Grotesk', sans-serif`
  - Properties: `letter-spacing: 0.05em`
  - Tags / Badges: `text-[10px]`, `tracking-[0.3em]`, uppercase
  - Body copy: `text-sm`, `leading-relaxed`
  - Price / Status: `text-xs font-bold`

## 4. Textures & Special Effects
- **Grain Overlay**: SVG fractal noise filter fixed on top with `opacity: 0.04`, pointer-events: none.
- **Grayscale Hover**: Images default to `filter: grayscale(100%)`, transitioning smoothly to `grayscale(0%)` with `scale(1.05)` on hover.
- **Mix Blend Difference**: Fixed navigation headers blend across light and dark backgrounds dynamically.
- **Sharp Shadows**: `box-shadow: 10px 10px 0px rgba(0,0,0,0.1)` (Brutalist non-blurred shadow).
- **Strike-through Hover**: Navigation links hover effect: `text-decoration: line-through; text-decoration-thickness: 2px`.
