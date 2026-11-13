# Angular refactoring standards

Read alongside the current [source guidance](../../../../src/AGENTS.md) and relevant nested guidance, including
[books guidance](../../../../src/app/books/AGENTS.md) for the book feature. [ARCHITECTURE.md](../../../../ARCHITECTURE.md)
describes the implementation; [REFACTORING.md](../../../../REFACTORING.md) contains historical findings whose status must
be checked against current code. Explicit user instructions take precedence over these conventions.

## Components and abstraction levels

- Keep one Angular component class per source file, following existing names and feature locations. Splitting a component
  class does not require moving every tiny type or pure helper into its own file.
- Preserve standalone components, explicit template imports, strict typing, and the current control-flow syntax.
  Do not introduce `any`, unsafe casts, or disabled template checks to make an extraction compile.
- Routed pages coordinate route/query state and commands. Presentation components receive focused data and emit meaningful
  actions; keep HTTP, storage, and global initialization out of them. Pure functions own deterministic transformations.
  Services own external effects or shared state when those responsibilities actually need that lifetime.
- Keep a method at one level of intent. A page-level operation can call named validation, projection, or persistence
  operations rather than mixing orchestration with storage serialization or URL construction. Avoid layers of helpers
  that only forward arguments and obscure the operation.
- Keep large routed-page templates in adjacent HTML files. Small presentation templates may remain inline; one component
  per file does not require one HTML file per component. Extract a cohesive interaction or repeated presentation, not
  arbitrary blocks chosen by a line-count target.
- Keep filtering, sorting, parsing, and complex transformations out of templates. Expose typed view state or derived
  values rather than repeatedly running expensive or effectful template methods. Simple bindings and event forwarding
  can remain local. Preserve heading structure, accessible names, keyboard behavior, focus, and responsive layouts.

## SOLID in this project

| Principle             | Refactoring decision                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single responsibility | Give each component, function, or service one cohesive reason to change; separate presentation from data access and effects.                             |
| Open/closed           | Extend real variation through focused composition and typed contracts; avoid a shared component with many unrelated mode flags.                          |
| Liskov substitution   | Preserve documented inputs, outputs, return types, state transitions, error behavior, and lifecycle contracts when replacing an implementation.          |
| Interface segregation | Keep inputs/outputs and service operations focused on what their consumers need; avoid a universal component or all-purpose service.                     |
| Dependency inversion  | Use Angular DI and existing injectable services/tokens at replaceable boundaries; introduce another interface/token only for a concrete dependency need. |

These principles do not mandate inheritance, a base component, an interface for every class, or new state infrastructure.
Use ordinary typed functions and existing services when they express the boundary clearly.

## Reactive composition and side effects

- Prefer a composed observable view-state stream consumed once through the async pipe. Combine source state explicitly;
  avoid nested subscriptions or separately mutated loading/data/error flags that can disagree. Retain typed request-state
  unions and distinguish successful empty results, loading, recoverable errors, and expected not-found outcomes.
- Choose operators by the existing semantics. Use `switchMap` for work superseded by newer inputs; do not use it to cancel
  commands that must finish. Preserve query timing, ordering, retry behavior, and immediate actions established by tests.
- Keep recoverable error handling inside the request branch so later inputs/retries still work. Preserve centralized
  reporting and page-owned recovery UI; extraction must not swallow failures or report the same error twice.
- Keep pure mapping free of effects. Put intentional effects at explicit command or initialization boundaries, or in a
  clearly owned effect stage. Avoid HTTP calls, subscriptions, DOM changes, or storage reads/writes during construction.
  Constructors and field initialization may inject dependencies or assemble lazy/pure state.
- Preserve explicit application startup initialization and its ownership. Moving an initializer to a component hook can
  alter lifetime or repeat effects on navigation, even when the screen initially looks the same.
- Prefer template subscription ownership. When an imperative subscription is necessary, use the project's supported
  destruction mechanism and clean up timers/listeners too. Check teardown when navigation changes component lifetime.
- Keep existing signals for suitable local synchronous state and observables for existing asynchronous flows. Do not
  maintain competing mutable copies of derived state or convert all state mechanisms as part of an unrelated cleanup.
- Share a cold stream only when multiple consumers require one execution; preserve cancellation, error recovery, and
  cache lifetime. Do not add `shareReplay` mechanically. Consider `OnPush` only where input/state updates support it.

## Reuse and project boundaries

- Extract repeated behavior with a shared meaning. Similar loading/cover/status UI may share a small component; different
  route request flows need not become a universal base class just because some operators look alike.
- Keep feature-specific code in its feature directory and genuinely cross-feature services in `app/shared/`. Preserve
  data-access clients, injected configuration, service scope, and typed domain models.
- Reuse existing semantic theme utilities and shared interaction styles. Preserve light/dark behavior and avoid repeated
  palette literals. Styling cleanup must retain native link/button semantics, focus visibility, and status announcements.
- Preserve the feature's API, storage, model, navigation, and validation contracts from nested guidance. In BookMonkey,
  browser-local edits must remain local and catalogue access remains read-only; refactoring cannot add synchronization.
- Existing NgRx, query, and SSR packages do not justify introducing them. Keep dependencies and lockfiles unchanged unless
  a separately authorized change requires otherwise.
- Reuse the validated editor fields for creation/editing with focused action inputs. Keep ID generation and persistence
  in the library service. Board columns share that service's statuses and ordering; filtered drag operations use stable
  ID anchors rather than treating visible indices as the full stored order.
- Project forms use `@angular/forms/signals`: typed model signals, schema validators, `FormField`, and `FormRoot` for
  submission. Let field directives own names/validation attributes; legacy `name` attributes on `[formField]` fail
  Angular 21's compiler. Reset field state when inputs change and keep synchronization silent. Characterize empty numeric
  fields, touched errors, Enter submission, cancel, and filter reset before changing these boundaries.
- Evaluate heavy optional interactions against build output. Defer the standalone reading board inside its selected-tab
  branch so CDK loads when needed; preserve loading/error feedback and test the real tab and drag interactions.

## Validation context

Use the current commands and suite selection in [root guidance](../../../../AGENTS.md), not a remembered passing count.
BookMonkey's application Playwright suites use API/cover fixtures; external demo tests do not establish app coverage.
The Jasmine/Karma scaffold is not an established unit harness at skill creation. Recheck its dependencies/specs before
claiming unit verification, and disclose omitted browser projects or environment limits. Keep machine-specific paths out
of committed runner configuration.

Inspect narrow-screen screenshots as well as overflow assertions: a native selector can fit the viewport while being
too cramped beside an action button. Keep labels and selected values usable in both themes.

For spatial UI, keep deterministic world layout/projection separate from camera events and presentation. Validate
rendered position/size changes and keyboard alternatives. Review a dense real catalogue as well as small fixtures:
halos and labels can crowd a scene even when every book remains discoverable. Use existing theme utilities for layout
before expanding component-style budgets to accommodate visual effects.
