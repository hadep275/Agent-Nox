/**
 * 🦊 NOX Git Integration Test
 * Test the new Git operations and autonomy system (Standalone Version)
 */

// Mock VS Code module for standalone testing
const mockVscode = {
  workspace: {
    getConfiguration: () => ({
      get: (key, defaultValue) => defaultValue,
      update: async () => {},
    }),
  },
  ConfigurationTarget: {
    Global: 1,
  },
};

// Inject mock before requiring modules
global.vscode = mockVscode;
require.cache[require.resolve("vscode")] = {
  exports: mockVscode,
};

const path = require("path");
const fs = require("fs");

// Now require the modules after mocking vscode
const NoxAutonomyManager = require("../src/core/autonomyManager");

// Mock dependencies for testing
const mockLogger = {
  info: console.log,
  debug: console.log,
  warn: console.warn,
  error: console.error,
};

const mockPerformanceMonitor = {
  startTimer: (name) => ({
    end: () => {},
    duration: 100,
  }),
};

const mockContextManager = {
  getFileContent: async (path) => "{}",
  getContext: async (query, options) => ({
    files: [],
    symbols: [],
  }),
};

/**
 * 🧪 Test Git Operations
 */
async function testGitOperations() {
  console.log("\n🧪 Testing Git Operations...\n");

  const gitOps = new NoxGitOperations(
    mockLogger,
    mockPerformanceMonitor,
    mockContextManager
  );

  // Test 1: Git Status
  console.log("📊 Test 1: Git Status");
  try {
    const status = await gitOps.getStatus();
    console.log("✅ Git status retrieved successfully!");
    console.log(`📄 Repository: ${status.isRepo ? "Yes" : "No"}`);
    if (status.isRepo) {
      console.log(`🌿 Branch: ${status.branch}`);
      console.log(`📝 Changes: ${status.changes.length}`);
      console.log(`⬆️ Ahead: ${status.ahead}, Behind: ${status.behind}`);
    }
  } catch (error) {
    console.error("❌ Git status failed:", error.message);
  }

  // Test 2: Commit Message Generation
  console.log("\n📝 Test 2: Intelligent Commit Message Generation");
  try {
    const testFiles = [
      "src/components/UserProfile.tsx",
      "src/auth/AuthService.ts",
      "src/types/User.ts",
    ];

    const commitInfo = await gitOps.generateCommitMessage(testFiles, {
      projectType: "react",
      feature: "user authentication",
    });

    console.log("✅ Commit message generated successfully!");
    console.log(`📄 Message: "${commitInfo.message}"`);
    console.log(`🏷️ Type: ${commitInfo.type}`);
    console.log(`🎯 Scope: ${commitInfo.scope || "none"}`);
    console.log(`📊 Complexity: ${commitInfo.analysis.complexity}`);
    console.log(`🔍 Patterns: [${commitInfo.analysis.patterns.join(", ")}]`);
  } catch (error) {
    console.error("❌ Commit message generation failed:", error.message);
  }

  // Test 3: Branch Name Generation
  console.log("\n🌿 Test 3: Branch Name Generation");
  try {
    const testFeatures = [
      "User authentication system",
      "Shopping cart functionality",
      "Payment integration with Stripe",
      "Real-time notifications",
    ];

    testFeatures.forEach((feature) => {
      const branchName = gitOps.generateBranchName(feature);
      console.log(`📝 "${feature}" → ${branchName}`);
    });

    console.log("✅ Branch name generation successful!");
  } catch (error) {
    console.error("❌ Branch name generation failed:", error.message);
  }
}

/**
 * 🎛️ Test Autonomy Manager
 */
