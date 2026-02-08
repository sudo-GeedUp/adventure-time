import { Platform } from "react-native";
import { analyticsService } from "./analyticsService";
import { sentryService } from "./sentryService";

interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageResponseTime: number;
    slowestOperation: string;
    errorCount: number;
  };
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  type: "api" | "render" | "navigation" | "custom";
  success?: boolean;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Limit to prevent memory leaks
  private reportInterval: NodeJS.Timeout | null = null;
  private isReporting = false;

  constructor() {
    // Start periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Record a performance metric
   */
  record(metric: Omit<PerformanceMetric, "timestamp">) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Track in analytics
    analyticsService.trackPerformance(metric.name, metric.duration);

    // Track slow operations in Sentry
    if (metric.duration > this.getThresholdForType(metric.type)) {
      sentryService.captureMessage(
        `Slow operation: ${metric.name} took ${metric.duration}ms`,
        "warning"
      );
      sentryService.setContext("slow_operation", fullMetric);
    }

    // Track errors
    if (metric.success === false) {
      sentryService.captureMessage(`Failed operation: ${metric.name}`, "error");
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(
    name: string,
    type: PerformanceMetric["type"],
    metadata?: Record<string, any>
  ) {
    const startTime = performance.now();

    return {
      end: (
        success: boolean = true,
        additionalMetadata?: Record<string, any>
      ) => {
        const duration = performance.now() - startTime;

        this.record({
          name,
          duration,
          type,
          success,
          metadata: { ...metadata, ...additionalMetadata },
        });

        return duration;
      },
    };
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timer = this.startTimer(name, "api", metadata);

    try {
      const result = await apiCall();
      timer.end(true);
      return result;
    } catch (error: any) {
      timer.end(false, { error: error.message });
      throw error;
    }
  }

  /**
   * Measure render performance
   */
  measureRender(componentName: string, renderFn: () => void) {
    const timer = this.startTimer(`render_${componentName}`, "render");

    const start = performance.now();
    renderFn();
    const end = performance.now();

    timer.end(end - start < 100); // Consider slow if > 100ms
  }

  /**
   * Measure navigation performance
   */
  measureNavigation(from: string, to: string) {
    const timer = this.startTimer(`navigation_${from}_to_${to}`, "navigation", {
      from,
      to,
    });

    // Auto-end after a reasonable time
    setTimeout(() => timer.end(), 0);
  }

  /**
   * Get performance metrics summary
   */
  getSummary(timeRange?: number): PerformanceReport["summary"] {
    const now = Date.now();
    const cutoff = timeRange ? now - timeRange : 0;

    const relevantMetrics = timeRange
      ? this.metrics.filter((m) => m.timestamp > cutoff)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalMetrics: 0,
        averageResponseTime: 0,
        slowestOperation: "N/A",
        errorCount: 0,
      };
    }

    const totalDuration = relevantMetrics.reduce(
      (sum, m) => sum + m.duration,
      0
    );
    const averageResponseTime = totalDuration / relevantMetrics.length;
    const slowest = relevantMetrics.reduce((prev, current) =>
      current.duration > prev.duration ? current : prev
    );
    const errorCount = relevantMetrics.filter(
      (m) => m.success === false
    ).length;

    return {
      totalMetrics: relevantMetrics.length,
      averageResponseTime,
      slowestOperation: slowest.name,
      errorCount,
    };
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(
    type: PerformanceMetric["type"],
    limit?: number
  ): PerformanceMetric[] {
    const filtered = this.metrics
      .filter((m) => m.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);

    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Get slow operations
   */
  getSlowOperations(
    threshold?: number,
    limit: number = 10
  ): PerformanceMetric[] {
    const ms = threshold || 1000; // Default 1 second

    return this.metrics
      .filter((m) => m.duration > ms)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Generate performance report
   */
  generateReport(timeRange?: number): PerformanceReport {
    return {
      timestamp: Date.now(),
      metrics: timeRange
        ? this.metrics.filter((m) => m.timestamp > Date.now() - timeRange)
        : [...this.metrics],
      summary: this.getSummary(timeRange),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Start periodic reporting to analytics
   */
  private startPeriodicReporting() {
    // Report every 5 minutes
    this.reportInterval = setInterval(() => {
      if (!this.isReporting) {
        this.sendPeriodicReport();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Send periodic report to analytics
   */
  private async sendPeriodicReport() {
    this.isReporting = true;

    try {
      const summary = this.getSummary(5 * 60 * 1000); // Last 5 minutes

      analyticsService.logCustomEvent("performance_report", {
        ...summary,
        platform: Platform.OS,
      });

      // Clear old metrics to prevent memory buildup
      const cutoff = Date.now() - 60 * 60 * 1000; // Keep 1 hour of metrics
      this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
    } catch (error) {
      console.error("Error sending performance report:", error);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * Get threshold for metric type
   */
  private getThresholdForType(type: PerformanceMetric["type"]): number {
    switch (type) {
      case "api":
        return 5000; // 5 seconds
      case "render":
        return 100; // 100ms
      case "navigation":
        return 500; // 500ms
      default:
        return 1000; // 1 second
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();

// Export convenience functions
export const recordPerformance =
  performanceService.record.bind(performanceService);
export const measureApiCall =
  performanceService.measureApiCall.bind(performanceService);
export const measureRender =
  performanceService.measureRender.bind(performanceService);
export const measureNavigation =
  performanceService.measureNavigation.bind(performanceService);
