/**
 * File-Based SoX Recorder for Nox Voice Recording
 *
 * This recorder uses a file-based approach instead of stdout streaming
 * to avoid Windows compatibility issues with SoX stdout piping.
 *
 * Enterprise-grade cross-platform audio recording solution.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { EventEmitter } = require("events");

class FileBasedSoxRecorder extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      sampleRate: 16000,
      channels: 1,
      audioType: "wav",
      duration: 30, // Maximum recording duration in seconds
      soxPath: "sox", // Will be overridden with bundled path
      ...options,
    };

    this.tempFile = null;
    this.soxProcess = null;
    this.isRecording = false;
  }

  /**
   * Start recording audio to a temporary file
   * @returns {string} Path to the recording file (starts immediately)
   */
  startRecording() {
    if (this.isRecording) {
      throw new Error("Recording already in progress");
    }

    // Create temporary file
    this.tempFile = path.join(
      os.tmpdir(),
      `nox-recording-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.wav`
    );

    const args = this.buildRecordingArgs();

    console.log(
      `🎤 Starting SoX recording: ${this.options.soxPath} ${args.join(" ")}`
    );

    try {
      this.soxProcess = spawn(this.options.soxPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      this.isRecording = true;

      let stderrData = "";

      this.soxProcess.stdout.on("data", (data) => {
        // SoX might output progress info to stdout
        console.log(`📊 SoX: ${data.toString().trim()}`);
      });

      this.soxProcess.stderr.on("data", (data) => {
        const errorText = data.toString().trim();
        stderrData += errorText;

        // Log warnings but don't fail on them
        if (errorText.includes("WARN")) {
          console.log(`⚠️ SoX warning: ${errorText}`);
        } else if (errorText.includes("FAIL") || errorText.includes("ERROR")) {
          console.error(`❌ SoX error: ${errorText}`);
        }
      });

      this.soxProcess.on("error", (error) => {
        this.isRecording = false;
        this.cleanup();
        console.error(`❌ Failed to start SoX: ${error.message}`);
        this.emit("error", error);
      });

      this.soxProcess.on("close", (code, signal) => {
        this.isRecording = false;

        // Handle graceful termination (SIGTERM) as success
        if (code === 0 || code === null || signal === "SIGTERM") {
          // Success or graceful termination - check if file was created
          if (fs.existsSync(this.tempFile)) {
            const stats = fs.statSync(this.tempFile);
            console.log(`✅ Recording completed: ${stats.size} bytes`);
            this.emit("completed", this.tempFile);
          } else {
            console.error("❌ Recording file was not created");
            this.emit("error", new Error("Recording file was not created"));
          }
        } else {
          console.error(
            `❌ SoX exited with code ${code}, signal ${signal}. Stderr: ${stderrData}`
          );
          this.emit(
            "error",
            new Error(
              `SoX exited with code ${code}, signal ${signal}. Stderr: ${stderrData}`
            )
          );
        }
      });

      // Emit started event
      this.emit("started");

      // Return file path immediately
      return this.tempFile;
    } catch (error) {
      this.isRecording = false;
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop the current recording
   */
  stopRecording() {
    if (!this.isRecording || !this.soxProcess) {
      console.log("⚠️ No recording in progress to stop");
      return;
    }

    console.log("⏹️ Stopping SoX recording...");

    // Mark as not recording immediately to prevent double-stop
    this.isRecording = false;

    // Send SIGTERM to gracefully stop SoX
    try {
      this.soxProcess.kill("SIGTERM");
      console.log("📡 SIGTERM sent to SoX process");
    } catch (error) {
      console.log("⚠️ Error sending SIGTERM:", error.message);
    }

    // Fallback: force kill after 3 seconds if still running
    setTimeout(() => {
      if (this.soxProcess && !this.soxProcess.killed) {
        console.log("🔨 Force killing SoX process...");
        try {
          this.soxProcess.kill("SIGKILL");
        } catch (error) {
          console.log("⚠️ Error force killing SoX:", error.message);
        }
      }
    }, 3000);
  }

  /**
   * Read the recorded audio file as a buffer
   * @returns {Buffer} Audio data
   */
  getAudioBuffer() {
    if (!this.tempFile || !fs.existsSync(this.tempFile)) {
      throw new Error("No recording file available");
    }

    return fs.readFileSync(this.tempFile);
  }

  /**
   * Clean up temporary files with retry logic for file locking issues
   */
  cleanup() {
    if (!this.tempFile) {
      return;
    }

    // Stop recording first if still active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Wait for SoX process to fully terminate before cleanup
    this.cleanupWithRetry(0);
  }

  /**
   * Cleanup with retry logic to handle Windows file locking
   */
  cleanupWithRetry(attempt) {
    const maxAttempts = 5;
    const retryDelay = 1000; // 1 second

    if (attempt >= maxAttempts) {
      console.warn(
        `⚠️ Failed to clean up ${this.tempFile} after ${maxAttempts} attempts`
      );
      this.tempFile = null;
      return;
    }

    if (!fs.existsSync(this.tempFile)) {
      console.log("🧹 Recording file already cleaned up");
      this.tempFile = null;
      return;
    }

    try {
      fs.unlinkSync(this.tempFile);
      console.log("🧹 Cleaned up recording file");
      this.tempFile = null;
    } catch (error) {
      if (error.code === "EBUSY" || error.code === "ENOENT") {
        console.log(
          `⏳ File locked, retrying cleanup in ${retryDelay}ms (attempt ${
            attempt + 1
          }/${maxAttempts})`
        );
        setTimeout(() => {
          this.cleanupWithRetry(attempt + 1);
        }, retryDelay);
      } else {
        console.warn(
          `⚠️ Failed to clean up ${this.tempFile}: ${error.message}`
        );
        this.tempFile = null;
      }
    }
  }

  /**
   * Build platform-specific SoX arguments
   */
  buildRecordingArgs() {
    const platform = os.platform();
    let args = [];

    switch (platform) {
      case "win32":
        args = [
          "-t",
          "waveaudio",
          "-d", // Windows waveaudio driver
          "--no-show-progress",
          "--rate",
          this.options.sampleRate.toString(),
          "--channels",
          this.options.channels.toString(),
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          this.tempFile, // Output to file
          "trim",
          "0",
          this.options.duration.toString(), // Max duration
        ];
        break;

      case "darwin":
        args = [
          "-t",
          "coreaudio",
          "-d", // macOS coreaudio driver
          "--no-show-progress",
          "--rate",
          this.options.sampleRate.toString(),
          "--channels",
          this.options.channels.toString(),
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          this.tempFile,
          "trim",
          "0",
          this.options.duration.toString(),
        ];
        break;

      case "linux":
        args = [
          "-t",
          "alsa",
          "-d", // Linux ALSA driver
          "--no-show-progress",
          "--rate",
          this.options.sampleRate.toString(),
          "--channels",
          this.options.channels.toString(),
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          this.tempFile,
          "trim",
          "0",
          this.options.duration.toString(),
        ];
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return args;
  }
}

module.exports = FileBasedSoxRecorder;
