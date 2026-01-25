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

interface PhraseQuestion {
  phraseId: string;
  phrase: string;
  englishTranslation: string;
  words: Array<{ id: string; lao: string; english: string }>;
  selectedOrder: string[];
  isCorrect: boolean | null;
  answered: boolean;
}

@Component({
  selector: 'app-phrase-builder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="builder-container">
      <div class="builder-header">
        <button (click)="goBack()" class="back-btn">← Back</button>
        <h1>Phrase Builder</h1>
        <div class="progress-info">
          <div>Challenge {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</div>
          <div class="score-badge">{{ totalScore() }} XP</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      @if (!showResults()) {
        @if (currentQuestion(); as question) {
          <div class="builder-content">
            <div class="challenge-section">
              <div class="instruction">Arrange the words to form this phrase:</div>
              <div class="english-translation">{{ question.englishTranslation }}</div>
            </div>

            <div class="answer-section">
              <div class="answer-label">Your Answer:</div>
              <div 
                class="answer-area"
                [class.drag-over]="isDragOverAnswer()"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event)"
                (dragleave)="onDragLeave($event)">
                <ng-container *ngIf="currentQuestion().selectedOrder.length > 0; else placeholder">
                  <div class="answer-words">
                    <span 
                      *ngFor="let wordId of currentQuestion().selectedOrder; let i = index"
                      class="answer-word"
                      draggable="true"
                      (dragstart)="onDragStart($event, i)"
                      (dragend)="onDragEnd($event)"
                      (dragover)="onWordDragOver($event)"
                      (drop)="onWordDrop($event, i)">
                      {{ getWordByIdFromQuestion(currentQuestion(), wordId) }}
                      <button 
                        (click)="removeWord(wordId)" 
                        class="remove-btn"
                        [disabled]="currentQuestion().answered">
                        ×
                      </button>
                    </span>
                  </div>
                </ng-container>
                <ng-template #placeholder>
                  <div class="answer-placeholder">Drag words here or click to add</div>
                </ng-template>
              </div>
            </div>

            <div class="words-section">
              <div class="words-label">Available Words:</div>
              <div class="words-grid">
                <button
                  *ngFor="let word of currentQuestion().words; let i = index"
                  (click)="selectWord(word.id)"
                  draggable="true"
                  (dragstart)="onWordDragStart($event, i)"
                  class="word-btn"
                  [class.selected]="currentQuestion().selectedOrder.includes(word.id)"
                  [disabled]="currentQuestion().answered">
                  <div class="word-lao">{{ word.lao }}</div>
                  <div class="word-english">{{ word.english }}</div>
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
                Check Answer
              </button>
            </div>

            @if (question.answered) {
              <div class="feedback">
                @if (question.isCorrect) {
                  <div class="success-message">
                    ✅ Perfect! That's the correct phrase! +10 XP
                  </div>
                } @else {
                  <div class="error-message">
                    ❌ Not quite right. The correct phrase is: <br>
                    <span class="correct-phrase">{{ question.phrase }}</span>
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
              <span class="stat-label">Phrases Correct:</span>
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

    .builder-container {
      max-width: 700px;
      margin: 0 auto;
    }

    .builder-header {
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

    .builder-header h1 {
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

    .builder-content {
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

    .english-translation {
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
    .words-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .answer-area {
      min-height: 80px;
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

    .answer-area[class*="drag-over"] {
      border-color: var(--primary-color);
      background: rgba(44, 62, 80, 0.08);
      box-shadow: inset 0 0 8px rgba(44, 62, 80, 0.15);
    }

    .answer-placeholder {
      color: var(--text-secondary);
      font-style: italic;
    }

    .answer-words {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      width: 100%;
    }

    .answer-word {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      border-radius: var(--radius-full);
      font-weight: 600;
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
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      transition: all var(--transition-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .remove-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.6);
      transform: scale(1.1);
    }

    .remove-btn:disabled {
      cursor: not-allowed;
    }

    .words-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .words-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--spacing-md);
    }

    .word-btn {
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border: 2px solid var(--border-color-light);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .word-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      background: var(--bg-tertiary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .word-btn.selected {
      border-color: var(--primary-color);
      background: rgba(44, 62, 80, 0.1);
      box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
    }

    .word-btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .word-lao {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--primary-color);
      font-family: var(--font-family-lao);
    }

    .word-english {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
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

    .correct-phrase {
      display: block;
      font-weight: bold;
      margin-top: var(--spacing-sm);
      font-style: normal;
      color: var(--primary-color);
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
      .builder-header {
        flex-wrap: wrap;
      }

      .builder-header h1 {
        flex-basis: 100%;
        margin: var(--spacing-sm) 0;
      }

      .words-grid {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
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
export class PhraseBuilderComponent implements OnInit {
  private router = inject(Router);
  private dataProvider = inject(JsonDataProviderService);
  private progress = inject(ProgressService);
  private moduleLauncher = inject(ModuleLauncher);

  // Services are injected and used
  // @ts-ignore - Services used in ngOnInit()

  // State
  questions = signal<PhraseQuestion[]>([]);
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
    this.moduleLauncher.startModule('phrase_builder_v1', 'Phrase Builder');
    this.initializeQuiz();
  }

  private initializeQuiz() {
    const phrases = this.dataProvider.phrases();
    const dictionary = this.dataProvider.dictionary();

    // Take first 5 phrases for the quiz
    const selectedPhrases = phrases.slice(0, 5);

    const newQuestions = selectedPhrases.map(phrase => {
      // Get related words for this phrase
      const phraseWords = (phrase.related_word_ids || [])
        .map((wordId: string) => dictionary.find(w => w.id === wordId))
        .filter((w): w is any => !!w);

      // If no related words, create a synthetic word entry from the phrase
      const wordsToUse = phraseWords.length > 0 ? phraseWords : [
        { id: phrase.id, lao: phrase.lao, english: phrase.english }
      ];

      // Shuffle words
      const shuffledWords = this.shuffleArray(wordsToUse);

      return {
        phraseId: phrase.id,
        phrase: phrase.lao,
        englishTranslation: phrase.english,
        words: shuffledWords.map((w: any) => ({
          id: w.id,
          lao: w.lao,
          english: w.english
        })),
        selectedOrder: [],
        isCorrect: null,
        answered: false
      };
    });

    this.questions.set(newQuestions);
  }

  selectWord(wordId: string) {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const selectedOrder = [...question.selectedOrder];
    if (!selectedOrder.includes(wordId)) {
      selectedOrder.push(wordId);

      const updatedQuestion = { ...question };
      updatedQuestion.selectedOrder = selectedOrder;

      const questions = [...this.questions()];
      questions[this.currentQuestionIndex()] = updatedQuestion;
      this.questions.set(questions);
    }
  }

  removeWord(wordId: string) {
    const question = this.currentQuestion();
    if (!question || question.answered) return;

    const selectedOrder = question.selectedOrder.filter(id => id !== wordId);

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

    const selectedPhrase = question.selectedOrder
      .map(wordId => {
        const word = question.words.find(w => w.id === wordId);
        return word?.lao || '';
      })
      .join(' ');

    const isCorrect = selectedPhrase === question.phrase;

    const updatedQuestion = { ...question };
    updatedQuestion.isCorrect = isCorrect;
    updatedQuestion.answered = true;

    const questions = [...this.questions()];
    questions[this.currentQuestionIndex()] = updatedQuestion;
    this.questions.set(questions);

    // Update score
    if (isCorrect) {
      this.correctCount.update(c => c + 1);
      this.totalScore.update(s => s + 10);
    } else {
      this.totalScore.update(s => Math.max(0, s - 3));
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

  // Drag and drop handlers
  draggedWordIndex: number | null = null;
  draggedWordSource: 'grid' | 'answer' | null = null;
  isDragOverAnswer = signal(false);

  onWordDragStart(event: DragEvent, index: number) {
    this.draggedWordIndex = index;
    this.draggedWordSource = 'grid';
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move';
      dataTransfer.setData('text/plain', this.currentQuestion().words[index].id);
    }
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedWordIndex = index;
    this.draggedWordSource = 'answer';
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move';
      dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragEnd(_event: DragEvent) {
    this.draggedWordIndex = null;
    this.draggedWordSource = null;
    this.isDragOverAnswer.set(false);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.dropEffect = 'move';
    }
    this.isDragOverAnswer.set(true);
  }

  onDragLeave(event: DragEvent) {
    if (event.target === event.currentTarget) {
      this.isDragOverAnswer.set(false);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOverAnswer.set(false);

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;

    const data = dataTransfer.getData('text/plain');

    if (this.draggedWordSource === 'grid') {
      // Dragged from word grid
      this.selectWord(data);
    } else if (this.draggedWordSource === 'answer' && this.draggedWordIndex !== null) {
      // Reordering within answer area - handled by onWordDrop
    }
  }

  onWordDragOver(event: DragEvent) {
    event.preventDefault();
    const dataTransfer = event.dataTransfer;
    if (dataTransfer) {
      dataTransfer.dropEffect = 'move';
    }
  }

  onWordDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedWordSource === 'answer' && this.draggedWordIndex !== null) {
      const question = this.currentQuestion();
      if (!question || question.answered) return;

      const selectedOrder = [...question.selectedOrder];
      const [draggedId] = selectedOrder.splice(this.draggedWordIndex, 1);
      selectedOrder.splice(targetIndex, 0, draggedId);

      const updatedQuestion = { ...question };
      updatedQuestion.selectedOrder = selectedOrder;

      const questions = [...this.questions()];
      questions[this.currentQuestionIndex()] = updatedQuestion;
      this.questions.set(questions);
    }

    this.draggedWordIndex = null;
    this.draggedWordSource = null;
  }

  getWordByIdFromQuestion(question: PhraseQuestion, wordId: string): string {
    const word = question.words.find(w => w.id === wordId);
    return word?.lao || '';
  }

  getPerformanceLevel(): string {
    const accuracy = this.accuracyPercent();
    if (accuracy === 100) return '🌟 Perfect! You\'ve mastered phrase building!';
    if (accuracy >= 80) return '⭐ Excellent! Great understanding of Lao phrases!';
    if (accuracy >= 60) return '👍 Good work! Keep practicing phrases!';
    return '💪 Keep learning! Phrases take practice!';
  }

  private updateProgress(_items: any[]) {
    // Update progress service
  }

  private saveProgress() {
    // Save phrase builder progress
    const phraseItems = this.questions()
      .filter(q => q.answered && q.isCorrect)
      .map(q => ({ id: q.phraseId, wasCorrect: true }));

    phraseItems.forEach(item => {
      this.progress.updateItemProgress(item.id, 'phrase', item.wasCorrect);
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
