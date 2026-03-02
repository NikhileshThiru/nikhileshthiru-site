"use strict";

const DEFAULT_FILE = "nikhileshthiru/README.md";

const screens = {
  preboot: document.getElementById("preboot"),
  boot: document.getElementById("boot"),
  desktop: document.getElementById("desktop"),
};

const biosText = document.getElementById("biosText");
const biosAudio = document.getElementById("biosAudio");
const startupAudio = document.getElementById("startupAudio");
const soundToggle = document.getElementById("soundToggle");

const desktopSurface = document.getElementById("desktopSurface");
const vscodeDesktopIcon = document.getElementById("vscodeDesktopIcon");
const ieDesktopIcon = document.getElementById("ieDesktopIcon");
const resumeDesktopIcon = document.getElementById("resumeDesktopIcon");
const linkedinDesktopIcon = document.getElementById("linkedinDesktopIcon");
const githubDesktopIcon = document.getElementById("githubDesktopIcon");
const xDesktopIcon = document.getElementById("xDesktopIcon");
const tesseractCanvas = document.getElementById("tesseractCanvas");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const taskbar = document.getElementById("taskbar");
const taskbarApps = document.getElementById("taskbarApps");
const clock = document.getElementById("clock");

const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const treeToggle = document.getElementById("treeToggle");
const vscodeWindow = document.getElementById("vscodeWindow");
const browserWindow = document.getElementById("browserWindow");
const browserForm = document.getElementById("browserForm");
const browserInput = document.getElementById("browserInput");
const browserFrame = document.getElementById("browserFrame");
const browserBack = document.getElementById("browserBack");
const browserForward = document.getElementById("browserForward");
const browserRefresh = document.getElementById("browserRefresh");
const browserHome = document.getElementById("browserHome");
const browserDirectLink = document.getElementById("browserDirectLink");

const fileTree = document.getElementById("fileTree");
const editorTabs = document.getElementById("editorTabs");
const editorContent = document.getElementById("editorContent");
const statusLang = document.getElementById("statusLang");
const statusPos = document.getElementById("statusPos");
const filePanel = document.getElementById("filePanel");
const copilotToggle = document.getElementById("copilotToggle");
const copilotPanel = document.getElementById("copilotPanel");
const copilotMessages = document.getElementById("copilotMessages");
const copilotForm = document.getElementById("copilotForm");
const copilotInput = document.getElementById("copilotInput");
const copilotClear = document.getElementById("copilotClear");

let bootTriggered = false;
let desktopInitialized = false;
let copilotInitialized = false;
let browserInitialized = false;
let soundEnabled = true;
let clockInterval = null;
let activeFileButton = null;
let browserHistory = [];
let browserHistoryIndex = -1;
let activeEditorFilePath = DEFAULT_FILE;
let activeEditorTabPath = DEFAULT_FILE;
let tesseractAnimationState = null;

let zCounter = 20;
let activeAppId = null;
const appStates = new Map();
const fileButtonsByPath = new Map();
const openEditorTabs = [];

const STARTUP_IGNORED_KEYS = new Set([
  "Meta",
  "Alt",
  "Control",
  "Shift",
  "CapsLock",
  "Escape",
]);

const epaLogoSrc = new URL("./assets/epa-logo.jpg", import.meta.url).href;
const resumePdfUrl = new URL("./assets/Nikhilesh_Thiruvengadam.pdf", import.meta.url).href;
const xProfileUrl = "https://x.com/NikhileshThiru";
const browserHomeUrl = "https://www.google.com/search?igu=1";
const browserSearchUrl = "https://www.google.com/search?igu=1&q=";
const browserShortcutUrls = new Map([
  ["x", xProfileUrl],
  ["twitter", xProfileUrl],
  ["github", "https://github.com"],
  ["linkedin", "https://linkedin.com"],
  ["linkeding", "https://linkedin.com"],
]);
const browserNewTabHosts = [
  "linkedin.com",
  "github.com",
  "x.com",
  "twitter.com",
];
const markdownRemoteBases = new Map([
  ["nikhileshthiru/projects/refnet/README.md", "https://raw.githubusercontent.com/NikhileshThiru/RefNet/main/"],
]);

function trackPlausibleEvent(eventName, props = {}) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") {
    return;
  }

  const hasProps = props && Object.keys(props).length > 0;
  if (hasProps) {
    window.plausible(eventName, { props });
    return;
  }

  window.plausible(eventName);
}

function trackConversionForUrl(url) {
  if (!url) {
    return;
  }

  if (url === resumePdfUrl) {
    trackPlausibleEvent("resume_open", { source: "desktop_ie" });
    return;
  }

  try {
    const parsed = new URL(url, window.location.href);
    const host = parsed.hostname.toLowerCase();

    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
      trackPlausibleEvent("linkedin_click", { source: "desktop_ie" });
    }
  } catch {
    // Ignore invalid URL analytics events.
  }
}

const biosPages = [
  {
    headerLeft: [
      "Phoenix - AwardBIOS v6.00PG, An Energy Star Ally",
      "Copyright (C) 1984 - 1999, Award Software, Inc.",
    ],
    epaImage: epaLogoSrc,
    lines: [
      { line: "", tone: "dim", pause: 55 },
      { line: "Main Processor  : Intel Pentium 75 MHz", tone: "normal" },
      { line: "System ID       : NTHIRU-95 WORKSTATION", tone: "info", pause: 110 },
      { mode: "countup", label: "Memory Testing  : ", target: 16384, tone: "success", pause: 220 },
      { line: "Cache Memory    : 256K <OK>", tone: "success", pause: 110 },
      { line: "", tone: "dim", pause: 55 },
      { line: "Award Plug and Play BIOS Extension v1.0A", tone: "normal", pause: 130 },
      { line: "Primary Master  : WDC AC2850F", tone: "normal" },
      { line: "Primary Slave   : None", tone: "dim", pause: 105 },
      { line: "Secondary Master: ATAPI CD-ROM 52X", tone: "normal" },
      { line: "Secondary Slave : None", tone: "dim", pause: 105 },
      { line: "Boot Sequence   : A, C, CDROM", tone: "info", pause: 135 },
      { line: "POST Complete, No Error(s)", tone: "success", pause: 120 },
      { line: "", tone: "dim", pause: 55 },
      { line: "Loading operating system...", tone: "accent", pause: 180 },
      { line: "Compiling: COMDLG32.DLL", tone: "info", mode: "type", pause: 200 },
      { line: "Loading: WIN.INI", tone: "info", mode: "type", pause: 215 },
    ],
    pagePause: 280,
  },
  {
    headerLeft: ["Initializing system hardware..."],
    lines: [
      { line: "", tone: "dim", pause: 55 },
      { line: "Detecting IDE drives...", tone: "accent", mode: "type", pause: 170 },
      { line: "Scanning: ISA Bus Devices", tone: "info", mode: "type", pause: 185 },
      { line: "Scanning: PCI Bus Devices", tone: "info", mode: "type", pause: 175 },
      { line: "", tone: "dim", pause: 45 },
      { line: "Loading device drivers...", tone: "accent", mode: "type", pause: 170 },
      { line: "Installing: CDROM.SYS", tone: "success", mode: "type", pause: 185 },
      { line: "Installing: MOUSE.COM", tone: "success", mode: "type", pause: 170 },
      { line: "Installing: HIMEM.SYS", tone: "success", mode: "type", pause: 180 },
      { line: "Installing: EMM386.EXE", tone: "success", mode: "type", pause: 185 },
    ],
    pagePause: 320,
  },
  {
    headerLeft: ["Preparing Windows environment..."],
    lines: [
      { line: "", tone: "dim", pause: 55 },
      { line: "Mounting: C:\\WINDOWS\\TEMP", tone: "accent", mode: "type", pause: 175 },
      { line: "", tone: "dim", pause: 45 },
      { line: "Loading registry...", tone: "accent", mode: "type", pause: 170 },
      { line: "Reading: CLASSES.DAT", tone: "info", mode: "type", pause: 190 },
      { line: "Reading: SYSTEM.DAT", tone: "info", mode: "type", pause: 185 },
      { line: "Reading: USER.DAT", tone: "info", mode: "type", pause: 190 },
      { line: "Loading profile: NTHIRU.DAT", tone: "success", mode: "type", pause: 210 },
      { line: "Applying shell: NIKHILESHTHIRU.EXE", tone: "success", mode: "type", pause: 230 },
      { line: "", tone: "dim", pause: 55 },
      { line: "Verifying DMI Pool Data ........", tone: "warn", pause: 560 },
      { line: "Boot from C: Windows 95", tone: "info", pause: 220 },
      { line: "Starting Windows 95...", tone: "success", pause: 420 },
      { line: "Please wait...", tone: "warn", pause: 560 },
    ],
    pagePause: 180,
  },
];

