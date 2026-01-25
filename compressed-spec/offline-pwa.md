# Offline-First PWA Strategy (Condensed)

## Philosophy
In 2026, treat the network as optional. Local-first data is the source of truth.

## Service Worker Configuration
**File:** `ngsw-config.json`

### Data Group: Knowledge Monolith
```json
{
  "name": "knowledge-monolith",
  "urls": ["/assets/data/knowledge_base.json"],
  "cacheConfig": {
    "maxSize": 1,
    "maxAge": "30d",
    "timeout": "0s",
    "strategy": "performance"
  }
}
```

### Audio Group
```json
{
  "name": "audio-cache",
  "urls": ["/assets/audio/*"],
  "cacheConfig": {
    "maxSize": 2,
    "maxAge": "90d",
    "timeout": "5s",
    "strategy": "performance"
  }
}
```

## Key Rules
- **Performance strategy**: Serve cached version immediately, update in background
- **8-10MB monolith**: Must be fully cached for offline access
- **Timeout: 0s**: Never wait for network on read (go straight to cache)
- **Update cycle**: Every 30 days for JSON, every 90 days for audio

## Result
App functions fully offline after first visit.
