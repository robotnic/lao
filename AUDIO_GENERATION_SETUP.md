# Incremental Audio Generation Setup

This document explains how to set up and use the GitHub Actions workflow for incremental audio file generation using the Gemini API.

## Overview

The audio generation system is designed to:
- ✅ Respect the 1,500 daily Gemini API request limit
- ✅ Skip existing audio files (only generate missing ones)
- ✅ Generate ~50 files per deployment
- ✅ Alternate between male and female voices
- ✅ Gradually build up to 200+ files over multiple deployments (15-20 days)
- ✅ Auto-commit successful files back to the repository

## Architecture

### Files

```
scripts/
├── generate-audio-incremental.js    # Main generation script
├── generate-audio-simple.js         # Local espeak-ng fallback
├── generate-audio-google.js         # Google Cloud TTS (reference)
└── generate-audio-gemini.js         # Initial Gemini script (reference)

.github/workflows/
└── generate-audio-incremental.yml   # GitHub Actions workflow

src/assets/audio/
└── *.mp3                            # Generated audio files
```

### Process Flow

```
Developer pushes to main
    ↓
GitHub Actions triggers workflow_dispatch or detects knowledge_base.json change
    ↓
Setup Node.js + environment variables
    ↓
Run generate-audio-incremental.js
    ├─ Load knowledge_base.json
    ├─ Check existing files in src/assets/audio/
    ├─ Identify missing files (up to 50 per run)
    ├─ Call Gemini API for each missing file
    │  ├─ Alternate male/female voices
    │  ├─ 2-second delay between requests (rate limiting)
    │  └─ Save MP3 to src/assets/audio/{audio_key}.mp3
    └─ Report progress
    ↓
Auto-commit new files (if any)
    ↓
Push changes back to main
```

## Setup Instructions

### 1. Set Gemini API Secret

The workflow requires a GitHub secret for the Gemini API key.

**Option A: Via GitHub Web UI**
1. Go to repository Settings → Secrets and variables → Actions
2. Create new secret: `GEMINI_API_KEY`
3. Paste your Gemini API key value

**Option B: Via GitHub CLI**
```bash
gh secret set GEMINI_API_KEY --body "your-api-key-here"
```

### 2. Verify Workflow File

Ensure `.github/workflows/generate-audio-incremental.yml` exists and is properly configured:

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### 3. Enable Actions

1. Go to Actions tab in repository
2. Ensure workflows are enabled
3. Check that "Generate Audio Incrementally" workflow appears

## Usage

### Automatic Trigger

The workflow runs automatically when:
1. **Code is pushed to `main` and `knowledge_base.json` changes**
   - Example: Adding new dictionary entries or phrases
   - Workflow automatically runs on next commit

2. **Manual trigger via GitHub CLI**
   ```bash
   gh workflow run generate-audio-incremental.yml -r main
   ```

3. **Manual trigger via GitHub Web UI**
   - Go to Actions tab
   - Select "Generate Audio Incrementally" workflow
   - Click "Run workflow" button

### Local Testing

Local runs require outbound access to `generativelanguage.googleapis.com`. If your network/firewall blocks that, run the workflow in GitHub Actions instead (recommended).

If you do have network access and want to test locally:

```bash
# Set API key
export GEMINI_API_KEY="your-gemini-api-key"

# Run generation script
node scripts/generate-audio-incremental.js
```

Expected output:
```
🚀 Starting incremental audio generation...

📊 Status:
   Existing files: 61
   Missing files: 139
   Max files per run: 50

🎵 Generating 50 files this run...

🎵 Generating nai (male voice)...
✅ Generated nai
🎵 Generating bai (female voice)...
✅ Generated bai
...

==================================================
📊 Generation Summary
==================================================
✅ Generated this run: 50
⏭️  Skipped: 0
❌ Failed: 0
📦 Total files now: 111 / 200
⏱️  Time: 156.23s

🎙️  Voice breakdown:
   Male: 25
   Female: 25

📈 Progress:
   Completed: 111/200 (55%)
   Remaining: 89
   Est. deployments to complete: 2

✨ Generation complete!
```

## Rate Limiting Strategy

### API Limits
- **Gemini API**: 1,500 requests per day
- **Per Deployment**: Max 50 files (safe margin)
- **Delay Between Files**: configured in GitHub Actions via `DELAY_BETWEEN_FILES` (defaults to 15s in the script)

### Calculation
- 50 files × 1 API call per file = 50 requests per deployment
- 1,500 ÷ 50 = 30 safe deployments per day
- Actual deployments: ~1-3 per day (due to code commits)
- **Result: Well within daily limits**

### Cost Estimation
- **Gemini API**: Free tier (up to 15 requests/minute, monthly quotas)
- **Audio Duration**: 5-10 seconds per file
- **Processing Time**: ~3 seconds per API call
- **Total Time for 200 files**: ~3,000 seconds = ~50 minutes of API calls
- **Actual Time**: Spread over 15-20 days = ~2-3 hours per day

## Voice Variants

The system alternates between male and female voices:

| File Index | Voice | Example |
|-----------|-------|---------|
| 0, 2, 4, ... | Male | `nai_male.mp3` |
| 1, 3, 5, ... | Female | `bai_female.mp3` |

**Gemini Voice Presets**:
- Male: `Charon`
- Female: `Aoede`

To modify voices, edit `scripts/generate-audio-incremental.js`:

