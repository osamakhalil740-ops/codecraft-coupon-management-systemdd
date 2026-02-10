/**
 * Lazy-loaded components for performance optimization
 */
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load heavy components
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/AnalyticsDashboard'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Disable SSR for client-only components
  }
);

export const LazyAdvancedAnalytics = dynamic(
  () => import('@/legacy-components/AdvancedAnalytics'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyDashboardCharts = dynamic(
  () => import('@/legacy-components/DashboardCharts'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyNotificationBell = dynamic(
  () => import('@/components/NotificationBell'),
  {
    loading: () => <div className="h-8 w-8"></div>,
    ssr: false,
  }
);

export const LazyQRCodeModal = dynamic(
  () => import('@/legacy-components/QRCodeModal'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Lazy load chart libraries
export const LazySimpleChart = dynamic(
  () => import('@/legacy-components/SimpleChart'),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded"></div>,
    ssr: false,
  }
);

// Export a generic lazy loader helper
export function createLazyComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: {
    ssr?: boolean;
    loading?: () => JSX.Element;
  } = {}
) {
  return dynamic(importFunc, {
    loading: options.loading || (() => <LoadingSpinner />),
    ssr: options.ssr ?? true,
  });
}
