export = PerformanceMonitor;
/**
 * Enterprise performance monitoring with real-time metrics, cost tracking, and analytics
 */
declare class PerformanceMonitor {
    constructor(context: any, logger: any);
    context: any;
    logger: any;
    metrics: Map<any, any>;
    timers: Map<any, any>;
    costs: Map<any, any>;
    sessionStart: number;
    metricsFile: string | null;
    /**
     * Initialize metrics storage
     */
    initializeMetricsStorage(): Promise<void>;
    /**
     * Record a performance metric
     */
    recordMetric(name: any, value: any, metadata?: {}): {
        name: any;
        value: any;
        timestamp: number;
        sessionTime: number;
    };
    /**
     * Start a performance timer
     */
    startTimer(name: any, metadata?: {}): {
        end: () => {
            name: any;
            value: any;
            timestamp: number;
            sessionTime: number;
        } | null;
    };
    /**
     * End a performance timer and record the metric
     */
    endTimer(name: any): {
        name: any;
        value: any;
        timestamp: number;
        sessionTime: number;
    } | null;
    /**
     * Record API cost for tracking
     */
    recordCost(provider: any, model: any, tokens: any, cost: any, metadata?: {}): {
        provider: any;
        model: any;
        tokens: any;
        cost: any;
        timestamp: number;
    };
    /**
     * Get performance statistics
     */
    getStats(metricName?: null): {};
    /**
     * Calculate statistics for a set of metrics
     */
    calculateStats(metrics: any): {
        count: number;
        avg: number;
        min: number;
        max: number;
        total: number;
        latest?: undefined;
    } | {
        count: any;
        avg: number;
        min: number;
        max: number;
        total: number;
        latest: any;
    };
    /**
     * Get cost summary
     */
    getCostSummary(): {
        totalCost: number;
        byProvider: {};
        byModel: {};
        totalTokens: number;
    };
    /**
     * Get system performance metrics
     */
    getSystemMetrics(): {
        memory: {
            rss: number;
            heapUsed: number;
            heapTotal: number;
            external: number;
        };
        uptime: number;
        sessionStart: number;
        activeTimers: number;
        metricsCount: any;
    };
    /**
     * Persist metric to file
     */
    persistMetric(metric: any): Promise<void>;
    /**
     * Export metrics for analysis
     */
    exportMetrics(format?: string): Promise<string | {
        session: {
            start: number;
            duration: number;
        };
        metrics: any;
        costs: any;
        stats: {};
        costSummary: {
            totalCost: number;
            byProvider: {};
            byModel: {};
            totalTokens: number;
        };
        system: {
            memory: {
                rss: number;
                heapUsed: number;
                heapTotal: number;
                external: number;
            };
            uptime: number;
            sessionStart: number;
            activeTimers: number;
            metricsCount: any;
        };
    }>;
    /**
     * Clear old metrics to prevent memory leaks
     */
    clearOldMetrics(maxAge?: number): void;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=performanceMonitor.d.ts.map