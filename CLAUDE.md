# CLAUDE.md — Lawyer Directory Next.js

## Project Overview

A fully static Next.js 16 site that replicates the WordPress Lawyer Directory theme in design and content. It serves **41,072 attorneys** and **8,618 law firms** across **53 US states/territories**, all from flat JSON files with no database or backend. The site builds to ~49,237 pre-rendered HTML pages.

The design is a pixel-perfect match to the WordPress theme at `/Applications/XAMPP/xamppfiles/htdocs/LawyerDirectory.WordPress/`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom CSS classes in `globals.css` |
| Font | Open Sans (Google Fonts via `<link>` in layout) |
| Data | Static JSON files per state in `src/data/` |
| Rendering | SSG via `generateStaticParams` for static pages; state pages with `?area=` / `?city=` query params are rendered dynamically at request time |

---

## Project Structure

```
lawyer-directory-nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        Root layout (Header + Footer + font link)
│   │   ├── page.tsx                          Homepage
│   │   ├── globals.css                       ALL styles — design tokens + every CSS class
│   │   ├── not-found.tsx                     Custom 404 page
│   │   ├── attorneys/page.tsx                Browse attorneys by state (state cards grid)
│   │   ├── firms/page.tsx                    Browse firms by state (state cards grid)
│   │   └── [state]/
│   │       ├── page.tsx                      State landing + two-step filter + results
│   │       ├── attorneys/[slug]/page.tsx     Attorney profile page
│   │       └── firms/[slug]/page.tsx         Firm profile page
│   ├── components/
│   │   ├── Header.tsx                        Sticky header (client — mobile toggle)
│   │   ├── Footer.tsx                        5-col footer + CTA banner
│   │   ├── FaqSection.tsx                    Accordion FAQ (client — open/close state)
│   │   ├── ContactForm.tsx                   Sidebar contact form (client — submit state)
│   │   ├── HeroSearch.tsx                    Homepage search bar (client — router.push)
│   │   ├── StateLanding.tsx                  State two-step selection UI (client)
│   │   └── USMap.tsx                         Interactive SVG US map (dangerouslySetInnerHTML)
│   ├── data/
│   │   ├── index.json                        Master index (totals + per-state metadata)
│   │   ├── alabama.json                      Per-state data file (one per state)
│   │   └── …                                 53 state files total
│   ├── lib/
│   │   └── data.ts                           All data access functions (server-side)
│   └── types/
│       └── index.ts                          TypeScript interfaces
```

---

## Data Layer

### Source

Attorney and firm data originates from JSONL files in the WordPress theme:
```
LawyerDirectory.WordPress/wp-content/themes/lawyer-directory/data/attorneys/{letter}.jsonl
```

A Python script (`data/generate-state-json.py` in the WordPress project root) converts these JSONL files into per-state JSON files used by this Next.js app.

### Per-state JSON shape

```jsonc
{
  "state": "Alabama",
  "state_abbr": "AL",
  "cities": ["Abbeville", "Adamsville", ...],   // 531 cities (full list — includes empties)
  "counties": ["Autauga County", ...],           // 67 counties
  "attorneys": [ /* Attorney[] */ ],
  "firms":     [ /* Firm[] */    ]
}
```

**Important:** `data.cities` contains the full geographic list for the state, but most cities have zero attorney/firm records. The state page derives `citiesWithData` at runtime by collecting unique `attorney.location.city` and `firm.location.city` values, then filtering out malformed entries (those starting with a digit). Only this derived list is shown to users.

### Index file (`src/data/index.json`)

```jsonc
{
  "total_attorneys": 41072,
  "total_firms": 8618,
  "state_count": 53,
  "states": [
    { "state": "Alabama", "state_abbr": "AL", "file": "alabama.json",
      "attorney_count": ..., "firm_count": ..., "city_count": ..., "county_count": ... },
    ...
  ]
}
```

### Data access (`src/lib/data.ts`)

| Function | Description |
|---|---|
| `getIndex()` | Returns the master index |
| `getStateData(stateSlug)` | Returns full state data or null |
| `getAttorney(stateSlug, slug)` | Finds one attorney within a state |
| `getFirm(stateSlug, slug)` | Finds one firm within a state |
| `getAllStateSlugs()` | All 53 state slugs for `generateStaticParams` |
| `getAllAttorneySlugs()` | All attorney `{state, slug}` pairs — used for static generation of 40k+ pages |
| `getAllFirmSlugs()` | All firm `{state, slug}` pairs |

