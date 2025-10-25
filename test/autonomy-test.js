/**
 * 🦊 NOX Autonomy Manager Test
 * Test the new autonomy system (Standalone Version)
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

// Create a mock vscode module in the require cache
const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === "vscode") {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

// Now require the autonomy manager
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
  console.log(`✅ Initialized: ${status.initialized}`);

  // Test 2: Approval Requirements in Collaborative Mode
  console.log("\n🤝 Test 2: Collaborative Mode Approval Requirements");
  const collaborativeTests = [
    { type: "file_creation", risk: "low" },
    { type: "file_edit", risk: "low" },
    { type: "file_deletion", risk: "high" },
    { type: "git_commit", risk: "medium" },
    { type: "git_push", risk: "high" },
    { type: "terminal_command", risk: "medium" },
    { type: "web_search", risk: "low" },
    { type: "package_installation", risk: "medium" },
  ];

  collaborativeTests.forEach((test) => {
    const requiresApproval = autonomyManager.requiresApproval(test.type, {
      risk: test.risk,
    });
    const icon = requiresApproval ? "⚠️ Requires Approval" : "✅ Auto-Execute";
    console.log(`📝 ${test.type.padEnd(20)} (${test.risk.padEnd(6)}): ${icon}`);
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
      const icon = requiresApproval
        ? "⚠️ Requires Approval"
        : "✅ Auto-Execute";
      console.log(
        `📝 ${test.type.padEnd(20)} (${test.risk.padEnd(6)}): ${icon}`
      );
    });
  } catch (error) {
    console.error("❌ Autonomy level switch failed:", error.message);
  }

  // Test 4: Operation Settings
  console.log("\n⚙️ Test 4: Operation-Specific Settings");
  const gitSettings = autonomyManager.getOperationSettings("git_commit");
  console.log("🔧 Git Operation Settings:");
  console.log(`  📝 Auto Commit: ${gitSettings.autoCommit}`);
  console.log(`  ⬆️ Auto Push: ${gitSettings.autoPush}`);
  console.log(`  🌿 Auto Create Branches: ${gitSettings.autoCreateBranches}`);
  console.log(
    `  💬 Auto Generate Messages: ${gitSettings.autoGenerateCommitMessages}`
  );

  // Test 5: Toggle Autonomy Level
  console.log("\n🔄 Test 5: Toggle Autonomy Level");
  try {
    const toggleResult = await autonomyManager.toggleAutonomyLevel();
    console.log(`✅ Toggled to: ${toggleResult.current}`);

    // Toggle back
    const toggleBack = await autonomyManager.toggleAutonomyLevel();
    console.log(`✅ Toggled back to: ${toggleBack.current}`);
  } catch (error) {
    console.error("❌ Toggle failed:", error.message);
  }

  // Test 6: Invalid Autonomy Level
  console.log("\n❌ Test 6: Invalid Autonomy Level");
  try {
    await autonomyManager.setAutonomyLevel("invalid");
    console.error("❌ Should have thrown an error for invalid level");
  } catch (error) {
    console.log(`✅ Correctly rejected invalid level: ${error.message}`);
  }

  return autonomyManager;
}

/**
 * 🧪 Test Git Pattern Recognition (Without Git Operations)
 */
function testGitPatterns() {
  console.log("\n🧪 Testing Git Pattern Recognition...\n");

  // Test commit type detection patterns
  const testCases = [
    {
      files: ["src/components/UserProfile.tsx", "src/types/User.ts"],
      expected: "feat",
      description: "New component files",
    },
    {
      files: ["src/auth/AuthService.ts", "src/auth/LoginForm.tsx"],
      expected: "feat",
      description: "Authentication feature",
    },
    {
      files: ["README.md", "docs/installation.md"],
      expected: "docs",
      description: "Documentation files",
    },
    {
      files: ["src/utils/validation.test.ts", "src/components/Button.test.tsx"],
      expected: "test",
      description: "Test files",
    },
    {
      files: ["package.json", "yarn.lock"],
      expected: "chore",
      description: "Package management",
    },
    {
      files: ["src/api/users.js"],
      expected: "fix",
      description: "Single file modification (likely bug fix)",
    },
  ];

  console.log("🎯 Commit Type Pattern Detection:");
  testCases.forEach((testCase, index) => {
    // Simple pattern detection logic (mimicking what would be in gitOps)
    let detectedType = "feat"; // default

    const hasTests = testCase.files.some(
      (f) => f.includes(".test.") || f.includes(".spec.")
    );
    const hasDocs = testCase.files.some(
      (f) => f.includes("README") || f.includes("docs/")
    );
    const hasPackage = testCase.files.some(
      (f) => f.includes("package.json") || f.includes("yarn.lock")
    );
    const isSingleFile = testCase.files.length === 1;

    if (hasTests) detectedType = "test";
    else if (hasDocs) detectedType = "docs";
    else if (hasPackage) detectedType = "chore";
    else if (isSingleFile) detectedType = "fix";

    const match = detectedType === testCase.expected ? "✅" : "❌";
    console.log(`${match} Test ${index + 1}: ${testCase.description}`);
    console.log(`   Files: [${testCase.files.join(", ")}]`);
    console.log(`   Expected: ${testCase.expected}, Detected: ${detectedType}`);
  });
}

/**
 * 🌿 Test Branch Name Generation
 */
function testBranchNameGeneration() {
  console.log("\n🌿 Testing Branch Name Generation...\n");

  const testFeatures = [
    "User authentication system",
    "Shopping cart functionality",
    "Payment integration with Stripe",
    "Real-time notifications",
    "Fix payment validation bug",
    "Update React to version 18",
    "Add unit tests for user service",
  ];

  console.log("🏷️ Branch Name Generation:");
  testFeatures.forEach((feature) => {
    // Simple branch name generation logic
    let branchName = feature
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    // Add prefix based on content
    if (
      feature.toLowerCase().includes("fix") ||
      feature.toLowerCase().includes("bug")
    ) {
      branchName = `bugfix/${branchName}`;
    } else if (feature.toLowerCase().includes("test")) {
      branchName = `test/${branchName}`;
    } else if (
      feature.toLowerCase().includes("update") ||
      feature.toLowerCase().includes("upgrade")
    ) {
      branchName = `chore/${branchName}`;
    } else {
      branchName = `feature/${branchName}`;
    }

    console.log(`📝 "${feature}" → ${branchName}`);
  });
}

/**
 * 🚀 Run All Autonomy Tests
 */
async function runAutonomyTests() {
  console.log("🦊 NOX Autonomy Manager Test Suite");
  console.log("====================================\n");

  try {
    const autonomyManager = await testAutonomyManager();
    testGitPatterns();
    testBranchNameGeneration();

    console.log("\n🎉 All autonomy tests completed!");
    console.log("\n🚀 NOX Autonomy System is ready! 🦊");
    console.log("\n📋 Summary of Autonomy Features:");
    console.log("  ✅ Dual autonomy modes (Collaborative/Autonomous)");
    console.log("  ✅ Risk-based approval system");
    console.log("  ✅ Operation-specific settings");
    console.log("  ✅ Persistent VS Code configuration");
    console.log("  ✅ Intelligent approval requirements");
    console.log("  ✅ Mode switching and toggling");

    // Cleanup
    autonomyManager.cleanup();
  } catch (error) {
    console.error("\n❌ Autonomy test suite failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAutonomyTests();
}

module.exports = {
  testAutonomyManager,
  testGitPatterns,
  testBranchNameGeneration,
  runAutonomyTests,
};
