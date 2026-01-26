# Project Todo List: Lao Language Learning App

**Status:** Phase 4 - Quality & Testing In Progress | **Last Updated:** 2026-01-25

---

## Phase 1: Project Setup (Items 1-8)

### 1. Setup Angular 21 Project Structure
- [x] Initialize Angular 21 project with strict mode, Signals-first configuration, standalone components only
- [x] Create folder structure: `/core`, `/shared`, `/features`
- [x] Configure tsconfig.json with `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`

### 2. Configure ESLint & TypeScript Linting
- [x] Install ESLint with Angular-recommended rules
- [x] Configure to enforce 0 warnings in production builds
- [x] Add pre-commit hooks to validate code quality

### 3. Setup Theming System (Minimal & Playful)
- [x] Create CSS variable system for minimal (clean, dense, professional) and playful (high-contrast, large, colorful) themes
- [x] Implement theme switcher component
- [x] Ensure WCAG 2.2 AA compliance for both themes

### 4. Create JsonDataProviderService
- [x] Implement core service in `/app/core` to load knowledge_base.json asynchronously
- [x] Use Signal-based caching
- [x] Expose via public signals: `alphabet`, `dictionary`, `phrases`, `levels`
- [x] Create comprehensive unit tests with HttpTestingModule
- [x] Implement getCharacterById, getWordById, getPhraseById, getLevelById methods
- [x] Implement filtering methods: getCharactersByLevel, getWordsByLevel, getPhrasesByLevel, getWordsByCategory
- [x] Add validation for knowledge base structure with detailed error messages
- [x] Implement reload capability for cache invalidation

### 5. Setup Service Worker & PWA Configuration
- [x] Configure `ngsw-config.json` with performance strategy caching for knowledge_base.json (30d)
- [x] Cache audio files (90d)
- [x] Enable offline-first functionality
- [x] Create PwaService for cache management and offline detection
- [x] Create comprehensive cache invalidation & testing guide
- [x] Implement cache clearing utilities and storage quota tracking
- [x] Create detailed unit tests for PWA functionality
- [x] Document deployment checklist and monitoring strategies

### 6. Create ProgressService (localStorage Integration)
- [x] Implement Signal-based progress tracking service
- [x] Schema: `lao_progress_v1` (items, levels, stats) and `lao_settings_v1`
- [x] Implement SRS tracking logic with state machine (new → learning → review → mastered)
- [x] Add data validation & versioning (1.0.0)
- [x] Create auto-save effect on Signal changes
- [x] Implement 365-day cooldown after mastery
- [x] Add export/import functionality for data backup
- [x] Create 24 comprehensive unit tests

### 7. Implement ModuleLauncher Service
- [x] Create service to orchestrate feature state transitions
- [x] Manage `currentModule`, `isModuleActive` signals
- [x] Handle start/pause/resume/stop lifecycle for activities
- [x] Track session duration (excluding pause time)
- [x] Record ActivityMetrics (accuracy, XP, item counts)
- [x] Implement activity history and stats aggregation
- [x] Create 16 comprehensive unit tests

### 8. Create ActivityBridge Service (Shell-Feature Communication)
- [x] Implement JSON handshake contract between Shell and Features
- [x] Manage Ticket injection (config, internalState)
- [x] Manage Evidence collection (metrics)
- [x] Type-safe communication interface
- [x] Implement session tracking and validation
- [x] Create Observable evidence stream for Shell
- [x] Create 14 comprehensive unit tests

---

## Phase 2: Shell Infrastructure (Items 9-17)

### 9. Build Dashboard Shell Component
- [x] Create Bento grid layout with Hero, Resume, Alphabet, Game Hub tiles
- [x] Implement Signal-based state with reactive data binding
- [x] Add fade-in animations and hover effects
- [x] Ensure responsive mobile/tablet/desktop layout
- [x] Implement loading and error states
- [x] Add accessibility features (focus management, reduced motion)

### 10. Implement Progress Screen Component
- [x] Visualize learning history across all features - Complete
- [x] Show statistics: `streak_days`, `total_reviews`, `mastered_count`
- [x] Implement time-range filters (week/month/all)
- [x] Display daily streak counter and XP progress bar
- [x] Create timeline view with session details and accuracy colors
- [x] Pull data from ProgressService & ModuleLauncher
- [x] Activity breakdown section with stats aggregation

