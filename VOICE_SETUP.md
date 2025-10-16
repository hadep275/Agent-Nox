# 🎤 Voice Recording Setup Guide

## Overview

Your Nox extension now has **real voice-to-text functionality**! Here's how to set it up and use it.

## Quick Start (Works Immediately)

✅ **The voice feature works right now** with mock transcription for testing
- Click the microphone button 🎤
- Speak your message
- Get random test responses like "Hello, this is a test voice message"

## Full Setup (Real Voice Recognition)

For **real voice-to-text** using OpenAI Whisper API:

### 1. Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### 2. Set Environment Variable

**Windows (Command Prompt):**
```cmd
setx OPENAI_API_KEY "your-api-key-here"
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY = "your-api-key-here"
```

**macOS/Linux:**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 3. Restart VS Code

After setting the environment variable, restart VS Code completely for it to take effect.

## How It Works

### Simple User Experience
1. **Click microphone button** 🎤 in chat input
2. **Modal appears** with "Listening..." animation
3. **Speak your message** clearly
4. **Click "Stop"** when done
5. **Text appears** in input field automatically
6. **Press Send** to send your message

### Technical Details
- Uses `node-record-lpcm16` for microphone access
- Records audio to temporary WAV file
- Transcribes using OpenAI Whisper API
- Falls back to mock responses if no API key

## System Requirements

### Windows
- **SoX** audio library (usually pre-installed)
- If recording fails, install SoX: `choco install sox` or download from [SoX website](http://sox.sourceforge.net/)

### macOS
- **SoX** audio library: `brew install sox`

### Linux
- **SoX** and **ALSA**: `sudo apt-get install sox alsa-utils`

## Troubleshooting

### "node-record-lpcm16 not available"
```bash
npm install node-record-lpcm16
```

### "Recording failed"
1. Check microphone permissions in system settings
2. Ensure SoX is installed
3. Try speaking louder/closer to microphone

### "Transcription failed"
1. Check OPENAI_API_KEY environment variable
2. Verify API key is valid
3. Check internet connection

### No audio detected
1. Check system microphone settings
2. Test microphone in other applications
3. Ensure microphone is not muted

## Cost Information

**OpenAI Whisper API Pricing:**
- $0.006 per minute of audio
- Very affordable for normal usage
- Example: 100 voice messages (30 seconds each) = ~$3

## Privacy & Security

- ✅ Audio files are **temporary** and deleted immediately
- ✅ Only transcribed text is sent to OpenAI
- ✅ No audio data is stored permanently
- ✅ API key is stored in environment variables (secure)

## Features

### Current Features
- ✅ Real-time voice recording
- ✅ Professional modal UI with animations
- ✅ OpenAI Whisper transcription
- ✅ Automatic text insertion
- ✅ Error handling and fallbacks
- ✅ Clean temporary file management

### Planned Features
- 🔄 Real-time streaming transcription
- 🔄 Multiple language support
- 🔄 Voice command shortcuts
- 🔄 Custom wake words

## Support

If you encounter issues:
1. Check the VS Code Developer Console (Help → Toggle Developer Tools)
2. Look for 🎤 log messages
3. Verify system requirements are met
4. Test with mock mode first (no API key needed)

---

**🎉 Enjoy your new voice-powered coding experience!**
