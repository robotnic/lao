# Activity: Flashcard Review (Condensed)

**ID:** `flashcard_review_v1` | **Category:** `review` | **Difficulty:** 1 (Beginner)

## Core Mechanic
Traditional spaced-repetition flashcard study.

### Gameplay
- **Front:** Lao word (large, 3rem)
- **Back:** English meaning + mnemonic (on flip)
- **Response:** User rates confidence (Again/Hard/Good/Easy)
- **SRS Update:** Adjusts review interval based on rating
- **Session:** Study 20 cards or until queue empty

### Session Flow
1. Select level & card set
2. Show card front (Lao text)
3. User attempts recall
4. Flip to reveal answer
5. Rate confidence (1-4)
6. SRS calculates next review date
7. Next card
8. End → Show session stats

### Data Source
- Pulls from `dictionary` array
- Filters by level_id & SRS status (new/learning/review)
- Uses `history: ReviewLog[]` to track ratings

### Signals
```typescript
currentCard: Signal<DictEntry | null>
isFlipped: Signal<boolean>
userRating: Signal<1 | 2 | 3 | 4 | null>
reviewQueue: Signal<DictEntry[]>
cardsStudied: Signal<number>
totalCards: Signal<number>
```

## Styling
- **Card Container:** Large centered card (300x400px) with flip animation
- **Front:** Lao text centered, bold (3rem), with audio button
- **Back:** Two sections - English (bold 1.5rem), Mnemonic (italic 0.9rem)
- **Rating Buttons:** 4 large buttons (red/orange/yellow/green)
- **Progress Bar:** Shows cards completed in queue

## Animations
- Card flip: 3D rotate effect
- Smooth transitions between cards
- Rating buttons highlight on hover
