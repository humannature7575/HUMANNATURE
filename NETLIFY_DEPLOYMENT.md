# Netlify Deployment

This project is a Next.js 16 app and should be deployed on Netlify as a hybrid
Next.js site, not as a static export.

## Build settings

- Base directory: leave empty, unless the repository root is different.
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `20`

These values are also configured in `netlify.toml`.

## Required environment variables

Set these in Netlify under Site configuration > Environment variables:

```txt
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

For `FIREBASE_PRIVATE_KEY`, keep newline characters as escaped `\n` values if
you paste the key into a single-line Netlify variable.

## Notes

- Do not add or pin `@netlify/plugin-nextjs`; Netlify applies the current
  OpenNext adapter automatically for modern Next.js projects.
- Keep `.env` and `.env.local` local only. Use `.env.example` as the deploy
  checklist.
- Run `npm run build` before deploying when changing server-side Firebase code.

