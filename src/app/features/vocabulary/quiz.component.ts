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

interface VocabQuestion {
  wordId: string;
  lao: string;
  correct: string;
  options: string[];
  selectedIndex: number | null;
  isCorrect: boolean | null;
  answered: boolean;
}

@Component({
  selector: 'app-vocabulary-quiz',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-container">
      <div class="quiz-header">
        <button (click)="goBack()" class="back-btn">← Back</button>
        <h1>Vocabulary Quiz</h1>
        <div class="progress-info">
          <div>Question {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</div>
          <div class="score-badge">{{ totalScore() }} XP</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      @if (currentQuestion(); as question) {
        <div class="quiz-content">
          <div class="word-section">
            <div class="word-display">{{ question.lao }}</div>
            <div class="word-label">Lao Word</div>
          </div>

          <div class="question-section">
            <p class="question">What does this word mean in English?</p>

            <div class="options-grid">
              @for (option of question.options; track option) {
                <button
                  class="option-btn"
                  [class.selected]="question.selectedIndex === question.options.indexOf(option)"
                  [class.correct]="
                    question.answered && question.options.indexOf(option) === correctIndex(question)
                  "
                  [class.incorrect]="
                    question.answered && question.selectedIndex === question.options.indexOf(option) && question.isCorrect === false
                  "
                  [disabled]="question.answered"
                  (click)="selectAnswer(question.options.indexOf(option))"
                >
                  {{ option }}
                </button>
              }
            </div>

            @if (question.answered && question.isCorrect === false) {
              <div class="feedback incorrect">
                ✗ Incorrect. The word means: {{ question.correct }}
              </div>
            }

            @if (question.answered && question.isCorrect === true) {
              <div class="feedback correct">
                ✓ Correct! {{ currentScore() }} XP earned
              </div>
            }
          </div>

          @if (question.answered) {
            <button
              class="next-btn"
              (click)="nextQuestion()"
              [disabled]="!isAnswered(question)"
            >
              @if (currentQuestionIndex() === totalQuestions() - 1) {
                Finish Quiz
              } @else {
                Next Question
              }
            </button>
          }
        </div>
      }

      @if (showResults()) {
        <div class="results-section">
          <h2>Quiz Complete!</h2>
          <div class="score-display">
            <div class="score-number">{{ totalScore() }}/{{ totalQuestions() * 5 }} XP</div>
            <div class="accuracy">
              {{ ((totalScore() / (totalQuestions() * 5)) * 100).toFixed(0) }}% Accuracy
            </div>
          </div>

          <div class="results-details">
            <p>Correct: {{ correctCount() }}/{{ totalQuestions() }}</p>
            <p>Level: {{ calculateLevel() }}</p>
          </div>

          <button class="finish-btn" (click)="finishQuiz()">
            Return to Dashboard
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .quiz-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .quiz-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .back-btn {
      background: none;
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-normal);
    }

    .back-btn:hover {
      background: var(--primary-color);
      color: white;
    }

    h1 {
      flex: 1;
      text-align: center;
      font-size: var(--font-size-2xl);
      color: var(--text-primary);
    }

    .progress-info {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: 600;
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
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffa500, #28a745);
      transition: width 0.3s ease;
    }

    .quiz-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }

    .word-section {
      background: var(--tile-bg);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      text-align: center;
    }

    .word-display {
      font-size: 4rem;
      font-weight: bold;
      line-height: 1;
      color: var(--text-primary);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
      margin-bottom: var(--spacing-md);
      font-family: var(--font-family-lao);
    }

    .word-label {
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
      font-weight: 600;
    }

    .question-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .question {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .option-btn {
      background: var(--tile-bg);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-normal);
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 500;
    }

    .option-btn:not(:disabled):hover {
      border-color: var(--primary-color);
      background: var(--bg-secondary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .option-btn.selected:not(:disabled) {
      border-color: var(--primary-color);
      background: rgba(74, 144, 226, 0.1);
      color: var(--primary-color);
      font-weight: 600;
    }

    .option-btn.correct {
      border-color: #28a745;
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
    }

    .option-btn.incorrect {
      border-color: #dc3545;
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
    }

    .option-btn:disabled {
      cursor: not-allowed;
    }

    .feedback {
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: var(--font-size-sm);
      animation: slideIn 0.3s ease;
    }

    .feedback.correct {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
      border-left: 4px solid #28a745;
    }

    .feedback.incorrect {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
      border-left: 4px solid #dc3545;
    }

    .next-btn,
    .finish-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-size-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-normal);
      align-self: center;
      width: 100%;
      max-width: 300px;
    }

    .next-btn:hover:not(:disabled),
    .finish-btn:hover:not(:disabled) {
      background: #3a7bb8;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(74, 144, 226, 0.3);
    }

    .next-btn:disabled,
    .finish-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .results-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-lg);
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
      background: var(--tile-bg);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      animation: slideIn 0.4s ease;
    }

    .results-section h2 {
      font-size: var(--font-size-2xl);
      color: var(--text-primary);
      margin: 0;
    }

    .score-display {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .score-number {
      font-size: 3rem;
      font-weight: bold;
      color: var(--primary-color);
    }

    .accuracy {
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
      font-weight: 600;
    }

    .results-details {
      text-align: center;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .results-details p {
      margin: var(--spacing-sm) 0;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      h1 {
        font-size: var(--font-size-lg);
      }

      .word-display {
        font-size: 3rem;
      }
    }
  `,
})
export class VocabularyQuizComponent implements OnInit {
  private readonly jsonDataProvider = inject(JsonDataProviderService);
  private readonly progressService = inject(ProgressService);
  private readonly moduleLauncher = inject(ModuleLauncher);
  private readonly router = inject(Router);

  readonly title = 'Vocabulary Quiz';

  private readonly questions = signal<VocabQuestion[]>([]);
  readonly currentQuestionIndex = signal(0);
  readonly totalScore = signal(0);
  readonly correctCount = signal(0);
  readonly showResults = signal(false);
  readonly currentScore = signal(0);

  readonly totalQuestions = computed(() => this.questions().length);
  readonly currentQuestion = computed(() => {
    const q = this.questions();
    const idx = this.currentQuestionIndex();
    return q[idx] || null;
  });
  readonly progressPercent = computed(() => {
    const total = this.totalQuestions();
    return total > 0 ? ((this.currentQuestionIndex() + 1) / total) * 100 : 0;
  });

  constructor() {
    // Auto-save progress when quiz state changes
    effect(() => {
      if (this.showResults()) {
        this.saveProgress();
      }
    });
  }

  ngOnInit(): void {
    this.initializeQuiz();
  }

  private initializeQuiz(): void {
    const dictionary = this.jsonDataProvider.dictionary();
    if (!dictionary || dictionary.length === 0) {
      console.error('No vocabulary data available');
      return;
    }

    // Shuffle and take up to 10 questions
    const shuffled = this.shuffleArray([...dictionary]).slice(0, 10);

    const questions = shuffled.map(word => this.createQuestion(word as any));
    this.questions.set(questions);
  }

  private createQuestion(word: any): VocabQuestion {
    const dictionary = this.jsonDataProvider.dictionary();
    const otherWords = dictionary.filter(w => (w as any).id !== word.id);

    // Create 3 plausible distractors
    const distractors = this.shuffleArray(otherWords)
      .slice(0, 3)
      .map(w => (w as any).english);

    const options = this.shuffleArray([
      word.english,
      ...distractors,
    ]);

    return {
      wordId: word.id,
      lao: word.lao,
      correct: word.english,
      options,
      selectedIndex: null,
      isCorrect: null,
      answered: false,
    };
  }

  selectAnswer(index: number): void {
    const questions = this.questions();
    const currentQuestion = questions[this.currentQuestionIndex()];

    if (currentQuestion.answered) return;

    const correctIndex = this.correctIndex(currentQuestion);
    const isCorrect = index === correctIndex;

    // Update score
    const xpEarned = isCorrect ? 5 : -2;
    this.currentScore.set(xpEarned);
    this.totalScore.update(s => Math.max(0, s + xpEarned));

    if (isCorrect) {
      this.correctCount.update(c => c + 1);
    }

    // Mark question as answered
    currentQuestion.selectedIndex = index;
    currentQuestion.isCorrect = isCorrect;
    currentQuestion.answered = true;

    this.questions.set([...questions]);

    // Auto-advance after 1.2 seconds if correct
    if (isCorrect) {
      setTimeout(() => {
        this.nextQuestion();
      }, 1200);
    }
  }

  nextQuestion(): void {
    const nextIndex = this.currentQuestionIndex() + 1;

    if (nextIndex >= this.totalQuestions()) {
      this.showResults.set(true);
    } else {
      this.currentQuestionIndex.set(nextIndex);
    }
  }

  finishQuiz(): void {
    this.moduleLauncher.pauseModule();
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.moduleLauncher.pauseModule();
    this.router.navigate(['/dashboard']);
  }

  correctIndex(question: VocabQuestion): number {
    return question.options.indexOf(question.correct);
  }

  isAnswered(question: VocabQuestion): boolean {
    return question.answered;
  }

  calculateLevel(): string {
    const total = this.totalQuestions();
    const accuracy = total > 0 ? this.correctCount() / total : 0;
    if (accuracy >= 0.9) return 'Excellent! 🌟';
    if (accuracy >= 0.8) return 'Good! ✓';
    if (accuracy >= 0.7) return 'Fair. Keep practicing!';
    return 'Review the words';
  }

  private saveProgress(): void {
    // Update progress for each correctly answered word
    this.questions().forEach(q => {
      if (q.isCorrect) {
        this.progressService.updateItemProgress(q.wordId, 'word', true);
      }
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
}
