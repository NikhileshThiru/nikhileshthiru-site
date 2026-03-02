import { defineConfig } from "vite";

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isSkippableUrl(value) {
  if (!value) {
    return true;
  }

  const normalized = String(value).trim().toLowerCase();
  return (
    normalized.startsWith("#") ||
    normalized.startsWith("javascript:") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  );
}

function toAbsoluteHttpUrl(rawValue, baseUrl) {
  try {
    const absolute = new URL(rawValue, baseUrl);
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      return "";
    }
    return absolute.href;
  } catch {
    return "";
  }
}

function toProxyPath(url) {
  return `/ie-proxy?url=${encodeURIComponent(url)}`;
}

const browserSearchShortcuts = new Map([
  ["x", "https://x.com/NikhileshThiru"],
  ["twitter", "https://x.com/NikhileshThiru"],
  ["github", "https://github.com"],
  ["linkedin", "https://linkedin.com"],
  ["linkeding", "https://linkedin.com"],
]);

function resolveBrowserShortcut(query) {
  const normalized = String(query || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  if (!normalized || /\s/.test(normalized)) {
    return "";
  }

  return browserSearchShortcuts.get(normalized) || "";
}

function toEmbeddedBrowserPath(url) {
  return toProxyPath(url);
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(value) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulResultUrl(url) {
  try {
    const parsed = new URL(url);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (!host) {
      return false;
    }

    if (host === "google.com" || host.endsWith(".google.com")) {
      return false;
    }

    if (
      host.endsWith(".gstatic.com") ||
      host.includes("googleusercontent.com") ||
      host.startsWith("encrypted-tbn")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function parseGoogleResultsFromHtml(html, maxResults = 12) {
  const results = [];
  const seen = new Set();
  const pattern = /<a\s+[^>]*href="\/url\?q=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (results.length >= maxResults) {
      break;
    }

    let decodedUrl = "";
    try {
      decodedUrl = decodeURIComponent(match[1]);
    } catch {
      decodedUrl = match[1];
    }

    if (!isUsefulResultUrl(decodedUrl) || seen.has(decodedUrl)) {
      continue;
    }

    const anchorHtml = match[2] || "";
    const titleMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(anchorHtml);
    const titleText = stripHtml(titleMatch ? titleMatch[1] : anchorHtml);
    let host = "";
    try {
      host = new URL(decodedUrl).hostname;
    } catch {
      host = decodedUrl;
    }

    const title = titleText || host || decodedUrl;
    results.push({ title, url: decodedUrl, host });
    seen.add(decodedUrl);
  }

  return results;
}

function parseGoogleResultsFromMarkdown(markdown, maxResults = 12) {
  const text = String(markdown || "");
  const startIndex = text.indexOf("Search Results");
  const scoped = startIndex >= 0 ? text.slice(startIndex) : text;
  const sanitized = scoped.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  const results = [];
  const seen = new Set();

  const patterns = [
    /\[\s*###\s*([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/gi,
    /###\s*\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/gi,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(sanitized)) !== null && results.length < maxResults) {
      const rawTitle = match[1] || "";
      const rawUrl = match[2] || "";
      if (!isUsefulResultUrl(rawUrl) || seen.has(rawUrl)) {
        continue;
      }

      const title = stripHtml(rawTitle.replace(/https?:\/\/\S+/g, ""));
      if (!title || /^image\s+\d+$/i.test(title)) {
        continue;
      }

      let host = "";
      try {
        host = new URL(rawUrl).hostname;
      } catch {
        host = rawUrl;
      }

      results.push({ title: title || host || rawUrl, url: rawUrl, host });
      seen.add(rawUrl);
    }
  });

  return results;
}

function unwrapDuckDuckGoResultUrl(rawUrl) {
  const candidate = String(rawUrl || "").trim();
  if (!candidate) {
    return "";
  }

  try {
    const parsed = new URL(candidate, "https://duckduckgo.com");
    const isDuckRedirect =
      parsed.hostname.endsWith("duckduckgo.com") && parsed.pathname.startsWith("/l/");
    if (isDuckRedirect) {
      const redirected = parsed.searchParams.get("uddg");
      if (redirected) {
        return redirected;
      }
    }

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return "";
  }

  return "";
}

function parseDuckDuckGoResultsFromHtml(html, maxResults = 12) {
  const results = [];
  const seen = new Set();
  const pattern = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    if (results.length >= maxResults) {
      break;
    }

    const destination = unwrapDuckDuckGoResultUrl(match[1]);
    if (!isUsefulResultUrl(destination) || seen.has(destination)) {
      continue;
    }

    const rawTitle = stripHtml(match[2] || "");
    let host = "";
    try {
      host = new URL(destination).hostname;
    } catch {
      host = destination;
    }

    const title = rawTitle || host || destination;
    results.push({ title, url: destination, host });
    seen.add(destination);
  }

  return results;
}

function isGoogleChallengeMarkup(html) {
  const content = String(html || "");
  return (
    /If you're having trouble accessing Google Search/i.test(content) ||
    /id=["']yvlrue["']/i.test(content) ||
    /challenge_version/i.test(content)
  );
}

function renderSearchResultCard(item) {
  const url = String(item?.url || "");
  const host = String(item?.host || "");
  const title = String(item?.title || host || url || "Result");
  const href = url ? toEmbeddedBrowserPath(url) : "#";

  return `<article class="result">
  <a class="result-title" href="${escapeAttribute(href)}">${escapeAttribute(title)}</a>
  <div class="result-host">${escapeAttribute(host)}</div>
  <div class="result-link">${escapeAttribute(url)}</div>
</article>`;
}

function renderIeSearchHtml({ query, results = [], error = "", provider = "Google" }) {
  const q = String(query || "").trim();
  const escapedQuery = escapeAttribute(q);
  const hasQuery = Boolean(q);
  const hasError = Boolean(String(error || "").trim());
  const safeProvider = escapeAttribute(provider || "Google");

  const infoText = hasQuery
    ? `<p class="meta">Web results for <strong>${escapeAttribute(q)}</strong> <span class="provider">via ${safeProvider}</span></p>`
    : `<p class="meta">Search the web inside Internet Explorer.</p>`;

  let resultsMarkup = `<p class="empty">Type a search to begin.</p>`;
  if (hasQuery && hasError) {
    resultsMarkup = `<p class="error">${escapeAttribute(error)}</p>`;
  } else if (hasQuery && Array.isArray(results) && results.length === 0) {
    resultsMarkup = `<p class="meta">No results found for <strong>${escapeAttribute(q)}</strong>.</p>`;
  } else if (hasQuery && Array.isArray(results)) {
    resultsMarkup = results.map((item) => renderSearchResultCard(item)).join("");
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Google</title>
  <style>
    :root {
      color-scheme: only light;
    }
    body {
      margin: 0;
      background: #ffffff;
      color: #202124;
      font: 14px Tahoma, Arial, sans-serif;
      line-height: 1.35;
    }
    .page {
      max-width: 900px;
      margin: 18px auto;
      padding: 0 16px 24px;
    }
    .logo {
      font: 700 40px "Trebuchet MS", Arial, sans-serif;
      letter-spacing: -1px;
      margin: 6px 0 14px;
      user-select: none;
    }
    .logo span:nth-child(1) { color: #4285f4; }
    .logo span:nth-child(2) { color: #ea4335; }
    .logo span:nth-child(3) { color: #fbbc05; }
    .logo span:nth-child(4) { color: #4285f4; }
    .logo span:nth-child(5) { color: #34a853; }
    .logo span:nth-child(6) { color: #ea4335; }
    form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    input[type="search"] {
      border: 1px solid #c4c7c5;
      border-radius: 2px;
      padding: 8px 10px;
      font: 14px Tahoma, Arial, sans-serif;
      color: #202124;
    }
    input[type="search"]:focus {
      outline: 1px solid #1a73e8;
    }
    button {
      border: 1px solid #8f9092;
      background: #f8f9fa;
      color: #202124;
      border-radius: 2px;
      padding: 8px 14px;
      font: 13px Tahoma, Arial, sans-serif;
      cursor: pointer;
    }
    button:hover {
      background: #f1f3f4;
    }
    .meta {
      margin: 12px 0 16px;
      color: #5f6368;
      font-size: 12px;
    }
    .provider {
      color: #6b7280;
      font-size: 11px;
    }
    .error {
      margin: 12px 0 16px;
      color: #b00020;
      font-size: 12px;
    }
    .result {
      padding: 10px 0 14px;
      border-bottom: 1px solid #eceff1;
    }
    .result-title {
      color: #1a0dab;
      font-size: 18px;
      text-decoration: none;
    }
    .result-title:hover {
      text-decoration: underline;
    }
    .result-host {
      color: #188038;
      font-size: 13px;
      margin-top: 3px;
      word-break: break-all;
    }
    .result-link {
      color: #5f6368;
      font-size: 12px;
      margin-top: 2px;
      word-break: break-all;
    }
    .empty {
      margin: 16px 0;
      color: #444;
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="logo" aria-label="Google">
      <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
    </div>
    <form action="/ie-search" method="get">
      <input type="search" name="q" value="${escapedQuery}" placeholder="Search Google" autocomplete="off" autofocus>
      <button type="submit">Google Search</button>
    </form>
    ${infoText}
    <section id="resultsContainer">${resultsMarkup}</section>
  </main>
</body>
</html>`;
}

const proxyCookieJar = new Map();
const MAX_PROXY_REDIRECTS = 10;

function normalizeCookieDomain(value, fallbackDomain) {
  const raw = String(value || fallbackDomain || "")
    .trim()
    .toLowerCase()
    .replace(/^\./, "");
  return raw;
}

function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function readSetCookieHeaders(headers) {
  if (!headers) {
    return [];
  }

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const combined = headers.get("set-cookie");
  if (!combined) {
    return [];
  }

  return combined.split(/,(?=[^;,]+=)/g);
}

function parseSetCookieHeader(setCookie, requestUrl) {
  const parts = String(setCookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const firstEqualsIndex = parts[0].indexOf("=");
  if (firstEqualsIndex <= 0) {
    return null;
  }

  const name = parts[0].slice(0, firstEqualsIndex).trim();
  const value = parts[0].slice(firstEqualsIndex + 1).trim();
  if (!name) {
    return null;
  }

  let domain = normalizeCookieDomain("", requestUrl.hostname);
  let path = "/";
  let expiresAt = null;
  let maxAge = null;

  for (let i = 1; i < parts.length; i += 1) {
    const attribute = parts[i];
    const separatorIndex = attribute.indexOf("=");
    const rawKey = separatorIndex >= 0 ? attribute.slice(0, separatorIndex) : attribute;
    const rawValue = separatorIndex >= 0 ? attribute.slice(separatorIndex + 1) : "";
    const key = rawKey.trim().toLowerCase();
    const attributeValue = rawValue.trim();

    if (key === "domain" && attributeValue) {
      domain = normalizeCookieDomain(attributeValue, requestUrl.hostname);
      continue;
    }

    if (key === "path" && attributeValue) {
      path = attributeValue.startsWith("/") ? attributeValue : "/";
      continue;
    }

    if (key === "max-age") {
      const parsed = Number.parseInt(attributeValue, 10);
      if (!Number.isNaN(parsed)) {
        maxAge = parsed;
      }
      continue;
    }

    if (key === "expires") {
      const timestamp = Date.parse(attributeValue);
      if (!Number.isNaN(timestamp)) {
        expiresAt = timestamp;
      }
    }
  }

  if (typeof maxAge === "number") {
    expiresAt = Date.now() + maxAge * 1000;
  }

  return { domain, path, name, value, expiresAt };
}

function storeCookies(headers, requestUrl) {
  const setCookieHeaders = readSetCookieHeaders(headers);
  if (!setCookieHeaders.length) {
    return;
  }

  const now = Date.now();
  setCookieHeaders.forEach((headerValue) => {
    const cookie = parseSetCookieHeader(headerValue, requestUrl);
    if (!cookie) {
      return;
    }

    let domainCookies = proxyCookieJar.get(cookie.domain);
    if (!domainCookies) {
      domainCookies = new Map();
      proxyCookieJar.set(cookie.domain, domainCookies);
    }

    if (cookie.expiresAt !== null && cookie.expiresAt <= now) {
      domainCookies.delete(cookie.name);
      if (domainCookies.size === 0) {
        proxyCookieJar.delete(cookie.domain);
      }
      return;
    }

    domainCookies.set(cookie.name, cookie);
  });
}

function cookieDomainMatches(hostname, cookieDomain) {
  return hostname === cookieDomain || hostname.endsWith(`.${cookieDomain}`);
}

function buildCookieHeader(requestUrl) {
  const now = Date.now();
  const hostname = requestUrl.hostname.toLowerCase();
  const path = requestUrl.pathname || "/";
  const pairs = [];

  for (const [cookieDomain, cookies] of proxyCookieJar.entries()) {
    if (!cookieDomainMatches(hostname, cookieDomain)) {
      continue;
    }

    for (const [cookieName, cookie] of cookies.entries()) {
      if (cookie.expiresAt !== null && cookie.expiresAt <= now) {
        cookies.delete(cookieName);
        continue;
      }

      if (cookie.path && !path.startsWith(cookie.path)) {
        continue;
      }

      pairs.push(`${cookie.name}=${cookie.value}`);
    }

    if (!cookies.size) {
      proxyCookieJar.delete(cookieDomain);
    }
  }

  return pairs.join("; ");
}

async function fetchUpstreamWithCookies(startUrl) {
  const sharedHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  let currentUrl = startUrl;

  for (let redirectCount = 0; redirectCount <= MAX_PROXY_REDIRECTS; redirectCount += 1) {
    const requestUrl = new URL(currentUrl);
    const headers = { ...sharedHeaders };
    const cookieHeader = buildCookieHeader(requestUrl);
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const upstream = await fetch(requestUrl.href, {
      redirect: "manual",
      headers,
    });

    storeCookies(upstream.headers, requestUrl);

    if (isRedirectStatus(upstream.status)) {
      const location = upstream.headers.get("location");
      if (!location) {
        return { upstream, resolvedUrl: requestUrl.href };
      }
      currentUrl = new URL(location, requestUrl.href).href;
      continue;
    }

    return { upstream, resolvedUrl: upstream.url || requestUrl.href };
  }

  throw new Error("Too many upstream redirects.");
}

function rewriteHtmlAttributesToProxy(html, upstreamUrl) {
  const attributePattern = /\b(href|src|action|poster)=("([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  const rewriteTag = (tag) => {
    if (!/^<[a-z!/]/i.test(tag)) {
      return tag;
    }

    return tag.replace(attributePattern, (full, name, quotedValue, doubleQuoted, singleQuoted, bareValue) => {
      const rawValue = doubleQuoted ?? singleQuoted ?? bareValue ?? "";
      if (isSkippableUrl(rawValue)) {
        return full;
      }

      const absolute = toAbsoluteHttpUrl(rawValue, upstreamUrl);
      if (!absolute) {
        return full;
      }

      const proxied = toProxyPath(absolute);
      const quote = quotedValue?.startsWith("'") ? "'" : '"';
      return `${name}=${quote}${escapeAttribute(proxied)}${quote}`;
    });
  };

  const rewriteInlineChunk = (chunk) => {
    return chunk.replace(/<[^>]+>/g, rewriteTag);
  };

  const blockPattern = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi;
  let output = "";
  let cursor = 0;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;
    const block = match[0];

    output += rewriteInlineChunk(html.slice(cursor, blockStart));

    if (/^<script\b/i.test(block)) {
      const openingTagEnd = block.indexOf(">");
      if (openingTagEnd >= 0) {
        const openingTag = block.slice(0, openingTagEnd + 1);
        const scriptBody = block.slice(openingTagEnd + 1);
        output += rewriteTag(openingTag) + scriptBody;
      } else {
        output += block;
      }
    } else {
      output += block;
    }

    cursor = blockEnd;
  }

  output += rewriteInlineChunk(html.slice(cursor));
  return output;
}

function buildProxyBridgeScript() {
  return `
<script>
(function () {
  var isSpecialLink = function (value) {
    if (!value) return true;
    var trimmed = String(value).trim().toLowerCase();
    return (
      trimmed.startsWith("#") ||
      trimmed.startsWith("javascript:") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
    );
  };

  var toProxy = function (url) {
    return "/ie-proxy?url=" + encodeURIComponent(url);
  };

  var resolveBase = function (base) {
    if (base && String(base).trim()) return String(base);
    if (document && document.baseURI) return document.baseURI;
    return window.location.href;
  };

  var toAbsoluteHttpUrl = function (raw, base) {
    try {
      var absolute = new URL(raw, resolveBase(base));
      if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
        return "";
      }
      return absolute.href;
    } catch (_error) {
      return "";
    }
  };

  var proxiedHref = function (raw, base) {
    if (isSpecialLink(raw)) return "";
    var absolute = toAbsoluteHttpUrl(raw, base);
    if (!absolute) return "";
    var parsed = new URL(absolute);
    if (parsed.pathname === "/ie-proxy" && parsed.searchParams.get("url")) {
      return absolute;
    }
    return toProxy(absolute);
  };

  var patchAnchor = function (anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return;
    var rawHref = anchor.getAttribute("href");
    var proxied = proxiedHref(rawHref, document.baseURI);
    if (!proxied) return;
    anchor.setAttribute("href", proxied);
    anchor.setAttribute("target", "_self");
    anchor.removeAttribute("ping");
  };

  var patchAnchorsIn = function (root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    var anchors = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < anchors.length; i += 1) {
      patchAnchor(anchors[i]);
    }
  };

  var nativeOpen = window.open;
  window.open = function (url) {
    var proxied = proxiedHref(String(url || ""), document.baseURI);
    if (proxied) {
      window.location.href = proxied;
      return null;
    }
    return nativeOpen.apply(window, arguments);
  };

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      var rawUrl = "";
      if (typeof input === "string") {
        rawUrl = input;
      } else if (input && typeof input.url === "string") {
        rawUrl = input.url;
      }

      var proxied = proxiedHref(rawUrl, document.baseURI);
      if (!proxied) {
        return nativeFetch(input, init);
      }

      if (typeof input === "string") {
        return nativeFetch(proxied, init);
      }

      try {
        var requestInit = {
          method: input.method,
          headers: input.headers,
          body: input.body,
          mode: "same-origin",
          credentials: "same-origin",
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          referrerPolicy: input.referrerPolicy,
          integrity: input.integrity,
          keepalive: input.keepalive,
          signal: input.signal
        };
        return nativeFetch(proxied, requestInit);
      } catch (_fetchCloneError) {
        return nativeFetch(proxied, init);
      }
    };
  }

  if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
    var nativeXhrOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url) {
      var proxied = proxiedHref(String(url || ""), document.baseURI);
      if (proxied) {
        arguments[1] = proxied;
      }
      return nativeXhrOpen.apply(this, arguments);
    };
  }

  if (navigator && navigator.sendBeacon) {
    var nativeSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      var proxied = proxiedHref(String(url || ""), document.baseURI);
      if (proxied) {
        return nativeSendBeacon(proxied, data);
      }
      return nativeSendBeacon(url, data);
    };
  }

  patchAnchorsIn(document);

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        var mutation = mutations[i];
        for (var j = 0; j < mutation.addedNodes.length; j += 1) {
          var node = mutation.addedNodes[j];
          if (!(node instanceof Element)) continue;
          if (node.matches && node.matches("a[href]")) {
            patchAnchor(node);
          }
          patchAnchorsIn(node);
        }
      }
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var anchor = target.closest("a[href]");
    if (!anchor) return;

    var rawHref = anchor.getAttribute("href");
    var proxied = proxiedHref(rawHref, document.baseURI);
    if (!proxied) return;

    event.preventDefault();
    window.location.href = proxied;
  }, true);

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    var method = (form.getAttribute("method") || "get").toLowerCase();
    if (method !== "get") return;

    var action = form.getAttribute("action") || document.baseURI || window.location.href;
    var absoluteAction;
    try {
      absoluteAction = new URL(action, resolveBase(document.baseURI));
    } catch (_error) {
      return;
    }

    var params = new URLSearchParams(new FormData(form));
    absoluteAction.search = params.toString();

    if (absoluteAction.protocol !== "http:" && absoluteAction.protocol !== "https:") {
      return;
    }

    event.preventDefault();
    window.location.href = toProxy(absoluteAction.href);
  }, true);
})();
</script>
`;
}

function rewriteProxyHtml(html, upstreamUrl) {
  const cleanHtml = html
    .replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<meta[^>]*http-equiv=["']?x-frame-options["']?[^>]*>/gi, "")
    .replace(/<base[^>]*>/gi, "");

  let isGoogleHost = false;
  try {
    const parsed = new URL(upstreamUrl);
    const host = parsed.hostname.toLowerCase();
    isGoogleHost = host === "google.com" || host.endsWith(".google.com");
  } catch {
    isGoogleHost = false;
  }

  const proxiedHtml = isGoogleHost ? cleanHtml : rewriteHtmlAttributesToProxy(cleanHtml, upstreamUrl);
  const baseTag = `<base href="${escapeAttribute(upstreamUrl)}">`;
  const bridgeScript = isGoogleHost ? "" : buildProxyBridgeScript();

  let rewritten = proxiedHtml;
  if (/<head[^>]*>/i.test(rewritten)) {
    rewritten = rewritten.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n${baseTag}${bridgeScript ? `\n${bridgeScript}` : ""}`
    );
  } else {
    rewritten = `<head>${baseTag}${bridgeScript ? `\n${bridgeScript}` : ""}</head>\n${rewritten}`;
  }

  return rewritten;
}

