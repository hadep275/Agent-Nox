console.log('🧪 Minimal Custom Recorder Test...');

try {
  // Test 1: Can we load the custom recorder?
  console.log('📦 Loading custom recorder...');
  const customRecorder = require('./custom-sox-recorder');
  console.log('✅ Custom recorder loaded successfully');
  
  // Test 2: Can we get the SoX path?
  console.log('📍 Loading nox-sox...');
  const { getSoxPath } = require('./packages/nox-sox');
  const soxPath = getSoxPath();
  console.log(`✅ SoX path: ${soxPath}`);
  
  // Test 3: Can we create a recorder instance?
  console.log('🎤 Creating recorder instance...');
  const options = {
    sampleRate: 16000,
    channels: 1,
    audioType: 'wav',
    soxPath: soxPath,
    endOnSilence: false
  };
  
  console.log('⚙️ Options:', JSON.stringify(options, null, 2));
  
  const recorder = customRecorder.record(options);
  console.log('✅ Recorder instance created');
  console.log('🔍 Recorder type:', typeof recorder);
  console.log('🔍 Recorder constructor:', recorder.constructor.name);
  
  // Test 4: Check if recorder has expected methods
  console.log('🔍 Recorder methods:');
  console.log('  - stop:', typeof recorder.stop);
  console.log('  - on:', typeof recorder.on);
  console.log('  - pipe:', typeof recorder.pipe);
  
  console.log('🎉 All basic tests passed!');
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.log(`💡 Stack trace: ${error.stack}`);
}
