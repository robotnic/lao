# Activity Interface & Lifecycle (Condensed)

## LaoActivity Interface
Every learning Activity must implement this contract:

```typescript
export interface LaoActivity {
  id: string;                      // Matches activity-registry.json
  manifest: ActivityMeta;          // Title, icon, category
  
  status: Signal<'idle' | 'loading' | 'active' | 'paused' | 'saving'>;
  progress: Signal<number>;        // 0-100%
  
  onStart(config: ActivityConfig): void;
  onPause?(): void;
  onResume?(): void;
  onStop(): Promise<void>;         // Ensures data save completes
}
```

## Key Principles
- **Standalone Angular Components** with standalone APIs
- **Signals-based state** (not RxJS)
- **Lifecycle symmetry**: For every `onStart`, there must be a matching `onStop`
- **Promise-based cleanup**: `onStop()` returns a Promise to guarantee persisting data

## Integration Points
- Receive configuration & game state from Shell at start
- Emit updated metrics to Shell on completion
- Request shared services (Audio, TTS) via Bridge API
- Track item mastery & session evidence locally
