#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const candidatesPath = path.join(root, 'data', 'route-candidates.json');
const featuredPath = path.join(root, 'data', 'gamepix-2048-featured.json');
const gamesDir = path.join(root, 'games');

const HOME_TITLE = 'Play 2048 Game Online Free - 2048 Unblocked Collection';
const HOME_DESCRIPTION = 'Play 2048 game online free in one fast hub. Discover top 2048 unblocked variants, compare hot and recent picks, and use practical tips to win 2048 more consistently.';
const HOME_OG_DESCRIPTION = 'Play 2048 online free, explore unblocked variants, and improve with practical winning strategies.';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const candidatesRaw = readJson(candidatesPath);
const featuredRaw = readJson(featuredPath);
const candidates = Array.isArray(candidatesRaw.candidates) ? candidatesRaw.candidates : [];
const featured = new Set((Array.isArray(featuredRaw.games) ? featuredRaw.games : []).map((g) => g.slug));

const slugFromCandidate = (candidate) => {
  if (candidate.sourceSlug && typeof candidate.sourceSlug === 'string') {
    return candidate.sourceSlug.trim().toLowerCase();
  }
  if (candidate.route && typeof candidate.route === 'string') {
    return candidate.route.replace(/^\//, '').trim().toLowerCase();
  }
  return '';
};

const fileMtime = (slug) => {
  const fp = path.join(gamesDir, `${slug}.html`);
  if (!fs.existsSync(fp)) {
    return 0;
  }
  return fs.statSync(fp).mtimeMs || 0;
};

const scoreGame = (game, idx) => {
  const t = game.title.toLowerCase();
  let score = 0;

  if (featured.has(game.slug)) score += 100;
  if (t.includes('2048')) score += 20;
  if (t.includes('merge')) score += 15;
  if (t.includes('classic')) score += 10;
  if (t.includes('number')) score += 8;
  if (t.includes('cube')) score += 6;

  // Earlier catalog entries get a small baseline boost.
  score += Math.max(0, 120 - idx);

  return score;
};

const games = candidates
  .map((c, idx) => ({
    title: c.title,
    slug: slugFromCandidate(c),
    url: c.embedUrl,
    idx
  }))
  .filter((g) => g.title && g.slug && g.url)
  .map((g) => ({
    ...g,
    score: scoreGame(g, g.idx),
    updatedAt: fileMtime(g.slug)
  }));

if (games.length === 0) {
  console.error('No games found from route candidates.');
  process.exit(1);
}

const hotGames = [...games]
  .sort((a, b) => b.score - a.score)
  .slice(0, 12);

const recentGames = [...games]
  .sort((a, b) => b.updatedAt - a.updatedAt)
  .slice(0, 12);

const hero = hotGames[0];

const hotTiles = hotGames.map((g) => {
  const cover = `https://img.gamepix.com/games/${g.slug}/cover/${g.slug}.png?w=320&h=240`;
  const icon = `https://img.gamepix.com/games/${g.slug}/icon/${g.slug}.png?w=320&h=240`;
  return `        <a class="tile" href="/games/${g.slug}"><img class="tile-thumb" src="${esc(cover)}" onerror="this.onerror=null;this.src='${esc(icon)}'" width="320" height="240" loading="lazy" alt="${esc(g.title)} thumbnail" /><span class="tile-body">${esc(g.title)}<br /><small class="kbd">Hot score ${g.score}</small></span></a>`;
}).join('\n');

const recentTiles = recentGames.map((g) => {
  const stamp = g.updatedAt ? new Date(g.updatedAt).toISOString().slice(0, 10) : 'N/A';
  const cover = `https://img.gamepix.com/games/${g.slug}/cover/${g.slug}.png?w=320&h=240`;
  const icon = `https://img.gamepix.com/games/${g.slug}/icon/${g.slug}.png?w=320&h=240`;
  return `        <a class="tile" href="/games/${g.slug}"><img class="tile-thumb" src="${esc(cover)}" onerror="this.onerror=null;this.src='${esc(icon)}'" width="320" height="240" loading="lazy" alt="${esc(g.title)} thumbnail" /><span class="tile-body">${esc(g.title)}<br /><small class="kbd">Updated ${stamp}</small></span></a>`;
}).join('\n');

const featuredSection = [
  '    <section class="card" id="hot-games">',
  '      <h2>Hot 2048 Games (Weighted)</h2>',
  '      <div class="grid">',
  hotTiles,
  '      </div>',
  '    </section>'
].join('\n');

const recentSection = [
  '    <section class="card" id="recent-games">',
  '      <h2>Recently Updated 2048 Games</h2>',
  '      <div class="grid">',
  recentTiles,
  '      </div>',
  '    </section>'
].join('\n');

const tipsSection = [
  '    <section class="card" id="tips-and-faq">',
  '      <h2>How to Win 2048: Strategy and FAQ</h2>',
  '      <p>',
  '        If you want to play 2048 game online and improve quickly, consistency matters more than speed. Keep your largest tile anchored in one corner, avoid random direction changes, and use each move to preserve board order.',
  '      </p>',
  '      <h3>How to beat 2048?</h3>',
  '      <p>',
  '        Use a fixed-corner strategy. Build a descending row toward your anchor corner and avoid breaking it for short-term merges. This reduces chaos and gives you more safe moves in the mid and late game.',
  '      </p>',
  '      <h3>How to win 2048 consistently?</h3>',
  '      <p>',
  '        Limit your default moves to three directions and keep one recovery lane open. When the board gets crowded, prioritize clearing space over chasing a big merge. Stable boards outperform aggressive boards over long sessions.',
  '      </p>',
  '      <h3>How do you win in 2048 when the board is almost full?</h3>',
  '      <p>',
  '        Slow down and plan two to three moves ahead. Target merges that open multiple cells, not just one. If you need a cleaner practice board, start with <a href="/games/2048-classic-puzzle-challenge">2048 Classic Puzzle - Challenge</a> and then switch to faster variants such as <a href="/games/2048-cube-run">2048 Cube Run</a>.',
  '      </p>',
  '      <h3>What is the best 2048 unblocked game for beginners?</h3>',
  '      <p>',
  '        Beginners should start with classic-style layouts and clear visuals. Use the hot list above to begin, then compare with recently updated variants to find a pace that matches your reaction speed.',
  '      </p>',
  '    </section>'
].join('\n');

const faqSchemaObject = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How to beat 2048?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use a fixed-corner strategy, build a descending row toward that corner, and avoid breaking board structure for short-term merges.'
      }
    },
    {
      '@type': 'Question',
      name: 'How to win 2048 consistently?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use three-direction play, keep one recovery lane open, and prioritize space management over risky high-value merges.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do you win in 2048 when the board is almost full?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plan multiple moves ahead and prioritize merges that open multiple cells. Do not force merges that break your anchor corner structure.'
      }
    }
  ]
};

