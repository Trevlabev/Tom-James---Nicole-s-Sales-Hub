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

## Trello integration

The completed repository includes `trello.html`, a browser-based Trello Integration Center.

### Setup

1. In Trello app administration, create or select the Power-Up used for this internal integration and generate an API key.
2. Add the deployed GitHub Pages origin to the API key's allowed origins. Example: `https://your-account.github.io`.
3. Deploy the site, open **Trello** in the navigation, enter the API key, and authorize read/write access.
4. Select Nicole's board and map the existing lists to:
   - Active alterations
   - Completed alterations awaiting scheduling
   - Inventory
   - Rush / deadline work
   - General orders, if used
   - Shipping, if used
5. Keep automatic push disabled until the mappings have been reviewed with demonstration records.

### Security behavior

- The API key can optionally be remembered on the device.
- The user token remains in `sessionStorage`; it is not exported with the workspace and is not committed to the repository.
- Card sync uses Trello's REST API with the authorization header rather than placing the token in the request URL.
- GitHub Pages cannot receive Trello webhook POST requests. Continuous background sync requires a separate HTTPS serverless callback service.
- Trello announced a future move toward OAuth 2.0. The integration's authorization and API code is isolated in `assets/js/trello-api.js` so the authentication adapter can be replaced without rebuilding every program.

### Sync behavior

- Workspace records can create or update Trello cards.
- The suite stores the Trello card ID and URL on the local record.
- Cards created by the suite contain a `NAH_SYNC` marker so linked records can be recognized later.
- Safe pull imports new cards and preserves records changed in both systems for review.
- Trello-priority pull may update mapped status, date, location, and next-action fields.
- Newly saved records can be pushed automatically when auto-sync is enabled.
