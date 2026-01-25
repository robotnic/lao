# Quick Start: Incremental Audio Generation

## 1-Minute Setup

### Step 1: Set GitHub Secret
```bash
gh secret set GEMINI_API_KEY --body "your-gemini-api-key-here"
```

### Step 2: Push to Main
```bash
git add .
git commit -m "enable audio generation"
git push origin main
```

### Step 3: Watch It Work
```bash
gh run list --workflow=generate-audio-incremental.yml --limit=5
```

## What Happens

1. **Workflow triggers** on push to main
2. **Script runs** and checks existing audio files
3. **Generates ~50 new files** (skips existing ones)
4. **Commits files** back to repository
5. **Next push** generates the next batch

## Expected Timeline

| Deployment | Files | Total | Progress |
|-----------|-------|-------|----------|
| 1 | +50 | 111 | 55% |
| 2 | +50 | 161 | 80% |
| 3 | +39 | 200 | 100% |

**Total time**: ~15-20 days with normal development activity

## Manual Trigger

Run generation without pushing code:

```bash
gh workflow run generate-audio-incremental.yml -r main
```

Check status:
```bash
gh run list --workflow=generate-audio-incremental.yml --limit=1
```

View logs:
```bash
gh run view <run-id> --log
```

## Voice Variants

Each file alternates between voices:
- **Odd indices** (nai, bai, ...): Male voice
- **Even indices** (khao, khai, ...): Female voice

To change voice selection pattern, edit `scripts/generate-audio-incremental.js` line 41:

```javascript
function getVoiceForEntry(index) {
  // Current: alternates male/female
  return CONFIG.VOICES[index % CONFIG.VOICES.length];
}
```

## Rate Limits

- **API**: 1,500 requests/day (free tier)
- **Per run**: 50 files = 50 API calls
- **Safe margin**: Can run 30x per day without issues
- **Actual**: 1-3 runs per day (typical development)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow doesn't run | Check `GEMINI_API_KEY` secret is set |
| API key invalid | Get new key from Google AI Studio |
| Network blocked | Check firewall allows `generativelanguage.googleapis.com` |
| Files not committed | Verify git config in workflow |

## Full Documentation

See [AUDIO_GENERATION_SETUP.md](AUDIO_GENERATION_SETUP.md) for complete details, configuration options, and advanced usage.
