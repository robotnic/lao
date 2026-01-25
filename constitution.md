# Angular 21 Project Constitution: v1.1

## 1. Core Technical Stack
- **Framework:** Angular 21.1+ (Latest Stable).
- **Reactivity:** Strict "Signals-First" approach. Use `signal`, `computed`, and `effect`. Minimize RxJS to complex async streams and API handling only.
- **Components:** 100% Standalone Components. No `NgModules` permitted.
- **Rendering:** Default to Partial Hydration for optimized LCP/FCP.

## 2. Architecture & Folder Structure
Follow a modular "Core + Features" hierarchy to ensure scalability.
- **`/src/app/core`:** Singleton services (Auth, Error Handling, JSON Data Loaders), global guards, and interceptors.
- **`/src/app/shared`:** Dumb/Presentational components, directives, and pipes reused across multiple features.
- **`/src/app/features`:** Domain-driven modules (e.g., `/features/dashboard`, `/features/user-profile`). Each feature folder must contain its own components and local state logic.

## 3. Data Strategy (JSON-Driven)
- All static and configuration data must reside in the `/assets/data/*.json` directory.
- Use a central `JsonDataProviderService` in Core to fetch and cache these files.
- Components must never fetch JSON directly; they consume data through Signal-based services.

## 4. Theming & UX (Demographic-Adaptive)
- **Target Audience:** Theme must be "Theme-Switchable" for `Adult` (Clean, High Density, Minimalist) and `Children` (High Contrast, Large Targets, Playful Imagery).
- **Implementation:** Use CSS Variables scoped under demographic classes (e.g., `.theme-adult` vs `.theme-child`).
- **Accessibility:** Must meet WCAG 2.2 AA standards, specifically focusing on cognitive ease for children and efficiency for adults.

## 5. Strictness & Code Quality
- **TypeScript:** Strict Mode enabled. `noImplicitAny: true`, `strictNullChecks: true`.
- **Linting:** ESLint with Angular-recommended rules. 0 warnings allowed in production builds.
- **Naming:** 
  - Components: `feature-name.component.ts`
  - Services: `feature-name.service.ts`
  - Interfaces: `feature-name.model.ts` (No 'I' prefix).

## 6. Documentation & Spec Maintenance
- **Source of Truth:** The `SPEC.md` must be updated BEFORE any code changes.
- **Synchronization:** AI is prohibited from implementing features that are not explicitly documented in the current Spec version.
- **Unit Testing:** Every component must have a corresponding `.spec.ts` file covering core logic and demographic-based rendering.
