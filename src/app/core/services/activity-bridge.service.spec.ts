import { TestBed } from '@angular/core/testing';
import {
  ActivityBridge,
  ActivityEvidence
} from './activity-bridge.service';

describe('ActivityBridge', () => {
  let service: ActivityBridge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActivityBridge]
    });

    service = TestBed.inject(ActivityBridge);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create ticket with correct structure', () => {
    const ticket = service.createTicket(
      'alphabet',
      'Alphabet Explorer',
      'level_1',
      'Beginner',
      'beginner',
      ['char_1', 'char_2', 'char_3'],
      'minimal',
      true
    );

    expect(ticket.activityId).toBe('alphabet');
    expect(ticket.activityName).toBe('Alphabet Explorer');
    expect(ticket.levelId).toBe('level_1');
    expect(ticket.difficulty).toBe('beginner');
    expect(ticket.itemIds.length).toBe(3);
    expect(ticket.internalState.sessionId).toBeTruthy();
    expect(ticket.internalState.theme).toBe('minimal');
    expect(ticket.internalState.audioEnabled).toBe(true);
  });

  it('should generate unique session IDs', () => {
    const ticket1 = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    const ticket2 = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    expect(ticket1.internalState.sessionId).not.toBe(
      ticket2.internalState.sessionId
    );
  });

  it('should inject and retrieve ticket', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);
    const retrieved = service.getTicket();

    expect(retrieved).toEqual(ticket);
  });

  it('should track active sessions', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    expect(service.getActiveSessionCount()).toBe(0);

    service.injectTicket(ticket);
    expect(service.getActiveSessionCount()).toBe(1);

    service.clearTicket();
    expect(service.getActiveSessionCount()).toBe(0);
  });

  it('should check if session is active', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);
    const sessionId = ticket.internalState.sessionId;

    expect(service.isSessionActive(sessionId)).toBe(true);

    service.clearTicket();
    expect(service.isSessionActive(sessionId)).toBe(false);
  });

  it('should submit valid evidence', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const evidence: ActivityEvidence = {
      activityId: 'test',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 1,
      incorrectCount: 0,
      accuracy: 100,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    service.submitEvidence(evidence);
    expect(service.getCurrentEvidence()).toEqual(evidence);
  });

  it('should reject invalid evidence - missing activityId', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const badEvidence = {
      activityId: '',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 1,
      incorrectCount: 0,
      accuracy: 100,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    expect(() => service.submitEvidence(badEvidence as any)).toThrowError(
      /activityId/
    );
  });

  it('should reject invalid evidence - accuracy out of range', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const badEvidence: ActivityEvidence = {
      activityId: 'test',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 1,
      incorrectCount: 0,
      accuracy: 150,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    expect(() => service.submitEvidence(badEvidence)).toThrowError(/accuracy/);
  });

  it('should reject invalid evidence - correctCount out of range', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const badEvidence: ActivityEvidence = {
      activityId: 'test',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 5,
      incorrectCount: 0,
      accuracy: 100,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    expect(() => service.submitEvidence(badEvidence)).toThrowError(/range/);
  });

  it('should clear ticket', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);
    expect(service.getTicket()).toBeTruthy();

    service.clearTicket();
    expect(service.getTicket()).toBeNull();
  });

  it('should provide evidence stream observable', (done) => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const evidence: ActivityEvidence = {
      activityId: 'test',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 1,
      incorrectCount: 0,
      accuracy: 100,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    let receivedEvidence: ActivityEvidence | null = null;
    service.evidence$.subscribe(ev => {
      if (ev) {
        receivedEvidence = ev;
      }
    });

    service.submitEvidence(evidence);

    setTimeout(() => {
      expect(receivedEvidence).toEqual(evidence);
      done();
    }, 10);
  });

  it('should subscribe to evidence with callback', (done) => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const evidence: ActivityEvidence = {
      activityId: 'test',
      sessionId: ticket.internalState.sessionId,
      timestamp: Date.now(),
      duration: 30000,
      itemsProcessed: 1,
      correctCount: 1,
      incorrectCount: 0,
      accuracy: 100,
      xpEarned: 5,
      itemMetrics: [
        {
          itemId: 'item_1',
          isCorrect: true,
          responseTime: 5000,
          attemptCount: 1
        }
      ]
    };

    let received: ActivityEvidence | null = null;
    const unsubscribe = service.subscribeToEvidence(ev => {
      received = ev;
    });

    service.submitEvidence(evidence);

    setTimeout(() => {
      expect(received).toEqual(evidence);
      unsubscribe();
      done();
    }, 10);
  });

  it('should get active session IDs', () => {
    const ticket1 = service.createTicket(
      'test1',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    const ticket2 = service.createTicket(
      'test2',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket1);
    service.injectTicket(ticket2);

    const sessionIds = service.getActiveSessionIds();
    expect(sessionIds.length).toBe(2);
    expect(sessionIds).toContain(ticket1.internalState.sessionId);
    expect(sessionIds).toContain(ticket2.internalState.sessionId);
  });

  it('should provide debug info', () => {
    const ticket = service.createTicket(
      'test',
      'Test',
      'level_1',
      'Test',
      'beginner',
      ['item_1'],
      'minimal',
      true
    );

    service.injectTicket(ticket);

    const debug = service.getDebugInfo();
    expect(debug.currentTicket).toEqual(ticket);
    expect(debug.activeSessionCount).toBe(1);
    expect(debug.activeSessionIds.length).toBe(1);
  });
});
