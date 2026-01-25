import { Injectable, signal, computed } from '@angular/core';

/**
 * Activity lifecycle states
 */
export type ModuleState = 'idle' | 'loading' | 'active' | 'paused' | 'completed';

/**
 * Activity metrics collected during session
 */
export interface ActivityMetrics {
  activityId: string;
  activityName: string;
  startTime: number;
  endTime?: number;
  duration: number; // milliseconds
  itemsReviewed: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0-100
  xpEarned: number;
}

/**
 * Active module/activity context
 */
export interface ModuleContext {
  id: string;
  name: string;
  state: ModuleState;
  startTime: number;
  pauseCount: number;
  totalPauseDuration: number;
  metrics: ActivityMetrics | null;
}

/**
 * ModuleLauncher Service
 *
 * Orchestrates feature/activity state transitions and lifecycle.
 * Manages currentModule, isModuleActive signals.
 * Handles start/pause/resume/stop lifecycle for activities.
 *
 * Usage:
 *   constructor(private launcher: ModuleLauncher) {}
 *   currentModule$ = this.launcher.currentModule;
 *   isActive$ = this.launcher.isModuleActive;
 *   this.launcher.startModule('alphabet-explorer', 'Alphabet Explorer');
 */
@Injectable({
  providedIn: 'root'
})
export class ModuleLauncher {
  // Raw module state
  private readonly moduleContext = signal<ModuleContext | null>(null);
  private readonly pauseStartTime = signal<number | null>(null);
  private readonly history = signal<ActivityMetrics[]>([]);

  // Exposed computed signals
  currentModule = computed(() => this.moduleContext());
  moduleState = computed(() => this.moduleContext()?.state ?? 'idle');
  isModuleActive = computed(() => this.moduleState() === 'active');
  isModulePaused = computed(() => this.moduleState() === 'paused');
  activityHistory = computed(() => this.history());

  // Convenience signals
  currentDuration = computed(() => {
    const ctx = this.moduleContext();
    if (!ctx) return 0;

    const elapsed = Date.now() - ctx.startTime;
    const totalPause = ctx.totalPauseDuration;

    if (ctx.state === 'paused') {
      const pauseElapsed = (this.pauseStartTime() ?? Date.now()) - ctx.startTime;
      return Math.max(0, elapsed - totalPause - pauseElapsed);
    }

    return Math.max(0, elapsed - totalPause);
  });

  constructor() {}

  /**
   * Start a new activity/module
   */
  startModule(moduleId: string, moduleName: string): void {
    this.moduleContext.set({
      id: moduleId,
      name: moduleName,
      state: 'loading',
      startTime: Date.now(),
      pauseCount: 0,
      totalPauseDuration: 0,
      metrics: null
    });

    // Transition to active after brief loading
    setTimeout(() => {
      const ctx = this.moduleContext();
      if (ctx && ctx.state === 'loading') {
        ctx.state = 'active';
        this.moduleContext.set({ ...ctx });
      }
    }, 500);
  }

  /**
   * Pause current activity
   */
  pauseModule(): void {
    const ctx = this.moduleContext();
    if (!ctx || ctx.state !== 'active') return;

    ctx.state = 'paused';
    ctx.pauseCount++;
    this.pauseStartTime.set(Date.now());
    this.moduleContext.set({ ...ctx });
  }

  /**
   * Resume paused activity
   */
  resumeModule(): void {
    const ctx = this.moduleContext();
    const pauseStart = this.pauseStartTime();

    if (!ctx || ctx.state !== 'paused' || !pauseStart) return;

    const pauseDuration = Date.now() - pauseStart;
    ctx.totalPauseDuration += pauseDuration;
    ctx.state = 'active';

    this.pauseStartTime.set(null);
    this.moduleContext.set({ ...ctx });
  }

