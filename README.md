# Velora — Concept 3

Static landing page built 1:1 from the Figma file **Velora → section "Concept 3"** (node `817:2375`).

- `home-5` is the full page layout (hero, logo strip, "Proven at scale").
- Section `884:3776` (`home-2 → home-3 → home-4`) is the scroll animation of the products panel:
  white dots travel from the Velora symbol along the lines (home-2); when a dot reaches its spot
  the product node pops in and new dots keep flowing along the line (home-3); the panel grows to
  full-bleed and pins, the nodes bump and vanish, and the link card, product window and tabs
  come in (home-4).

## Structure

```
index.html          page markup
css/styles.css      all styles (values taken from Figma: spacing, colors, type)
js/main.js          canvas scaling + scroll storyboard + tab switching
assets/
  icons/            logo, UI icons, product icons (SVG)
  decor/            gradients, lines, glows, beams, bottom strips (SVG)
  logos/            partner logos (PNG)
```

## Fonts

Google Fonts: **Manrope** (400/500/600/700), **Newsreader** italic (300/400), **Inter** (200/300).

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Notes

- The design canvas is 1440px. Screens narrower than 1440px scale the canvas down
  proportionally, so the layout stays the same as in Figma.
- With `prefers-reduced-motion` turned on, or without JavaScript, the page shows the final
  `home-4` state and nothing is pinned.
