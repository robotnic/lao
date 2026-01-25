import { Injectable, signal, computed, effect } from '@angular/core';

/**
 * Progress Storage Schema Versions
 */
export const PROGRESS_SCHEMA_VERSION = '1.0.0';
export const PROGRESS_KEY = 'lao_progress_v1';
export const SETTINGS_KEY = 'lao_settings_v1';

/**
 * SRS (Spaced Repetition System) states
 */
export type SrsState = 'new' | 'learning' | 'review' | 'mastered';

/**
 * Individual item progress (character, word, or phrase)
 */
export interface ProgressItem {
  id: string; // character/word/phrase ID
  itemType: 'character' | 'word' | 'phrase';
  srsState: SrsState;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewDate: number; // timestamp
  nextReviewDate: number; // timestamp
  easeFactor: number; // 1.3 - 2.5 (higher = easier)
  interval: number; // days until next review
  masteredDate?: number; // timestamp when mastered
  cooldownUntil?: number; // timestamp for 365-day cooldown after mastery
}

/**
 * Level progress tracking
 */
export interface LevelProgress {
  level_id: string;
  isUnlocked: boolean;
  startDate?: number;
  completionDate?: number;
  masteredCharacterCount: number;
  totalCharacterCount: number;
  masteredWordCount: number;
  totalWordCount: number;
  masteredPhraseCount: number;
  totalPhraseCount: number;
}

/**
 * Overall session statistics
 */
export interface ProgressStats {
  totalReviewsToday: number;
  totalReviewsAllTime: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number;
  totalXpEarned: number;
  averageAccuracy: number; // 0-100
}

/**
 * Complete progress data structure
 */
export interface ProgressData {
  version: string;
  lastUpdated: number;
  items: ProgressItem[];
  levels: LevelProgress[];
  stats: ProgressStats;
}

/**
 * User settings
 */
export interface UserSettings {
  version: string;
  theme: 'minimal' | 'playful';
  ttsSpeed: number; // 0.5 - 2.0
  audioVolume: number; // 0 - 1
  language: 'lao' | 'english';
  notificationsEnabled: boolean;
  lastUpdated: number;
}