async function fetchGoogleResults(query, options = {}) {
  const { signal } = options;
  const target = new URL("https://www.google.com/search");
  target.searchParams.set("igu", "1");
  target.searchParams.set("hl", "en");
  target.searchParams.set("num", "12");
  target.searchParams.set("q", query);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const response = await fetch(target.href, {
    redirect: "follow",
    headers,
    signal,
  });

  const html = await response.text();
  const parsed = parseGoogleResultsFromHtml(html, 12);
  if (parsed.length > 0 && !isGoogleChallengeMarkup(html)) {
    return parsed;
  }

  const mirrorUrl = `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(query)}`;
  const mirrorResponse = await fetch(mirrorUrl, {
    redirect: "follow",
    headers,
    signal,
  });
  const markdown = await mirrorResponse.text();
  const mirrored = parseGoogleResultsFromMarkdown(markdown, 12);

  if (mirrored.length > 0) {
    return mirrored;
  }

  return parsed;
}

async function fetchDuckDuckGoResults(query, options = {}) {
  const { signal } = options;
  const target = new URL("https://duckduckgo.com/html/");
  target.searchParams.set("q", query);
  target.searchParams.set("kl", "us-en");

  const response = await fetch(target.href, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal,
  });

  const html = await response.text();
  return parseDuckDuckGoResultsFromHtml(html, 12);
}

