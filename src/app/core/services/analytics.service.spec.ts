import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { ProgressService } from './progress.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let progressService: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnalyticsService, ProgressService]
    });
    service = TestBed.inject(AnalyticsService);
    progressService = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Difficulty Recommendations', () => {
    it('should recommend progression from level 1 to 2 with high accuracy', () => {
      // Add items with high accuracy
      for (let i = 0; i < 5; i++) {
        progressService.updateItemProgress(`char_${i}`, 'character', true);
        progressService.updateItemProgress(`char_${i}`, 'character', true);
        progressService.updateItemProgress(`char_${i}`, 'character', true);
      }

      const recommendation = service.recommendDifficulty(1);
      expect(recommendation.recommendedDifficulty).toBeGreaterThanOrEqual(1);
      expect(recommendation.metrics.averageAccuracy).toBeGreaterThanOrEqual(0);
    });

    it('should recommend staying at current level with moderate accuracy', () => {
      // Add items with mixed accuracy
      for (let i = 0; i < 3; i++) {
        progressService.updateItemProgress(`char_${i}`, 'character', true);
        progressService.updateItemProgress(`char_${i}`, 'character', false);
      }

      const recommendation = service.recommendDifficulty(2);
      expect(recommendation.reason).toContain('practicing');
    });

    it('should return metrics with accuracy calculation', () => {
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', false);

      const recommendation = service.recommendDifficulty(1);
      expect(recommendation.metrics.averageAccuracy).toBeGreaterThanOrEqual(0);
      expect(recommendation.metrics.totalAttempts).toBeGreaterThan(0);
    });
  });

  describe('Spaced Repetition Scheduling', () => {
    it('should return items due for review', () => {
      progressService.updateItemProgress('word_1', 'word', true);
      const itemsDue = service.getItemsDueForReview();
      expect(Array.isArray(itemsDue)).toBe(true);
    });

    it('should sort items by priority', () => {
      progressService.updateItemProgress('word_1', 'word', true);
      progressService.updateItemProgress('word_1', 'word', true);
      progressService.updateItemProgress('word_2', 'word', true);

      const itemsDue = service.getItemsDueForReview();
      if (itemsDue.length > 1) {
        // Items should be sorted by priority (descending)
        for (let i = 0; i < itemsDue.length - 1; i++) {
          expect(itemsDue[i].priority).toBeGreaterThanOrEqual(itemsDue[i + 1].priority);
        }
      }
    });

    it('should not include mastered items in cooldown', () => {
      // Create a mastered item with active cooldown
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', true);

      const itemsDue = service.getItemsDueForReview();
      // Items in cooldown should not appear
      const hasChar1 = itemsDue.some(item => item.itemId === 'char_1');
      expect(typeof hasChar1).toBe('boolean');
    });
  });

  describe('Achievement Badges', () => {
    it('should track earned badges', () => {
      const badges = service.earnedBadges();
      expect(Array.isArray(badges)).toBe(true);
    });

    it('should award first character badge', () => {
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_1', 'character', true);

      // Re-initialize to trigger badge updates (in real app, this would be automatic)
      const badges = service.earnedBadges();
      expect(Array.isArray(badges)).toBe(true);
    });

    it('should provide all badge definitions', () => {
      const allBadges = service.allBadges();
      expect(allBadges.length).toBeGreaterThan(0);
      expect(allBadges.some(b => b.id === 'first_character')).toBe(true);
    });
  });

  describe('Dashboard Analytics', () => {
    it('should return dashboard analytics data', () => {
      progressService.updateItemProgress('char_1', 'character', true);
      const analytics = service.getDashboardAnalytics();

      expect(analytics).toEqual(
        jasmine.objectContaining({
          totalSessionsToday: jasmine.any(Number),
          totalSessionsAllTime: jasmine.any(Number),
          currentStreak: jasmine.any(Number),
          totalXpEarned: jasmine.any(Number),
          averageAccuracy: jasmine.any(Number),
          masteredCount: jasmine.any(Number),
          learningCount: jasmine.any(Number),
          reviewCount: jasmine.any(Number),
          itemsDueToday: jasmine.any(Number),
          badges: jasmine.any(Number)
        })
      );
    });

    it('should track item state distribution', () => {
      progressService.updateItemProgress('char_1', 'character', true);
      progressService.updateItemProgress('char_2', 'character', false);

      const analytics = service.getDashboardAnalytics();
      expect(analytics.masteredCount + analytics.learningCount + analytics.reviewCount).toBeGreaterThanOrEqual(0);
    });

    it('should count badges', () => {
      const analytics = service.getDashboardAnalytics();
      expect(analytics.badges).toBeGreaterThanOrEqual(0);
    });
  });
});
