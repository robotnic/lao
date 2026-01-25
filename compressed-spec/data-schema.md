# Data Schema: Knowledge Base (Condensed)

## Single Source of Truth
**File:** `/src/assets/data/knowledge_base.json` (5-10MB monolith)

## Top-Level Keys
- `meta`: Version & audit metadata
- `levels`: Learning progression (ID, title, type, order)
- `alphabet`: Consonants, vowels, tone marks
- `dictionary`: Words with metadata
- `phrases`: Example sentences & word links

## Dictionary Entry Structure
```json
{
  "id": "water_01",
  "lao": "ນ້ຳ",
  "phonetic": "nam",
  "english": "water",
  "category": "noun",         // See WordCategory enum
  "usage_rank": 10,           // 1-10,000
  "level_id": "food_01",
  "audio_key": "water_01_v1"
}
```

## WordCategory Enum (Strict Values)
**Nouns:** `noun`, `proper_noun`, `pronoun`
**Verbs:** `verb`, `stative_verb`
**Modifiers:** `adjective`, `adverb`, `numeral`
**Structural:** `classifier`, `preposition`, `conjunction`, `interjection`, `determiner`
**Functional:** `auxiliary`, `negation`, `particle_polite`, `particle_question`, `particle_aspect`, `particle_mood`

## Alphabet Entry Structure
```json
{
  "type": "consonant",        // or "vowel", "tone_mark"
  "class": "mid",             // high, mid, low
  "sounds": {
    "sound_initial": "ก",
    "sound_final": "ก"
  }
}
```

## Critical Rules
- Every `level_id` in dictionary must exist in levels array
- Every `related_word_ids` in phrases must exist in dictionary
- No duplicate IDs
- Lao text requires: `font-family: 'Noto Sans Lao'`, `line-height: 1.8`
- Audio paths: `/assets/audio/${audio_key}.mp3`

## Performance Notes
- Load via async background fetch (`@defer` block)
- Use high-performance `for` loops for search on mobile devices
