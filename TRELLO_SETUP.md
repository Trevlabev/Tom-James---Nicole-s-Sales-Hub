# Trello Integration Setup

## What the integration does

- Authorizes a Trello user from the browser.
- Loads boards and existing lists.
- Maps Nicole's workflows to the current board without requiring a new structure.
- Creates or updates cards from local alteration, inventory, order, rush, and shipment records.
- Retains the Trello card ID and URL on each local record.
- Imports cards from mapped lists.
- Detects records changed in both Trello and the local workspace after the last sync.
- Can automatically publish newly saved or updated records while the site is open.

## Recommended list mapping

| Operations Suite role | Nicole's Trello list |
| --- | --- |
| Active alterations | Alterations in shop |
| Completed alterations | Completed Alterations to be scheduled |
| Inventory | Inventory |
| Rush / deadline | RUSH LIST |
| General orders | Leave unmapped unless the board has a separate WIP/order list |
| Shipping | Map only if Nicole uses a shipping list or board |

## One-time Trello app setup

1. Open Trello app administration.
2. Create or select the internal Power-Up/application used for the Operations Suite.
3. Generate an API key.
4. Add the deployed GitHub Pages **origin** to Allowed Origins. For a typical project site this is the account origin, such as `https://ACCOUNT.github.io`.
5. Deploy the repository.
6. Open **Trello** from the site navigation.
7. Enter the API key and authorize read/write access.
8. Select Nicole's board, review the automatically suggested mappings, and save.
9. Test with demonstration or non-sensitive records before enabling automatic push.

## Credential handling

- The API key does not grant Trello data access by itself and may optionally be remembered on the device.
- The user token grants account access and is stored in session storage only.
- The token is not saved in the repository, workspace data, exported JSON, or service-worker cache.
- Disconnect before leaving a shared device.
- Revoke the application from Trello account settings if a token might have been exposed.

## Sync direction

### Workspace to Trello

Cards created by the suite include a line similar to:

```text
NAH_SYNC|alterations|alt-record-id
```

That marker links the Trello card to the local workspace record. Card titles, descriptions, list placement, and due dates are then updated on later pushes.

### Trello to workspace

- **Preview pull** reports mapped, new, linked, conflicting, and ignored cards.
- **Safe pull** imports new cards and preserves two-sided conflicts for review.
- **Trello wins** updates selected mapped fields such as status, location, due date, and next action on linked records.

## Operational cautions

- Do not map two unrelated operational roles to the same list unless that is intentional.
- Do not enable automatic push until the list mapping has been verified.
- Moving an alteration card into the completed mapping tells the local workspace that the garment is returned/verified. Do not move cards there merely because a provider reported completion.
- GitHub Pages cannot receive webhook POST requests. True background or multi-user synchronization requires a separate HTTPS serverless relay and shared data store.
- Trello has announced a future OAuth 2.0 migration. Authentication logic is isolated in `assets/js/trello-api.js` to allow replacement of the authorization adapter.

## Troubleshooting

### Authorization redirects fail

Confirm that the deployed GitHub Pages origin appears in the API key's Allowed Origins.

### `invalid token`

Disconnect and authorize again. The token may have expired or been revoked.

### No boards appear

Confirm that the authorized Trello member belongs to the expected board and that the token includes read access.

### Cards are skipped during push

A workflow list may be unmapped. Open the Trello Integration Center and review the mapping.

### A pull reports conflicts

Both the local record and Trello card changed after the last sync. Review both versions before choosing which side should win.

### Rate-limit error

Wait and retry. Avoid repeatedly pulling all cards or rapidly pushing the same records.
