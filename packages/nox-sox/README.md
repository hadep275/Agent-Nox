# nox-sox

SoX (Sound eXchange) binaries for all platforms - Enterprise-grade audio recording for Nox VS Code extension.

## Overview

This package provides platform-specific SoX binaries that enable audio recording functionality in the Nox VS Code extension without requiring users to manually install SoX on their systems.

## Features

- ✅ **Zero Configuration**: Works immediately after npm install
- ✅ **All Platforms**: Windows (x64, ARM64), macOS (x64, ARM64), Linux (x64, ARM64, ARMhf), Alpine Linux
- ✅ **Enterprise Ready**: No external dependencies or manual installation required
- ✅ **Secure**: Binaries downloaded from official SoX SourceForge releases
- ✅ **Lightweight**: Only downloads binaries for the current platform

## Usage

```javascript
const { soxPath } = require('nox-sox');

// Use soxPath with node-record-lpcm16 or spawn processes
console.log('SoX binary location:', soxPath);

// Check if SoX is available
const { isSoxAvailable } = require('nox-sox');
if (isSoxAvailable()) {
  console.log('SoX is ready to use!');
}
```

## API

### `soxPath`
- **Type**: `string`
- **Description**: Absolute path to the platform-specific SoX binary

### `getSoxPath()`
- **Returns**: `string`
- **Description**: Get the absolute path to the SoX binary for the current platform

### `getSoxVersion()`
- **Returns**: `string`
- **Description**: Get the SoX version (currently "14.4.2")

### `isSoxAvailable()`
- **Returns**: `boolean`
- **Description**: Check if SoX binary is available for the current platform

## Supported Platforms

| Platform | Architecture | Status |
|----------|-------------|---------|
| Windows | x64 | ✅ Supported |
| Windows | ARM64 | ✅ Supported |
| macOS | x64 (Intel) | ✅ Supported |
| macOS | ARM64 (Apple Silicon) | ✅ Supported |
| Linux | x64 | ✅ Supported |
| Linux | ARM64 | ✅ Supported |
| Linux | ARMhf | ✅ Supported |
| Alpine Linux | x64 | ✅ Supported |
| Alpine Linux | ARM64 | ✅ Supported |

## How It Works

1. **Installation**: During `npm install`, the postinstall script downloads the appropriate SoX binary for your platform
2. **Platform Detection**: Automatically detects your OS and architecture
3. **Binary Extraction**: Extracts the SoX executable from the downloaded archive
4. **Path Export**: Provides the binary path via the `soxPath` export

## Integration with Nox

This package is designed specifically for the Nox VS Code extension's voice recording functionality:

```javascript
// In your voice recording service
const { soxPath } = require('nox-sox');
const record = require('node-record-lpcm16');

// Configure node-record-lpcm16 to use bundled SoX
const recordingOptions = {
  sampleRateHertz: 16000,
  threshold: 0.5,
  verbose: false,
  recordProgram: soxPath, // Use bundled SoX instead of system 'sox'
  silence: "1.0s",
};
```

## License

MIT License - See LICENSE file for details.

## SoX License

SoX is licensed under the GNU Lesser General Public License (LGPL). The SoX binaries included in this package are unmodified official releases from the SoX project.

## Credits

- **SoX Project**: https://sox.sourceforge.net/
- **Inspired by**: vscode-ripgrep package pattern
- **Built for**: Nox VS Code Extension
