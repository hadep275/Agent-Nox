const vscode = require("vscode");

/**
 * 🦊 NOX Capabilities Registry - Defines what NOX can do and approval requirements
 * Provides comprehensive capability awareness for AI consciousness
 */
class NoxCapabilities {
  constructor(logger, performanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.capabilities = this.initializeCapabilities();
  }

  /**
   * 🛠️ Initialize comprehensive NOX capabilities
   */
  initializeCapabilities() {
    return {
      fileOperations: {
        enabled: true,
        capabilities: {
          create: {
            enabled: true,
            requiresApproval: false,
            description: "Create new files and directories"
          },
          edit: {
            enabled: true,
            requiresApproval: false,
            description: "Edit existing files with atomic operations"
          },
          delete: {
            enabled: true,
            requiresApproval: true,
            description: "Delete files and directories"
          },
          move: {
            enabled: true,
            requiresApproval: true,
            description: "Move or rename files and directories"
          },
          copy: {
            enabled: true,
            requiresApproval: false,
            description: "Copy files and directories"
          },
          batchOperations: {
            enabled: true,
            requiresApproval: true,
            description: "Perform multiple file operations atomically"
          }
        }
      },

      terminalOperations: {
        enabled: true,
        capabilities: {
          execute: {
            enabled: true,
            requiresApproval: true,
            description: "Execute terminal commands"
          },
          packageManagement: {
            enabled: true,
            requiresApproval: true,
            allowedCommands: ["npm", "yarn", "pip", "cargo", "go", "composer"],
            description: "Install, update, or remove packages"
          },
          buildCommands: {
            enabled: true,
            requiresApproval: true,
            allowedCommands: ["npm run", "yarn", "make", "cargo build", "go build"],
            description: "Execute build and compilation commands"
          },
          testCommands: {
            enabled: true,
            requiresApproval: false,
            allowedCommands: ["npm test", "yarn test", "pytest", "cargo test"],
            description: "Run test suites and individual tests"
          }
        },
        restrictedCommands: [
          "rm -rf", "sudo", "format", "fdisk", "dd", "chmod 777", 
          "chown", "passwd", "su", "shutdown", "reboot"
        ]
      },

      gitOperations: {
        enabled: true,
        capabilities: {
          status: {
            enabled: true,
            requiresApproval: false,
            description: "Check git status and repository information"
          },
          add: {
            enabled: true,
            requiresApproval: false,
            description: "Stage files for commit"
          },
          commit: {
            enabled: true,
            requiresApproval: true,
            description: "Create commits with messages"
          },
          branch: {
            enabled: true,
            requiresApproval: true,
            description: "Create, switch, or delete branches"
          },
          push: {
            enabled: true,
            requiresApproval: true,
            description: "Push commits to remote repository"
          },
          pull: {
            enabled: true,
            requiresApproval: true,
            description: "Pull changes from remote repository"
          },
          merge: {
            enabled: true,
            requiresApproval: true,
            description: "Merge branches"
          },
          rebase: {
            enabled: true,
            requiresApproval: true,
            description: "Rebase branches"
          }
        }
      },

      codeAnalysis: {
        enabled: true,
        capabilities: {
          fullCodebaseAnalysis: {
            enabled: true,
            requiresApproval: false,
            description: "Analyze entire codebase for patterns, issues, and insights"
          },
          dependencyAnalysis: {
            enabled: true,
            requiresApproval: false,
            description: "Map dependencies and analyze impact"
          },
          securityScanning: {
            enabled: true,
            requiresApproval: false,
            description: "Scan for security vulnerabilities"
          },
          performanceAnalysis: {
            enabled: true,
            requiresApproval: false,
            description: "Identify performance bottlenecks"
          },
          codeQualityAssessment: {
            enabled: true,
            requiresApproval: false,
            description: "Assess code quality and suggest improvements"
          },
          architectureAnalysis: {
            enabled: true,
            requiresApproval: false,
            description: "Analyze and suggest architectural improvements"
          }
        }
      },

      codeGeneration: {
        enabled: true,
        capabilities: {
          singleFile: {
            enabled: true,
            requiresApproval: false,
            description: "Generate individual files with complete implementations"
          },
          multiFile: {
            enabled: true,
            requiresApproval: true,
            description: "Generate multiple related files and project structures"
          },
          projectScaffolding: {
            enabled: true,
            requiresApproval: true,
            description: "Create complete project templates and boilerplates"
          },
          testGeneration: {
            enabled: true,
            requiresApproval: false,
            description: "Generate comprehensive test suites"
          },
          documentationGeneration: {
            enabled: true,
            requiresApproval: false,
            description: "Generate documentation, README files, and API docs"
          },
          configurationGeneration: {
            enabled: true,
            requiresApproval: true,
            description: "Generate configuration files (Docker, CI/CD, etc.)"
          }
        }
      },

      webResearch: {
        enabled: true,
        capabilities: {
          documentationLookup: {
            enabled: true,
            requiresApproval: false,
            description: "Search and retrieve documentation"
          },
          packageRecommendations: {
            enabled: true,
            requiresApproval: false,
            description: "Recommend packages with security analysis"
          },
          stackOverflowIntegration: {
            enabled: true,
            requiresApproval: false,
            description: "Search Stack Overflow for solutions"
          },
          technologyTrends: {
            enabled: true,
            requiresApproval: false,
            description: "Analyze technology trends and best practices"
          },
          securityAdvisories: {
            enabled: true,
            requiresApproval: false,
            description: "Check for security advisories and CVEs"
          }
        }
      },

      workspaceOperations: {
        enabled: true,
        capabilities: {
          fileNavigation: {
            enabled: true,
            requiresApproval: false,
            description: "Navigate and explore workspace files"
          },
          symbolSearch: {
            enabled: true,
            requiresApproval: false,
            description: "Search for symbols, functions, and classes"
          },
          contextGathering: {
            enabled: true,
            requiresApproval: false,
            description: "Gather relevant context for tasks"
          },
          projectStructureAnalysis: {
            enabled: true,
            requiresApproval: false,
            description: "Analyze and understand project structure"
          }
        }
      }
    };
  }

