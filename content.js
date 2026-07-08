// All portfolio content lives here. To update the site, edit this file only:
//  - treeData controls what shows in the VS Code explorer
//  - files maps each tree path to its markdown content
//  - Image tip: append #w=240 to an image URL to render it 240px wide;
//    put several images on one line to show them side by side.

export const DEFAULT_FILE = "nikhileshthiru/README.md";

export const resumePdfUrl = new URL("./assets/Nikhilesh_Thiruvengadam.pdf", import.meta.url).href;

export const profileLinks = {
  linkedin: "https://www.linkedin.com/in/nikhilesh-thiruvengadam",
  github: "https://github.com/NikhileshThiru",
  x: "https://x.com/NikhileshThiru",
};

export const treeData = {
  name: "nikhileshthiru",
  type: "folder",
  open: true,
  children: [
    { name: "README.md", type: "file" },
    {
      name: "projects",
      type: "folder",
      open: true,
      children: [
        {
          name: "refnet",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "terminal",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "lifetracker",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "octave",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "runaround",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "tweetagent",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
        {
          name: "nikhileshthiru-site",
          type: "folder",
          open: false,
          children: [{ name: "README.md", type: "file" }],
        },
      ],
    },
    {
      name: "work-experience",
      type: "folder",
      open: false,
      children: [{ name: "README.md", type: "file" }],
    },
    {
      name: "skills",
      type: "folder",
      open: false,
      children: [{ name: "README.md", type: "file" }],
    },
    {
      name: "contact",
      type: "folder",
      open: false,
      children: [{ name: "README.md", type: "file" }],
    },
  ],
};

export const files = {
  "nikhileshthiru/README.md": {
    type: "markdown",
    content: `# Nikhilesh Thiruvengadam

Co-founder & CTO @ Scribur | Computer Science @ Georgia Tech (AI + Systems Architecture) | GPA: 4.00/4.00

I build production software end to end — AI/ML systems, full-stack products, and the infrastructure underneath them. Currently building Scribur, the operating system for UGC teams.

## Highlights

- Co-founder & CTO at Scribur — a multi-portal SaaS platform that runs a brand's entire creator operation, from onboarding to payout. Technical lead for the architecture and AI platform.
- HackGT 12 (2025): 2nd Overall Winner for RefNet, an AI research platform spanning 250M+ papers.
- Georgia Tech Undergraduate Researcher — machine learning for RF anomaly detection, processing 10M+ IQ samples daily.
- Shipped six end-to-end products in the past year, from a fully on-device-AI iPhone app to an autonomous LLM trading research terminal that grades its own predictions.

## Start Here

- Open projects/ — selected builds, each with the engineering story behind it.
- Open work-experience/ — roles and measurable impact.
- Open skills/ — the current stack.
- Open contact/ — get in touch.
`,
  },

  "nikhileshthiru/projects/refnet/README.md": {
    type: "markdown",
    content: `# RefNet — Research Paper Search & Citation Network Visualization

🏆 2nd Place Overall Winner at HackGT 12 (2025)

Search 250M+ research papers and explore their citation networks as an interactive graph, with an AI research assistant that understands the papers you have selected — and can generate a full literature review from them.

![RefNet citation graph](https://raw.githubusercontent.com/NikhileshThiru/RefNet/main/docs/screenshot.png)

## What it does

- Search papers by title, author, topic, or keyword across the OpenAlex corpus, then build a citation network from any set of results.
- Interactive D3.js graph with zoom, pan, drag, timeline-based color coding, and multi-paper network merging.
- AI assistant (GPT-4o) grounded in the selected papers and graph context: compare papers, spot patterns, find research gaps.
- One-click literature review generation — AI-written sections with academic formatting and PDF export.

## Engineering story

- Sub-1s rendering for 1,000+ node graphs through render optimization.
- Three coordinated services: a Flask search API over OpenAlex, an Express + Mastra AI backend, and a React frontend — Dockerized and deployed on AWS EC2.
- Built in 36 hours with a team of four; judged 2nd overall out of the full HackGT field.

## Stack

React, D3.js, Flask, Express.js, NetworkX, OpenAI GPT-4o, OpenAlex API, Docker, AWS EC2.

## Links

- GitHub: https://github.com/NikhileshThiru/RefNet
- Devpost: https://devpost.com/software/refnet-c04g9n
`,
  },

  "nikhileshthiru/projects/terminal/README.md": {
    type: "markdown",
    content: `# Terminal — AI-Native Trading Research Platform

An autonomous research terminal that watches the entire US stock market all day. When something material happens — an 8-K filing, an earnings headline, a scheduled catalyst — an LLM reads it, researches the stock with real market data, and writes a structured options thesis. Deterministic risk rules decide whether it paper-trades. Then the part that makes the project honest: every prediction is graded against what the market actually did.

![Terminal dashboard](https://raw.githubusercontent.com/NikhileshThiru/terminal/main/docs/screenshots/redesign-2026-06-12/dashboard.png)

## Engineering story

- Full pipeline: market-wide news/filings ingestion -> triage LLM -> tool-calling thesis agent -> grounding check -> deterministic risk gates -> simulated fill -> graded outcome.
- The grounding check verifies every number the model cites against the data it actually fetched — built after a real incident where the model fabricated revenue figures and the system persisted them.
- Risk and sizing are pure code: the LLM's self-reported confidence never gates execution. Two paper accounts run the same theses through different confidence thresholds — an A/B test of whether LLM confidence carries any signal.
- Forward-tested eval harness scores every thesis per catalyst type with hit rate, Brier score, and calibration plots — backtesting an LLM is meaningless because the model has seen history in training.
- 293 backend + 25 frontend tests, ruff/mypy/tsc clean, CI on every push, five ADRs recording the load-bearing design decisions.

## Stack

Python, PostgreSQL, LLM tool-calling agents, Alpaca websockets, SEC EDGAR, Finnhub, FRED, React + TypeScript, SSE streaming, Docker.

## Links

- GitHub: https://github.com/NikhileshThiru/terminal
`,
  },

  "nikhileshthiru/projects/lifetracker/README.md": {
    type: "markdown",
    content: `# LifeTracker — Voice-First Personal Timeline for iPhone

Press the Action Button, say what you're doing, and your day structures itself. Say "class from 3:30 to 5:30, then I'll hit the gym" and the timeline shows a pinned class block with a planned gym block after it. Entirely on-device — no server, no account, no data leaving the phone.

![Today timeline](https://raw.githubusercontent.com/NikhileshThiru/lifetracker/main/docs/screenshots/today.png#w=230) ![Voice capture](https://raw.githubusercontent.com/NikhileshThiru/lifetracker/main/docs/screenshots/capture.png#w=230) ![Weekly stats](https://raw.githubusercontent.com/NikhileshThiru/lifetracker/main/docs/screenshots/stats.png#w=230)

## Engineering story

- The hybrid parser contract: the on-device LLM (Apple FoundationModels, ~3B params) is only allowed to read speech into stated structure — activities, times as spoken, temporal state. It never sees the database and never computes a date.
- All precise work happens in deterministic, fully unit-tested Swift: resolving clock times against an injected now + timezone, matching "done with X" to the actual open block, chaining multi-activity check-ins, recomputing gaps.
- Every check-in writes revision rows grouped by batch, which makes whole-check-in undo trivial.
- Parsing failures degrade gracefully — the raw transcript is always persisted and re-parseable. 93 tests passing.

## Stack

Swift 6, SwiftUI, Apple FoundationModels (on-device LLM), SpeechAnalyzer live transcription, GRDB/SQLite, App Intents.

## Links

- GitHub: https://github.com/NikhileshThiru/lifetracker
`,
  },

  "nikhileshthiru/projects/octave/README.md": {
    type: "markdown",
    content: `# Octave — Know Every Word, Live

Hold your phone up to any speaker — Octave identifies the song and drops you into a synced lyric view at the exact line playing right now, staying in sync for the rest of the track.

![Listening](https://raw.githubusercontent.com/NikhileshThiru/octave/main/media/octave-listening.png#w=230) ![Synced lyrics](https://raw.githubusercontent.com/NikhileshThiru/octave/main/media/octave-now-playing.jpg#w=230)

## Engineering story

- Real audio pipeline: the browser records 7-second mic clips, downsamples to 16 kHz mono WAV in JavaScript, and posts them to a FastAPI backend — no server-side audio decoding needed.
- Drift-corrected lyric sync: the lyric clock is seeded with the fingerprint match's play offset plus measured recognition, lookup, and render latency, then re-identifies every 30 seconds to correct drift over long sessions.
- Confidence-aware matching: borderline fingerprint matches need corroboration before the app commits to a song.
- Graceful degradation: after repeated fingerprint misses, the backend lazy-loads Whisper, transcribes locally, and searches lyrics by transcript instead.
- Secure API boundary: ACRCloud request signing, lyric lookup, and Whisper all run server-side — secrets never ship to the browser.

## Stack

React, Vite, Tailwind CSS, FastAPI, Python, ACRCloud fingerprinting, LRCLIB synced lyrics, Whisper fallback.

## Links

- GitHub: https://github.com/NikhileshThiru/octave
`,
  },

  "nikhileshthiru/projects/runaround/README.md": {
    type: "markdown",
    content: `# RunAround — Running Intelligence Platform

Turns my Strava history into a public-safe portfolio dashboard, a private owner console with AI coaching, and a long-term 3D journey across every US state and around the world — rendered on a hand-built Three.js globe.

![RunAround dashboard](https://raw.githubusercontent.com/NikhileshThiru/runaround/main/public/screenshots/dashboard.png)

## Engineering story

- Custom Three.js globe: depth-tested Natural Earth vectors, great-circle routing, position interpolation, tooltip raycasting, and reduced-motion support — no globe library.
- Athlete intelligence engine computes adaptive training load, CTL/ATL/form, weekly baselines, cadence normalization, and fatigue flags from raw activity history.
- Privacy by construction: public visitors see a Zod-validated, denylist-by-construction snapshot — GPS streams, tokens, exact start times, and provider metadata can never reach the public artifact.
- Deterministic coaching guardrails (fatigue floor, hard-effort spacing, mileage ceiling) run before Gemini is ever called; AI assessments are owner-only and cached per activity.
- Vitest covers the algorithms and snapshot sanitation; Playwright covers public navigation and responsive layouts. CI on every push.

## Stack

TypeScript, React, Three.js, Strava API, Gemini, Vercel serverless, Zod, Vitest, Playwright.

## Links

- Live: https://run-around.vercel.app
- GitHub: https://github.com/NikhileshThiru/runaround
`,
  },

  "nikhileshthiru/projects/tweetagent/README.md": {
    type: "markdown",
    content: `# TweetAgent — AI Drafts Grounded in Live News

An AI writing assistant that reacts to real, current news and drafts tweets in your voice — with a review UI that learns your taste over time. Runs entirely on free tiers with no server to manage.

![TweetAgent review interface](https://raw.githubusercontent.com/NikhileshThiru/TweetAgent/main/docs/screenshot.png)

## Engineering story

- News-grounded, not hallucinated: every draft reacts to a real item fetched seconds earlier from Hacker News, Google News, and market feeds, with a hard 30-hour freshness cap.
- A feedback loop that learns your voice: approvals become "write more like these," trashes become "avoid these," in-card edits teach exact phrasing, and a persistent steering field holds standing rules — all in-context, no fine-tuning.
- Fail-soft ingestion: each news source is independent, so a downed or rate-limited feed gets skipped with a log line instead of crashing the run.
- Layered output validation: model output is JSON-schema-constrained, then re-validated before anything is queued. 28 tests passing.
- Postgres row-level security locks the data to the owner while the sign-in page stays public.

## Stack

Python (Vercel serverless), React + TypeScript, Supabase (Postgres, Auth, Cron), Gemini, magic-link auth.

## Links

- Live: https://tweet-agent-ten.vercel.app
- GitHub: https://github.com/NikhileshThiru/TweetAgent
`,
  },

  "nikhileshthiru/projects/nikhileshthiru-site/README.md": {
    type: "markdown",
    content: `# nikhileshthiru-site — This Website

The site you're using right now: an interactive portfolio built to feel like a Windows 95 desktop, with a BIOS boot sequence, draggable and resizable app windows, a working in-browser "Internet Explorer", and this VS Code-style markdown viewer.

## How it works

- Retro startup flow: "Press any key" -> BIOS POST screen -> desktop, with period-correct startup sounds.
- A small window manager in vanilla JavaScript: drag, resize from all eight edges, minimize, maximize, focus stacking, and a live taskbar.
- The VS Code window renders markdown line-by-line with syntax-style highlighting, inline images, tabs, and a file explorer.
- No frameworks — Vite, vanilla JavaScript, HTML, and CSS. All content is plain markdown in one data module.

## Links

- Live: https://nikhileshthiru.pages.dev
- GitHub: https://github.com/NikhileshThiru/nikhileshthiru-site
`,
  },

  "nikhileshthiru/work-experience/README.md": {
    type: "markdown",
    content: `# Work Experience

## Scribur — Co-founder & CTO (May 2026 – Present)
The operating system for UGC teams — one workspace that runs a brand's entire creator operation, from onboarding to payout.

- Technical lead behind Scribur's architecture and AI platform.
- Built a multi-portal workspace (admin / business / manager / creator) spanning creator CRM, campaign pipeline, deliverable reviews, native messaging, automated payouts, analytics, and billing — 400+ source files in production.
- Enforced per-business data isolation at the database level with PostgreSQL row-level security — one business can never access another's data.
- Built Scribur AI, a workflow-aware assistant grounded in live workspace data: creator analysis, script and hook generation, deadline nudges, and campaign retrospectives.
- Stack: React, TypeScript, Tailwind, shadcn/ui, Supabase (PostgreSQL), Stripe.

## Georgia Tech — Undergraduate Researcher (Aug 2025 – May 2026)
Machine Learning for Anomaly Detection in RF Systems

- Improved anomaly detection accuracy by 32% through zero-shot and continual learning experiments.
- Processed 10M+ IQ samples daily using multimodal pipelines (IQ, spectrogram, PCA features).
- Reduced false positives by 25% via fusion-based model strategies.
- Increased experiment throughput by 40% through reusable preprocessing and tracking workflows.
- Deployed trained models to USRP hardware for live jamming and spoofing anomaly detection.

## IBeeAnalytics — Software Engineering Intern (Aug 2023 – May 2025)
Web Development and Client Solutions Team

- Built and maintained websites and dashboards across 15+ production client projects.
- Automated CI/CD workflows (Vercel + AWS) for zero-downtime rollouts.
- Improved internal template setup speed by 45% and performance by 35%.
- Supported debugging and reliability efforts across 20+ active client codebases.
`,
  },

  "nikhileshthiru/skills/README.md": {
    type: "markdown",
    content: `# Skills

## Languages
- Python, TypeScript, JavaScript, Swift, Java, SQL, HTML/CSS

## AI / ML
- PyTorch, zero-shot and continual learning, fusion models
- LLM agent systems: tool-calling loops, structured/guided generation, grounding checks against fetched data
- Evaluation: forward-tested eval harnesses, Brier score, calibration analysis
- On-device AI: Apple FoundationModels, SpeechAnalyzer; hosted: OpenAI, Gemini, Whisper

## Frontend
- React, SwiftUI, Vite, Tailwind CSS, shadcn/ui, Three.js, D3.js

## Backend & Data
- FastAPI, Flask, Node.js, Supabase, PostgreSQL (with row-level security), Stripe, WebSockets, SSE, REST APIs

## Infrastructure & Tooling
- Docker, Git, GitHub Actions CI, Vercel serverless, AWS (EC2), Linux
- Testing: pytest, Vitest, Playwright, XCTest

## Certifications
- IT Specialist – Software Development
- Microsoft Office Specialist: PowerPoint Associate
`,
  },

  "nikhileshthiru/contact/README.md": {
    type: "markdown",
    content: `# Contact

- Email (Primary): nikhilesh.thiru@gmail.com
- Email (Academic): nthiruve3@gatech.edu
- Phone: 470-621-5274
- LinkedIn: ${profileLinks.linkedin}
- GitHub: ${profileLinks.github}
- X: ${profileLinks.x}
- Resume: [Resume.pdf](${resumePdfUrl})
- Location: Atlanta, Georgia, United States
`,
  },
};

// Optional: map a file path to a remote base URL so relative links/images in
// that file resolve against the original repo (used when mirroring a repo's
// README verbatim). Curated pages use absolute URLs, so this is empty today.
export const markdownRemoteBases = new Map();
