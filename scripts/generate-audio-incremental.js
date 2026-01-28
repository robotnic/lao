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
  MAX_FILES_PER_RUN: Number.parseInt(process.env.MAX_FILES_PER_RUN || '50', 10),
  // Conservative delay to avoid per-minute throttles.
  DELAY_BETWEEN_FILES: Number.parseInt(process.env.DELAY_BETWEEN_FILES || '15000', 10),
  // Accept key via env or argv for local runs.
  API_KEY: process.env.GEMINI_API_KEY || process.argv[2],
  // Proven model for audio output via v1beta.
  MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  // Voices alternate male/female.
  VOICES: [
    { name: 'Charon', gender: 'male' },
    { name: 'Aoede', gender: 'female' }
  ],
  // Set ALLOW_INSECURE_TLS=1 only if you truly need it (e.g., intercepting proxy).
  ALLOW_INSECURE_TLS: process.env.ALLOW_INSECURE_TLS === '1'
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

/**
 * Gets list of existing files
 */
function getExistingFiles() {
  try {
    const files = fs.readdirSync(audioDir);
    return new Set(files.filter(f => f.endsWith('.mp3')).map(f => f.replace('.mp3', '')));
  } catch {
    return new Set();
  }
}

/**
 * Audio generation via Gemini 2.5 Flash
 */
async function generateAudioWithGemini(text, voiceConfig) {
  const payload = {
    contents: [{
      parts: [{
        text: `Generate a natural speech audio of this text. Speak it clearly and naturally: "${text}"`
      }]
    }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voicePreset: voiceConfig.name
      }
    }
  };

  const body = JSON.stringify(payload);

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${encodeURIComponent(CONFIG.MODEL)}:generateContent?key=${encodeURIComponent(CONFIG.API_KEY)}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const raw = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (raw.statusCode !== 200) {
    try {
      const parsed = JSON.parse(raw.data);
      const apiMessage = parsed?.error?.message;
      throw new Error(apiMessage ? `API Error: ${apiMessage}` : `HTTP ${raw.statusCode}: ${raw.data}`);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`HTTP ${raw.statusCode}: ${raw.data}`);
    }
  }

  let response;
  try {
    response = JSON.parse(raw.data);
  } catch {
    throw new Error('Failed to parse JSON response from Gemini API.');
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    const keys = response && typeof response === 'object' ? Object.keys(response) : [];
    throw new Error(`Unexpected API response shape (missing candidates[0].content.parts). Top-level keys: ${keys.join(', ')}`);
  }

  const audioPart = parts.find((p) => p?.inlineData?.data);
  if (!audioPart) {
    throw new Error('No audio content in response parts.');
  }

  return Buffer.from(audioPart.inlineData.data, 'base64');
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
    const audioPath = path.join(audioDir, `${entry.audio_key}.mp3`);

    console.log(`[${i+1}/${filesToGenerate.length}] 🎵 ${entry.audio_key} (${voiceConfig.gender})...`);

    try {
      if (!entry.audio_key) {
        throw new Error('Missing audio_key on entry.');
      }
      if (!text) {
        throw new Error('No text found for entry (expected name_lao, lao, or english).');
      }

      const buffer = await generateAudioWithGemini(text, voiceConfig);
      fs.writeFileSync(audioPath, buffer);
      results.push({ key: entry.audio_key, status: 'success', gender: voiceConfig.gender });
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
