#!/usr/bin/env node

/**
 * Incremental Audio Generation - Google Gemini TTS
 *
 * Generates missing audio assets under src/assets/audio, skipping existing files.
 * Output format expected by the app: .mp3 (see src/app/core/services/audio.service.ts).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  // In CI, keep this small enough to fit workflow timeouts.
  MAX_FILES_PER_RUN: Number.parseInt(process.env.MAX_FILES_PER_RUN || '1', 10),
  // Conservative delay to avoid per-minute throttles.
  DELAY_BETWEEN_FILES: Number.parseInt(process.env.DELAY_BETWEEN_FILES || '15000', 10),
  // Accept key via env or argv for local runs.
  API_KEY: process.env.GEMINI_API_KEY || process.argv[2],
  // TTS-capable model (required for responseModalities: ['AUDIO']).
  MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-tts',
  // Voices alternate male/female.
  VOICES: [
    { name: 'Charon', gender: 'male' },
    { name: 'Aoede', gender: 'female' }
  ],
  // Set ALLOW_INSECURE_TLS=1 only if you truly need it (e.g., intercepting proxy).
  ALLOW_INSECURE_TLS: process.env.ALLOW_INSECURE_TLS === '1',
  // When true, do not perform any retry requests (keeps a run to 1 API call).
  DISABLE_API_RETRIES: process.env.DISABLE_API_RETRIES !== '0',
  // When true, delete invalid/broken audio files so they can be regenerated.
  CLEAN_INVALID_AUDIO: process.env.CLEAN_INVALID_AUDIO === '1',
  // Use the streaming endpoint for audio responses (more reliable for AUDIO modality).
  USE_STREAMING: process.env.USE_STREAMING !== '0'
};

if (!CONFIG.API_KEY) {
  console.error('❌ Error: Gemini API key not provided');
  console.error('\nUsage:');
  console.error('  GEMINI_API_KEY=your-key node scripts/generate-audio-incremental.js');
  console.error('  OR');
  console.error('  node scripts/generate-audio-incremental.js your-key');
  process.exit(1);
}

if (CONFIG.ALLOW_INSECURE_TLS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('⚠️  ALLOW_INSECURE_TLS=1 set; TLS certificate verification is disabled.');
}

// Load knowledge base
let knowledgeBase;
try {
  const kbPath = path.join(__dirname, '../src/assets/data/knowledge_base.json');
  const kbContent = fs.readFileSync(kbPath, 'utf8');
  knowledgeBase = JSON.parse(kbContent);
} catch (error) {
  console.error('❌ Error loading knowledge base:', error.message);
  process.exit(1);
}

const audioDir = path.join(__dirname, '../src/assets/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

function detectAudioExtension(mimeType) {
  const mt = (mimeType || '').toLowerCase();
  if (mt.includes('audio/mpeg') || mt.includes('audio/mp3')) return 'mp3';
  if (mt.includes('audio/wav') || mt.includes('audio/x-wav')) return 'wav';
  if (mt.includes('audio/ogg')) return 'ogg';
  if (mt.includes('audio/flac')) return 'flac';
  return 'mp3';
}

function isLikelyAudioBytes(header) {
  if (!Buffer.isBuffer(header) || header.length < 4) return false;

  // Reject all-zero headers (common symptom of decoding the wrong field).
  let allZero = true;
  for (const byte of header) {
    if (byte !== 0) {
      allZero = false;
      break;
    }
  }
  if (allZero) return false;

  const ascii4 = header.subarray(0, 4).toString('ascii');
  const ascii3 = header.subarray(0, 3).toString('ascii');

  // WAV
  if (ascii4 === 'RIFF') return true;
  // OGG
  if (ascii4 === 'OggS') return true;
  // FLAC
  if (ascii4 === 'fLaC') return true;
  // MP3: ID3 tag or MPEG frame sync (0xFFEx)
  if (ascii3 === 'ID3') return true;
  if (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) return true;

  // MP4/M4A-ish: ....ftyp
  if (header.length >= 8 && header.subarray(4, 8).toString('ascii') === 'ftyp') return true;

  return false;
}

function isLikelyAudioFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    // Filter out trivially small/broken files.
    if (stat.size < 256) return false;
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);
    return isLikelyAudioBytes(header);
  } catch {
    return false;
  }
}

/**
 * Gets list of existing files
 */
function getExistingFiles() {
  try {
    const files = fs.readdirSync(audioDir);
    const audioFiles = files.filter((f) => f.endsWith('.mp3') || f.endsWith('.wav'));
    const validKeys = [];

    for (const fileName of audioFiles) {
      const fullPath = path.join(audioDir, fileName);
      const ok = isLikelyAudioFile(fullPath);
      if (!ok) {
        if (CONFIG.CLEAN_INVALID_AUDIO) {
          try {
            fs.unlinkSync(fullPath);
            console.warn(`🧹 Deleted invalid audio file: ${fileName}`);
          } catch {
            // Ignore delete failures; we'll just treat it as missing.
          }
        }
        continue;
      }

      validKeys.push(fileName.replace(/\.(mp3|wav)$/i, ''));
    }

    return new Set(validKeys);
  } catch {
    return new Set();
  }
}

