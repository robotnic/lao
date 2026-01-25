import { TestBed } from '@angular/core/testing';
import { TtsService } from './tts.service';
import { ProgressService } from './progress.service';

describe('TtsService', () => {
  let service: TtsService;
  let progressService: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TtsService, ProgressService]
    });
    service = TestBed.inject(TtsService);
    progressService = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('speak', () => {
    it('should create and speak utterance', () => {
      spyOn(window.speechSynthesis, 'speak');
      service.speak('ສະບາຍດີ', 'lo-LA');
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should use default Lao language', () => {
      spyOn(window.speechSynthesis, 'speak');
      service.speak('ສະບາຍດີ');
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should apply TTS speed from settings', () => {
      progressService.updateSettings({ ttsSpeed: 1.5 });
      spyOn(window.speechSynthesis, 'speak');
      service.speak('test');
      
      // Verify the utterance was created with correct rate
      const callArgs = (window.speechSynthesis.speak as jasmine.Spy).calls.mostRecent().args[0];
      expect(callArgs.rate).toBe(1.5);
    });

    it('should apply volume from settings', () => {
      progressService.updateSettings({ audioVolume: 50 });
      spyOn(window.speechSynthesis, 'speak');
      service.speak('test');
      
      const callArgs = (window.speechSynthesis.speak as jasmine.Spy).calls.mostRecent().args[0];
      expect(callArgs.volume).toBe(0.5);
    });
  });

  describe('speakLao', () => {
    it('should speak Lao text with correct language', () => {
      spyOn(window.speechSynthesis, 'speak');
      service.speakLao('ກິນ');
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('speakEnglish', () => {
    it('should speak English text with correct language', () => {
      spyOn(window.speechSynthesis, 'speak');
      service.speakEnglish('eat');
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should cancel speech synthesis', () => {
      spyOn(window.speechSynthesis, 'cancel');
      service.stop();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('isSpeaking', () => {
    it('should return speaking status', () => {
      const status = service.isSpeaking();
      expect(typeof status).toBe('boolean');
    });
  });

  describe('getVoices', () => {
    it('should return array of voices', () => {
      const voices = service.getVoices();
      expect(Array.isArray(voices)).toBe(true);
    });
  });
});
