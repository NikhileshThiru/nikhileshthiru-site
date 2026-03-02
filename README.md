# Nikhilesh Thiru - Retro Windows 95 Portfolio

My interactive personal portfolio built to feel like a Windows 95 desktop, with boot sequence, draggable app windows, an in-browser "Internet Explorer", and a VS Code-style file explorer/editor.

## Live URL
- https://nikhileshthiru.pages.dev

## Features
- Retro startup flow: "Press any key" -> BIOS-style boot -> desktop
- Draggable/resizable desktop windows (VS Code + Internet Explorer)
- Multi-tab VS Code-like markdown viewer for portfolio content
- Desktop shortcuts for Resume, LinkedIn, GitHub, and X
- External social links open in new browser tabs for reliability
- Mobile responsive behavior for desktop and explorer panels
- SEO files included (`robots.txt`, `sitemap.xml`, social meta tags)

## Tech Stack
- Vite
- Vanilla JavaScript
- HTML/CSS

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
- `script.js` - app logic (boot flow, windows, browser, editor, animations)
- `styles.css` - Win95 UI styling and responsive behavior
- `assets/` - icons, fonts, audio, resume PDF
- `public/` - static SEO and routing files (`404.html`, `robots.txt`, `sitemap.xml`)
