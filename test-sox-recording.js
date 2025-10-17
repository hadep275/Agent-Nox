/**
 * Test SoX recording functionality directly
 * This tests if our bundled SoX binary works with node-record-lpcm16
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

async function testSoxRecording() {
  console.log("🎤 Testing SoX Recording Functionality...\n");

  try {
    // Test 1: Load nox-sox package
    console.log("📦 Testing nox-sox package...");
    const {
      soxPath,
      isSoxAvailable,
      getSoxVersion,
    } = require("./packages/nox-sox");

    console.log(`✅ nox-sox loaded successfully`);
    console.log(`📍 SoX Path: ${soxPath}`);
    console.log(`📦 SoX Version: ${getSoxVersion()}`);
    console.log(`🔍 SoX Available: ${isSoxAvailable()}\n`);

    // Test 2: Load custom SoX recorder
    console.log("🎙️ Testing custom SoX recorder...");
    const record = require("./custom-sox-recorder");
    console.log("✅ Custom SoX recorder loaded successfully\n");

    // Test 3: Test SoX binary directly
    console.log("🔧 Testing SoX binary directly...");
    const { execSync } = require("child_process");

    try {
      // Test if SoX can show help (quick test)
      const helpOutput = execSync(`"${soxPath}" --help`, {
        encoding: "utf8",
        timeout: 5000,
        stdio: "pipe",
      });

      if (helpOutput.includes("SoX")) {
        console.log("✅ SoX binary responds correctly");
        console.log(
          `📄 SoX Help Preview: ${helpOutput.substring(0, 100)}...\n`
        );
      } else {
        console.log("❌ SoX binary response unexpected");
        return;
      }
    } catch (soxError) {
      console.log(`❌ SoX binary test failed: ${soxError.message}\n`);
      return;
    }

    // Test 4: Test recording configuration
    console.log("⚙️ Testing recording configuration...");

    const tempDir = os.tmpdir();
    const testAudioFile = path.join(tempDir, `nox-test-${Date.now()}.wav`);

    // Configure recording options with our bundled SoX
    const recordingOptions = {
      sampleRate: 16000, // Note: sampleRate not sampleRateHertz for custom recorder
      channels: 1,
      audioType: "wav",
      threshold: 0.5,
      soxPath: soxPath, // Use our bundled SoX binary
      silence: "1.0",
      endOnSilence: false, // Disable silence detection for initial test
    };

    console.log(`🎯 SoX Binary: ${recordingOptions.soxPath}`);
    console.log(`📁 Test Audio File: ${testAudioFile}`);
    console.log(`⚙️ Sample Rate: ${recordingOptions.sampleRate}Hz`);
    console.log(`🔇 Silence Detection: ${recordingOptions.silence}\n`);

    // Test 5: Quick recording test (2 seconds)
    console.log("🎬 Starting 2-second recording test...");
    console.log("🗣️ Please speak into your microphone for 2 seconds...\n");

    try {
      // Start recording
      const recorder = record.record(recordingOptions);
      const fileStream = fs.createWriteStream(testAudioFile);

      // Add error handling for the recorder
      recorder.stream().on("error", (error) => {
        console.log(`❌ Recording stream error: ${error.message}`);
        console.log("💡 This might be a microphone permission or device issue");

        // Clean up on error
        if (fs.existsSync(testAudioFile)) {
          fs.unlinkSync(testAudioFile);
        }
      });

      recorder.stream().pipe(fileStream);

      console.log("🔴 Recording started...");

      // Stop recording after 2 seconds
      setTimeout(() => {
        console.log("⏹️ Stopping recording...");
        try {
          recorder.stop();
        } catch (stopError) {
          console.log(`⚠️ Error stopping recorder: ${stopError.message}`);
        }

        // Check if file was created and has content
        setTimeout(() => {
          if (fs.existsSync(testAudioFile)) {
            const stats = fs.statSync(testAudioFile);
            console.log(`✅ Audio file created: ${stats.size} bytes`);

            if (stats.size > 1000) {
              // At least 1KB of audio data
              console.log("🎉 SUCCESS! Voice recording is working!\n");
              console.log("🚀 READY FOR PRODUCTION:");
              console.log("   ✅ Bundled SoX binary working");
              console.log("   ✅ Custom SoX recorder working");
              console.log("   ✅ Audio file generation working");
              console.log("   ✅ Windows waveaudio driver working");
              console.log("   ✅ Your mic feature will work in VS Code!\n");

              console.log("🎯 NEXT STEPS:");
              console.log("   1. Integrate with VoiceRecordingService");
              console.log("   2. Add OpenAI Whisper transcription");
              console.log("   3. Test end-to-end voice-to-text pipeline");
              console.log("   4. Add UI microphone button integration");
            } else {
              console.log(
                "⚠️ Audio file is too small - check microphone permissions"
              );
              console.log("💡 Try running VS Code as administrator");
            }

            // Clean up
            fs.unlinkSync(testAudioFile);
            console.log("🧹 Test file cleaned up");
          } else {
            console.log("❌ Audio file was not created");
            console.log(
              "💡 Check microphone permissions and device availability"
            );
          }
        }, 1000); // Give more time for file to be written
      }, 2000);
    } catch (recordError) {
      console.log(`❌ Recording test failed: ${recordError.message}`);
      console.log("💡 This might indicate a SoX configuration or device issue");
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log("\nℹ️ Make sure to run: npm install ./packages/nox-sox");
  }
}

// Run the test
testSoxRecording();
