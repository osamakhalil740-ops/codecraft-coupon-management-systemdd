# Vercel Deployment Verification Checklist

Use this checklist before or after pushing to GitHub to confirm the project is ready for Vercel.

## Path aliases (tsconfig.json)

- [x] `@/*` → `./src/*`
- [x] `@/components/*` → `./src/components/*`
- [x] `@/legacy-components/*` → `./components/*`
- [x] `@/hooks/*` → `./hooks/*`
- [x] `@/lib/*` → `./src/lib/*`
- [x] `@/types/*` → `./src/types/*`

## Components

- [x] All `@/components/` imports resolve to `src/components/` (Header, Pagination, SubscriptionStatus, SubscriptionPlans, AnalyticsDashboard, NotificationBell, KobonzLogo, etc.)
- [x] All `@/components/ui/*` resolve to `src/components/ui/` (button, card, badge, table, dialog, tabs, popover, progress, scroll-area)
- [x] `src/components/ui/popover.tsx` exists (added for NotificationBell)
- [x] Lazy dynamic imports for root-only components use `@/legacy-components/`: AdvancedAnalytics, DashboardCharts, QRCodeModal, SimpleChart

## Build

- [x] `npm run build` completes successfully (exit code 0)
- [x] No "Module not found" errors
- [x] Routes generated: `/`, `/auth/login`, `/auth/register`, `/coupons`, `/stores`, `/api/manifest`, etc.

## Documentation

- [x] `KOBONZ_FIX_ANALYSIS.md` – analysis, root cause, Option A decision, and list of changes
- [x] `VERCEL_DEPLOYMENT_FIX.md` – deployment steps and env var summary
- [x] `.env.example` – full list of environment variables
- [x] `KOBONZ_FIX_ANALYSIS.md` §6 – required Vercel env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL)

## Sync with GitHub

To fully update the remote repository with all fixes:

```bash
git add .
git status   # review changes
git commit -m "fix: path aliases, popover, LazyComponents legacy imports; add deployment docs"
git push origin main
```

Then in Vercel: connect the repo (if not already), set the three required env vars, and deploy.
