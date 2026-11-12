# Source guidance

Applies to `src/` and its descendants, alongside the [root guidance](../AGENTS.md).
Use [ARCHITECTURE.md](../ARCHITECTURE.md) for the full technical context and
[app/books/AGENTS.md](app/books/AGENTS.md) for book-specific guidance.

## Angular structure

- Use standalone components with explicit template imports and `ChangeDetectionStrategy.OnPush`. Standalone is the
  Angular 20 default; omit redundant `standalone: true`. Bootstrap lives in [main.ts](main.ts), application providers
  in [app/app.config.ts](app/app.config.ts), and lazy component routes in [app/app.routes.ts](app/app.routes.ts). Keep
  the wildcard route last.
- Use `input()` and `output()` for component contracts, signals for synchronous local state, and `computed()` for
  derived values. Use `linkedSignal()` when writable state must reset with a source input, such as cover failure or
  map selection/camera state. Keep request/query observables where cancellation and timing matter.
- Prefer typed reactive forms for editable drafts and multi-field filters. Synchronize input changes explicitly through
  lifecycle hooks without emitting feedback loops. Native single-action controls may bind values and events directly.
  Inject services with `inject()`; keep constructor/field initialization free of external side effects.
- Preserve strict TypeScript and Angular template checking. Reuse typed models and avoid introducing `any`.
- Keep feature code inside its feature directory and put reusable, cross-feature services in `app/shared/`.
- Keep the larger routed book pages and root shell in separate HTML files. Small presentation components may use inline
  templates. Use `@if`, `@switch`, and `@for` consistently with stable ID tracking in feature templates.
- The configured application runs in the browser. NgRx, TanStack Query, and SSR packages are declared but unused; their
  presence is not an instruction to introduce stores, query infrastructure, or server rendering.

## Data access and lifecycle

- Keep HTTP request construction in injectable API services using Angular `HttpClient` and typed observables.
- Prefer the async pipe for observable view state and `switchMap` when new inputs should replace pending requests.
  Clean up imperative subscriptions, timers, and event listeners when their owner is destroyed.
- Keep loading, empty, and error states explicit. Catch recoverable request errors inside the request stream so future
  retries or input changes can still trigger requests.
- HTTP error reporting belongs to `httpErrorInterceptor`, with expected outcomes identified by request context. Local
  pages own retry/not-found UI. `GlobalErrorHandler` handles unexpected errors through the same deduplicating reporter.
  Avoid additional per-page logging or duplicate HTTP toasts.

## Styling and interaction

- Use Tailwind utilities and the existing responsive design. Global styles are in [styles.css](styles.css); the Material
  SCSS file currently customizes snackbar colors rather than supplying a complete Material theme.
- Prefer semantic Tailwind utilities (`bg-surface`, `text-secondary`, `border-divider`, etc.) backed by the light/dark
  palettes in `styles.css`. Reuse `button-primary`, `text-link`, and `focus-ring` interaction styles. Keep new shared color
  mappings in the palette rather than repeating `dark:` color pairs throughout templates.
- Keep theme ownership in `ThemeService`, explicitly initialized by `provideAppInitializer` in `app.config.ts`.
  Constructors should only inject dependencies or assemble pure state. The service applies the document-root `dark`
  class, reads/saves `bookmonkey-theme`, and defaults to the system preference without saving it as an explicit choice.
  Storage failures must not disable the switch.
- Reuse `LoadingIndicatorComponent` and `StateMessageComponent` for request feedback. Pages provide their own heading
  levels and action content; the shared components own layout and announcement semantics.
- Use native links for navigation and buttons for actions. Provide accessible names, keyboard support, visible focus,
  and meaningful status/error announcements. Preserve usability on narrow screens and in both themes.
- Match the existing English UI copy unless the task requests localization.
- Follow [.prettierrc](../.prettierrc): two spaces, single quotes, semicolons, no trailing commas, and a 120-character
  print width. Format only the files relevant to the task.
