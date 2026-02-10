# Kobonz – What’s Broken, Why, and Fix Plan

## 1. What Is Broken

### Build (Vercel / local)

- **`next build` fails** with “Module not found” for:
  - `@/components/ui/table`
  - `@/components/ui/button`
  - `@/components/ui/badge`
  - `@/components/ui/card`
  - `@/components/ui/dialog`
- **Missing component**: `@/components/ui/popover` is imported by `NotificationBell.tsx` but **no `popover.tsx`** exists in the repo.

### Path / structure

- **Two component trees**: Root `components/` (legacy) and `src/components/` (Next.js). UI primitives (table, button, badge, card, dialog, tabs, etc.) live only under **`src/components/ui/`**.
- **Path alias**: `tsconfig.json` has `"@/components/*": ["./components/*"]` → resolves to **root** `components/`. So `@/components/ui/table` becomes `./components/ui/table` (root), where **there is no `ui/` folder** → module not found.

### Runtime (when something does deploy)

- **Auth 404s**: You mentioned `/auth/register` and `/auth/login` → 404. In this repo, those routes exist under the `(public)` group (`src/app/(public)/auth/login/page.tsx`, `register/page.tsx`), so they should be `/auth/login` and `/auth/register`. 404s can still happen if the build never succeeds (so those routes never get built) or if there is a basePath/rewrite issue.
- **manifest 401**: Layout uses `<link rel="manifest" href="/api/manifest" />`. Middleware already marks `/api/manifest` as public. If you still see 401, it may be env or deployment-specific; once build is fixed we can re-check.

---

## 2. Why It’s Broken

1. **Partial migration**: App was moved to Next.js App Router under `src/`, but:
   - Path aliases were left pointing at the **old root** `components/` and **root** `hooks/` (and part of `@/lib`, etc.).
   - New UI components were added under **`src/components/ui/`** and the app imports them via `@/components/ui/*`, which still resolve to root → **wrong folder**.
2. **Alias design**: One alias `@/components/*` → `./components/*` (root) was used for “all” components. After adding `src/components/ui/`, nothing was added to make `@/components/ui/*` point at `src/components/ui/`, so the bundler looks for `components/ui/` at root and fails.
3. **Missing piece**: A shadcn-style `popover` was never added under `src/components/ui/`, but `NotificationBell` imports it → build fails when that chunk is built.

So: **not a Vercel bug** – it’s **path alias + missing file** in the current repo.

---

## 3. Architecture Decision: **Option A (Keep Next.js)**

- The app is **already** Next.js 14 (App Router) in `src/app/`, with API routes, middleware, and Prisma/NextAuth.
- **Option B** (revert to pure React/Vite SPA) would mean:
  - Removing Next.js, re-adding Vite, redoing routing, SSR, and API layout.
  - High risk of new bugs and a long migration.
- **Option A** is chosen: **keep Next.js**, fix path aliases and missing UI so that:
  - `next build` succeeds.
  - Vercel deployment can complete.
  - We can then align UI/UX with the reference site (kobonz.site) step by step.

---

## 4. Step-by-Step Fix Plan (Executed in Code)

1. **Fix path alias for UI components**
   - In `tsconfig.json`, add a **more specific** path so UI imports resolve to `src`:
     - `"@/components/ui/*": ["./src/components/ui/*"]`
   - Keep existing `"@/components/*": ["./components/*"]` for other components (e.g. root `AnalyticsDashboard`, `Header`, etc. if still used), or align to `src` if we later move them. **Minimum change**: add the `ui` mapping so `@/components/ui/*` → `src/components/ui/*`.

2. **Add missing `popover` component**
   - Add `src/components/ui/popover.tsx` using `@radix-ui/react-popover` (already in package.json), same pattern as `dialog.tsx` and using `@/lib/utils` for `cn()`.

3. **Re-run build**
   - Run `npm run build` and fix any further “Module not found” or type errors (e.g. other `@/` or `../` imports from `src`).

4. **Deploy**
   - After a clean build, deploy to Vercel. Ensure required env vars (e.g. `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`) are set so auth and API routes work.

5. **UI/UX match to reference**
   - Once the app builds and deploys, compare pages and components to https://kobonz.site/#/ and adjust layout, spacing, colors, and flows so the deployed site matches the reference (pixel-level as requested).

---

## 5. What Was Changed in This Repo

- **tsconfig.json**
  - `"@/components/*": ["./src/components/*"]` so all app component imports (Header, Pagination, SubscriptionStatus, SubscriptionPlans, ui/*) resolve to `src/components/`.
  - `"@/legacy-components/*": ["./components/*"]` so `LazyComponents` can still load root-only components (AdvancedAnalytics, DashboardCharts, QRCodeModal, SimpleChart) without moving them.
- **src/components/ui/popover.tsx**: New file implementing Popover using `@radix-ui/react-popover`, so `NotificationBell` and any other use of `@/components/ui/popover` resolve and build.
- **src/components/LazyComponents.tsx**: Dynamic imports for AdvancedAnalytics, DashboardCharts, QRCodeModal, SimpleChart changed from `@/components/` to `@/legacy-components/` so they resolve to the root `components/` folder.

**Build result:** `npm run build` completes successfully (exit code 0). Static pages and API routes are generated; API routes that use `request.cookies` or `headers` are correctly treated as dynamic (ƒ). Routes such as `/auth/login`, `/auth/register`, `/api/manifest` are present and ready for deployment.

No half-measures: path aliases and one missing UI component were fixed so the project builds cleanly and is ready for Vercel deployment and then UI alignment with the reference site.

---

## 6. Vercel Deployment – Environment Variables

Required for a successful deployment (set in Vercel Dashboard → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (e.g. Neon) |
| `NEXTAUTH_SECRET` | **Yes** | Use `openssl rand -base64 32` to generate |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your Vercel URL, e.g. `https://your-app.vercel.app` |

Optional (app works with reduced features without them): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, Stripe keys, etc.

See **`.env.example`** for a full list and **`VERCEL_DEPLOYMENT_FIX.md`** for deployment steps and troubleshooting.
