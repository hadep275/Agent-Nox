const fs = require('fs');
const path = require('path');
const os = require('os');
const { getSoxPath } = require('./packages/nox-sox');

console.log('🔧 Testing Patched SoX Recorder...\n');

try {
  // Get bundled SoX path
  const soxPath = getSoxPath();
  console.log(`📍 SoX Path: ${soxPath}`);
  
  // Test the patched recorder module
  const patchedRecorder = require('./patched-sox-recorder');
  console.log('✅ Patched recorder loaded successfully');
  
  // Configure recording options
  const options = {
    sampleRate: 16000,
    channels: 1,
    audioType: 'wav',
    soxPath: soxPath, // Use our bundled SoX
    threshold: 0.5,
    silence: '1.0',
    endOnSilence: false
  };
  
  console.log('⚙️ Recording Options:', JSON.stringify(options, null, 2));
  
  // Get the command and args from our patched recorder
  const recorderConfig = patchedRecorder(options);
  console.log('\n🔧 Patched Recorder Config:');
  console.log(`  Command: ${recorderConfig.cmd}`);
  console.log(`  Args: ${recorderConfig.args.join(' ')}`);
  console.log(`  Options: ${JSON.stringify(recorderConfig.options)}`);
  
  // Now test with the original node-record-lpcm16 using our patched recorder
  console.log('\n📦 Loading node-record-lpcm16...');
  
  // Temporarily replace the sox recorder with our patched version
  const originalSoxRecorder = require.cache[require.resolve('node-record-lpcm16/recorders/sox')];
  require.cache[require.resolve('node-record-lpcm16/recorders/sox')] = {
    exports: patchedRecorder,
    loaded: true
  };
  
  const record = require('node-record-lpcm16');
  console.log('✅ node-record-lpcm16 loaded with patched recorder');
  
  // Create test file
  const testAudioFile = path.join(os.tmpdir(), `nox-patched-test-${Date.now()}.wav`);
  console.log(`📁 Test Audio File: ${testAudioFile}`);
  
  console.log('\n🎬 Starting 3-second recording test...');
  console.log('🗣️ Please speak into your microphone for 3 seconds...\n');
  
  // Start recording
  const recorder = record.record(options);
  const fileStream = fs.createWriteStream(testAudioFile);
  
  // Handle events
  recorder.stream().on('error', (error) => {
    console.log(`❌ Recording error: ${error}`);
    if (fs.existsSync(testAudioFile)) {
      fs.unlinkSync(testAudioFile);
    }
  });
  
  recorder.stream().on('data', (chunk) => {
    console.log(`📊 Audio chunk: ${chunk.length} bytes`);
  });
  
  recorder.stream().on('end', () => {
    console.log('🔚 Recording ended');
    
    // Check file
    setTimeout(() => {
      if (fs.existsSync(testAudioFile)) {
        const stats = fs.statSync(testAudioFile);
        console.log(`✅ Audio file created: ${stats.size} bytes`);
        
        if (stats.size > 1000) {
          console.log('🎉 SUCCESS! Patched recorder is working!');
          console.log('🚀 Ready to integrate with VoiceRecordingService!');
        } else {
          console.log('⚠️ Audio file is too small');
        }
        
        // Clean up
        fs.unlinkSync(testAudioFile);
        console.log('🧹 Test file cleaned up');
      } else {
        console.log('❌ Audio file was not created');
      }
    }, 500);
  });
  
  // Pipe to file
  recorder.stream().pipe(fileStream);
  console.log('🔴 Recording started...');
  
  // Stop after 3 seconds
  setTimeout(() => {
    console.log('⏹️ Stopping recording...');
    recorder.stop();
  }, 3000);
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.log(`💡 Stack trace: ${error.stack}`);
}
