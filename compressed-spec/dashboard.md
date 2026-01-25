# Dashboard Shell UI (Condensed)

## Layout: Bento Grid
Modular grid with variable aspect ratios.

### Tiles
1. **Hero Tile**: Daily Streak & XP Progress (Animated Signal counters)
2. **Resume Tile**: Last active level (Direct Start button)
3. **Alphabet Tile**: Character mastery heatmap (8x8 grid)
4. **Game Hub**: Mini-games (Scramble, Tone-Match, etc.)

## Interaction
- **Hover/Active**: Scale 1.02x + subtle glow (`var(--neon-cyan)`)
- **Navigation**: All tiles use `ModuleLauncher` service
- **Entry Animation**: Staggered fade-in using Angular 19 transition signals

## Global Signal
```typescript
currentModule: Signal<ModuleID | null>
isModuleActive: Computed<boolean>
```

## Styling Notes
- Use CSS Grid for layout
- Leverage CSS variables for theming
- Implement responsive breakpoints for mobile/tablet/desktop
