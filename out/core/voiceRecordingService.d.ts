export = VoiceRecordingService;
declare class VoiceRecordingService {
    constructor(logger: any, context: any);
    logger: any;
    context: any;
    recorder: any;
    isRecording: boolean;
    audioFile: any;
    speechClient: import("@google-cloud/speech/build/src/v1").SpeechClient | null;
    openai: any;
    voiceSettings: any;
    /**
     * Load voice settings from Nox workspace state
     */
    loadVoiceSettings(): void;
    /**
     * Save voice settings to Nox workspace state
     */
    saveVoiceSettings(): Promise<void>;
    /**
     * Initialize voice engines based on settings
     */
    initializeVoiceEngines(): Promise<void>;
    /**
     * Initialize OpenAI client for Whisper API
     */
    initializeOpenAI(): Promise<void>;
    /**
     * Initialize Google Speech-to-Text client
     */
    initializeGoogleSpeech(): void;
    /**
     * Start recording audio from microphone
     */
    startRecording(): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        error: any;
        suggestion: {
            title: string;
            message: string;
            actions: {
                platform: string;
                instruction: string;
                command: string;
            }[];
            alternative: string;
        };
    }>;
    /**
     * 🔍 Detect available recording capabilities (Enterprise-grade)
     */
    detectRecordingCapability(): Promise<{
        available: boolean;
        method: string;
        recorderClass: typeof import("../utils/file-based-sox-recorder");
        soxPath: string;
        error?: undefined;
    } | {
        available: boolean;
        error: string;
        method?: undefined;
        recorderClass?: undefined;
        soxPath?: undefined;
    }>;
    /**
     * 🎤 Start recording with specific method
     */
    startRecordingWithMethod(method: any, recorderClass?: null, soxPath?: null): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 🎤 Start recording using node-record-lpcm16 with bundled SoX (Enterprise method)
     */
    startNodeRecording(record: any, soxPath?: null): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 🎤 Start recording using FileBasedSoxRecorder (Enterprise method)
     */
    startFileBasedRecording(RecorderClass: any, soxPath?: null): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Wait for FileBasedSoxRecorder to complete recording
     */
    waitForRecordingCompletion(): Promise<any>;
    /**
     * 🎯 Get user-friendly recording suggestions (Enterprise UX)
     */
    getRecordingSuggestion(errorMessage: any): {
        title: string;
        message: string;
        actions: {
            platform: string;
            instruction: string;
            command: string;
        }[];
        alternative: string;
    };
    /**
     * Stop recording and transcribe audio
     */
    stopRecording(): Promise<{
        success: boolean;
        transcription: string;
        message: string;
        text?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        text: any;
        message: string;
        transcription?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        transcription?: undefined;
        message?: undefined;
        text?: undefined;
    }>;
    /**
     * Transcribe audio file to text using selected engine
     */
    transcribeAudio(audioFilePath: any): Promise<any>;
    /**
     * Transcribe using free Vosk engine (offline)
     */
    transcribeWithVosk(audioFilePath: any): Promise<string>;
    /**
     * Transcribe using OpenAI Whisper API
     */
    transcribeWithWhisper(audioFilePath: any): Promise<any>;
    /**
     * Transcribe using Google Speech-to-Text API
     */
    transcribeWithGoogle(audioFilePath: any): Promise<any>;
    /**
     * Mock transcription for testing/fallback
     */
    mockTranscription(): Promise<string>;
    /**
     * Cancel current recording
     */
    cancelRecording(): Promise<void>;
    /**
     * Check if recording is currently active and get engine status
     */
    getRecordingStatus(): {
        isRecording: boolean;
        voiceEnabled: any;
        selectedEngine: any;
        engines: {
            free: boolean;
            openai: boolean;
            google: boolean;
        };
    };
    /**
     * Get detailed voice engine status for settings UI
     */
    getVoiceEngineStatus(): {
        enabled: any;
        selectedEngine: any;
        engines: {
            free: {
                available: boolean;
                name: string;
                description: string;
            };
            openai: {
                available: boolean;
                name: string;
                description: string;
                requiresKey: boolean;
                hasKey: boolean;
            };
            google: {
                available: boolean;
                name: string;
                description: string;
                requiresKey: boolean;
                hasKey: boolean;
            };
        };
    };
    /**
     * Update voice settings (called when settings change)
     */
    updateVoiceSettings(newSettings: any): Promise<void>;
}
//# sourceMappingURL=voiceRecordingService.d.ts.map