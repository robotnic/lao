# Audio Assets Directory

## Purpose

This directory stores pre-recorded audio files for the Lao Language Learning App.

## Current Status

📦 **Directory created** - Ready to receive audio files
⏳ **Audio generation pending** - See [AUDIO_PIPELINE.md](../AUDIO_PIPELINE.md) for generation options

## File Naming Convention

All audio files follow the naming pattern from `knowledge_base.json`:

### Format
```
{audio_key}.mp3
```

### Examples

**Alphabet (Consonants):**
- `ko_kay_v1.mp3` - ກ
- `kho_khay_v1.mp3` - ຂ
- `ngo_ngeun_v1.mp3` - ງ

**Alphabet (Vowels):**
- `a_v1.mp3` - ະ/າ
- `e_v1.mp3` - ເ
- `i_v1.mp3` - ິ

**Alphabet (Tone Marks):**
- `mai_tho_v1.mp3` - ່
- `mai_ti_v1.mp3` - ້
- `mai_khit_v1.mp3` - ໊
- `mai_tham_v1.mp3` - ໋

**Dictionary Words:**
- `sabaidee_01_v1.mp3` - ສະບາຍດີ (hello/well)
- `khao_01_v1.mp3` - ເຂົ້າ (rice)
- `gin_01_v1.mp3` - ກິນ (eat)
- `nam_01_v1.mp3` - ນ້ຳ (water)
- `bor_01_v1.mp3` - ບໍ່ (no/not)
- `man_01_v1.mp3` - ມີ (have)
- `yuu_01_v1.mp3` - ຢູ່ (be at)
- `tao_01_v1.mp3` - ເທົ່າ (how much)
- `mak_01_v1.mp3` - ຫຼາຍ (very/many)
- `lang_01_v1.mp3` - ເລີ່ມ (start)
- `an_01_v1.mp3` - ອັນ (classifier)
- `man_khon_01_v1.mp3` - ຄົນ (person classifier)

**Phrases:**
- `ph_01_v1.mp3` - ສະບາຍດີ ຫຼາຍ (very well)
- `ph_02_v1.mp3` - ກິນ ເຂົ້າ (eat rice)
- `ph_03_v1.mp3` - ນ້ຳ ຫຼາຍ (lots of water)
- `ph_04_v1.mp3` - ມີ ບໍ່ (do you have)
- `ph_05_v1.mp3` - ຢູ່ ບໍ່ (not here)
- `ph_06_v1.mp3` - ກິນ ບໍ່ (don't eat)

## Total Files Expected

- **Alphabet:** 43 files (21 consonants + 13 vowels + 4 tone marks + 5 special)
- **Dictionary:** 12 files
- **Phrases:** 6 files
- **Total:** ~61 audio files

## Audio Specifications

**Recommended for Web:**
- Format: MP3
- Bitrate: 128 kbps
- Sample Rate: 44.1 kHz
- Channels: Mono
- Duration: 1-5 seconds per file
- Total Size: ~25-50 MB

## How Audio is Used

The app uses a **fallback strategy**:

1. **Primary:** Check for pre-recorded audio file
2. **Fallback:** Use Web Speech API (TTS) if file not found
3. **Result:** Audio always plays, whether from file or synthesized

## Setup Instructions

See [AUDIO_PIPELINE.md](../AUDIO_PIPELINE.md) for detailed instructions on:
- Generating audio with Google Cloud TTS
- Using Azure Cognitive Services
- Local generation with espeak and ffmpeg
- Recording with native speakers

## Quick Start: Google Cloud TTS

```bash
# 1. Setup Google Cloud
# - Create project
# - Enable Text-to-Speech API
# - Create service account and download JSON key

# 2. Install dependencies
npm install @google-cloud/text-to-speech

# 3. Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# 4. Run generation script
npm run generate-audio
```

**Estimated cost:** ~$0.02 per 1,000 requests (~$1.20 for all 61 files)

## Testing

Verify all audio files are accessible:

```bash
# Check file count
ls -1 *.mp3 | wc -l
# Should show: 61

# Check total size
du -sh .
# Should be: 25-50M

# Play a file
ffplay ko_kay_v1.mp3
```

## PWA Caching

When audio files are added, they're automatically cached for 90 days offline access via `ngsw-config.json`.

## Future Enhancements

- [ ] Add high-quality native speaker recordings
- [ ] Support multiple voice variants (male/female)
- [ ] Add regional dialect variants
- [ ] Implement pronunciation feedback using Web Audio API
