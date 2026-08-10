# FOLIO - Design Methodology

## 1. Executive Summary & Vision
FOLIO is designed as a modern, high-performance academic management system and AI-assisted study studio tailored for students. The design philosophy centers around **distraction-free productivity**, **compact spatial organization**, and **visual clarity**.

---

## 2. Core UI/UX Design System

### 🎨 Color Palette & Visual Language
- **Primary Surface**: Slate-Gray Design System (`#0f172a`, `#1e293b`, `#334155`, `#475569`).
- **Accent Tones**: Soft Warm Pastel Amber (`#fef3c7`, `#fde68a`, `#amber-300`) for folder components and soft emerald (`#emerald-50`, `#emerald-600`) for success states.
- **Typography**: Crisp modern sans-serif for UI labels paired with monospace fonts for codes, USNs, and numerical statistics (`font-mono`).

### 📐 Spatial Layout & Viewport Architecture
- **Single-Page Compact Viewport**: Formatted within a fixed vertical bounds (`max-w-6xl`) to avoid unnecessary browser page scrolling.
- **Collapsible Sidebar Navigation**: A slim navigation bar featuring active tab highlighting, unclipped branding logo, collapsed icon mode, and quick account access.
- **Top Header Bar**: Houses omni-search autocomplete with instant redirection, visual highlight triggers, and an animated **Study Streak Badge** (`12 Day Streak`) in the top-right position.

---

## 3. Component Design Patterns

### 📁 3D Interactive Subject Folders (`folder.tsx`)
- Constructed with CSS 3D perspective layers (`[perspective:1000px]`, `rotateX`).
- Soft pastel amber tones (`amber-300`, `amber-100`) to provide a tactile, physical paper folder feel.
- Multi-layer depth with smooth hover micro-animations (`rotateX(-46deg)_translateY(1px)`).

### 📊 Visx & Motion Data Visualizations (`bar-chart.tsx`)
- Powered by `@visx/scale`, `@visx/gradient`, and `@visx/grid` combined with `motion/react`.
- Bar charts utilize standing rectangular ends (`lineCap="butt"`), custom linear gradients (`from-slate-900 to-slate-600`), SVG line indicators, and crosshair-free interactive tooltips.
- Staggered CSS width transition animations (`transition-all duration-1000 ease-out`) triggered on tab open.

### 🔔 Universal Dialog & Modal System
- Replaced native browser `alert()` popups with custom-themed dialog modals.
- Structured with backdrop blur (`backdrop-blur-xs`), soft rounded borders (`rounded-2xl border-slate-200`), and context-aware icons (Emerald checkmark for success, Amber triangle for warnings, Slate sparkle for info).

---

## 4. User Experience (UX) Principles
1. **Direct In-App Preview vs. Download**: Differentiated document viewing (`View In-App`) from device disk exports (`Download`) to ensure students can inspect notes without cluttering local downloads.
2. **Tab State Persistence**: Uses `localStorage` key `folio_active_tab` to ensure refreshing the page preserves the active view state.
3. **Omni-Search Autocomplete**: Global search matching across folders, documents, settings, deadlines, and pages with instant redirection and glow highlights.