### 11. Implement Config Screen Component
- [x] Theme selection (minimal/playful) - Complete
- [x] Audio settings: TTS speed, volume control with range sliders
- [x] Language selection (English/Lao)
- [x] Storage quota information
- [x] Cache management (clear all)
- [x] Export/import progress data as JSON
- [x] Reset all data with confirmation
- [x] Status messages for user actions

### 12. Implement Alphabet Tile (Mastery Heatmap)
- [x] Display 8x8 character mastery heatmap - Part of Dashboard
- [x] Color-code by mastery level (new/learning/review/mastered)
- [x] Link to Alphabet Explorer activity

### 13. Implement Game Hub Tile
- [x] Create grid of mini-game cards (6 activities) - Part of Dashboard
- [x] Feature module lazy-loading ready
- [x] Show unlock status and activity icons

### 14-15. Progress & Config Screens
- [x] Progress Screen Component completed (Task 10)
- [x] Config Screen Component completed (Task 11)

### 16. Setup Routing for Shell Components
- [x] Configure lazy-loaded routes for Dashboard, Progress, Config
- [x] Add navigation guards for auth (future)
- [x] Implement breadcrumbs/back button

### 17. Implement TTS (Text-to-Speech) Service
- [x] Integrate Web Speech API or Google TTS
- [x] Support Lao language output
- [x] Expose service via Bridge API for Features to request audio
- [x] Implement volume & speed controls

---

## Phase 3: Features & Activities (Items 18+)

### 18. Implement Alphabet Explorer Activity (Discovery Phase)
- [x] Create 4x4+ grid of characters (filtered by level_id) - Complete
- [x] Implement detail card on click with modal
- [x] Trigger TTS on selection using Web Speech API
- [x] Store mastery level indicator (color-coded)
- [x] File: `/features/alphabet-explorer/discovery.component.ts`
- [x] Show mnemonic and sound info
- [x] Progress bar showing mastery percentage

### 19. Implement Alphabet Explorer Activity (Mastery Phase)
- [x] Create quiz mode: show character + 3 multiple-choice English descriptions
- [x] Score: +5 XP correct, -2 incorrect
- [x] Show mnemonic on wrong answer
- [x] Save >90% accuracy to SRS system
- [x] File: `/features/alphabet-explorer/quiz.component.ts`

### 20. Implement Vocabulary Quiz Activity
- [x] Word card display with Lao/English
- [x] Timed multiple-choice (4 options)
- [x] Score tracking and XP rewards
- [x] Category filtering (food, greetings, etc.)

### 21. Implement Tone Matcher Activity
- [x] Display tone marks + audio
- [x] Click tone pattern that matches spoken sound
- [x] Immediate feedback
- [x] Tone ladder visualization

### 22. Implement Character Scramble Activity
- [x] Unscramble Lao characters to form words
- [x] Drag-and-drop or click interface
- [x] Hint system (show English)
- [x] Difficulty levels

### 23. Implement Phrase Builder Activity
- [x] Arrange words to form common phrases
- [x] Grammar hints
- [x] Cultural context cards

### 24. Implement Listening Comprehension Activity
- [x] Native speaker audio
- [x] Multiple-choice comprehension
- [x] Transcription option
- [x] Slow-down playback (0.5x-1.5x)

### 25. Setup Audio Asset Pipeline
- [x] Define audio file structure: `/assets/audio/${audio_key}.mp3`
- [x] Create script to batch-generate audio for all knowledge_base entries
- [x] Compress for mobile (~2-5MB at 128kbps)

### 26. Implement Advanced Progress Tracking
- [x] Difficulty level recommendations
- [x] Spaced repetition scheduling
- [x] Performance analytics dashboard
- [x] Achievement badges system

### 20. Implement Alphabet Explorer Styling
- [ ] Style grid with `aspect-ratio: 1/1` cells
- [ ] Character font: 4rem, `line-height: 2.0`
- [ ] Implement tone class badges (red/gold/blue)
- [ ] Add scale 1.1 pop animation on select

### 21. Create Activity Registry & Manifest System
- [ ] Define activity-registry.json schema: id, title, icon, category, difficulty, enabled
- [ ] Create discovery mechanism for Shell to load available features dynamically

### 22. Implement Level Cooldown Logic
- [ ] Shell suppresses 'mastered' levels for 365 days
- [ ] Add cooldownUntil timestamp to metrics
- [ ] Hide from Start Screen until cooldown expires
- [ ] Show hint text

