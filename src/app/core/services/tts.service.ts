import { Injectable, inject } from '@angular/core';
import { ProgressService } from './progress.service';

/**
 * TTS (Text-to-Speech) Service
 * Uses Web Speech API for client-side speech synthesis
 * No API key required - runs entirely in the browser
 * 
 * Supports:
 * - Lao language (lo-LA)
 * - English (en-US)
 * - Configurable speed and volume via ProgressService settings
 * - Pause/resume functionality
 */
@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private progress = inject(ProgressService);
  private synthesis = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Speak text using Web Speech API
   * @param text Text to speak
   * @param language Language code (default: 'lo-LA' for Lao)
   */
  speak(text: string, language: string = 'lo-LA'): void {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = this.progress.userSettings().ttsSpeed || 1;
    utterance.volume = (this.progress.userSettings().audioVolume || 100) / 100;

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  /**
   * Speak Lao text (shorthand)
   * @param laoText Lao script text to speak
   */
  speakLao(laoText: string): void {
    this.speak(laoText, 'lo-LA');
  }

  /**
   * Speak English text (shorthand)
   * @param englishText English text to speak
   */
  speakEnglish(englishText: string): void {
    this.speak(englishText, 'en-US');
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop all speech
   */
  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if speech is currently playing
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Update speech rate on the fly (if currently speaking)
   */
  setRate(rate: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.rate = Math.max(0.5, Math.min(2, rate)); // Clamp between 0.5 and 2
    }
  }

  /**
   * Update volume on the fly (if currently speaking)
   */
  setVolume(volume: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Get Lao voice if available, otherwise use default
   */
  getLaoVoice(): SpeechSynthesisVoice | undefined {
    return this.getVoices().find(voice => voice.lang.startsWith('lo'));
  }

  /**
   * Set specific voice
   */
  setVoice(voice: SpeechSynthesisVoice): void {
    if (this.currentUtterance) {
      this.currentUtterance.voice = voice;
    }
  }
}
