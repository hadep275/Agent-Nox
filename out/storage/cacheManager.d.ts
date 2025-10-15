export = CacheManager;
/**
 * Enterprise Cache Manager with multi-tier caching
 * Placeholder implementation for Phase 1
 */
declare class CacheManager {
    constructor(context: any, logger: any);
    context: any;
    logger: any;
    isInitialized: boolean;
    /**
     * Initialize cache manager
     */
    initialize(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=cacheManager.d.ts.map