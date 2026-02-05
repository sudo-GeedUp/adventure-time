import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { analyticsService } from '@/services/analyticsService';
import { sentryService } from '@/services/sentryService';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMonitorOptions {
  trackInAnalytics?: boolean;
  trackInSentry?: boolean;
  threshold?: number; // in ms, log warning if exceeded
}

export const usePerformanceMonitor = (options: PerformanceMonitorOptions = {}) => {
  const {
    trackInAnalytics = true,
    trackInSentry = true,
    threshold = 1000, // 1 second default threshold
  } = options;

  const metricsRef = useRef<Map<string, PerformanceMetric>>(new Map());

  // Start timing a metric
  const startTiming = useCallback((name: string, metadata?: Record<string, any>) => {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    metricsRef.current.set(name, metric);
    
    // Add breadcrumb to Sentry
    if (trackInSentry) {
      sentryService.addBreadcrumb({
        category: 'performance',
        message: `Started timing: ${name}`,
        data: metadata,
      });
    }
  }, [trackInSentry]);

  // End timing and record metric
  const endTiming = useCallback((name: string, additionalMetadata?: Record<string, any>) => {
    const metric = metricsRef.current.get(name);
    
    if (!metric) {
      console.warn(`No start time found for metric: ${name}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    // Update metric
    metric.endTime = endTime;
    metric.duration = duration;
    metric.metadata = { ...metric.metadata, ...additionalMetadata };

    // Log warning if threshold exceeded
    if (duration > threshold) {
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Track in analytics
    if (trackInAnalytics) {
      analyticsService.trackPerformance(name, duration);
    }

    // Track in Sentry with context if slow
    if (trackInSentry && duration > threshold) {
      sentryService.captureMessage(
        `Performance threshold exceeded: ${name}`,
        'warning'
      );
      sentryService.setContext('performance_metric', metric);
    }

    // Clean up
    metricsRef.current.delete(name);

    return duration;
  }, [trackInAnalytics, trackInSentry, threshold]);

  // Measure a function execution time
  const measureFunction = useCallback(async <T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startTiming(name, metadata);
    
    try {
      const result = await fn();
      endTiming(name, { success: true });
      return result;
    } catch (error) {
      endTiming(name, { success: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, [startTiming, endTiming]);

  // Measure render time — returns a cleanup function to call in the consumer's useEffect
  const measureRender = useCallback((componentName: string) => {
    const mountTime = performance.now();

    // Use requestAnimationFrame to ensure render is complete
    const frame = requestAnimationFrame(() => {
      const renderTime = performance.now() - mountTime;

      if (trackInAnalytics) {
        analyticsService.trackPerformance(`${componentName}_render`, renderTime);
      }

      if (renderTime > 100) { // 100ms render threshold
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [trackInAnalytics]);

  // Get current active metrics
  const getActiveMetrics = useCallback(() => {
    const now = performance.now();
    const active: Array<{ name: string; duration: number }> = [];
    
    metricsRef.current.forEach((metric, name) => {
      active.push({
        name,
        duration: now - metric.startTime,
      });
    });

    return active.sort((a, b) => b.duration - a.duration);
  }, []);

  // Clear all metrics
  const clearMetrics = useCallback(() => {
    metricsRef.current.clear();
  }, []);

  return {
    startTiming,
    endTiming,
    measureFunction,
    measureRender,
    getActiveMetrics,
    clearMetrics,
  };
};

// Hook for monitoring screen transitions
export const useScreenTransitionMonitor = (screenName: string) => {
  const { startTiming, endTiming } = usePerformanceMonitor({
    threshold: 500, // 500ms threshold for screen transitions
  });

  useEffect(() => {
    startTiming(`screen_${screenName}`, { screen: screenName });
    
    return () => {
      endTiming(`screen_${screenName}`);
    };
  }, [screenName, startTiming, endTiming]);
};

// Hook for monitoring API calls
export const useApiMonitor = () => {
  const { measureFunction } = usePerformanceMonitor({
    threshold: 5000, // 5s threshold for API calls
  });

  const monitoredFetch = useCallback(async (
    url: string,
    options?: RequestInit,
    metadata?: Record<string, any>
  ) => {
    return measureFunction(
      `api_${new URL(url).pathname.replace(/\//g, '_')}`,
      async () => {
        const response = await fetch(url, options);
        
        // Track additional metrics
        if (response.ok) {
          analyticsService.logCustomEvent('api_success', {
            url: new URL(url).pathname,
            status: response.status,
          });
        } else {
          analyticsService.logError('api_error', `HTTP ${response.status}`, 'API Call');
        }
        
        return response;
      },
      { url: new URL(url).pathname, method: options?.method || 'GET', ...metadata }
    );
  }, [measureFunction]);

  return { monitoredFetch };
};

// Hook for monitoring image loading
export const useImageLoadMonitor = () => {
  const { startTiming, endTiming } = usePerformanceMonitor({
    threshold: 3000, // 3s threshold for image loading
  });

  const monitorImageLoad = useCallback((src: string) => {
    const imageId = `image_${src.split('/').pop()}`;
    startTiming(imageId, { src });

    if (Platform.OS === 'web') {
      const img = new Image();
      img.onload = () => endTiming(imageId, { success: true });
      img.onerror = () => endTiming(imageId, { success: true, error: 'failed' });
      img.src = src;
    }

    return imageId;
  }, [startTiming, endTiming]);

  return { monitorImageLoad };
};

// Hook for monitoring memory usage (where available)
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
        
        // Track memory usage
        analyticsService.trackPerformance('memory_usage', usedMB, 'MB');
        
        // Warning if using more than 80% of limit
        if (usedMB / limitMB > 0.8) {
          console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
          sentryService.captureMessage(
            `High memory usage: ${usedMB.toFixed(2)}MB`,
            'warning'
          );
        }
      };

      // Check memory every 30 seconds
      const interval = setInterval(checkMemory, 30000);
      checkMemory(); // Initial check

      return () => clearInterval(interval);
    }
  }, []);
};

// Performance monitoring utility functions
export const PerformanceUtils = {
  // Mark a specific point in time
  mark: (name: string) => {
    if ('performance' in global && 'mark' in performance) {
      performance.mark(name);
    }
  },

  // Measure time between two marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in global && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          return entries[entries.length - 1].duration;
        }
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
    return 0;
  },

  // Get resource timing information
  getResourceTiming: (url: string) => {
    if (Platform.OS === 'web' && 'performance' in global && 'getEntriesByName' in performance) {
      const entries = performance.getEntriesByName(url) as PerformanceResourceTiming[];
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        return {
          duration: entry.duration,
          size: entry.transferSize,
          type: entry.initiatorType,
        };
      }
    }
    return null;
  },
};
