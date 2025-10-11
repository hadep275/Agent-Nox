const vscode = require('vscode');
// const path = require('path'); // Will be used in Phase 2

/**
 * Main Agent Controller - orchestrates all agent operations with enterprise-grade architecture
 */
class AgentController {
  constructor(context, logger, performanceMonitor) {
    this.context = context;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;

    // Core components (will be initialized)
    this.aiClient = null;
    this.contextManager = null;
    this.fileOps = null;
    this.indexEngine = null;
    this.cacheManager = null;

    // State management
    this.isInitialized = false;
    this.workspacePath = null;
    this.configuration = null;
  }

  /**
   * Initialize the agent controller and all core components
   */
  async initialize() {
    const timer = this.performanceMonitor.startTimer('agent_initialization');

    try {
      this.logger.info('Initializing Agent Controller...');

      // Load configuration
      await this.loadConfiguration();

      // Initialize workspace
      await this.initializeWorkspace();

      // Initialize core components
      await this.initializeCoreComponents();

      // Validate initialization
      await this.validateInitialization();

      this.isInitialized = true;
      timer.end();

      this.logger.info('Agent Controller initialized successfully');
      this.performanceMonitor.recordMetric('initialization_success', 1);
    } catch (error) {
      timer.end();
      this.logger.error('Failed to initialize Agent Controller:', error);
      this.performanceMonitor.recordMetric('initialization_failure', 1);
      throw error;
    }
  }

  /**
   * Load and validate configuration
   */
  async loadConfiguration() {
    try {
      this.configuration = vscode.workspace.getConfiguration('agent');

      // Validate required configuration
      const requiredSettings = ['aiProvider'];
      for (const setting of requiredSettings) {
        if (!this.configuration.has(setting)) {
          throw new Error(`Missing required configuration: ${setting}`);
        }
      }

      this.logger.debug('Configuration loaded', {
        provider: this.configuration.get('aiProvider'),
        caching: this.configuration.get('enableCaching'),
        telemetry: this.configuration.get('enableTelemetry'),
      });
    } catch (error) {
      throw new Error(`Configuration loading failed: ${error.message}`);
    }
  }

