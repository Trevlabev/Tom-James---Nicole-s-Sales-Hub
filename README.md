# Nicole's Operations Hub

A static GitHub Pages portal for Nicole and her Sales Assistant. It provides:

- a responsive operations dashboard
- a searchable program roadmap
- five working browser-based programs plus placeholder subpages for future tools
- iframe and launch-link integration
- daily operations and ten-day replacement training pages
- a controlled resource-link page
- a security boundary for public/static hosting

## Start here

1. Open `assets/js/config.js` and add the approved Trello, Excel, calendar, Drive, and manual links.
2. Test the five working programs with approved demo data. Add `embedUrl` and `launchUrl` values only for programs hosted elsewhere.
3. Review `privacy.html` before adding any real office information.
4. Push the repository to GitHub.
5. In repository Settings → Pages, select **GitHub Actions** as the source.

The included workflow deploys the repository root whenever `main` changes.

## Working v1 programs

The first build includes five static, browser-based programs:

- `programs/alteration-intake-builder/` — intake validation, Trello text, Excel CSV, handoff, JSON import/export
- `programs/alteration-command-center/` — active alteration table, calculated queues, provider filtering, follow-up brief, CSV/JSON import/export
- `programs/factory-return-helper/` — Secure Site preparation checklist, 50-character instruction segmentation, status inquiry, staging label
- `programs/inventory-receipt-reconciler/` — manual/CSV receipt reconciliation, quantity and condition discrepancies, physical placement control
- `programs/wip-watch-review/` — WIP and Watch List aging, deadline risk, Trello/Excel mismatch detection, decision briefs

Sanitized import examples are included in `demo-data/`. These programs do not automatically save data. Records remain in the current browser tab until the user explicitly downloads a CSV or JSON file. This reduces accidental persistence on a public static host, but it does **not** make GitHub Pages a secure client-record system.

## Program pages

Each program has a clean URL under `programs/<slug>/`. Placeholder page content is generated from the matching registry object. Working programs use their own `index.html` and `app.js`. To create another placeholder program:

1. Copy an object in `assets/js/programs.js`.
2. Use a unique `slug`.
3. Copy an existing program directory.
4. Change the `<body data-program-slug="...">` value in its `index.html`.

## Embedding

Set both URLs when possible:

```js
embedUrl: "https://your-app.example/",
launchUrl: "https://your-app.example/"
```

An iframe works only when the external app allows framing. The launch link remains the fallback.

## Security

This static site does not provide secure authentication or storage. Do not commit:

- client records, measurements, addresses, orders, or photographs
- internal contacts or personal phone numbers
- API keys, passwords, tokens, or credentials
- payroll, payment, deposit, or banking records
- internal documents not approved for public access

Use this repository as a public-safe shell, or deploy it through an access-controlled environment.
