// const vscode = require('vscode'); // Will be used in Phase 2
const fs = require('fs').promises;
const path = require('path');

/**
 * Enterprise performance monitoring with real-time metrics, cost tracking, and analytics
 */
class PerformanceMonitor {
  constructor(context, logger) {
    this.context = context;
    this.logger = logger;
    this.metrics = new Map();
    this.timers = new Map();
    this.costs = new Map();
    this.sessionStart = Date.now();
    this.metricsFile = null;
    this.initializeMetricsStorage();
  }

  /**
   * Initialize metrics storage
   */
  async initializeMetricsStorage() {
    try {
      const metricsDir = path.join(
        this.context.globalStorageUri.fsPath,
        'metrics'
      );
      await fs.mkdir(metricsDir, { recursive: true });

      const timestamp = new Date().toISOString().split('T')[0];
      this.metricsFile = path.join(metricsDir, `metrics_${timestamp}.json`);

      this.logger.debug('Performance monitor initialized', {
        metricsFile: this.metricsFile,
      });
    } catch (error) {
      this.logger.error('Failed to initialize metrics storage:', error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      sessionTime: timestamp - this.sessionStart,
      ...metadata,
    };

    // Store in memory
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metric);

    // Log for debugging
    this.logger.logPerformance(name, value, metadata);

    // Persist to file
    this.persistMetric(metric);

    return metric;
  }

  /**
   * Start a performance timer
   */
  startTimer(name, metadata = {}) {
    const timer = {
      name,
      startTime: Date.now(),
      metadata,
    };

    this.timers.set(name, timer);
    this.logger.debug(`Timer started: ${name}`, metadata);

    return {
      end: () => this.endTimer(name),
    };
  }

  /**
   * End a performance timer and record the metric
   */
  endTimer(name) {
    const timer = this.timers.get(name);
    if (!timer) {
      this.logger.warn(`Timer not found: ${name}`);
      return null;
    }

    const duration = Date.now() - timer.startTime;
    this.timers.delete(name);

    const metric = this.recordMetric(`${name}_duration`, duration, {
      ...timer.metadata,
      type: 'timer',
    });

    this.logger.debug(`Timer ended: ${name}`, { duration });
    return metric;
  }

  /**
   * Record API cost for tracking
   */
  recordCost(provider, model, tokens, cost, metadata = {}) {
    const costEntry = {
      provider,
      model,
      tokens,
      cost,
      timestamp: Date.now(),
      ...metadata,
    };

    const key = `${provider}_${model}`;
    if (!this.costs.has(key)) {
      this.costs.set(key, []);
    }
    this.costs.get(key).push(costEntry);

    this.recordMetric('api_cost', cost, {
      provider,
      model,
      tokens,
      type: 'cost',
    });

    this.logger.debug('API cost recorded', costEntry);
    return costEntry;
  }

  /**
   * Get performance statistics
   */
  getStats(metricName = null) {
    if (metricName) {
      const metrics = this.metrics.get(metricName) || [];
      return this.calculateStats(metrics);
    }

    const allStats = {};
    for (const [name, metrics] of this.metrics.entries()) {
      allStats[name] = this.calculateStats(metrics);
    }
    return allStats;
  }

  /**
   * Calculate statistics for a set of metrics
   */
  calculateStats(metrics) {
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
    }

    const values = metrics.map((m) => m.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: metrics.length,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      total: Math.round(total * 100) / 100,
      latest: metrics[metrics.length - 1],
    };
  }

  /**
   * Get cost summary
   */
  getCostSummary() {
    const summary = {
      totalCost: 0,
      byProvider: {},
      byModel: {},
      totalTokens: 0,
    };

    for (const [key, costs] of this.costs.entries()) {
      const [provider, model] = key.split('_');

      for (const cost of costs) {
        summary.totalCost += cost.cost;
        summary.totalTokens += cost.tokens;

        if (!summary.byProvider[provider]) {
          summary.byProvider[provider] = { cost: 0, tokens: 0, calls: 0 };
        }
        summary.byProvider[provider].cost += cost.cost;
        summary.byProvider[provider].tokens += cost.tokens;
        summary.byProvider[provider].calls += 1;

        if (!summary.byModel[model]) {
          summary.byModel[model] = { cost: 0, tokens: 0, calls: 0 };
        }
        summary.byModel[model].cost += cost.cost;
        summary.byModel[model].tokens += cost.tokens;
        summary.byModel[model].calls += 1;
      }
    }

    // Round costs to 4 decimal places
    summary.totalCost = Math.round(summary.totalCost * 10000) / 10000;
    for (const provider in summary.byProvider) {
      summary.byProvider[provider].cost =
        Math.round(summary.byProvider[provider].cost * 10000) / 10000;
    }
    for (const model in summary.byModel) {
      summary.byModel[model].cost =
        Math.round(summary.byModel[model].cost * 10000) / 10000;
    }

    return summary;
  }

  /**
   * Get system performance metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.sessionStart;

    return {
      memory: {
        rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100, // MB
        heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
        heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
        external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100, // MB
      },
      uptime: uptime,
      sessionStart: this.sessionStart,
      activeTimers: this.timers.size,
      metricsCount: Array.from(this.metrics.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    };
  }

  /**
   * Persist metric to file
   */
  async persistMetric(metric) {
    if (!this.metricsFile) return;

    try {
      const data = JSON.stringify(metric) + '\n';
      await fs.appendFile(this.metricsFile, data);
    } catch (error) {
      this.logger.error('Failed to persist metric:', error);
    }
  }

  /**
   * Export metrics for analysis
   */
  async exportMetrics(format = 'json') {
    const data = {
      session: {
        start: this.sessionStart,
        duration: Date.now() - this.sessionStart,
      },
      metrics: Object.fromEntries(this.metrics),
      costs: Object.fromEntries(this.costs),
      stats: this.getStats(),
      costSummary: this.getCostSummary(),
      system: this.getSystemMetrics(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // TODO: Add CSV, XML formats if needed
    return data;
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(maxAge = 24 * 60 * 60 * 1000) {
    // 24 hours default
    const cutoff = Date.now() - maxAge;
    let cleared = 0;

    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter((m) => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
      cleared += metrics.length - filtered.length;
    }

    for (const [key, costs] of this.costs.entries()) {
      const filtered = costs.filter((c) => c.timestamp > cutoff);
      this.costs.set(key, filtered);
      cleared += costs.length - filtered.length;
    }

    if (cleared > 0) {
      this.logger.debug(`Cleared ${cleared} old metrics`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      // Clear any active timers
      this.timers.clear();

      // Export final metrics
      const finalMetrics = await this.exportMetrics();
      this.logger.debug('Final metrics exported', {
        metricsSize: finalMetrics.length,
      });
    } catch (error) {
      this.logger.error('Error during performance monitor cleanup:', error);
    }
  }
}

module.exports = PerformanceMonitor;
