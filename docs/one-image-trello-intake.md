# One-Image Trello Alteration Intake

This feature creates a Trello alteration-intake card from one annotated screenshot or a packet of up to 12 images.

## What it does

- Accepts a camera photo or multiple selected images.
- Uses the first image as the Trello card cover.
- Creates the card in the mapped **Active alterations** Trello list.
- Uploads the images directly from the browser to Trello.
- Adds an interpretation and validation checklist.
- Allows optional client, order, COF, garment, request-type, priority, and known-instruction fields.
- Creates an **Unidentified Client / Unidentified garment packet** intake when only an image is available.
- Preserves unknown information rather than inventing measurements, garment identity, construction, or Secure Site categories.
- Downscales unusually large JPEG photographs in the browser before upload while leaving ordinary screenshots and PNG files unchanged.

## One-time setup

1. Deploy the site through GitHub Pages.
2. Open **Trello setup** from the site.
3. Enter the Trello application API key and authorize Nicole's Trello account.
4. Select the correct Trello board.
5. Map **Active alterations** to the list that should receive new alteration intakes.
6. Save the mapping.

The API key may be remembered on the device. The Trello user token remains in session storage and is not committed to GitHub.

## Daily use

1. Open **One-Image Alteration Intake**.
2. Tap **Take photo** or **Select images**.
3. Put the annotated wardrobe/swatch screenshot first.
4. Add fitting photographs when available.
5. Optionally enter any identification already known.
6. Tap **Create Trello intake**.
7. Review the resulting Trello card and complete the interpretation checklist.

## Important boundary

GitHub Pages is a static browser application. With Trello alone, it can reliably create the intake card, attach the source packet, and establish the review workflow. It cannot safely perform full AI handwriting and garment-fit interpretation without an additional protected AI service. The created card therefore starts in **Needs Interpretation** status unless a person has already entered the necessary information.

## Credential rule

Never commit a Trello user token, client records, client images, or other private information to the repository. Images move directly from the browser to Trello and are not stored by GitHub Pages.
