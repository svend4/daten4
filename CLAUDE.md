# CLAUDE.md - AI Assistant Guide for daten4

## Project Overview

**daten4** is a Dynamic Event Planner (Динамический Планировщик) — a self-contained single-page application built with React 19. The entire application (HTML, CSS, JavaScript) is bundled into standalone HTML files that run directly in any modern browser with zero server dependencies.

The application language/UI is in **Russian**.

## Repository Structure

```
daten4/
├── README.md                        # Brief project description
├── CLAUDE.md                        # This file
├── dynamic-planner (1).html         # Primary production build (~440 KB)
├── dynamic-planner(8).html          # Variant build (~443 KB)
├── dynamic-planner-DEMO.html        # Demo version with pre-loaded sample data (~449 KB)
└── dynamic-planner-v2.html          # Version 2.0, lighter build (~240 KB)
```

There are no subdirectories, no `package.json`, and no build configuration files in this repository. The HTML files are pre-built bundles uploaded directly.

## Technology Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | React 19.2.0 (bundled inline)           |
| Language     | JavaScript (ES6+, minified)             |
| Styling      | CSS with custom properties (Tailwind-derived patterns) |
| Persistence  | Browser `localStorage`                  |
| Bundler      | Vite (inferred from module preload patterns) |
| Deployment   | Static HTML files (no server required)   |

## Architecture

### Single-File Application Pattern

Each `.html` file is a fully self-contained SPA:
- `<style>` block with all CSS (custom properties for theming)
- `<div id="root">` mount point
- `<script type="module">` with the entire React application bundled and minified inline

### Key Application Features

- **Template creation and management** — create reusable form templates with sections and fields
- **Form filling** — fill out forms based on templates
- **Drag-and-drop** — reorder sections and fields via drag-and-drop API
- **Conditional fields** — fields can be shown/hidden based on conditions
- **Autofill/suggestions** — input fields with autocomplete from previous entries
- **Data persistence** — all data saved to `localStorage`
- **Responsive design** — mobile-friendly with breakpoints at 768px

### CSS Design System

The application uses CSS custom properties for consistent theming:

```css
--primary: #3b82f6;      --primary-dark: #2563eb;
--success: #10b981;       --danger: #ef4444;
--warning: #f59e0b;       --secondary: #6b7280;
--background: #f9fafb;    --surface: #ffffff;
--border: #e5e7eb;        --text: #111827;
--text-light: #6b7280;
--shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, .1);
```

### Component Patterns

- React functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`)
- State managed locally via React hooks (no external state library)
- Grid-based card layouts (`card-grid` with `auto-fill, minmax(300px, 1fr)`)
- BEM-inspired CSS class naming (`.card-header`, `.card-description`, `.card-actions`)

## File Versions

| File | Description |
|------|-------------|
| `dynamic-planner (1).html` | Main build, fully minified |
| `dynamic-planner(8).html` | Iteration variant, similar to main |
| `dynamic-planner-DEMO.html` | Includes pre-loaded demo/sample data for testing |
| `dynamic-planner-v2.html` | Version 2.0 — lighter build with readable CSS |

The `v2` file has more readable CSS (not as aggressively minified) and is roughly half the size of the other builds.

## Development Workflow

### No Build Pipeline in Repo

The source code and build tooling are **not** in this repository. This repo contains only the built output HTML files. Development likely happens in a separate environment with Vite, and the bundled HTML is uploaded here.

### How to Run

Open any `.html` file directly in a modern browser. No web server is needed. All functionality works via `file://` protocol since there are no external dependencies.

### How to Test

Open `dynamic-planner-DEMO.html` for a version pre-loaded with sample data. For other files, use the UI to create templates, add sections/fields, and fill forms.

### Data Storage

All application data is stored in the browser's `localStorage`. Clearing browser data will reset the application.

## Conventions for AI Assistants

### Code Modifications

- The HTML files contain **minified/bundled code** — direct editing is impractical for most changes
- The `v2` file has slightly more readable CSS but the JavaScript is still minified
- For meaningful code changes, the source (likely a Vite/React project) would need to be obtained separately
- Small CSS-level tweaks can be made in the `<style>` block of `dynamic-planner-v2.html`

### Naming and Language

- The application UI is in **Russian** — preserve Russian text in any modifications
- File names use the pattern `dynamic-planner[-variant].html`
- CSS classes follow English naming with BEM-like conventions

### Git Practices

- Commit messages have been simple and descriptive (e.g., "Add files via upload")
- The repository uses direct file uploads rather than a CI/CD pipeline
- The `main` branch contains the production files

### What NOT to Do

- Do not attempt to "un-minify" and restructure the JavaScript — the source lives elsewhere
- Do not add build tooling (package.json, webpack, etc.) unless explicitly requested
- Do not remove any HTML file variant without explicit approval — each serves a purpose
- Do not change the `localStorage` key structure without understanding the data model

## Browser Requirements

- ES6+ JavaScript support (modules, arrow functions, destructuring)
- `localStorage` API
- CSS custom properties
- HTML5 Drag and Drop API
- Modern browser (Chrome 80+, Firefox 80+, Safari 14+, Edge 80+)