const faqSchemaScript = [
  '  <script type="application/ld+json" id="faq-schema">',
  JSON.stringify(faqSchemaObject, null, 2),
  '  </script>'
].join('\n');

let html = fs.readFileSync(indexPath, 'utf8');

html = html
  .replace(
    /<title>[^<]*<\/title>/,
    `<title>${HOME_TITLE}</title>`
  )
  .replace(
    /<link rel="stylesheet" href="assets\/css\/site\.css(\?v=\d+)?" \/>/,
    '<link rel="stylesheet" href="assets/css/site.css?v=20260515" />'
  )
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${HOME_DESCRIPTION}" />`
  )
  .replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${HOME_TITLE}" />`
  )
  .replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${HOME_OG_DESCRIPTION}" />`
  )
  .replace(
    /<p>Start with [^<]*<\/p>/,
    `<p>Start with ${esc(hero.title)}. The game area is rendered directly for instant play.</p>`
  );

html = html.replace(/\s*<script type="application\/ld\+json" id="faq-schema">[\s\S]*?<\/script>/, '');
html = html.replace('</head>', `\n${faqSchemaScript}\n</head>`);

const homeEmbed = [
  '      <div id="game-shell" class="game-shell" data-mounted="1">',
  `        <iframe src="${esc(hero.url)}" title="${esc(hero.title)} embed" loading="eager" allowfullscreen style="width:100%;min-height:420px;border:0;border-radius:12px;"></iframe>`,
  '      </div>',
  '      <small class="kbd">Tip: press F11 for full screen play.</small>'
].join('\n');

html = html.replace(
  /<div id="game-shell" class="game-shell">[\s\S]*?<\/div>\s*<small class="kbd">[\s\S]*?<\/small>/,
  homeEmbed
);

const oldFeaturedRegex = /\s*<section class="card"[^>]*>\s*<h2>(Featured 2048 Variants to Play Online|Hot 2048 Games \(Weighted\))<\/h2>[\s\S]*?<\/section>/;
if (!oldFeaturedRegex.test(html)) {
  console.error('Unable to locate featured/hot section in index.html');
  process.exit(1);
}

html = html.replace(oldFeaturedRegex, `\n${featuredSection}`);

const oldRecentRegex = /\s*<section class="card"[^>]*>\s*<h2>Recently Updated 2048 Games<\/h2>[\s\S]*?<\/section>/;
if (oldRecentRegex.test(html)) {
  html = html.replace(oldRecentRegex, `\n${recentSection}`);
} else {
  const tipsAnchor = /\n\s*<section class="card">\s*<h2>2048 Tips and Strategy for Better Scores<\/h2>/;
  if (!tipsAnchor.test(html)) {
    console.error('Unable to locate tips section anchor in index.html');
    process.exit(1);
  }
  html = html.replace(tipsAnchor, `\n${recentSection}\n\n    <section class="card">\n      <h2>2048 Tips and Strategy for Better Scores</h2>`);
}

const oldTipsRegex = /\s*<section class="card"[^>]*>\s*<h2>(2048 Tips and Strategy for Better Scores|How to Win 2048: Strategy and FAQ)<\/h2>[\s\S]*?<\/section>/;
if (!oldTipsRegex.test(html)) {
  console.error('Unable to locate tips/faq section in index.html');
  process.exit(1);
}

html = html.replace(oldTipsRegex, `\n${tipsSection}`);

fs.writeFileSync(indexPath, html);

console.log(`Homepage updated. Hero: ${hero.title}`);
console.log(`Hot tiles: ${hotGames.length}, Recent tiles: ${recentGames.length}`);
