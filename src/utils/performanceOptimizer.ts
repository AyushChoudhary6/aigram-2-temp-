import { InteractionManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  id: string;
  timestamp: string;
  type: 'navigation' | 'api' | 'render' | 'memory' | 'bundle';
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  enableOptimizations: boolean;
  maxMetricsEntries: number;
  debounceDelay: number;
  throttleDelay: number;
}

class PerformanceOptimizer {
  private config: PerformanceConfig = {
    enableMetrics: true,
    enableOptimizations: true,
    maxMetricsEntries: 100,
    debounceDelay: 300,
    throttleDelay: 100,
  };

  private metrics: PerformanceMetrics[] = [];
  private readonly STORAGE_KEY = 'aigram_performance_metrics';
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, number> = new Map();

  constructor(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.loadMetrics();
  }

  /**
   * Measure performance of a function execution
   */
  async measurePerformance<T>(
    name: string,
    type: PerformanceMetrics['type'],
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (this.config.enableMetrics) {
        await this.recordMetric(name, type, duration, metadata);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.enableMetrics) {
        await this.recordMetric(name, type, duration, {
          ...metadata,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private async recordMetric(
    name: string,
    type: PerformanceMetrics['type'],
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: PerformanceMetrics = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      name,
      duration,
      metadata,
    };

    this.metrics.unshift(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.config.maxMetricsEntries) {
      this.metrics = this.metrics.slice(0, this.config.maxMetricsEntries);
    }

    // Store metrics asynchronously
    this.storeMetrics();
  }

  /**
   * Debounce function execution
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ): (...args: Parameters<T>) => void {
    const debounceDelay = delay || this.config.debounceDelay;
    
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, debounceDelay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle function execution
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ): (...args: Parameters<T>) => void {
    const throttleDelay = delay || this.config.throttleDelay;
    
    return (...args: Parameters<T>) => {
      const lastExecution = this.throttleTimers.get(key) || 0;
      const now = Date.now();

      if (now - lastExecution >= throttleDelay) {
        fn(...args);
        this.throttleTimers.set(key, now);
      }
    };
  }

  /**
   * Optimize heavy operations by deferring them
   */
  deferHeavyOperation(operation: () => void): void {
    if (this.config.enableOptimizations) {
      InteractionManager.runAfterInteractions(() => {
        operation();
      });
    } else {
      operation();
    }
  }

  /**
   * Batch multiple operations together
   */
  batchOperations(operations: Array<() => void>): void {
    if (this.config.enableOptimizations) {
      InteractionManager.runAfterInteractions(() => {
        operations.forEach(operation => operation());
      });
    } else {
      operations.forEach(operation => operation());
    }
  }

  /**
   * Optimize list rendering with virtualization hints
   */
  getListOptimizationProps(itemCount: number) {
    const shouldVirtualize = itemCount > 50;
    
    return {
      removeClippedSubviews: shouldVirtualize,
      maxToRenderPerBatch: shouldVirtualize ? 10 : itemCount,
      windowSize: shouldVirtualize ? 10 : itemCount,
      initialNumToRender: shouldVirtualize ? 10 : Math.min(itemCount, 20),
      getItemLayout: shouldVirtualize ? undefined : (data: any, index: number) => ({
        length: 60, // Estimated item height
        offset: 60 * index,
        index,
      }),
    };
  }

  /**
   * Memoize expensive calculations
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = fn(...args);
      cache.set(key, result);
      
      return result;
    }) as T;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    total: number;
    byType: Record<PerformanceMetrics['type'], number>;
    averageDuration: Record<PerformanceMetrics['type'], number>;
    slowestOperations: PerformanceMetrics[];
  } {
    const byType = this.metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<PerformanceMetrics['type'], number>);

    const averageDuration = Object.keys(byType).reduce((acc, type) => {
      const typeMetrics = this.metrics.filter(m => m.type === type as PerformanceMetrics['type']);
      const totalDuration = typeMetrics.reduce((sum, m) => sum + m.duration, 0);
      acc[type as PerformanceMetrics['type']] = totalDuration / typeMetrics.length;
      return acc;
    }, {} as Record<PerformanceMetrics['type'], number>);

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      total: this.metrics.length,
      byType,
      averageDuration,
      slowestOperations,
    };
  }

  /**
   * Store metrics to local storage
   */
  private async storeMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
    }
  }

  /**
   * Load metrics from local storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const storedMetrics = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedMetrics) {
        this.metrics = JSON.parse(storedMetrics);
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  /**
   * Clear all metrics
   */
  async clearMetrics(): Promise<void> {
    try {
      this.metrics = [];
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear performance metrics:', error);
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Clear throttle timers
    this.throttleTimers.clear();
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// React Hook for performance optimization
export const usePerformanceOptimizer = () => {
  const measurePerformance = <T>(
    name: string,
    type: PerformanceMetrics['type'],
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ) => {
    return performanceOptimizer.measurePerformance(name, type, fn, metadata);
  };

  const debounce = <T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ) => {
    return performanceOptimizer.debounce(key, fn, delay);
  };

  const throttle = <T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ) => {
    return performanceOptimizer.throttle(key, fn, delay);
  };

  const deferHeavyOperation = (operation: () => void) => {
    performanceOptimizer.deferHeavyOperation(operation);
  };

  const memoize = <T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ) => {
    return performanceOptimizer.memoize(fn, keyGenerator);
  };

  return {
    measurePerformance,
    debounce,
    throttle,
    deferHeavyOperation,
    memoize,
    getListOptimizationProps: (itemCount: number) => 
      performanceOptimizer.getListOptimizationProps(itemCount),
    getPerformanceStats: () => performanceOptimizer.getPerformanceStats(),
    clearMetrics: () => performanceOptimizer.clearMetrics(),
    exportMetrics: () => performanceOptimizer.exportMetrics(),
  };
};

export default performanceOptimizer;