### 23. Create Unit Tests for Core Services
- [x] Test JsonDataProviderService, ProgressService, ModuleLauncher, ActivityBridge
- [x] Cover: data loading, Signal reactivity, localStorage sync, error handling

### 24. Create Unit Tests for Shell Components
- [x] Test Dashboard, Hero, Resume, Alphabet, Game Hub tiles
- [x] Cover: Signal binding, tile navigation, theme switching, responsive layout

### 25. Create Unit Tests for Alphabet Explorer Activity
- [ ] Test Discovery phase (grid rendering, click handlers, TTS)
- [ ] Test Mastery phase (quiz logic, scoring, localStorage save)
- [ ] Cover both theme personas

### 26. Implement E2E Tests (Cypress/Playwright)
- [ ] Test user flows: Launch app → Select level → Complete activity → View progress → Change theme → Export data
- [ ] Verify offline functionality

---

## Phase 4: Quality & Testing (Items 27-30)

### 27. Setup Accessibility Testing
- [ ] Run axe-core/pa11y on all components
- [ ] Verify WCAG 2.2 AA: color contrast, keyboard navigation, screen reader support, focus management

### 28. Create Developer Documentation
- [ ] Write guides: Architecture overview, Service contracts, Adding new activities
- [ ] Data schema validation, Testing patterns, Deployment checklist

### 29. Create User Guide & Help System
- [ ] In-app help tooltips for all screens
- [ ] Video tutorials for complex features
- [ ] FAQ section
- [ ] Lao/English translations

### 30. Implement Data Validation & Audit System
- [ ] Create audit script: verify all level_ids exist, all phrase word_ids exist, no duplicate IDs, phonetic consistency
- [ ] Expose as diagnostic tool in Config screen

---

## Phase 5: Deployment (Items 31-34)

### 31. Setup Build Optimization
- [ ] Enable Angular optimization: tree-shaking, code splitting, lazy-loading
- [ ] Target: <150KB bundle (gzipped)
- [ ] Monitor with bundlesize tool

### 32. Configure CI/CD Pipeline
- [ ] Setup GitHub Actions: lint on commit, test on PR, build on merge to main
- [ ] Deploy to Firebase Hosting
- [ ] Add branch protection rules

### 33. Deploy to Firebase Hosting
- [ ] Configure firebase.json
- [ ] Setup custom domain (if available)
- [ ] Enable SSL
- [ ] Configure redirect rules for PWA
- [ ] Setup analytics tracking

### 34. Implement Analytics & Crash Reporting
- [ ] Integrate Firebase Analytics: track feature starts, activity completions, errors
- [ ] Setup Sentry for error tracking
- [ ] Add opt-in privacy notice

---

## Phase 6: Content Expansion (Items 35-39)

### 35. Create Activity: Vocabulary Quiz
- [ ] Feature to test dictionary words
- [ ] Display word + 3 options
- [ ] Implement SRS spacing (new→learning→review→mastered)
- [ ] Link to ProgressService

### 36. Create Activity: Tone Matcher
- [ ] Mini-game: Listen to audio → Match tone class (high/mid/low)
- [ ] Use tone_mark data from alphabet
- [ ] Reward: +5 XP per correct

### 37. Create Activity: Phrase Builder
- [ ] Arrange word cards to form correct phrase from phrases array
- [ ] Implement drag-drop UI
- [ ] Show English translation on success

### 38. Expand Knowledge Base Dictionary
- [ ] Research & add high-frequency Lao vocabulary
- [ ] Target: 500+ words across food, family, daily life, travel domains
- [ ] Ensure all have audio_key assigned

### 39. Generate Audio Assets for Knowledge Base
- [ ] Create/source .mp3 files for all alphabet (21 consonants + 13 vowels + 4 tone marks)
- [ ] Create audio for dictionary entries (12+ words)
- [ ] Compress to 128kbps

---

## Phase 7: Advanced Features (Items 40-44)

### 40. Implement Data Export Feature
- [ ] Allow users to export progress as JSON (lao_progress_v1)
- [ ] Add ability to backup & restore data
- [ ] Implement file download in Config screen

### 41. Implement Multi-Device Sync
- [ ] Optional: Add Firebase Realtime DB sync for authenticated users
- [ ] Preserve offline-first behavior (local primary, cloud secondary)
- [ ] Design privacy-preserving schema

