# PSBS Biak Football

A recreation of the PSBS Biak medical team application, with dr. Lintang Aprilia as the team doctor throughout the home page, clinical cheatsheet, social overlays, and WhatsApp templates.

The original Indonesian interface includes player records, injury assessments, session reports, medical guides, emergency tools, and communication templates. The pages use HTML, CSS, and browser JavaScript. A Netlify Server provides persistence through Netlify Database with Drizzle ORM; uploaded images and PDFs use Netlify Blobs.

## Local development

Install dependencies with `npm install` using Node.js 24 or later. Link the project to its Netlify site, then run `netlify dev --port 8889` and open the local URL. The HTML pages require the API provided by Netlify Dev; opening the files directly does not provide persistence.

The database schema is defined in `db/schema.ts`. After changing it, generate a migration with `npx drizzle-kit generate --name descriptive_change_name`. Netlify applies migrations during deployment. No frontend compilation is required; `public` is the publish directory.

Each browser has an isolated workspace identified by an HTTP-only cookie. Records and uploads persist on Netlify, but clearing that cookie creates a new workspace. This matches the source application's browser workspace behavior; it does not provide named accounts or cross-device sign-in. Existing records from the reference website are not imported. Use the application's export feature for backups.
