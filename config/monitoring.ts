/**
 * Monitoring and Analytics Configuration
 * Integrates Sentry for error tracking and analytics services
 */

import * as Sentry from '@sentry/react';
import { IS_PROD } from './constants';

// Add global flag to prevent double initialization
declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
    gtag?: (...args: any[]) => void;
  }
}

// Sentry Configuration - Lazy loaded for performance
export const initSentry = () => {
  // Only initialize in production and if not already initialized
  if (IS_PROD && !window.__SENTRY_INITIALIZED__) {
    window.__SENTRY_INITIALIZED__ = true;
    Sentry.init({
      dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'] || '',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring - reduced for better performance
      tracesSampleRate: 0.1, // Sample only 10% of transactions
      // Session Replay - reduced sampling
      replaysSessionSampleRate: 0.01, // Only 1% of sessions
      replaysOnErrorSampleRate: 0.5, // 50% of error sessions
      // Environment
      environment: IS_PROD ? 'production' : 'development',
      // Release tracking
      release: `kobonz@${process.env['NEXT_PUBLIC_APP_VERSION'] || '1.0.0'}`,
      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      // Add user context
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as Error).message;
            // Ignore common browser extensions errors
            if (message.includes('chrome-extension://')) {
              return null;
            }
          }
        }
        return event;
      },
    });
  }
};

// Analytics Configuration
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

class AnalyticsService {
  private enabled: boolean = IS_PROD;

  // Track custom events
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log(`📊 [Analytics] ${event}`, properties);
      return;
    }

    // Send to analytics services
    this.sendToServices({ event, properties });
  }

  // Track page views
  pageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', { page, ...properties });
  }

  // Track user actions
  userAction(action: string, properties?: Record<string, any>) {
    this.track('user_action', { action, ...properties });
  }

  // Set user identity
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.enabled) {
      console.log(`👤 [Analytics] Identify: ${userId}`, traits);
      return;
    }

    // Set user in Sentry
    Sentry.setUser({ id: userId, ...traits });
  }

  // Track coupon events
  couponCreated(couponId: string, properties?: Record<string, any>) {
    this.track('coupon_created', { coupon_id: couponId, ...properties });
  }

  couponRedeemed(couponId: string, properties?: Record<string, any>) {
    this.track('coupon_redeemed', { coupon_id: couponId, ...properties });
  }

  couponShared(couponId: string, platform?: string) {
    this.track('coupon_shared', { coupon_id: couponId, platform });
  }

  // Track user registration
  userSignup(userId: string, role: string) {
    this.track('user_signup', { user_id: userId, role });
  }

  userLogin(userId: string) {
    this.track('user_login', { user_id: userId });
  }

  // Track marketplace actions
  shopViewed(shopId: string, shopName: string) {
    this.track('shop_viewed', { shop_id: shopId, shop_name: shopName });
  }

  searchPerformed(query: string, resultsCount: number) {
    this.track('search_performed', { query, results_count: resultsCount });
  }

  // Track performance metrics
  private sendToServices(data: AnalyticsEvent) {
    // In production, send to multiple analytics services
    try {
      // Google Analytics 4 (if configured)
      if (window.gtag) {
        window.gtag('event', data.event, data.properties);
      }

      // Custom analytics endpoint (if you have one)
      if (process.env['NEXT_PUBLIC_ANALYTICS_ENDPOINT']) {
        fetch(process.env['NEXT_PUBLIC_ANALYTICS_ENDPOINT'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
}

// Export singleton
export const analytics = new AnalyticsService();

// Performance Monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(name: string) {
    this.marks.set(name, performance.now());
  }

  end(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Log slow operations
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      
      // Send to Sentry in production
      if (IS_PROD) {
        Sentry.captureMessage(`Slow operation: ${name}`, {
          level: 'warning',
          extra: { duration },
        });
      }
    }

    // Track in analytics
    analytics.track('performance_metric', {
      metric: name,
      duration: Math.round(duration),
    });

    return duration;
  }
}

export const performanceMonitor = new PerformanceMonitor();

