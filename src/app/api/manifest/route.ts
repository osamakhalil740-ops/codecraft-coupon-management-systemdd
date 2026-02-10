import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  const manifest = {
    name: 'Kobonz - Coupon Management System',
    short_name: 'Kobonz',
    description: 'Advanced coupon management platform for merchants and customers',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8B5CF6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    categories: ['shopping', 'business', 'finance'],
    shortcuts: [
      {
        name: 'Browse Coupons',
        short_name: 'Browse',
        description: 'Browse available coupons',
        url: '/coupons',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }],
      },
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your dashboard',
        url: '/dashboard',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