---

## Routing

| URL pattern | Page | Notes |
|---|---|---|
| `/` | Homepage | Static |
| `/attorneys` | Browse attorneys by state | Accepts `?location=` / `?area=` |
| `/firms` | Browse firms by state | Accepts `?location=` / `?area=` |
| `/{state}` | State landing page | Two-step flow (see below) |
| `/{state}?area={area}` | State — step 2 (pick city) | Partial selection |
| `/{state}?city={city}` | State — step 2 (pick area) | Partial selection |
| `/{state}?area={area}&city={city}` | State results | Shows filtered attorneys + firms |
| `/{state}/attorneys/{slug}` | Attorney profile | Static |
| `/{state}/firms/{slug}` | Firm profile | Static |

State slugs are lowercased state names with spaces replaced by hyphens (e.g. `new-york`, `district-of-columbia`).

---

## State Page Two-Step Flow

The state page (`[state]/page.tsx`) enforces a two-step selection before showing results. The `StateLanding` client component handles the UI for steps 1 and 2.

### Step logic (server component)

```
No params          → StateLanding (step 1: full tabs)
?area= only        → StateLanding with selectedArea (step 2: pick city)
?city= only        → StateLanding with selectedCity (step 2: pick area)
?area= + ?city=    → Render filtered results directly (no StateLanding)
```

### StateLanding behaviour

- **Step 1** (`isStep1`): Shows two tabs — "Legal Issues" and "{State} Cities". Both step indicators are empty.
- **Step 2a** (`isPickingLocation`): Area is selected. Only the Cities tab is shown. A green notice confirms the chosen area with a "Change" link. Step 1 indicator shows ✓.
- **Step 2b** (`isPickingArea`): City is selected. Only the Legal Issues tab is shown. Step 1 indicator shows ✓.
- Clicking a card in step 2 navigates to the full `?area=…&city=…` URL, which renders results server-side.

### City list filtering

`citiesWithData` is derived from actual attorney/firm `location.city` values — not from `data.cities`. This prevents showing cities with zero records. Entries starting with a digit (malformed zip-prefixed values like `"35401 Tuscaloosa"`) are also excluded.

```typescript
const citiesWithData = Array.from(new Set([
  ...data.attorneys.map(a => a.location.city).filter(Boolean),
  ...data.firms.map(f => f.location.city).filter(Boolean),
])).filter(c => !/^\d/.test(c)).sort() as string[]
```

### Results page

When both `area` and `city` are present:
- Attorneys filtered by: `practice_areas` includes `area` (case-insensitive) AND `location.city` matches `city` (case-insensitive)
- Firms filtered the same way
- Active filter tags shown in the header (each has a × to remove that single filter)
- Sidebar shows "Change Legal Issue" and "Change City" lists for quick pivoting

---

## Interactive US Map

`USMap.tsx` renders the full SVG US map (~150 KB) via `dangerouslySetInnerHTML` to avoid React TypeScript conflicts with SVG attribute types. The SVG was auto-generated from the WordPress `home-map.php` file — all state `href` attributes point to `/{state}`.

State fill color is `#FF6600`, set via:
```css
.map-module-svg-state-graphic { fill: #FF6600; transition: fill .15s; }
```

Hover darkens to `var(--orange)` (`#F9593A`).

---

## Homepage Search (`HeroSearch.tsx`)

Client component. On submit:
- If the location input exactly matches a state name, abbreviation, or slug → `router.push('/{state}')` (goes to state landing)
- Otherwise → `router.push('/attorneys?location=…&area=…')` (goes to browse page)

---

## Styling

**Critical rule: no inline styles anywhere.** Every style must be a named CSS class in `src/app/globals.css`.

### Design tokens (CSS custom properties)

```css
--blue:         #196AC8   /* primary, links, buttons */
--orange:       #F9593A   /* CTA buttons, hover accents */
--dark:         #424A5B   /* headings and body text */
--yellow:       #FDCE43   /* header "List Your Practice" button */
--gray-text:    #AAAAAA
--gray-border:  #D8D8D8
--gray-light:   #F4F6F5   /* section backgrounds */
```

### Key CSS class groups

