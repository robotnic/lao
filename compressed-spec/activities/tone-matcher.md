# Activity: Tone Matcher (Condensed)

**ID:** `tone_matcher_v1` | **Category:** `tone` | **Difficulty:** 3 (Advanced)

## Core Mechanic
Audio listening + tone class identification.

### Gameplay
- **Audio:** Play consonant with tone mark (mai_tho, mai_ti, etc.)
- **Challenge:** Identify tone class (High/Mid/Low)
- **Options:** 3 buttons (High, Mid, Low) with color badges
- **Scoring:** +5 XP correct, -0 XP wrong (no penalty, show answer)
- **Visual Aid:** Tone mark symbol displayed after selection

### Session Flow
1. Select level (filters alphabet entries with tone_marks)
2. Listen to audio
3. Choose tone class
4. Next character (25 total per session)
5. End → Report accuracy

### Data Source
- Uses `alphabet` array
- Filters by `class: 'high' | 'mid' | 'low'`
- Plays audio from `audio_key`
- Shows `mai_*` tone mark symbols

### Signals
```typescript
currentChar: Signal<AlphabetEntry | null>
userGuess: Signal<'high' | 'mid' | 'low' | null>
isAnswered: Signal<boolean>
accuracy: Signal<number>      // % correct in session
questionsRemaining: Signal<number>
```

## Styling
- Three large colored buttons: red (High), gold (Mid), blue (Low)
- Tone mark display (2rem) during playback
- Audio playback button with visual "playing" state
- Score counter at top

## Accessibility
- Audio plays automatically, re-playable via button
- Keyboard: arrow keys to select option, Enter to confirm