const treeData = {
  name: "nikhileshthiru",
  type: "folder",
  open: true,
  children: [
    { name: "README.md", type: "file" },
    {
      name: "projects",
      type: "folder",
      open: false,
      children: [
        {
          name: "refnet",
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

const files = {
  "nikhileshthiru/README.md": {
    type: "markdown",
    content: `# Nikhilesh Thiruvengadam
Computer Science @ Georgia Tech (AI + Systems Architecture) | GPA: 4.00/4.00

Actively seeking internship opportunities in software engineering, AI/ML, and data science, with a preference for backend and systems-focused work.

## Highlights
- HackGT 12 (2025): 2nd Overall Winner for RefNet, an AI research platform across 250M+ papers.
- Georgia Tech Undergraduate Researcher focused on machine learning for RF anomaly detection.
- Software Engineering Intern at IBeeAnalytics delivering production web solutions across 15+ client projects.

## Start Here
- Open projects/ to explore selected builds.
- Open work-experience/ for role impact summaries.
- Open contact/ to connect.
`,
  },
  "nikhileshthiru/projects/refnet/README.md": {
    type: "markdown",
    content: "# RefNet - Research Paper Search & Citation Network Visualization\n\n🏆 **2nd Place Overall Winner at HackGT 12** 🏆\n\n**Devpost:** https://devpost.com/software/refnet-c04g9n\n\n**Team Members:**\n- Nikhilesh\n- Dhruva\n- Shreyas\n- Krishna\n\n![RefNet Screenshot](docs/screenshot.png)\n\nRefNet is a comprehensive tool for searching research papers and visualizing their citation networks. It combines a powerful search interface with an interactive graph visualization and AI-powered analysis to help researchers explore academic literature and understand citation relationships.\n\n## 🤖 AI-Powered Research Analysis\n\n- **Custom Mastra Backend**: Express.js + OpenAI GPT-4o for intelligent research analysis\n- **Smart Context**: AI understands your selected papers and graph relationships\n- **Research Insights**: Compare papers, identify patterns, and discover research gaps\n- **Real-time Analysis**: Ask questions about your selected papers and get instant insights\n- **Review Paper Generation**: AI-powered literature review creation with PDF export\n\n## Features\n\n### 🔍 **Advanced Search**\n- Search research papers by title, authors, topics, and keywords\n- Filter results by publication date, citation count, and relevance\n- Sort by most cited, relevance score, or publication date\n- Paginated results with customizable page sizes\n- **Multiselect functionality** - Select multiple papers to build combined citation networks\n\n### 📊 **Interactive Graph Visualization**\n- Build citation networks from any research paper or multiple papers\n- Interactive D3.js-powered graph with zoom, pan, and drag functionality\n- Node selection and highlighting\n- Timeline-based color coding\n- Light grey/white lines for clean, academic appearance\n- Export selected papers and graph data\n- **Graph Rebuild Fallback**: Automatic restoration of previous graph on rebuild failure\n\n### 📄 **AI-Powered Review Paper Generation**\n- Generate comprehensive literature reviews from selected papers\n- AI-generated sections: Abstract, Introduction, Fundamentals, Types & Categories, State-of-the-Art\n- Intelligent title generation based on paper analysis\n- PDF export with academic formatting\n- Text file fallback for compatibility\n\n### 🚀 **Modern Web Interface**\n- Responsive design that works on desktop and mobile\n- Fast, modern React frontend\n- Real-time API integration\n- Intuitive user experience\n- **PWA Support**: Manifest.json for progressive web app capabilities\n\n## Quick Start\n\n### Prerequisites\n- Python 3.8+\n- Node.js 18+\n- npm or yarn\n- OpenAI API key\n\n### Setup\n\n1. **Configure environment variables:**\n   ```bash\n   cp .env.example .env\n   # Edit .env and add your OpenAI API key\n   ```\n   Or export directly:\n   ```bash\n   export OPENAI_API_KEY='your-openai-api-key-here'\n   ```\n\n2. **Install backend dependencies:**\n   ```bash\n   pip install -r requirements.txt\n   cd mastra-backend && npm install && cd ..\n   cd refnet/frontend && npm install && cd ../..\n   ```\n\n3. **Start all services:**\n   ```bash\n   ./start_cedar_mastra.sh\n   ```\n\n   This will start:\n   - Flask search API on `http://localhost:8000`\n   - Mastra AI backend on `http://localhost:4111`\n   - React frontend on `http://localhost:3000`\n\n### Manual Setup (Alternative)\n\nIf you prefer to start services manually:\n\n1. **Start Flask search API:**\n   ```bash\n   python app.py\n   ```\n\n2. **Start Mastra AI backend:**\n   ```bash\n   cd mastra-backend\n   npm start\n   ```\n\n3. **Start React frontend:**\n   ```bash\n   cd refnet/frontend\n   npm start\n   ```\n\n### Docker Setup (Production)\n\n```bash\n# Set your OpenAI API key\nexport OPENAI_API_KEY='your-openai-api-key-here'\n\n# Start with Docker Compose\ndocker-compose up\n```\n\n### Production Build\n\nTo build the frontend for production:\n\n```bash\ncd refnet/frontend\nnpm run build\n```\n\nThe built files will be in `refnet/frontend/build/` and will be automatically served by the Flask backend.\n\n## Usage\n\n1. **Search Papers**: Use the landing page to search for research papers by entering keywords, author names, or topics.\n\n2. **Select Papers**: \n   - Use checkboxes to select multiple papers from search results\n   - Click \"Build Graph\" to create a combined citation network from all selected papers\n   - Or click \"View Graph\" on individual papers for single-paper networks\n\n3. **Explore Network**: \n   - Click and drag nodes to rearrange the graph\n   - Click nodes to select/deselect them\n   - Use the controls to adjust graph parameters (iterations, limits)\n   - Export selected papers as JSON\n\n4. **AI Analysis**: \n   - Click the chat button to open the AI research assistant\n   - Ask questions about your selected papers\n   - Get intelligent insights, comparisons, and research recommendations\n   - The AI understands your paper context and graph relationships\n\n5. **Generate Review Papers**:\n   - Select papers from your graph\n   - Click \"Generate Survey Paper\" to create AI-powered literature review\n   - Export as PDF or text file\n\n6. **Navigate**: Use the back button to return to search results or start a new search.\n\n## API Endpoints\n\n### Search\n- `GET /api/search?q=query&page=1&per_page=25&sort=cited_by_count` - Search papers\n\n### Papers\n- `GET /api/paper/{paper_id}` - Get paper details\n- `GET /api/paper/{paper_id}/citations` - Get paper citations\n- `GET /api/paper/{paper_id}/references` - Get paper references\n\n### Graph\n- `GET /api/graph/{paper_id}?iterations=3&cited_limit=5&ref_limit=5` - Build citation graph from single paper\n- `POST /api/graph/multiple` - Build graph from multiple papers (multiselect)\n- `GET /api/graph/data` - Get current graph data\n- `POST /api/graph/clear` - Clear current graph\n\n### AI Backend (Mastra)\n- `POST /chat` - AI chat and research analysis\n- `GET /health` - Health check\n\n## Project Structure\n\n```\nRefNet/\n├── app.py                    # Flask search API entry point\n├── config.py                # Configuration settings\n├── requirements.txt         # Python dependencies\n├── mastra-backend/          # Mastra AI backend (Node.js + Express)\n│   ├── server.js           # AI agent server\n│   ├── package.json        # Backend dependencies\n│   └── README.md           # Backend documentation\n├── refnet/\n│   ├── api/                # API route blueprints\n│   │   ├── chat_routes.py  # Chat API routes\n│   │   ├── graph_routes.py # Graph API routes\n│   │   ├── paper_routes.py # Paper API routes\n│   │   └── search_routes.py # Search API routes\n│   ├── models/             # Data models\n│   │   ├── graph.py        # Graph data models\n│   │   └── paper.py        # Paper data models\n│   ├── services/           # Business logic services\n│   │   ├── graph_service.py # Graph processing\n│   │   └── openalex_service.py # OpenAlex API integration\n│   ├── utils/              # Utility functions\n│   │   ├── rate_limiter.py # API rate limiting\n│   │   └── validators.py   # Data validation\n│   ├── tests/              # Test files\n│   └── frontend/           # React frontend\n│       ├── src/\n│       │   ├── components/\n│       │   │   ├── GraphViewerClean.js    # Main graph visualization\n│       │   │   ├── FloatingCedarChat.js   # AI chat interface\n│       │   │   ├── LandingPage.js         # Search interface\n│       │   │   └── ChatTracker.js         # Chat management\n│       │   ├── services/\n│       │   │   ├── api.js                 # API client\n│       │   │   └── cedarAgent.js          # AI agent service\n│       │   ├── cedar/                     # AI chat agent configuration\n│       │   └── ...\n│       ├── public/\n│       │   ├── index.html\n│       │   ├── favicon.ico\n│       │   ├── logo.svg\n│       │   ├── logo192.png\n│       │   └── manifest.json              # PWA manifest\n│       └── package.json\n├── docker-compose.yml       # Docker Compose configuration\n├── Dockerfile.flask         # Flask API Docker image\n├── Dockerfile.mastra        # Mastra AI Docker image\n├── start_cedar_mastra.sh    # Development startup script\n└── README.md\n```\n\n## Technologies Used\n\n### Backend\n- **Flask**: Search API framework\n- **Express.js**: Mastra AI backend framework\n- **OpenAI GPT-4o**: Research analysis AI\n- **OpenAlex API**: Research paper data source\n- **NetworkX**: Graph analysis and processing\n- **Flask-CORS**: Cross-origin resource sharing\n\n### Frontend\n- **React 18**: UI framework\n- **React Router**: Client-side routing\n- **D3.js**: Graph visualization\n- **Axios**: HTTP client\n- **Tailwind CSS**: Styling\n- **PWA**: Progressive Web App capabilities\n\n### Deployment\n- **Docker**: Containerization\n- **AWS EC2**: Cloud hosting\n- **Docker Compose**: Multi-service orchestration\n\n## Review Paper Generation\n\nThe system generates comprehensive literature reviews using AI-powered content creation:\n\n1. **Paper Selection**: Users select papers from the citation graph\n2. **AI Analysis**: Each paper gets an AI-generated summary via GPT-4o\n3. **Content Generation**: Creates 5 sections (Abstract, Introduction, Fundamentals, Types & Categories, State-of-the-Art)\n4. **PDF Export**: Uses browser print functionality for professional PDF output\n5. **Fallback**: Text file export if PDF generation fails\n\n**Tech Stack for Review Generation:**\n- **AI Backend**: Mastra (Express.js + OpenAI GPT-4o)\n- **PDF Generation**: Browser native print functionality\n- **Content Processing**: Custom algorithms for domain detection and title generation\n- **Formatting**: HTML-to-PDF with academic styling\n\n## Contributing\n\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Add tests if applicable\n5. Submit a pull request\n\n## License\n\nThis project is licensed under the MIT License - see the LICENSE file for details.\n\n## Acknowledgments\n\n- [OpenAlex](https://openalex.org/) for providing research paper data\n- [D3.js](https://d3js.org/) for graph visualization capabilities\n- [OpenAI](https://openai.com/) for AI-powered research analysis\n- The academic research community for inspiration and use cases\n- HackGT 12 organizers and judges for the recognition\n",
  },
  "nikhileshthiru/work-experience/README.md": {
    type: "markdown",
    content: `# Work Experience

## Georgia Tech - Undergraduate Researcher (Aug 2025 - Present)
Machine Learning for Anomaly Detection in RF Systems

- Improved anomaly detection accuracy by 32% through zero-shot and continual learning experiments.
- Processed 10M+ IQ samples daily using multimodal pipelines (IQ, spectrogram, PCA features).
- Reduced false positives by 25% via fusion-based model strategies.
- Increased experiment throughput by 40% through reusable preprocessing and tracking workflows.
- Deployed trained models to USRP hardware for live jamming and spoofing anomaly detection.

## IBeeAnalytics - Software Engineering Intern (Aug 2023 - May 2025)
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
- Python
- Java
- JavaScript
- SQL
- HTML/CSS

## Frameworks and Libraries
- React
- Node.js
- Flask
- PyTorch
- NumPy
- Pandas
- NetworkX
- D3.js

## Tools and Platforms
- Docker
- Firebase
- Git
- Linux
- AWS (EC2)
- Vercel
- REST APIs
- CI/CD pipelines

## Certifications
- IT Specialist - Software Development
- Microsoft Office Specialist: PowerPoint Associate
`,
  },
  "nikhileshthiru/contact/README.md": {
    type: "markdown",
    content: `# Contact
- Email (Primary): nikhilesh.thiru@gmail.com
- Email (Academic): nthiruve3@gatech.edu
- Phone: 470-621-5274
- LinkedIn: https://www.linkedin.com/in/nikhilesh-thiruvengadam
- GitHub: https://github.com/NikhileshThiru
- X: ${xProfileUrl}
- Resume: [Resume.pdf](${resumePdfUrl})
- Location: Cumming, Georgia, United States
`,
  },
};
const copilotSuggestions = [
  "Give me a 30-second intro.",
  "What projects best show your engineering strength?",
  "Summarize your Georgia Tech research outcomes.",
  "What internship roles are you targeting?",
  "How can I contact you quickly?",
];

const copilotKnowledge = [
  {
    keywords: ["intro", "introduce", "about", "who are you", "yourself"],
    answer:
      "I’m Nikhilesh Thiruvengadam, a Computer Science student at Georgia Tech (AI + Systems Architecture, 4.00 GPA). I build full-stack and AI systems with measurable outcomes in performance and reliability.",
  },
  {
    keywords: ["hackgt", "refnet", "winner", "won", "project", "citation"],
    answer:
      "My flagship project is RefNet, an AI-powered research platform. It won 2nd Overall at HackGT 12 (2025) among 900+ participants and was designed for citation-network exploration across 250M+ papers. Devpost: https://devpost.com/software/refnet-c04g9n",
  },
  {
    keywords: ["research", "rf", "anomaly", "usrp", "zero-shot", "continual"],
    answer:
      "At Georgia Tech, I research RF anomaly detection using multimodal ML. Reported outcomes include +32% detection accuracy, -25% false positives, and daily processing of 10M+ IQ samples.",
  },
  {
    keywords: ["internship", "role", "hiring", "summer", "fit", "seeking"],
    answer:
      "I’m targeting Summer 2026 software engineering and AI/ML internships. I’m strongest in backend-heavy and intelligent product roles where I can build end-to-end and ship quickly.",
  },
  {
    keywords: ["ibee", "experience", "intern", "work", "client", "dashboard"],
    answer:
      "At IBeeAnalytics, I built and maintained production web solutions across 15+ client projects, improved setup speed by 45%, and helped support reliability across 20+ active codebases.",
  },
  {
    keywords: ["skills", "stack", "languages", "frameworks", "tools", "tech"],
    answer:
      "Core stack: Python, JavaScript, Java, SQL, React, Node.js, Flask, PyTorch, Docker, AWS EC2, Linux, REST APIs, and CI/CD pipelines.",
  },
  {
    keywords: ["education", "gpa", "georgia tech", "degree", "school"],
    answer:
      "I’m pursuing a B.S. in Computer Science at Georgia Tech (Expected May 2027), with threads in Artificial Intelligence and Systems Architecture, and a 4.00/4.00 GPA.",
  },
  {
    keywords: ["contact", "email", "linkedin", "github", "phone", "reach"],
    answer:
      "Best contact options: nikhilesh.thiru@gmail.com, linkedin.com/in/nikhilesh-thiruvengadam, github.com/NikhileshThiru, and 470-621-5274.",
  },
];

function setActiveScreen(screenName) {
  for (const [name, element] of Object.entries(screens)) {
    const isActive = name === screenName;
    element.classList.toggle("active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  }
}

function shouldIgnoreStartupKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }
  return STARTUP_IGNORED_KEYS.has(event.key);
}

async function onStartupKey(event) {
  if (bootTriggered || shouldIgnoreStartupKey(event)) {
    return;
  }

  event.preventDefault();
  await startBootExperience();
}

async function onStartupPointer() {
  if (bootTriggered) {
    return;
  }

  await startBootExperience();
}

async function startBootExperience() {
  if (bootTriggered) {
    return;
  }

  bootTriggered = true;
  document.removeEventListener("keydown", onStartupKey);
  screens.preboot.removeEventListener("pointerdown", onStartupPointer);
  await runBootSequence();
}

async function runBootSequence() {
  setActiveScreen("boot");
  biosText.innerHTML = "";

  if (soundEnabled) {
    playAudio(biosAudio, false);
  }

  for (let pageIndex = 0; pageIndex < biosPages.length; pageIndex += 1) {
    const page = biosPages[pageIndex];
    const body = buildBiosPage(page);

    for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex += 1) {
      const step = page.lines[lineIndex];
      await renderBiosLine(body, step, lineIndex);
      await wait(biosStepPause(step, lineIndex));
    }

    await wait(page.pagePause ?? 220);
    if (pageIndex < biosPages.length - 1) {
      biosText.classList.add("page-flash");
      await wait(60);
      biosText.classList.remove("page-flash");
      biosText.innerHTML = "";
    }
  }

  await wait(120);
  stopAudio(biosAudio);

  setActiveScreen("desktop");
  initializeDesktop();

  if (soundEnabled) {
    playAudio(startupAudio, false);
  }
}

function buildBiosPage(page) {
  const pageRoot = document.createElement("div");
  pageRoot.className = "bios-page";

  if (page.headerLeft || page.epaBlock) {
    const top = document.createElement("div");
    top.className = "bios-top";

    const left = document.createElement("div");
    left.className = "bios-title-block";
    (page.headerLeft || []).forEach((text) => {
      const line = document.createElement("p");
      line.className = "bios-line header";
      line.innerHTML = formatBiosMarkup(text);
      left.appendChild(line);
    });
    top.appendChild(left);

    if (page.epaImage) {
      const right = document.createElement("div");
      right.className = "bios-epa";

      const image = document.createElement("img");
      image.className = "bios-epa-logo";
      image.src = page.epaImage;
      image.alt = "EPA Pollution Preventer";
      right.appendChild(image);
      top.appendChild(right);
    } else if (page.epaBlock && page.epaBlock.length) {
      const right = document.createElement("div");
      right.className = "bios-epa";

      const star = document.createElement("span");
      star.className = "epa-star";
      star.textContent = "★";
      right.appendChild(star);

      page.epaBlock.forEach((text) => {
        const row = document.createElement("span");
        row.textContent = text;
        right.appendChild(row);
      });

      top.appendChild(right);
    }

    pageRoot.appendChild(top);
  }

  const body = document.createElement("div");
  body.className = "bios-body";
  pageRoot.appendChild(body);
  biosText.appendChild(pageRoot);
  return body;
}

async function renderBiosLine(container, step) {
  const lineElement = document.createElement("p");
  lineElement.className = `bios-line ${step.tone || ""}`;
  container.appendChild(lineElement);

  if (step.mode === "countup") {
    const label = step.label || "";
    const target = Number(step.target) || 0;
    const increments = [2048, 4096, 8192, 12288, target].filter((v, idx, arr) => v > 0 && (idx === 0 || v !== arr[idx - 1]));
    for (const value of increments) {
      lineElement.textContent = `${label}${value}K`;
      await wait(randomInt(14, 30));
    }
    lineElement.innerHTML = formatBiosMarkup(`${label}${target}K <OK>`);
    biosText.scrollTop = biosText.scrollHeight;
    return;
  }

  const rawLine = step.line || "";
  if (!rawLine.trim()) {
    lineElement.innerHTML = '<span class="dim">&nbsp;</span>';
  } else {
    if (step.mode === "type") {
      for (const character of rawLine) {
        lineElement.textContent += character;
        await wait(randomInt(2, 6));
      }
    }
    lineElement.innerHTML = formatBiosMarkup(rawLine);
  }

  biosText.scrollTop = biosText.scrollHeight;
}

function formatBiosMarkup(line) {
  return escapeHtml(line)
    .replaceAll("&lt;OK&gt;", '<span class="key">OK</span>')
    .replace(/\b(Detecting|Loading|Checking|Verifying|Boot|Memory Testing|Compiling|Scanning|Installing|Starting|Preparing|Mounting|Reading|Initializing|Applying|POST)\b/g, '<span class="accent">$1</span>')
    .replace(/\b(EPA|AwardBIOS|WINDOWS 95|DMI|NVRAM|HIMEM\.SYS|EMM386\.EXE|Hard Disk|CD-ROM|COMDLG32\.DLL|WIN\.INI|CLASSES\.DAT|SYSTEM\.DAT|USER\.DAT|NTHIRU\.DAT|NIKHILESHTHIRU\.EXE|CDROM\.SYS|MOUSE\.COM)\b/g, '<span class="key">$1</span>')
    .replace(/\b(None)\b/g, '<span class="dim">$1</span>');
}

function biosStepPause(step, index) {
  if (typeof step.pause === "number") {
    return step.pause;
  }

  const text = step.line || "";
  if (!text.trim()) {
    return randomInt(18, 38);
  }

  if (text.includes("Verifying DMI Pool Data")) {
    return randomInt(260, 420);
  }

  if (text.includes("Loading WINDOWS 95")) {
    return randomInt(200, 320);
  }

  if (index <= 2) {
    return randomInt(70, 120);
  }

  return randomInt(30, 90);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playAudio(audioElement, loop, forcedVolume = null) {
  audioElement.loop = loop;
  audioElement.currentTime = 0;
  audioElement.muted = !soundEnabled;
  const baseVolume = audioElement === biosAudio ? 0.86 : 1.0;
  audioElement.volume = typeof forcedVolume === "number" ? forcedVolume : baseVolume;
  audioElement.play().catch(() => {
    // Ignore autoplay edge cases.
  });
}

function stopAudio(audioElement) {
  audioElement.pause();
  audioElement.currentTime = 0;
}

function updateSoundToggle() {
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
  soundToggle.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Unmute sound");
  soundToggle.title = soundEnabled ? "Mute sound" : "Unmute sound";
  soundToggle.classList.toggle("muted", !soundEnabled);
  biosAudio.muted = !soundEnabled;
  startupAudio.muted = !soundEnabled;
}

function initializeDesktop() {
  if (!desktopInitialized) {
    setupWindowSystem();
    initializeDesktopWatermark();
    renderTree();
    openFile(DEFAULT_FILE);
    bindDesktopInteractions();
    bindBrowserApp();
    bindStartMenu();
    bindEditorHelpers();
    bindCopilot();
    syncTaskbarState();
    desktopInitialized = true;
  }

  updateClock();
  if (!clockInterval) {
    clockInterval = window.setInterval(updateClock, 1000);
  }
}

function initializeDesktopWatermark() {
  if (tesseractAnimationState || !tesseractCanvas) {
    return;
  }

  const context = tesseractCanvas.getContext("2d");
  if (!context) {
    return;
  }

  tesseractAnimationState = {
    canvas: tesseractCanvas,
    context,
    width: 0,
    height: 0,
    elapsed: 0,
    fitScale: 0,
    lastTimestamp: 0,
    rafId: 0,
  };

  resizeDesktopWatermark();
  drawDesktopWatermark();
  updateWatermarkMotionState();

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", updateWatermarkMotionState);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(updateWatermarkMotionState);
  }
}

function updateWatermarkMotionState() {
  if (!tesseractAnimationState) {
    return;
  }

  if (reduceMotionQuery.matches) {
    stopDesktopWatermarkAnimation();
    drawDesktopWatermark();
    return;
  }

  if (!tesseractAnimationState.rafId) {
    tesseractAnimationState.lastTimestamp = 0;
    tesseractAnimationState.rafId = window.requestAnimationFrame(stepDesktopWatermarkAnimation);
  }
}

function stepDesktopWatermarkAnimation(timestamp) {
  if (!tesseractAnimationState) {
    return;
  }

  if (!tesseractAnimationState.lastTimestamp) {
    tesseractAnimationState.lastTimestamp = timestamp;
  }

  const delta = Math.min(48, timestamp - tesseractAnimationState.lastTimestamp);
  tesseractAnimationState.lastTimestamp = timestamp;
  tesseractAnimationState.elapsed += delta * 0.001;
  drawDesktopWatermark();

  tesseractAnimationState.rafId = window.requestAnimationFrame(stepDesktopWatermarkAnimation);
}

function stopDesktopWatermarkAnimation() {
  if (!tesseractAnimationState || !tesseractAnimationState.rafId) {
    return;
  }

  window.cancelAnimationFrame(tesseractAnimationState.rafId);
  tesseractAnimationState.rafId = 0;
}

function resizeDesktopWatermark() {
  if (!tesseractAnimationState) {
    return;
  }

  const { canvas, context } = tesseractAnimationState;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(84, Math.round(rect.width));
  const height = Math.max(84, Math.round(rect.height));
  const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  tesseractAnimationState.width = width;
  tesseractAnimationState.height = height;
  tesseractAnimationState.fitScale = 0;
  drawDesktopWatermark();
}

function drawDesktopWatermark() {
  if (!tesseractAnimationState) {
    return;
  }

  const state = tesseractAnimationState;
  const { context, width, height, elapsed } = state;
  if (!width || !height) {
    return;
  }

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  const centerX = width / 2;
  const centerY = height / 2;
  const cubeVertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  const cubeEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const spinOuter = elapsed * 0.82;
  const spinInner = -elapsed * 0.95 + 0.42;
  const cameraPitch = -0.58;
  const cameraYaw = 0.72;
  const depthDistance = 4.6;

  const projectCubePoint = (vertex, scale, spin) => {
    let x = vertex[0] * scale;
    let y = vertex[1] * scale;
    let z = vertex[2] * scale;

    [x, z] = rotatePair(x, z, spin);
    [y, z] = rotatePair(y, z, spin * 0.68);
    [y, z] = rotatePair(y, z, cameraPitch);
    [x, z] = rotatePair(x, z, cameraYaw);

    const perspective = depthDistance / (depthDistance - z);
    return {
      x: x * perspective,
      y: y * perspective,
      z,
    };
  };

  const outerNormalized = cubeVertices.map((vertex) => projectCubePoint(vertex, 1.08, spinOuter));
  const innerNormalized = cubeVertices.map((vertex) => projectCubePoint(vertex, 0.58, spinInner));
  const normalized = outerNormalized.concat(innerNormalized);

  const maxAbsX = Math.max(0.0001, ...normalized.map((point) => Math.abs(point.x)));
  const maxAbsY = Math.max(0.0001, ...normalized.map((point) => Math.abs(point.y)));
  const padding = Math.max(6, Math.min(width, height) * 0.12);
  const fitScaleX = (width * 0.5 - padding) / maxAbsX;
  const fitScaleY = (height * 0.5 - padding) / maxAbsY;
  const targetScale = Math.max(6, Math.min(fitScaleX, fitScaleY));
  if (!state.fitScale) {
    state.fitScale = targetScale;
  } else {
    state.fitScale += (targetScale - state.fitScale) * 0.25;
  }
  const fitScale = state.fitScale;

  const projected = normalized.map((point, index) => ({
    x: centerX + point.x * fitScale,
    y: centerY + point.y * fitScale,
    z: point.z,
    inner: index >= 8,
  }));

  const zValues = projected.map((point) => point.z);
  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);
  const zRange = Math.max(0.0001, zMax - zMin);

  const segments = [];
  cubeEdges.forEach(([from, to]) => {
    segments.push({ from, to, kind: "outer" });
  });
  cubeEdges.forEach(([from, to]) => {
    segments.push({ from: from + 8, to: to + 8, kind: "inner" });
  });
  for (let i = 0; i < 8; i += 1) {
    segments.push({ from: i, to: i + 8, kind: "bridge" });
  }

  segments.sort((a, b) => {
    const zA = (projected[a.from].z + projected[a.to].z) / 2;
    const zB = (projected[b.from].z + projected[b.to].z) / 2;
    return zA - zB;
  });

  segments.forEach((segment) => {
    const p1 = projected[segment.from];
    const p2 = projected[segment.to];
    const depth = clamp((((p1.z + p2.z) * 0.5) - zMin) / zRange, 0, 1);

    let baseAlpha = 0.48;
    let baseWidth = 1.1;
    if (segment.kind === "inner") {
      baseAlpha = 0.36;
      baseWidth = 0.95;
    } else if (segment.kind === "bridge") {
      baseAlpha = 0.3;
      baseWidth = 0.88;
    }

    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.strokeStyle = `rgba(8, 8, 8, ${(baseAlpha + depth * 0.28).toFixed(3)})`;
    context.lineWidth = baseWidth;
    context.stroke();
  });

  projected
    .slice()
    .sort((a, b) => a.z - b.z)
    .forEach((point) => {
      const depth = clamp((point.z - zMin) / zRange, 0, 1);
      const radius = point.inner ? 0.78 + depth * 0.42 : 0.92 + depth * 0.52;
      const alphaBase = point.inner ? 0.43 : 0.52;

      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(8, 8, 8, ${(alphaBase + depth * 0.25).toFixed(3)})`;
      context.fill();
    });
}

function rotatePair(a, b, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [a * cos - b * sin, a * sin + b * cos];
}

function setupWindowSystem() {
  const windows = Array.from(document.querySelectorAll(".app-window"));

  windows.forEach((windowEl) => {
    const appId = windowEl.dataset.app;
    const title = windowEl.dataset.title || appId;
    const taskButton = buildTaskButton(appId, title);
    const isClosed = windowEl.classList.contains("closed");

    const state = {
      appId,
      title,
      windowEl,
      taskButton,
      minimized: false,
      maximized: false,
      closed: isClosed,
      restoreRect: null,
    };

    appStates.set(appId, state);
    taskbarApps.appendChild(taskButton);

    wireWindowControls(state);
  });
}

function buildTaskButton(appId, title) {
  const taskButton = document.createElement("button");
  taskButton.type = "button";
  taskButton.className = "task-btn";
  taskButton.textContent = title;

  taskButton.addEventListener("click", () => {
    const state = appStates.get(appId);
    if (!state) {
      return;
    }

    if (state.closed) {
      openApp(appId);
      return;
    }

    if (state.minimized) {
      restoreApp(appId);
      return;
    }

    if (activeAppId === appId) {
      minimizeApp(appId);
      return;
    }

    focusApp(appId);
  });

  return taskButton;
}

function wireWindowControls(state) {
  const { windowEl, appId } = state;

  windowEl.addEventListener("mousedown", () => {
    if (!state.closed && !state.minimized) {
      focusApp(appId);
    }
  });

  const dragHandle = windowEl.querySelector("[data-drag-handle]");
  if (dragHandle) {
    dragHandle.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || state.maximized) {
        return;
      }
      if (event.target instanceof HTMLElement && event.target.closest("[data-control]")) {
        return;
      }
      startDrag(event, state);
    });
  }

  windowEl.querySelectorAll("[data-control]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-control");
      if (action === "minimize") {
        minimizeApp(appId);
      } else if (action === "maximize") {
        toggleMaximize(appId);
      } else if (action === "close") {
        closeApp(appId);
      }
    });
  });

  windowEl.querySelectorAll("[data-resize]").forEach((handle) => {
    handle.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || state.maximized) {
        return;
      }
      const direction = handle.getAttribute("data-resize");
      startResize(event, state, direction);
    });
  });
}

function startDrag(event, state) {
  event.preventDefault();
  focusApp(state.appId);
  const isBrowserWindow = state.appId === "browser";
  if (isBrowserWindow) {
    setBrowserFrameInteractionEnabled(false);
  }

  const work = getWorkArea();
  const rect = getRelativeRect(state.windowEl);
  const startX = event.clientX;
  const startY = event.clientY;

  const onMove = (moveEvent) => {
    const nextLeft = clamp(rect.left + (moveEvent.clientX - startX), 0, work.width - rect.width);
    const nextTop = clamp(rect.top + (moveEvent.clientY - startY), 0, work.height - rect.height);
    state.windowEl.style.left = `${Math.round(nextLeft)}px`;
    state.windowEl.style.top = `${Math.round(nextTop)}px`;
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (isBrowserWindow) {
      setBrowserFrameInteractionEnabled(true);
    }
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function startResize(event, state, direction) {
  event.preventDefault();
  focusApp(state.appId);
  const isBrowserWindow = state.appId === "browser";
  if (isBrowserWindow) {
    setBrowserFrameInteractionEnabled(false);
  }

  const work = getWorkArea();
  const startRect = getRelativeRect(state.windowEl);
  const startX = event.clientX;
  const startY = event.clientY;
  const minWidth = window.matchMedia("(max-width: 760px)").matches ? 280 : 360;
  const minHeight = 220;
  const startLeft = startRect.left;
  const startTop = startRect.top;
  const startRight = startRect.left + startRect.width;
  const startBottom = startRect.top + startRect.height;

  const onMove = (moveEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    let left = startLeft;
    let top = startTop;
    let right = startRight;
    let bottom = startBottom;

    if (direction.includes("e")) {
      right = clamp(startRight + dx, left + minWidth, work.width);
    }

    if (direction.includes("s")) {
      bottom = clamp(startBottom + dy, top + minHeight, work.height);
    }

    if (direction.includes("w")) {
      left = clamp(startLeft + dx, 0, right - minWidth);
    }

    if (direction.includes("n")) {
      top = clamp(startTop + dy, 0, bottom - minHeight);
    }

    const width = clamp(right - left, minWidth, work.width - left);
    const height = clamp(bottom - top, minHeight, work.height - top);

    state.windowEl.style.left = `${Math.round(left)}px`;
    state.windowEl.style.top = `${Math.round(top)}px`;
    state.windowEl.style.width = `${Math.round(width)}px`;
    state.windowEl.style.height = `${Math.round(height)}px`;
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (isBrowserWindow) {
      setBrowserFrameInteractionEnabled(true);
    }
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function setBrowserFrameInteractionEnabled(enabled) {
  if (!browserFrame) {
    return;
  }
  browserFrame.style.pointerEvents = enabled ? "" : "none";
}

function toggleMaximize(appId) {
  const state = appStates.get(appId);
  if (!state || state.closed || state.minimized) {
    return;
  }

  if (state.maximized) {
    restoreFromMaximize(state);
  } else {
    maximizeApp(state);
  }

  focusApp(appId);
}

function maximizeApp(state, forceFit = false) {
  if (state.maximized && !forceFit) {
    return;
  }

  if (!state.maximized) {
    state.restoreRect = getRelativeRect(state.windowEl);
  }
  const work = getWorkArea();

  state.windowEl.style.left = "0px";
  state.windowEl.style.top = "0px";
  state.windowEl.style.width = `${Math.round(work.width)}px`;
  state.windowEl.style.height = `${Math.round(work.height)}px`;
  state.windowEl.classList.add("maximized");
  state.maximized = true;
}

function restoreFromMaximize(state) {
  if (!state.maximized || !state.restoreRect) {
    return;
  }

  const { left, top, width, height } = state.restoreRect;
  state.windowEl.style.left = `${Math.round(left)}px`;
  state.windowEl.style.top = `${Math.round(top)}px`;
  state.windowEl.style.width = `${Math.round(width)}px`;
  state.windowEl.style.height = `${Math.round(height)}px`;
  state.windowEl.classList.remove("maximized");
  state.maximized = false;
}

function minimizeApp(appId) {
  const state = appStates.get(appId);
  if (!state || state.closed) {
    return;
  }

  state.minimized = true;
  state.windowEl.classList.add("minimized");

  if (activeAppId === appId) {
    activeAppId = null;
  }

  syncTaskbarState();
}

function restoreApp(appId) {
  const state = appStates.get(appId);
  if (!state || state.closed) {
    return;
  }

  state.minimized = false;
  state.windowEl.classList.remove("minimized");
  focusApp(appId);
}

function closeApp(appId) {
  const state = appStates.get(appId);
  if (!state) {
    return;
  }

  state.closed = true;
  state.minimized = false;
  state.windowEl.classList.add("closed");
  state.windowEl.classList.remove("minimized", "maximized", "active");
  state.maximized = false;

  if (activeAppId === appId) {
    activeAppId = null;
  }

  syncTaskbarState();
}

function openApp(appId) {
  const state = appStates.get(appId);
  if (!state) {
    return;
  }

  state.closed = false;
  state.minimized = false;
  state.windowEl.classList.remove("closed", "minimized");
  focusApp(appId);
}

function focusApp(appId) {
  const state = appStates.get(appId);
  if (!state || state.closed || state.minimized) {
    return;
  }

  zCounter += 1;
  state.windowEl.style.zIndex = String(zCounter);
  activeAppId = appId;
  syncTaskbarState();
}

function syncTaskbarState() {
  appStates.forEach((state, id) => {
    const isVisible = !state.closed;
    state.taskButton.classList.toggle("hidden", !isVisible);
    state.taskButton.classList.toggle("active", isVisible && !state.minimized && activeAppId === id);
    state.windowEl.classList.toggle("active", !state.closed && !state.minimized && activeAppId === id);
  });
}

function getRelativeRect(element) {
  const rect = element.getBoundingClientRect();
  const desktopRect = screens.desktop.getBoundingClientRect();

  return {
    left: rect.left - desktopRect.left,
    top: rect.top - desktopRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function getWorkArea() {
  const width = screens.desktop.clientWidth;
  const height = screens.desktop.clientHeight - taskbar.offsetHeight;
  return { width, height };
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function bindDesktopInteractions() {
  const openVscode = () => {
    openApp("vscode");
    closeStartMenu();
  };
  const openIe = () => {
    openBrowserHome();
    closeStartMenu();
  };
  const openResume = () => {
    openBrowserTo(resumePdfUrl);
    closeStartMenu();
  };
  const openLinkedIn = () => {
    openBrowserTo("https://www.linkedin.com/in/nikhilesh-thiruvengadam");
    closeStartMenu();
  };
  const openGitHub = () => {
    openBrowserTo("https://github.com/NikhileshThiru");
    closeStartMenu();
  };
  const openX = () => {
    openBrowserTo(xProfileUrl);
    closeStartMenu();
  };

  vscodeDesktopIcon.addEventListener("dblclick", openVscode);
  ieDesktopIcon.addEventListener("dblclick", openIe);
  resumeDesktopIcon.addEventListener("dblclick", openResume);
  linkedinDesktopIcon.addEventListener("dblclick", openLinkedIn);
  githubDesktopIcon.addEventListener("dblclick", openGitHub);
  xDesktopIcon.addEventListener("dblclick", openX);

  treeToggle.addEventListener("click", () => {
    filePanel.classList.toggle("open");
    if (window.matchMedia("(max-width: 760px)").matches) {
      copilotPanel.classList.remove("open");
    }
  });
}

function bindBrowserApp() {
  if (browserInitialized) {
    return;
  }

  browserBack.addEventListener("click", () => {
    navigateBrowserHistory(-1);
  });

  browserForward.addEventListener("click", () => {
    navigateBrowserHistory(1);
  });

  browserRefresh.addEventListener("click", () => {
    refreshBrowser();
  });

  browserHome.addEventListener("click", () => {
    openBrowserHome();
  });

  browserForm.addEventListener("submit", (event) => {
    event.preventDefault();
    openBrowserTo(browserInput.value, { keepInput: true });
  });

  browserInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  browserFrame.addEventListener("load", () => {
    const activeUrl = getBrowserFrameUrl();
    if (!activeUrl) {
      return;
    }

    browserInput.value = activeUrl;
    updateBrowserDirectLink(activeUrl);
    pushBrowserHistory(activeUrl);
  });

  browserFrame.addEventListener("error", () => {
    const value = browserInput.value || browserHomeUrl;
    const fallback = resolveBrowserTarget(value);
    if (!fallback) {
      return;
    }

    if (shouldProxyInFrame(fallback)) {
      browserFrame.src = `/ie-proxy?url=${encodeURIComponent(fallback)}`;
      return;
    }

    updateBrowserDirectLink(fallback);
  });

  if (browserDirectLink) {
    browserDirectLink.addEventListener("click", (event) => {
      event.preventDefault();
      openBrowserTo(browserDirectLink.href);
    });
  }

  updateBrowserNavButtons();
  browserInitialized = true;
}

function bindStartMenu() {
  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

function openStartMenu() {
  startMenu.classList.add("hidden");
  startButton.classList.remove("active");
}

function closeStartMenu() {
  startMenu.classList.add("hidden");
  startButton.classList.remove("active");
}

function openBrowserHome() {
  openBrowserTo(browserHomeUrl, { keepInput: false, addToHistory: true });
}

function openBrowserTo(target, options = {}) {
  const { keepInput = false, addToHistory = true } = options;
  const resolvedUrl = resolveBrowserTarget(target);
  if (!resolvedUrl) {
    return;
  }

  trackConversionForUrl(resolvedUrl);

  if (shouldOpenInNewTabOnly(resolvedUrl)) {
    openBrowserInNewTab(resolvedUrl);
    return;
  }

  openApp("browser");
  navigateBrowserFrame(resolvedUrl);
  if (addToHistory) {
    pushBrowserHistory(resolvedUrl);
  }
  browserInput.value = keepInput ? String(target || "").trim() : resolvedUrl;
  focusApp("browser");
}

function resolveBrowserTarget(rawTarget) {
  if (typeof rawTarget !== "string") {
    return null;
  }

  const target = rawTarget.trim();
  if (!target) {
    return null;
  }

  const normalizedTarget = target
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  if (/^(\/|\.\/|\.\.\/)/.test(target) || target.startsWith("assets/")) {
    return new URL(target, window.location.href).href;
  }

  if (/^about:/i.test(target)) {
    return target;
  }

  if (/^(https?:\/\/)/i.test(target)) {
    return target;
  }

  if (/^[a-z]+:/i.test(target)) {
    return target;
  }

  if (!/\s/.test(target) && browserShortcutUrls.has(normalizedTarget)) {
    return browserShortcutUrls.get(normalizedTarget) || target;
  }

  if (/\s/.test(target)) {
    return `${browserSearchUrl}${encodeURIComponent(target)}`;
  }

  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(target)) {
    return `https://${target}`;
  }

  return `${browserSearchUrl}${encodeURIComponent(target)}`;
}

function navigateBrowserFrame(url) {
  browserFrame.removeAttribute("srcdoc");
  browserFrame.src = toBrowserFrameSrc(url);
  updateBrowserDirectLink(url);
}

function pushBrowserHistory(url) {
  if (browserHistoryIndex >= 0 && browserHistory[browserHistoryIndex] === url) {
    updateBrowserNavButtons();
    return;
  }

  if (browserHistoryIndex < browserHistory.length - 1) {
    browserHistory = browserHistory.slice(0, browserHistoryIndex + 1);
  }

  browserHistory.push(url);
  browserHistoryIndex = browserHistory.length - 1;
  updateBrowserNavButtons();
}

function navigateBrowserHistory(step) {
  if (!browserHistory.length) {
    return;
  }

  const nextIndex = browserHistoryIndex + step;
  if (nextIndex < 0 || nextIndex >= browserHistory.length) {
    return;
  }

  browserHistoryIndex = nextIndex;
  const url = browserHistory[browserHistoryIndex];
  openApp("browser");
  navigateBrowserFrame(url);
  browserInput.value = url;
  focusApp("browser");
  updateBrowserNavButtons();
}

function refreshBrowser() {
  if (browserHistoryIndex < 0 || !browserHistory[browserHistoryIndex]) {
    return;
  }

  const url = browserHistory[browserHistoryIndex];
  navigateBrowserFrame(url);
}

function updateBrowserNavButtons() {
  if (browserBack) {
    browserBack.disabled = browserHistoryIndex <= 0;
  }
  if (browserForward) {
    browserForward.disabled = browserHistoryIndex >= browserHistory.length - 1;
  }
}

function updateBrowserDirectLink(url) {
  if (!browserDirectLink) {
    return;
  }
  browserDirectLink.href = url;
  browserDirectLink.textContent = url;
}

function getBrowserFrameUrl() {
  if (!browserFrame || !browserFrame.src) {
    return "";
  }
  return unwrapProxyUrl(browserFrame.src);
}

function toBrowserFrameSrc(url) {
  const googleShell = mapGoogleUrlToEmbeddedSearch(url);
  if (googleShell) {
    return googleShell;
  }

  if (shouldProxyInFrame(url)) {
    return `/ie-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function shouldOpenInNewTabOnly(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    return browserNewTabHosts.some(
      (targetHost) => host === targetHost || host.endsWith(`.${targetHost}`)
    );
  } catch {
    return false;
  }
}

function openBrowserInNewTab(url) {
  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) {
      popup.opener = null;
    }
  } catch {
    // Ignore popup-blocking errors.
  }
}

function shouldProxyInFrame(url) {
  if (!isProxyRouteAvailable()) {
    return false;
  }

  try {
    const parsed = new URL(url, window.location.href);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return false;
    }

    if (parsed.origin === window.location.origin) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isProxyRouteAvailable() {
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

function mapGoogleUrlToEmbeddedSearch(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return "";
    }

    const host = parsed.hostname.toLowerCase();
    const isGoogleHost = host === "google.com" || host.endsWith(".google.com");
    if (!isGoogleHost) {
      return "";
    }

    parsed.protocol = "https:";
    parsed.hostname = "www.google.com";
    parsed.searchParams.set("igu", "1");
    return parsed.href;
  } catch {
    return "";
  }
}

function unwrapProxyUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.pathname !== "/ie-proxy") {
      return parsed.href;
    }
    const raw = parsed.searchParams.get("url");
    return raw ? raw : parsed.href;
  } catch {
    return url;
  }
}

function bindEditorHelpers() {
  editorContent.addEventListener("mousemove", (event) => {
    const row = event.target instanceof HTMLElement ? event.target.closest(".editor-row") : null;
    if (!row) {
      return;
    }

    const line = Number(row.getAttribute("data-line")) || 1;
    statusPos.textContent = `Ln ${line}, Col 1`;
  });

  editorContent.addEventListener("mouseleave", () => {
    statusPos.textContent = "Ln 1, Col 1";
  });

  editorContent.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const link = target.closest("a.editor-link");
    if (!link) {
      return;
    }

    event.preventDefault();
    const href = link.getAttribute("href");
    if (href) {
      openBrowserTo(href);
    }
  });
}

function bindCopilot() {
  if (copilotInitialized) {
    return;
  }

  copilotToggle.classList.add("active");

  appendCopilotMessage(
    "assistant",
    "Hi, I’m Nikhilesh AI. Ask me anything about my projects, experience, skills, and internship goals."
  );

  copilotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = copilotInput.value.trim();
    if (!question) {
      return;
    }

    appendCopilotMessage("user", question);
    const response = generateCopilotResponse(question);
    window.setTimeout(() => {
      appendCopilotMessage("assistant", response);
    }, randomInt(220, 460));

    copilotInput.value = "";
    copilotInput.focus();
  });

  copilotMessages.addEventListener("wheel", (event) => {
    event.stopPropagation();
  });

  copilotClear.addEventListener("click", () => {
    copilotMessages.innerHTML = "";
    appendCopilotMessage(
      "assistant",
      "Chat cleared. Ask me anything about my background, projects, and role fit."
    );
  });

  copilotToggle.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      const nextState = !copilotPanel.classList.contains("open");
      copilotPanel.classList.toggle("open", nextState);
      filePanel.classList.remove("open");
      copilotToggle.classList.toggle("active", nextState);
      return;
    }

    const hidePanel = !vscodeWindow.classList.contains("copilot-hidden");
    vscodeWindow.classList.toggle("copilot-hidden", hidePanel);
    copilotToggle.classList.toggle("active", !hidePanel);
  });

  copilotInitialized = true;
}

function appendCopilotMessage(role, text) {
  const message = document.createElement("div");
  message.className = `copilot-msg role ${role}`;
  message.textContent = text;
  copilotMessages.appendChild(message);
  copilotMessages.scrollTop = copilotMessages.scrollHeight;
}

function generateCopilotResponse(question) {
  const q = question.toLowerCase();
  const words = tokenizeWords(q);
  const hasWord = (...tokens) => tokens.some((token) => words.includes(token));
  const hasPhrase = (...phrases) => phrases.some((phrase) => q.includes(phrase));

  if (hasWord("hi", "hello", "hey", "yo") || hasPhrase("good morning", "good afternoon", "good evening")) {
    return "Hi, I’m Nikhilesh AI. Ask me anything about my projects, research, work experience, skills, or internship fit.";
  }

  if (hasWord("name") || hasPhrase("who are you")) {
    return "I’m Nikhilesh AI, a portfolio assistant representing Nikhilesh Thiruvengadam.";
  }

  if (hasWord("thanks", "thx") || hasPhrase("thank you")) {
    return "Anytime. If you want, ask me for a 30-second pitch, strongest projects, or role fit summary.";
  }

  if (hasWord("resume", "cv")) {
    return "Open Resume.pdf from the desktop to view my full PDF resume. I can also summarize it in 30 seconds.";
  }

  if (hasPhrase("what can i ask") || hasWord("help", "examples")) {
    return `Try one of these:\n- ${copilotSuggestions.join("\n- ")}`;
  }

  const bestMatch = copilotKnowledge
    .map((entry) => ({
      entry,
      score: scoreQueryAgainstKeywords(q, entry.keywords),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (bestMatch && bestMatch.score > 0) {
    return bestMatch.entry.answer;
  }

  const contextual = inferAnswerFromPortfolioFiles(q);
  if (contextual) {
    return contextual;
  }

  return "I can answer that if you rephrase slightly. Try asking about projects, research impact, work experience, internship goals, or contact info.";
}

function scoreQueryAgainstKeywords(query, keywords) {
  const words = tokenizeWords(query);
  return keywords.reduce((score, keyword) => {
    const normalized = keyword.toLowerCase().trim();
    const matched = normalized.includes(" ") ? query.includes(normalized) : words.includes(normalized);
    if (!matched) {
      return score;
    }
    const weight = Math.max(1, normalized.split(/\s+/).length);
    return score + weight;
  }, 0);
}

function tokenizeWords(value) {
  return value
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function inferAnswerFromPortfolioFiles(query) {
  const tokens = query
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  if (!tokens.length) {
    return "";
  }

  let bestPath = "";
  let bestScore = 0;

  Object.entries(files).forEach(([path, file]) => {
    if (!file || typeof file.content !== "string" || file.type !== "markdown") {
      return;
    }

    const content = file.content.toLowerCase();
    let score = 0;
    tokens.forEach((token) => {
      if (content.includes(token)) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestPath = path;
    }
  });

  if (bestScore < 2 || !bestPath) {
    return "";
  }

  const rawLines = files[bestPath].content.split("\n").map((line) => line.trim());
  const matchedLines = rawLines
    .filter((line) => {
      if (!line || line.startsWith("#")) {
        return false;
      }
      const normalized = line.toLowerCase();
      return tokens.some((token) => normalized.includes(token));
    })
    .slice(0, 3)
    .map((line) => line.replace(/^-\s*/, "").replace(/\*\*/g, ""));

  if (!matchedLines.length) {
    return "";
  }

  return `From my portfolio content:\n- ${matchedLines.join("\n- ")}`;
}

function renderTree() {
  fileTree.innerHTML = "";
  fileButtonsByPath.clear();
  fileTree.appendChild(buildTreeNode(treeData, "", 0));
}

function buildTreeNode(node, parentPath, depth) {
  const li = document.createElement("li");
  li.className = "tree-item";

  const path = parentPath ? `${parentPath}/${node.name}` : node.name;
  const row = document.createElement("button");
  row.type = "button";
  row.className = `tree-row ${node.type}`;
  row.style.setProperty("--depth", String(depth));

  const caret = document.createElement("span");
  caret.className = "caret";
  const icon = document.createElement("span");
  icon.className = "tree-icon";
  const label = document.createElement("span");
  label.textContent = node.name;

  row.append(caret, icon, label);

  if (node.type === "folder") {
    caret.textContent = node.open ? "▾" : "▸";
    icon.innerHTML = folderIconMarkup(node.open);

    const children = document.createElement("ul");
    children.hidden = !node.open;

    node.children.forEach((child) => {
      children.appendChild(buildTreeNode(child, path, depth + 1));
    });

    row.addEventListener("click", () => {
      node.open = !node.open;
      children.hidden = !node.open;
      caret.textContent = node.open ? "▾" : "▸";
      icon.innerHTML = folderIconMarkup(node.open);
    });

    li.append(row, children);
    return li;
  }

  caret.textContent = "▸";
  icon.innerHTML = fileIconMarkup(node.name);
  row.dataset.path = path;
  row.addEventListener("click", () => openFile(path, row));
  fileButtonsByPath.set(path, row);
  li.appendChild(row);

  return li;
}

function folderIconMarkup(isOpen) {
  if (isOpen) {
    return `<svg class="tree-svg folder open" viewBox="0 0 16 16" aria-hidden="true">
      <path class="folder-back" d="M1.4 5.1h13.2v2.1H1.4z"/>
      <path class="folder-front" d="M1.2 6.6h13.6l-1.1 5.9c-0.12 0.64-0.67 1.1-1.32 1.1H2.6c-0.92 0-1.61-0.84-1.42-1.74z"/>
    </svg>`;
  }

  return `<svg class="tree-svg folder closed" viewBox="0 0 16 16" aria-hidden="true">
    <path class="folder-shell" d="M1.5 4.6h4.1l1.2-1.6h7.7v9.4c0 0.77-0.63 1.4-1.4 1.4H2.9c-0.77 0-1.4-0.63-1.4-1.4z"/>
    <path class="folder-band" d="M1.5 4.6h13v2.2h-13z"/>
  </svg>`;
}

function fileIconMarkup(fileName) {
  const lower = String(fileName || "").toLowerCase();

  let type = "generic";
  if (lower.endsWith(".md")) type = "md";
  else if (lower.endsWith(".pdf")) type = "pdf";
  else if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) type = "js";
  else if (lower.endsWith(".ts") || lower.endsWith(".tsx")) type = "ts";
  else if (lower.endsWith(".py")) type = "py";
  else if (lower.endsWith(".json")) type = "json";
  else if (lower.endsWith(".yml") || lower.endsWith(".yaml")) type = "yml";
  else if (lower.endsWith(".html")) type = "html";
  else if (lower.endsWith(".css")) type = "css";
  else if (lower.endsWith(".txt")) type = "txt";

  return `<svg class="tree-svg file ${type}" viewBox="0 0 16 16" aria-hidden="true">
    <path class="file-sheet" d="M3 1.4h6l4 4V14.5H3z"/>
    <path class="file-fold" d="M9 1.4v4h4"/>
    <rect class="file-accent" x="4.3" y="9.5" width="7.3" height="1.7" rx="0.85"/>
  </svg>`;
}

function editorTabLabel(path) {
  const parts = String(path || "")
    .split("/")
    .filter(Boolean);
  const fileName = parts[parts.length - 1] || path;
  const parentName = parts[parts.length - 2] || "";

  if (fileName.toLowerCase() === "readme.md" && parentName) {
    return `${parentName}/README.md`;
  }

  return fileName;
}

function renderEditorTabs() {
  if (!editorTabs) {
    return;
  }

  editorTabs.innerHTML = "";
  openEditorTabs.forEach((path) => {
    const tab = document.createElement("div");
    tab.className = `vscode-tab${path === activeEditorTabPath ? " active" : ""}`;
    tab.title = path;

    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "vscode-tab-btn";
    tabButton.textContent = editorTabLabel(path);
    tabButton.title = path;
    tabButton.setAttribute("aria-label", `Open ${path}`);
    tabButton.addEventListener("click", () => {
      openFile(path);
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "vscode-tab-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", `Close ${path}`);
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closeEditorTab(path);
    });

    tab.append(tabButton, closeButton);
    editorTabs.appendChild(tab);
  });
}

function closeEditorTab(path) {
  const tabIndex = openEditorTabs.indexOf(path);
  if (tabIndex < 0) {
    return;
  }

  const wasActive = activeEditorTabPath === path;
  openEditorTabs.splice(tabIndex, 1);

  if (!openEditorTabs.length) {
    openEditorTabs.push(DEFAULT_FILE);
  }

  if (!wasActive) {
    renderEditorTabs();
    return;
  }

  const nextIndex = Math.max(0, tabIndex - 1);
  const nextPath = openEditorTabs[Math.min(nextIndex, openEditorTabs.length - 1)] || DEFAULT_FILE;
  openFile(nextPath);
}

function openFile(path, clickedButton) {
  const file = files[path];
  if (!file) {
    return;
  }

  if (!openEditorTabs.includes(path)) {
    openEditorTabs.push(path);
  }
  activeEditorTabPath = path;
  renderEditorTabs();

  activeEditorFilePath = path;
  const language = file.language || inferLanguage(path);
  const lines = file.content.replace(/\r/g, "").split("\n");

  const html = lines
    .map((line, index) => {
      const highlighted = highlightLine(line, language);
      return `<div class="editor-row" data-line="${index + 1}"><span class="line-number">${index + 1}</span><span class="line-code">${highlighted}</span></div>`;
    })
    .join("");

  editorContent.innerHTML = html;
  statusLang.textContent = languageLabel(language);
  statusPos.textContent = "Ln 1, Col 1";

  const fileButton = clickedButton || fileButtonsByPath.get(path);
  if (activeFileButton) {
    activeFileButton.classList.remove("active");
  }
  if (fileButton) {
    fileButton.classList.add("active");
    activeFileButton = fileButton;
  }

  if (window.matchMedia("(max-width: 760px)").matches) {
    filePanel.classList.remove("open");
    copilotPanel.classList.remove("open");
    copilotToggle.classList.remove("active");
  }
}

function highlightLine(line, language) {
  if (!line) {
    return "&nbsp;";
  }

  if (language === "markdown") {
    return highlightMarkdownLine(line);
  }

  if (language === "python") {
    if (line.trim().startsWith("#")) {
      return `<span class="tok-comment">${escapeHtml(line)}</span>`;
    }

    return applyHighlightRules(line, [
      { regex: /(#.*$)/g, className: "tok-comment" },
      { regex: /("[^"]*"|'[^']*')/g, className: "tok-string" },
      { regex: /\b(def|class|return|if|elif|else|for|while|in|import|from|as|with|try|except|raise|pass|None|True|False)\b/g, className: "tok-keyword" },
      { regex: /\b([A-Za-z_][A-Za-z0-9_]*)(?=\()/g, className: "tok-function" },
      { regex: /\b(\d+(?:\.\d+)?)\b/g, className: "tok-number" },
    ]);
  }

  if (language === "yaml") {
    if (line.trim().startsWith("#")) {
      return `<span class="tok-comment">${escapeHtml(line)}</span>`;
    }

    return applyHighlightRules(line, [
      { regex: /(#.*$)/g, className: "tok-comment" },
      { regex: /^(\s*[A-Za-z0-9_.-]+:)/g, className: "tok-keyword" },
      { regex: /("[^"]*"|'[^']*')/g, className: "tok-string" },
      { regex: /\b(\d+(?:\.\d+)?)\b/g, className: "tok-number" },
    ]);
  }

  if (["javascript", "jsx", "typescript", "json", "html", "css", "dockerfile"].includes(language)) {
    if (line.trim().startsWith("//")) {
      return `<span class="tok-comment">${escapeHtml(line)}</span>`;
    }

    return applyHighlightRules(line, [
      { regex: /(\/\/.*$)/g, className: "tok-comment" },
      { regex: /("[^"]*"|'[^']*'|`[^`]*`)/g, className: "tok-string" },
      { regex: /\b(import|from|export|default|return|const|let|var|if|else|for|while|class|new|function|async|await|try|catch|throw|extends)\b/g, className: "tok-keyword" },
      { regex: /\b([A-Za-z_][A-Za-z0-9_]*)(?=\()/g, className: "tok-function" },
      { regex: /\b(\d+(?:\.\d+)?)\b/g, className: "tok-number" },
    ]);
  }

  return escapeHtml(line);
}

function alphaMarker(index) {
  let value = index;
  let output = "";
  do {
    output = String.fromCharCode(97 + (value % 26)) + output;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return output;
}

function highlightMarkdownLine(line) {
  let text = escapeHtml(line);
  const placeholders = Object.create(null);
  let placeholderCount = 0;

  const place = (value) => {
    const key = `md${alphaMarker(placeholderCount)}`;
    placeholderCount += 1;
    placeholders[key] = value;
    const marker = `\u0000${key}\u0000`;
    return marker;
  };

  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, rawAlt, rawUrl) => {
    const alt = rawAlt.trim();
    const resolvedUrl = resolveMarkdownHref(rawUrl);
    if (!isLikelyLink(resolvedUrl)) {
      return place(`<span class="tok-link">![${escapeHtml(alt)}](${escapeHtml(rawUrl.trim())})</span>`);
    }

    const safeSrc = escapeHtml(resolvedUrl);
    const safeAlt = escapeHtml(alt || "Markdown image");
    return place(
      `<a class="editor-link md-image-link" href="${safeSrc}" rel="noreferrer noopener"><img class="md-inline-image" src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async"></a>`
    );
  });

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, rawLabel, rawUrl) => {
    const label = rawLabel.trim();
    const resolvedUrl = resolveMarkdownHref(rawUrl);
    if (!isLikelyLink(resolvedUrl)) {
      return place(`<span class="tok-link">[${label}](${escapeHtml(rawUrl.trim())})</span>`);
    }

    const safeHref = escapeHtml(resolvedUrl);
    return place(`<a class="editor-link tok-link" href="${safeHref}" rel="noreferrer noopener">${label}</a>`);
  });

  text = text.replace(/\bhttps?:\/\/[^\s<>()]+/g, (rawUrl) => {
    const url = decodeEscapedHtml(rawUrl.trim());
    if (!isLikelyLink(url)) {
      return rawUrl;
    }
    const safeHref = escapeHtml(url);
    return place(`<a class="editor-link tok-link" href="${safeHref}" rel="noreferrer noopener">${rawUrl}</a>`);
  });

  text = text.replace(/^(#{1,6}\s.*)$/g, (match) => place(`<span class="tok-keyword">${match}</span>`));
  text = text.replace(/^(\s*-\s)/g, (match) => place(`<span class="tok-number">${match}</span>`));
  text = text.replace(/(`[^`]+`)/g, (match) => place(`<span class="tok-string">${match}</span>`));
  text = text.replace(/\*\*([^*]+)\*\*/g, (_match, boldText) => place(`<span class="tok-bold">${boldText}</span>`));

  return text.replace(/\u0000(md[a-z]+)\u0000/g, (_, key) => placeholders[key] || "");
}

function applyHighlightRules(line, rules) {
  let text = escapeHtml(line);
  const placeholders = Object.create(null);
  let placeholderCount = 0;

  const makePlaceholder = (value) => {
    const key = `ph${alphaMarker(placeholderCount)}`;
    placeholderCount += 1;
    placeholders[key] = value;
    const marker = `\u0000${key}\u0000`;
    return marker;
  };

  rules.forEach((rule) => {
    text = text.replace(rule.regex, (match) => {
      return makePlaceholder(`<span class="${rule.className}">${match}</span>`);
    });
  });

  return text.replace(/\u0000(ph[a-z]+)\u0000/g, (_, key) => placeholders[key] || "");
}

function inferLanguage(path) {
  const basename = path.split("/").pop() || "";
  if (/^dockerfile$/i.test(basename)) {
    return "dockerfile";
  }
  if (/^\.gitignore$/i.test(basename)) {
    return "text";
  }
  if (/^\.env/i.test(basename)) {
    return "text";
  }

  const extension = path.split(".").pop() || "txt";
  const map = {
    md: "markdown",
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    css: "css",
    html: "html",
    sh: "shell",
    toml: "toml",
    cfg: "text",
    ini: "text",
    txt: "text",
  };

  return map[extension] || extension;
}

function languageLabel(language) {
  const labels = {
    markdown: "Markdown",
    javascript: "JavaScript",
    jsx: "JavaScript React",
    typescript: "TypeScript",
    json: "JSON",
    python: "Python",
    yaml: "YAML",
    css: "CSS",
    html: "HTML",
    shell: "Shell Script",
    dockerfile: "Dockerfile",
    toml: "TOML",
    text: "Text",
  };

  return labels[language] || language.toUpperCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeEscapedHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function resolveMarkdownHref(rawUrl) {
  const value = decodeEscapedHtml(String(rawUrl || "").trim());
  if (!value) {
    return "";
  }

  if (value.startsWith("#") || /^javascript:/i.test(value)) {
    return value;
  }

  if (/^(https?:\/\/|mailto:|tel:|\/|assets\/)/i.test(value)) {
    return value;
  }

  const base = markdownRemoteBases.get(activeEditorFilePath);
  if (!base) {
    return value;
  }

  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

function isLikelyLink(value) {
  return /^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|assets\/)/i.test(value);
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  updateSoundToggle();

  if (!soundEnabled) {
    stopAudio(biosAudio);
    stopAudio(startupAudio);
  } else if (screens.boot.classList.contains("active")) {
    playAudio(biosAudio, false);
  }
});

document.addEventListener("keydown", onStartupKey);
screens.preboot.addEventListener("pointerdown", onStartupPointer);
window.addEventListener("resize", () => {
  appStates.forEach((state) => {
    if (state.maximized) {
      maximizeApp(state, true);
    }
  });
  resizeDesktopWatermark();
});

updateSoundToggle();
setActiveScreen("preboot");
