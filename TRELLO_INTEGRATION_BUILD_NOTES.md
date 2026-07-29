# Trello Integration Build Notes

## Added

- Trello Integration Center in the main navigation
- Browser authorization callback page
- Session-only Trello token handling
- Optional remembered API key
- Board discovery and selection
- Automatic list-name suggestions
- Explicit list mapping for alterations, completed alterations, inventory, rush, orders, and shipping
- Workspace-to-Trello card creation and updates
- Trello-to-workspace preview, safe pull, and Trello-priority pull
- Linked-card IDs and URLs on local records
- Two-sided conflict detection
- Bulk push and per-record sync
- Optional automatic push after local record saves
- Dashboard Trello connection status
- Trello link on every program page
- Offline-cache and security-document updates

## Validation

- Every JavaScript file passed `node --check`.
- Every internal HTML link, script, stylesheet, image, and directory link was checked.
- The Trello API client passed a mocked Node unit test covering authorization headers, card creation, list mapping, sync markers, and local link persistence.
- Real Trello authorization and network writes were not executed because no user API key or token was supplied.

## Known architectural limits

- GitHub Pages cannot receive webhook POST requests.
- Direct sync runs only while the browser site is open.
- Browser-local workspaces are not a shared multi-user database.
- Trello tokens grant broad account access under the current token model and must remain secret.
- Trello has announced a future OAuth 2.0 migration; the integration isolates auth code for later replacement.
