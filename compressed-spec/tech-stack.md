# Tech Stack & Constitution (Condensed)

## Framework & Reactivity
- **Framework:** Angular 21.1+
- **State Management:** Signals-first (`signal`, `computed`, `effect`)
- **RxJS Usage:** Minimal—only for complex async streams & API calls
- **Components:** 100% Standalone (no NgModules)
- **Rendering:** Partial Hydration for optimized LCP/FCP

## Folder Architecture
```
/src/app/
├── core/          Singleton services, guards, interceptors
├── shared/        Dumb components, directives, pipes
└── features/      Domain-driven modules (lazy-loaded)
```

## Data Strategy
- **Source:** `/assets/data/*.json` (static configuration & content)
- **Loading:** `JsonDataProviderService` (cached in Core)
- **Consumption:** Components access via Signal-based services (never direct JSON fetches)

## Theming & Accessibility
- **Two themes:** Minimal (clean, dense, professional) & Playful (high-contrast, large targets, colorful)
- **Implementation:** CSS Variables scoped under `.theme-minimal` / `.theme-playful`
- **Standard:** WCAG 2.2 AA compliance

## Code Quality
- **TypeScript:** Strict mode; `noImplicitAny: true`
- **Linting:** ESLint + Angular-recommended rules (0 warnings in prod)
- **Testing:** Every component must have `.spec.ts` file
- **Naming:** `feature.component.ts`, `feature.service.ts`, `feature.model.ts`

## Documentation Requirement
- **Source of Truth:** Specs must be updated BEFORE code changes
- **Sync Rule:** AI cannot implement features not documented in current Spec
