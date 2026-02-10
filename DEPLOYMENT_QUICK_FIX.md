# Quick Deployment Fix Guide

## 🚨 Issues Fixed

1. **"Link is not defined" error** - FIXED ✅
2. **Manifest 401 errors** - FIXED ✅

## 🔧 Changes Made

### 1. Removed Conflicting Files
- Deleted `components/Header.tsx` (old React Router version)
- Deleted `src/app/api/manifest/route.ts` (unnecessary)

### 2. Fixed Manifest Path
- Updated `src/app/layout.tsx` to use `/manifest.json` instead of `/manifest.webmanifest`

## 🚀 Deploy to Vercel

### Step 1: Push Changes
```bash
git add .
git commit -m "fix: resolve Link import and manifest 401 errors"
git push origin main
```

### Step 2: Verify Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

**Required Variables** (copy from `.env.production.example`):

```bash
# Generate secrets with: openssl rand -base64 32

# Critical - Required for Auth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-new-secret>
JWT_SECRET=<generate-new-secret>

# Critical - Required for Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Critical - Required for App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Redis (for caching)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Email (for notifications)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Product IDs
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# Optional OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### Step 3: Deploy
- Vercel auto-deploys on push to `main`
- Or manually redeploy in Vercel dashboard

### Step 4: Test
1. Visit your production URL
2. Open DevTools Console (F12)
3. Check for errors
4. Test navigation (Home → Coupons → Stores)
5. Check PWA manifest loads: `https://your-domain/manifest.json`

## ✅ Expected Results

- ✅ No "Link is not defined" errors
- ✅ No 401 errors for manifest
- ✅ Service Worker registers successfully
- ✅ All navigation works
- ✅ PWA install prompt appears (mobile)

## 📝 What Was Wrong?

### Link Error
The old `components/Header.tsx` used React Router's Link:
```tsx
import { Link } from 'react-router-dom'; // ❌ Wrong
```

Should be (and now is in `src/components/Header.tsx`):
```tsx
import Link from 'next/link'; // ✅ Correct
```

### Manifest 401
The layout tried to load `/manifest.webmanifest` via an API route that required auth. We fixed it to use the static file:
```tsx
<link rel="manifest" href="/manifest.json" /> // ✅ Static file, no auth needed
```

## 🆘 Still Having Issues?

Check these common problems:

1. **Database connection fails**
   - Verify `DATABASE_URL` is correct
   - Check if database allows connections from Vercel IPs
   - Ensure `?sslmode=require` is in connection string

2. **Auth doesn't work**
   - Generate new secrets: `openssl rand -base64 32`
   - Set `NEXTAUTH_URL` to your actual Vercel URL
   - Set `NEXTAUTH_SECRET` and `JWT_SECRET`

3. **Images/assets 404**
   - Ensure files exist in `public/` folder
   - Check file paths are correct (case-sensitive)

4. **API routes fail**
   - Check Vercel function logs
   - Verify environment variables are set
   - Check database/Redis connectivity

---

**Status**: Ready for deployment! 🎉
