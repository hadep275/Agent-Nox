/**
 * 📊 Analytics Engine for Nox Performance Dashboard
 * Calculates metrics, aggregates data, and provides filtering
 */

class AnalyticsEngine {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Get date range based on filter type
   */
  getDateRange(filterType, customStartDate = null, customEndDate = null) {
    const now = new Date();
    let startDate;

    switch (filterType) {
      case 'lifetime':
        startDate = new Date(0); // Beginning of time
        break;
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last365days':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        now.setTime(new Date(customEndDate).getTime());
        break;
      default:
        startDate = new Date(0);
    }

    return { startDate, endDate: now };
  }

  /**
   * Filter messages by date range
   */
  filterMessagesByDateRange(messages, startDate, endDate) {
    return messages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= startDate && msgDate <= endDate;
    });
  }

  /**
   * Calculate basic statistics
   */
  calculateStats(messages) {
    const stats = {
      totalMessages: messages.length,
      totalTokens: 0,
      totalCost: 0,
      averageTokensPerMessage: 0,
      averageCostPerMessage: 0,
      costPerToken: 0,
    };

    messages.forEach(msg => {
      if (msg.type === 'assistant') {
        stats.totalTokens += msg.tokens || 0;
        stats.totalCost += msg.cost || 0;
      }
    });

    if (messages.length > 0) {
      stats.averageTokensPerMessage = (stats.totalTokens / messages.length).toFixed(2);
      stats.averageCostPerMessage = (stats.totalCost / messages.length).toFixed(4);
    }

    if (stats.totalTokens > 0) {
      stats.costPerToken = (stats.totalCost / stats.totalTokens).toFixed(8);
    }

    return stats;
  }

  /**
   * Calculate cost breakdown by provider
   */
  calculateProviderBreakdown(messages) {
    const breakdown = {};

    messages.forEach(msg => {
      if (msg.type === 'assistant' && msg.provider) {
        if (!breakdown[msg.provider]) {
          breakdown[msg.provider] = {
            provider: msg.provider,
            totalCost: 0,
            totalTokens: 0,
            messageCount: 0,
            models: new Set(),
          };
        }
        breakdown[msg.provider].totalCost += msg.cost || 0;
        breakdown[msg.provider].totalTokens += msg.tokens || 0;
        breakdown[msg.provider].messageCount += 1;
        if (msg.model) {
          breakdown[msg.provider].models.add(msg.model);
        }
      }
    });

    // Convert to array and calculate percentages
    const total = Object.values(breakdown).reduce((sum, p) => sum + p.totalCost, 0);
    return Object.values(breakdown).map(provider => ({
      ...provider,
      models: Array.from(provider.models),
      percentage: total > 0 ? ((provider.totalCost / total) * 100).toFixed(2) : 0,
      averageCostPerMessage: (provider.totalCost / provider.messageCount).toFixed(4),
      costPerToken: provider.totalTokens > 0 
        ? (provider.totalCost / provider.totalTokens).toFixed(8)
        : 0,
    }));
  }

  /**
   * Calculate daily breakdown
   */
  calculateDailyBreakdown(messages) {
    const daily = {};

    messages.forEach(msg => {
      if (msg.type === 'assistant') {
        const date = new Date(msg.timestamp).toISOString().split('T')[0];
        if (!daily[date]) {
          daily[date] = {
            date,
            messageCount: 0,
            totalCost: 0,
            totalTokens: 0,
          };
        }
        daily[date].messageCount += 1;
        daily[date].totalCost += msg.cost || 0;
        daily[date].totalTokens += msg.tokens || 0;
      }
    });

    return Object.values(daily).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(messages, filterType = 'lifetime', customDates = null) {
    const { startDate, endDate } = this.getDateRange(filterType, customDates?.start, customDates?.end);
    const filteredMessages = this.filterMessagesByDateRange(messages, startDate, endDate);

    return {
      dateRange: { startDate, endDate, filterType },
      stats: this.calculateStats(filteredMessages),
      providerBreakdown: this.calculateProviderBreakdown(filteredMessages),
      dailyBreakdown: this.calculateDailyBreakdown(filteredMessages),
      messageCount: filteredMessages.length,
    };
  }
}

module.exports = AnalyticsEngine;

