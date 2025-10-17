const fs = require("fs");
const path = require("path");
const os = require("os");
const { getSoxPath } = require("./packages/nox-sox");

console.log("🎤 Testing Direct Custom SoX Recorder...\n");

try {
  // Get bundled SoX path
  const soxPath = getSoxPath();
  console.log(`📍 SoX Path: ${soxPath}`);

  // Import our custom recorder
  const customRecorder = require("./custom-sox-recorder");

  // Create test file path
  const testAudioFile = path.join(
    os.tmpdir(),
    `nox-direct-test-${Date.now()}.wav`
  );
  console.log(`📁 Test Audio File: ${testAudioFile}`);

  // Configure recorder options
  const options = {
    sampleRate: 16000,
    channels: 1,
    audioType: "wav",
    soxPath: soxPath,
    threshold: 0.5,
    silence: "1.0",
    endOnSilence: false,
  };

  console.log("⚙️ Recorder Options:", JSON.stringify(options, null, 2));

  // Create recorder instance using the record function
  const recorder = customRecorder.record(options);

  console.log("\n🎬 Starting direct recording test...");
  console.log("🗣️ Please speak into your microphone for 3 seconds...\n");

  // Create file stream
  const fileStream = fs.createWriteStream(testAudioFile);

  // The recorder object returned by record() is actually the audio stream
  const audioStream = recorder;

  // Handle audio stream events
  audioStream.on("data", (chunk) => {
    console.log(`📊 Received audio chunk: ${chunk.length} bytes`);
  });

  audioStream.on("error", (error) => {
    console.log(`❌ Audio stream error: ${error}`);
    console.log(`💡 Stream error type: ${typeof error}`);
    if (error && error.message) {
      console.log(`💡 Stream error message: ${error.message}`);
    }
  });

  audioStream.on("end", () => {
    console.log("🔚 Audio stream ended");

    // Check if file was created
    setTimeout(() => {
      if (fs.existsSync(testAudioFile)) {
        const stats = fs.statSync(testAudioFile);
        console.log(`✅ Audio file created: ${stats.size} bytes`);

        if (stats.size > 1000) {
          console.log("🎉 SUCCESS! Direct custom recorder is working!");
        } else {
          console.log("⚠️ Audio file is too small");
        }

        // Clean up
        fs.unlinkSync(testAudioFile);
        console.log("🧹 Test file cleaned up");
      } else {
        console.log("❌ Audio file was not created");
      }
    }, 500);
  });

  // Pipe audio to file
  audioStream.pipe(fileStream);

  console.log("🔴 Recording started...");

  // Stop recording after 3 seconds
  setTimeout(() => {
    console.log("⏹️ Stopping recording...");
    try {
      // The audioStream should have a stop method from our custom recorder
      if (audioStream.stop) {
        audioStream.stop();
      } else {
        console.log("💡 No stop method found, ending stream manually");
        audioStream.end();
      }
    } catch (stopError) {
      console.log(`⚠️ Error stopping recorder: ${stopError.message}`);
    }
  }, 3000);
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.log(`💡 Stack trace: ${error.stack}`);
}
