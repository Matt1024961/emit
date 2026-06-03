# Deploy

This app is static. The build makes a plain `dist/` folder of HTML, JS, and CSS.
Any static host can serve it. Pick one of the options below.

Build it yourself first to check it works:

```bash
npm install
npm run build
npm run preview      # serves dist/ at http://localhost:4173
```

## Netlify

1. Push the repo to GitHub.
2. In Netlify, click **Add new site → Import an existing project** and pick the
   repo.
3. Netlify reads `netlify.toml`, so the build command and publish folder are
   already set. Click **Deploy**.

## Vercel

1. Push the repo to GitHub.
2. In Vercel, click **Add New → Project** and pick the repo.
3. Vercel reads `vercel.json`. Click **Deploy**.

## GitHub Pages

1. In the repo settings, open **Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The `Deploy to GitHub Pages` workflow builds the site and
   publishes it.
3. The workflow sets the base path to `/<repo>/`, so links work on a project
   site.

If you use a custom domain or a user/org Pages site (served from `/`), set
`BASE_PATH=/` for the build.

## Any other host

Run `npm run build` and upload the `dist/` folder. Add one rule: send unknown
paths to `index.html`, so the single-page app loads. The Netlify and Vercel
configs already do this.
