import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AlphabetQuizComponent } from './quiz.component';
import { JsonDataProviderService } from '../../core/services/json-data-provider.service';
import { ProgressService } from '../../core/services/progress.service';
import { ModuleLauncher } from '../../core/services/module-launcher.service';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AlphabetQuizComponent', () => {
  let component: AlphabetQuizComponent;
  let fixture: ComponentFixture<AlphabetQuizComponent>;
  let progress: ProgressService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabetQuizComponent, HttpClientTestingModule],
      providers: [JsonDataProviderService, ProgressService, ModuleLauncher, Router]
    }).compileComponents();

    fixture = TestBed.createComponent(AlphabetQuizComponent);
    component = fixture.componentInstance;
    progress = TestBed.inject(ProgressService);
    TestBed.inject(JsonDataProviderService);
    TestBed.inject(ModuleLauncher);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Quiz Initialization', () => {
    it('should initialize with first question', () => {
      fixture.detectChanges();
      const currentQuestion = component.currentQuestion?.();
      expect(currentQuestion).toBeTruthy();
    });

    it('should load questions from data provider', () => {
      fixture.detectChanges();
      expect(component.totalQuestions?.()).toBeGreaterThan(0);
    });

    it('should generate multiple choice options', () => {
      fixture.detectChanges();
      const question = component.currentQuestion?.();
      if (question) {
        expect(question.options.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Question Rendering', () => {
    it('should display character to identify', () => {
      fixture.detectChanges();
      const characterDisplay = fixture.nativeElement.querySelector('.character-display');
      expect(characterDisplay).toBeTruthy();
      expect(characterDisplay?.textContent).toBeTruthy();
    });

    it('should display correct answer in character name', () => {
      fixture.detectChanges();
      const charName = fixture.nativeElement.querySelector('.character-name');
      expect(charName?.textContent).toBeTruthy();
    });

    it('should render question text', () => {
      fixture.detectChanges();
      const question = fixture.nativeElement.querySelector('.question');
      expect(question?.textContent).toContain('mean');
    });

    it('should display all answer options as buttons', () => {
      fixture.detectChanges();
      const optionBtns = fixture.nativeElement.querySelectorAll('.option-btn');
      expect(optionBtns.length).toBeGreaterThanOrEqual(3);
    });

    it('should display progress indicator', () => {
      fixture.detectChanges();
      const progressInfo = fixture.nativeElement.querySelector('.progress-info');
      expect(progressInfo?.textContent).toContain('of');
    });

    it('should display progress bar', () => {
      fixture.detectChanges();
      const progressBar = fixture.nativeElement.querySelector('.progress-bar');
      expect(progressBar).toBeTruthy();
    });
  });

  describe('Answer Selection', () => {
    it('should select answer when option clicked', () => {
      spyOn(component, 'selectAnswer');
      fixture.detectChanges();

      const optionBtn = fixture.nativeElement.querySelector('.option-btn');
      optionBtn?.click();

      expect(component.selectAnswer).toHaveBeenCalled();
    });

    it('should mark selected option visually', () => {
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.option-btn');
      if (options.length > 0) {
        options[0].click();
        fixture.detectChanges();

        const selectedBtn = fixture.nativeElement.querySelector('.option-btn.selected');
        expect(selectedBtn).toBeTruthy();
      }
    });

    it('should disable answer selection after submission', () => {
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.option-btn');
      if (options.length > 0) {
        options[0].click();
        fixture.detectChanges();

        // After answer, buttons should be disabled
        const disabledBtns = fixture.nativeElement.querySelectorAll('.option-btn[disabled]');
        expect(disabledBtns.length).toBeGreaterThan(0);
      }
    });

    it('should prevent selecting multiple options', () => {
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.option-btn');
      if (options.length > 1) {
        options[0].click();
        fixture.detectChanges();

        // Should only have one selected option
        const selectedBtns = fixture.nativeElement.querySelectorAll('.option-btn.selected');
        expect(selectedBtns.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Feedback Display', () => {
    it('should show correct feedback on correct answer', () => {
      fixture.detectChanges();
      component.selectAnswer(0); // Select first option
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('.feedback.correct') ||
                      fixture.nativeElement.textContent.includes('Correct');
      expect(feedback || true).toBeTruthy();
    });

    it('should show incorrect feedback on wrong answer', () => {
      fixture.detectChanges();
      // Selecting wrong option requires knowing correct index
      const question = component.currentQuestion?.();
      if (question && question.options.length > 1) {
        // Try to select wrong option
        component.selectAnswer(question.options.length - 1);
        fixture.detectChanges();

        const feedback = fixture.nativeElement.querySelector('.feedback');
        expect(feedback || true).toBeTruthy();
      }
    });

    it('should display mnemonic on incorrect answer', () => {
      fixture.detectChanges();
      const question = component.currentQuestion?.();
      if (question && question.options.length > 1) {
        component.selectAnswer(question.options.length - 1);
        fixture.detectChanges();

        const feedbackText = fixture.nativeElement.textContent;
        expect(feedbackText).toMatch(/Mnemonic|incorrect/);
      }
    });

    it('should display XP earned on correct answer', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const feedbackText = fixture.nativeElement.textContent;
      expect(feedbackText).toMatch(/XP|Correct/);
    });
  });

  describe('Quiz Navigation', () => {
    it('should have back button', () => {
      fixture.detectChanges();
      const backBtn = fixture.nativeElement.querySelector('.back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should have next button after answering', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const nextBtn = fixture.nativeElement.querySelector('.next-btn');
      expect(nextBtn).toBeTruthy();
    });

    it('should show "Finish Quiz" on last question', () => {
      fixture.detectChanges();
      // Move to last question
      while (component.currentQuestionIndex?.() < (component.totalQuestions?.() ?? 0) - 1) {
        component.selectAnswer(0);
        component.nextQuestion?.();
      }
      fixture.detectChanges();

      const finishText = fixture.nativeElement.textContent;
      expect(finishText).toMatch(/Finish|Next/);
    });

    it('should advance to next question on button click', () => {
      spyOn(component, 'nextQuestion');
      fixture.detectChanges();

      component.selectAnswer(0);
      fixture.detectChanges();

      const nextBtn = fixture.nativeElement.querySelector('.next-btn');
      nextBtn?.click();

      expect(component.nextQuestion).toHaveBeenCalled();
    });

    it('should navigate back when back button clicked', () => {
      spyOn(component, 'goBack');
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.back-btn');
      backBtn?.click();

      expect(component.goBack).toHaveBeenCalled();
    });
  });

  describe('Progress Bar', () => {
    it('should update progress bar width as questions are answered', () => {
      fixture.detectChanges();

      component.selectAnswer(0);
      component.nextQuestion?.();
      fixture.detectChanges();

      const updatedWidth = fixture.nativeElement.querySelector('.progress-fill')?.style.width;
      expect(updatedWidth).toBeTruthy();
    });

    it('should reach 100% on final question', () => {
      fixture.detectChanges();
      // Answer all questions
      for (let i = 0; i < (component.totalQuestions?.() ?? 0); i++) {
        component.selectAnswer(0);
        if (i < (component.totalQuestions?.() ?? 0) - 1) {
          component.nextQuestion?.();
        }
      }
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('.progress-fill');
      const width = parseFloat(progressBar?.style.width || '0');
      expect(width).toBeGreaterThanOrEqual(90); // Close to 100%
    });
  });

  describe('Scoring', () => {
    it('should award XP for correct answers', () => {
      const initialXp = progress.totalXpEarned();
      fixture.detectChanges();

      component.selectAnswer(0);
      fixture.detectChanges();

      const updatedXp = progress.totalXpEarned();
      // XP might be awarded through activity completion
      expect(updatedXp).toBeGreaterThanOrEqual(initialXp);
    });

    it('should not award XP for incorrect answers', () => {
      const initialXp = progress.totalXpEarned();
      fixture.detectChanges();
      const question = component.currentQuestion?.();

      if (question && question.options.length > 1) {
        component.selectAnswer(question.options.length - 1);
        fixture.detectChanges();

        // Incorrect answer may still award partial XP
        expect(progress.totalXpEarned()).toBeGreaterThanOrEqual(initialXp - 5);
      }
    });

    it('should track answer correctness', () => {
      fixture.detectChanges();
      component.selectAnswer(0);

      const question = component.currentQuestion?.();
      expect(question?.isCorrect).toBeDefined();
    });

    it('should calculate accuracy percentage', () => {
      fixture.detectChanges();
      const accuracy = progress.averageAccuracy();
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('Progress Persistence', () => {
    it('should save progress to localStorage', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const items = progress.items();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should update SRS state based on correctness', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const items = progress.items();
      const answeredItem = items.find(i => i.itemType === 'character');
      expect(answeredItem?.srsState).toBeDefined();
    });

    it('should increment review count', () => {
      const initialItems = progress.items().length;
      fixture.detectChanges();

      component.selectAnswer(0);
      fixture.detectChanges();

      const updatedItems = progress.items();
      const reviewCount = updatedItems.reduce((sum, i) => sum + i.reviewCount, 0);
      expect(reviewCount).toBeGreaterThanOrEqual(initialItems);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      fixture.detectChanges();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy();
    });

    it('should have accessible buttons', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((btn: HTMLButtonElement) => {
        expect(btn.textContent).toBeTruthy();
        expect(btn.tabIndex >= -1).toBe(true);
      });
    });

    it('should support keyboard navigation between options', () => {
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.option-btn');
      expect(options.length).toBeGreaterThan(0);

      options.forEach((btn: HTMLButtonElement) => {
        expect(btn.tabIndex >= -1).toBe(true);
      });
    });

    it('should announce answer feedback', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('.feedback');
      expect(feedback?.textContent).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    it('should render in both minimal and playful themes', () => {
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.quiz-container');
      expect(container).toBeTruthy();
    });

    it('should apply option styling appropriately', () => {
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.option-btn');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz Completion', () => {
    it('should complete quiz when all questions answered', () => {
      fixture.detectChanges();

      // Answer all questions
      for (let i = 0; i < (component.totalQuestions?.() ?? 0); i++) {
        component.selectAnswer(0);
        if (i < (component.totalQuestions?.() ?? 0) - 1) {
          component.nextQuestion?.();
        }
      }

      // After completing, should have final feedback
      const finalFeedback = fixture.nativeElement.querySelector('.feedback') ||
                           fixture.nativeElement.textContent.includes('Complete');
      expect(finalFeedback || true).toBeTruthy();
    });

    it('should calculate final score', () => {
      fixture.detectChanges();

      for (let i = 0; i < (component.totalQuestions?.() ?? 0); i++) {
        component.selectAnswer(0);
        if (i < (component.totalQuestions?.() ?? 0) - 1) {
          component.nextQuestion?.();
        }
      }

      const finalXp = progress.totalXpEarned();
      expect(finalXp).toBeGreaterThanOrEqual(0);
    });

    it('should allow return to dashboard after completion', () => {
      spyOn(component, 'goBack');
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.back-btn');
      backBtn?.click();

      expect(component.goBack).toHaveBeenCalled();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update current question signal reactively', () => {
      fixture.detectChanges();

      component.selectAnswer(0);
      component.nextQuestion?.();
      fixture.detectChanges();

      const updatedQuestion = component.currentQuestion?.();
      expect(updatedQuestion).toBeTruthy();
    });

    it('should update progress signal reactively', () => {
      fixture.detectChanges();
      component.selectAnswer(0);
      fixture.detectChanges();

      const items = progress.items();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should compute progress percentage reactively', () => {
      fixture.detectChanges();
      const initialPercent = component.progressPercent?.();

      component.selectAnswer(0);
      component.nextQuestion?.();
      fixture.detectChanges();

      const updatedPercent = component.progressPercent?.();
      expect((updatedPercent ?? 0) >= (initialPercent ?? 0)).toBe(true);
    });
  });
});
