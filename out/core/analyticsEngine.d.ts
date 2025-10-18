export = AnalyticsEngine;
/**
 * 📊 Analytics Engine for Nox Performance Dashboard
 * Calculates metrics, aggregates data, and provides filtering
 */
declare class AnalyticsEngine {
    constructor(logger: any);
    logger: any;
    /**
     * Get date range based on filter type
     */
    getDateRange(filterType: any, customStartDate?: null, customEndDate?: null): {
        startDate: Date;
        endDate: Date;
    };
    /**
     * Filter messages by date range
     */
    filterMessagesByDateRange(messages: any, startDate: any, endDate: any): any;
    /**
     * Calculate basic statistics
     */
    calculateStats(messages: any): {
        totalMessages: any;
        totalTokens: number;
        totalCost: number;
        averageTokensPerMessage: number;
        averageCostPerMessage: number;
        costPerToken: number;
    };
    /**
     * Calculate cost breakdown by provider
     */
    calculateProviderBreakdown(messages: any): any[];
    /**
     * Calculate daily breakdown
     */
    calculateDailyBreakdown(messages: any): any[];
    /**
     * Get comprehensive analytics report
     */
    getAnalyticsReport(messages: any, filterType?: string, customDates?: null): {
        dateRange: {
            startDate: Date;
            endDate: Date;
            filterType: string;
        };
        stats: {
            totalMessages: any;
            totalTokens: number;
            totalCost: number;
            averageTokensPerMessage: number;
            averageCostPerMessage: number;
            costPerToken: number;
        };
        providerBreakdown: any[];
        dailyBreakdown: any[];
        messageCount: any;
    };
}
//# sourceMappingURL=analyticsEngine.d.ts.map