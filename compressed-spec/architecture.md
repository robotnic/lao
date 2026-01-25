# Architecture: Shell + Features Model (Condensed)

## Core Pattern
**Platform-Agnostic Shell** (Orchestrator) + **Independent Features** (Learning Engines)

### The Shell (Responsibilities)
- Routing & session orchestration
- Persistence (localStorage only)
- Global state & configuration
- Feature discovery via manifest
- Progress visualization & cooldown management

**Key Screens:**
- Start Screen: Dynamic feature discovery + progress bars
- Progress Screen: Historical data visualization
- Config Screen: TTS, Theme, Language settings
- Level Suppression: Hide "mastered" levels for 365 days

### Features (Responsibilities)
- Gameplay logic & local UI only
- **Stateless**: Receive `internalState` at start; emit `metrics` at end
- Request shared services (Audio, TTS) via Bridge API
- Lazy-loaded Angular modules

## Communication Contract: JSON Handshake

**Ticket** (Shell → Feature):
```json
{
  "sessionId": "2026-01-25-trace-001",
  "featureId": "eco-trace",
  "levelId": "basics-1",
  "config": { "difficulty": 0.8, "ttsSpeed": 1.0 },
  "internalState": {}
}
```

**Evidence** (Feature → Shell):
```json
{
  "metrics": {
    "step": 4,
    "totalSteps": 10,
    "accuracy": 0.94,
    "repetitions": 12
  }
}
```

## Key Rule
**Shell persists progress.** Features are ephemeral and calculate metrics from session data only.
