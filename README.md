# Doculus

One-page marketing site for **Doculus** — specialist document control for
construction & engineering projects.

A self-contained static site: dark theme, animated interactive node background,
scroll reveals, animated counters, card spotlight/tilt, and a mobile-friendly
responsive layout. No build step or dependencies.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup and content |
| `styles.css` | All styling, animations, responsive rules |
| `script.js`  | Interactivity (nav, reveals, counters, canvas background) |
| `logo.svg`   | Brand mark (also used as the favicon) |

## Run locally

It's a static site — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Before going live

- **Contact email:** the "Contact me" button uses a placeholder.
  In `index.html`, replace `your-email@example.com` in the `mailto:` link
  with the real business email.
- Review the copy, stats and business name to match the real business.

## Deploy

Works on any static host. For GitHub Pages: enable Pages on this repo
(Settings → Pages) and serve from the branch root.
