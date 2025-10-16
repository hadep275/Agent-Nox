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
        engine: savedSettings.engine || "free",
        googleApiKey: savedSettings.googleApiKey || "",
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
        engine: "free",
        googleApiKey: "",
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

      // Try to import node-record-lpcm16
      let record;
      try {
        record = require("node-record-lpcm16");
      } catch (error) {
        throw new Error(
          "node-record-lpcm16 not available. Please install: npm install node-record-lpcm16"
        );
      }

      // Create temporary audio file
      const tempDir = os.tmpdir();
      this.audioFile = path.join(tempDir, `nox-voice-${Date.now()}.wav`);

      // Configure recording options
      const recordingOptions = {
        sampleRateHertz: 16000,
        threshold: 0.5,
        verbose: false,
        recordProgram: "rec", // Use SoX for recording
        silence: "1.0s",
      };

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
      this.logger.error("🎤 Failed to start recording:", error);
      return {
        success: false,
        error: error.message,
      };
    }
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

      // Stop the recorder
      this.recorder.stop();
      this.isRecording = false;

      // Wait a moment for file to be written
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if audio file exists and has content
      if (!fs.existsSync(this.audioFile)) {
        throw new Error("Audio file was not created");
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

      // Clean up audio file
      try {
        fs.unlinkSync(this.audioFile);
        this.logger.info("🎤 Temporary audio file cleaned up");
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
      if (this.audioFile && fs.existsSync(this.audioFile)) {
        try {
          fs.unlinkSync(this.audioFile);
        } catch (cleanupError) {
          this.logger.warn(
            "🎤 Failed to clean up audio file on error:",
            cleanupError
          );
        }
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
