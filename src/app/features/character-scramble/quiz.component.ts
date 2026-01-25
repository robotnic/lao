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

interface ScrambleQuestion {
  wordId: string;
  word: string;
  english: string;
  scrambled: string[];
  selectedOrder: string[];
  isCorrect: boolean | null;
  answered: boolean;
}

@Component({
  selector: 'app-character-scramble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scramble-container">
      <div class="scramble-header">
        <button (click)="goBack()" class="back-btn">← Back</button>
        <h1>Character Scramble</h1>
        <div class="progress-info">
          <div>Question {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</div>
          <div class="score-badge">{{ totalScore() }} XP</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      @if (!showResults()) {
        @if (currentQuestion(); as question) {
          <div class="scramble-content">
            <div class="challenge-section">
              <div class="instruction">Unscramble the characters to form the word:</div>
              <div class="english-hint">{{ question.english }}</div>
            </div>

            <div class="answer-section">
              <div class="answer-label">Your Answer:</div>
              <div class="answer-area">
                <ng-container *ngIf="question.selectedOrder.length > 0; else placeholder">
                  <div class="answer-chars">
                    <span 
                      *ngFor="let char of question.selectedOrder"
                      class="answer-char">
                      {{ char }}
                      <button 
                        (click)="removeChar(char)" 
                        class="remove-btn"
                        [disabled]="question.answered">
                        ×
                      </button>
                    </span>
                  </div>
                </ng-container>
                <ng-template #placeholder>
                  <div class="answer-placeholder">Tap characters to add</div>
                </ng-template>
              </div>
            </div>

            <div class="scramble-section">
              <div class="scramble-label">Available Characters:</div>
              <div class="scramble-grid">
                <button
                  *ngFor="let char of question.scrambled; let i = index"
                  (click)="selectChar(i)"
                  class="char-btn"
                  [class.used]="question.selectedOrder.includes(char)"
                  [disabled]="question.answered || question.selectedOrder.includes(char)">
                  {{ char }}
                </button>
              </div>
            </div>

            <div class="action-buttons">
              <button 
                (click)="clearAnswer()" 
                class="btn-secondary"
                [disabled]="question.selectedOrder.length === 0 || question.answered">
                Clear
              </button>
              <button 
                (click)="checkAnswer()" 
                class="btn-primary"
                [disabled]="question.selectedOrder.length === 0 || question.answered">
                Check
              </button>
            </div>

            @if (question.answered) {
              <div class="feedback">
                @if (question.isCorrect) {
                  <div class="success-message">
                    ✅ Correct! {{ question.word }} +8 XP
                  </div>
                } @else {
                  <div class="error-message">
                    ❌ Not quite. The word is: <br>
                    <span class="correct-word">{{ question.word }}</span>
                  </div>
                }
              </div>

              <button 
                (click)="nextQuestion()" 
                class="btn-primary">
                {{ currentQuestionIndex() === totalQuestions() - 1 ? 'View Results' : 'Next' }}
              </button>
            }
          </div>
        }
      } @else {
        <div class="results-screen">
          <h2>Challenge Complete!</h2>

          <div class="score-display">
            <div class="score-circle">
              <div class="score-value">{{ correctCount() }}/{{ totalQuestions() }}</div>
              <div class="score-label">Correct</div>
            </div>
            <div class="accuracy-text">
              {{ accuracyPercent() }}% Success Rate
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
              <span class="stat-label">Words Unscrambled:</span>
              <span class="stat-value">{{ correctCount() }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button (click)="goBack()" class="btn-secondary">Back to Dashboard</button>
            <button (click)="restartQuiz()" class="btn-primary">Try Again</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--page-bg);
      min-height: 100vh;
      padding: var(--spacing-lg);
    }

    .scramble-container {
      max-width: 700px;
      margin: 0 auto;
    }

    .scramble-header {
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

    .scramble-header h1 {
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

    .scramble-content {
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

    .challenge-section {
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      text-align: center;
    }

    .instruction {
      font-size: var(--font-size-md);
      color: var(--text-primary);
      font-weight: 600;
      margin-bottom: var(--spacing-md);
    }

    .english-hint {
      font-size: var(--font-size-lg);
      color: var(--secondary-color);
      font-style: italic;
      font-weight: 500;
    }

    .answer-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .answer-label,
    .scramble-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .answer-area {
      min-height: 70px;
      padding: var(--spacing-md);
      background: var(--tile-bg);
      border: 2px dashed var(--border-color-light);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-normal);
    }

    .answer-area:focus-within {
      border-color: var(--primary-color);
      background: rgba(44, 62, 80, 0.05);
    }

    .answer-placeholder {
      color: var(--text-secondary);
      font-style: italic;
    }

    .answer-chars {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      width: 100%;
    }

    .answer-char {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: var(--font-size-lg);
      font-family: var(--font-family-lao);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .remove-btn {
      background: rgba(255, 255, 255, 0.3);
      border: none;
      color: white;
      font-size: var(--font-size-lg);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      transition: all var(--transition-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex-shrink: 0;
    }

    .remove-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.6);
      transform: scale(1.1);
    }

    .remove-btn:disabled {
      cursor: not-allowed;
    }

    .scramble-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .scramble-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
    }

    .char-btn {
      aspect-ratio: 1;
      padding: var(--spacing-md);
      background: var(--tile-bg);
      border: 2px solid var(--border-color-light);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      font-family: var(--font-family-lao);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .char-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      background: var(--bg-tertiary);
      transform: scale(1.08);
      box-shadow: var(--shadow-md);
    }

    .char-btn.used {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .char-btn:disabled {
      cursor: not-allowed;
    }

    .action-buttons {
      display: flex;
      gap: var(--spacing-md);
    }

    .btn-primary,
    .btn-secondary {
      flex: 1;
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-md);
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-weight: 600;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      box-shadow: var(--shadow-md);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--bg-tertiary);
      color: var(--primary-color);
      border: 2px solid var(--primary-color);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--bg-secondary);
      transform: translateY(-2px);
    }

    .btn-secondary:disabled {
      opacity: 0.6;
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

    .correct-word {
      display: block;
      font-weight: bold;
      margin-top: var(--spacing-sm);
      font-style: normal;
      color: var(--primary-color);
      font-size: var(--font-size-lg);
      font-family: var(--font-family-lao);
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
      .scramble-header {
        flex-wrap: wrap;
      }

      .scramble-header h1 {
        flex-basis: 100%;
        margin: var(--spacing-sm) 0;
      }

      .scramble-grid {
        grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
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
export class CharacterScrambleComponent implements OnInit {
  private router = inject(Router);
  private dataProvider = inject(JsonDataProviderService);
  private progress = inject(ProgressService);
  private moduleLauncher = inject(ModuleLauncher);

  // Services are injected and used
  // @ts-ignore - Services used in ngOnInit()

  // State
  questions = signal<ScrambleQuestion[]>([]);
  currentQuestionIndex = signal(0);
  totalScore = signal(0);
  correctCount = signal(0);
  showResults = signal(false);

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
    this.moduleLauncher.startModule('character_scramble_v1', 'Character Scramble');
    this.initializeQuiz();
  }

  private initializeQuiz() {
    const dictionary = this.dataProvider.dictionary();

    // Take first 6 words for the quiz
    const selectedWords = dictionary.slice(0, 6);

    const newQuestions = selectedWords.map(word => {
      // Split word into individual characters
      const chars = word.lao.split('');

      // Shuffle characters
      const scrambled = this.shuffleArray([...chars]);

      return {
        wordId: word.id,
        word: word.lao,
        english: word.english,
        scrambled,
        selectedOrder: [],
        isCorrect: null,
        answered: false
      };
    });

    this.questions.set(newQuestions);
  }

  selectChar(charIndex: number) {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const char = question.scrambled[charIndex];
    if (question.selectedOrder.includes(char)) return;

    const selectedOrder = [...question.selectedOrder];
    selectedOrder.push(char);

    const updatedQuestion = { ...question };
    updatedQuestion.selectedOrder = selectedOrder;

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);
  }

  removeChar(char: string) {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const selectedOrder = question.selectedOrder.filter(c => c !== char);

    const updatedQuestion = { ...question };
    updatedQuestion.selectedOrder = selectedOrder;

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);
  }

  clearAnswer() {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const updatedQuestion = { ...question };
    updatedQuestion.selectedOrder = [];

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);
  }

  checkAnswer() {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const selectedWord = question.selectedOrder.join('');
    const isCorrect = selectedWord === question.word;

    const updatedQuestion = { ...question };
    updatedQuestion.isCorrect = isCorrect;
    updatedQuestion.answered = true;

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);

    // Update score
    if (isCorrect) {
      this.correctCount.update(c => c + 1);
      this.totalScore.update(s => s + 8);
    } else {
      this.totalScore.update(s => Math.max(0, s - 2));
    }

    // Auto-advance after 1.5 seconds if correct
    if (isCorrect) {
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
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

  getPerformanceLevel(): string {
    const accuracy = this.accuracyPercent();
    if (accuracy === 100) return '🌟 Perfect! You\'ve mastered unscrambling!';
    if (accuracy >= 80) return '⭐ Excellent! Great character recognition!';
    if (accuracy >= 60) return '👍 Good work! Keep practicing!';
    return '💪 Keep learning! Characters take practice!';
  }

  private updateProgress(_items: any[]) {
    // Update progress service
  }

  private saveProgress() {
    // Save scramble progress
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
    this.initializeQuiz();
  }

  goBack() {
    this.moduleLauncher.pauseModule();
    this.router.navigate(['/dashboard']);
  }
}