  /**
   * 🔍 Get capabilities for specific category
   */
  getCapabilities(category = null) {
    if (category) {
      return this.capabilities[category] || null;
    }
    return this.capabilities;
  }

  /**
   * ✅ Check if capability is enabled
   */
  isCapabilityEnabled(category, capability) {
    const categoryCapabilities = this.capabilities[category];
    if (!categoryCapabilities || !categoryCapabilities.enabled) {
      return false;
    }

    const specificCapability = categoryCapabilities.capabilities[capability];
    return specificCapability && specificCapability.enabled;
  }

  /**
   * 🔒 Check if capability requires approval
   */
  requiresApproval(category, capability) {
    const categoryCapabilities = this.capabilities[category];
    if (!categoryCapabilities) {
      return true; // Default to requiring approval for unknown capabilities
    }

    const specificCapability = categoryCapabilities.capabilities[capability];
    return specificCapability ? specificCapability.requiresApproval : true;
  }

  /**
   * 🚫 Check if command is restricted
   */
  isCommandRestricted(command) {
    const terminalOps = this.capabilities.terminalOperations;
    if (!terminalOps || !terminalOps.restrictedCommands) {
      return false;
    }

    return terminalOps.restrictedCommands.some(restricted => 
      command.toLowerCase().includes(restricted.toLowerCase())
    );
  }

  /**
   * ✅ Check if command is allowed for category
   */
  isCommandAllowed(category, capability, command) {
    const categoryCapabilities = this.capabilities[category];
    if (!categoryCapabilities) {
      return false;
    }

    const specificCapability = categoryCapabilities.capabilities[capability];
    if (!specificCapability || !specificCapability.allowedCommands) {
      return true; // If no specific restrictions, allow
    }

    return specificCapability.allowedCommands.some(allowed => 
      command.toLowerCase().startsWith(allowed.toLowerCase())
    );
  }

  /**
   * 📋 Get capability summary for AI prompt
   */
  getCapabilitySummary() {
    const summary = [];
    
    for (const [category, categoryData] of Object.entries(this.capabilities)) {
      if (!categoryData.enabled) continue;

      summary.push(`\n### ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
      
      for (const [capability, capabilityData] of Object.entries(categoryData.capabilities)) {
        if (!capabilityData.enabled) continue;

        const approvalText = capabilityData.requiresApproval ? " (requires approval)" : "";
        summary.push(`- ✅ ${capabilityData.description}${approvalText}`);
      }
    }

    return summary.join('\n');
  }

  /**
   * 🔧 Get capabilities for specific task type
   */
  getTaskCapabilities(taskType) {
    const taskCapabilityMap = {
      explain: ['codeAnalysis', 'workspaceOperations', 'webResearch'],
      refactor: ['codeAnalysis', 'fileOperations', 'codeGeneration'],
      analyze: ['codeAnalysis', 'workspaceOperations', 'webResearch'],
      generate: ['codeGeneration', 'fileOperations', 'webResearch'],
      chat: ['codeAnalysis', 'workspaceOperations', 'webResearch', 'fileOperations'],
      terminal: ['terminalOperations', 'gitOperations'],
      git: ['gitOperations', 'fileOperations']
    };

    const relevantCategories = taskCapabilityMap[taskType] || Object.keys(this.capabilities);
    const taskCapabilities = {};

    for (const category of relevantCategories) {
      if (this.capabilities[category] && this.capabilities[category].enabled) {
        taskCapabilities[category] = this.capabilities[category];
      }
    }

    return taskCapabilities;
  }

  /**
   * 📊 Get capability statistics
   */
  getCapabilityStats() {
    let totalCapabilities = 0;
    let enabledCapabilities = 0;
    let approvalRequiredCapabilities = 0;

    for (const [category, categoryData] of Object.entries(this.capabilities)) {
      if (!categoryData.enabled) continue;

      for (const [capability, capabilityData] of Object.entries(categoryData.capabilities)) {
        totalCapabilities++;
        if (capabilityData.enabled) {
          enabledCapabilities++;
          if (capabilityData.requiresApproval) {
            approvalRequiredCapabilities++;
          }
        }
      }
    }

    return {
      total: totalCapabilities,
      enabled: enabledCapabilities,
      disabled: totalCapabilities - enabledCapabilities,
      requiresApproval: approvalRequiredCapabilities,
      categories: Object.keys(this.capabilities).length
    };
  }

  /**
   * 🔄 Update capability status
   */
  updateCapability(category, capability, updates) {
    if (!this.capabilities[category] || !this.capabilities[category].capabilities[capability]) {
      throw new Error(`Capability ${category}.${capability} not found`);
    }

    Object.assign(this.capabilities[category].capabilities[capability], updates);
    this.logger.info(`🔄 Updated capability: ${category}.${capability}`, updates);
  }

  /**
   * 🔒 Disable capability
   */
  disableCapability(category, capability) {
    this.updateCapability(category, capability, { enabled: false });
  }

  /**
   * ✅ Enable capability
   */
  enableCapability(category, capability) {
    this.updateCapability(category, capability, { enabled: true });
  }
}

module.exports = NoxCapabilities;