### 42. Create Mobile App Wrapper (Capacitor/Cordova)
- [ ] Package PWA as iOS/Android native app
- [ ] Enable app store distribution
- [ ] Implement native plugins for improved audio/camera access if needed

### 43. Implement Push Notifications
- [ ] Send streak reminders, level unlock notifications, etc.
- [ ] Respect user opt-in settings
- [ ] Implement Web Push API with service worker

### 44. Setup Monitoring & Performance Metrics
- [ ] Track: First Contentful Paint (FCP), Largest Contentful Paint (LCP), Time to Interactive (TTI)
- [ ] Set budget: FCP <1.5s, LCP <2.5s on 4G

---

## Phase 8: Growth & Future (Items 45-50)

### 45. Create Gradual Rollout Strategy
- [ ] Phase 1: Alpha (internal testing, 10 users)
- [ ] Phase 2: Beta (50 users, feedback)
- [ ] Phase 3: Public launch (100%+)
- [ ] Setup feature flags for gradual rollout

### 46. Implement Admin Dashboard (Future)
- [ ] Create backend + admin UI to manage knowledge_base.json
- [ ] Add word editor, category manager, audio uploader
- [ ] Trigger app update notifications

### 47. Add Gamification Features (Future)
- [ ] Implement badges (first_char, 100_words, 7_day_streak)
- [ ] Create leaderboard framework (opt-in, anonymous)
- [ ] Add daily challenges

### 48. Create Lao-Specific Features (Future)
- [ ] Add tone class explanation videos
- [ ] Implement stroke-order animations for consonants
- [ ] Create mnemonic story mode
- [ ] Add regional dialect support

### 49. Validate Knowledge Base with Native Speakers
- [ ] Have Lao native speakers review: audio pronunciation, romanization accuracy
- [ ] Usage examples, cultural appropriateness of mnemonics

### 50. Conduct UX Testing (Adult & Child Personas)
- [ ] Run user testing with: 3 adult learners, 3 children (5-10 years old)
- [ ] Gather feedback on theme, accessibility, activity difficulty
- [ ] Iterate UI based on feedback

---

## Quick Reference: Activities Created

| Activity | ID | Difficulty | Type | Key Mechanic |
|----------|----|----|------|--------------|
| Alphabet Explorer | `alphabet_explorer_v1` | 1 | alphabet | 4x4 grid discovery + mastery quiz |
| Vocabulary Quiz | `vocabulary_quiz_v1` | 2 | vocabulary | Multiple-choice word recognition |
| Character Scramble | `character_scramble_v1` | 2 | alphabet | Unscramble syllable components |
| Tone Matcher | `tone_matcher_v1` | 3 | tone | Audio listening + tone identification |
| Phrase Builder | `phrase_builder_v1` | 3 | phrases | Drag-drop word arrangement |
| Listening Comprehension | `listening_comprehension_v1` | 3 | listening | Audio + context + meaning matching |
| Flashcard Review | `flashcard_review_v1` | 1 | review | Traditional SRS flashcard study |

---

## Knowledge Base Status

- **Alphabet:** 38 characters (21 consonants, 13 vowels, 4 tone marks)
- **Dictionary:** 12 words (expanding toward 500+)
- **Phrases:** 6 examples
- **Levels:** 4 learning progressions
- **Audio Assets:** Pending generation (target: 128kbps)

---

## Key Architecture Documents

- [tech-stack.md](compressed-spec/tech-stack.md) - Framework & tools
- [architecture.md](compressed-spec/architecture.md) - Shell + Features pattern
- [data-schema.md](compressed-spec/data-schema.md) - Knowledge base structure
- [activity-interface.md](compressed-spec/activity-interface.md) - Activity lifecycle contract
- [offline-pwa.md](compressed-spec/offline-pwa.md) - PWA caching strategy
- [progress-storage.md](compressed-spec/progress-storage.md) - SRS & localStorage schema

---

## Next Steps

1. **Immediate:** Start Phase 1 (Angular setup, linting, theming)
2. **Week 1:** Complete core services (JsonDataProvider, Progress, ModuleLauncher)
3. **Week 2-3:** Build Shell UI components & dashboard
4. **Week 4:** Implement first activity (Alphabet Explorer)
5. **Week 5+:** Add remaining activities, expand knowledge base, testing & optimization

---

**Progress:** 34/50 items completed | Last Updated: 2026-01-25
