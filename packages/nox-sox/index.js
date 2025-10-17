/**
 * nox-sox - SoX binaries for all platforms
 * Enterprise-grade audio recording for Nox VS Code extension
 *
 * Provides platform-specific SoX binaries following the vscode-ripgrep pattern
 */

const path = require("path");
const fs = require("fs");

/**
 * Get the platform-specific SoX binary path
 * Similar to how vscode-ripgrep exports rgPath
 */
function getSoxPath() {
  const platform = process.platform;
  const arch = process.arch;

  // Map Node.js platform/arch to our package naming convention
  const platformMap = {
    win32: {
      x64: "win32-x64",
      arm64: "win32-arm64",
    },
    darwin: {
      x64: "darwin-x64",
      arm64: "darwin-arm64",
    },
    linux: {
      x64: "linux-x64",
      arm64: "linux-arm64",
      arm: "linux-armhf",
    },
  };

  // Special handling for Alpine Linux (common in Docker containers)
  const isAlpine = fs.existsSync("/etc/alpine-release");
  if (platform === "linux" && isAlpine) {
    const alpinePlatform = arch === "arm64" ? "alpine-arm64" : "alpine-x64";
    const alpineBinaryPath = path.join(__dirname, "bin", alpinePlatform, "sox");
    if (fs.existsSync(alpineBinaryPath)) {
      return alpineBinaryPath;
    }
  }

  // Get the platform-specific identifier
  const platformArch = platformMap[platform] && platformMap[platform][arch];
  if (!platformArch) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  // Construct the binary path
  const binaryName = platform === "win32" ? "sox.exe" : "sox";
  const binaryPath = path.join(__dirname, "bin", platformArch, binaryName);

  // Verify the binary exists and is not a placeholder
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `SoX binary not found for ${platform}-${arch} at ${binaryPath}`
    );
  }

  // Check if it's a placeholder file (fallback to system SoX)
  try {
    const fileContent = fs.readFileSync(binaryPath, "utf8");
    if (fileContent.includes("# Placeholder")) {
      throw new Error(
        `SoX binary is a placeholder for ${platform}-${arch}, will use system SoX`
      );
    }
  } catch (readError) {
    // If we can't read it, assume it's a binary file (which is good)
  }

  return binaryPath;
}

/**
 * Get SoX version information
 */
function getSoxVersion() {
  return "14.4.2";
}

/**
 * Check if SoX is available for the current platform
 */
function isSoxAvailable() {
  try {
    getSoxPath();
    return true;
  } catch (error) {
    return false;
  }
}

// Export the main API (following vscode-ripgrep pattern)
module.exports = {
  soxPath: getSoxPath(),
  getSoxPath,
  getSoxVersion,
  isSoxAvailable,
};

// For backward compatibility, also export soxPath directly
module.exports.soxPath = module.exports.getSoxPath();
