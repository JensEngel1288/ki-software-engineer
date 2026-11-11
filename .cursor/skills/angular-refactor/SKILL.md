---
name: angular-refactor
description: Refactor Angular components after Green using project conventions, practical SOLID principles, one component per file, consistent abstraction levels, and reactive composition while preserving tested behavior. Use for the Refactor phase after tdd-green or an explicitly requested Angular cleanup; creating this skill does not refactor the application.
---

# Angular Refactor phase

Improve the structure of an already working implementation while preserving its accepted behavior. Deliver a focused
refactoring, passing regression evidence, and a clear explanation of the responsibility or duplication improved.

## Establish scope and the Green baseline

Read the caller's selected files or Green handoff, original acceptance criteria, constraints, and validation evidence.
Read the applicable [root guidance](../../../AGENTS.md), [source guidance](../../../src/AGENTS.md), and nested feature
guidance. Inspect the current working tree and preserve unrelated changes, including untracked files.

Use [recover-context](../recover-context/SKILL.md) when the intended behavior or selected task is missing. Check task
identity before reusing `.cursor/context/current-requirement.md`. An explicitly requested cleanup may target a completed
feature: use its accepted behavior as invariants without reopening feature implementation or changing its requirements.
A historical brief or old findings document alone does not authorize refactoring the entire application.

Read [project standards](references/project-standards.md) before selecting Angular structural changes. Confirm findings
against the current source; `REFACTORING.md` preserves historical proposals as well as completed work. Choose a small
set of concrete improvements tied to the selected code, rather than applying every recommendation mechanically.

Record baseline test assets, case coverage, and relevant public contracts before editing, including untracked specs.
Reuse Green evidence only when it applies to the current source, tests, and configuration; otherwise run the affected
tests first. If behavior fails, distinguish existing failures from harness problems. Use [tdd-green](../tdd-green/SKILL.md)
for an already authorized behavior fix; do not disguise a feature change as refactoring. Continue independently
verifiable cleanup where appropriate and report unresolved baseline limitations.

## Refactor responsibilities and composition

For each proposed extraction or simplification, identify its current problem, intended owner, and behavior that must
remain unchanged. Apply the standards reference to:

- Keep one component per source file and cohesive component inputs/outputs.
- Separate page orchestration, presentation, pure transformations, and external side effects at meaningful boundaries.
- Keep each method and template at a consistent abstraction level, using named operations to express lower-level work.
- Compose observable state and user events with the correct cancellation, recovery, and teardown behavior.
- Remove demonstrated duplication through small, focused components, functions, or services.

Apply SOLID as a way to evaluate responsibilities and contracts, not as a requirement to add interfaces, inheritance,
facades, or layers. Prefer a direct local helper over a new abstraction when it solves the actual problem. Leave code
alone when another extraction would add indirection without a concrete maintenance benefit.

Make small, reviewable changes and run affected checks after a meaningful structural step. Preserve public contracts,
observable state transitions, effect ownership, initialization order, accessibility, and relevant timing. Update imports,
standalone template dependencies, and file references when moving code. Avoid framework migrations, new dependencies,
blanket signals conversions, or unrelated formatting.

## Keep the behavior contract intact

Keep acceptance assertions, fixtures, and scenario coverage intact. Mechanical test import changes are appropriate when
source files move, but must not change expected outcomes or discovery. If an important behavior lacks coverage, add a
focused characterization through an available harness before changing that boundary. Do not add tests that merely
mirror the new private structure or introduce another runner just for this cleanup.

If a test fails after a change, investigate the refactoring first. Fix the regression without relaxing assertions,
removing cases, adding skips/expected failures, updating snapshots to accept an unintended change, or increasing retries
to conceal a deterministic failure. Document any demonstrable test error separately and retain the accepted behavior.
New desired behavior belongs in a requirements/Red-Green cycle, not this phase.

## Verify and hand off

Run the relevant complete application regression suites, `npm run build` for source changes, and formatting checks on
touched files. Check test discovery, case counts, skips, failures, and exit status against the baseline. Include UI checks
when template boundaries or interactions change; include timing, retry, and teardown checks when reactive composition
changes. Use configured unit tests where available and disclose unavailable harnesses instead of claiming coverage.

Compare the final diff with the selected scope. Explain test-owned changes, confirm there are no incidental behavior or
dependency changes, and update [architecture](../../../ARCHITECTURE.md) when documented boundaries or ownership change.
Update scoped guidance only when conventions changed; do not rewrite historical findings as current defects.

Return the selected improvements and their purpose, affected files, behavior preserved, exact validation commands and
results, and any verification limits. When a matching canonical brief exists, append refactoring evidence while
preserving requirement IDs, definition status, and Red/Green history. Keep the feature's completion status accurate;
do not reopen a completed feature merely to record cleanup, or mark it complete while required work remains.

For a requested delivery/issue-completion step, pass the original criteria, final diff, and verification evidence to
[finalise-requirements](../finalise-requirements/SKILL.md). It reconciles the final implementation with the accepted
requirements and handles authorised issue updates/closure after verification.

Stop when the selected improvements are complete and required checks pass. Do not commit, publish, or expand into an
unrelated cleanup without authorization. Installing this skill creates only the workflow and its guidance; it must not
change product code, generate feature tests, replace the requirement brief, or automatically run the completed feature.