  /**
   * Stop activity and record metrics
   */
  stopModule(metrics: {
    itemsReviewed: number;
    correctCount: number;
    xpEarned: number;
  }): ActivityMetrics | null {
    const ctx = this.moduleContext();
    if (!ctx) return null;

    const incorrectCount = metrics.itemsReviewed - metrics.correctCount;
    const accuracy =
      metrics.itemsReviewed > 0
        ? Math.round((metrics.correctCount / metrics.itemsReviewed) * 100)
        : 0;

    const activityMetrics: ActivityMetrics = {
      activityId: ctx.id,
      activityName: ctx.name,
      startTime: ctx.startTime,
      endTime: Date.now(),
      duration: this.currentDuration(),
      itemsReviewed: metrics.itemsReviewed,
      correctCount: metrics.correctCount,
      incorrectCount: incorrectCount,
      accuracy: accuracy,
      xpEarned: metrics.xpEarned
    };

    // Save to history
    const newHistory = [...this.history(), activityMetrics];
    this.history.set(newHistory);

    // Update context
    ctx.metrics = activityMetrics;
    ctx.state = 'completed';
    this.moduleContext.set({ ...ctx });

    return activityMetrics;
  }

  /**
   * Abort current activity without saving metrics
   */
  abortModule(): void {
    this.moduleContext.set(null);
    this.pauseStartTime.set(null);
  }

  /**
   * Get metrics for completed activity
   */
  getLastMetrics(): ActivityMetrics | null {
    const ctx = this.moduleContext();
    return ctx?.metrics ?? null;
  }

  /**
   * Get activity history
   */
  getActivityHistory(): ActivityMetrics[] {
    return this.history();
  }

  /**
   * Get stats for specific activity ID
   */
  getActivityStats(activityId: string): {
    totalSessions: number;
    totalDuration: number;
    avgAccuracy: number;
    totalXpEarned: number;
  } {
    const activities = this.history().filter(a => a.activityId === activityId);

    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
    const avgAccuracy =
      activities.length > 0
        ? Math.round(
            activities.reduce((sum, a) => sum + a.accuracy, 0) /
              activities.length
          )
        : 0;
    const totalXpEarned = activities.reduce((sum, a) => sum + a.xpEarned, 0);

    return {
      totalSessions: activities.length,
      totalDuration: totalDuration,
      avgAccuracy: avgAccuracy,
      totalXpEarned: totalXpEarned
    };
  }

  /**
   * Get overall stats
   */
  getOverallStats(): {
    totalSessions: number;
    totalDuration: number;
    avgAccuracy: number;
    totalXpEarned: number;
    mostPlayedActivity: string | null;
  } {
    const activities = this.history();

    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
    const avgAccuracy =
      activities.length > 0
        ? Math.round(
            activities.reduce((sum, a) => sum + a.accuracy, 0) /
              activities.length
          )
        : 0;
    const totalXpEarned = activities.reduce((sum, a) => sum + a.xpEarned, 0);

    // Find most played activity
    const activityCounts: Record<string, number> = {};
    for (const activity of activities) {
      activityCounts[activity.activityId] =
        (activityCounts[activity.activityId] ?? 0) + 1;
    }

    const mostPlayedActivity =
      Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      totalSessions: activities.length,
      totalDuration: totalDuration,
      avgAccuracy: avgAccuracy,
      totalXpEarned: totalXpEarned,
      mostPlayedActivity: mostPlayedActivity
    };
  }

  /**
   * Clear activity history (testing only)
   */
  clearHistory(): void {
    this.history.set([]);
  }

  /**
   * Debug info
   */
  getDebugInfo(): {
    currentModule: ModuleContext | null;
    moduleState: ModuleState;
    isActive: boolean;
    currentDuration: number;
    historyCount: number;
  } {
    return {
      currentModule: this.currentModule(),
      moduleState: this.moduleState(),
      isActive: this.isModuleActive(),
      currentDuration: this.currentDuration(),
      historyCount: this.activityHistory().length
    };
  }
}
