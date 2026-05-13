#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'docs', 'audits');
const BASE = 'https://2048.poki2.online';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body,
          headers: res.headers
        });
      });
    }).on('error', reject);
  });
}

function escRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function todayStamp() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function checkGamePage(url, html, status) {
  const hasTitle = /<title>[^<]+<\/title>/i.test(html);
  const metaDescription = /<meta\s+name="description"\s+content="[^"]+"\s*\/>/i.test(html);
  const canonical = new RegExp(`<link\\s+rel="canonical"\\s+href="${escRegex(url)}"\\s*\\/>`, 'i').test(html);
  const ogTitle = /<meta\s+property="og:title"\s+content="[^"]+"\s*\/>/i.test(html);
  const ogDescription = /<meta\s+property="og:description"\s+content="[^"]+"\s*\/>/i.test(html);
  const ogUrl = new RegExp(`<meta\\s+property="og:url"\\s+content="${escRegex(url)}"\\s*\\/>`, 'i').test(html);
  const ogImage = /<meta\s+property="og:image"\s+content="https:\/\/img\.gamepix\.com\/games\/[^"]+"\s*\/>/i.test(html);
  const jsonLd = /<script\s+type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"VideoGame"[\s\S]*?<\/script>/i.test(html);
  const iframeDirect = /<iframe\s+src="https:\/\/play\.gamepix\.com\//i.test(html);
  const noPlayButton = !/class="play-now"/i.test(html);
  const thumb320x180 = /class="tile-thumb"[\s\S]*?w=320(?:&amp;|&)h=180/i.test(html);
  const thumbCoverOrFallback = /\/cover\/[^"]+w=320(?:&amp;|&)h=180/i.test(html) && /onerror=/i.test(html);

  const pass = status === 200 && hasTitle && metaDescription && canonical && ogTitle && ogDescription && ogUrl && ogImage && jsonLd && iframeDirect && noPlayButton && thumb320x180 && thumbCoverOrFallback;

  return {
    url,
    status,
    pass,
    checks: {
      hasTitle,
      metaDescription,
      canonical,
      ogTitle,
      ogDescription,
      ogUrl,
      ogImage,
      jsonLd,
      iframeDirect,
      noPlayButton,
      thumb320x180,
      thumbCoverOrFallback
    }
  };
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const core = [
    `${BASE}/`,
    `${BASE}/sitemap.xml`,
    `${BASE}/robots.txt`,
    `${BASE}/ads.txt`
  ];

  const coreResults = [];
  for (const u of core) {
    const r = await fetchUrl(u);
    coreResults.push({ url: u, status: r.status, ok: r.status === 200 });
  }

  const sitemap = await fetchUrl(`${BASE}/sitemap.xml`);
  if (sitemap.status !== 200) {
    console.error(`[FAIL] Unable to fetch sitemap.xml (${sitemap.status})`);
    process.exit(2);
  }

  const gameUrls = [...sitemap.body.matchAll(/<loc>(https:\/\/2048\.poki2\.online\/games\/[^<]+)<\/loc>/g)].map((m) => m[1]);

  const pageResults = [];
  for (const u of gameUrls) {
    const r = await fetchUrl(u);
    pageResults.push(checkGamePage(u, r.body, r.status));
  }

  const home = await fetchUrl(`${BASE}/`);
  const homeChecks = {
    status200: home.status === 200,
    title: /<title>[^<]+<\/title>/i.test(home.body),
    metaDescription: /<meta\s+name="description"\s+content="[^"]+"\s*\/>/i.test(home.body),
    canonical: /<link\s+rel="canonical"\s+href="https:\/\/2048\.poki2\.online\/"\s*\/>/i.test(home.body),
    ogTitle: /<meta\s+property="og:title"\s+content="[^"]+"\s*\/>/i.test(home.body),
    ogDescription: /<meta\s+property="og:description"\s+content="[^"]+"\s*\/>/i.test(home.body),
    ogUrl: /<meta\s+property="og:url"\s+content="https:\/\/2048\.poki2\.online\/"\s*\/>/i.test(home.body),
    ogImage: /<meta\s+property="og:image"\s+content="https:\/\/2048\.poki2\.online\/assets\/og\/2048-collection\.jpg"\s*\/>/i.test(home.body),
    cssVersioned: /assets\/css\/site\.css\?v=20260514/i.test(home.body),
    thumb320x180: /class="tile-thumb"[\s\S]*?w=320(?:&amp;|&)h=180/i.test(home.body),
    iframeDirect: /<iframe\s+src="https:\/\/play\.gamepix\.com\//i.test(home.body)
  };

  const pagePass = pageResults.filter((x) => x.pass).length;
  const pageFail = pageResults.length - pagePass;
  const corePass = coreResults.filter((x) => x.ok).length;

  const stamp = todayStamp();
  const reportPath = path.join(REPORT_DIR, `production-audit-${stamp}.md`);

  const failRows = pageResults
    .filter((x) => !x.pass)
    .slice(0, 30)
    .map((x) => `- ${x.url} | status=${x.status} | checks=${JSON.stringify(x.checks)}`)
    .join('\n');

  const lines = [
    '# Production Audit Report',
    '',
    `- Time (UTC): ${new Date().toISOString()}`,
    `- Site: ${BASE}`,
    '',
    '## Summary',
    '',
    `- Core endpoints pass: ${corePass}/${coreResults.length}`,
    `- Game pages pass: ${pagePass}/${pageResults.length}`,
    `- Game pages fail: ${pageFail}`,
    '',
    '## Core Endpoints',
    '',
    ...coreResults.map((x) => `- ${x.ok ? 'OK' : 'FAIL'} ${x.status} ${x.url}`),
    '',
    '## Homepage Checks',
    '',
    ...Object.entries(homeChecks).map(([k, v]) => `- ${k}: ${v ? 'OK' : 'FAIL'}`),
    '',
    '## Failed Game Pages (first 30)',
    '',
    failRows || '- None',
    ''
  ];

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);

  console.log(`CORE_PASS=${corePass}/${coreResults.length}`);
  console.log(`GAMES_TOTAL=${pageResults.length}`);
  console.log(`GAMES_PASS=${pagePass}`);
  console.log(`GAMES_FAIL=${pageFail}`);
  console.log(`REPORT=${reportPath}`);

  if (corePass !== coreResults.length || pageFail > 0 || Object.values(homeChecks).some((x) => !x)) {
    process.exit(1);
  }
})();
