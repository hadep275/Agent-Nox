const { getSoxPath } = require("./packages/nox-sox");
const FileBasedSoxRecorder = require("./src/utils/file-based-sox-recorder");

console.log("🎤 Testing File-Based SoX Recorder Class...\n");

async function testRecorder() {
  try {
    // Get bundled SoX path
    const soxPath = getSoxPath();
    console.log(`📍 SoX Path: ${soxPath}`);

    // Create recorder instance
    const recorder = new FileBasedSoxRecorder({
      sampleRate: 16000,
      channels: 1,
      audioType: "wav",
      duration: 5, // 5 seconds max
      soxPath: soxPath,
    });

    console.log("✅ Recorder instance created");

    // Set up event listeners
    recorder.on("started", () => {
      console.log("🔴 Recording started event received");
    });

    console.log("\n🎬 Starting 5-second recording...");
    console.log(
      "🗣️ Please speak into your microphone for up to 5 seconds...\n"
    );

    // Start recording
    const audioFilePath = await recorder.startRecording();
    console.log(`✅ Recording completed: ${audioFilePath}`);

    // Get audio buffer
    const audioBuffer = recorder.getAudioBuffer();
    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

    // Verify it's a valid WAV file
    const header = audioBuffer.slice(0, 12).toString("ascii");
    console.log(`🔍 WAV Header: ${header.replace(/[^\x20-\x7E]/g, ".")}`);

    if (header.includes("RIFF") && header.includes("WAVE")) {
      console.log("✅ Valid WAV file format confirmed!");

      if (audioBuffer.length > 10000) {
        console.log("🎉 SUCCESS! File-based recorder is working perfectly!");
        console.log("🚀 Ready to integrate with VoiceRecordingService!");

        console.log("\n📋 INTEGRATION PLAN:");
        console.log("1. ✅ File-based SoX recording working");
        console.log(
          "2. 🔄 Update VoiceRecordingService to use FileBasedSoxRecorder"
        );
        console.log("3. 🔄 Add OpenAI Whisper transcription");
        console.log("4. 🔄 Test end-to-end voice-to-text pipeline");
        console.log("5. 🔄 Add UI microphone button integration");
      } else {
        console.log("⚠️ Audio buffer is smaller than expected");
      }
    } else {
      console.log("❌ Invalid WAV file format");
    }

    // Clean up
    recorder.cleanup();
    console.log("🧹 Cleanup completed");
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`💡 Stack trace: ${error.stack}`);
  }
}

// Run the test
testRecorder();
