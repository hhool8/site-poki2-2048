#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fullFile = path.join(root, 'data', 'gamepix-category-2048-games.json');
const outFile = path.join(root, 'data', 'route-candidates.json');

const raw = JSON.parse(fs.readFileSync(fullFile, 'utf8'));
const games = Array.isArray(raw.games) ? raw.games : [];

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const slugFromUrl = (url) =>
  String(url || '')
    .replace(/^https:\/\/play\.gamepix\.com\//, '')
    .replace(/\/embed\?sid=.*/, '');

const candidates = games.map((g) => {
  const sourceSlug = slugFromUrl(g.url);
  const route = `/${normalize(g.title || sourceSlug)}`;
  return {
    title: g.title,
    route,
    sourceSlug,
    embedUrl: g.url,
    category: g.category || '2048'
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  count: candidates.length,
  candidates
};

fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`Generated ${candidates.length} route candidates -> data/route-candidates.json`);
