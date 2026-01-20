import * as Sentry from '@sentry/react-native';

class SentryService {
  private isInitialized = false;

  initialize(dsn?: string) {
    try {
      const sentryDsn = dsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
      
      if (!sentryDsn) {
        console.log('Sentry DSN not configured, crash reporting disabled');
        return;
      }

      Sentry.init({
        dsn: sentryDsn,
        debug: __DEV__,
        tracesSampleRate: 1.0,
        environment: __DEV__ ? 'development' : 'production',
      });

      this.isInitialized = true;
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized) return;
    
    try {
      if (context) {
        Sentry.setContext('additional_info', context);
      }
      Sentry.captureException(error);
    } catch (e) {
      console.error('Failed to capture exception:', e);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (!this.isInitialized) return;
    
    try {
      Sentry.captureMessage(message, level);
    } catch (error) {
      console.error('Failed to capture message:', error);
    }
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setUser(user);
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  clearUser() {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: Sentry.SeverityLevel; data?: Record<string, any> }) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.addBreadcrumb(breadcrumb);
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  setTag(key: string, value: string) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.error('Failed to set tag:', error);
    }
  }

  setContext(key: string, context: Record<string, any>) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setContext(key, context);
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }
}

export const sentryService = new SentryService();
