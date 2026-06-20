# Portfolio Website — Design System & AI Prompt
## Swiss Rationalist / New International Style

---

## 🎯 Design Brief (Feed this to the AI)

Build a portfolio website in the **Swiss International Typographic Style** (Neue Grafik / Zürich school).  
The aesthetic is **cold, structured, editorial, and precise** — not decorative, not cozy.  
Every element earns its place through function. Whitespace is not emptiness; it is structure.

---

## 🧬 Page DNA — Visual Language Breakdown

### Grid System
- **Strict modular column grid** — 12 columns, generous gutters (~24–32px)
- Visible grid lines as a **design element** (see Image 1 pink variant: thin vertical rules bleed through the entire layout, overlaid on photography and content alike)
- Content blocks snap hard to column edges — NO floating or loosely-placed elements
- Section labels (`01`, `02`) appear in small caps, left-aligned, at column 1 — acting as navigational anchors
- The grid is **revealed**, not hidden — this is intentional, not a bug

### Typography
- **One typeface family only** — grotesque sans-serif in the tradition of Helvetica Neue or Aktiv Grotesk
  - Display: Black/Bold weight, very large (80–120px), tight tracking (~-0.02em), no decorative effects
  - Body: Regular weight, 14–16px, comfortable line-height (1.5–1.6)
  - Labels/Nav: Uppercase or mixed case, 11–13px, tracking +0.05em to +0.1em
  - Table data: Regular 13px, tabular figures
- **Type as structure** — heading "Curriculum Vitae" and "Janv-Sept 2023" are enormous, anchoring layout zones, not just labeling them
- Copyright/metadata floats to far right in small text, same baseline as section title — Swiss precision detail
- NO italic, NO script, NO decorative type

