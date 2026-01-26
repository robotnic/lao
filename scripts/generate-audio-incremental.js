#!/usr/bin/env node

/**
 * Incremental Audio Generation - Google Cloud Text-to-Speech
 * 
 * Features:
 * - Skips existing audio files (only generates missing ones)
 * - Uses Google Cloud TTS with proper Lao language support
 * - Generates ~50 files per deployment
 * - Alternates between male and female voices
 * - Can build up to 200+ files over multiple deployments
 * 
 * Cost: ~$1.20 for all 200 files (~$0.02 per request)
 * Free tier: $300 monthly credit
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

// Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuration
const CONFIG = {
  MAX_FILES_PER_RUN: 50,        // Generate max 50 files per workflow run
  DELAY_BETWEEN_FILES: 500,     // 500ms delay for safety
  API_KEY: process.env.GOOGLE_TTS_API_KEY,
  VOICES: [
    { name: 'lo-LA-Neural2-A', gender: 'male' },
    { name: 'lo-LA-Neural2-B', gender: 'female' }
  ]
};

if (!CONFIG.API_KEY) {
  console.error('❌ Error: GOOGLE_TTS_API_KEY environment variable not set');
  process.exit(1);
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
    return new Set(files.filter(f => f.endsWith('.mp3')).map(f => f.replace('.mp3', '')));
  } catch {
    return new Set();
  }
}

/**
 * Get voice config based on index for alternating male/female
 */
function getVoiceForEntry(index) {
  return CONFIG.VOICES[index % CONFIG.VOICES.length];
}

/**
 * Generate audio using Google Cloud Text-to-Speech API
 */
function generateAudioWithGoogle(text, voiceConfig) {
  return new Promise((resolve, reject) => {
    const payload = {
      input: { text },
      voice: {
        languageCode: 'lo-LA',
        name: voiceConfig.name
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${CONFIG.API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.audioContent) {
              resolve(Buffer.from(response.audioContent, 'base64'));
            } else {
              reject(new Error('No audio content in response'));
            }
          } catch (error) {
            reject(error);
          }
        } else {
          try {
            const error = JSON.parse(data);
            if (error.error && error.error.message) {
              reject(new Error(`API Error: ${error.error.message}`));
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          } catch {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Generate audio for a single entry
 */
async function generateAudio(entry, voiceIndex) {
  const audioPath = path.join(audioDir, `${entry.audio_key}.mp3`);
  
  // Skip if file already exists
  if (fs.existsSync(audioPath)) {
    return { key: entry.audio_key, status: 'exists' };
  }

  // Get text to synthesize
  let textToSynthesize = '';
  
  // Prefer name_lao for consonants (letter names in Lao script)
  if (entry.name_lao) {
    textToSynthesize = entry.name_lao;
  } else if (entry.lao) {
    textToSynthesize = entry.lao;
  } else if (entry.english) {
    textToSynthesize = entry.english;
  } else if (entry.name) {
    textToSynthesize = entry.name;
  }

  if (!textToSynthesize) {
    return { key: entry.audio_key, status: 'skipped', reason: 'no text' };
  }

  try {
    const voiceConfig = getVoiceForEntry(voiceIndex);
    console.log(`🎵 Generating ${entry.audio_key} (${voiceConfig.gender} voice)...`);
    
    const audioBuffer = await generateAudioWithGoogle(textToSynthesize, voiceConfig);
    
    await writeFile(audioPath, audioBuffer);
    console.log(`✅ Generated ${entry.audio_key}`);
    
    return { key: entry.audio_key, status: 'success', voice };
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
