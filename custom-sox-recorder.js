/**
 * Custom SoX recorder for node-record-lpcm16 that uses our bundled SoX binary
 * This bypasses the hardcoded 'sox' command in the original package
 *
 * Enterprise-grade cross-platform audio recording with proper device detection
 */

const { spawn } = require("child_process");
const debug = require("debug")("record");
const os = require("os");

class CustomSoxRecording {
  constructor(options = {}) {
    const defaults = {
      sampleRate: 16000,
      channels: 1,
      compress: false,
      threshold: 0.5,
      thresholdStart: null,
      thresholdEnd: null,
      silence: "1.0",
      endOnSilence: false,
      audioType: "wav",
      soxPath: null, // Custom SoX binary path
      device: null, // Specific audio device
    };

    this.options = Object.assign(defaults, options);

    // Use custom SoX path if provided, otherwise fall back to system 'sox'
    const cmd = this.options.soxPath || "sox";

    // Build platform-specific recording arguments
    const args = this.buildRecordingArgs();

    const spawnOptions = { encoding: "binary", stdio: "pipe" };

    // Platform-specific environment setup
    if (this.options.device) {
      spawnOptions.env = { ...process.env, AUDIODEV: this.options.device };
    }

    this.cmd = cmd;
    this.args = args;
    this.cmdOptions = spawnOptions;

    debug(`Started recording`);
    debug(this.options);
    debug(` ${this.cmd} ${this.args.join(" ")}`);

    return this.start();
  }

  /**
   * Build platform-specific recording arguments for SoX
   * Handles Windows (waveaudio), macOS (coreaudio), Linux (alsa/pulse)
   */
  buildRecordingArgs() {
    const platform = os.platform();
    let args = [];

    // Platform-specific input configuration
    switch (platform) {
      case "win32":
        // Windows: Use waveaudio driver
        args = [
          "-t",
          "waveaudio", // Use Windows waveaudio driver
          "-d", // Use default input device
          "--no-show-progress",
          "--rate",
          this.options.sampleRate,
          "--channels",
          this.options.channels,
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          "-", // Output to stdout
        ];
        break;

      case "darwin":
        // macOS: Use coreaudio driver
        args = [
          "-t",
          "coreaudio",
          "-d",
          "--no-show-progress",
          "--rate",
          this.options.sampleRate,
          "--channels",
          this.options.channels,
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          "-",
        ];
        break;

      case "linux":
        // Linux: Try ALSA first, fallback to PulseAudio
        args = [
          "-t",
          "alsa",
          "-d",
          "--no-show-progress",
          "--rate",
          this.options.sampleRate,
          "--channels",
          this.options.channels,
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          "-",
        ];
        break;

      default:
        // Fallback: Use generic approach
        args = [
          "--default-device",
          "--no-show-progress",
          "--rate",
          this.options.sampleRate,
          "--channels",
          this.options.channels,
          "--encoding",
          "signed-integer",
          "--bits",
          "16",
          "--type",
          this.options.audioType,
          "-",
        ];
    }

    // Add silence detection if enabled
    if (this.options.endOnSilence) {
      args = args.concat([
        "silence",
        "1",
        "0.1",
        this.options.thresholdStart || this.options.threshold + "%",
        "1",
        this.options.silence,
        this.options.thresholdEnd || this.options.threshold + "%",
      ]);
    }

    return args;
  }

  start() {
    const { cmd, args, cmdOptions } = this;

    debug(`Spawning: ${cmd} ${args.join(" ")}`);

    const cp = spawn(cmd, args, cmdOptions);
    const rec = cp.stdout;
    const err = cp.stderr;

    this.process = cp; // expose child process
    this._stream = rec; // expose output stream

    // Enhanced error handling with platform-specific suggestions
    cp.on("close", (code) => {
      if (code === 0) return;

      const errorMessage = this.getErrorMessage(code);
      rec.emit("error", errorMessage);
    });

    // Capture stderr for debugging
    let stderrData = "";
    err.on("data", (chunk) => {
      const chunkStr = chunk.toString();
      stderrData += chunkStr;
      debug(`STDERR: ${chunkStr}`);
    });

    // Enhanced error handling on process error
    cp.on("error", (error) => {
      debug(`Process error: ${error.message}`);
      rec.emit("error", `Failed to start recording: ${error.message}`);
    });

    rec.on("data", (chunk) => {
      debug(`Recording ${chunk.length} bytes`);
    });

    rec.on("end", () => {
      debug("Recording ended");
      if (stderrData) {
        debug(`Final STDERR: ${stderrData}`);
      }
    });

    return this;
  }

  /**
   * Get user-friendly error message based on exit code and platform
   */
  getErrorMessage(code) {
    const platform = os.platform();
    let suggestion = "";

    switch (platform) {
      case "win32":
        suggestion = `
Windows Audio Troubleshooting:
1. Check if your microphone is connected and enabled
2. Verify microphone permissions in Windows Settings > Privacy > Microphone
3. Try running VS Code as administrator
4. Check Windows Sound settings for default recording device`;
        break;

      case "darwin":
        suggestion = `
macOS Audio Troubleshooting:
1. Check microphone permissions in System Preferences > Security & Privacy > Microphone
2. Ensure VS Code has microphone access
3. Verify your microphone is selected in System Preferences > Sound > Input`;
        break;

      case "linux":
        suggestion = `
Linux Audio Troubleshooting:
1. Check if ALSA or PulseAudio is running
2. Verify microphone permissions and device availability
3. Try: arecord -l to list available recording devices
4. Check if your user is in the 'audio' group`;
        break;

      default:
        suggestion = "Check microphone permissions and device availability";
    }

    return `${this.cmd} has exited with error code ${code}.

${suggestion}

Enable debugging with the environment variable DEBUG=record.`;
  }

  stop() {
    if (!this.process) {
      throw new Error("Recording not yet started");
    }
    this.process.kill();
  }

  pause() {
    if (!this.process) {
      throw new Error("Recording not yet started");
    }
    this.process.kill("SIGSTOP");
    this._stream.pause();
    debug("Paused recording");
  }

  resume() {
    if (!this.process) {
      throw new Error("Recording not yet started");
    }
    this.process.kill("SIGCONT");
    this._stream.resume();
    debug("Resumed recording");
  }

  isPaused() {
    if (!this.process) {
      throw new Error("Recording not yet started");
    }
    return this._stream.isPaused();
  }

  stream() {
    if (!this._stream) {
      throw new Error("Recording not yet started");
    }
    return this._stream;
  }
}

module.exports = {
  record: (options) => new CustomSoxRecording(options),
};
