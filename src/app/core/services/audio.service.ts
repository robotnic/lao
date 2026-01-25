import { Injectable, inject } from '@angular/core';
import { TtsService } from './tts.service';

/**
 * AudioService - Hybrid audio delivery
 * 
 * Attempts to play pre-recorded audio files first,
 * Falls back to TTS (Text-to-Speech) if files not found
 * 
 * Usage:
 *   audioService.playAudio('ko_kay_v1', 'ກ', 'lo-LA')
 *   audioService.playLao('sabaidee_01_v1', 'ສະບາຍດີ')
 */
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private tts = inject(TtsService);
  private audioCache = new Map<string, HTMLAudioElement>();

  /**
   * Play audio by audio_key with optional TTS fallback
   * @param audioKey Reference to audio file (without .mp3 extension)
   * @param fallbackText Text to synthesize if audio file not found
   * @param language Language code for TTS fallback
   */
  playAudio(audioKey: string, fallbackText: string, language: string = 'lo-LA'): void {
    const audioPath = `assets/audio/${audioKey}.mp3`;

    // Try to use cached audio element
    let audio = this.audioCache.get(audioKey);
    if (!audio) {
      audio = new Audio();
      audio.src = audioPath;
      this.audioCache.set(audioKey, audio);
    }

    // Reset playback to start
    audio.currentTime = 0;

    // Attempt to play audio file
    const playPromise = audio.play();

    if (playPromise) {
      playPromise
        .then(() => {
          // Audio file played successfully
        })
        .catch((_error: any) => {
          // Audio file not found or playback failed
          // Fallback to TTS
          this.tts.speak(fallbackText, language);
        });
    } else {
      // Browser doesn't support audio or file not found
      this.tts.speak(fallbackText, language);
    }
  }

  /**
   * Play Lao language audio with fallback
   */
  playLao(audioKey: string, laoText: string): void {
    this.playAudio(audioKey, laoText, 'lo-LA');
  }

  /**
   * Play English language audio with fallback
   */
  playEnglish(audioKey: string, englishText: string): void {
    this.playAudio(audioKey, englishText, 'en-US');
  }

  /**
   * Stop all audio playback
   */
  stopAll(): void {
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.tts.stop();
  }

  /**
   * Stop audio for specific key
   */
  stop(audioKey: string): void {
    const audio = this.audioCache.get(audioKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Clear audio cache (for memory management)
   */
  clearCache(): void {
    this.stopAll();
    this.audioCache.clear();
  }

  /**
   * Preload audio file (optional, for performance)
   */
  preloadAudio(audioKey: string): void {
    if (!this.audioCache.has(audioKey)) {
      const audio = new Audio(`assets/audio/${audioKey}.mp3`);
      this.audioCache.set(audioKey, audio);
    }
  }

  /**
   * Get loading status of audio file
   */
  isAudioAvailable(audioKey: string): boolean {
    const audio = this.audioCache.get(audioKey);
    return !!audio && audio.src !== '';
  }
}
