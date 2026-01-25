# Audio Generation via GitHub Actions - ARCHIVED

⚠️ **This document is archived.** See the canonical setup guides:

- **Quick Start**: [AUDIO_GENERATION_QUICKSTART.md](../AUDIO_GENERATION_QUICKSTART.md)
- **Complete Setup**: [AUDIO_GENERATION_SETUP.md](../AUDIO_GENERATION_SETUP.md)

For reference only. Implementation completed.

---

## Historical Context

### Problem
- Local audio generation produces low-quality espeak-ng files (English voice for Lao text)
- Generated MP3s are not useable for language learning (wrong pronunciation, accent)
- Dependency management (ffmpeg, espeak-ng) adds complexity
- No way to use professional TTS services without exposing API keys

### Current Architecture
- 61 MP3 files (1.4 MB total)
- Located in `/src/assets/audio/`
- App falls back to Web Speech API if files missing
- Audio service: hybrid file + TTS approach

---

## Solution: GitHub Actions Audio Generation Pipeline

### Benefits
✅ **Quality:** Use professional TTS services (Google Cloud, Azure, AWS)  
✅ **Automation:** Generate on push/schedule, no local dependencies  
✅ **Security:** API keys in GitHub Secrets, never exposed  
✅ **Reproducibility:** Consistent quality across environments  
✅ **CI/CD Integration:** Commits with updated audio files automatically  
✅ **Scalability:** Easy to regenerate with different voice settings  

---

## Implementation Plan

### Phase 1: GitHub Actions Setup
**Effort:** 4 hours  
**Tasks:**

1. **Create workflow file**
   - Path: `.github/workflows/generate-audio.yml`
   - Trigger: Manual dispatch + schedule (weekly)
   - Environment: Ubuntu latest
   - Node.js: 20.x

2. **Add workflow steps**
   ```yaml
   - Checkout repo
   - Setup Node.js 20.x
   - Install dependencies (only ffmpeg, no espeak-ng needed)
   - Download knowledge_base.json
   - Run generation script
   - Commit & push audio files (if changed)
   - Create PR with changes
   ```

3. **GitHub Secrets**
   - `GEMINI_API_KEY` (current setup)
   - Or: `GOOGLE_CLOUD_API_KEY` (if enabling TTS API)
   - Or: `AZURE_SPEECH_KEY` (premium option)

### Phase 2: Audio Generation Script for CI
**Effort:** 6 hours  
**Tasks:**

1. **Update generate-audio-gemini.js**
   - Add retry logic (API rate limits)
   - Add exponential backoff
   - Better error handling
   - Timeout per file: 30 seconds
   - Total timeout: 15 minutes

2. **Add audio quality validation**
   - Check file size > 5KB
   - Validate MP3 header
   - Verify duration > 0.5s
   - Regenerate failed files automatically

3. **Create summary report**
   - Log: success/failure count
   - Log: file sizes
   - Log: generation time
   - Attach to PR/commit

### Phase 3: Quality Assurance
**Effort:** 4 hours  
**Tasks:**

1. **Audio file testing**
   - Script to validate all 61 files
   - Check for corrupted files
   - Verify naming convention
   - Ensure consistent bit rate (128 kbps)

2. **Batch validation**
   - Min size: 8KB
   - Max size: 100KB
   - Expected duration: 0.5-3 seconds
   - Sample rate: 22.05 kHz or higher

3. **Fallback audio**
   - If generation fails, keep existing files
   - Don't commit corrupted files
   - Create GitHub issue on failure

### Phase 4: Integration & Deployment
**Effort:** 3 hours  
**Tasks:**

1. **PR workflow**
   - Workflow commits to PR branch
   - Auto-creates PR with audio updates
   - Includes changelog entry
   - Links to workflow run

2. **Branch protection rules**
   - Require audio files to be valid
   - Check workflow passes
   - Audio changes reviewed before merge

3. **Documentation**
   - Update README with workflow info
   - Document how to manually trigger
   - Add troubleshooting guide

---

## Alternative Audio Sources (By Quality/Cost)

### 1. Gemini API (Current) ❌
- **Cost:** Free (1,500 requests/day)
- **Quality:** ⭐⭐ (English voice, suboptimal for Lao)
- **Issue:** Corporate firewall blocked
- **Status:** Not viable in current environment

### 2. Google Cloud TTS 🟡
- **Cost:** $16/M characters (~$1.00 for all files)
- **Quality:** ⭐⭐⭐⭐ (Professional voices)
- **Setup:** Requires billing enabled
- **Issue:** Need to enable API in project
- **Advantage:** Lao language support (lo-LA)

