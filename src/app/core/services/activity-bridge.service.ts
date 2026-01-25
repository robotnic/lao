import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Configuration passed from Shell to Feature
 */
export interface ActivityTicket {
  activityId: string;
  activityName: string;
  levelId: string;
  levelName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  itemIds: string[]; // Characters, words, or phrases to review
  internalState: {
    sessionId: string;
    userId?: string; // Optional for multi-user support
    theme: 'minimal' | 'playful';
    audioEnabled: boolean;
  };
}

/**
 * Evidence (metrics/results) returned from Feature to Shell
 */
export interface ActivityEvidence {
  activityId: string;
  sessionId: string;
  timestamp: number;
  duration: number; // milliseconds
  itemsProcessed: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0-100
  xpEarned: number;
  itemMetrics: Array<{
    itemId: string;
    isCorrect: boolean;
    responseTime: number; // milliseconds
    attemptCount: number;
  }>;
  userNotes?: string; // Optional feedback from user
}

/**
 * ActivityBridge Service
 *
 * Implements JSON handshake contract between Shell and Features.
 * Manages Ticket injection (config, internalState) and Evidence collection (metrics).
 * Provides type-safe communication interface.
 *
 * Usage:
 *   Shell:
 *     const ticket = this.bridge.createTicket(levelId, itemIds);
 *     this.bridge.injectTicket(ticket);
 *     this.bridge.evidence$.subscribe(evidence => { ... });
 *
 *   Feature:
 *     const ticket = this.bridge.getTicket();
 *     // ... run activity ...
 *     this.bridge.submitEvidence(evidence);
 */
@Injectable({
  providedIn: 'root'
})
export class ActivityBridge {
  // Ticket for feature consumption
  private readonly ticket = signal<ActivityTicket | null>(null);

  // Evidence stream for shell consumption
  private readonly evidenceSubject = new BehaviorSubject<ActivityEvidence | null>(
    null
  );
  evidence$: Observable<ActivityEvidence | null> =
    this.evidenceSubject.asObservable();

  // Session tracking
  private readonly activeSessions = signal<Set<string>>(new Set());

  constructor() {}

  /**
   * Create ticket for activity (Shell calls this)
   */
  createTicket(
    activityId: string,
    activityName: string,
    levelId: string,
    levelName: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    itemIds: string[],
    theme: 'minimal' | 'playful',
    audioEnabled: boolean
  ): ActivityTicket {
    const sessionId = this.generateSessionId();

    const ticket: ActivityTicket = {
      activityId,
      activityName,
      levelId,
      levelName,
      difficulty,
      itemIds,
      internalState: {
        sessionId,
        theme,
        audioEnabled
      }
    };

    return ticket;
  }

  /**
   * Inject ticket for feature to consume (Shell calls this)
   */
  injectTicket(ticket: ActivityTicket): void {
    const sessionId = ticket.internalState.sessionId;
    const sessions = this.activeSessions();
    sessions.add(sessionId);
    this.activeSessions.set(new Set(sessions));

    this.ticket.set(ticket);
    console.log(`[ActivityBridge] Ticket injected for session: ${sessionId}`);
  }

  /**
   * Get ticket (Feature calls this)
   */
  getTicket(): ActivityTicket | null {
    return this.ticket();
  }

  /**
   * Submit evidence after activity completion (Feature calls this)
   */
  submitEvidence(evidence: ActivityEvidence): void {
    const sessionId = evidence.sessionId;

    // Validate evidence
    this.validateEvidence(evidence);

    // Record session
    const sessions = this.activeSessions();
    sessions.delete(sessionId);
    this.activeSessions.set(new Set(sessions));

    // Publish evidence
    this.evidenceSubject.next(evidence);
    console.log(`[ActivityBridge] Evidence submitted for session: ${sessionId}`);
  }

  /**
   * Clear ticket (Shell calls this after handling evidence)
   */
  clearTicket(): void {
    const ticket = this.ticket();
    if (ticket) {
      const sessions = this.activeSessions();
      sessions.delete(ticket.internalState.sessionId);
      this.activeSessions.set(new Set(sessions));
    }
    this.ticket.set(null);
  }

  /**
   * Subscribe to evidence (Shell uses this)
   */
  subscribeToEvidence(callback: (evidence: ActivityEvidence) => void): () => void {
    const subscription = this.evidence$.subscribe(evidence => {
      if (evidence) {
        callback(evidence);
      }
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Get active sessions count
   */
  getActiveSessionCount(): number {
    return this.activeSessions().size;
  }

  /**
   * Check if session is active
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions().has(sessionId);
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions());
  }

  /**
   * Get current evidence
   */
  getCurrentEvidence(): ActivityEvidence | null {
    return this.evidenceSubject.value;
  }

  /**
   * Validate evidence structure
   */
  private validateEvidence(evidence: ActivityEvidence): void {
    if (!evidence.activityId || typeof evidence.activityId !== 'string') {
      throw new Error('Invalid evidence: missing or invalid activityId');
    }

    if (!evidence.sessionId || typeof evidence.sessionId !== 'string') {
      throw new Error('Invalid evidence: missing or invalid sessionId');
    }

    if (typeof evidence.accuracy !== 'number' || evidence.accuracy < 0 || evidence.accuracy > 100) {
      throw new Error('Invalid evidence: accuracy must be 0-100');
    }

    if (evidence.itemsProcessed < 0) {
      throw new Error('Invalid evidence: itemsProcessed must be non-negative');
    }

    if (evidence.correctCount < 0 || evidence.correctCount > evidence.itemsProcessed) {
      throw new Error('Invalid evidence: correctCount out of range');
    }

    if (!Array.isArray(evidence.itemMetrics)) {
      throw new Error('Invalid evidence: itemMetrics must be an array');
    }

    if (evidence.itemMetrics.length !== evidence.itemsProcessed) {
      throw new Error('Invalid evidence: itemMetrics length mismatch');
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debug info
   */
  getDebugInfo(): {
    currentTicket: ActivityTicket | null;
    activeSessionCount: number;
    activeSessionIds: string[];
    lastEvidence: ActivityEvidence | null;
  } {
    return {
      currentTicket: this.ticket(),
      activeSessionCount: this.getActiveSessionCount(),
      activeSessionIds: this.getActiveSessionIds(),
      lastEvidence: this.getCurrentEvidence()
    };
  }
}