async function fetchSearchResults(query, options = {}) {
  const googleResults = await fetchGoogleResults(query, options).catch(() => []);
  if (googleResults.length > 0) {
    return { results: googleResults, provider: "Google" };
  }

  const duckResults = await fetchDuckDuckGoResults(query, options).catch(() => []);
  if (duckResults.length > 0) {
    return { results: duckResults, provider: "DuckDuckGo" };
  }

  return { results: [], provider: "Google" };
}

async function fetchSearchResultsWithTimeout(query, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchSearchResults(query, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function attachIeProxy(server) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url) {
      next();
      return;
    }

    const parsed = new URL(req.url, "http://localhost");
    if (parsed.pathname === "/ie-search-api") {
      const q = (parsed.searchParams.get("q") || "").trim();
      if (!q) {
        res.statusCode = 200;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ query: "", results: [], error: "", provider: "Google" }));
        return;
      }

      try {
        const { results, provider } = await fetchSearchResultsWithTimeout(q, 9000);
        res.statusCode = 200;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ query: q, results, error: "", provider }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Search request failed.";
        res.statusCode = 200;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ query: q, results: [], error: errorMessage, provider: "Google" }));
      }
      return;
    }

    if (parsed.pathname === "/ie-search") {
      const q = (parsed.searchParams.get("q") || "").trim();
      const shortcutUrl = resolveBrowserShortcut(q);
      if (shortcutUrl) {
        res.statusCode = 302;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Location", toEmbeddedBrowserPath(shortcutUrl));
        res.end();
        return;
      }

      let results = [];
      let provider = "Google";
      let errorMessage = "";
      if (q) {
        try {
          const payload = await fetchSearchResultsWithTimeout(q, 9000);
          results = payload.results;
          provider = payload.provider;
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Search request failed.";
        }
      }

      const html = renderIeSearchHtml({ query: q, results, error: errorMessage, provider });
      res.statusCode = 200;
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
      return;
    }

    if (parsed.pathname !== "/ie-proxy") {
      next();
      return;
    }

    const raw = parsed.searchParams.get("url");
    if (!raw) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Missing url query parameter.");
      return;
    }

    let target;
    try {
      target = new URL(raw);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Invalid URL.");
      return;
    }

    if (!(target.protocol === "http:" || target.protocol === "https:")) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Only http/https URLs are allowed.");
      return;
    }

    try {
      const { upstream, resolvedUrl } = await fetchUpstreamWithCookies(target.href);
      const contentType = upstream.headers.get("content-type") || "text/plain; charset=utf-8";

      res.statusCode = upstream.status;
      res.setHeader("Cache-Control", "no-store");
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");

      if (/text\/html/i.test(contentType)) {
        const html = await upstream.text();
        const rewritten = rewriteProxyHtml(html, resolvedUrl);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(rewritten);
        return;
      }

      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      res.end(bytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown proxy error";
      res.statusCode = 502;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(`IE proxy failed: ${message}`);
    }
  });
}

function ieProxyPlugin() {
  return {
    name: "ie-proxy-middleware",
    configureServer(server) {
      attachIeProxy(server);
    },
    configurePreviewServer(server) {
      attachIeProxy(server);
    },
  };
}

export default defineConfig({
  plugins: [ieProxyPlugin()],
});