```javascript
const VOICES = ['male', 'female'];  // Customize here

function getVoicePrompt(voice) {
  if (voice === 'male') {
    return 'Speak this in a clear male voice...';
  } else {
    return 'Speak this in a clear female voice...';
  }
}
```

## Monitoring Progress

### Via GitHub Actions
1. Go to Actions tab
2. Click "Generate Audio Incrementally"
3. View latest workflow run
4. Check step "Generate audio files" for progress

### Via Repository Files
```bash
# Count generated files
ls -1 src/assets/audio/*.mp3 | wc -l

# See recent commits
git log --oneline --max-count=10

# Check latest generation summary
git show --name-only HEAD
```

### Progress Tracking
Target: 200 total audio files

```
Deployment 1: 61 → 111/200 (55%)
Deployment 2: 111 → 161/200 (80%)
Deployment 3: 161 → 200/200 (100%)
```

**Timeline**: ~15-20 days with 1-3 deployments per day

## Troubleshooting

### Workflow doesn't trigger
- ✅ Check: Repository Actions are enabled
- ✅ Check: `GEMINI_API_KEY` secret is set
- ✅ Check: File path filters are correct in workflow YAML

### Generation script fails
- ✅ Check: `GEMINI_API_KEY` is valid
- ✅ Check: Gemini API is enabled in Google Cloud Console
- ✅ Check: API quota hasn't been exceeded (1,500/day)
- ✅ Check: Network/firewall allows HTTPS to `generativelanguage.googleapis.com`

### API quota exceeded
- Wait until next day (UTC)
- Or: Reduce MAX_FILES_PER_RUN in script (currently 50)
- Or: Increase DELAY_BETWEEN_FILES (currently 2000ms)

### Audio files not being committed
- ✅ Check: Git permissions in workflow
- ✅ Check: auto-commit action is configured correctly
- ✅ Check: Workflow file pattern matches: `src/assets/audio/*.mp3`

### Corrupted MP3 files
- Symptom: Files smaller than 10KB, audio doesn't play
- Solution: Delete corrupted files locally, run workflow again
- Root Cause: Gemini API timeout or incomplete response

## Advanced Configuration

### Change generation batch size
Edit `scripts/generate-audio-incremental.js`:
```javascript
const CONFIG = {
  MAX_FILES_PER_RUN: 50,  // Change this value (10-100 safe range)
  ...
}
```

### Change voice alternation pattern
Edit voice selection logic:
```javascript
function getVoiceForEntry(index) {
  // Current: alternates every entry
  return CONFIG.VOICES[index % CONFIG.VOICES.length];
  
  // Alternative: 50% male, 50% female
  // return Math.random() < 0.5 ? 'male' : 'female';
  
  // Alternative: all male voice
  // return 'male';
}
```

### Change delay between API calls
```javascript
const CONFIG = {
  DELAY_BETWEEN_FILES: 2000,  // milliseconds (2s = conservative)
  ...
}
```

Recommended delays:
- Conservative (2000ms): Very safe, slow
- Balanced (1000ms): Safe, moderate speed
- Aggressive (500ms): Risky, fast

## API Reference

### Gemini API Response Format
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "audio/mp3",
              "data": "base64-encoded-audio-content"
            }
          }
        ]
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokens": 10,
    "candidatesTokens": 0,
    "totalTokens": 10,
    "cachedContentInputTokens": 0
  }
}
```

## FAQ

### Q: Will this cost money?
**A:** No. Gemini API has a free tier with sufficient quotas for this use case.

### Q: How long until all 200 files are generated?
**A:** ~15-20 days with normal development activity (1-3 commits/day to main)

### Q: Can I generate all 200 files at once?
**A:** Not recommended. This respects the incremental approach:
- Safer API rate limiting
- Better for monitoring/debugging
- Easier to roll back if needed
- Sustainable approach

### Q: What if a file generation fails?
**A:** The script continues with the next file. Failed files can be retried on the next deployment.

### Q: Can I customize the voices?
**A:** Yes! Edit `scripts/generate-audio-incremental.js`:
- Change `getVoiceForEntry()` for voice selection pattern
- Change `getVoicePrompt()` for voice descriptions
- Change voice presets: `'Charon'` (male) or `'Aoede'` (female)

### Q: Why alternate male/female voices?
**A:** Provides variety for language learners and helps distinguish different words when listening.

## Next Steps

1. **Set GitHub Secret**
   ```bash
   gh secret set GEMINI_API_KEY --body "your-key"
   ```

2. **Test Locally**
   ```bash
   export GEMINI_API_KEY="your-key"
   node scripts/generate-audio-incremental.js
   ```

3. **Deploy**
   - Push a change that modifies `knowledge_base.json`
   - Or manually trigger: `gh workflow run generate-audio-incremental.yml`

4. **Monitor Progress**
   - Check Actions tab for workflow runs
   - Verify new audio files in repo
   - Track progress toward 200-file target

## Related Documents

- [Audio Setup](./AUDIO_SETUP.md) - Audio service architecture
- [GitHub Actions Plan](./compressed-spec/audio-github-actions-plan.md) - Detailed implementation plan
- [GitHub Actions TTS Guide](./compressed-spec/github-actions-tts.md) - Step-by-step setup guide

---

**Last Updated**: January 2025  
**Status**: Ready for deployment  
**Target**: 200 audio files (incremental via GitHub Actions)
