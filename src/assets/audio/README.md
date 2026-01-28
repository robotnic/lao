# Audio Assets

This directory contains MP3 audio files for the Lao Language Learning App.

## File Structure

Audio files are organized by `audio_key` from the knowledge base:
- **Naming Convention:** `${audio_key}.mp3`
- **Format:** MP3 (128kbps for mobile optimization)
- **Language:** Lao (primarily), with English translations available via TTS fallback

## Categories

### Alphabet Sounds
- `ko_kay_v1.mp3` - ກ (ko)
- `kho_khwai_v1.mp3` - ຂ (kho)
- etc. (one for each consonant, vowel, tone mark)

### Dictionary Words
- `sabaidee_v1.mp3` - ສະບາຍດີ (hello)
- `khop_khap_v1.mp3` - ຂອບໃຈ (thank you)
- etc. (one for each vocabulary word)

### Phrases
- `sabaidee_kang_v1.mp3` - ສະບາຍດີແມ່ນ (How are you?)
- etc. (one for each phrase)

## Generation

Audio files are batch-generated using the GitHub Actions workflow:
- **Script:** `.github/workflows/generate-audio-incremental.yml`
- **API:** Google Gemini 2.5 Flash TTS
- **Voices:** Charon (male) or Aoede (female), alternating
- **Rate Limiting:** 2 files per workflow run, 125-second delays (respecting 3 req/min free tier)

### Manual Generation (Local)

To generate audio files locally:

```bash
cd scripts
node generate-audio-incremental.js
```

**Note:** Requires `GEMINI_API_KEY` environment variable and outbound access to `generativelanguage.googleapis.com`. If local generation is blocked by a firewall, use the GitHub Actions workflow instead.

## Encoding Specifications

- **Codec:** MP3
- **Bitrate:** 128 kbps (mobile-optimized)
- **Sample Rate:** 48 kHz (from Gemini API)
- **Channels:** Mono
- **Target Size:** 2-5 MB total for full knowledge base

## Usage in App

AudioService automatically attempts to play audio by `audio_key`:

```typescript
// Play audio with TTS fallback
audioService.playAudio('sabaidee_v1', 'ສະບາຍດີ', 'lo-LA');

// Shorthand for Lao
audioService.playLao('sabaidee_v1', 'ສະບາຍດີ');

// Shorthand for English
audioService.playEnglish('thank_you_v1', 'thank you');
```

If `sabaidee_v1.mp3` doesn't exist, AudioService falls back to Web Speech API TTS synthesis.

## Adding New Audio Files

1. Update `knowledge_base.json` with new `audio_key` field
2. Trigger GitHub Actions workflow: `generate-audio-incremental`
3. Workflow auto-commits generated `.mp3` files to this directory
4. Audio becomes available in app automatically

## Performance Considerations

- Audio files are cached by browser after first load
- PWA strategy caches audio for 90 days offline
- Mobile users: Compression to 128kbps keeps app bundle small
- Total target: < 5 MB for full alphabet + 100+ words
