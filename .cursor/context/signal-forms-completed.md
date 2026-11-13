# Migrate legacy Angular forms to Signal Forms

Task status: completed — verified Signal Forms migration
Source: user request on 2026-11-13: Replace all reactive or template form imports
with Signal Forms utilities.
Previous delivery: [Angular CLI 21 upgrade](angular-cli21-completed.md).

Migrate the shared create/edit book form, collection filters, and unrouted review
example from Reactive Forms/NgModel to the Signal Forms API already installed in
Angular 21.2.26. Preserve accepted UI behavior and keep packages unchanged. The
explicit all-imports request includes the review example's form binding; other
intentional review defects are outside this migration. Plain native single-action
controls that have no legacy forms imports do not require conversion.

Use the existing angular-refactor workflow: preserve Green behavior, characterize
important gaps before editing, migrate, and verify the complete application. This
is a technical refactoring, not authorization to invent new product behavior or
manufacture Red cases for already working outcomes.

## Acceptance and mapping

- SF1: Given the application sources, then no legacy `@angular/forms` imports,
  FormsModule/ReactiveFormsModule, FormGroup/FormControl, or ngModel/formControlName
  bindings remain. All three consumers use actual Signal Forms utilities. Verify
  with source search and strict production build.
- SF2: Given create/edit drafts, when values are invalid, touched, saved via Enter,
  or cancelled, then title/positive whole-page validation, feedback, trimming,
  independent drafts, routing, and browser persistence remain correct. Existing
  library cases plus a characterization for cleared pages and keyboard submit.
- SF3: Given filters, when fields change or numeric bounds are cleared/reset, then
  typed values, null bounds, range feedback, sorting, and matching remain correct.
  Parent input synchronization must not emit changes or loop. Existing list cases
  plus a characterization for clearing individual bounds.
- SF4: Given the whole application, then builds, all application Chromium cases,
  themes/mobile/Universe/board behavior, formatting, and guidance remain consistent.

The initial tree is clean. The preceding Angular 21 delivery verified all 57
unchanged browser cases and the production build; reuse that valid baseline and
run new characterization cases before source edits. Signal Forms types/source in
the installed package and versioned official docs determine the API, including
FormRoot, schema validation, field state, and reset semantics.

No dependency update, new harness, API mutation, issue, commit, or publication.
The SF2/SF3 characterizations passed before production changes (two cases,
5.7 seconds). The existing 57-case Angular 21 baseline remained applicable.

## Implementation and verification

The editor uses a typed independent draft signal, `form()` schemas, `FormField`,
and `FormRoot`. Required/nonblank title, positive whole pages, nullable cleared
numeric values, touched feedback, trimming, and duplicate submission guards are
preserved. Input changes reset the field tree; label/cancel changes do not wipe
the draft. The compiler identified old `name` attributes that conflict with
`FormField`; these were removed so the directive owns native control names.

Filters use a typed model signal and schema cross-field range validation. Events
bubble from native field bindings to their label-level output command, ensuring
current values are emitted. Input synchronization resets silently and Reset
filters emits once. No `valueChanges` subscription or effect bridge is needed.
The review example's search uses `form()`/`FormField`; other intentional defects
were not expanded into this refactor. Native controls without legacy imports
remain native. Packages and lockfile are unchanged.

| Criterion | Evidence                                                                                                      | Result   |
| --------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| SF1       | Source scan: three Signal Forms imports, no legacy forms imports/classes/bindings; strict templates compile   | Verified |
| SF2       | Existing library creation/edit/save/cancel/validation/persistence cases plus `[SF2]` touched/clear/Enter case | Verified |
| SF3       | Existing list sorting/filter/range/reset cases plus `[SF3]` clearing numeric bounds and parent updates        | Verified |
| SF4       | Full six-suite regression: 59 passed, zero failed/skipped/flaky; production build, formatting, docs/guidance  | Verified |

```powershell
# Characterizations before source edits: two passed
node node_modules/@playwright/test/cli.js test tests/library.spec.ts tests/book-list.spec.ts --grep "\[SF" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Final full application regression
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

npm run build
rg -n '@angular/forms|ReactiveFormsModule|FormsModule|FormGroup|FormControl|ngModel|formControlName|formGroup|ngSubmit' src
```

Final browser result: 59 passed in 53.3 seconds, exit 0, structured report errors
empty. Existing assertions/configuration were preserved; the two new cases are
additional behavior coverage. Production build passes with no budget warnings;
initial bundle 336.64 kB. The reference skill and scoped guidance now describe
Signal Forms, reset/event ownership, and compiler-owned names/attributes.

Limits: Chromium only, with mocked API/cover fixtures. Firefox/WebKit and the
incomplete Karma/Jasmine scaffold were not run. The unrouted example was checked
by source inspection and compilation, not added to product navigation for testing.
The pre-existing Playwright console diagnostic `step id not found: fixture@72`
also occurs in earlier suites; structured errors are empty and cases all pass.
Temporary configuration selects this machine's installed Chromium; committed
configuration has no machine-specific executable path. Session results are in
ignored `tmp/signal-forms-final-results.json`.

Delivery is local working-tree changes. No issue, commit, push, or deployment was
requested. Final checks cover changed-file Prettier, relative links, legacy-import
absence, and `git diff --check`. Signal Forms uses the installed Angular 21.2.26
API and its [versioned form documentation](https://v21.angular.dev/api/forms/signals/form).
