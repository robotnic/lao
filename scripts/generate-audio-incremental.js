#!/usr/bin/env node

/**
 * Incremental Audio Generation - Google Gemini 2.5 Flash TTS
 * 
 * Features:
 * - Skips existing audio files (only generates missing ones)
 * - Uses Gemini 2.5 Flash with native TTS (proper Lao support)
 * - Generates ~50 files per deployment
 * - Alternates between male and female voices
 * - Can build up to 200+ files over multiple deployments
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const writeFile = util.promisify(fs.writeFile);

// Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuration
const CONFIG = {
  MAX_FILES_PER_RUN: 2,         // Generate max 5 files per workflow run
  DELAY_BETWEEN_FILES: 125000,   // 25 second delay to stay well within 3 requests/minute limit
  API_KEY: process.env.GEMINI_API_KEY,
  VOICES: [
    { name: 'Charon', gender: 'male' },
    { name: 'Aoede', gender: 'female' }
  ]
};

if (!CONFIG.API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

// Initialize Gemini client
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

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

/**
 * Get list of existing audio files
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
 * Generate audio using Gemini 2.5 Flash TTS
 */
async function generateAudioWithGemini(text, voiceConfig) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-tts'
    });

    // Provide a hint for Lao pronunciation
    const laoPrompt = `Please say the following Lao text clearly: ${text}`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: laoPrompt }]
      }],
      generationConfig: {
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceConfig.name // Aoede or Charon
            }
          }
        }
      }
    });

    const response = await result.response;

    // Check for audio in candidates
    let audioBase64 = '';

    if (response.candidates && response.candidates[0].content.parts) {
      const audioPart = response.candidates[0].content.parts.find(p => 
        p.inlineData && p.inlineData.mimeType && p.inlineData.mimeType.includes('audio')
      );
      if (audioPart) {
        audioBase64 = audioPart.inlineData.data;
      }
    }

    // Fallback: Direct audioBytes access
    if (!audioBase64 && response.audioBytes) {
      audioBase64 = response.audioBytes;
    }

    if (audioBase64) {
      return Buffer.from(audioBase64, 'base64');
    } else {
      throw new Error('Model returned text but no audio data. Check if your API key has TTS permissions.');
    }
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}

/**
 * Get voice config based on index for alternating male/female
 */
function getVoiceForEntry(index) {
  return CONFIG.VOICES[index % CONFIG.VOICES.length];
}

/**
 * Generate audio for a single entry
 */
async function generateAudio(entry, voiceIndex) {
  const audioPath = path.join(audioDir, `${entry.audio_key}.wav`);

  if (fs.existsSync(audioPath)) {
    return { key: entry.audio_key, status: 'exists' };
  }

  // Simplified text selection logic
  const textToSynthesize = entry.name_lao || entry.lao || entry.english || entry.name;

  if (!textToSynthesize) {
    return { key: entry.audio_key, status: 'skipped', reason: 'no text' };
  }

  try {
    const voiceConfig = getVoiceForEntry(voiceIndex);
    console.log(`🎵 Generating ${entry.audio_key} [${textToSynthesize}] (${voiceConfig.gender})...`);

    const audioBuffer = await generateAudioWithGemini(textToSynthesize, voiceConfig);

    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`✅ Saved: ${entry.audio_key}.wav`);

    // Pass the gender back for the summary stats
    return { key: entry.audio_key, status: 'success', voice: voiceConfig.gender };
  } catch (error) {
    console.error(`❌ Failed ${entry.audio_key}:`, error.message);
    return { key: entry.audio_key, status: 'error', error: error.message };
  }
}

/**
 * Main generation process
 */
async function generateIncrementalAudio() {
  console.log('🚀 Starting incremental audio generation...\n');
  
  // Get all entries to generate
  const allEntries = [
    ...(knowledgeBase.alphabet || []),
    ...(knowledgeBase.dictionary || []),
    ...(knowledgeBase.phrases || [])
  ];

  // Get already existing files
  const existingFiles = getExistingFiles();
  
  // Filter to only missing files
  const entriesToGenerate = allEntries.filter(
    entry => !existingFiles.has(entry.audio_key)
  );

  console.log(`📊 Status:`);
  console.log(`   Existing files: ${existingFiles.size}`);
  console.log(`   Missing files: ${entriesToGenerate.length}`);
  console.log(`   Max files per run: ${CONFIG.MAX_FILES_PER_RUN}`);
  
  // Limit to MAX_FILES_PER_RUN per deployment
  const filesToGenerate = entriesToGenerate.slice(0, CONFIG.MAX_FILES_PER_RUN);
  
  if (filesToGenerate.length === 0) {
    console.log('\n✅ All audio files already exist!');
    console.log(`Total files: ${existingFiles.size + filesToGenerate.length}`);
    process.exit(0);
  }

  console.log(`\n🎵 Generating ${filesToGenerate.length} files this run...\n`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < filesToGenerate.length; i++) {
    const entry = filesToGenerate[i];
    const result = await generateAudio(entry, existingFiles.size + i);
    results.push(result);
    
    // Rate limiting: delay between requests
    if (i < filesToGenerate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_FILES));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Generation Summary');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'success').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'error').length;
  const totalNow = existingFiles.size + successful;

  console.log(`✅ Generated this run: ${successful}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total files now: ${totalNow} / 200`);
  console.log(`⏱️  Time: ${duration}s`);

  // Male/Female breakdown
  const maleCount = results.filter(r => r.voice === 'male').length;
  const femaleCount = results.filter(r => r.voice === 'female').length;
  console.log(`\n🎙️  Voice breakdown:`);
  console.log(`   Male: ${maleCount}`);
  console.log(`   Female: ${femaleCount}`);

  // Remaining
  const remaining = Math.max(0, 200 - totalNow);
  console.log(`\n📈 Progress:`);
  console.log(`   Completed: ${totalNow}/200 (${Math.round((totalNow / 200) * 100)}%)`);
  console.log(`   Remaining: ${remaining}`);
  if (remaining > 0) {
    const estimatedDeployments = Math.ceil(remaining / CONFIG.MAX_FILES_PER_RUN);
    console.log(`   Est. deployments to complete: ${estimatedDeployments}`);
  }

  if (failed > 0) {
    console.log('\n❌ Failed entries:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`  - ${r.key}: ${r.error}`));
  }

  console.log('\n✨ Generation complete!');
  process.exit(failed > 0 ? 1 : 0);
}

generateIncrementalAudio().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
