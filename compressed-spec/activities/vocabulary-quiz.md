# Activity: Vocabulary Quiz (Condensed)

**ID:** `vocabulary_quiz_v1` | **Category:** `vocabulary` | **Difficulty:** 2 (Intermediate)

## Core Mechanic
Word recognition and SRS-based spacing.

### Quiz Mode
- **Display:** Lao word + 3 multiple-choice English translations
- **Scoring:** +10 XP correct, +2 XP skip without penalty
- **Feedback:** Show correct answer + usage example on mistake
- **Queue:** Pulls from dictionary array, respects SRS status & level_id

### SRS Integration
- **New** → **Learning** (3 reviews)
- **Learning** → **Review** (5 reviews)
- **Review** → **Mastered** (2 reviews)
- Tracks `history: ReviewLog[]` (last 5 reviews per word)
- Updates `ProgressService.updateItem(id, status, srs)`

### Session Flow
- Start → Select level → Quiz mode → Review mistakes → End
- Reports metrics: `total_questions`, `correct_count`, `accuracy`, `items_reviewed`

### Signals
```typescript
currentWord: Signal<DictEntry | null>
selectedAnswer: Signal<string | null>
reviewQueue: Signal<DictEntry[]>
progress: Signal<number>      // % of queue completed
```

## Styling
- Large word display (2rem)
- Option buttons: high contrast, clear tap targets
- Mnemonic hints below correct answer on error
