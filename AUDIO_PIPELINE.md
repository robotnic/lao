# Audio Asset Pipeline

## Overview

The app supports two audio delivery mechanisms:

1. **Web Speech API (TTS)** - ✅ Currently active
   - Client-side speech synthesis
   - Works everywhere, no API key needed
   - Quality varies by browser/OS
   - Real-time synthesis

2. **Pre-recorded Audio Files** - 📦 Optional
   - Higher quality Native speaker audio
   - Requires external generation/sourcing
   - Better for learning pronunciation

## Current Status

✅ **TTS Integration:** Working with Web Speech API
- Alphabet characters speak on selection
- Tone marks play with TTS
- Respects speed & volume settings
- Lao language (lo-LA) and English (en-US) supported

⏳ **Audio Files:** Directory ready, files pending
- Location: `/src/assets/audio/`
- Naming convention: `{audio_key}.mp3`
- Example: `ko_kay_v1.mp3`, `sabaidee_01_v1.mp3`

## Audio File Naming Convention

All audio keys are defined in `knowledge_base.json`:

### Alphabet (43 files)
- Consonants: `ko_kay_v1.mp3`, `kho_khay_v1.mp3`, etc.
- Vowels: `a_v1.mp3`, `e_v1.mp3`, etc.
- Tone marks: `mai_tho_v1.mp3`, `mai_ti_v1.mp3`, etc.

### Dictionary (12 files)
- `sabaidee_01_v1.mp3` (ສະບາຍດີ - hello)
- `khao_01_v1.mp3` (ເຂົ້າ - rice)
- `gin_01_v1.mp3` (ກິນ - eat)
- etc.

### Phrases (6 files)
- `ph_01_v1.mp3` (ສະບາຍດີ ຫຼາຍ - very well)
- `ph_02_v1.mp3` (ກິນ ເຂົ້າ - eat rice)
- etc.

**Total files needed:** ~61 audio files

## Options for Audio Generation

### Option 1: Google Cloud Text-to-Speech (Recommended for production)

**Advantages:**
- Higher quality than browser TTS
- Native Lao speaker voices
- Consistent across devices

**Steps:**
1. Setup Google Cloud account with Text-to-Speech API enabled
2. Use service account credentials (JSON key file)
3. Run audio generation script:

```bash
# Install dependencies
npm install @google-cloud/text-to-speech

# Generate all audio files (requires API key in environment)
node scripts/generate-audio-google.js
```

**Script template** (`scripts/generate-audio-google.js`):
```javascript
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const kb = require('./src/assets/data/knowledge_base.json');

const client = new textToSpeech.TextToSpeechClient();

async function generateAudio() {
  const audioDir = path.join(__dirname, '../src/assets/audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // Generate alphabet audio
  for (const char of kb.alphabet) {
    const request = {
      input: { text: char.lao },
      voice: { languageCode: 'lo', name: 'lo-LO-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(
      path.join(audioDir, `${char.audio_key}.mp3`),
      response.audioContent,
      'binary'
    );
    console.log(`Generated: ${char.audio_key}.mp3`);
  }

  // Similar loops for dictionary and phrases...
}

generateAudio().catch(console.error);
```

**Cost:** ~$0.02 per 1,000 requests (~$1.20 for all 61 files)

### Option 2: Azure Cognitive Services

**Setup:**
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

Similar to Google Cloud but with Azure pricing.

### Option 3: Local Generation (ffmpeg + espeak)

**Advantages:**
- Free
- No API keys
- Works offline

**Setup:**
```bash
# Install ffmpeg and espeak
sudo apt-get install ffmpeg espeak-ng

# Generate audio
node scripts/generate-audio-local.js
```

**Script template** (`scripts/generate-audio-local.js`):
```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const kb = require('./src/assets/data/knowledge_base.json');

async function generateAudio() {
  const audioDir = path.join(__dirname, '../src/assets/audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  for (const char of kb.alphabet) {
    const outputFile = path.join(audioDir, `${char.audio_key}.mp3`);
    const command = `echo "${char.lao}" | espeak-ng -l lo -w - | ffmpeg -i - -q:a 9 -acodec libmp3lame "${outputFile}"`;
    
    try {
      await execPromise(command);
      console.log(`Generated: ${char.audio_key}.mp3`);
    } catch (e) {
      console.error(`Failed: ${char.audio_key}`, e);
    }
  }
}

generateAudio();
```

**Quality:** Lower than Google Cloud or Azure

### Option 4: Manual Recording

**Best for:**
- High-quality native speaker audio
- Premium version of app
- User recordings for practice feedback

**Process:**
1. Hire native Lao speaker(s)
2. Record each alphabet item, word, and phrase
3. Normalize audio levels
4. Convert to MP3 (128 kbps recommended)
5. Save to `/src/assets/audio/` with correct naming

## How the App Uses Audio Files

### Current Flow (TTS Only):
```
User clicks Play → TtsService.speak() → Browser synthesizes → Audio plays
```

### With Audio Files (Recommended):
```
User clicks Play → Check if audio file exists
  ├─ YES → Load from /assets/audio/{audio_key}.mp3 → Play
  └─ NO → Fallback to TtsService.speak() → TTS synthesis → Play
```

**Enhanced AudioService** (ready to implement):
```typescript
export class AudioService {
  playAudio(audioKey: string, text: string, language: string = 'lo-LA') {
    const audioPath = `/assets/audio/${audioKey}.mp3`;
    
    // Try to load audio file
    const audio = new Audio(audioPath);
    audio.onerror = () => {
      // Fallback to TTS if file not found
      this.tts.speak(text, language);
    };
    
    audio.play();
  }
}
```

## Recommended Next Steps

1. **Short term (Development):**
   - Use TTS only (currently working)
   - No additional setup needed
   - Sufficient for testing and learning

2. **Medium term (Beta):**
   - Generate audio files using Google Cloud TTS
   - Store in `/src/assets/audio/`
   - Implement AudioService with TTS fallback
   - Compress to 128 kbps (~3-5 seconds × 61 = ~20-30 MB total)

3. **Long term (Production):**
   - Record with native Lao speaker
   - Higher quality for premium version
   - Consider multiple voice variants

## Testing Audio Files

Once files are added:

```bash
# Verify all expected files exist
ls -la src/assets/audio/ | wc -l
# Should show ~61 files + . + .. = 63 lines

# Check file sizes
du -sh src/assets/audio/
# Should be ~25-50 MB depending on bitrate
```

## Audio Compression Settings

**Recommended for web:**
- Codec: MP3
- Bitrate: 128 kbps (good quality)
- Sample rate: 44.1 kHz
- Mono (not stereo)

**Example with ffmpeg:**
```bash
ffmpeg -i input.wav -codec:a libmp3lame -q:a 4 -ac 1 output.mp3
```

## PWA Caching Strategy

Once audio files are added, update `ngsw-config.json`:

```json
{
  "assetGroups": [
    {
      "name": "audio",
      "resources": {
        "files": [
          "/assets/audio/*.mp3"
        ]
      },
      "cacheConfig": {
        "maxSize": 52428800,
        "maxAge": "90d",
        "timeout": "10s"
      }
    }
  ]
}
```

This caches audio files for 90 days with 50 MB budget for offline playback.

## Estimated Timeline

- **TTS only:** Already working ✅
- **Google Cloud generation:** 1-2 hours (+ ~$1.20 API cost)
- **Native speaker recording:** 2-4 weeks (+ ~$200-500 talent cost)

Choose based on your priority: quality, cost, or timeline.