  /**
   * Initialize workspace context
   */
  async initializeWorkspace() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders && workspaceFolders.length > 0) {
        this.workspacePath = workspaceFolders[0].uri.fsPath;
        this.logger.info('Workspace detected', { path: this.workspacePath });
      } else {
        this.logger.warn(
          'No workspace folder detected - some features may be limited'
        );
      }
    } catch (error) {
      throw new Error(`Workspace initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize core components with dependency injection
   */
  async initializeCoreComponents() {
    try {
      // Import core modules (lazy loading for performance)
      const AIClient = require('./aiClient');
      const ContextManager = require('./contextManager');
      const FileOps = require('./fileOps');
      const IndexEngine = require('./indexEngine');
      const CacheManager = require('../storage/cacheManager');

      // Initialize in dependency order
      this.cacheManager = new CacheManager(this.context, this.logger);
      await this.cacheManager.initialize();

      this.aiClient = new AIClient(
        this.context,
        this.logger,
        this.performanceMonitor
      );
      await this.aiClient.initialize(this.configuration);

      this.fileOps = new FileOps(
        this.context,
        this.logger,
        this.performanceMonitor
      );
      await this.fileOps.initialize();

      this.contextManager = new ContextManager(
        this.context,
        this.logger,
        this.performanceMonitor,
        this.cacheManager
      );
      await this.contextManager.initialize();

      this.indexEngine = new IndexEngine(
        this.context,
        this.logger,
        this.performanceMonitor,
        this.contextManager
      );
      await this.indexEngine.initialize(this.workspacePath);

      this.logger.info('Core components initialized successfully');
    } catch (error) {
      throw new Error(
        `Core components initialization failed: ${error.message}`
      );
    }
  }

  /**
   * Validate that all components are properly initialized
   */
  async validateInitialization() {
    const components = [
      { name: 'aiClient', instance: this.aiClient },
      { name: 'contextManager', instance: this.contextManager },
      { name: 'fileOps', instance: this.fileOps },
      { name: 'indexEngine', instance: this.indexEngine },
      { name: 'cacheManager', instance: this.cacheManager },
    ];

    for (const component of components) {
      if (!component.instance || !component.instance.isInitialized) {
        throw new Error(
          `Component ${component.name} failed to initialize properly`
        );
      }
    }

    this.logger.debug('All components validated successfully');
  }

  /**
   * Handle workspace folder changes
   */
  async handleWorkspaceChange(_event) {
    try {
      this.logger.info('Handling workspace change...');

      // Reinitialize workspace
      await this.initializeWorkspace();

      // Reinitialize index engine with new workspace
      if (this.indexEngine) {
        await this.indexEngine.reinitialize(this.workspacePath);
      }

      this.logger.info('Workspace change handled successfully');
    } catch (error) {
      this.logger.error('Failed to handle workspace change:', error);
    }
  }

  /**
   * Handle file changes for intelligent indexing
   */
  async handleFileChange(document) {
    try {
      if (!this.indexEngine || !this.isInitialized) return;

      const filePath = document.uri.fsPath;
      this.logger.debug('File changed, updating index', { filePath });

      await this.indexEngine.updateFileIndex(filePath, document.getText());
    } catch (error) {
      this.logger.error('Failed to handle file change:', error);
    }
  }

  /**
   * Update configuration when settings change
   */
  async updateConfiguration() {
    try {
      this.logger.info('Updating configuration...');

      await this.loadConfiguration();

      // Update AI client configuration
      if (this.aiClient) {
        await this.aiClient.updateConfiguration(this.configuration);
      }

      this.logger.info('Configuration updated successfully');
    } catch (error) {
      this.logger.error('Failed to update configuration:', error);
    }
  }

  /**
   * Get agent status and health information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      workspace: this.workspacePath,
      components: {
        aiClient: (this.aiClient && this.aiClient.isInitialized) || false,
        contextManager:
          (this.contextManager && this.contextManager.isInitialized) || false,
        fileOps: (this.fileOps && this.fileOps.isInitialized) || false,
        indexEngine:
          (this.indexEngine && this.indexEngine.isInitialized) || false,
        cacheManager:
          (this.cacheManager && this.cacheManager.isInitialized) || false,
      },
      performance: this.performanceMonitor.getSystemMetrics(),
      costs: this.performanceMonitor.getCostSummary(),
    };
  }

  /**
   * Execute an agent task with full orchestration
   */
  async executeTask(taskType, parameters = {}) {
    if (!this.isInitialized) {
      throw new Error('Agent controller not initialized');
    }

    const timer = this.performanceMonitor.startTimer(`task_${taskType}`);

    try {
      this.logger.info(`Executing task: ${taskType}`, parameters);

      // Task execution logic will be implemented in Phase 2
      // For now, return a placeholder response
      const result = {
        taskType,
        parameters,
        status: 'completed',
        timestamp: Date.now(),
        message: `Task ${taskType} executed successfully (placeholder)`,
      };

      timer.end();
      this.performanceMonitor.recordMetric(`task_${taskType}_success`, 1);

      return result;
    } catch (error) {
      timer.end();
      this.performanceMonitor.recordMetric(`task_${taskType}_failure`, 1);
      this.logger.error(`Task ${taskType} failed:`, error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      this.logger.info('Cleaning up Agent Controller...');

      const cleanupPromises = [];

      if (this.indexEngine) {
        cleanupPromises.push(this.indexEngine.cleanup());
      }
      if (this.contextManager) {
        cleanupPromises.push(this.contextManager.cleanup());
      }
      if (this.aiClient) {
        cleanupPromises.push(this.aiClient.cleanup());
      }
      if (this.fileOps) {
        cleanupPromises.push(this.fileOps.cleanup());
      }
      if (this.cacheManager) {
        cleanupPromises.push(this.cacheManager.cleanup());
      }

      await Promise.all(cleanupPromises);

      this.isInitialized = false;
      this.logger.info('Agent Controller cleanup completed');
    } catch (error) {
      this.logger.error('Error during Agent Controller cleanup:', error);
    }
  }
}

module.exports = AgentController;
