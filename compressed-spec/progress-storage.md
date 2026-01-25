# Progress & SRS Storage (Condensed)

## localStorage Keys
- `lao_progress_v1`: Main learning state (words, chars, phrases)
- `lao_settings_v1`: User preferences (theme, volume, etc.)

## Progress Schema
```typescript
interface UserProgress {
  schema_version: "1.0.0";
  last_sync: number;                    // Unix timestamp
  
  stats: {
    streak_days: number;
    total_reviews: number;
    mastered_count: number;
  };
  
  items: {
    [id: string]: {
      status: 'new' | 'learning' | 'review' | 'mastered';
      srs: SRSState;                    // Spaced Repetition data
      history: ReviewLog[];             // Last 5 reviews
      tags: string[];                   // User categories
    };
  };
  
  levels: {
    [level_id: string]: {
      unlocked: boolean;
      score: number;                    // 0-100
      completed: boolean;
    };
  };
}
```

## SRS Tracking
- Spaces out reviews (Spaced Repetition System)
- Tracks difficulty & retention
- Maps to items by ID from knowledge_base.json

## Level Tracking
- Score = highest quiz result
- Unlocked = prerequisite completed
- Completed = user finished all challenges
