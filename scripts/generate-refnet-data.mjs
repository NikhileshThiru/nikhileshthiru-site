import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOT = "/Users/nikhilesh/Code/Projects/refnet/RefNet";
const OUTPUT_FILE = path.resolve(process.cwd(), "refnet-data.js");

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".idea",
  ".vscode",
]);

const EXCLUDED_FILES = new Set([
  ".DS_Store",
  ".env",
  ".npmrc",
  ".yarnrc",
  ".yarnrc.yml",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "poetry.lock",
  "Pipfile.lock",
]);

const EXCLUDED_FILE_PATTERNS = [
  /^\.env(\..*)?$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /^known_hosts$/i,
  /^authorized_keys$/i,
  /^credentials(\..*)?$/i,
  /^secret(s)?(\..*)?$/i,
];

const EXCLUDED_FILE_EXTENSIONS = new Set([
  ".pem",
  ".key",
  ".crt",
  ".cer",
  ".p12",
  ".pfx",
  ".jks",
  ".keystore",
  ".kdb",
]);

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".wav",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".pyc",
]);

const MAX_CHARS = 140_000;

const SENSITIVE_CONTENT_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{36,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[0-9A-Za-z\\-_]{35}/,
  /-----BEGIN OPENSSH PRIVATE KEY-----/,
];

const languageByExt = {
  ".md": "markdown",
  ".py": "python",
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "jsx",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".css": "css",
  ".html": "html",
  ".sh": "shell",
  ".env": "text",
  ".txt": "text",
  ".toml": "toml",
  ".cfg": "text",
  ".ini": "text",
  ".svg": "html",
};

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function shouldExcludeFile(name) {
  if (EXCLUDED_FILES.has(name)) {
    return true;
  }

  if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(name))) {
    return true;
  }

  const ext = path.extname(name).toLowerCase();
  if (EXCLUDED_FILE_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

function inferLanguage(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  if (languageByExt[ext]) {
    return languageByExt[ext];
  }

  const base = path.basename(absPath).toLowerCase();
  if (base === "dockerfile") {
    return "dockerfile";
  }
  if (base === ".gitignore") {
    return "text";
  }
  return "text";
}

function hasSensitiveContent(value) {
  return SENSITIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(value));
}

async function isLikelyText(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return false;
  }

  const handle = await fs.open(absPath, "r");
  try {
    const sample = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(sample, 0, sample.length, 0);
    for (let i = 0; i < bytesRead; i += 1) {
      if (sample[i] === 0) {
        return false;
      }
    }
    return true;
  } finally {
    await handle.close();
  }
}

async function getTextContent(absPath) {
  let content = await fs.readFile(absPath, "utf8");
  if (content.length > MAX_CHARS) {
    const omitted = content.length - MAX_CHARS;
    content = `${content.slice(0, MAX_CHARS)}\n\n[Truncated ${omitted} characters for portfolio preview]`;
  }
  return content;
}

async function buildTreeAndFiles(absDir, relDir = "") {
  const entries = await fs.readdir(absDir, { withFileTypes: true });

  const visible = entries
    .filter((entry) => {
      if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) {
        return false;
      }
      if (entry.isFile() && EXCLUDED_FILES.has(entry.name)) {
        return false;
      }
      if (entry.isFile() && shouldExcludeFile(entry.name)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) {
        return -1;
      }
      if (!a.isDirectory() && b.isDirectory()) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

  const children = [];
  const fileEntries = {};

  for (const entry of visible) {
    const absPath = path.join(absDir, entry.name);
    const nextRel = relDir ? `${relDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const nested = await buildTreeAndFiles(absPath, nextRel);
      if (!nested.tree.length && !Object.keys(nested.files).length) {
        continue;
      }
      children.push({
        name: entry.name,
        type: "folder",
        open: false,
        children: nested.tree,
      });
      Object.assign(fileEntries, nested.files);
      continue;
    }

    const key = `nikhileshthiru/projects/refnet/${toPosixPath(nextRel)}`;
    const language = inferLanguage(absPath);
    const textFile = await isLikelyText(absPath);

    let content;
    if (textFile) {
      content = await getTextContent(absPath);
      if (hasSensitiveContent(content)) {
        continue;
      }
    } else {
      content = `[Binary file omitted in portfolio preview]\n${toPosixPath(nextRel)}`;
    }

    fileEntries[key] = {
      type: language === "markdown" ? "markdown" : "code",
      language,
      content,
    };

    children.push({ name: entry.name, type: "file" });
  }

  return { tree: children, files: fileEntries };
}

async function main() {
  const stats = await fs.stat(SOURCE_ROOT);
  if (!stats.isDirectory()) {
    throw new Error(`Source path is not a directory: ${SOURCE_ROOT}`);
  }

  const { tree, files } = await buildTreeAndFiles(SOURCE_ROOT);

  const moduleText = `// Auto-generated by scripts/generate-refnet-data.mjs\n` +
    `export const refnetTree = ${JSON.stringify({
      name: "refnet",
      type: "folder",
      open: false,
      children: tree,
    }, null, 2)};\n\n` +
    `export const refnetFiles = ${JSON.stringify(files, null, 2)};\n`;

  await fs.writeFile(OUTPUT_FILE, moduleText, "utf8");
  console.log(`Generated ${Object.keys(files).length} RefNet files at ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
