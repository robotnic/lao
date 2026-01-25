# Compressed Specifications Index

Quick reference guide mapping original specs to condensed versions. Each file extracts core concepts, key decisions, and critical dependencies.

## Core Documents

| Original | Compressed | Key Takeaway |
|----------|-----------|--------------|
| constitution.md | [tech-stack.md](tech-stack.md) | Angular 21, Signals-first, JSON-driven data, minimal/playful theming |
| architecure.md | [architecture.md](architecture.md) | Shell orchestrates Features via JSON contract; Features are stateless |
| data-schema.md | [data-schema.md](data-schema.md) | Single knowledge_base.json monolith; strict WordCategory enum |
| knowledge_base.md | [knowledge-seed.md](knowledge-seed.md) | Initial seed data (5 dictionary entries, 2 phrases, 4 levels) |
| module-contract.md | [activity-interface.md](activity-interface.md) | Activities implement LaoActivity; Signal-based state; onStart/onStop lifecycle |
| offline-strategy.md | [offline-pwa.md](offline-pwa.md) | Service Worker caches knowledge_base.json (performance strategy) |
| ui-dashboard.md | [dashboard.md](dashboard.md) | Bento grid layout; Hero, Resume, Alphabet, Game Hub tiles |
| user_progress.md | [progress-storage.md](progress-storage.md) | localStorage with SRS tracking; items and levels schemas |

## Activity Specs

| Original | Compressed | Purpose |
|----------|-----------|---------|
| activities/alphabet-explorer.md | [activities/alphabet.md](activities/alphabet.md) | 4x4 grid of characters; Discovery → Mastery quiz flow |

---

## Critical Links & Dependencies

### Data Flow
1. **Shell** loads `knowledge_base.json` (8-10MB monolith)
2. **Activities** consume alphabet/dictionary/phrases via Signals
3. **Progress** tracked in localStorage (SRS metadata)

### Key Architectural Rules
- ✅ **Signals-first**: Use `signal`, `computed`, `effect` (minimal RxJS)
- ✅ **Standalone components**: No NgModules
- ✅ **JSON-driven**: All config/data in `/assets/data/`
- ✅ **Theme-based**: Minimal (professional) vs Playful (colorful) design (WCAG 2.2 AA)
- ✅ **Offline-capable**: PWA with Service Worker caching
- ✅ **Activities are stateless**: Shell orchestrates, Features report metrics

### Known Gaps
- [ ] Progress.md not yet compressed (check for dependency specs)
- [ ] Tasks.md not yet compressed (check for TODO items)
- [ ] Missing: Feature registry / Activity manifest list
- [ ] Missing: Complete audio file structure definition
- [ ] Missing: TTS bridge API specification

---

**Last Updated:** 2026-01-25
