# crm-ui Coding Standards

## Architecture
- Standalone components only — no NgModules
- Lazy-loaded routes via `loadComponent` / `loadChildren` in `app.routes.ts`
- `core/` — singleton services, interceptors, guards (never imported into components directly)
- `shared/components/` — reusable, dumb UI components
- `modules/` — feature components and their routes

## Component Conventions
- Every component: `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`
- Use `input()` signal API instead of `@Input()` decorator where possible
- Use `output()` signal API instead of `@EventEmitter` where possible
- Template control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)

## State Management
- Local state: `signal()` + `computed()` inside components
- Global/shared state: `AuthService` (auth), `ToastService` (notifications) — `providedIn: 'root'`
- No NgRx — signals are sufficient for this app's complexity

## Forms
- Always use Typed Reactive Forms: `FormGroup<{ field: FormControl<string> }>`
- Validate with built-in Angular validators — no custom directives unless unavoidable
- Show errors only after field is `touched` or on form submit

## Styling
- All colours, spacing, typography from CSS custom properties in `tokens.css`
- Component styles use `component.css` — Angular emulated encapsulation handles scoping
- Never hardcode hex colours or pixel values — always reference a `--token`
- No Tailwind, no CSS-in-JS

## HTTP
- All HTTP calls go through services — never call `HttpClient` directly in components
- Use `async pipe` or `.subscribe()` — always unsubscribe (prefer `takeUntilDestroyed()`)
- Handle errors in the service: map to domain errors, let `ToastService` show them

## TypeScript
- `strict: true` — no `any`, no `!` non-null assertions without a comment explaining why
- Interfaces for API response shapes; `type` aliases for unions/primitives
- Enums only for fixed sets (pipeline stages, activity types)
