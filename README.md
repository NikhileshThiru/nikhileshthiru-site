# Nikhilesh Thiru - Retro Windows 95 Portfolio

My interactive personal portfolio built to feel like a Windows 95 desktop, with boot sequence, draggable app windows, an in-browser "Internet Explorer", a real Start menu, and a VS Code-style file explorer/editor.

## Live URL
- https://nikhileshthiru.pages.dev

## Features
- Retro startup flow: "Press any key" -> BIOS-style boot -> desktop (any key skips the boot)
- Draggable/resizable desktop windows (VS Code + Internet Explorer)
- Working Win95 Start menu (apps, resume, social links, restart)
- Multi-tab VS Code-like markdown viewer for portfolio content, with inline project screenshots
- Desktop shortcuts for Resume, LinkedIn, GitHub, and X
- Mobile responsive behavior for desktop and explorer panels
- SEO files included (`robots.txt`, `sitemap.xml`, social meta tags)

## Tech Stack
- Vite
- Vanilla JavaScript
- HTML/CSS

## Updating the site (the important part)

All portfolio content lives in **`content.js`** — projects, work experience, skills, contact. The rest of the code never needs to change for a content update.

To add a new project:
1. `npm run sync` — lists every GitHub repo and flags ones missing from the site; it downloads their READMEs into `scripts/sync-cache/` as raw material
2. Add a curated entry to `content.js` (`files` + `treeData`), following the existing pages: one-liner, screenshot, "Engineering story" bullets, stack, links
3. Screenshots hot-link straight from the repo: `https://raw.githubusercontent.com/NikhileshThiru/<repo>/<branch>/<path>` — append `#w=230` to an image URL to size it (put several on one line for side-by-side)
4. `npm run dev` to preview, commit, push to deploy

Smaller updates (new job, skills, location) are one edit in `content.js`.

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run preview
```

## Deploy (Cloudflare Pages)
- Build command: `npm run build`
- Output directory: `dist`
- Production URL target: `nikhileshthiru.pages.dev`

## Project Structure
- `index.html` - app shell and desktop/window markup
- `content.js` - ALL portfolio content (edit this to update the site)
- `script.js` - app logic (boot flow, windows, browser, editor, animations)
- `styles.css` - Win95 UI styling and responsive behavior
- `scripts/sync-projects.mjs` - `npm run sync`: GitHub vs site freshness check
- `assets/` - icons, fonts, audio, resume PDF
- `public/` - static SEO and routing files (`404.html`, `robots.txt`, `sitemap.xml`)
