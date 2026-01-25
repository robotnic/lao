import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JsonDataProviderService } from '../../core/services/json-data-provider.service';
import { ProgressService } from '../../core/services/progress.service';
import { ModuleLauncher } from '../../core/services/module-launcher.service';

interface ListeningQuestion {
  wordId: string;
  lao: string;
  english: string;
  options: string[];
  selectedIndex: number | null;
  isCorrect: boolean | null;
  answered: boolean;
}

@Component({
  selector: 'app-listening-comprehension',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="listening-container">
      <div class="listening-header">
        <button (click)="goBack()" class="back-btn">← Back</button>
        <h1>Listening Comprehension</h1>
        <div class="progress-info">
          <div>Question {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</div>
          <div class="score-badge">{{ totalScore() }} XP</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      <ng-container *ngIf="!showResults()">
        <ng-container *ngIf="currentQuestion(); let question">
          <div class="listening-content">
            <div class="audio-section">
              <div class="instruction">Listen to the word and select its meaning:</div>
              <button 
                (click)="playAudio()" 
                class="play-btn"
                [disabled]="isPlayingAudio()">
                {{ isPlayingAudio() ? '🔊 Playing...' : '▶️ Listen' }}
              </button>
              <div class="speed-controls">
                <button 
                  (click)="playAudio(0.75)" 
                  class="speed-btn"
                  [class.active]="currentSpeed() === 0.75">
                  0.75x
                </button>
                <button 
                  (click)="playAudio(1)" 
                  class="speed-btn"
                  [class.active]="currentSpeed() === 1">
                  Normal
                </button>
              </div>
            </div>

            <div class="question-section">
              <div class="question-label">What does this word mean?</div>
              <div class="options-grid">
                <button
                  *ngFor="let option of question.options; let i = index"
                  (click)="selectAnswer(i)"
                  class="option-btn"
                  [class.selected]="question.selectedIndex === i"
                  [class.correct]="question.answered && question.selectedIndex === i && question.isCorrect"
                  [class.incorrect]="question.answered && question.selectedIndex === i && !question.isCorrect"
                  [disabled]="question.answered">
                  {{ option }}
                </button>
              </div>

              <ng-container *ngIf="question.answered">
                <div class="feedback">
                  <ng-container *ngIf="question.isCorrect; else incorrect">
                    <div class="success-message">✅ Correct! +6 XP</div>
                  </ng-container>
                  <ng-template #incorrect>
                    <div class="error-message">
                      ❌ Not quite. The word means: <strong>{{ question.english }}</strong>
                    </div>
                  </ng-template>
                </div>

                <button 
                  (click)="nextQuestion()" 
                  class="btn-primary">
                  {{ currentQuestionIndex() === totalQuestions() - 1 ? 'View Results' : 'Next' }}
                </button>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </ng-container>

      <ng-container *ngIf="showResults()">
        <div class="results-screen">
          <h2>Comprehension Test Complete!</h2>

          <div class="score-display">
            <div class="score-circle">
              <div class="score-value">{{ correctCount() }}/{{ totalQuestions() }}</div>
              <div class="score-label">Correct</div>
            </div>
            <div class="accuracy-text">
              {{ accuracyPercent() }}% Accuracy
            </div>
          </div>

          <div class="performance-level">
            {{ getPerformanceLevel() }}
          </div>

          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Total Score:</span>
              <span class="stat-value">{{ totalScore() }} XP</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Words Understood:</span>
              <span class="stat-value">{{ correctCount() }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button (click)="goBack()" class="btn-secondary">Back to Dashboard</button>
            <button (click)="restartQuiz()" class="btn-primary">Try Again</button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--page-bg);
      min-height: 100vh;
      padding: var(--spacing-lg);
    }

    .listening-container {
      max-width: 650px;
      margin: 0 auto;
    }

    .listening-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid var(--border-color-light);
    }

    .back-btn {
      background: transparent;
      border: none;
      color: var(--primary-color);
      font-size: var(--font-size-md);
      cursor: pointer;
      padding: var(--spacing-sm);
      border-radius: var(--radius-md);
      transition: all var(--transition-normal);
    }

    .back-btn:hover {
      background: var(--bg-secondary);
      transform: translateX(-2px);
    }

    .listening-header h1 {
      flex: 1;
      text-align: center;
      font-size: var(--font-size-2xl);
      margin: 0;
      color: var(--primary-color);
    }

    .progress-info {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      min-width: 150px;
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-xs);
    }

    .score-badge {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--spacing-lg);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      transition: width 0.3s ease;
    }

    .listening-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .audio-section {
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: center;
    }

    .instruction {
      font-size: var(--font-size-md);
      color: var(--text-primary);
      font-weight: 600;
    }

    .play-btn {
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-lg);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      box-shadow: var(--shadow-md);
      font-weight: 600;
      min-width: 150px;
    }

    .play-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .play-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .speed-controls {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: center;
    }

    .speed-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--tile-bg);
      border: 2px solid var(--border-color-light);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .speed-btn:hover {
      border-color: var(--primary-color);
      background: var(--bg-secondary);
    }

    .speed-btn.active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
    }

    .question-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .question-label {
      text-align: center;
      font-size: var(--font-size-md);
      color: var(--text-primary);
      font-weight: 600;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .option-btn {
      padding: var(--spacing-md);
      font-size: var(--font-size-md);
      background: var(--bg-secondary);
      border: 2px solid var(--border-color-light);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-weight: 500;
      text-align: left;
    }

    .option-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      background: var(--bg-tertiary);
      transform: translateX(4px);
    }

    .option-btn.selected:not(.correct):not(.incorrect) {
      border-color: var(--primary-color);
      background: rgba(44, 62, 80, 0.1);
    }

    .option-btn.correct {
      border-color: var(--status-mastered);
      background: var(--status-mastered);
      color: white;
    }

    .option-btn.incorrect {
      border-color: #e74c3c;
      background: #e74c3c;
      color: white;
    }

    .option-btn:disabled {
      cursor: not-allowed;
    }

    .feedback {
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      text-align: center;
      font-weight: 600;
    }

    .success-message {
      color: var(--status-mastered);
      background: rgba(40, 167, 69, 0.1);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
    }

    .error-message {
      color: #c0392b;
      background: rgba(230, 126, 34, 0.1);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
    }

    .btn-primary {
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-md);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-weight: 600;
      box-shadow: var(--shadow-md);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .btn-secondary {
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-md);
      background: var(--bg-tertiary);
      color: var(--primary-color);
      border: 2px solid var(--primary-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-weight: 600;
    }

    .btn-secondary:hover {
      background: var(--bg-secondary);
      transform: translateY(-2px);
    }

    .results-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
      border-radius: var(--radius-lg);
      animation: slideUp 0.4s ease;
    }

    .results-screen h2 {
      font-size: var(--font-size-2xl);
      color: var(--primary-color);
      margin: 0;
    }

    .score-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: var(--shadow-lg);
    }

    .score-value {
      font-size: 2.5rem;
      font-weight: bold;
    }

    .score-label {
      font-size: var(--font-size-sm);
      opacity: 0.9;
    }

    .accuracy-text {
      font-size: var(--font-size-lg);
      color: var(--text-primary);
      font-weight: 600;
    }

    .performance-level {
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      padding: var(--spacing-md) var(--spacing-lg);
      background: rgba(74, 144, 226, 0.1);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--secondary-color);
    }

    .stats {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      width: 100%;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-md);
      background: var(--tile-bg);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color-light);
    }

    .stat-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-value {
      color: var(--primary-color);
      font-weight: 700;
      font-size: var(--font-size-lg);
    }

    .action-buttons {
      display: flex;
      gap: var(--spacing-md);
      width: 100%;
      margin-top: var(--spacing-md);
    }

    .action-buttons button {
      flex: 1;
    }

    @media (max-width: 600px) {
      .listening-header {
        flex-wrap: wrap;
      }

      .listening-header h1 {
        flex-basis: 100%;
        margin: var(--spacing-sm) 0;
      }

      .score-circle {
        width: 100px;
        height: 100px;
      }

      .score-value {
        font-size: 2rem;
      }
    }
  `]
})
export class ListeningComprehensionComponent implements OnInit {
  private router = inject(Router);
  private dataProvider = inject(JsonDataProviderService);
  private progress = inject(ProgressService);
  private moduleLauncher = inject(ModuleLauncher);

  // Services are injected and used
  // State
  questions = signal<ListeningQuestion[]>([]);
  currentQuestionIndex = signal(0);
  totalScore = signal(0);
  correctCount = signal(0);
  showResults = signal(false);
  isPlayingAudio = signal(false);
  currentSpeed = signal(1);

  // Derived
  currentQuestion = computed(() => this.questions()[this.currentQuestionIndex()]);
  totalQuestions = computed(() => this.questions().length);
  progressPercent = computed(() => {
    const total = this.totalQuestions();
    return total > 0 ? ((this.currentQuestionIndex() + 1) / total) * 100 : 0;
  });
  accuracyPercent = computed(() => {
    const total = this.totalQuestions();
    return total > 0 ? Math.round((this.correctCount() / total) * 100) : 0;
  });

  constructor() {
    effect(() => {
      const items = this.progress.items();
      this.updateProgress(items);
    });
  }

  ngOnInit() {
    this.moduleLauncher.startModule('listening_comprehension_v1', 'Listening Comprehension');
    this.initializeQuiz();
  }

  private initializeQuiz() {
    const dictionary = this.dataProvider.dictionary();

    // Take first 5 words for the quiz
    const selectedWords = dictionary.slice(0, 5);

    const newQuestions = selectedWords.map(word => {
      // Get 3 other random words as distractors
      const otherWords = dictionary.filter(w => w.id !== word.id).slice(0, 3);
      
      // Create options with correct answer and distractors
      const options = [
        word.english,
        ...otherWords.map(w => w.english)
      ];

      // Shuffle options
      const shuffled = this.shuffleArray(options);

      return {
        wordId: word.id,
        lao: word.lao,
        english: word.english,
        options: shuffled,
        selectedIndex: null,
        isCorrect: null,
        answered: false
      };
    });

    this.questions.set(newQuestions);
  }

  selectAnswer(optionIndex: number) {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const selectedOption = question.options[optionIndex];
    const isCorrect = selectedOption === question.english;

    const updatedQuestion = { ...question };
    updatedQuestion.selectedIndex = optionIndex;
    updatedQuestion.isCorrect = isCorrect;
    updatedQuestion.answered = true;

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);

    // Update score
    if (isCorrect) {
      this.correctCount.update(c => c + 1);
      this.totalScore.update(s => s + 6);
    } else {
      this.totalScore.update(s => Math.max(0, s - 1));
    }

    // Auto-advance after 1.2 seconds if correct
    if (isCorrect) {
      setTimeout(() => {
        this.nextQuestion();
      }, 1200);
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.totalQuestions() - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    } else {
      this.showResults.set(true);
      this.saveProgress();
    }
  }

  playAudio(speed: number = 1) {
    this.currentSpeed.set(speed);
    this.isPlayingAudio.set(true);
    // Simulate audio playback with variable speed
    const duration = speed === 0.75 ? 2000 : 1500;
    setTimeout(() => {
      this.isPlayingAudio.set(false);
    }, duration);
  }

  getPerformanceLevel(): string {
    const accuracy = this.accuracyPercent();
    if (accuracy === 100) return '🌟 Perfect! Your listening comprehension is excellent!';
    if (accuracy >= 80) return '⭐ Great! You understood most of it!';
    if (accuracy >= 60) return '👍 Good effort! Keep listening!';
    return '💪 Keep practicing! Listening takes time!';
  }

  private updateProgress(_items: any[]) {
    // Update progress service
  }

  private saveProgress() {
    // Save listening progress
    const wordItems = this.questions()
      .filter(q => q.answered && q.isCorrect)
      .map(q => ({ id: q.wordId, wasCorrect: true }));

    wordItems.forEach(item => {
      this.progress.updateItemProgress(item.id, 'word', item.wasCorrect);
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  restartQuiz() {
    this.currentQuestionIndex.set(0);
    this.totalScore.set(0);
    this.correctCount.set(0);
    this.showResults.set(false);
    this.currentSpeed.set(1);
    this.initializeQuiz();
  }

  goBack() {
    this.moduleLauncher.pauseModule();
    this.router.navigate(['/dashboard']);
  }
}
