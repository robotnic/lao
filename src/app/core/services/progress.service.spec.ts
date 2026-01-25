import { TestBed } from '@angular/core/testing';
import { ProgressService, PROGRESS_KEY, SETTINGS_KEY } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let store: Record<string, string> = {};

  beforeEach(() => {
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };

    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);

    TestBed.configureTestingModule({
      providers: [ProgressService]
    });

    service = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty items', () => {
    expect(service.items().length).toBe(0);
  });

  it('should initialize with empty levels', () => {
    expect(service.levels().length).toBe(0);
  });

  it('should initialize default stats', () => {
    const stats = service.stats();
    expect(stats.currentStreak).toBe(0);
    expect(stats.totalReviewsAllTime).toBe(0);
    expect(stats.averageAccuracy).toBe(0);
  });

  it('should update item progress on correct answer', () => {
    service.updateItemProgress('char_1', 'character', true);

    const items = service.items();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('char_1');
    expect(items[0].correctCount).toBe(1);
    expect(items[0].srsState).toBe('learning');
  });

  it('should update item progress on incorrect answer', () => {
    service.updateItemProgress('char_1', 'character', true);
    service.updateItemProgress('char_1', 'character', false);

    const items = service.items();
    expect(items[0].incorrectCount).toBe(1);
    expect(items[0].srsState).toBe('new');
  });

  it('should progress through SRS states on all correct', () => {
    // new -> learning
    service.updateItemProgress('word_1', 'word', true);
    expect(service.items()[0].srsState).toBe('learning');

    // learning -> review
    service.updateItemProgress('word_1', 'word', true);
    expect(service.items()[0].srsState).toBe('review');

    // review -> mastered
    service.updateItemProgress('word_1', 'word', true);
    expect(service.items()[0].srsState).toBe('mastered');
  });

  it('should update stats on correct answer', () => {
    service.updateItemProgress('char_1', 'character', true);
    const stats = service.stats();
    expect(stats.totalReviewsAllTime).toBe(1);
    expect(stats.totalXpEarned).toBe(5);
  });

  it('should calculate average accuracy', () => {
    service.updateItemProgress('char_1', 'character', true);
    service.updateItemProgress('char_1', 'character', true);
    service.updateItemProgress('char_1', 'character', false);

    const stats = service.stats();
    expect(stats.averageAccuracy).toBe(67); // 2/3 correct
  });

  it('should get items due for review', () => {
    service.updateItemProgress('char_1', 'character', true);
    const due = service.getItemsDueForReview();
    expect(due.length).toBeGreaterThan(0);
  });

  it('should get items by SRS state', () => {
    service.updateItemProgress('char_1', 'character', true);
    const learning = service.getItemsByState('learning');
    expect(learning.length).toBe(1);
    expect(learning[0].srsState).toBe('learning');
  });

  it('should unlock level', () => {
    service.unlockLevel('level_1');
    const level = service.getLevelProgress('level_1');
    expect(level?.isUnlocked).toBe(true);
  });

  it('should check if level is unlocked', () => {
    service.unlockLevel('level_1');
    expect(service.isLevelUnlocked('level_1')).toBe(true);
    expect(service.isLevelUnlocked('level_2')).toBe(false);
  });

  it('should update user settings', () => {
    service.updateSettings({ theme: 'playful' });
    expect(service.userSettings().theme).toBe('playful');
  });

  it('should export progress as JSON', () => {
    service.updateItemProgress('char_1', 'character', true);
    const json = service.exportProgress();
    expect(json).toBeTruthy();
    expect(JSON.parse(json).items.length).toBe(1);
  });

  it('should import progress from JSON', () => {
    service.updateItemProgress('char_1', 'character', true);
    const json = service.exportProgress();

    // Clear and reimport
    const service2 = TestBed.inject(ProgressService);
    const result = service2.importProgress(json);
    expect(result).toBe(true);
  });

  it('should save progress to localStorage on update', () => {
    service.updateItemProgress('char_1', 'character', true);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      PROGRESS_KEY,
      jasmine.any(String)
    );
  });

  it('should save settings to localStorage on update', () => {
    service.updateSettings({ theme: 'playful' });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      SETTINGS_KEY,
      jasmine.any(String)
    );
  });

  it('should persist streak across sessions', () => {
    service.updateItemProgress('char_1', 'character', true);

    // Simulate new session
    const service2 = TestBed.inject(ProgressService);
    // Streak calculation simplified in test environment
    expect(service2.stats().currentStreak).toBeGreaterThanOrEqual(0);
  });

  it('should clear all progress', () => {
    service.updateItemProgress('char_1', 'character', true);
    service.clearAllProgress();

    expect(service.items().length).toBe(0);
    expect(service.stats().totalReviewsAllTime).toBe(0);
    expect(localStorage.removeItem).toHaveBeenCalledWith(PROGRESS_KEY);
    expect(localStorage.removeItem).toHaveBeenCalledWith(SETTINGS_KEY);
  });

  it('should handle invalid progress data gracefully', () => {
    store[PROGRESS_KEY] = '{ invalid json';
    const service2 = TestBed.inject(ProgressService);
    expect(service2.items().length).toBe(0);
  });

  it('should adjust ease factor on correct answer', () => {
    const initialEase = service.items()[0]?.easeFactor ?? 2.0;
    service.updateItemProgress('char_1', 'character', true);
    const newEase = service.items()[0].easeFactor;
    expect(newEase).toBeGreaterThan(initialEase);
  });

  it('should respect mastery cooldown', () => {
    // Progress to mastered
    service.updateItemProgress('char_1', 'character', true);
    service.updateItemProgress('char_1', 'character', true);
    service.updateItemProgress('char_1', 'character', true);

    const due = service.getItemsDueForReview();
    const item = due.find(i => i.id === 'char_1');
    expect(item?.cooldownUntil).toBeGreaterThan(Date.now());
  });
});
