#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const candidatesPath = path.join(root, 'data', 'route-candidates.json');
const featuredPath = path.join(root, 'data', 'gamepix-2048-featured.json');
const gamesDir = path.join(root, 'games');

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
  return `        <a class="tile" href="/games/${g.slug}">${esc(g.title)}<br /><small class="kbd">Hot score ${g.score}</small></a>`;
}).join('\n');

const recentTiles = recentGames.map((g) => {
  const stamp = g.updatedAt ? new Date(g.updatedAt).toISOString().slice(0, 10) : 'N/A';
  return `        <a class="tile" href="/games/${g.slug}">${esc(g.title)}<br /><small class="kbd">Updated ${stamp}</small></a>`;
}).join('\n');

const featuredSection = [
  '    <section class="card">',
  '      <h2>Hot 2048 Games (Weighted)</h2>',
  '      <div class="grid">',
  hotTiles,
  '      </div>',
  '    </section>'
].join('\n');

const recentSection = [
  '    <section class="card">',
  '      <h2>Recently Updated 2048 Games</h2>',
  '      <div class="grid">',
  recentTiles,
  '      </div>',
  '    </section>'
].join('\n');

let html = fs.readFileSync(indexPath, 'utf8');

html = html
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    '<meta name="description" content="Play dynamically ranked 2048 games online by hot score and recent updates. Fast loading, no download, and mobile-friendly gameplay." />'
  )
  .replace(
    /<p>Start with [^<]*<\/p>/,
    `<p>Start with ${esc(hero.title)}. Click to load the game embed.</p>`
  )
  .replace(
    /<button class="play-now" data-embed-src="[^"]*">Play Now<\/button>/,
    `<button class="play-now" data-embed-src="${esc(hero.url)}">Play Now</button>`
  );

const oldFeaturedRegex = /\s*<section class="card">\s*<h2>(Featured 2048 Variants to Play Online|Hot 2048 Games \(Weighted\))<\/h2>[\s\S]*?<\/section>/;
if (!oldFeaturedRegex.test(html)) {
  console.error('Unable to locate featured/hot section in index.html');
  process.exit(1);
}

html = html.replace(oldFeaturedRegex, `\n${featuredSection}`);

const oldRecentRegex = /\s*<section class="card">\s*<h2>Recently Updated 2048 Games<\/h2>[\s\S]*?<\/section>/;
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

fs.writeFileSync(indexPath, html);

console.log(`Homepage updated. Hero: ${hero.title}`);
console.log(`Hot tiles: ${hotGames.length}, Recent tiles: ${recentGames.length}`);
