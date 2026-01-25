import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Data types reflecting knowledge_base.json structure
 */
export interface LaoCharacter {
  id: string;
  lao: string;
  name: string;
  type: 'consonant' | 'vowel' | 'tone_mark';
  class?: string;
  sounds?: Record<string, string>;
  description?: string;
  mnemonic: string;
  audio_key: string;
  level_id: string;
  image_key?: string;
  romanization?: string; // For compatibility
  consonant?: string; // For compatibility
  vowel?: string; // For compatibility
  tone_mark?: string; // For compatibility
  ipa?: string;
  english_meaning?: string;
  examples?: string[];
}

export interface Word {
  id: string;
  lao: string;
  romanization: string;
  ipa?: string;
  english: string;
  category: WordCategory;
  audio_key: string;
  examples?: string[];
  level_id: string;
}

export type WordCategory =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'phrase';

export interface Phrase {
  id: string;
  lao: string;
  phonetic?: string;
  english: string;
  word_ids?: string[];
  related_word_ids?: string[];
  audio_key: string;
  examples?: string[];
  level_id: string;
  complexity?: number;
}

export interface Level {
  level_id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  character_count: number;
  word_count: number;
  phrase_count: number;
}

export interface KnowledgeBase {
  meta: {
    version: string;
    last_updated: string;
    total_characters: number;
    total_words: number;
    total_phrases: number;
    total_levels: number;
  };
  levels: Level[];
  alphabet: LaoCharacter[];
  dictionary: Word[];
  phrases: Phrase[];
}

/**
 * JsonDataProviderService
 *
 * Core service for loading and caching knowledge_base.json.
 * Exposes data via Signals for reactive component binding.
 * Implements lazy loading and error handling.
 *
 * Usage:
 *   constructor(private dataProvider: JsonDataProviderService) {}
 *   alphabet$ = this.dataProvider.alphabet;
 *   dictionary$ = this.dataProvider.dictionary;
 */
@Injectable({
  providedIn: 'root'
})
export class JsonDataProviderService {
  // Raw signals from loaded data
  private readonly knowledgeBase = signal<KnowledgeBase | null>(null);
  private readonly loadError = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);

  // Exposed signals (read-only)
  alphabet = computed(() => this.knowledgeBase()?.alphabet ?? []);
  dictionary = computed(() => this.knowledgeBase()?.dictionary ?? []);
  phrases = computed(() => this.knowledgeBase()?.phrases ?? []);
  levels = computed(() => this.knowledgeBase()?.levels ?? []);
  meta = computed(() => this.knowledgeBase()?.meta ?? null);

  // Utility computed signals
  isLoaded = computed(() => this.knowledgeBase() !== null);
  hasError = computed(() => this.loadError() !== null);
  state = computed(() => ({
    isLoading: this.isLoading(),
    isLoaded: this.isLoaded(),
    hasError: this.hasError(),
    error: this.loadError()
  }));

  constructor(private http: HttpClient) {
    // Auto-load on service instantiation
    this.load();
  }

  /**
   * Load knowledge_base.json from assets
   * Handles caching and error states
   */
  async load(): Promise<void> {
    if (this.isLoading() || this.isLoaded()) {
      return; // Prevent duplicate loads
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<KnowledgeBase>('/assets/data/knowledge_base.json')
      );

      // Validate structure
      this.validateKnowledgeBase(data);

      this.knowledgeBase.set(data);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to load knowledge base';

      this.loadError.set(errorMsg);
      console.error('[JsonDataProviderService] Load error:', errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get character by ID
   */
  getCharacterById(id: string): LaoCharacter | undefined {
    return this.alphabet().find(char => char.id === id);
  }

  /**
   * Get word by ID
   */
  getWordById(id: string): Word | undefined {
    return this.dictionary().find(word => word.id === id);
  }

  /**
   * Get phrase by ID
   */
  getPhraseById(id: string): Phrase | undefined {
    return this.phrases().find(phrase => phrase.id === id);
  }

  /**
   * Get level by ID
   */
  getLevelById(levelId: string): Level | undefined {
    return this.levels().find(level => level.level_id === levelId);
  }

  /**
   * Get characters filtered by level
   */
  getCharactersByLevel(levelId: string): LaoCharacter[] {
    return this.alphabet().filter(char => char.level_id === levelId);
  }

  /**
   * Get words filtered by level
   */
  getWordsByLevel(levelId: string): Word[] {
    return this.dictionary().filter(word => word.level_id === levelId);
  }

  /**
   * Get phrases filtered by level
   */
  getPhrasesByLevel(levelId: string): Phrase[] {
    return this.phrases().filter(phrase => phrase.level_id === levelId);
  }

  /**
   * Get words by category
   */
  getWordsByCategory(category: WordCategory): Word[] {
    return this.dictionary().filter(word => word.category === category);
  }

  /**
   * Validate knowledge_base structure
   * Throws error if validation fails
   */
  private validateKnowledgeBase(data: unknown): asserts data is KnowledgeBase {
    if (!data || typeof data !== 'object') {
      throw new Error('Knowledge base must be an object');
    }

    const kb = data as Record<string, unknown>;

    // Check required top-level keys
    const requiredKeys = ['meta', 'levels', 'alphabet', 'dictionary', 'phrases'];
    for (const key of requiredKeys) {
      if (!(key in kb)) {
        throw new Error(`Knowledge base missing required key: ${key}`);
      }
    }

    // Validate meta
    if (!this.isMeta(kb.meta)) {
      throw new Error('Invalid meta object');
    }

    // Validate arrays
    if (!Array.isArray(kb.levels)) {
      throw new Error('levels must be an array');
    }
    if (!Array.isArray(kb.alphabet)) {
      throw new Error('alphabet must be an array');
    }
    if (!Array.isArray(kb.dictionary)) {
      throw new Error('dictionary must be an array');
    }
    if (!Array.isArray(kb.phrases)) {
      throw new Error('phrases must be an array');
    }

    // Validate counts
    if (
      kb.meta.total_characters !== (kb.alphabet as unknown[]).length ||
      kb.meta.total_words !== (kb.dictionary as unknown[]).length ||
      kb.meta.total_phrases !== (kb.phrases as unknown[]).length ||
      kb.meta.total_levels !== (kb.levels as unknown[]).length
    ) {
      throw new Error('Meta counts do not match array lengths');
    }
  }

  /**
   * Type guard for meta object
   */
  private isMeta(obj: unknown): obj is KnowledgeBase['meta'] {
    if (!obj || typeof obj !== 'object') return false;
    const m = obj as Record<string, unknown>;
    return (
      typeof m.version === 'string' &&
      typeof m.last_updated === 'string' &&
      typeof m.total_characters === 'number' &&
      typeof m.total_words === 'number' &&
      typeof m.total_phrases === 'number' &&
      typeof m.total_levels === 'number'
    );
  }

  /**
   * Force reload (useful for cache invalidation)
   */
  async reload(): Promise<void> {
    this.knowledgeBase.set(null);
    await this.load();
  }

  /**
   * Get current state for debugging
   */
  getDebugInfo(): {
    isLoading: boolean;
    isLoaded: boolean;
    hasError: boolean;
    error: string | null;
    alphabetCount: number;
    dictionaryCount: number;
    phraseCount: number;
    levelCount: number;
  } {
    return {
      isLoading: this.isLoading(),
      isLoaded: this.isLoaded(),
      hasError: this.hasError(),
      error: this.loadError(),
      alphabetCount: this.alphabet().length,
      dictionaryCount: this.dictionary().length,
      phraseCount: this.phrases().length,
      levelCount: this.levels().length
    };
  }
}
