# Project architecture

This project recreates the supplied PSBS Biak site while changing the team doctor to dr. Lintang Aprilia. Preserve the reference design and Indonesian copy unless asked to change them.

- `public/index.html`: application, home screen, CSS, clinical content, player workflows, WhatsApp templates, and canvas overlays.
- `public/cheatsheet.html`: clinical guide loaded inside the main application's iframe. It uses `parent.RansPrefs` to persist preferences through the API.
- `public/assets`, `public/coast.svg`, `public/club-mark.svg`: copied reference branding and illustrations.
- `netlify/server/index.mjs`: request handler for records and uploaded files.
- `db/schema.ts`, `db/index.ts`: document-compatible records table and Drizzle client.
- `netlify/database/migrations`: generated database migrations.
- `netlify.toml`: static publishing, API server paths, and Node.js 24 runtime.

The `CFG.doctor` value in the main page supplies names to WhatsApp messages and the default duty overlay. The main page footer and cheatsheet footer also include the doctor's name. Update all three locations together for future name changes.

Retain the existing vanilla HTML/CSS/JavaScript structure and collection names. Persist application records in Netlify Database and binary uploads in Netlify Blobs. Never introduce local files or process memory as persistent storage. Browser workspaces are scoped using an HTTP-only cookie; scope every database query and upload path to that workspace. Do not import medical records from the reference site.

Use Drizzle beta packages for the Netlify Database adapter. Generate a named migration for schema changes. Keep only one server entrypoint. Static files serve the pages; the server handles only `/api/*` and `/_blob/*`. Do not add a catch-all rewrite that intercepts API requests.