| Prefix | Used for |
|---|---|
| `.hero-*`, `.hsf-*` | Homepage hero section + search form |
| `.archive-*`, `.asf-*` | Archive page header + search form |
| `.lawyer-card`, `.llc-*` | Attorney/firm cards in listing pages |
| `.sp-*` | Single profile pages (hero, body, sidebar, contact form) |
| `.sl-*` | State landing page (hero card, tabs, step progress, filter bar) |
| `.footer-*`, `.cta-banner`, `.copyright-bar` | Footer |
| `.llc-av-1…8` | Dynamic avatar background colors (hash-based, 8 slots) |
| `.avatar--blue/orange/green/purple` | Testimonial avatar colors (homepage) |
| `.category-row--pi/fl/re/cd` | Practice area row gradient backgrounds |
| `.map-module-*` | Interactive US map section |
| `.states-grid`, `.state-card` | Browse attorneys/firms by state grids |
| `.notfound-*`, `.btn-notfound-*` | 404 page |

### Breadcrumbs on dark backgrounds

Use `.sl-breadcrumb--light` alongside `.sl-breadcrumb` to switch all text to white variants. Plain `<span>` children (non-link items) get `color: rgba(255,255,255,0.8)` — same as links — so all crumbs appear uniform.

### Font

Google Fonts (Open Sans) is loaded via `<link>` tags in `src/app/layout.tsx`, **not** via `@import` in CSS. Tailwind v4's PostCSS expansion causes `@import url()` in CSS to be placed after CSS rules in the generated output, violating the CSS spec.

---

## Components

### Server components (default)
- `src/app/layout.tsx` — root shell
- `src/app/page.tsx` — homepage (static data only)
- `src/app/[state]/page.tsx` — state landing + results (reads `searchParams`)
- `src/app/[state]/attorneys/[slug]/page.tsx` — attorney profile
- `src/app/[state]/firms/[slug]/page.tsx` — firm profile
- `src/app/attorneys/page.tsx` — browse attorneys by state
- `src/app/firms/page.tsx` — browse firms by state

### Client components (`'use client'`)
- `Header.tsx` — mobile menu toggle
- `FaqSection.tsx` — accordion open/close
- `ContactForm.tsx` — form submit success state
- `HeroSearch.tsx` — search input with client-side state routing
- `StateLanding.tsx` — two-step state selection (tab switching, navigation)
- `USMap.tsx` — SVG map rendered via `dangerouslySetInnerHTML`

---

## Avatar Colors

Deterministic hash assigns one of 8 background color classes based on the name string. Same function is duplicated in `[state]/page.tsx`, `[state]/attorneys/[slug]/page.tsx`, and `[state]/firms/[slug]/page.tsx`.

```typescript
const avatarClasses = ['llc-av-1','llc-av-2','llc-av-3','llc-av-4','llc-av-5','llc-av-6','llc-av-7','llc-av-8']
function avatarClass(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return avatarClasses[h % avatarClasses.length]
}
```

---

## Common Commands

```bash
# Start dev server
npm run dev
# → http://localhost:3000

# Type check
npx tsc --noEmit

# Production build (generates all ~49,237 static pages)
npm run build
```

### Static export for deployment

To produce a deployable `out/` folder (for InfinityFree or any static host):

1. Add `output: 'export'` to `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = { output: 'export' }
   ```
   **Note:** With `output: 'export'`, `searchParams` is unavailable in server components, so the state page two-step flow (which uses `?area=` / `?city=`) would need to be refactored to use client-side state or a different URL scheme (e.g. path segments).

2. Run `npm run build` — the `out/` directory contains the full static site.
3. Upload `out/` contents via FTP (Cyberduck) to InfinityFree's `htdocs/` folder.

---

## Data Regeneration

If the WordPress JSONL source files are updated, regenerate the state JSON files:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/LawyerDirectory.WordPress
python3 data/generate-state-json.py
```

Then copy the output JSON files into `src/data/` and rebuild.

---

## Known Gaps / Future Work

- **Attorney photos**: The `Attorney.photo` field may contain a remote URL. Profile pages show the photo if it starts with `http`, otherwise show the initial avatar. Photos are not bundled in this project.
- **Pagination**: The results page currently caps at 20 attorneys and 10 firms. Pagination UI exists in `globals.css` (`.ld-pagination`) but is not yet wired up.
- **`<img>` vs `next/image`**: Profile pages use a plain `<img>` for external photo URLs. Switching to `next/image` with `unoptimized={true}` would silence the lint warning.
- **Static export compatibility**: The `?area=&city=` query-param flow on state pages requires a server (or dynamic rendering). If deploying as a pure static export, the filter flow would need to be redesigned.
