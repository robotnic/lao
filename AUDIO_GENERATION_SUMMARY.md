# Audio Generation - Documentation Summary

## Consolidated Setup

This document consolidates the audio generation workflow setup and documentation structure.

### Canonical Documents (Use These)

| File | Purpose | Audience |
|------|---------|----------|
| [AUDIO_GENERATION_QUICKSTART.md](AUDIO_GENERATION_QUICKSTART.md) | 1-minute setup guide | Everyone (quick reference) |
| [AUDIO_GENERATION_SETUP.md](AUDIO_GENERATION_SETUP.md) | Complete setup & reference | Developers implementing/troubleshooting |
| [.github/workflows/generate-audio-incremental.yml](.github/workflows/generate-audio-incremental.yml) | GitHub Actions workflow | CI/CD automation |
| [scripts/generate-audio-incremental.js](scripts/generate-audio-incremental.js) | Audio generation script | Workflow execution |

### Archived Documents (Reference Only)

| File | Status | Reason |
|------|--------|--------|
| `compressed-spec/audio-github-actions-plan.md` | Archived | Content merged into AUDIO_GENERATION_SETUP.md |
| `compressed-spec/github-actions-tts.md` | Archived | Content merged into AUDIO_GENERATION_SETUP.md |

Both archived files redirect to the canonical documents.

---

## Quick Facts

### What We're Building
- Incremental audio file generation using Gemini API
- ~50 files per deployment
- Target: 200 total files (Lao content with male/female voice variants)
- Timeline: 15-20 days with normal development activity

### Rate Limiting
- **API Limit**: 1,500 requests/day (Gemini free tier)
- **Per Deployment**: 50 files = 50 API calls (safe)
- **Delay**: 2 seconds between requests (conservative)
- **Strategy**: Skip existing files (no wasted calls)

### Implementation Files Created

```
.github/workflows/
├── generate-audio-incremental.yml          # GitHub Actions workflow

scripts/
├── generate-audio-incremental.js           # Main generation script (NEW)
├── generate-audio-simple.js                # Local espeak-ng fallback
├── generate-audio-google.js                # Google Cloud reference
└── generate-audio-gemini.js                # Initial Gemini script

Root docs:
├── AUDIO_GENERATION_QUICKSTART.md          # Quick start (NEW)
├── AUDIO_GENERATION_SETUP.md               # Complete guide (NEW)
├── AUDIO_GENERATION_SUMMARY.md             # This file (NEW)
├── AUDIO_GENERATION.md                     # Original overview
└── AUDIO_PIPELINE.md                       # Technical details
```

---

## Getting Started

### 1. Set GitHub Secret
```bash
gh secret set GEMINI_API_KEY --body "your-gemini-api-key"
```

### 2. Test Script Locally
```bash
export GEMINI_API_KEY="your-key"
node scripts/generate-audio-incremental.js
```

If local API access is blocked (common on restricted networks), skip this and trigger the GitHub Actions workflow instead.

### 3. Deploy
Push to main or trigger manually:
```bash
gh workflow run generate-audio-incremental.yml -r main
```

For detailed instructions, see [AUDIO_GENERATION_QUICKSTART.md](AUDIO_GENERATION_QUICKSTART.md).

---

## Documentation Structure

```
docs/
├── AUDIO_GENERATION_QUICKSTART.md     ← START HERE (1 minute)
├── AUDIO_GENERATION_SETUP.md          ← Full reference (10 minutes)
├── AUDIO_GENERATION_SUMMARY.md        ← This overview
├── AUDIO_GENERATION.md                ← Technical details
├── AUDIO_PIPELINE.md                  ← Architecture
├── AUDIO_SETUP.md                     ← Service implementation
└── compressed-spec/
    ├── audio-github-actions-plan.md   (archived)
    └── github-actions-tts.md          (archived)
```

---

## Next Steps (Ordered)

1. **Set API Secret** → `gh secret set GEMINI_API_KEY`
2. **Test Locally** → `node scripts/generate-audio-incremental.js`
3. **Deploy Workflow** → Push to main
4. **Monitor Progress** → Check Actions tab & file count
5. **Integrate Into App** → Update components to use new files
6. **Reach 200 Files** → Complete over 15-20 days

---

## Todo List

See [todo.md](todo.md) for the full audio generation implementation checklist.

**Key Items:**
- [ ] Set Gemini API secret on GitHub
- [ ] Test incremental generation script locally
- [ ] Deploy incremental generation workflow
- [ ] Monitor API usage and rate limits
- [ ] Generate male/female voice variants
- [ ] Integrate new audio files into app

---

## Key Decisions

### Why Incremental Generation?
- ✅ Respects API rate limits (1,500/day)
- ✅ Safer (easier to debug issues)
- ✅ Sustainable (spread over time)
- ✅ Enables monitoring (track progress)

### Why Gemini API?
- ✅ Free tier available
- ✅ Excellent audio quality
- ✅ Voice variants supported
- ✅ Stable API

### Why Skip Existing Files?
- ✅ Saves API calls
- ✅ Prevents unnecessary regeneration
- ✅ Allows resuming after failures
- ✅ Enables gradual voice improvements

### Why Male/Female Variants?
- ✅ Linguistic variety (helps learning)
- ✅ Natural voice distribution
- ✅ Reaches 200 file target (50 entries × 2 voices)
- ✅ Professional TTS quality

---

## File Inventory

### Audio Files Generated
- **Current**: 61 files (local espeak-ng)
- **Target**: 200 files (Gemini API)
- **Coverage**: Alphabet + vowels + tone marks + dictionary + phrases
- **Quality**: Professional TTS (male/female voices)

### Scripts
- `generate-audio-incremental.js` - Main workflow script (NEW)
- `generate-audio-simple.js` - Local generation fallback
- `generate-audio-google.js` - Google Cloud reference
- `generate-audio-gemini.js` - Initial Gemini script

### Workflows
- `.github/workflows/generate-audio-incremental.yml` - Incremental generation

### Documentation
- `AUDIO_GENERATION_QUICKSTART.md` - 1-minute setup
- `AUDIO_GENERATION_SETUP.md` - Complete reference
- `AUDIO_GENERATION_SUMMARY.md` - This file
- Plus 5 other audio-related docs

---

## Validation Checklist

- ✅ Script syntax is valid
- ✅ Workflow YAML is valid
- ✅ Script handles missing files
- ✅ Script respects rate limits
- ✅ Script alternates male/female voices
- ✅ Auto-commit action configured
- ✅ Documentation consolidated
- ✅ Todo list created

---

## Support

**Quick Questions?** → See [AUDIO_GENERATION_QUICKSTART.md](AUDIO_GENERATION_QUICKSTART.md)

**Need Details?** → See [AUDIO_GENERATION_SETUP.md](AUDIO_GENERATION_SETUP.md)

**Troubleshooting?** → See AUDIO_GENERATION_SETUP.md § Troubleshooting

**API Issues?** → Check [Gemini API Documentation](https://ai.google.dev/)

---

**Status**: ✅ Ready for deployment  
**Last Updated**: January 25, 2026  
**Target**: 200 audio files via incremental GitHub Actions workflow