### 3. Azure Speech Services 🟡
- **Cost:** $4-$15/month (depending on tier)
- **Quality:** ⭐⭐⭐⭐ (Neural voices)
- **Setup:** Simpler billing than GCP
- **Advantage:** Free tier available (5K requests/month)

### 4. AWS Polly 🟡
- **Cost:** $4/M characters (~$0.50 for all files)
- **Quality:** ⭐⭐⭐⭐ (Professional voices)
- **Setup:** AWS account required
- **Advantage:** Free tier (5M characters/month first year)

### 5. ElevenLabs (Premium) ❌
- **Cost:** $99/month base
- **Quality:** ⭐⭐⭐⭐⭐ (Best voices)
- **Setup:** API key only
- **Issue:** Expensive for this project

### Recommendation: **Azure Speech Services** or **AWS Polly**
- Good quality
- Affordable
- GitHub Actions compatible
- Free tier sufficient

---

## GitHub Actions Workflow Structure

```yaml
name: Generate Audio Files

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:     # Manual trigger
  
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Generate audio files
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run generate-audio-gemini
      
      - name: Validate audio files
        run: node scripts/validate-audio.js
      
      - name: Create PR if changed
        if: steps.generate.outcome == 'success'
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: regenerate audio files'
          title: 'Audio: Regenerate from TTS'
          body: |
            Generated by GitHub Actions
            [View workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
          branch: audio-update-${{ github.run_number }}
```

---

## Migration Path

### Step 1: Create GitHub workflow (1 hour)
- Add `.github/workflows/generate-audio.yml`
- Test with manual dispatch
- Store API key in GitHub Secrets

### Step 2: Enhance generation script (2 hours)
- Add retry logic
- Add validation
- Add error reporting

### Step 3: Test in Actions (1 hour)
- Trigger manual workflow
- Verify files generated correctly
- Check file quality

### Step 4: Schedule automation (30 min)
- Set weekly schedule
- Create PR automation
- Document for team

### Step 5: Production rollout (30 min)
- Merge to main
- Test app with new audio files
- Monitor workflow runs

---

## Files to Create/Modify

```
.github/
  workflows/
    generate-audio.yml          [NEW]

scripts/
  generate-audio-gemini.js      [MODIFY] - add retry/validation
  validate-audio.js             [NEW]    - validate all files
  
compressed-spec/
  audio-github-actions-plan.md  [THIS FILE]
  
src/
  assets/
    audio/
      *.mp3                      [GENERATED BY WORKFLOW]
```

---

## Success Criteria

✅ Workflow triggers successfully  
✅ All 61 audio files generate without errors  
✅ Generated files are valid MP3s  
✅ File sizes are reasonable (8KB-100KB)  
✅ PR is created with updated files  
✅ App plays audio without fallback  
✅ Quality is professional grade  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API rate limits | Implement exponential backoff, queue requests |
| Workflow timeout | Set 15-min timeout, can extend if needed |
| File corruption | Validate before commit, retry failed files |
| API key exposure | Use GitHub Secrets, never commit keys |
| Network failure | Implement retry logic with max attempts |
| Cost overruns | Monitor API usage, set billing alerts |

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Setup | 4h | Not Started |
| Phase 2: Script | 6h | Not Started |
| Phase 3: QA | 4h | Not Started |
| Phase 4: Deploy | 3h | Not Started |
| **Total** | **17h** | **Planning** |

---

## Next Steps

1. **Decide on TTS service** (Azure/AWS/Google Cloud)
2. **Create GitHub Actions workflow**
3. **Update generation scripts**
4. **Test in CI environment**
5. **Deploy and monitor**

---

## Appendix: Audio Quality Specs

### Target Specifications
- **Format:** MP3
- **Bitrate:** 128 kbps
- **Sample Rate:** 22.05 kHz or higher
- **Channels:** Mono
- **Duration:** 0.5-3 seconds per file
- **Total Size:** ~1.5-2 MB

### Validation Checks
```javascript
- File exists
- File is valid MP3 (magic bytes: FF FA/FB)
- File size > 5KB (minimum for quality audio)
- Duration > 0.5 seconds (minimum audio length)
- No encoding errors
```

---

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)
- [Azure Speech Services](https://azure.microsoft.com/services/cognitive-services/text-to-speech/)
- [AWS Polly](https://aws.amazon.com/polly/)
