#!/usr/bin/env node

/**
 * Incremental Audio Generation - Google Gemini 2.5 Flash TTS (2026 Edition)
 * 
 * Optimizations:
 * - Model: gemini-2.5-flash (stable endpoint)
 * - Rate Limiting: 5s Delay (safe within the 15 RPM / 1000 RPD limits)
 * - Error Handling: Correct extraction of audio bytes from v1beta Parts
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Allow self-signed certificates (only if local proxy issues exist)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuration
const CONFIG = {
  MAX_FILES_PER_RUN: 50,         // Increased to 50 (safe for a workflow run)
  DELAY_BETWEEN_FILES: 5000,     // 5 seconds (sufficient at 15 requests/min)
  API_KEY: process.env.GEMINI_API_KEY,
  // 2026 Voice Names (Charon & Aoede are standard, Puck & Fenrir are alternatives)
  VOICES: [
    { name: 'Charon', gender: 'male' },
    { name: 'Aoede', gender: 'female' }
  ]
};

if (!CONFIG.API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

// Initialize Gemini client (v1beta is necessary for native audio output)
const genAI = new GoogleGenerativeAI(CONFIG.API_KEY);

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
    return new Set(files.filter(f => f.endsWith('.wav')).map(f => f.replace('.wav', '')));
  } catch {
    return new Set();
  }
}

/**
 * Audio generation via Gemini 2.5 Flash
 */
async function generateAudioWithGemini(text, voiceConfig) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-tts'
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text }]
      }],
      generationConfig: {
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceConfig.name
            }
          }
        }
      }
    });

    const response = await result.response;
    
    // In 2026, audio data is returned as base64 in the Part object
    const audioPart = response.candidates[0].content.parts.find(p => p.inlineData && p.inlineData.mimeType.includes('audio'));
    
    if (audioPart) {
      return Buffer.from(audioPart.inlineData.data, 'base64');
    } else if (typeof response.audioBytes === 'function') {
      // Fallback for older SDK helpers
      return Buffer.from(response.audioBytes(), 'base64');
    } else {
      throw new Error('No audio data found in the API response.');
    }
  } catch (error) {
    throw new Error(`API error: ${error.message}`);
  }
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
    const voiceConfig = CONFIG.VOICES[(existingFiles.size + i) % CONFIG.VOICES.length];
    const text = entry.name_lao || entry.lao || entry.english;
    const audioPath = path.join(audioDir, `${entry.audio_key}.wav`);

    console.log(`[${i+1}/${filesToGenerate.length}] 🎵 ${entry.audio_key} (${voiceConfig.gender})...`);

    try {
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
