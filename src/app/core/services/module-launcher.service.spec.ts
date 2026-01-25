import { TestBed } from '@angular/core/testing';
import { ModuleLauncher } from './module-launcher.service';

describe('ModuleLauncher', () => {
  let service: ModuleLauncher;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModuleLauncher]
    });

    service = TestBed.inject(ModuleLauncher);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start module in idle state initially', () => {
    expect(service.moduleState()).toBe('idle');
    expect(service.isModuleActive()).toBe(false);
  });

  it('should transition to active state', (done) => {
    service.startModule('test-module', 'Test Module');
    expect(service.moduleState()).toBe('loading');

    setTimeout(() => {
      expect(service.moduleState()).toBe('active');
      expect(service.isModuleActive()).toBe(true);
      done();
    }, 600);
  });

  it('should track module name and ID', (done) => {
    service.startModule('alphabet', 'Alphabet Explorer');

    setTimeout(() => {
      const module = service.currentModule();
      expect(module?.id).toBe('alphabet');
      expect(module?.name).toBe('Alphabet Explorer');
      done();
    }, 600);
  });

  it('should pause active module', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.pauseModule();
      expect(service.moduleState()).toBe('paused');
      expect(service.isModulePaused()).toBe(true);
      done();
    }, 600);
  });

  it('should resume paused module', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.pauseModule();
      service.resumeModule();
      expect(service.moduleState()).toBe('active');
      expect(service.isModuleActive()).toBe(true);
      done();
    }, 600);
  });

  it('should track pause count', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.pauseModule();
      service.resumeModule();
      service.pauseModule();

      const module = service.currentModule();
      expect(module?.pauseCount).toBe(2);
      done();
    }, 600);
  });

  it('should stop module and record metrics', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      const metrics = service.stopModule({
        itemsReviewed: 10,
        correctCount: 8,
        xpEarned: 40
      });

      expect(metrics).toBeTruthy();
      expect(metrics?.itemsReviewed).toBe(10);
      expect(metrics?.correctCount).toBe(8);
      expect(metrics?.incorrectCount).toBe(2);
      expect(metrics?.accuracy).toBe(80);
      expect(metrics?.xpEarned).toBe(40);
      done();
    }, 600);
  });

  it('should add metrics to history', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.stopModule({
        itemsReviewed: 5,
        correctCount: 4,
        xpEarned: 20
      });

      const history = service.getActivityHistory();
      expect(history.length).toBe(1);
      done();
    }, 600);
  });

  it('should get last metrics', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.stopModule({
        itemsReviewed: 10,
        correctCount: 7,
        xpEarned: 35
      });

      const metrics = service.getLastMetrics();
      expect(metrics?.accuracy).toBe(70);
      done();
    }, 600);
  });

  it('should calculate activity stats', (done) => {
    service.startModule('alphabet', 'Alphabet');
    setTimeout(() => {
      service.stopModule({
        itemsReviewed: 10,
        correctCount: 8,
        xpEarned: 40
      });

      service.startModule('alphabet', 'Alphabet');
      setTimeout(() => {
        service.stopModule({
          itemsReviewed: 10,
          correctCount: 9,
          xpEarned: 45
        });

        const stats = service.getActivityStats('alphabet');
        expect(stats.totalSessions).toBe(2);
        expect(stats.avgAccuracy).toBe(85); // (80 + 90) / 2
        expect(stats.totalXpEarned).toBe(85);
        done();
      }, 600);
    }, 600);
  });

  it('should calculate overall stats', (done) => {
    service.startModule('alphabet', 'Alphabet');
    setTimeout(() => {
      service.stopModule({
        itemsReviewed: 10,
        correctCount: 8,
        xpEarned: 40
      });

      service.startModule('vocab', 'Vocabulary');
      setTimeout(() => {
        service.stopModule({
          itemsReviewed: 10,
          correctCount: 9,
          xpEarned: 45
        });

        const stats = service.getOverallStats();
        expect(stats.totalSessions).toBe(2);
        expect(stats.totalXpEarned).toBe(85);
        expect(stats.avgAccuracy).toBe(85);
        done();
      }, 600);
    }, 600);
  });

  it('should find most played activity', (done) => {
    const startAndStop = (id: string) => {
      service.startModule(id, id);
      setTimeout(() => {
        service.stopModule({
          itemsReviewed: 5,
          correctCount: 4,
          xpEarned: 20
        });
      }, 600);
    };

    startAndStop('alphabet');
    setTimeout(() => {
      startAndStop('alphabet');
      setTimeout(() => {
        startAndStop('vocab');
        setTimeout(() => {
          const stats = service.getOverallStats();
          expect(stats.mostPlayedActivity).toBe('alphabet');
          done();
        }, 600);
      }, 600);
    }, 600);
  });

  it('should abort module without saving metrics', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.abortModule();
      expect(service.moduleState()).toBe('idle');
      expect(service.getActivityHistory().length).toBe(0);
      done();
    }, 600);
  });

  it('should provide debug info', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      const debug = service.getDebugInfo();
      expect(debug.moduleState).toBe('active');
      expect(debug.isActive).toBe(true);
      expect(debug.currentDuration).toBeGreaterThan(0);
      done();
    }, 600);
  });

  it('should track duration accurately', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      const duration = service.currentDuration();
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // Less than our wait time + buffer
      done();
    }, 300);
  });

  it('should exclude pause time from duration', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      const durationBeforePause = service.currentDuration();

      service.pauseModule();
      setTimeout(() => {
        service.resumeModule();
        const durationAfterResume = service.currentDuration();

        // Should be similar or slightly higher due to overhead
        expect(durationAfterResume).toBeLessThan(
          durationBeforePause + 100
        );
        done();
      }, 200);
    }, 600);
  });

  it('should clear history', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      service.stopModule({
        itemsReviewed: 5,
        correctCount: 4,
        xpEarned: 20
      });

      expect(service.getActivityHistory().length).toBe(1);
      service.clearHistory();
      expect(service.getActivityHistory().length).toBe(0);
      done();
    }, 600);
  });

  it('should calculate 0% accuracy with no items reviewed', (done) => {
    service.startModule('test', 'Test');

    setTimeout(() => {
      const metrics = service.stopModule({
        itemsReviewed: 0,
        correctCount: 0,
        xpEarned: 0
      });

      expect(metrics?.accuracy).toBe(0);
      done();
    }, 600);
  });
});
