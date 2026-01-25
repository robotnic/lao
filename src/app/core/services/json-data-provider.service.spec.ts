import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JsonDataProviderService, KnowledgeBase } from './json-data-provider.service';

describe('JsonDataProviderService', () => {
  let service: JsonDataProviderService;
  let httpMock: HttpTestingController;

  // Mock knowledge base for testing
  const mockKnowledgeBase: KnowledgeBase = {
    meta: {
      version: '1.0.0',
      last_updated: '2026-01-25',
      total_characters: 2,
      total_words: 2,
      total_phrases: 1,
      total_levels: 1
    },
    levels: [
      {
        level_id: 'level_1',
        name: 'Beginner',
        description: 'Basic characters',
        difficulty: 'beginner',
        character_count: 2,
        word_count: 2,
        phrase_count: 1
      }
    ],
    alphabet: [
      {
        id: 'char_1',
        lao: 'ກ',
        name: 'Ko Kay',
        type: 'consonant',
        mnemonic: 'Like K',
        audio_key: 'char_1_audio',
        level_id: 'level_1'
      },
      {
        id: 'char_2',
        lao: 'ຂ',
        name: 'Kho Khay',
        type: 'consonant',
        mnemonic: 'Like KH',
        audio_key: 'char_2_audio',
        level_id: 'level_1'
      }
    ],
    dictionary: [
      {
        id: 'word_1',
        lao: 'ສະບາຍ',
        romanization: 'sabai',
        english: 'well',
        category: 'adjective',
        audio_key: 'word_1_audio',
        level_id: 'level_1'
      },
      {
        id: 'word_2',
        lao: 'ສະວັສດີ',
        romanization: 'sawatdi',
        english: 'hello',
        category: 'interjection',
        audio_key: 'word_2_audio',
        level_id: 'level_1'
      }
    ],
    phrases: [
      {
        id: 'phrase_1',
        lao: 'ສະບາຍດີ',
        phonetic: 'sabai di',
        english: 'hello, how are you',
        related_word_ids: ['word_1', 'word_2'],
        audio_key: 'phrase_1_audio',
        level_id: 'level_1'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JsonDataProviderService]
    });

    service = TestBed.inject(JsonDataProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load knowledge base on initialization', (done) => {
    // Reset the service to test initial load
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    expect(request.request.method).toBe('GET');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.isLoaded()).toBe(true);
      expect(service.alphabet().length).toBe(2);
      expect(service.dictionary().length).toBe(2);
      done();
    });
  });

  it('should expose alphabet signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.alphabet().length).toBe(2);
      expect(service.alphabet()[0].id).toBe('char_1');
      done();
    });
  });

  it('should expose dictionary signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.dictionary().length).toBe(2);
      expect(service.dictionary()[0].english).toBe('well');
      done();
    });
  });

  it('should expose phrases signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.phrases().length).toBe(1);
      expect(service.phrases()[0].id).toBe('phrase_1');
      done();
    });
  });

  it('should expose levels signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.levels().length).toBe(1);
      expect(service.levels()[0].level_id).toBe('level_1');
      done();
    });
  });

  it('should expose meta signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      expect(service.meta()).toBeTruthy();
      expect(service.meta()?.version).toBe('1.0.0');
      done();
    });
  });

  it('should get character by ID', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const char = service.getCharacterById('char_1');
      expect(char).toBeTruthy();
      expect(char?.consonant).toBe('ກ');
      done();
    });
  });

  it('should get word by ID', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const word = service.getWordById('word_2');
      expect(word).toBeTruthy();
      expect(word?.english).toBe('hello');
      done();
    });
  });

  it('should get phrase by ID', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const phrase = service.getPhraseById('phrase_1');
      expect(phrase).toBeTruthy();
      expect(phrase?.english).toBe('hello, how are you');
      done();
    });
  });

  it('should get characters by level', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const chars = service.getCharactersByLevel('level_1');
      expect(chars.length).toBe(2);
      expect(chars.every((c) => c.level_id === 'level_1')).toBe(true);
      done();
    });
  });

  it('should get words by level', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const words = service.getWordsByLevel('level_1');
      expect(words.length).toBe(2);
      expect(words.every((w) => w.level_id === 'level_1')).toBe(true);
      done();
    });
  });

  it('should get phrases by level', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const phrases = service.getPhrasesByLevel('level_1');
      expect(phrases.length).toBe(1);
      expect(phrases.every((p) => p.level_id === 'level_1')).toBe(true);
      done();
    });
  });

  it('should get words by category', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const adjectives = service.getWordsByCategory('adjective');
      expect(adjectives.length).toBe(1);
      expect(adjectives[0].id).toBe('word_1');
      done();
    });
  });

  it('should handle load error gracefully', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.error(new ErrorEvent('Network error'));

    setTimeout(() => {
      expect(service.hasError()).toBe(true);
      expect(service.alphabet().length).toBe(0);
      done();
    });
  });

  it('should validate knowledge base structure', (done) => {
    const invalidKB = { meta: {} }; // Missing required keys

    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(invalidKB);

    setTimeout(() => {
      expect(service.hasError()).toBe(true);
      done();
    });
  });

  it('should provide state computed signal', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const state = service.state();
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(true);
      expect(state.hasError).toBe(false);
      done();
    });
  });

  it('should provide debug info', (done) => {
    const request = httpMock.expectOne('/assets/data/knowledge_base.json');
    request.flush(mockKnowledgeBase);

    setTimeout(() => {
      const debug = service.getDebugInfo();
      expect(debug.alphabetCount).toBe(2);
      expect(debug.dictionaryCount).toBe(2);
      expect(debug.phraseCount).toBe(1);
      expect(debug.levelCount).toBe(1);
      expect(debug.isLoaded).toBe(true);
      done();
    });
  });
});
