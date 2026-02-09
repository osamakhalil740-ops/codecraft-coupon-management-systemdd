/**
 * Standardized Error Handling Utility
 * 
 * Provides consistent error handling patterns across the application
 */

import { FirebaseError } from 'firebase/app';
import { logger } from '../utils/logger';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: ErrorContext;
  stack?: string;
}

/**
 * Central error logging function
 * In production, this should integrate with monitoring services like Sentry
 */
function logError(error: ErrorReport): void {
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';

  if (isDev) {
    console.group(`🔴 Error: ${error.message}`);
    logger.error('Severity:', error.severity);
    logger.error('Code:', error.code);
    logger.error('Context:', error.context);
    if (error.stack) {
      logger.error('Stack:', error.stack);
    }
    console.groupEnd();
  }

  if (isProd) {
    // Send to Sentry error monitoring
    import('../config/monitoring').then(({ default: Sentry }) => {
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(error, {
          extra: {
            message: error.message,
            code: error.code,
            severity: error.severity,
            context: error.context,
          },
        });
      }
    }).catch(() => {
      // Silently fail if monitoring not available
      logger.error('[Error]', error.message, error.code);
    });
  }
}

/**
 * Get user-friendly error message from Firebase error
 */
function getFirebaseErrorMessage(error: FirebaseError): string {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    
    // Firestore errors
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This resource already exists.',
    'resource-exhausted': 'Service temporarily unavailable. Please try again.',
    'failed-precondition': 'Operation cannot be completed in current state.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'unauthenticated': 'Please login to continue.',
    'deadline-exceeded': 'Request timed out. Please try again.',
    
    // Functions errors
    'functions/invalid-argument': 'Invalid input provided.',
    'functions/unauthenticated': 'Authentication required.',
    'functions/permission-denied': 'Permission denied.',
    'functions/not-found': 'Resource not found.',
    'functions/internal': 'Internal server error. Please try again.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
}

/**
 * Get user-friendly error message from any error
 */
function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return getFirebaseErrorMessage(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Main error handler - processes and logs errors consistently
 */
export function handleError(
  error: unknown,
  context: ErrorContext = {},
  options: { showToUser?: boolean; severity?: ErrorReport['severity'] } = {}
): string {
  const {
    showToUser = true,
    severity = 'medium'
  } = options;

  // Extract error details
  const message = getUserFriendlyMessage(error);
  const code = error instanceof FirebaseError ? error.code : undefined;
  const stack = error instanceof Error ? error.stack : undefined;

  // Create error report
  const errorReport: ErrorReport = {
    message,
    code,
    severity,
    timestamp: new Date().toISOString(),
    context,
    stack
  };

  // Log the error
  logError(errorReport);

  // Return user-friendly message
  return showToUser ? message : '';
}

/**
 * Specific error handlers for common scenarios
 */

export const AuthErrorHandler = {
  login: (error: unknown) => handleError(error, {
    component: 'LoginPage',
    action: 'login'
  }, { severity: 'medium' }),

  signup: (error: unknown) => handleError(error, {
    component: 'LoginPage',
    action: 'signup'
  }, { severity: 'medium' }),

  logout: (error: unknown) => handleError(error, {
    component: 'Header',
    action: 'logout'
  }, { severity: 'low' })
};

export const CouponErrorHandler = {
  create: (error: unknown, userId?: string) => handleError(error, {
    component: 'ShopOwnerDashboard',
    action: 'create_coupon',
    userId
  }, { severity: 'high' }),

  redeem: (error: unknown, couponId?: string) => handleError(error, {
    component: 'ValidationPortalPage',
    action: 'redeem_coupon',
    metadata: { couponId }
  }, { severity: 'high' }),

  fetch: (error: unknown) => handleError(error, {
    component: 'Dashboard',
    action: 'fetch_coupons'
  }, { severity: 'medium' })
};

export const DataErrorHandler = {
  fetch: (error: unknown, resource: string) => handleError(error, {
    component: 'API',
    action: 'fetch_data',
    metadata: { resource }
  }, { severity: 'medium' }),

  update: (error: unknown, resource: string) => handleError(error, {
    component: 'API',
    action: 'update_data',
    metadata: { resource }
  }, { severity: 'high' }),

  delete: (error: unknown, resource: string) => handleError(error, {
    component: 'API',
    action: 'delete_data',
    metadata: { resource }
  }, { severity: 'high' })
};

/**
 * Async error wrapper - automatically handles errors from async functions
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context: ErrorContext,
  options?: { showToUser?: boolean; severity?: ErrorReport['severity'] }
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}

/**
 * Error boundary helper - formats errors for React Error Boundary
 */
export function formatErrorForBoundary(error: Error, errorInfo: React.ErrorInfo): ErrorReport {
  return {
    message: error.message,
    severity: 'critical',
    timestamp: new Date().toISOString(),
    context: {
      component: errorInfo.componentStack?.split('\n')[1]?.trim()
    },
    stack: error.stack
  };
}
