# Activity: Listening Comprehension (Condensed)

**ID:** `listening_comprehension_v1` | **Category:** `listening` | **Difficulty:** 3 (Advanced)

## Core Mechanic
Audio comprehension with image/context clues.

### Gameplay
- **Audio:** Play recorded phrase/sentence
- **Context:** Show image or English context clue
- **Task:** Choose correct meaning from 4 options
- **Scoring:** +12 XP correct, show answer on wrong
- **Replay:** Unlimited audio replays (no penalty)

### Session Flow
1. Select level
2. Show context image (optional)
3. Play audio (shows play button, can replay)
4. Choose from 4 English translation options
5. Feedback: show correct answer + text transcript
6. Next question (12 total per session)

### Data Source
- Uses `phrases` array
- Links to `related_word_ids` for meaning building
- Audio from `audio_key`
- English translations from `phrases.english`

### Signals
```typescript
currentPhrase: Signal<Phrase | null>
contextImage: Signal<string | null>
selectedOption: Signal<number | null>
hasAnswered: Signal<boolean>
score: Signal<number>
questionsRemaining: Signal<number>
```

## Styling
- **Large Audio Button:** Shows waveform animation during playback
- **Context Image:** Optional, 200px height
- **Options:** 4 large button options with numbered labels
- **Transcript:** Show after selection (in mono font for clarity)
- Visual indicator: replay count, remaining questions

## Accessibility
- Audio automatically plays (or can start via button)
- Keyboard: number keys 1-4 to select option
- Screen reader: reads all phrase options before answer
