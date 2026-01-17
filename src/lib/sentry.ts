import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Enable native crash reporting
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: true,

    // Attach stack traces to captured exceptions
    attachStacktrace: true,

    // Enable debug mode in development
    debug: __DEV__,

    // App release info
    release: `systemsf1rst-mobile@${Constants.expoConfig?.version || '1.0.0'}`,
    dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive user data
      if (event.user) {
        delete event.user.ip_address;
      }

      // Filter out sensitive breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
          // Filter out auth tokens from URLs
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = breadcrumb.data.url.replace(/token=[^&]+/g, 'token=REDACTED');
          }
          return true;
        });
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set additional context tags
 */
export function setTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string = 'action',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Wrap a component with Sentry error boundary (HOC)
 */
export const withSentryErrorBoundary = Sentry.wrap;

/**
 * React hook for capturing errors
 */
export function useSentryErrorHandler() {
  return (error: Error, componentStack?: string) => {
    Sentry.captureException(error, {
      extra: { componentStack },
    });
  };
}

export default Sentry;