/**
 * Audio generation via Gemini 2.5 Flash
 */
async function generateAudioWithGemini(text, voiceConfig) {
  const collectInlineData = (value, maxDepth = 10) => {
    const seen = new Set();
    const found = [];

    const walk = (node, depth) => {
      if (!node || depth > maxDepth) return;
      if (typeof node !== 'object') return;
      if (seen.has(node)) return;
      seen.add(node);

      if (node.inlineData && typeof node.inlineData === 'object') {
        const data = node.inlineData.data;
        const mimeType = node.inlineData.mimeType;
        if (typeof data === 'string' && data.length > 0) {
          found.push({
            data,
            mimeType: typeof mimeType === 'string' ? mimeType : undefined
          });
        }
      }

      if (Array.isArray(node)) {
        for (const item of node) walk(item, depth + 1);
        return;
      }

      for (const key of Object.keys(node)) {
        walk(node[key], depth + 1);
      }
    };

    walk(value, 0);
    return found;
  };

  const makeRequest = async (payload) => {
    const body = JSON.stringify(payload);

    const isAudioRequest = Array.isArray(payload?.generationConfig?.responseModalities)
      && payload.generationConfig.responseModalities.some((m) => String(m).toUpperCase() === 'AUDIO');

    const useStreaming = CONFIG.USE_STREAMING && isAudioRequest;
    const methodName = useStreaming ? 'streamGenerateContent' : 'generateContent';
    const extraQuery = useStreaming ? '&alt=sse' : '';

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${encodeURIComponent(CONFIG.MODEL)}:${methodName}?key=${encodeURIComponent(CONFIG.API_KEY)}${extraQuery}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(useStreaming ? { 'Accept': 'text/event-stream' } : {})
      }
    };

    const raw = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        const statusCode = res.statusCode || 0;
        const contentType = String(res.headers['content-type'] || '');

        // SSE streaming (preferred for AUDIO responses)
        if (useStreaming && statusCode === 200 && contentType.includes('text/event-stream')) {
          let buffer = '';
          const responses = [];

          res.on('data', (chunk) => {
            buffer += chunk.toString('utf8');

            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, newlineIndex).trimEnd();
              buffer = buffer.slice(newlineIndex + 1);

              if (!line.startsWith('data:')) continue;
              const dataLine = line.slice('data:'.length).trim();
              if (!dataLine || dataLine === '[DONE]') continue;

              try {
                responses.push(JSON.parse(dataLine));
              } catch {
                // Ignore parse errors on keepalive/partial lines.
              }
            }
          });

          res.on('end', () => {
            resolve({ statusCode, data: JSON.stringify({ __streamResponses: responses }) });
          });
          return;
        }

        // Non-streaming response
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode, data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (raw.statusCode !== 200) {
      try {
        const parsed = JSON.parse(raw.data);
        const apiMessage = parsed?.error?.message;
        if (apiMessage && apiMessage.toLowerCase().includes('does not support the requested response modalities')) {
          throw new Error(
            `API Error: ${apiMessage} (set GEMINI_MODEL to a TTS-capable model, e.g. gemini-2.5-flash-preview-tts)`
          );
        }
        throw new Error(apiMessage ? `API Error: ${apiMessage}` : `HTTP ${raw.statusCode}: ${raw.data}`);
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error(`HTTP ${raw.statusCode}: ${raw.data}`);
      }
    }

    try {
      return JSON.parse(raw.data);
    } catch {
      throw new Error('Failed to parse JSON response from Gemini API.');
    }
  };

  const basePayload = {
    contents: [{
      role: 'user',
      parts: [{ text }]
    }],
    generationConfig: {
      responseModalities: ['AUDIO']
    }
  };

  // Newer schema: speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName
  const payloadWithVoice = {
    ...basePayload,
    generationConfig: {
      ...basePayload.generationConfig,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceConfig.name
          }
        }
      }
    }
  };

  let response;
  try {
    response = await makeRequest(payloadWithVoice);
  } catch (error) {
    if (CONFIG.DISABLE_API_RETRIES) {
      throw error;
    }

    // Compatibility fallback: if voice fields are rejected, retry without them.
    const message = error instanceof Error ? error.message : String(error);
    const looksLikeVoiceFieldError =
      message.includes('speech_config') ||
      message.includes('speechConfig') ||
      message.includes('voicePreset') ||
      message.includes('voiceConfig') ||
      message.includes('prebuiltVoiceConfig') ||
      message.includes('voiceName');

    if (!looksLikeVoiceFieldError) {
      throw error;
    }

    response = await makeRequest(basePayload);
  }

  // Audio payload schema can vary; search the full response for inlineData.
  const responseForSearch = Array.isArray(response?.__streamResponses) ? response.__streamResponses : response;
  const inlineDataItems = collectInlineData(responseForSearch);
  const audioItems = inlineDataItems.filter((x) => (x.mimeType || '').toLowerCase().startsWith('audio/'));

  // Prefer audio/* parts; among those, prefer mpeg.
  const preferred =
    audioItems.find((x) => (x.mimeType || '').toLowerCase().includes('audio/mpeg')) ||
    audioItems[0];

  if (preferred?.data) {
    const buffer = Buffer.from(preferred.data, 'base64');
    const header = buffer.subarray(0, 16);
    if (!isLikelyAudioBytes(header)) {
      const mt = preferred.mimeType || 'unknown';
      throw new Error(`Decoded bytes do not look like audio (mimeType=${mt}).`);
    }

    return {
      buffer,
      mimeType: preferred.mimeType
    };
  }

  const isStreamWrapper = Array.isArray(response?.__streamResponses);
  const streamResponses = isStreamWrapper ? response.__streamResponses : undefined;
  const streamCount = Array.isArray(streamResponses) ? streamResponses.length : 0;
  const lastStream = streamCount > 0 ? streamResponses[streamCount - 1] : undefined;

  const candidate0 = response?.candidates?.[0];
  const finishReason = candidate0?.finishReason;
  const safetyRatings = candidate0?.safetyRatings;
  const candidateKeys = candidate0 && typeof candidate0 === 'object' ? Object.keys(candidate0) : [];
  const topKeys = response && typeof response === 'object' ? Object.keys(response) : [];

  throw new Error(
    `No audio content found in API response. Top-level keys: ${topKeys.join(', ')}. ` +
      (isStreamWrapper ? `stream chunks: ${streamCount}. ` : '') +
      (lastStream ? `last stream keys: ${Object.keys(lastStream).join(', ')}. ` : '') +
      `Candidate[0] keys: ${candidateKeys.join(', ')}. ` +
      (finishReason ? `finishReason: ${finishReason}. ` : '') +
      (safetyRatings ? `safetyRatings present. ` : '') +
      (candidate0 ? `candidate[0]: ${JSON.stringify(candidate0)}` : '')
  );
}

