// Compares the GitHub account's public repos against the project pages in
// content.js, so the site never silently falls behind new work.
//
//   npm run sync
//
// - Lists every public repo with its last-push date and whether it has a page
// - Downloads the README of each repo missing from the site into
//   scripts/sync-cache/<repo>.md as raw material for a new curated page
// - Never overwrites content.js: project pages are curated by hand (or by
//   pointing Claude at the cached README and asking for a page)

import fs from "node:fs/promises";
import path from "node:path";

const GITHUB_USER = "NikhileshThiru";
const CONTENT_FILE = path.resolve(process.cwd(), "content.js");
const CACHE_DIR = path.resolve(process.cwd(), "scripts", "sync-cache");

// Repos that should never appear on the site.
const IGNORED_REPOS = new Set([
  "test",
  "modtest",
  "python",
  "java",
  "IBeeSite",
  "ibeeReplica.github.io",
]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchReadme(repo, branch) {
  const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/${branch}/README.md`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return response.text();
}

function sitePageSlugs(contentSource) {
  const slugs = new Set();
  const pattern = /nikhileshthiru\/projects\/([a-z0-9-]+)\/README\.md/gi;
  let match;
  while ((match = pattern.exec(contentSource)) !== null) {
    slugs.add(match[1].toLowerCase());
  }
  return slugs;
}

const contentSource = await fs.readFile(CONTENT_FILE, "utf8");
const onSite = sitePageSlugs(contentSource);

const repos = await fetchJson(
  `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`
);

const rows = [];
const missing = [];

for (const repo of repos) {
  if (IGNORED_REPOS.has(repo.name)) {
    continue;
  }

  const slug = repo.name.toLowerCase();
  const hasPage = onSite.has(slug) || slug === "nikhileshthiru-site" || slug === "refnet";
  rows.push({
    name: repo.name,
    pushed: repo.pushed_at.slice(0, 10),
    hasPage,
    description: repo.description || "",
  });

  if (!hasPage) {
    missing.push(repo);
  }
}

console.log(`\nGitHub repos for ${GITHUB_USER} (newest push first):\n`);
for (const row of rows) {
  const marker = row.hasPage ? "on site " : "MISSING ";
  console.log(`  ${marker} ${row.pushed}  ${row.name.padEnd(28)} ${row.description.slice(0, 60)}`);
}

if (!missing.length) {
  console.log("\nEvery repo either has a project page or is ignored. Site is current.\n");
  process.exit(0);
}

await fs.mkdir(CACHE_DIR, { recursive: true });
console.log(`\nFetching READMEs for ${missing.length} repo(s) without a page...`);

for (const repo of missing) {
  const readme = await fetchReadme(repo.name, repo.default_branch || "main");
  if (!readme) {
    console.log(`  ${repo.name}: no README found, skipped`);
    continue;
  }
  const target = path.join(CACHE_DIR, `${repo.name}.md`);
  await fs.writeFile(target, readme, "utf8");
  console.log(`  ${repo.name}: saved ${path.relative(process.cwd(), target)}`);
}

console.log(`
Next steps to add a project page:
  1. Read the cached README in scripts/sync-cache/
  2. Add a curated entry in content.js (files + treeData) following the
     existing pages: one-liner, screenshot, "Engineering story", stack, links
  3. Screenshot images can be hot-linked from the repo:
     https://raw.githubusercontent.com/${GITHUB_USER}/<repo>/<branch>/<path>
     (append #w=230 to render phone screenshots side by side)
  4. npm run dev to preview, then commit and push to deploy
`);
