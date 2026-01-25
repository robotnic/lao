# Activity: Character Scramble (Condensed)

**ID:** `character_scramble_v1` | **Category:** `alphabet` | **Difficulty:** 2 (Intermediate)

## Core Mechanic
Unscramble syllables to form Lao words.

### Gameplay
- **Display:** Scrambled consonant + vowels + tone marks
- **Task:** Arrange pieces to form valid Lao syllable
- **Example:** Given ກ, າ, ່ → Arrange to: ກ່າ
- **Scoring:** +7 XP correct, no penalty on wrong
- **Time Limit:** 30 seconds per syllable (optional difficulty mode)

### Session Flow
1. Select level (filters dictionary by level_id)
2. Display scrambled character components
3. Drag components to build syllable
4. Submit when complete
5. Feedback: show mnemonic + audio playback
6. Next syllable (15 total per session)

### Data Source
- Decomposes dictionary words into syllable parts
- Uses `alphabet` (consonants, vowels, tone marks) array
- Audio playback from `audio_key`

### Signals
```typescript
currentSyllable: Signal<string>     // Target Lao text
userArrangement: Signal<string[]>   // User's current arrangement
isCorrect: Signal<boolean>
hintsUsed: Signal<number>
score: Signal<number>
itemsCompleted: Signal<number>
```

## Styling
- **Component Pieces:** Colored tiles (consonants, vowels, tone marks in distinct colors)
- **Drop Zone:** Linear layout showing expected syllable length
- **Feedback Animation:** Green flash on correct, shake on wrong
- **Audio Playback:** Button shows Lao text + plays pronunciation

## Accessibility
- Keyboard: Tab to select piece, arrow keys to move, Enter to place
