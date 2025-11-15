# Cloudflare Pages Build Configuration

## ⚠️ IMPORTANT: You MUST configure build settings in Cloudflare Pages Dashboard

The build command **cannot** be auto-detected from `wrangler.jsonc`. You must configure it manually in the Cloudflare Pages dashboard.

## Steps to Configure Build Settings

1. Go to your Cloudflare Pages project: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** > Your Project > **Settings** > **Builds & deployments**
3. Click **"Edit configuration"** in the Build configuration section
4. Set the following:

### Build Configuration:

```
Build command: pnpm install && pnpm run pages:build
Build output directory: .vercel/output/static
Root directory: / (leave empty)
Node.js version: 20 (or higher)
```

### If pnpm is not available, use npm instead:

```
Build command: npm install && npm run pages:build
Build output directory: .vercel/output/static
```

### Alternative (if npm install fails):

```
Build command: corepack enable && pnpm install && pnpm run pages:build
Build output directory: .vercel/output/static
```

## Why This Is Necessary

- Cloudflare Pages reads `wrangler.jsonc` for bindings and configuration
- However, the build command must be explicitly set in the dashboard
- The build step must run before Pages can deploy the output directory

## After Configuration

1. Save the build settings
2. Trigger a new deployment (or push a new commit)
3. The build should now run successfully

