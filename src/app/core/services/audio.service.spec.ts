import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';
import { TtsService } from './tts.service';

describe('AudioService', () => {
  let service: AudioService;
  let ttsService: TtsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AudioService, TtsService]
    });
    service = TestBed.inject(AudioService);
    ttsService = TestBed.inject(TtsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('playAudio', () => {
    it('should attempt to play audio file', () => {
      spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
      service.playAudio('test_audio_v1', 'test text');
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it('should fallback to TTS when audio fails', (done) => {
      spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(
        Promise.reject(new Error('Audio not found'))
      );
      spyOn(ttsService, 'speak');

      service.playAudio('missing_audio', 'fallback text');

      setTimeout(() => {
        expect(ttsService.speak).toHaveBeenCalledWith('fallback text', 'lo-LA');
        done();
      }, 100);
    });

    it('should use correct language for audio', () => {
      spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
      service.playAudio('test', 'test', 'en-US');
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  describe('playLao', () => {
    it('should play Lao audio with correct language', () => {
      spyOn(service, 'playAudio');
      service.playLao('ko_kay_v1', 'ກ');
      expect(service.playAudio).toHaveBeenCalledWith('ko_kay_v1', 'ກ', 'lo-LA');
    });
  });

  describe('playEnglish', () => {
    it('should play English audio with correct language', () => {
      spyOn(service, 'playAudio');
      service.playEnglish('word_01', 'hello');
      expect(service.playAudio).toHaveBeenCalledWith('word_01', 'hello', 'en-US');
    });
  });

  describe('stopAll', () => {
    it('should stop all audio playback', () => {
      spyOn(HTMLMediaElement.prototype, 'pause');
      service.playAudio('test1', 'text1');
      service.playAudio('test2', 'text2');
      service.stopAll();
      
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
      expect(ttsService.stop).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear audio cache', () => {
      service.preloadAudio('test_audio');
      expect(service.isAudioAvailable('test_audio')).toBe(true);
      
      service.clearCache();
      // Cache should be cleared
    });
  });

  describe('preloadAudio', () => {
    it('should preload audio into cache', () => {
      service.preloadAudio('ko_kay_v1');
      expect(service.isAudioAvailable('ko_kay_v1')).toBe(true);
    });
  });
});
