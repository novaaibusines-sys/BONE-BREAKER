# BONE BREAKER

Personal self-improvement warrior dashboard: habit tracking, task management, tactical calendar, notes, and an AI coach.

Built with **Vite + React 19 + TypeScript** (a single-page app). The Express server in `server.ts` is only used for local development and for the `/api/coach` AI endpoint. On Cloudflare Pages that endpoint is served by a Pages Function (`functions/api/coach.ts`).

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and add your Gemini API key:
   `GEMINI_API_KEY="your-key"`
3. Start the dev server:
   `npm run dev`

The app opens on `http://localhost:3000`.

## Build

```bash
npm run build
```

- Build command: `npm run build`
- Output directory: `dist/`

The build output contains `index.html`, compiled JavaScript/CSS in `dist/assets/`, the PWA files, and **no `.ts`/`.tsx` files**. `dist/` is generated and is not committed.

## Deploy to Cloudflare Pages

### Option A — Wrangler CLI (recommended)

```bash
# 1. Log in once (opens your browser)
npm run cf:login

# 2. Build and deploy
npm run deploy
```

`npm run deploy` runs `npm run build` and then:

```bash
wrangler pages deploy dist
```

The first deploy asks you to create the Pages project. Accept the default name **bone-breaker** (from `wrangler.toml`). After that your site is live at:

`https://bone-breaker.pages.dev`

Add the API key as a secret (only needed once):

```bash
npm run cf:secret
```

Paste your Gemini API key when prompted. It is stored server-side and never committed to Git.

You can also set it in the dashboard: **Workers & Pages > bone-breaker > Settings > Variables and Secrets > Add > Secret**, name `GEMINI_API_KEY`.

### Option B — Connect to Git

1. Push this repository to GitHub (already done).
2. In the Cloudflare dashboard: **Workers & Pages > Create > Pages > Connect to Git**.
3. Select the repository and use:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add the `GEMINI_API_KEY` secret under **Settings > Variables and Secrets**.
5. Save and deploy. Every push to `main` redeploys automatically.

### Option C — Drag and drop (static folder only)

Run `npm run build` first, then drag the **`dist`** folder into Cloudflare Pages. Do **not** upload the project root — Cloudflare's uploader cannot compile TypeScript.

### Notes

- `public/_redirects` contains `/* /index.html 200` so refreshing any page does not 404. Cloudflare Pages Functions (like `/api/coach`) are matched before this rule.
- `wrangler.toml` points Pages at `dist` and names the project `bone-breaker`.
- The AI coach works in three ways: through `/api/coach` (Cloudflare Function), directly with a key saved in **Settings**, or with a built-in offline plan when no key is available.
- Never commit `.env`, `.env.local`, or `.dev.vars`. They are already ignored by `.gitignore`.

## Repeat deployments

```bash
git add .
git commit -m "your message"
git push          # Option B deploys automatically
npm run deploy    # or deploy manually with Wrangler
```
