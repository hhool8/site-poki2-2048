# Operator Playbook (Awesome Copilot)

## Purpose

This playbook defines how to use prompt assets in this package to ship and optimize 2048 pages quickly.

## Workflow

1. Use `prompts/new-game-page.prompt.md` to generate a new variant page.
2. Use `prompts/seo-copy.prompt.md` to enrich or refresh on-page text.
3. Use `prompts/internal-links-update.prompt.md` to strengthen page cluster links.
4. Use `prompts/metadata-audit.prompt.md` before publishing.

## Definition of Done

- Unique title/description/H1.
- 200+ words unique text.
- Canonical + OG + JSON-LD valid.
- At least 3 internal links and one return link to collection.
- Mobile-friendly and stable layout.

## Escalation Rules

- If rankings drop after an update, revert only metadata first.
- If impressions rise but CTR drops, iterate title and description.
- If CTR is stable but position falls, add depth and links, not keyword repetition.
