export = VoiceRecordingService;
declare class VoiceRecordingService {
    constructor(logger: any, context: any);
    logger: any;
    context: any;
    recorder: any;
    isRecording: boolean;
    audioFile: string | null;
    speechClient: any;
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
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    /**
     * Stop recording and transcribe audio
     */
    stopRecording(): Promise<{
        success: boolean;
        text: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        text?: undefined;
        message?: undefined;
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