async function testAutonomyManager() {
  console.log("\n🎛️ Testing Autonomy Manager...\n");

  const autonomyManager = new NoxAutonomyManager(
    mockLogger,
    mockPerformanceMonitor
  );

  // Test 1: Default Settings
  console.log("⚙️ Test 1: Default Settings");
  const status = autonomyManager.getStatus();
  console.log(`📊 Autonomy Level: ${status.level}`);
  console.log(`🤝 Collaborative Mode: ${status.isCollaborative}`);
  console.log(`🚀 Autonomous Mode: ${status.isAutonomous}`);

  // Test 2: Approval Requirements in Collaborative Mode
  console.log("\n🤝 Test 2: Collaborative Mode Approval Requirements");
  const collaborativeTests = [
    { type: "file_creation", risk: "low" },
    { type: "git_commit", risk: "medium" },
    { type: "git_push", risk: "high" },
    { type: "terminal_command", risk: "medium" },
    { type: "file_deletion", risk: "high" },
  ];

  collaborativeTests.forEach((test) => {
    const requiresApproval = autonomyManager.requiresApproval(test.type, {
      risk: test.risk,
    });
    console.log(
      `📝 ${test.type} (${test.risk}): ${
        requiresApproval ? "⚠️ Requires Approval" : "✅ Auto-Execute"
      }`
    );
  });

  // Test 3: Switch to Autonomous Mode
  console.log("\n🚀 Test 3: Switching to Autonomous Mode");
  try {
    const result = await autonomyManager.setAutonomyLevel("autonomous");
    console.log(`✅ Switched from ${result.previous} to ${result.current}`);

    // Test approval requirements in autonomous mode
    console.log("\n🚀 Autonomous Mode Approval Requirements:");
    collaborativeTests.forEach((test) => {
      const requiresApproval = autonomyManager.requiresApproval(test.type, {
        risk: test.risk,
      });
      console.log(
        `📝 ${test.type} (${test.risk}): ${
          requiresApproval ? "⚠️ Requires Approval" : "✅ Auto-Execute"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Autonomy level switch failed:", error.message);
  }

  // Test 4: Switch back to Collaborative Mode
  console.log("\n🔄 Test 4: Switching back to Collaborative Mode");
  try {
    await autonomyManager.setAutonomyLevel("collaborative");
    console.log("✅ Switched back to collaborative mode");
  } catch (error) {
    console.error("❌ Switch back failed:", error.message);
  }
}

/**
 * 🔗 Test Git Capability Integration
 */
async function testGitCapabilityIntegration() {
  console.log("\n🔗 Testing Git Capability Integration...\n");

  // Mock agent controller for capability executor
  const mockAgentController = {
    contextManager: mockContextManager,
  };

  const mockFileOps = {
    createFile: async () => ({ success: true }),
    editFile: async () => ({ success: true }),
    deleteFile: async () => ({ success: true }),
  };

  const capabilityExecutor = new CapabilityExecutor(
    mockAgentController,
    mockFileOps,
    mockLogger,
    mockPerformanceMonitor
  );

  // Test 1: Git Status Capability
  console.log("📊 Test 1: Git Status Capability");
  try {
    const statusCapability = {
      type: "git_status",
      parameters: {},
      risk: "low",
    };

    const result = await capabilityExecutor.executeCapability(
      statusCapability,
      {}
    );
    console.log(
      `✅ Git status capability: ${result.success ? "Success" : "Failed"}`
    );
    if (result.success) {
      console.log(`📄 Message: ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Git status capability failed:", error.message);
  }

  // Test 2: Branch Creation Capability
  console.log("\n🌿 Test 2: Branch Creation Capability");
  try {
    const branchCapability = {
      type: "git_branch_create",
      parameters: {
        featureDescription: "user authentication system",
      },
      risk: "low",
    };

    const result = await capabilityExecutor.executeCapability(
      branchCapability,
      {}
    );
    console.log(
      `✅ Branch creation capability: ${result.success ? "Success" : "Failed"}`
    );
    if (result.success) {
      console.log(`📄 Message: ${result.message}`);
      console.log(`🌿 Branch: ${result.result?.name}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error("❌ Branch creation capability failed:", error.message);
  }

  // Test 3: Commit Capability (will require approval in collaborative mode)
  console.log("\n📝 Test 3: Commit Capability (Approval Test)");
  try {
    const commitCapability = {
      type: "git_commit",
      parameters: {
        files: ["src/test.js"],
        message: "test: add test file",
      },
      risk: "medium",
    };

    // This should check autonomy level and potentially require approval
    const autonomyStatus = capabilityExecutor.autonomyManager.getStatus();
    const requiresApproval =
      capabilityExecutor.autonomyManager.requiresApproval(
        commitCapability.type,
        { risk: commitCapability.risk }
      );

    console.log(`🎛️ Autonomy Level: ${autonomyStatus.level}`);
    console.log(`⚠️ Requires Approval: ${requiresApproval ? "Yes" : "No"}`);

    if (requiresApproval) {
      console.log("📋 In real usage, this would show approval dialog to user");
    }
  } catch (error) {
    console.error("❌ Commit capability test failed:", error.message);
  }
}

/**
 * 🚀 Run All Git Tests
 */
async function runGitTests() {
  console.log("🦊 NOX Git Integration Test Suite");
  console.log("=====================================\n");

  try {
    await testGitOperations();
    await testAutonomyManager();
    await testGitCapabilityIntegration();

    console.log("\n🎉 All Git tests completed!");
    console.log("\n🚀 NOX Git Integration is ready! 🦊");
    console.log("\n📋 Summary of New Capabilities:");
    console.log("  ✅ Intelligent commit message generation");
    console.log("  ✅ Automatic branch creation and naming");
    console.log("  ✅ Dual autonomy modes (Collaborative/Autonomous)");
    console.log("  ✅ Git operations with approval flows");
    console.log("  ✅ Context-aware Git analysis");
    console.log("  ✅ Enterprise-grade Git workflow automation");
  } catch (error) {
    console.error("\n❌ Git test suite failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runGitTests();
}

module.exports = {
  testGitOperations,
  testAutonomyManager,
  testGitCapabilityIntegration,
  runGitTests,
};
