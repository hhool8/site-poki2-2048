# Awesome Copilot Drop for 2048.poki2.online

This package contains a full implementation starter for a 2048 vertical site:

- Awesome Copilot assets (instructions + prompts)
- Static site scaffold (collection page + variant pages)
- SEO operations documents (keywords, weekly SOP, GSC, deployment)

## Structure

- `pages/`: ready-to-publish HTML pages
- `templates/`: reusable page and JSON-LD templates
- `prompts/`: reusable Copilot prompts
- `.github/copilot-instructions.md`: guardrails for AI-assisted edits
- `docs/`: operations, deployment, and growth SOPs
- `assets/`: CSS and JS for UX/performance patterns
- `data/`: game inventory metadata

## 2048 Catalog Data

- `data/gamepix-category-2048-games.json`: full strict category list (102 games)
- `data/gamepix-category-2048-urls.txt`: embed URLs only
- `data/gamepix-2048-featured.json`: curated launch subset (18 games)
- `data/route-candidates.json`: route planning map generated from full catalog
- `data/games.json`: launch manifest used by this project

Regenerate route candidates:

```bash
node scripts/build-route-candidates.js
```

Generate game pages:

```bash
# Featured 18 pages
npm run pages:build:featured

# Full strict catalog pages (102) + sitemap refresh
npm run pages:build:all
```

## Release Commands

```bash
# 1) Local release checks only
npm run release

# 2) Deploy to Cloudflare Pages (requires Wrangler + project name)
CLOUDFLARE_PAGES_PROJECT=your-project-name npm run release:deploy
```

Built-in checks run in this order:

1. `scripts/check-seo.sh`
2. `scripts/release-precheck.sh`
3. Deploy (only when `--deploy` is used)

## Quick Start

1. Connect this folder to your hosting pipeline (Cloudflare Pages recommended).
2. Set custom domain to `2048.poki2.online`.
3. Publish `index.html` as homepage.
4. Publish all generated pages under `games/`.
5. Submit `sitemap.xml` in Google Search Console.
6. Run weekly optimization loop from `docs/weekly-ops-sop.md`.

## Acceptance Criteria

- Every page has unique `title`, `meta description`, `H1`, and body copy.
- Homepage renders text and layout before heavy embeds.
- JSON-LD uses real data only; do not fabricate ratings.
- Internal links connect collection and variant pages both ways.
- Mobile experience is usable without horizontal overflow.