### Color Philosophy
- **Base palette is almost monochrome**: white (#FAFAFA or pure white), near-black (#111 or #0D0D0D), mid-grey for rules and secondary text
- **Accent color is a single, deliberate warm tone**: a dusty coral/salmon pink (approx. `#E8A090` or `#D4847A`) — used as a full-page background in dark mode variant or highlight state
- In the pink variant: ALL photography gets a color-duotone / tinted overlay matching the background — images are not full-color, they are design elements subordinated to the system
- Tag/badge elements: small pill shapes, 1px border, no fill — text inside is 11px uppercase — used to categorize content (e.g. "Exposition", "Performance", "Film")
- **Never more than 2 colors active on one screen** (background + text, or background + accent)

### Navigation
- Full-width top bar, white background, no shadow, no blur
- Wordmark/logo: Bold, single letter or short text, left-aligned
- Nav links: 12–13px, regular weight, spaced across the bar
- **One nav item is underlined** to show current page — no hover states that feel "app-like," just quiet typographic underlining
- No hamburger on desktop. Navigation is always visible and minimal

### Content Structure — Event/Work Listing (Image 2 DNA)
- **3-column row layout** per item:
  - Col 1: Date in a 2-line stack (DD.MM / YY) — bold, large (~32–40px), acts as visual anchor
  - Col 2: Title (H3 ~22–28px bold) + tag pills below
  - Col 3: Description text, right-aligned or flush to right column edge
- Thin 1px horizontal rules separate each row — NO cards, NO shadows, NO backgrounds
- Thumbnail images are small, square (~64–80px), left of date column — photography is incidental
- Section headers ("Évènements à venir", "Évènements passés") are small-caps labels flush left
- Year markers ("2022", "2023") are enormous, right-aligned — same size as page title, used as temporal anchors

### Content Structure — CV / Bio Layout (Image 1 DNA)
- **2-column layout**: Left ~40% for imagery + section label, Right ~60% for content
- Large portrait photo bleeds to left column edge — no border-radius, no shadow, hard crop
- Bio/intro text is medium-large (~22–28px), bold, spanning the right column — not a subtitle, but a **statement**
- Work experience rendered as a **bare HTML-style table**: Role | Company | Year — 3 columns, 1px bottom border per row, no zebra striping, no hover highlight
- Generous padding between table rows (~14–18px vertical)

### Interaction & Motion
- **Minimal motion** — no parallax, no scroll animations, no page transitions that feel like a PowerPoint
- Hover state on nav: underline appears/disappears, no color change
- Hover state on list rows: subtle 1px rule color change or very light grey fill (max 2% opacity) — imperceptible unless you're paying attention
- Page loads instantly — no splash screen, no loading animation
- If dark/light mode toggle exists: it is a single icon, no label, top-right corner

### Spacing System
- Base unit: **8px**
- Section vertical padding: 80–120px
- Between heading and first content row: 48–64px
- Component internal padding: 16–24px
- Consistent use of `gap` in flex/grid, never magic numbers

---

## 🏗 Sections to Build

### 1. Navigation Bar
- Logo (initials or name, bold)
- Links: Work · About · CV · Process · Contact
- Current page underlined
- Optional: theme toggle (right side)

### 2. Hero / Landing
- Giant name or role title — full-bleed typography
- Optional: one line subtitle in smaller weight
- No hero image — **pure typography is the hero**
- Copyright year floats right, same baseline as title

### 3. Work / Projects Grid
- Items listed as rows (not cards)
- Each row: Index number · Project name · Category tag · Year
- On hover: thumbnail appears as floating layer or row expands
- Click → project detail page

### 4. CV Page
- 2-col layout (image left, content right)
- Bio statement (large bold text)
- Work experience table
- Education table (same structure)
- Skills listed as plain comma-separated text — no skill bars, no percentages

### 5. About
- Large statement text
- Portrait or workspace photo (full bleed)
- Short bio paragraph

### 6. Contact
- Large email address as a link — biggest element on the page
- Social handles below in small text
- Location/availability note

---

## 🔧 Technical Constraints

```
Framework:     HTML/CSS/JS (vanilla) OR React + CSS Modules
Fonts:         Google Fonts — "Neue Haas Grotesk" (or "DM Sans" / "IBM Plex Sans" as fallback)
               Display weight: 700–900 | Body weight: 400
Icons:         None, or a single SVG set (Lucide) — used sparingly
Images:        User-supplied; always displayed without border-radius or decorative shadow
Color tokens:
  --bg:        #F9F8F6
  --fg:        #0D0D0D
  --muted:     #8C8C8C
  --rule:      #D8D5D0
  --accent:    #C97B6E   ← coral/salmon, used sparingly
  --accent-bg: #EDB5A8   ← full page tint when toggled
```

---

## ❌ What NOT to Do (Anti-patterns)

- No rounded corners on cards or containers (border-radius: 0 everywhere)
- No box shadows on content blocks
- No gradient backgrounds
- No icon libraries plastered everywhere
- No "animated counter" or scroll-triggered number reveals
- No sticky sidebar
- No full-screen video autoplay
- No testimonials section
- No "featured in" logo bars
- No chatbot widget
- No cookie banner (it can be added later)
- No Google Maps embed
- No hover-triggered dropdowns in nav
- No carousels / sliders

---

## ✅ Characteristic Details That Make It Swiss

- Thin horizontal rules (1px, `--rule` color) as separators — never decorative borders
- Section numbering: `01 — Working`, `02 — Education` in small caps
- Year displayed as a massive typographic element in timeline sections
- Photography shown without filters in light mode; tinted with `--accent-bg` in pink/dark mode
- All alignment is **grid-column-based**, never centered for decorative reasons
- Tables use `border-collapse: collapse`, bottom-border only, no cell backgrounds
- The overall feeling is a **printed document translated to screen**, not a "digital experience"

---

## 📋 How to Use This Document

1. Feed the content above to your AI in Antigravity IDE as a **system prompt or design context file**
2. Then provide your resume/CV content separately
3. Ask the AI to build one section at a time, referencing this document for all visual decisions
4. For the AI prompt, start with:

> "Using DESIGN.md as the visual and structural reference, build the [section name] for my portfolio. My content is: [paste resume section]. Adhere strictly to the Swiss Rationalist grid, typography scale, and color tokens defined in the design document. Do not deviate from the anti-patterns list."

For Swiss Rationalist + cool animations, the ideal stack is:

GSAP (GreenSock) — industry standard for precise, timeline-based animations. Perfect for the staggered text reveals, line draws, and scroll-triggered entrances this style demands. Not "bouncy" — surgical.
Lenis — smooth scroll library, makes the page feel like a high-end editorial site
Vanilla HTML/CSS/JS or Astro (for a real site) — keeps it lean, no React overhead needed for a portfolio

Why not Framer Motion / CSS animations alone?
GSAP gives you frame-perfect control — essential when the design is this typographically precise. A misaligned stagger ruins the Swiss grid feeling.



---

*Document version: 1.0 — Generated from visual analysis of Swiss Rationalist portfolio references*