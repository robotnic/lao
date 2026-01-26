import { Injectable, inject, computed, signal } from '@angular/core';
import { ProgressService } from './progress.service';

/**
 * Achievement Badge Definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate?: number;
  requirement: (stats: any) => boolean;
}

/**
 * Difficulty Recommendation
 */
export interface DifficultyRecommendation {
  currentDifficulty: number;
  recommendedDifficulty: number;
  reason: string;
  metrics: {
    averageAccuracy: number;
    streakDays: number;
    masteredCount: number;
    totalAttempts: number;
  };
}

/**
 * Analytics Service
 *
 * Provides advanced analytics for:
 * - Difficulty level recommendations based on performance
 * - Achievement badge tracking
 * - Spaced repetition scheduling insights
 * - Performance analytics dashboard data
 *
 * Usage:
 *   constructor(private analytics: AnalyticsService) {}
 *   recommendation$ = this.analytics.difficultyRecommendation;
 *   badges$ = this.analytics.earnedBadges;
 *   analytics.recommendDifficulty(1);
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private progress = inject(ProgressService);
  private earnedBadgesSignal = signal<Badge[]>([]);

  // Predefined badge definitions
  private readonly BADGE_DEFINITIONS: Badge[] = [
    {
      id: 'first_character',
      name: 'First Steps',
      description: 'Master your first character',
      icon: '🎉',
      requirement: (stats) => stats.masteredCharacterCount >= 1
    },
    {
      id: 'alphabet_explorer',
      name: 'Alphabet Master',
      description: 'Master 21+ consonants',
      icon: '🔤',
      requirement: (stats) => stats.masteredCharacterCount >= 21
    },
    {
      id: 'vocabulary_builder',
      name: 'Word Collector',
      description: 'Master 20+ vocabulary words',
      icon: '📚',
      requirement: (stats) => stats.masteredWordCount >= 20
    },
    {
      id: 'hundred_words',
      name: 'Century Club',
      description: 'Master 100+ vocabulary words',
      icon: '💯',
      requirement: (stats) => stats.masteredWordCount >= 100
    },
    {
      id: 'streak_7',
      name: '7-Day Grind',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      requirement: (stats) => stats.streakDays >= 7
    },
    {
      id: 'streak_30',
      name: 'Month Master',
      description: 'Maintain a 30-day learning streak',
      icon: '🌟',
      requirement: (stats) => stats.streakDays >= 30
    },
    {
      id: 'accuracy_90',
      name: 'Precision',
      description: 'Achieve 90%+ accuracy on all activities',
      icon: '🎯',
      requirement: (stats) => stats.averageAccuracy >= 90
    },
    {
      id: 'xp_500',
      name: 'XP Warrior',
      description: 'Earn 500+ XP',
      icon: '⚡',
      requirement: (stats) => stats.totalXpEarned >= 500
    },
    {
      id: 'xp_2000',
      name: 'XP Legend',
      description: 'Earn 2000+ XP',
      icon: '👑',
      requirement: (stats) => stats.totalXpEarned >= 2000
    }
  ];

  // Exposed signals
  earnedBadges = computed(() => this.earnedBadgesSignal());
  allBadges = signal<Badge[]>(this.BADGE_DEFINITIONS);

  constructor() {
    this.updateBadges();
  }

  /**
   * Calculate difficulty recommendation based on current performance
   * Difficulty levels: 1 (beginner) -> 2 (intermediate) -> 3 (advanced) -> 4 (master)
   */
  recommendDifficulty(currentDifficulty: number): DifficultyRecommendation {
    const items = this.progress.items();
    const stats = this.progress.stats();

    // Calculate metrics for current difficulty level
    const currentLevelItems = items.filter(item =>
      this.estimateItemDifficulty(item.id) === currentDifficulty
    );

    const accuracy = this.calculateAccuracy(currentLevelItems);
    const masteredCount = currentLevelItems.filter(i => i.srsState === 'mastered').length;
    const totalAttempts = currentLevelItems.reduce((sum, i) => sum + i.reviewCount, 0);

    let recommendedDifficulty = currentDifficulty;
    let reason = '';

    // If performance is excellent, recommend moving up
    if (accuracy >= 90 && masteredCount >= Math.ceil(currentLevelItems.length * 0.7)) {
      recommendedDifficulty = Math.min(4, currentDifficulty + 1);
      reason = `Excellent performance! Ready for Level ${recommendedDifficulty}.`;
    }
    // If performance is poor, recommend staying or going back
    else if (accuracy < 60 && totalAttempts > 5) {
      recommendedDifficulty = Math.max(1, currentDifficulty - 1);
      reason = `Consider reviewing Level ${recommendedDifficulty} fundamentals.`;
    }
    // If performance is moderate, recommend staying
    else {
      reason = `Keep practicing Level ${currentDifficulty}. You\'re making progress!`;
    }

    return {
      currentDifficulty,
      recommendedDifficulty,
      reason,
      metrics: {
        averageAccuracy: accuracy,
        streakDays: stats.currentStreak,
        masteredCount,
        totalAttempts
      }
    };
  }

  /**
   * Get next items due for review (spaced repetition scheduling)
   */
  getItemsDueForReview(): Array<{
    itemId: string;
    daysUntilDue: number;
    srsState: string;
    priority: number;
  }> {
    const now = Date.now();
    const items = this.progress.items();

    return items
      .filter(item => {
        // Skip mastered items in cooldown period
        if (item.srsState === 'mastered' && item.cooldownUntil && item.cooldownUntil > now) {
          return false;
        }
        return item.nextReviewDate <= now;
      })
      .map(item => ({
        itemId: item.id,
        daysUntilDue: Math.max(0, Math.floor((item.nextReviewDate - now) / (1000 * 60 * 60 * 24))),
        srsState: item.srsState,
        priority: this.calculateReviewPriority(item)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10); // Limit to top 10 due for review
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardAnalytics() {
    const stats = this.progress.stats();
    const items = this.progress.items();

    const masteredItems = items.filter(i => i.srsState === 'mastered');
    const learningItems = items.filter(i => i.srsState === 'learning');
    const reviewItems = items.filter(i => i.srsState === 'review');

    return {
      totalSessionsToday: stats.totalReviewsToday,
      totalSessionsAllTime: stats.totalReviewsAllTime,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalXpEarned: stats.totalXpEarned,
      averageAccuracy: stats.averageAccuracy,
      masteredCount: masteredItems.length,
      learningCount: learningItems.length,
      reviewCount: reviewItems.length,
      itemsDueToday: this.getItemsDueForReview().length,
      badges: this.earnedBadgesSignal().length
    };
  }

  /**
   * Check and update earned badges
   */
  private updateBadges(): void {
    const stats = this.progress.stats();
    const items = this.progress.items();

    const masteredCharacters = items.filter(i => i.itemType === 'character' && i.srsState === 'mastered').length;
    const masteredWords = items.filter(i => i.itemType === 'word' && i.srsState === 'mastered').length;

    const badgeStats = {
      masteredCharacterCount: masteredCharacters,
      masteredWordCount: masteredWords,
      streakDays: stats.currentStreak,
      averageAccuracy: stats.averageAccuracy,
      totalXpEarned: stats.totalXpEarned
    };

    const earned = this.BADGE_DEFINITIONS.filter(badge => badge.requirement(badgeStats));
    this.earnedBadgesSignal.set(earned);
  }

  /**
   * Estimate difficulty of an item (1-4 based on name/category)
   * This is a simple heuristic - could be enhanced with explicit metadata
   */
  private estimateItemDifficulty(itemId: string): number {
    // Very simplified - in production, would check against knowledge_base metadata
    if (itemId.includes('consonant') || itemId.includes('vowel')) return 1;
    if (itemId.includes('tone')) return 2;
    if (itemId.includes('phrase')) return 3;
    return 2; // Default
  }

  /**
   * Calculate accuracy for a set of items
   */
  private calculateAccuracy(items: any[]): number {
    if (items.length === 0) return 0;
    const totalCorrect = items.reduce((sum, item) => sum + item.correctCount, 0);
    const totalAttempts = items.reduce((sum, item) => sum + item.reviewCount, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  }

  /**
   * Calculate priority for review (higher = more urgent)
   */
  private calculateReviewPriority(item: any): number {
    let priority = 0;

    // Priority by SRS state
    if (item.srsState === 'learning') priority += 100;
    if (item.srsState === 'review') priority += 50;
    if (item.srsState === 'new') priority += 75;

    // Penalty for low ease factor (difficult items)
    priority -= item.easeFactor * 10;

    // Bonus for overdue items
    const daysOverdue = Math.max(0, (Date.now() - item.nextReviewDate) / (1000 * 60 * 60 * 24));
    priority += daysOverdue * 5;

    return priority;
  }
}
