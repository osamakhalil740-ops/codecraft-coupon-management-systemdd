/**
 * Production-safe logger utility
 * Only logs in development mode
 * In production, errors are sent to monitoring service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (this.isProduction) {
      return level === 'error';
    }
    // In development, log everything
    return this.isDevelopment;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, errorContext));
    }

    // In production, send to error monitoring service
    if (this.isProduction && typeof window !== 'undefined') {
      // Error monitoring will be integrated here (Sentry)
      this.reportToMonitoring(message, error, errorContext);
    }
  }

  private reportToMonitoring(message: string, error?: Error | unknown, context?: LogContext): void {
    // Integrated with Sentry error monitoring
    try {
      import('../config/monitoring').then(({ default: Sentry }) => {
        if (Sentry && Sentry.captureException) {
          Sentry.captureException(error, {
            extra: { message, ...context }
          });
        }
      }).catch(() => {
        // Silently fail - don't break app if monitoring fails
      });
    } catch (e) {
      // Silently fail - don't break app if monitoring fails
    }
  }

  // Special method for tracking user actions (analytics)
  track(event: string, properties?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`📊 TRACK: ${event}`, properties);
    }
    // In production, this would go to analytics service
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error, track } = logger;
