# Figma → Code Design System Rules

Use this document when translating Figma designs into code for this project.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Router | React Router v7 (`basename: /Diplom-Projekt`) |
| Build | Vite 6 + `@tailwindcss/vite` |
| Animation | Framer Motion v12 (`motion/react`) |
| Backend | Supabase JS |
| UI primitives | Radix UI (available but rarely used in core pages) |

---

## Design Tokens

### Core project tokens (used in `New.tsx`, `Playground.tsx`, etc.)

These are **JS constants** — not CSS variables. Always use these, not raw hex values.

```ts
// Backgrounds
const LIGHT_BG   = "#fcf6ef";   // main page background (light mode)
const PANEL_BG   = "#f8efe5";   // panel / card background
const DARK_BG    = "#484848";   // dark mode page background

// Borders
const BORDER_COL  = "#a4a4a4";              // light mode dashed border
const DARK_BORDER = "rgba(252,246,239,0.16)"; // dark mode dashed border

// Text
const LIGHT_TEXT = "#555555";   // main text, light mode
const DARK_TEXT  = "#f0e8dc";   // main text, dark mode
const DARK_MUTED = "rgba(240,232,220,0.5)"; // muted text, dark mode

// Sidebar
const SIDEBAR_BG = "rgba(248,239,229,0.7)";
```

### Typography tokens

```ts
const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";
```

- **Freight Text Pro** — headings, writing zone text, serif display text
- **General Sans** — UI labels, buttons, inputs, descriptions
- **IBM Plex Mono** — writing zone text in legacy tools (monospace)

Fonts are loaded via:
- Adobe Fonts (Typekit): `https://use.typekit.net/zmi4hea.css` (Freight + General Sans)
- Google Fonts fallback: EB Garamond, Courier Prime

### CSS custom properties (Tailwind / shadcn layer)

Defined in `src/styles/theme.css`. Used only by shadcn/Radix UI components in `src/app/components/ui/`. **Do not use these in the main project pages** — use the JS constants above.

```css
--background: #ffffff;
--foreground: oklch(0.145 0 0);
--border: rgba(0,0,0,0.1);
--radius: 0.625rem;
/* ...etc */
```

---

## Styling Approach

### Primary pages (`New.tsx`, `Playground.tsx`, overview pages)
**Inline styles only.** No Tailwind, no CSS modules. Styles are written as React `style={{}}` objects using the JS design tokens above.

```tsx
// ✅ Correct for main pages
<div style={{ background: LIGHT_BG, border: `1px dashed ${BORDER_COL}`, borderRadius: "8px" }}>

// ❌ Never use Tailwind in New.tsx / Playground.tsx
<div className="bg-[#fcf6ef] border border-dashed">
```

### Legacy tool pages (`src/app/projects/*/`)
Mix of Tailwind utility classes and inline styles. Tailwind is acceptable here.

### shadcn/ui components (`src/app/components/ui/`)
Tailwind + `class-variance-authority`. These are generic primitives not used in the main creative writing pages.

---

## Border Convention

All interactive UI elements use **dashed borders** at rest:

```ts
border: `1px dashed ${BORDER_COL}`       // default
border: `1px dashed ${innerBorder}`      // inside sidebar (adapts to dark mode)
border: `1.5px solid ${LIGHT_TEXT}`      // selected / active state (solid, stronger)
```

- `innerBorder` = `dark ? DARK_BORDER : BORDER_COL`
- Active/selected items switch from `dashed` → `solid` with `1.5px` weight

---

## Component Patterns

### Buttons
```tsx
// Standard button (no Tailwind)
<button style={{
  background: "transparent",
  border: `1px dashed ${BORDER_COL}`,
  borderRadius: "4px",
  height: "31px",
  padding: "0 14px",
  fontFamily: FONT_SANS,
  fontSize: "14px",
  color: LIGHT_TEXT,
  cursor: "pointer",
  outline: "none",
}} />
```

### Settings cards
```tsx
<div style={{
  background: settingsCardBg,   // dark ? "#2d2b28" : LIGHT_BG
  border: `1px dashed ${innerBorder}`,
  borderRadius: "8px",
  padding: "12px 24px",
}} />
```

### Toggle (on/off)
Custom `ToggleBtn` component — NOT Radix Switch. Inline styles only.

### Radio option rows
Custom `RadioCircle` component — 18px circle, fills when selected.

---

## Dark Mode

Dark mode is a **React state** (`const [dark, setDark] = useState(false)`), not a CSS class or media query. All dark-mode styles are conditional inline expressions:

```tsx
color: dark ? DARK_TEXT : LIGHT_TEXT
background: dark ? "#2d2b28" : LIGHT_BG
border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`
```

---

## Animation

Use **Framer Motion** (`motion/react`). Standard spring config:

```ts
const SPRING = { type: "spring", stiffness: 280, damping: 26 };
```

Sidebar slides in from left. Use `AnimatePresence` for enter/exit.

---

## Layout

- **Writing zone**: centered, max-width 1010px, full viewport height
- **Sidebar**: fixed left, 153px wide, slides in with Spring animation
- **Detail panel**: fixed left at 153px, 314px wide
- **Top bar**: fixed top-right, `position: fixed, top: 24px, right: 24px`
- **Router basename**: `/Diplom-Projekt` — all `navigate()` calls use paths like `/new`, `/playground`

---

## Asset Management

- Videos: `public/videos/*.mp4` + `.webm`
- Favicon: `public/favicon.svg`
- No CDN — all served from GitHub Pages at `https://lferreira1998.github.io/Diplom-Projekt/`
- ASCII images: captured as WebP base64 data URLs, stored in Supabase JSONB

---

## Icons

Custom inline SVG components (not icon libraries) defined at the top of each page file:

```tsx
function IconHalfCircle({ color }: { color: string }) { ... }
function IconEyeClosed({ color }: { color: string }) { ... }
function IconEyeOpen({ color }: { color: string }) { ... }
```

---

## Figma → Code Mapping

| Figma property | Code equivalent |
|---|---|
| `FreightText Pro / Book` | `FONT_SERIF` |
| `General Sans / Regular` | `FONT_SANS` |
| `#fcf6ef` | `LIGHT_BG` |
| `#555555` | `LIGHT_TEXT` |
| `#a4a4a4` | `BORDER_COL` |
| `1px dashed border` | `border: \`1px dashed ${BORDER_COL}\`` |
| `border-radius: 8px` | standard card radius |
| `border-radius: 4px` | button / small element radius |
| `border-radius: 100px` | pill / toggle |
| Muted text `rgba(155,155,155,0.8)` | placeholder text color |

---

## File Structure

```
src/
  app/
    New.tsx              # Main creative writing tool (primary page)
    Playground.tsx       # Tool gallery
    App.tsx              # Router
    components/
      AsciiImagePanel.tsx
      ui/                # shadcn primitives (rarely used in main pages)
    projects/
      parametrischestool/
        components/
          writing-zone.tsx   # Core writing engine
          param-panel.tsx
    utils/
      storage.ts         # Supabase helpers
      supabase.ts
  styles/
    theme.css            # CSS custom properties (Tailwind/shadcn layer)
    tailwind.css
    fonts.css
  main.tsx
```
