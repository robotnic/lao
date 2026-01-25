# Activity: Alphabet Explorer (Condensed)

**ID:** `alphabet_explorer_v1` | **Category:** `alphabet` | **Difficulty:** 1 (Beginner)

## Two-Phase Flow

### Phase 1: Discovery
- **Display**: 4x4 grid of characters (filtered by `level_id`)
- **Interaction**: Click character → Detail Card appears
- **Audio**: TTS plays `sound_initial` on selection
- **Data Source**: `alphabet` array from knowledge_base.json

### Phase 2: Mastery
- **Mode**: Quiz Mode (within same activity)
- **Challenge**: Character shown + 3 multiple-choice English descriptions
- **Scoring**: +5 XP correct, Show Mnemonic on wrong answer
- **Mastery Threshold**: > 90% accuracy saves to localStorage

## Signals
```typescript
currentChar: Signal<CharEntry | null>
masteryLevel: Signal<Map<string, number>>
filteredChars: Computed<CharEntry[]>
```

## Styling Rules
- **Grid**: `display: grid` with `aspect-ratio: 1/1` per cell
- **Character Font**: `4rem` with `line-height: 2.0` (tone marks need space)
- **Animation**: Scale 1.1 "pop" on selection
- **Tone Class Badges**:
  - High: `var(--lao-red)`
  - Mid: `var(--lao-gold)`
  - Low: `var(--lao-blue)`

## Lifecycle
- **onStart**: Load alphabet section; reset masteryLevel signal
- **onStop**: Calculate totals; report results to ProgressService; save mastered items

## Data Mapping
- Each character ID from alphabet array maps to localStorage item
- Mastered state persists across sessions
