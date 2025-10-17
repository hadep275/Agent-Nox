export = FileBasedSoxRecorder;
declare class FileBasedSoxRecorder extends EventEmitter<[never]> {
    constructor(options?: {});
    options: {
        sampleRate: number;
        channels: number;
        audioType: string;
        duration: number;
        soxPath: string;
    };
    tempFile: string | null;
    soxProcess: null;
    isRecording: boolean;
    /**
     * Start recording audio to a temporary file
     * @returns {string} Path to the recording file (starts immediately)
     */
    startRecording(): string;
    /**
     * Stop the current recording
     */
    stopRecording(): void;
    /**
     * Read the recorded audio file as a buffer
     * @returns {Buffer} Audio data
     */
    getAudioBuffer(): Buffer;
    /**
     * Clean up temporary files with retry logic for file locking issues
     */
    cleanup(): void;
    /**
     * Cleanup with retry logic to handle Windows file locking
     */
    cleanupWithRetry(attempt: any): void;
    /**
     * Build platform-specific SoX arguments
     */
    buildRecordingArgs(): (string | null)[];
}
import { EventEmitter } from "events";
//# sourceMappingURL=file-based-sox-recorder.d.ts.map