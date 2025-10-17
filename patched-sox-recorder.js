/**
 * Patched SoX recorder for node-record-lpcm16
 * Fixes the hardcoded 'sox' command and Windows device detection issues
 */

const os = require('os');

module.exports = (options) => {
  // Use bundled SoX path if provided, otherwise fall back to system 'sox'
  const cmd = options.soxPath || 'sox';
  
  const platform = os.platform();
  let args = [];

  // Platform-specific device configuration
  if (platform === 'win32') {
    // Windows: Use waveaudio driver instead of --default-device
    args = [
      '-t', 'waveaudio', '-d', // Windows waveaudio driver with default device
      '--no-show-progress', // show no progress
      '--rate', options.sampleRate, // sample rate
      '--channels', options.channels, // channels
      '--encoding', 'signed-integer', // sample encoding
      '--bits', '16', // precision (bits)
      '--type', options.audioType, // audio type
      '-' // pipe to stdout
    ];
  } else if (platform === 'darwin') {
    // macOS: Use coreaudio driver
    args = [
      '-t', 'coreaudio', '-d', // macOS coreaudio driver with default device
      '--no-show-progress',
      '--rate', options.sampleRate,
      '--channels', options.channels,
      '--encoding', 'signed-integer',
      '--bits', '16',
      '--type', options.audioType,
      '-'
    ];
  } else {
    // Linux and others: Use ALSA (or fall back to original behavior)
    args = [
      '-t', 'alsa', '-d', // Linux ALSA driver with default device
      '--no-show-progress',
      '--rate', options.sampleRate,
      '--channels', options.channels,
      '--encoding', 'signed-integer',
      '--bits', '16',
      '--type', options.audioType,
      '-'
    ];
  }

  // Add silence detection if enabled
  if (options.endOnSilence) {
    args = args.concat([
      'silence', '1', '0.1', options.thresholdStart || options.threshold + '%',
      '1', options.silence, options.thresholdEnd || options.threshold + '%'
    ]);
  }

  return {
    cmd: cmd,
    args: args,
    options: {
      encoding: 'binary'
    }
  };
};
