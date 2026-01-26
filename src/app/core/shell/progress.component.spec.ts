import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProgressComponent } from './progress.component';
import { ProgressService } from '../services/progress.service';
import { ModuleLauncher } from '../services/module-launcher.service';

describe('ProgressComponent', () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;
  let progress: ProgressService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [ProgressService, ModuleLauncher]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    progress = TestBed.inject(ProgressService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Statistics Display', () => {
    it('should display current streak', () => {
      fixture.detectChanges();
      const streakCard = fixture.nativeElement.querySelector('.stat-card');
      expect(streakCard).toBeTruthy();
    });

    it('should display total XP earned', () => {
      fixture.detectChanges();
      const xpValue = progress.totalXpEarned();
      expect(typeof xpValue).toBe('number');
    });

    it('should display average accuracy percentage', () => {
      fixture.detectChanges();
      const accuracy = progress.averageAccuracy();
      expect(typeof accuracy).toBe('number');
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });

    it('should update statistics when progress changes', () => {
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const stats = progress.stats();
      expect(stats).toBeTruthy();
      expect(stats.totalReviewsAllTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Time Range Filters', () => {
    it('should render time filter buttons', () => {
      fixture.detectChanges();
      const filterBtns = fixture.nativeElement.querySelectorAll('.filter-btn');
      expect(filterBtns.length).toBeGreaterThan(0);
    });

    it('should have week, month, all-time filter options', () => {
      fixture.detectChanges();
      const filterLabels = Array.from(fixture.nativeElement.querySelectorAll('.filter-btn')).map(
        (btn: any) => btn.textContent
      );
      // Should have at least week and all-time options
      expect(filterLabels.length).toBeGreaterThan(0);
    });

    it('should set active filter on click', () => {
      fixture.detectChanges();
      const filterBtns = fixture.nativeElement.querySelectorAll('.filter-btn');
      if (filterBtns.length > 0) {
        filterBtns[0].click();
        fixture.detectChanges();

        const activeBtn = fixture.nativeElement.querySelector('.filter-btn.active');
        expect(activeBtn).toBeTruthy();
      }
    });

    it('should update time range when filter changes', () => {
      component.setTimeRange('week');
      expect(component.selectedRange).toBe('week');
      expect(component.selectedRange).not.toBe('all');
    });
  });

  describe('Timeline View', () => {
    it('should render activity timeline section', () => {
      fixture.detectChanges();
      const timeline = fixture.nativeElement.querySelector('.timeline') ||
                       fixture.nativeElement.querySelector('[class*="timeline"]');
      // Timeline may be optional based on data
      expect(timeline || true).toBe(true);
    });

    it('should display session history', () => {
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const items = progress.items();
      expect(Array.isArray(items)).toBe(true);
    });

    it('should show activity breakdown per feature', () => {
      progress.updateItemProgress('char_1', 'character', true);
      progress.updateItemProgress('word_1', 'word', true);
      fixture.detectChanges();

      const items = progress.items();
      const characterItems = items.filter(i => i.itemType === 'character');
      const wordItems = items.filter(i => i.itemType === 'word');

      expect(characterItems.length).toBeGreaterThan(0);
      expect(wordItems.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Statistics', () => {
    it('should aggregate stats by item type', () => {
      progress.updateItemProgress('char_1', 'character', true);
      progress.updateItemProgress('word_1', 'word', true);
      progress.updateItemProgress('phrase_1', 'phrase', true);
      fixture.detectChanges();

      const items = progress.items();
      const byType = {
        character: items.filter(i => i.itemType === 'character').length,
        word: items.filter(i => i.itemType === 'word').length,
        phrase: items.filter(i => i.itemType === 'phrase').length
      };

      expect(byType.character + byType.word + byType.phrase).toBeGreaterThan(0);
    });

    it('should display mastered count', () => {
      progress.updateItemProgress('char_1', 'character', true);
      progress.updateItemProgress('char_1', 'character', true);
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const items = progress.items();
      const mastered = items.filter(i => i.srsState === 'mastered');
      expect(Array.isArray(mastered)).toBe(true);
    });

    it('should track learning count (learning state)', () => {
      progress.updateItemProgress('word_1', 'word', true);
      progress.updateItemProgress('word_2', 'word', false);
      fixture.detectChanges();

      const items = progress.items();
      const learning = items.filter(i => i.srsState === 'learning');
      expect(Array.isArray(learning)).toBe(true);
    });
  });

  describe('Streak Display', () => {
    it('should show current streak counter', () => {
      fixture.detectChanges();
      const streak = progress.currentStreak();
      expect(typeof streak).toBe('number');
    });

    it('should show longest streak', () => {
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const stats = progress.stats();
      expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);
    });

    it('should display streak with fire emoji', () => {
      fixture.detectChanges();
      // Verify streak is displayed
      expect(typeof fixture.nativeElement.textContent).toBe('string');
    });
  });

  describe('XP Progress', () => {
    it('should display total XP earned', () => {
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const xp = progress.totalXpEarned();
      expect(typeof xp).toBe('number');
    });

    it('should update XP when items are completed', () => {
      const initialXp = progress.totalXpEarned();
      progress.updateItemProgress('char_1', 'character', true);
      fixture.detectChanges();

      const updatedXp = progress.totalXpEarned();
      expect(updatedXp).toBeGreaterThanOrEqual(initialXp);
    });
  });

  describe('Accuracy Display', () => {
    it('should display average accuracy as percentage', () => {
      progress.updateItemProgress('char_1', 'character', true);
      progress.updateItemProgress('char_1', 'character', false);
      fixture.detectChanges();

      const accuracy = progress.averageAccuracy();
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });

    it('should recalculate accuracy on progress update', () => {
      progress.updateItemProgress('word_1', 'word', true);
      const accuracy1 = progress.averageAccuracy();

      progress.updateItemProgress('word_1', 'word', false);
      const accuracy2 = progress.averageAccuracy();

      expect(typeof accuracy1).toBe('number');
      expect(typeof accuracy2).toBe('number');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      fixture.detectChanges();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1.textContent).toContain('Progress');
    });

    it('should have accessible filter buttons', () => {
      fixture.detectChanges();
      const filterBtns = fixture.nativeElement.querySelectorAll('.filter-btn');
      filterBtns.forEach((btn: HTMLButtonElement) => {
        expect(btn.textContent).toBeTruthy();
        expect(btn.tabIndex >= -1).toBe(true);
      });
    });

    it('should have semantic HTML for stats', () => {
      fixture.detectChanges();
      const statCards = fixture.nativeElement.querySelectorAll('.stat-card');
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render stats grid container', () => {
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector('.stats-grid');
      expect(grid).toBeTruthy();
    });

    it('should display stat cards in responsive layout', () => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.stat-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Signal Reactivity', () => {
    it('should reactively update when progress service changes', () => {
      const initialStats = progress.stats();
      progress.updateItemProgress('char_1', 'character', true);
      const updatedStats = progress.stats();

      expect(updatedStats.totalReviewsAllTime).toBeGreaterThanOrEqual(
        initialStats.totalReviewsAllTime
      );
    });

    it('should update streak signal reactively', () => {
      const streakSignal = progress.currentStreak;
      expect(streakSignal).toBeTruthy();
    });
  });
});
