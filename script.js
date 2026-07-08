"use strict";

import {
  DEFAULT_FILE,
  treeData,
  files,
  markdownRemoteBases,
  profileLinks,
  resumePdfUrl,
} from "./content.js";

const screens = {
  preboot: document.getElementById("preboot"),
  boot: document.getElementById("boot"),
  desktop: document.getElementById("desktop"),
};

const biosText = document.getElementById("biosText");
const biosAudio = document.getElementById("biosAudio");
const startupAudio = document.getElementById("startupAudio");
const clickAudio = document.getElementById("clickAudio");
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

let bootTriggered = false;
let bootSkipRequested = false;
let desktopInitialized = false;
let browserInitialized = false;
let soundEnabled = true;
let clockInterval = null;
let activeFileButton = null;
let browserHistory = [];
let browserHistoryIndex = -1;
let activeEditorFilePath = DEFAULT_FILE;
let activeEditorTabPath = DEFAULT_FILE;
let tesseractAnimationState = null;
const CLICK_SOUND_VOLUME = 0.5;

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
const browserHomeUrl = "https://www.google.com/search?igu=1";
const browserSearchUrl = "https://www.google.com/search?igu=1&q=";
const browserShortcutUrls = new Map([
  ["x", profileLinks.x],
  ["twitter", profileLinks.x],
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

let bootSkipArmedAt = 0;

function requestBootSkip(event) {
  if (event instanceof KeyboardEvent && (event.repeat || shouldIgnoreStartupKey(event))) {
    return;
  }
  // The gesture that starts the boot must never also skip it: the initial
  // pointerdown bubbles to document after these listeners attach, and held
  // keys auto-repeat. Only honor a deliberate second gesture.
  if (performance.now() < bootSkipArmedAt) {
    return;
  }
  bootSkipRequested = true;
}

async function runBootSequence() {
  setActiveScreen("boot");
  biosText.innerHTML = "";

  bootSkipArmedAt = performance.now() + 900;
  document.addEventListener("keydown", requestBootSkip);
  document.addEventListener("pointerdown", requestBootSkip);

  if (soundEnabled) {
    playAudio(biosAudio, false);
  }

  for (let pageIndex = 0; pageIndex < biosPages.length && !bootSkipRequested; pageIndex += 1) {
    const page = biosPages[pageIndex];
    const body = buildBiosPage(page);

    for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex += 1) {
      if (bootSkipRequested) {
        break;
      }
      const step = page.lines[lineIndex];
      await renderBiosLine(body, step, lineIndex);
      await wait(biosStepPause(step, lineIndex));
    }

    if (bootSkipRequested) {
      break;
    }

    await wait(page.pagePause ?? 220);
    if (pageIndex < biosPages.length - 1) {
      biosText.classList.add("page-flash");
      await wait(60);
      biosText.classList.remove("page-flash");
      biosText.innerHTML = "";
    }
  }

  document.removeEventListener("keydown", requestBootSkip);
  document.removeEventListener("pointerdown", requestBootSkip);
  bootSkipRequested = false;

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

function playClickSound() {
  if (!soundEnabled || !clickAudio) {
    return;
  }

  // Single-channel playback: rapid clicks restart the sound instead of overlapping.
  clickAudio.pause();
  clickAudio.currentTime = 0;
  clickAudio.volume = CLICK_SOUND_VOLUME;
  clickAudio.muted = !soundEnabled;
  clickAudio.play().catch(() => {
    // Ignore autoplay edge cases.
  });
}

const SPEAKER_ON_SVG = `<svg class="tray-speaker" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M2 6h2.6L8 3v10L4.6 10H2z" fill="currentColor"/>
  <path d="M10.2 5.4a3.6 3.6 0 0 1 0 5.2M12 3.6a6.2 6.2 0 0 1 0 8.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
</svg>`;

const SPEAKER_OFF_SVG = `<svg class="tray-speaker" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M2 6h2.6L8 3v10L4.6 10H2z" fill="currentColor"/>
  <path d="M10 6l4 4M14 6l-4 4" fill="none" stroke="#b00" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

function updateSoundToggle() {
  soundToggle.innerHTML = soundEnabled ? SPEAKER_ON_SVG : SPEAKER_OFF_SVG;
  soundToggle.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Unmute sound");
  soundToggle.title = soundEnabled ? "Mute sound" : "Unmute sound";
  soundToggle.classList.toggle("muted", !soundEnabled);
  biosAudio.muted = !soundEnabled;
  startupAudio.muted = !soundEnabled;
  clickAudio.muted = !soundEnabled;
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
    openBrowserTo(profileLinks.linkedin);
    closeStartMenu();
  };
  const openGitHub = () => {
    openBrowserTo(profileLinks.github);
    closeStartMenu();
  };
  const openX = () => {
    openBrowserTo(profileLinks.x);
    closeStartMenu();
  };

  const iconActions = [
    [vscodeDesktopIcon, openVscode],
    [ieDesktopIcon, openIe],
    [resumeDesktopIcon, openResume],
    [linkedinDesktopIcon, openLinkedIn],
    [githubDesktopIcon, openGitHub],
    [xDesktopIcon, openX],
  ];

  iconActions.forEach(([icon, openAction]) => {
    icon.addEventListener("dblclick", openAction);
    icon.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAction();
      }
    });
  });

  treeToggle.addEventListener("click", () => {
    filePanel.classList.toggle("open");
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

function desktopIconArtMarkup(iconElement) {
  const art = iconElement ? iconElement.querySelector(".desktop-icon-art") : null;
  return art ? art.outerHTML : "";
}

function bindStartMenu() {
  const content = startMenu.querySelector(".start-menu-content");
  content.innerHTML = "";

  const items = [
    { label: "Visual Studio Code", icon: desktopIconArtMarkup(vscodeDesktopIcon), action: () => openApp("vscode") },
    { label: "Internet Explorer", icon: desktopIconArtMarkup(ieDesktopIcon), action: () => openBrowserHome() },
    { label: "Resume.pdf", icon: desktopIconArtMarkup(resumeDesktopIcon), action: () => openBrowserTo(resumePdfUrl) },
    { separator: true },
    { label: "LinkedIn", icon: desktopIconArtMarkup(linkedinDesktopIcon), action: () => openBrowserTo(profileLinks.linkedin) },
    { label: "GitHub", icon: desktopIconArtMarkup(githubDesktopIcon), action: () => openBrowserTo(profileLinks.github) },
    { label: "X", icon: desktopIconArtMarkup(xDesktopIcon), action: () => openBrowserTo(profileLinks.x) },
    { separator: true },
    { label: "Restart...", icon: `<img class="start-item-restart" src="${new URL("./assets/start-95.png", import.meta.url).href}" alt="">`, action: () => window.location.reload() },
  ];

  items.forEach((item) => {
    if (item.separator) {
      const divider = document.createElement("div");
      divider.className = "start-separator";
      content.appendChild(divider);
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "start-item";

    const iconSpan = document.createElement("span");
    iconSpan.className = "start-item-icon";
    iconSpan.setAttribute("aria-hidden", "true");
    iconSpan.innerHTML = item.icon;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = item.label;

    button.append(iconSpan, labelSpan);
    button.addEventListener("click", () => {
      closeStartMenu();
      item.action();
    });
    content.appendChild(button);
  });

  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (startMenu.classList.contains("hidden")) {
      openStartMenu();
    } else {
      closeStartMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (startMenu.classList.contains("hidden")) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && (startMenu.contains(target) || startButton.contains(target))) {
      return;
    }
    closeStartMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStartMenu();
    }
  });
}

function openStartMenu() {
  startMenu.classList.remove("hidden");
  startButton.classList.add("active");
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

    const widthMatch = resolvedUrl.match(/#w=(\d+)$/);
    const displayUrl = widthMatch ? resolvedUrl.slice(0, -widthMatch[0].length) : resolvedUrl;
    const widthAttr = widthMatch ? ` style="width:${widthMatch[1]}px"` : "";
    const safeSrc = escapeHtml(displayUrl);
    const safeAlt = escapeHtml(alt || "Markdown image");
    return place(
      `<a class="editor-link md-image-link" href="${safeSrc}" rel="noreferrer noopener"><img class="md-inline-image" src="${safeSrc}" alt="${safeAlt}"${widthAttr} loading="lazy" decoding="async"></a>`
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
  clock.title = now.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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

document.addEventListener("click", () => {
  playClickSound();
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
