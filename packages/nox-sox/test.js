/**
 * Simple test for nox-sox package
 */

console.log('🎤 Testing nox-sox package...');

try {
  // Test the main exports
  const { soxPath, getSoxPath, getSoxVersion, isSoxAvailable } = require('./index.js');
  
  console.log('✅ Package loaded successfully');
  console.log(`📍 SoX Path: ${soxPath}`);
  console.log(`📦 SoX Version: ${getSoxVersion()}`);
  console.log(`🔍 SoX Available: ${isSoxAvailable()}`);
  
  // Test platform detection
  console.log(`🖥️  Platform: ${process.platform}-${process.arch}`);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.log('ℹ️  This is expected until SoX binaries are downloaded');
}
