import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { JsonDataProviderService } from '../../core/services/json-data-provider.service';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Dashboard Shell Component
 *
 * Main learning hub with Bento grid layout containing:
 * - Hero tile: Daily streak and XP progress
 * - Resume tile: Last active level with quick-start button
 * - Alphabet tile: Character mastery heatmap (8x8 grid)
 * - Game Hub tile: Mini-game cards for all activities
 *
 * Responsive across mobile, tablet, and desktop.
 * Uses Signals for reactive state management.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container" [class.loading]="dataProvider.state().isLoading">
      <!-- Loading state -->
      <div *ngIf="dataProvider.state().isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading knowledge base...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="dataProvider.state().hasError" class="error-banner">
        <p>⚠️ Failed to load content: {{ dataProvider.state().error }}</p>
      </div>

      <!-- Main dashboard grid -->
      <div *ngIf="!dataProvider.state().isLoading && dataProvider.state().isLoaded" class="dashboard-grid">
        <!-- Hero Tile: Streak & XP -->
        <section class="tile hero-tile">
          <div class="tile-content">
            <h2>Your Progress</h2>
            <div class="stat-row">
              <div class="stat">
                <span class="label">🔥 Streak</span>
                <span class="value">{{ progress.currentStreak() }} days</span>
              </div>
              <div class="stat">
                <span class="label">⭐ Total XP</span>
                <span class="value">{{ progress.totalXpEarned() }}</span>
              </div>
            </div>
            <div class="accuracy-bar">
              <div class="accuracy-label">
                Accuracy: <strong>{{ progress.averageAccuracy() }}%</strong>
              </div>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  [style.width.%]="progress.averageAccuracy()"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Resume Tile: Last Active Level -->
        <section class="tile resume-tile">
          <div class="tile-content">
            <h3>Continue Learning</h3>
            <p class="subtitle">Pick up where you left off</p>
            <button class="btn-primary" [disabled]="!getLastActiveLevel()">
              {{ getLastActiveLevel()?.level_id ?? 'No Level Started' }}
            </button>
            <p class="hint">{{ getLastActiveLevel() ? 'Tap to resume' : 'Complete a level to see progress' }}</p>
          </div>
        </section>

        <!-- Alphabet Tile: Character Mastery -->
        <section class="tile alphabet-tile" (click)="startActivity('alphabet')" style="cursor: pointer;">
          <div class="tile-content">
            <h3>Character Mastery</h3>
            <div class="mastery-grid">
              <div
                *ngFor="let char of getDisplayedCharacters()"
                class="mastery-cell"
                [class.new]="getMasteryLevel(char.id) === 'new'"
                [class.learning]="getMasteryLevel(char.id) === 'learning'"
                [class.review]="getMasteryLevel(char.id) === 'review'"
                [class.mastered]="getMasteryLevel(char.id) === 'mastered'"
                [title]="char.name + ' - ' + getMasteryLevel(char.id)"
              >
                {{ char.lao }}
              </div>
            </div>
            <div class="legend">
              <span class="legend-item new">● New</span>
              <span class="legend-item learning">● Learning</span>
              <span class="legend-item review">● Review</span>
              <span class="legend-item mastered">● Mastered</span>
            </div>
          </div>
        </section>

        <!-- Game Hub Tile: Activity Cards -->
        <section class="tile game-hub-tile">
          <div class="tile-content">
            <h3>Activities</h3>
            <div class="activity-grid">
              <button
                *ngFor="let activity of activities"
                class="activity-card"
                [disabled]="!activity.enabled"
                (click)="startActivity(activity.id)"
              >
                <span class="icon">{{ activity.icon }}</span>
                <span class="name">{{ activity.name }}</span>
                <span class="hint">{{ activity.hint }}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--page-bg);
        padding: var(--spacing-md);
        font-family: var(--font-family);
        color: var(--text-primary);
        transition: background 0.3s, color 0.3s;
      }

      .loading-overlay,
      .error-banner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        gap: var(--spacing-md);
      }

      .loading-overlay {
        background: rgba(0, 0, 0, 0.1);
        min-height: 300px;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--primary-color);
        border-top: 4px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-banner {
        background: var(--error-bg);
        color: var(--error-text);
        border-left: 4px solid var(--error-color);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
        animation: fadeIn 0.5s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .tile {
        background: var(--tile-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-normal);
        overflow: hidden;
        min-height: 250px;
      }

      .tile:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .tile-content {
        padding: var(--spacing-lg);
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .tile h2,
      .tile h3 {
        margin: 0;
        font-size: var(--font-size-lg);
        color: var(--text-primary);
      }

      .hero-tile {
        grid-column: 1 / -1;
      }

      .stat-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .stat .label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 500;
      }

      .stat .value {
        font-size: var(--font-size-xl);
        font-weight: bold;
        color: var(--primary-color);
      }

      .accuracy-bar {
        margin-top: var(--spacing-md);
      }

      .accuracy-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .bar-container {
        width: 100%;
        height: 8px;
        background: var(--secondary-bg);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--success-color), var(--primary-color));
        transition: width 0.5s ease;
      }

      .resume-tile .subtitle {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .btn-primary {
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-normal);
        min-height: 44px;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .hint {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .mastery-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-sm);
        margin: var(--spacing-md) 0;
      }

      .mastery-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-lg);
        font-weight: bold;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        border: 2px solid transparent;
      }

      .mastery-cell.new {
        background: var(--status-new);
        color: white;
      }

      .mastery-cell.learning {
        background: var(--status-learning);
        color: white;
      }

      .mastery-cell.review {
        background: var(--status-review);
        color: white;
      }

      .mastery-cell.mastered {
        background: var(--status-mastered);
        color: white;
      }

      .mastery-cell:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-md);
      }

      .legend {
        display: flex;
        gap: var(--spacing-md);
        font-size: var(--font-size-xs);
        flex-wrap: wrap;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--text-secondary);
      }

      .activity-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .activity-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        min-height: 100px;
        font-family: var(--font-family);
      }

      .activity-card:hover:not(:disabled) {
        background: var(--primary-bg);
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }

      .activity-card:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .activity-card .icon {
        font-size: var(--font-size-xl);
      }

      .activity-card .name {
        font-size: var(--font-size-sm);
        font-weight: 600;
        text-align: center;
        color: var(--text-primary);
      }

      .activity-card .hint {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        text-align: center;
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: var(--spacing-sm);
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }

        .hero-tile {
          grid-column: 1;
        }

        .stat-row {
          grid-template-columns: 1fr;
        }

        .mastery-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .activity-grid {
          grid-template-columns: 1fr;
        }
      }

      button:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  activities = [
    { id: 'alphabet', name: 'Alphabet', icon: '🔤', hint: 'Learn characters', enabled: true },
    { id: 'vowels', name: 'Vowels', icon: '🎙️', hint: 'Vowel sounds', enabled: true },
    { id: 'vocabulary', name: 'Vocabulary', icon: '📚', hint: 'Word building', enabled: true },
    { id: 'tones', name: 'Tones', icon: '🎵', hint: 'Tone matching', enabled: true },
    { id: 'phrases', name: 'Phrases', icon: '💬', hint: 'Common phrases', enabled: true },
    { id: 'scramble', name: 'Scramble', icon: '🔀', hint: 'Word scramble', enabled: false },
    { id: 'listening', name: 'Listening', icon: '👂', hint: 'Comprehension', enabled: false }
  ];

  constructor(
    public progress: ProgressService,
    public dataProvider: JsonDataProviderService,
    public theme: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Component uses injected services via public accessors
  }

  startActivity(activityId: string): void {
    const routes: { [key: string]: string } = {
      alphabet: '/alphabet-explorer',
      vowels: '/vowel-explorer',
      vocabulary: '/vocabulary-quiz',
      tones: '/tone-matcher',
      phrases: '/phrase-builder',
      scramble: '/character-scramble',
      listening: '/listening-comprehension'
    };

    const route = routes[activityId];
    if (route) {
      this.router.navigate([route]);
    }
  }

  getLastActiveLevel() {
    const levels = this.progress.levels();
    return levels.find(l => l.isUnlocked && l.startDate);
  }

  getDisplayedCharacters() {
    const chars = this.dataProvider.alphabet();
    return chars.slice(0, 16);
  }

  getMasteryLevel(charId: string): string {
    const items = this.progress.items();
    const item = items.find(i => i.id === charId);

    if (!item) return 'new';

    if (item.cooldownUntil && item.cooldownUntil > Date.now()) {
      return 'mastered';
    }

    return item.srsState;
  }
}
