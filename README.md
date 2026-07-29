# Nicole's Operations Suite — Completed GitHub Pages Edition

A static, local-first office operations platform for Nicole Arbogast and her Sales Assistant. No build step or backend is required.

## Included

- Completed dashboard and shared browser workbench
- Daily operations checklist and ten-day replacement training tracker
- Fifteen functional program pages
- Shared workspace data across tools
- Session-only or device-persistent storage modes
- Full workspace JSON backup/import
- CSV, JSON, text, print, and contact-sheet outputs
- Responsive design and offline caching
- GitHub Pages deployment workflow

## Deploy

1. Put this folder at the repository root.
2. Push to the `main` branch.
3. In **Settings → Pages**, select **GitHub Actions**.
4. The included workflow deploys the site.

## Configure office links

Edit `assets/js/config.js` to add approved Trello, Excel, Calendar, Drive, and manual URLs. Never put credentials, tokens, client records, payment information, payroll records, bank information, or private contact lists in the repository.

## Workspace behavior

- **Session mode** is the default: data remains in the current browser session.
- **Device mode** stores data in localStorage on that browser/device.
- Use **Workbench → Export full workspace** for handoff or backup.
- Real operational records are not sent to a server by this site.

## Adding future programs

Create `programs/<slug>/index.html` and `app.js`, include the shared CSS/JS, then add the tool to `assets/js/programs.js`. External authenticated programs can be launched or embedded separately, subject to their security and iframe policies.
