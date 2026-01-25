import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { JsonDataProviderService } from '../../core/services/json-data-provider.service';
import { ModuleLauncher } from '../../core/services/module-launcher.service';
import { ProgressService } from '../../core/services/progress.service';
import { AudioService } from '../../core/services/audio.service';

interface Character {
  id: string;
  lao: string;
  name: string;
  type: string;
  class: string;
  sounds: { sound_initial: string; sound_final: string };
  mnemonic: string;
  level_id: string;
  audio_key: string;
}

/**
 * Alphabet Explorer - Discovery Phase
 *
 * Displays a grid of Lao characters for learning:
 * - Click to see details and pronunciation
 * - TTS integration for audio learning
 * - Visual mastery indicator (color-coded)
 * - Mnemonic helper for each character
 */
@Component({
  selector: 'app-alphabet-discovery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-container">
      <div class="activity-header">
        <h1>Alphabet Explorer</h1>
        <p class="subtitle">Learn Lao characters through recognition</p>
      </div>

      <div class="level-selector" *ngIf="levels.length > 1">
        <button
          *ngFor="let level of levels"
          class="level-btn"
          [class.active]="selectedLevelId === level.id"
          (click)="selectLevel(level.id)"
        >
          {{ level.title }}
        </button>
      </div>

      <!-- Character Grid -->
      <div class="grid-container">
        <div
          *ngFor="let char of displayedCharacters"
          class="character-card"
          [class.mastery-new]="getMastery(char.id) === 'new'"
          [class.mastery-learning]="getMastery(char.id) === 'learning'"
          [class.mastery-review]="getMastery(char.id) === 'review'"
          [class.mastery-mastered]="getMastery(char.id) === 'mastered'"
          (click)="selectCharacter(char)"
        >
          <div class="character-display">{{ char.lao }}</div>
          <div class="character-name">{{ char.name }}</div>
          <div class="mastery-indicator">
            {{ getMastery(char.id) }}
          </div>
        </div>
      </div>

      <!-- Character Detail Modal -->
      <div *ngIf="selectedCharacter" class="modal-overlay" (click)="closeDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeDetail()">✕</button>

          <div class="detail-header">
            <h2 class="big-character">{{ selectedCharacter.lao }}</h2>
            <h3>{{ selectedCharacter.name }}</h3>
          </div>

          <div class="detail-body">
            <div class="detail-section">
              <h4>Sound</h4>
              <p class="sound-info">
                <strong>Initial:</strong> {{ selectedCharacter.sounds.sound_initial }}<br />
                <strong>Final:</strong> {{ selectedCharacter.sounds.sound_final }}
              </p>
            </div>

            <div class="detail-section">
              <h4>Classification</h4>
              <p>
                <strong>Type:</strong> {{ selectedCharacter.type }}<br />
                <strong>Class:</strong> {{ selectedCharacter.class }}
              </p>
            </div>

            <div class="detail-section">
              <h4>Mnemonic</h4>
              <p class="mnemonic">{{ selectedCharacter.mnemonic }}</p>
            </div>

            <button class="btn btn-primary" (click)="playAudio()">
              🔊 Listen to Pronunciation
            </button>
          </div>

          <div class="mastery-badge" [class]="'mastery-' + getMastery(selectedCharacter.id)">
            {{ getMastery(selectedCharacter.id) | uppercase }}
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-stats">
          <span>Reviewed: {{ reviewedCount }}/{{ displayedCharacters.length }}</span>
          <span>Mastered: {{ masteredCount }}/{{ displayedCharacters.length }}</span>
        </div>
        <div class="progress-bar">
          <div class="bar-fill" [style.width.%]="(masteredCount / displayedCharacters.length) * 100"></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-secondary" (click)="goBack()">← Back to Dashboard</button>
        <button class="btn btn-primary" (click)="startQuiz()" [disabled]="masteredCount < 5">
          Start Quiz ({{ masteredCount }}/5 required)
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .activity-container {
        padding: var(--spacing-lg);
        background: var(--page-bg);
        min-height: 100vh;
        color: var(--text-primary);
        max-width: 1200px;
        margin: 0 auto;
      }

      .activity-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
      }

      .activity-header h1 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-3xl);
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--font-size-lg);
      }

      .level-selector {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        margin-bottom: var(--spacing-xl);
        flex-wrap: wrap;
      }

      .level-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--secondary-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        font-weight: 500;
      }

      .level-btn:hover {
        border-color: var(--primary-color);
      }

      .level-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }

      .character-card {
        background: var(--tile-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-normal);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        min-height: 140px;
        justify-content: center;
      }

      .character-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        border-width: 3px;
      }

      .character-card.mastery-new {
        border-color: #888;
        background: linear-gradient(135deg, #f5f5f5, #fafafa);
      }

      .character-card.mastery-learning {
        border-color: #ffa500;
        background: linear-gradient(135deg, #fff8f0, #fffbf5);
        border-width: 3px;
      }

      .character-card.mastery-review {
        border-color: #4a90e2;
        background: linear-gradient(135deg, #e8f4ff, #f0f8ff);
        border-width: 3px;
      }

      .character-card.mastery-mastered {
        border-color: #28a745;
        background: linear-gradient(135deg, #d4edda, #e8f5e9);
        border-width: 3px;
      }

      .character-display {
        font-size: 4rem;
        font-weight: bold;
        line-height: 1;
        color: var(--text-primary);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
      }

      .character-name {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        font-weight: 500;
      }

      .mastery-indicator {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--primary-color);
        text-transform: capitalize;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-md);
        backdrop-filter: blur(2px);
      }

      .modal-content {
        background: var(--tile-bg);
        border-radius: var(--radius-xl);
        padding: var(--spacing-xl);
        max-width: 400px;
        width: 100%;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .close-btn {
        position: absolute;
        top: var(--spacing-md);
        right: var(--spacing-md);
        background: none;
        border: none;
        font-size: var(--font-size-xl);
        cursor: pointer;
        color: var(--text-secondary);
      }

      .detail-header {
        text-align: center;
        margin-bottom: var(--spacing-lg);
      }

      .big-character {
        font-size: 5rem;
        margin: 0 0 var(--spacing-sm) 0;
        line-height: 1;
      }

      .detail-header h3 {
        margin: 0;
        color: var(--text-secondary);
      }

      .detail-body {
        margin-bottom: var(--spacing-lg);
      }

      .detail-section {
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color-light);
      }

      .detail-section h4 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-lg);
      }

      .detail-section p {
        margin: 0;
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      .sound-info {
        font-family: monospace;
        background: var(--secondary-bg);
        padding: var(--spacing-sm);
        border-radius: var(--radius-md);
      }

      .mnemonic {
        font-style: italic;
        color: var(--primary-color);
      }

      .btn {
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 500;
        transition: all var(--transition-normal);
        width: 100%;
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-secondary {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
      }

      .btn-secondary:hover {
        border-color: var(--primary-color);
      }

      .mastery-badge {
        text-align: center;
        padding: var(--spacing-sm);
        border-radius: var(--radius-md);
        font-weight: bold;
        font-size: var(--font-size-sm);
      }

      .mastery-new {
        background: var(--status-new);
        color: white;
      }

      .mastery-learning {
        background: var(--status-learning);
        color: white;
      }

      .mastery-review {
        background: var(--status-review);
        color: white;
      }

      .mastery-mastered {
        background: var(--status-mastered);
        color: white;
      }

      .progress-section {
        background: var(--tile-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
      }

      .progress-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-md);
        font-size: var(--font-size-sm);
      }

      .progress-bar {
        height: 8px;
        background: var(--secondary-bg);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--status-learning), var(--status-mastered));
        transition: width 0.3s ease;
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
      }

      .action-buttons .btn {
        flex: 1;
        max-width: 300px;
      }

      @media (max-width: 768px) {
        .grid-container {
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        }

        .big-character {
          font-size: 3rem;
        }

        .action-buttons {
          flex-direction: column;
        }

        .action-buttons .btn {
          max-width: 100%;
        }
      }
    `
  ]
})
export class AlphabetDiscoveryComponent implements OnInit {
  selectedLevelId = '';
  selectedCharacter: Character | null = null;
  displayedCharacters: Character[] = [];
  levels: any[] = [];

  get reviewedCount(): number {
    return this.displayedCharacters.filter(c => 
      this.getMastery(c.id) !== 'new'
    ).length;
  }

  get masteredCount(): number {
    return this.displayedCharacters.filter(c => 
      this.getMastery(c.id) === 'mastered'
    ).length;
  }

  constructor(
    private jsonData: JsonDataProviderService,
    private launcher: ModuleLauncher,
    private progress: ProgressService,
    private router: Router,
    private route: ActivatedRoute,
    private audio: AudioService
  ) {}

  ngOnInit(): void {
    this.launcher.startModule('alphabet-explorer', 'Alphabet Explorer');
    this.loadLevels();
    
    // Get level from route params or default to first
    this.route.queryParams.subscribe(params => {
      if (params['level']) {
        this.selectLevel(params['level']);
      } else if (this.levels.length > 0) {
        this.selectLevel(this.levels[0].id);
      }
    });
  }

  loadLevels(): void {
    const allLevels = this.jsonData.levels();
    this.levels = allLevels;
  }

  selectLevel(levelId: string): void {
    this.selectedLevelId = levelId;
    const alphabet = this.jsonData.alphabet();
    const levelChars = alphabet.filter((c: any) => c.level_id === levelId);
    this.displayedCharacters = levelChars as any;
  }

  selectCharacter(char: any): void {
    this.selectedCharacter = char;
  }

  closeDetail(): void {
    this.selectedCharacter = null;
  }

  playAudio(): void {
    if (!this.selectedCharacter) return;

    // Play audio file with TTS fallback
    this.audio.playLao(this.selectedCharacter.audio_key, this.selectedCharacter.lao);
  }

  getMastery(characterId: string): string {
    const item = this.progress.items().find((i: any) => i.id === characterId);
    return (item as any)?.masteryLevel || 'new';
  }

  startQuiz(): void {
    // Navigate to mastery phase
    this.router.navigate(['/alphabet-quiz'], { 
      queryParams: { level: this.selectedLevelId }
    });
  }

  goBack(): void {
    this.launcher.stopModule({ itemsReviewed: 0, correctCount: 0, xpEarned: 0 });
    this.router.navigate(['/dashboard']);
  }
}
