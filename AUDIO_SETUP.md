# Audio Generation Setup Guide

## Quick Start

### Option 1: Google Cloud TTS (Recommended)
**Quality:** ⭐⭐⭐⭐⭐ | **Cost:** ~$1.20 | **Time:** 1-2 hours

#### Step 1: Create Google Cloud Project
```bash
# Go to https://console.cloud.google.com/
# 1. Create new project
# 2. Enable Text-to-Speech API
# 3. Create Service Account:
#    - Go to IAM & Admin > Service Accounts
#    - Create new service account
#    - Grant "Cloud Text-to-Speech API User" role
#    - Create and download JSON key file
```

#### Step 2: Setup Environment
```bash
# Save the JSON key file somewhere safe
# Set environment variable (add to ~/.bashrc or ~/.zshrc for persistence)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

#### Step 3: Install Dependencies
```bash
npm install @google-cloud/text-to-speech
```

#### Step 4: Generate Audio
```bash
npm run generate-audio-google
```

This will:
- Read all entries from `knowledge_base.json`
- Call Google Cloud TTS API for each entry
- Save MP3 files to `/src/assets/audio/`
- Show progress and summary

**Expected output:**
```
✅ Generated: 61 files
📊 Total audio size: 35.50 MB
```

---

### Option 2: Local Generation (Free)
**Quality:** ⭐⭐⭐ | **Cost:** Free | **Time:** 10 minutes

#### Step 1: Install Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg espeak-ng

# macOS
brew install ffmpeg espeak-ng

# Fedora
sudo dnf install ffmpeg espeak-ng
```

#### Step 2: Generate Audio
```bash
npm run generate-audio-local
```

This will:
- Use espeak-ng for text-to-speech synthesis
- Convert to MP3 using ffmpeg
- Save files to `/src/assets/audio/`

**Note:** Uses English voice (Lao language support varies)

**Expected output:**
```
✅ Generated: 61 files
📊 Total audio size: 28.20 MB
```

---

## Comparison

| Feature | Google Cloud | Local | TTS Only |
|---------|-------------|-------|----------|
| Quality | Very Good | Good | Fair |
| Cost | ~$1.20 | Free | Free |
| Setup Time | 1-2 hours | 10 min | 0 min |
| Lao Support | Excellent | Poor | Good |
| Current Status | Ready to use | Ready to use | ✅ Working |

---

## Troubleshooting

### Google Cloud Errors

**Error: `Error: 401 Unauthorized`**
- Fix: Make sure `GOOGLE_APPLICATION_CREDENTIALS` env var is set correctly
```bash
echo $GOOGLE_APPLICATION_CREDENTIALS  # Should show your path
```

**Error: `Cannot find module '@google-cloud/text-to-speech'`**
- Fix: Install the dependency
```bash
npm install @google-cloud/text-to-speech
```

**Error: `Text-to-Speech API not enabled`**
- Fix: Go to Google Cloud Console and enable the API for your project

### Local Generation Errors

**Error: `ffmpeg: command not found`**
- Fix: Install ffmpeg
```bash
sudo apt-get install ffmpeg
```

**Error: `espeak-ng: command not found`**
- Fix: Install espeak-ng
```bash
sudo apt-get install espeak-ng
```

---

## After Generation

Once audio files are generated:

1. **Verify files exist:**
   ```bash
   ls -la src/assets/audio/ | head -20
   # Should show .mp3 files
   ```

2. **Check app still works:**
   ```bash
   npm start
   # App should run normally at http://localhost:4201
   ```

3. **Test audio:**
   - Click "Play" buttons in Alphabet Explorer
   - You should hear the audio files (not browser TTS)
   - If files are missing, it falls back to TTS automatically

4. **Build for production:**
   ```bash
   npm run build:prod
   # Audio files are automatically included in the build
   ```

---

## Using Generated Audio

The app automatically:
1. ✅ Detects audio files in `/assets/audio/`
2. ✅ Plays them when available
3. ✅ Falls back to TTS if missing
4. ✅ Caches them for offline use (PWA)
5. ✅ No code changes needed

---

## Storage & Bandwidth

**Audio Directory Size:**
- Google Cloud: ~35 MB
- Local espeak: ~28 MB
- Grows by ~600KB per new entry added

**Caching:**
- PWA caches files for 90 days
- First load downloads all files (~5-10 seconds)
- Subsequent loads use cache

---

## Next Steps

**Choose one:**

1. **Google Cloud (Recommended)**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
   npm install @google-cloud/text-to-speech
   npm run generate-audio-google
   ```

2. **Local (Free)**
   ```bash
   sudo apt-get install ffmpeg espeak-ng
   npm run generate-audio-local
   ```

3. **Keep TTS Only**
   - App works fine as-is ✅
   - No generation needed

---

## Support

For issues:
1. Check error message details
2. Verify environment setup
3. Try with 1-2 test entries first
4. Check logs in `/src/assets/audio/`

---

**Generated files are optional.** The app works perfectly with TTS fallback. Choose based on your priority: quality, cost, or time.
