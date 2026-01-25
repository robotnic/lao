# Activity: Phrase Builder (Condensed)

**ID:** `phrase_builder_v1` | **Category:** `phrases` | **Difficulty:** 3 (Advanced)

## Core Mechanic
Drag-and-drop word arrangement.

### Gameplay
- **Display:** English phrase + randomized Lao word cards
- **Task:** Arrange words in correct order to match phrase
- **Scoring:** +15 XP on success, hints available (cost: 1 XP each)
- **Feedback:** Show correct order + audio playback on completion

### Session Flow
1. Select level (filters `phrases` array by level_id)
2. Show 1 phrase, scrambled words
3. Drag words into drop zone (horizontal sequence)
4. Submit when arranged
5. If correct: celebrate + next phrase (8 total per session)
6. If wrong: show hint or reveal answer (user chooses)

### Data Source
- Uses `phrases` array
- Word cards pulled from `related_word_ids` links
- Display both Lao & English on cards initially, hide Lao after submit

### Signals
```typescript
currentPhrase: Signal<Phrase | null>
selectedWords: Signal<DictEntry[]>
correctOrder: Signal<DictEntry[]>
isSubmitted: Signal<boolean>
userScore: Signal<number>
phrasesCompleted: Signal<number>
```

## Styling
- **Word Cards:** Draggable tiles with Lao text (1.5rem), touch-friendly (min 44px)
- **Drop Zone:** Horizontal container with visual guides
- **English Phrase:** Large (1.2rem) display above
- **Audio Button:** Play recorded phrase on success
- Drag-over feedback: highlight valid drop zones

## Mobile Optimization
- Drag-drop works on touch (via CDK)
- Alternative: Tab through words + arrow keys to reorder (accessibility)