/**
 * ProgressService
 *
 * Signal-based progress tracking with localStorage persistence.
 * Manages SRS algorithm, streak tracking, and level progression.
 *
 * Usage:
 *   constructor(private progress: ProgressService) {}
 *   progressItems$ = this.progress.items;
 *   stats$ = this.progress.stats;
 *   updateProgress('char_1', 'mastered');
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // Raw signals
  private readonly progressData = signal<ProgressData | null>(null);
  private readonly settings = signal<UserSettings | null>(null);
  private readonly error = signal<string | null>(null);

  // Exposed read-only signals
  items = computed(() => this.progressData()?.items ?? []);
  levels = computed(() => this.progressData()?.levels ?? []);
  stats = computed(() => this.progressData()?.stats ?? this.getDefaultStats());
  userSettings = computed(() => this.settings() ?? this.getDefaultSettings());

  // Computed convenience signals
  currentStreak = computed(() => this.stats().currentStreak);
  totalXpEarned = computed(() => this.stats().totalXpEarned);
  averageAccuracy = computed(() => this.stats().averageAccuracy);

  constructor() {
    this.loadProgress();
    this.loadSettings();

    // Auto-save progress on any change
    effect(() => {
      const data = this.progressData();
      if (data) {
        this.saveProgress(data);
      }
    });

    // Auto-save settings on any change
    effect(() => {
      const sett = this.settings();
      if (sett) {
        this.saveSettings(sett);
      }
    });
  }

  /**
   * Load progress from localStorage
   */
  private loadProgress(): void {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as ProgressData;
        this.validateProgressSchema(data);
        this.progressData.set(data);
      } else {
        // Initialize with empty progress
        this.progressData.set(this.getDefaultProgress());
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load progress';
      this.error.set(msg);
      console.error('[ProgressService] Load error:', msg);
      this.progressData.set(this.getDefaultProgress());
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const sett = JSON.parse(stored) as UserSettings;
        this.validateSettingsSchema(sett);
        this.settings.set(sett);
      } else {
        this.settings.set(this.getDefaultSettings());
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load settings';
      this.error.set(msg);
      console.error('[ProgressService] Settings load error:', msg);
      this.settings.set(this.getDefaultSettings());
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(data: ProgressData): void {
    try {
      data.lastUpdated = Date.now();
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      this.error.set(msg);
      console.error('[ProgressService] Save error:', msg);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(sett: UserSettings): void {
    try {
      sett.lastUpdated = Date.now();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(sett));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      this.error.set(msg);
      console.error('[ProgressService] Settings save error:', msg);
    }
  }

  /**
   * Update progress item (SRS state transition)
   */
  updateItemProgress(
    itemId: string,
    itemType: 'character' | 'word' | 'phrase',
    isCorrect: boolean
  ): void {
    const data = this.progressData();
    if (!data) return;

    let item = data.items.find(i => i.id === itemId);
    if (!item) {
      // Create new item
      item = {
        id: itemId,
        itemType: itemType,
        srsState: 'new',
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastReviewDate: Date.now(),
        nextReviewDate: Date.now(),
        easeFactor: 2.0,
        interval: 1
      };
      data.items.push(item);
    }

    // Update review counts
    item.reviewCount++;
    item.lastReviewDate = Date.now();

    if (isCorrect) {
      item.correctCount++;

      // SRS state machine (correct answer)
      if (item.srsState === 'new') {
        item.srsState = 'learning';
        item.interval = 1;
      } else if (item.srsState === 'learning') {
        item.srsState = 'review';
        item.interval = 7;
      } else if (item.srsState === 'review') {
        item.srsState = 'mastered';
        item.interval = 365;
        item.masteredDate = Date.now();
        item.cooldownUntil = Date.now() + 365 * 24 * 60 * 60 * 1000;
      }

      // Adjust ease factor (SM-2 algorithm)
      item.easeFactor = Math.max(1.3, item.easeFactor + 0.1);
    } else {
      item.incorrectCount++;

      // SRS state machine (incorrect answer)
      if (item.srsState === 'mastered') {
        item.srsState = 'review';
        item.interval = 7;
      } else if (item.srsState === 'review') {
        item.srsState = 'learning';
        item.interval = 1;
      }
      // 'learning' or 'new' stays same

      // Decrease ease factor
      item.easeFactor = Math.max(1.3, item.easeFactor - 0.2);
    }

    // Calculate next review date
    item.nextReviewDate = Date.now() + item.interval * 24 * 60 * 60 * 1000;

    // Update stats
    this.updateStats(data, isCorrect);

    // Trigger save via effect
    this.progressData.set(data);
  }

  /**
   * Update user settings
   */
  updateSettings(updates: Partial<UserSettings>): void {
    const current = this.settings();
    if (!current) return;

    const updated = { ...current, ...updates };
    this.settings.set(updated);
  }

  /**
   * Get items due for review (nextReviewDate <= now)
   */
  getItemsDueForReview(): ProgressItem[] {
    const now = Date.now();
    return this.items().filter(item => {
      // Skip mastered items in cooldown
      if (item.cooldownUntil && now < item.cooldownUntil) {
        return false;
      }
      return item.nextReviewDate <= now;
    });
  }

  /**
   * Get items by SRS state
   */
  getItemsByState(state: SrsState): ProgressItem[] {
    return this.items().filter(item => item.srsState === state);
  }

  /**
   * Get level progress
   */
  getLevelProgress(levelId: string): LevelProgress | undefined {
    return this.levels().find(l => l.level_id === levelId);
  }

  /**
   * Check if level is unlocked
   */
  isLevelUnlocked(levelId: string): boolean {
    const level = this.getLevelProgress(levelId);
    return level?.isUnlocked ?? false;
  }

  /**
   * Unlock level
   */
  unlockLevel(levelId: string): void {
    const data = this.progressData();
    if (!data) return;

    let level = data.levels.find(l => l.level_id === levelId);
    if (!level) {
      level = this.getDefaultLevelProgress(levelId);
      data.levels.push(level);
    }

    level.isUnlocked = true;
    level.startDate = Date.now();

    this.progressData.set(data);
  }

  /**
   * Export progress as JSON
   */
  exportProgress(): string {
    const data = this.progressData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import progress from JSON
   */
  importProgress(json: string): boolean {
    try {
      const data = JSON.parse(json) as ProgressData;
      this.validateProgressSchema(data);
      this.progressData.set(data);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      this.error.set(msg);
      console.error('[ProgressService] Import error:', msg);
      return false;
    }
  }

  /**
   * Clear all progress (destructive)
   */
  clearAllProgress(): void {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    this.progressData.set(this.getDefaultProgress());
    this.settings.set(this.getDefaultSettings());
  }

  /**
   * Private helper: Update stats
   */
  private updateStats(data: ProgressData, isCorrect: boolean): void {
    const stats = data.stats;
    const today = new Date().toDateString();
    const lastActivityToday =
      new Date(stats.lastActivityDate).toDateString() === today;

    if (isCorrect) {
      stats.totalReviewsToday = lastActivityToday
        ? stats.totalReviewsToday + 1
        : 1;
      stats.totalReviewsAllTime++;
      stats.totalXpEarned += 5; // 5 XP per correct
    }

    stats.lastActivityDate = Date.now();

    // Recalculate accuracy
    const allItems = data.items;
    const totalReviews = allItems.reduce(
      (sum, item) => sum + item.reviewCount,
      0
    );
    const totalCorrect = allItems.reduce(
      (sum, item) => sum + item.correctCount,
      0
    );
    stats.averageAccuracy =
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // Update streak (simplified: reviewed today = streak continues)
    if (lastActivityToday) {
      stats.currentStreak++;
    } else {
      stats.currentStreak = 1;
    }
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  }

  /**
   * Validate progress schema
   */
  private validateProgressSchema(
    data: unknown
  ): asserts data is ProgressData {
    if (!data || typeof data !== 'object') {
      throw new Error('Progress data must be an object');
    }

    const p = data as Record<string, unknown>;
    if (p.version !== PROGRESS_SCHEMA_VERSION) {
      throw new Error(
        `Invalid version: expected ${PROGRESS_SCHEMA_VERSION}, got ${p.version}`
      );
    }
    if (!Array.isArray(p.items)) {
      throw new Error('items must be an array');
    }
    if (!Array.isArray(p.levels)) {
      throw new Error('levels must be an array');
    }
    if (!p.stats || typeof p.stats !== 'object') {
      throw new Error('stats must be an object');
    }
  }

  /**
   * Validate settings schema
   */
  private validateSettingsSchema(
    sett: unknown
  ): asserts sett is UserSettings {
    if (!sett || typeof sett !== 'object') {
      throw new Error('Settings must be an object');
    }

    const s = sett as Record<string, unknown>;
    if (s.version !== PROGRESS_SCHEMA_VERSION) {
      throw new Error(`Invalid settings version: ${s.version}`);
    }
  }

  /**
   * Get default progress structure
   */
  private getDefaultProgress(): ProgressData {
    return {
      version: PROGRESS_SCHEMA_VERSION,
      lastUpdated: Date.now(),
      items: [],
      levels: [],
      stats: this.getDefaultStats()
    };
  }

  /**
   * Get default stats
   */
  private getDefaultStats(): ProgressStats {
    return {
      totalReviewsToday: 0,
      totalReviewsAllTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: Date.now(),
      totalXpEarned: 0,
      averageAccuracy: 0
    };
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): UserSettings {
    return {
      version: PROGRESS_SCHEMA_VERSION,
      theme: 'minimal',
      ttsSpeed: 1.0,
      audioVolume: 1.0,
      language: 'english',
      notificationsEnabled: true,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get default level progress
   */
  private getDefaultLevelProgress(levelId: string): LevelProgress {
    return {
      level_id: levelId,
      isUnlocked: false,
      masteredCharacterCount: 0,
      totalCharacterCount: 0,
      masteredWordCount: 0,
      totalWordCount: 0,
      masteredPhraseCount: 0,
      totalPhraseCount: 0
    };
  }
}
