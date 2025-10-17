/**
 * 🎤 Voice Recording Service
 * Handles microphone recording and speech-to-text transcription
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const vscode = require("vscode");

class VoiceRecordingService {
  constructor(logger, context) {
    this.logger = logger;
    this.context = context;
    this.recorder = null;
    this.isRecording = false;
    this.audioFile = null;
    this.speechClient = null;
    this.openai = null;
    this.voiceSettings = null;

    // Load voice settings and initialize services
    this.loadVoiceSettings();
    // Initialize engines asynchronously
    this.initializeVoiceEngines().catch((error) => {
      this.logger.error("🎤 Failed to initialize voice engines:", error);
    });
  }

  /**
   * Load voice settings from Nox workspace state
   */
  loadVoiceSettings() {
    try {
      // Load from Nox workspace state (like chat history)
      const savedSettings = this.context.workspaceState.get(
        "nox.voiceSettings",
        {}
      );

      this.voiceSettings = {
        enabled:
          savedSettings.enabled !== undefined ? savedSettings.enabled : true,
        engine: savedSettings.engine || "openai", // Default to OpenAI (recommended)
        googleApiKey: savedSettings.googleApiKey || "",
        azureApiKey: savedSettings.azureApiKey || "",
        azureRegion: savedSettings.azureRegion || "",
      };

      this.logger.info("🎤 Voice settings loaded from Nox storage:", {
        enabled: this.voiceSettings.enabled,
        engine: this.voiceSettings.engine,
        hasGoogleKey: !!this.voiceSettings.googleApiKey,
      });
    } catch (error) {
      this.logger.error("🎤 Failed to load voice settings:", error);
      // Fallback to defaults
      this.voiceSettings = {
        enabled: true,
        engine: "openai", // Default to OpenAI (recommended)
        googleApiKey: "",
        azureApiKey: "",
        azureRegion: "",
      };
    }
  }

  /**
   * Save voice settings to Nox workspace state
   */
  async saveVoiceSettings() {
    try {
      await this.context.workspaceState.update(
        "nox.voiceSettings",
        this.voiceSettings
      );
      this.logger.info("🎤 Voice settings saved to Nox storage");
    } catch (error) {
      this.logger.error("🎤 Failed to save voice settings:", error);
    }
  }

  /**
   * Initialize voice engines based on settings
   */
  async initializeVoiceEngines() {
    try {
      // Initialize OpenAI if we have an API key (reuse from chat settings)
      await this.initializeOpenAI();

      // Initialize Google Speech if we have an API key
      this.initializeGoogleSpeech();

      this.logger.info("🎤 Voice engines initialized");
    } catch (error) {
      this.logger.error("🎤 Failed to initialize voice engines:", error);
    }
  }

  /**
   * Initialize OpenAI client for Whisper API
   */
  async initializeOpenAI() {
    try {
      // Get OpenAI API key from secure storage (reuse existing key)
      const openaiApiKey = await this.context.secrets.get("nox.openai.apiKey");

      if (openaiApiKey) {
        const OpenAI = require("openai");
        this.openai = new OpenAI({
          apiKey: openaiApiKey,
        });
        this.logger.info("🎤 OpenAI Whisper API initialized");
      } else {
        this.logger.warn("🎤 OpenAI API key not found - Whisper unavailable");
      }
    } catch (error) {
      this.logger.error("🎤 Failed to initialize OpenAI:", error);
    }
  }

  /**
   * Initialize Google Speech-to-Text client
   */
  initializeGoogleSpeech() {
    try {
      // Use API key from voice settings if available
      if (this.voiceSettings?.googleApiKey) {
        const speech = require("@google-cloud/speech");
        this.speechClient = new speech.SpeechClient({
          apiKey: this.voiceSettings.googleApiKey,
        });
        this.logger.info(
          "🎤 Google Speech-to-Text API initialized with API key"
        );
      } else {
        // Fallback to environment credentials
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentialsPath || process.env.GOOGLE_CLOUD_PROJECT) {
          const speech = require("@google-cloud/speech");
          this.speechClient = new speech.SpeechClient();
          this.logger.info(
            "🎤 Google Speech-to-Text API initialized with environment credentials"
          );
        } else {
          this.logger.warn(
            "🎤 Google Cloud credentials not found - Google Speech unavailable"
          );
        }
      }
    } catch (error) {
      this.logger.error("🎤 Failed to initialize Google Speech:", error);
    }
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording() {
    try {
      if (this.isRecording) {
        throw new Error("Recording already in progress");
      }

      this.logger.info("🎤 Starting voice recording...");

      // Enterprise-grade dependency detection
      const recordingCapability = await this.detectRecordingCapability();

      if (!recordingCapability.available) {
        throw new Error(recordingCapability.error);
      }

      // Use detected recording method
      return await this.startRecordingWithMethod(
        recordingCapability.method,
        recordingCapability.recorderClass || recordingCapability.record,
        recordingCapability.soxPath
      );
    } catch (error) {
      this.logger.error("🎤 Failed to start recording:", error);
      return {
        success: false,
        error: error.message,
        suggestion: this.getRecordingSuggestion(error.message),
      };
    }
  }

  /**
   * 🔍 Detect available recording capabilities (Enterprise-grade)
   */
  async detectRecordingCapability() {
    // Method 1: Try FileBasedSoxRecorder with bundled SoX (Enterprise approach)
    try {
      // Try bundled SoX first (Enterprise solution)
      try {
        const { soxPath, isSoxAvailable } = require("nox-sox");

        if (isSoxAvailable()) {
          this.logger.info(
            `🎤 Using FileBasedSoxRecorder with bundled SoX: ${soxPath}`
          );

          // Test if we can create the recorder instance
          const FileBasedSoxRecorder = require("../utils/file-based-sox-recorder");
          const testRecorder = new FileBasedSoxRecorder({
            soxPath: soxPath,
            sampleRate: 16000,
            channels: 1,
            audioType: "wav",
          });

          return {
            available: true,
            method: "file-based-sox",
            recorderClass: FileBasedSoxRecorder,
            soxPath: soxPath,
          };
        } else {
          this.logger.warn("🎤 Bundled SoX not available for this platform");
        }
      } catch (noxSoxError) {
        this.logger.warn(
          "🎤 nox-sox package not available:",
          noxSoxError.message
        );
      }

      // Fallback: Check if system SoX is available for FileBasedSoxRecorder
      const { exec } = require("child_process");
      const soxCheck = await new Promise((resolve) => {
        exec("sox --version", (error) => {
          resolve(!error);
        });
      });

      if (soxCheck) {
        this.logger.info("🎤 Using FileBasedSoxRecorder with system SoX");
        const FileBasedSoxRecorder = require("../utils/file-based-sox-recorder");

        return {
          available: true,
          method: "file-based-sox",
          recorderClass: FileBasedSoxRecorder,
          soxPath: "sox", // Use system SoX command
        };
      } else {
        this.logger.warn(
          "🎤 System SoX not found, FileBasedSoxRecorder unavailable"
        );
      }
    } catch (error) {
      this.logger.warn("🎤 FileBasedSoxRecorder not available:", error.message);
    }

    // Method 2: Future - Web-based recording (placeholder)
    // This will be implemented in Phase 2 for VS Code environments with strict permissions
    this.logger.info("🎤 Web-based recording not yet implemented");

    // No recording method available
    return {
      available: false,
      error:
        "No audio recording capability detected. SoX binaries are not available for your platform. This may be due to VS Code microphone permission restrictions in enterprise environments.",
    };
  }

  /**
   * 🎤 Start recording with specific method
   */
  async startRecordingWithMethod(method, recorderClass = null, soxPath = null) {
    switch (method) {
      case "file-based-sox":
        return await this.startFileBasedRecording(recorderClass, soxPath);
      case "node-record":
        // Legacy fallback - kept for compatibility
        return await this.startNodeRecording(recorderClass, soxPath);
      case "web-api":
        // Future implementation for VS Code environments with strict permissions
        throw new Error("Web API recording not yet implemented");
      default:
        throw new Error(`Unknown recording method: ${method}`);
    }
  }

  /**
   * 🎤 Start recording using node-record-lpcm16 with bundled SoX (Enterprise method)
   */
  async startNodeRecording(record, soxPath = null) {
    try {
      // Create temporary audio file
      const tempDir = os.tmpdir();
      this.audioFile = path.join(tempDir, `nox-voice-${Date.now()}.wav`);

      // Configure recording options with bundled or system SoX
      const recordProgram = soxPath && soxPath !== "sox" ? soxPath : "rec";
      const recordingOptions = {
        sampleRateHertz: 16000,
        threshold: 0.5,
        verbose: false,
        recordProgram: recordProgram, // Use bundled SoX path or fallback to 'rec'
        silence: "1.0s",
      };

      this.logger.info(`🎤 Using recording program: ${recordProgram}`);

      // Start recording
      this.recorder = record.record(recordingOptions);

      // Pipe audio to file
      const fileStream = fs.createWriteStream(this.audioFile);
      this.recorder.stream().pipe(fileStream);

      this.isRecording = true;
      this.logger.info(`🎤 Recording started, saving to: ${this.audioFile}`);

      return {
        success: true,
        message: "Recording started",
      };
    } catch (error) {
      this.logger.error("🎤 Failed to start node recording:", error);
      throw error;
    }
  }

  /**
   * 🎤 Start recording using FileBasedSoxRecorder (Enterprise method)
   */
  async startFileBasedRecording(RecorderClass, soxPath = null) {
    try {
      // Create FileBasedSoxRecorder instance
      this.recorder = new RecorderClass({
        sampleRate: 16000,
        channels: 1,
        audioType: "wav",
        duration: 30, // 30 seconds max recording
        soxPath: soxPath,
      });

      this.logger.info(`🎤 Using FileBasedSoxRecorder with SoX: ${soxPath}`);

      // Start recording and get the audio file path (synchronous now)
      this.audioFile = this.recorder.startRecording();
      this.isRecording = true;

      this.logger.info(
        `🎤 File-based recording started, will save to: ${this.audioFile}`
      );

      return {
        success: true,
        message: "File-based recording started",
      };
    } catch (error) {
      this.logger.error("🎤 Failed to start file-based recording:", error);

      // Enhanced error handling for enterprise environments
      if (
        error.message.includes("Permission denied") ||
        error.message.includes("EACCES")
      ) {
        throw new Error(
          "Microphone access denied. This may be due to VS Code security restrictions or enterprise policies. Please check microphone permissions in your system settings."
        );
      } else if (
        error.message.includes("device") ||
        error.message.includes("waveaudio")
      ) {
        throw new Error(
          "No microphone device found. Please ensure a microphone is connected and properly configured in your system audio settings."
        );
      } else if (
        error.message.includes("SoX") ||
        error.message.includes("sox")
      ) {
        throw new Error(
          "Audio recording system unavailable. This may be due to missing audio drivers or enterprise security restrictions."
        );
      }

      throw error;
    }
  }

  /**
   * Wait for FileBasedSoxRecorder to complete recording
   */
  async waitForRecordingCompletion() {
    if (!this.recorder || !this.recorder.soxProcess) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Recording completion timeout after 10 seconds"));
      }, 10000);

      // Listen for SoX process to exit
      this.recorder.soxProcess.on("close", (code, signal) => {
        clearTimeout(timeout);
        // Accept both normal exit (code 0) and SIGTERM termination (code null)
        if (code === 0 || code === null || signal === "SIGTERM") {
          // Wait a bit more for file system to flush
          setTimeout(resolve, 500);
        } else {
          reject(
            new Error(`SoX process exited with code ${code}, signal ${signal}`)
          );
        }
      });

      // If process already exited, resolve immediately
      if (this.recorder.soxProcess.exitCode !== null) {
        clearTimeout(timeout);
        setTimeout(resolve, 500);
      }
    });
  }

  /**
   * 🎯 Get user-friendly recording suggestions (Enterprise UX)
   */
  getRecordingSuggestion(errorMessage) {
    if (
      errorMessage.includes("VS Code") ||
      errorMessage.includes("microphone permission") ||
      errorMessage.includes("enterprise")
    ) {
      return {
        title: "VS Code Microphone Access Restricted",
        message:
          "Voice recording may be limited in VS Code due to security restrictions:",
        actions: [
          {
            platform: "All",
            instruction: "Check system microphone permissions",
            command: "Ensure VS Code has microphone access in system settings",
          },
          {
            platform: "Enterprise",
            instruction: "Contact IT administrator",
            command: "Enterprise policies may restrict microphone access",
          },
          {
            platform: "Alternative",
            instruction: "Use external terminal",
            command: "Run the extension in a regular terminal if possible",
          },
        ],
        alternative:
          "Voice features may be limited in enterprise VS Code environments",
      };
    }

    if (errorMessage.includes("SoX") || errorMessage.includes("sox")) {
      return {
        title: "Audio Recording System Unavailable",
        message: "The bundled audio recording system is not available:",
        actions: [
          {
            platform: "Windows",
            instruction: "Restart VS Code as administrator",
            command: "Right-click VS Code → Run as administrator",
          },
          {
            platform: "macOS",
            instruction: "Check microphone permissions",
            command: "System Preferences → Security & Privacy → Microphone",
          },
          {
            platform: "Linux",
            instruction: "Check audio system",
            command:
              "sudo apt install sox (Ubuntu/Debian) or sudo yum install sox (RHEL/CentOS)",
          },
        ],
        alternative: "Or use browser-based voice input (coming soon)",
      };
    }

    if (errorMessage.includes("node-record-lpcm16")) {
      return {
        title: "Audio Recording Dependencies Missing",
        message: "Required audio libraries are not available.",
        actions: [
          {
            platform: "All",
            instruction: "Reinstall extension dependencies",
            command: "Restart VS Code and try again",
          },
        ],
        alternative:
          "Contact your system administrator for enterprise deployment support",
      };
    }

    return {
      title: "Voice Recording Unavailable",
      message: "Audio recording is not available on this system.",
      actions: [
        {
          platform: "All",
          instruction: "Use text input instead",
          command: "Type your message in the chat input",
        },
      ],
      alternative: "Voice features will be enhanced in future updates",
    };
  }

  /**
   * Stop recording and transcribe audio
   */
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recorder) {
        throw new Error("No recording in progress");
      }

      this.logger.info("🎤 Stopping voice recording...");

      // Stop the recorder (handle both FileBasedSoxRecorder and legacy node-record-lpcm16)
      if (this.recorder.stopRecording) {
        // FileBasedSoxRecorder method
        this.recorder.stopRecording();
      } else if (this.recorder.stop) {
        // Legacy node-record-lpcm16 method
        this.recorder.stop();
      } else {
        this.logger.warn("🎤 Unknown recorder type, attempting generic stop");
      }

      this.isRecording = false;

      // Wait for SoX process to finish and file to be written
      await this.waitForRecordingCompletion();

      // Check if audio file exists and has content
      if (!fs.existsSync(this.audioFile)) {
        throw new Error("Recording file was not created");
      }

      const stats = fs.statSync(this.audioFile);
      if (stats.size === 0) {
        throw new Error("Audio file is empty");
      }

      this.logger.info(
        `🎤 Audio file created: ${this.audioFile} (${stats.size} bytes)`
      );

      // Transcribe the audio
      const transcription = await this.transcribeAudio(this.audioFile);

      // Clean up audio file and recorder resources
      try {
        // Use FileBasedSoxRecorder cleanup if available
        if (this.recorder && this.recorder.cleanup) {
          this.recorder.cleanup();
          this.logger.info("🎤 FileBasedSoxRecorder cleanup completed");
        } else {
          // Fallback: manual file cleanup for legacy recorders
          fs.unlinkSync(this.audioFile);
          this.logger.info("🎤 Temporary audio file cleaned up");
        }
      } catch (cleanupError) {
        this.logger.warn("🎤 Failed to clean up audio file:", cleanupError);
      }

      return {
        success: true,
        text: transcription,
        message: "Recording completed and transcribed",
      };
    } catch (error) {
      this.logger.error("🎤 Failed to stop recording:", error);

      // Clean up on error
      try {
        if (this.recorder && this.recorder.cleanup) {
          // Use FileBasedSoxRecorder cleanup
          this.recorder.cleanup();
        } else if (this.audioFile && fs.existsSync(this.audioFile)) {
          // Fallback: manual cleanup for legacy recorders
          fs.unlinkSync(this.audioFile);
        }
      } catch (cleanupError) {
        this.logger.warn(
          "🎤 Failed to clean up audio file on error:",
          cleanupError
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transcribe audio file to text using selected engine
   */
  async transcribeAudio(audioFilePath) {
    try {
      // Check if voice is enabled
      if (!this.voiceSettings?.enabled) {
        throw new Error("Voice input is disabled in settings");
      }

      // Use selected engine
      switch (this.voiceSettings.engine) {
        case "openai":
          if (this.openai) {
            return await this.transcribeWithWhisper(audioFilePath);
          } else {
            this.logger.warn(
              "🎤 OpenAI not available, falling back to free engine"
            );
            return await this.transcribeWithVosk(audioFilePath);
          }

        case "google":
          if (this.speechClient) {
            return await this.transcribeWithGoogle(audioFilePath);
          } else {
            this.logger.warn(
              "🎤 Google Speech not available, falling back to free engine"
            );
            return await this.transcribeWithVosk(audioFilePath);
          }

        case "azure":
          // Azure Speech implementation placeholder
          this.logger.warn(
            "🎤 Azure Speech not yet implemented, falling back to free engine"
          );
          return await this.transcribeWithVosk(audioFilePath);

        case "free":
        default:
          return await this.transcribeWithVosk(audioFilePath);
      }
    } catch (error) {
      this.logger.error("🎤 Transcription failed:", error);
      return "Sorry, I could not understand the audio. Please try again.";
    }
  }

  /**
   * Transcribe using free Vosk engine (offline)
   */
  async transcribeWithVosk(audioFilePath) {
    try {
      this.logger.info("🎤 Transcribing with Vosk (free engine)...");

      // For now, use mock transcription as placeholder
      // TODO: Implement actual Vosk integration in Phase 3
      return await this.mockTranscription();
    } catch (error) {
      this.logger.error("🎤 Vosk transcription failed:", error);
      throw error;
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  async transcribeWithWhisper(audioFilePath) {
    try {
      this.logger.info("🎤 Transcribing with OpenAI Whisper...");

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        language: "en", // Can be made configurable
      });

      const text = transcription.text.trim();
      this.logger.info(`🎤 Whisper transcription: "${text}"`);

      return text || "No speech detected. Please try again.";
    } catch (error) {
      this.logger.error("🎤 Whisper transcription failed:", error);
      throw error;
    }
  }

  /**
   * Transcribe using Google Speech-to-Text API
   */
  async transcribeWithGoogle(audioFilePath) {
    try {
      this.logger.info("🎤 Transcribing with Google Speech-to-Text...");

      // Read audio file
      const audioBytes = fs.readFileSync(audioFilePath).toString("base64");

      // Configure request
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-US",
        },
      };

      // Perform transcription
      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");

      const text = transcription.trim();
      this.logger.info(`🎤 Google Speech transcription: "${text}"`);

      return text || "No speech detected. Please try again.";
    } catch (error) {
      this.logger.error("🎤 Google Speech transcription failed:", error);
      throw error;
    }
  }

  /**
   * Mock transcription for testing/fallback
   */
  async mockTranscription() {
    this.logger.info("🎤 Using mock transcription (free engine placeholder)");

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockResponses = [
      "Hello, this is a test voice message",
      "Can you help me with my code?",
      "Please explain this function",
      "What does this error mean?",
      "How do I fix this bug?",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];
    this.logger.info(`🎤 Mock transcription: "${randomResponse}"`);

    return randomResponse;
  }

  /**
   * Cancel current recording
   */
  async cancelRecording() {
    try {
      if (this.isRecording && this.recorder) {
        this.recorder.stop();
        this.isRecording = false;

        // Clean up audio file
        if (this.audioFile && fs.existsSync(this.audioFile)) {
          fs.unlinkSync(this.audioFile);
        }

        this.logger.info("🎤 Recording cancelled");
      }
    } catch (error) {
      this.logger.error("🎤 Failed to cancel recording:", error);
    }
  }

  /**
   * Check if recording is currently active and get engine status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      voiceEnabled: this.voiceSettings?.enabled || false,
      selectedEngine: this.voiceSettings?.engine || "free",
      engines: {
        free: true, // Always available
        openai: !!this.openai,
        google: !!this.speechClient,
      },
    };
  }

  /**
   * Get detailed voice engine status for settings UI
   */
  getVoiceEngineStatus() {
    return {
      enabled: this.voiceSettings?.enabled || false,
      selectedEngine: this.voiceSettings?.engine || "free",
      engines: {
        free: {
          available: true,
          name: "Free (Vosk)",
          description: "100% free offline voice recognition",
        },
        openai: {
          available: !!this.openai,
          name: "OpenAI Whisper",
          description: "High-accuracy cloud transcription",
          requiresKey: true,
          hasKey: !!this.openai,
        },
        google: {
          available: !!this.speechClient,
          name: "Google Speech",
          description: "Google Cloud Speech-to-Text",
          requiresKey: true,
          hasKey: !!this.speechClient,
        },
      },
    };
  }

  /**
   * Update voice settings (called when settings change)
   */
  async updateVoiceSettings(newSettings) {
    if (newSettings) {
      this.voiceSettings = { ...this.voiceSettings, ...newSettings };
      await this.saveVoiceSettings();
    } else {
      this.loadVoiceSettings();
    }
    await this.initializeVoiceEngines();
    this.logger.info("🎤 Voice settings updated");
  }
}

module.exports = VoiceRecordingService;