function getVoiceForEntry(index) {
  return CONFIG.VOICES[index % CONFIG.VOICES.length];
}

/**
 * Main process
 */
async function generateIncrementalAudio() {
  console.log('🚀 Starting Lao TTS generation (Gemini 2.5 Flash)...\n');
  
  const allEntries = [
    ...(knowledgeBase.alphabet || []),
    ...(knowledgeBase.dictionary || []),
    ...(knowledgeBase.phrases || [])
  ];

  const existingFiles = getExistingFiles();
  const entriesToGenerate = allEntries.filter(entry => !existingFiles.has(entry.audio_key));

  console.log(`📊 Status: ${existingFiles.size} existing, ${entriesToGenerate.length} missing.`);
  
  const filesToGenerate = entriesToGenerate.slice(0, CONFIG.MAX_FILES_PER_RUN);
  
  if (filesToGenerate.length === 0) {
    console.log('\n✅ All done! No new files needed.');
    process.exit(0);
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < filesToGenerate.length; i++) {
    const entry = filesToGenerate[i];
    const voiceConfig = getVoiceForEntry(existingFiles.size + i);
    const text = entry.name_lao || entry.lao || entry.english;

    console.log(`[${i+1}/${filesToGenerate.length}] 🎵 ${entry.audio_key} (${voiceConfig.gender})...`);

    try {
      if (!entry.audio_key) {
        throw new Error('Missing audio_key on entry.');
      }
      if (!text) {
        throw new Error('No text found for entry (expected name_lao, lao, or english).');
      }

      const { buffer, mimeType } = await generateAudioWithGemini(text, voiceConfig);
      const ext = detectAudioExtension(mimeType);
      const finalAudioPath = path.join(audioDir, `${entry.audio_key}.${ext}`);
      fs.writeFileSync(finalAudioPath, buffer);
      results.push({ key: entry.audio_key, status: 'success', gender: voiceConfig.gender });
      console.log(`✅ Wrote ${path.basename(finalAudioPath)} (${mimeType || 'unknown'})`);
    } catch (err) {
      console.error(`❌ Error with ${entry.audio_key}: ${err.message}`);
      results.push({ key: entry.audio_key, status: 'error' });
    }

    // Rate Limiting
    if (i < filesToGenerate.length - 1) {
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_FILES));
    }
  }

  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n✅ Done! ${successCount} new files generated.`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  
  process.exit(0);
}

generateIncrementalAudio().catch(console.error);
