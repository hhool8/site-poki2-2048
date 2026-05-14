# Cloudflare Pages Deployment Checklist

## Pre-deploy

- Confirm project root points to `site_poki2_2048`.
- Ensure the homepage exists at `index.html`.
- Confirm `robots.txt` and `sitemap.xml` include production domain.
- Validate all canonical URLs are absolute and correct.

## Domain and SSL

- Attach custom domain: `2048.poki2.online`.
- Verify SSL mode is Full (strict where available).
- Verify HTTPS redirect is enabled.

## Cache and Performance

- Keep HTML cache conservative during initial launch.
- Cache static assets (`assets/css/*`, `assets/js/*`) aggressively with versioning when changed.
- Verify first content render appears before embed load.

## Post-deploy Verification

- Open the homepage and any generated game pages on desktop and mobile.
- Check no horizontal overflow.
- Confirm internal links and canonical URLs.
- Confirm `sitemap.xml` serves 200 and contains expected URLs.

## Rollback

- Keep prior successful deployment id ready.
- If metadata regression occurs, rollback page head tags first.
