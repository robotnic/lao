import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../core/services/progress.service';
import { ModuleLauncher } from '../../core/services/module-launcher.service';

/**
 * Progress Screen Component
 *
 * Visualizes learning history and statistics:
 * - Overall statistics (streak, XP, accuracy, session count)
 * - Per-activity statistics
 * - Time range filters (week, month, all-time)
 * - Learning timeline with session details
 */
@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <div class="header">
        <h1>Learning Progress</h1>
        <div class="time-filters">
          <button
            *ngFor="let range of timeRanges"
            class="filter-btn"
            [class.active]="selectedRange === range.value"
            (click)="setTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <!-- Statistics Grid -->
      <section class="stats-grid">
        <div class="stat-card">
          <h3>Streak</h3>
          <div class="stat-value">{{ progress.currentStreak() }} 🔥</div>
          <p class="stat-label">days</p>
        </div>
        <div class="stat-card">
          <h3>Total XP</h3>
          <div class="stat-value">{{ progress.totalXpEarned() }}</div>
          <p class="stat-label">experience points</p>
        </div>
        <div class="stat-card">
          <h3>Accuracy</h3>
          <div class="stat-value">{{ progress.averageAccuracy() }}%</div>
          <p class="stat-label">correct answers</p>
        </div>
        <div class="stat-card">
          <h3>Sessions</h3>
          <div class="stat-value">{{ launcher.getActivityHistory().length }}</div>
          <p class="stat-label">activities completed</p>
        </div>
      </section>

      <!-- Activity Stats -->
      <section class="activity-stats">
        <h2>Activity Breakdown</h2>
        <div class="activity-list">
          <div
            *ngFor="let activity of getActivityStats()"
            class="activity-item"
          >
            <div class="activity-header">
              <h4>{{ activity.activityId }}</h4>
              <span class="badge">{{ activity.stats.totalSessions }} sessions</span>
            </div>
            <div class="activity-details">
              <div class="detail">
                <span class="label">Avg Accuracy:</span>
                <span class="value">{{ activity.stats.avgAccuracy }}%</span>
              </div>
              <div class="detail">
                <span class="label">XP Earned:</span>
                <span class="value">{{ activity.stats.totalXpEarned }}</span>
              </div>
              <div class="detail">
                <span class="label">Time Spent:</span>
                <span class="value">{{ formatDuration(activity.stats.totalDuration) }}</span>
              </div>
            </div>
            <div class="progress-bar">
              <div
                class="bar-fill"
                [style.width.%]="activity.stats.avgAccuracy"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Learning Timeline -->
      <section class="timeline">
        <h2>Recent Sessions</h2>
        <div *ngIf="launcher.getActivityHistory().length === 0" class="empty-state">
          <p>No sessions yet. Start learning to see your progress!</p>
        </div>
        <div class="timeline-items">
          <div
            *ngFor="let session of launcher.getActivityHistory().slice(0, 10)"
            class="timeline-item"
          >
            <div class="timeline-marker" [style.background]="getAccuracyColor(session.accuracy)"></div>
            <div class="timeline-content">
              <h4>{{ session.activityName }}</h4>
              <p class="timestamp">{{ formatDate(session.startTime) }}</p>
              <div class="session-details">
                <span>{{ session.accuracy }}% accuracy</span>
                <span>{{ session.correctCount }}/{{ session.itemsReviewed }} correct</span>
                <span>+{{ session.xpEarned }} XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .progress-container {
        padding: var(--spacing-lg);
        background: var(--page-bg);
        min-height: 100vh;
        color: var(--text-primary);
        max-width: 1200px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: var(--spacing-xl);
      }

      .header h1 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-2xl);
      }

      .time-filters {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--secondary-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        font-size: var(--font-size-sm);
      }

      .filter-btn:hover {
        border-color: var(--primary-color);
      }

      .filter-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }

      .stat-card {
        background: var(--tile-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        text-align: center;
      }

      .stat-card h3 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .stat-value {
        font-size: var(--font-size-2xl);
        font-weight: bold;
        color: var(--primary-color);
        margin: var(--spacing-sm) 0;
      }

      .stat-label {
        margin: 0;
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }

      .activity-stats {
        margin-bottom: var(--spacing-xl);
      }

      .activity-stats h2 {
        margin-bottom: var(--spacing-md);
      }

      .activity-list {
        display: grid;
        gap: var(--spacing-md);
      }

      .activity-item {
        background: var(--tile-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
      }

      .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .activity-header h4 {
        margin: 0;
        text-transform: capitalize;
      }

      .badge {
        background: var(--secondary-bg);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }

      .activity-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .detail {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .detail .label {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }

      .detail .value {
        font-size: var(--font-size-lg);
        font-weight: bold;
        color: var(--primary-color);
      }

      .progress-bar {
        height: 6px;
        background: var(--secondary-bg);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--success-color), var(--primary-color));
        transition: width 0.3s ease;
      }

      .timeline {
        margin-bottom: var(--spacing-xl);
      }

      .timeline h2 {
        margin-bottom: var(--spacing-md);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-lg);
        color: var(--text-secondary);
      }

      .timeline-items {
        position: relative;
        padding-left: var(--spacing-lg);
      }

      .timeline-items::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--border-color);
      }

      .timeline-item {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        position: relative;
      }

      .timeline-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-top: var(--spacing-sm);
        margin-left: -7px;
        border: 2px solid var(--page-bg);
      }

      .timeline-content {
        background: var(--tile-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        flex: 1;
      }

      .timeline-content h4 {
        margin: 0 0 var(--spacing-xs) 0;
        text-transform: capitalize;
      }

      .timestamp {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }

      .session-details {
        display: flex;
        gap: var(--spacing-md);
        font-size: var(--font-size-sm);
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .progress-container {
          padding: var(--spacing-md);
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .activity-details {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class ProgressComponent implements OnInit {
  selectedRange = 'all';
  timeRanges = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'All Time', value: 'all' }
  ];

  constructor(
    public progress: ProgressService,
    public launcher: ModuleLauncher
  ) {}

  ngOnInit(): void {}

  setTimeRange(range: string): void {
    this.selectedRange = range;
  }

  getActivityStats() {
    const activities = new Map<string, any>();

    for (const session of this.launcher.getActivityHistory()) {
      if (!activities.has(session.activityId)) {
        activities.set(session.activityId, {
          activityId: session.activityId,
          stats: this.launcher.getActivityStats(session.activityId)
        });
      }
    }

    return Array.from(activities.values()).sort((a, b) =>
      b.stats.totalSessions - a.stats.totalSessions
    );
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'var(--status-mastered)';
    if (accuracy >= 70) return 'var(--status-review)';
    if (accuracy >= 50) return 'var(--status-learning)';
    return 'var(--status-new)';
  }
}
