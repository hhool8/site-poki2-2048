#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const candidatesPath = path.join(root, 'data', 'route-candidates.json');
const outDir = path.join(root, 'games');
const sitemapPath = path.join(root, 'sitemap.xml');

const raw = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const candidates = Array.isArray(raw.candidates) ? raw.candidates : [];

if (candidates.length === 0) {
  console.error('No route candidates found in data/route-candidates.json');
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slugFromCandidate = (candidate) => {
  if (candidate.sourceSlug && typeof candidate.sourceSlug === 'string') {
    return candidate.sourceSlug.trim().toLowerCase();
  }
  if (candidate.route && typeof candidate.route === 'string') {
    return candidate.route.replace(/^\//, '').trim().toLowerCase();
  }
  return '';
};

const games = candidates
  .map((c) => ({
    title: c.title,
    slug: slugFromCandidate(c),
    url: c.embedUrl
  }))
  .filter((g) => g.title && g.slug && g.url);

const makeRelated = (list, currentSlug) => list
  .filter((g) => g.slug !== currentSlug)
  .slice(0, 8)
  .map((g) => {
    const thumb = `https://img.gamepix.com/games/${g.slug}/icon/${g.slug}.png?w=320&h=240`;
    return `<a class="tile" href="/games/${g.slug}"><img class="tile-thumb" src="${esc(thumb)}" width="320" height="240" loading="lazy" alt="${esc(g.title)} thumbnail" /><span class="tile-body">${esc(g.title)}</span></a>`;
  })
  .join('\n        ');

const makePage = (game) => {
  const title = `${game.title} Unblocked - Play ${game.title} Online`;
  const description = `Play ${game.title} online in your browser with no download. Enjoy smooth controls, fast loading, and related 2048 variants on 2048.poki2.online.`;
  const canonical = `https://2048.poki2.online/games/${game.slug}`;
  const related = makeRelated(games, game.slug);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="https://img.gamepix.com/games/${esc(game.slug)}/icon/${esc(game.slug)}.png?w=640" />
  <link rel="stylesheet" href="/assets/css/site.css" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": ${JSON.stringify(game.title)},
    "genre": ["Puzzle"],
    "gamePlatform": ["Web Browser"],
    "url": ${JSON.stringify(canonical)},
    "description": ${JSON.stringify(`Play ${game.title} online in browser`) }
  }
  </script>
</head>
<body>
  <main class="container">
    <section class="hero card">
      <h1>${esc(game.title)} Unblocked</h1>
      <p>
        ${esc(game.title)} is part of our curated 2048 collection for fast browser play.
        This page is optimized for quick loading and mobile-friendly controls so you can start playing immediately.
        Use this variant to train board discipline, merge timing, and consistency under pressure.
      </p>
      <div id="game-shell" class="game-shell">
        <iframe src="${esc(game.url)}" title="${esc(game.title)} embed" loading="eager" allowfullscreen style="width:100%;min-height:420px;border:0;border-radius:12px;"></iframe>
      </div>
    </section>

    <section class="card">
      <h2>How to Play</h2>
      <p>
        Use arrow keys on desktop or swipe controls on mobile. Merge matching values to clear space and build larger tiles.
        Keep your highest tile anchored in one corner and avoid random reversals to preserve board structure.
      </p>
      <h3>Winning Strategy</h3>
      <p>
        Focus on consistency over speed. Maintain a descending tile chain toward your anchor corner,
        and prioritize opening empty cells before forcing risky merges.
      </p>
      <h3>Why This Variant</h3>
      <p>
        ${esc(game.title)} offers a distinct visual style while preserving the core 2048 loop.
        It is a strong option for long sessions and for players who want a fresh presentation without learning new rules.
      </p>
    </section>

    <section class="card">
      <h2>Related 2048 Games</h2>
      <div class="grid">
        ${related}
      </div>
      <p><a href="/">Back to 2048 Collection</a></p>
    </section>
  </main>

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
};

for (const game of games) {
  fs.writeFileSync(path.join(outDir, `${game.slug}.html`), makePage(game));
}

const sitemapEntries = games
  .map((g) => {
    return [
      '  <url>',
      `    <loc>https://2048.poki2.online/games/${g.slug}</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>'
    ].join('\n');
  })
  .join('\n');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <url>',
  '    <loc>https://2048.poki2.online/</loc>',
  '    <changefreq>daily</changefreq>',
  '    <priority>1.0</priority>',
  '  </url>',
  sitemapEntries,
  '</urlset>'
].join('\n');

fs.writeFileSync(sitemapPath, `${sitemap}\n`);

console.log(`Generated ${games.length} pages in games/`);
console.log('Updated sitemap.xml');
