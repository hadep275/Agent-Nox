const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { getSoxPath } = require('./packages/nox-sox');

console.log('📁 Testing File-Based SoX Recording...\n');

try {
  // Get bundled SoX path
  const soxPath = getSoxPath();
  console.log(`📍 SoX Path: ${soxPath}`);
  
  // Create temporary file for recording
  const tempAudioFile = path.join(os.tmpdir(), `nox-temp-recording-${Date.now()}.wav`);
  console.log(`📁 Temp Audio File: ${tempAudioFile}`);
  
  // Build SoX command for Windows file-based recording
  const args = [
    '-t', 'waveaudio', '-d', // Windows waveaudio driver with default device
    '--no-show-progress',
    '--rate', '16000',
    '--channels', '1',
    '--encoding', 'signed-integer',
    '--bits', '16',
    '--type', 'wav',
    tempAudioFile, // Output to file instead of stdout
    'trim', '0', '3' // Record for 3 seconds
  ];
  
  console.log(`🎤 SoX Command: ${soxPath} ${args.join(' ')}`);
  console.log('\n🎬 Starting 3-second file-based recording...');
  console.log('🗣️ Please speak into your microphone for 3 seconds...\n');
  
  // Start SoX process
  const soxProcess = spawn(soxPath, args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let stderrData = '';
  
  soxProcess.stdout.on('data', (data) => {
    console.log(`📊 SoX stdout: ${data.toString().trim()}`);
  });
  
  soxProcess.stderr.on('data', (data) => {
    const errorText = data.toString().trim();
    stderrData += errorText;
    console.log(`⚠️ SoX stderr: ${errorText}`);
  });
  
  soxProcess.on('error', (error) => {
    console.log(`❌ SoX process error: ${error.message}`);
  });
  
  soxProcess.on('close', (code) => {
    console.log(`🔚 SoX process exited with code: ${code}`);
    
    if (stderrData) {
      console.log(`📝 Full stderr output: ${stderrData}`);
    }
    
    // Check if file was created
    setTimeout(() => {
      if (fs.existsSync(tempAudioFile)) {
        const stats = fs.statSync(tempAudioFile);
        console.log(`✅ Audio file created: ${stats.size} bytes`);
        
        if (stats.size > 1000) {
          console.log('🎉 SUCCESS! File-based recording is working!');
          console.log('💡 This approach avoids stdout issues on Windows');
          console.log('🚀 We can use this method for the voice recording feature!');
          
          // Read first few bytes to verify it's a valid WAV file
          const buffer = fs.readFileSync(tempAudioFile);
          const header = buffer.slice(0, 12).toString('ascii');
          console.log(`🔍 WAV Header: ${header.replace(/[^\x20-\x7E]/g, '.')}`);
          
          if (header.includes('RIFF') && header.includes('WAVE')) {
            console.log('✅ Valid WAV file format confirmed!');
          }
        } else {
          console.log('⚠️ Audio file is too small - check microphone');
        }
        
        // Clean up
        fs.unlinkSync(tempAudioFile);
        console.log('🧹 Temp file cleaned up');
      } else {
        console.log('❌ Audio file was not created');
        console.log('💡 Check microphone permissions and device availability');
      }
    }, 1000);
  });
  
  console.log('🔴 Recording started...');
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.log(`💡 Stack trace: ${error.stack}`);
}
