import { Alert } from 'react-native';
import { sentryService } from '@/services/sentryService';
import { analyticsService } from '@/services/analyticsService';

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  logToAnalytics?: boolean;
  context?: Record<string, any>;
  screen?: string;
}

export class ErrorHandler {
  static handle(error: Error, options: ErrorHandlerOptions = {}) {
    const {
      showAlert = true,
      alertTitle = 'Error',
      alertMessage = 'Something went wrong. Please try again.',
      logToAnalytics = true,
      context,
      screen,
    } = options;

    console.error('Error:', error);

    sentryService.captureException(error, context);

    if (logToAnalytics) {
      analyticsService.logError(
        error.name || 'UnknownError',
        error.message,
        screen
      );
    }

    if (showAlert) {
      Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
    }
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, options);
      return null;
    }
  }

  static networkError(error: Error, options: ErrorHandlerOptions = {}) {
    this.handle(error, {
      ...options,
      alertTitle: 'Network Error',
      alertMessage: 'Unable to connect. Please check your internet connection and try again.',
    });
  }

  static authError(error: Error, options: ErrorHandlerOptions = {}) {
    this.handle(error, {
      ...options,
      alertTitle: 'Authentication Error',
      alertMessage: 'Please sign in again to continue.',
    });
  }

  static permissionError(permission: string, options: ErrorHandlerOptions = {}) {
    const error = new Error(`Permission denied: ${permission}`);
    this.handle(error, {
      ...options,
      alertTitle: 'Permission Required',
      alertMessage: `This feature requires ${permission} permission. Please enable it in your device settings.`,
    });
  }
}

export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const retryOperation = ErrorHandler.retry.bind(ErrorHandler);
export const withErrorHandling = ErrorHandler.withErrorHandling.bind(ErrorHandler);
