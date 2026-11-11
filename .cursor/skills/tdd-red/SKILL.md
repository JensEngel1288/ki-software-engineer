---
name: tdd-red
description: Turn an agreed user story and Given/When/Then acceptance criteria into requirement-linked unit and UI tests, then verify that missing behavior fails before production implementation. Use for the Red phase after requirements interviewing or when explicitly asked for failing tests; creating this skill does not start feature testing.
---

# TDD Red phase

Make the definition of success executable before implementing the selected feature. Deliver tests, a scenario-to-test
mapping, and observed failure evidence. Keep production code unchanged throughout this phase.

## Load the selected requirement

Read the caller's story, acceptance criteria, constraints, and applicable `AGENTS.md` files. Accept a clear story supplied
directly by the user or another skill; a GitHub issue number is optional. If task identity, requirements, or later
corrections are missing, use [recover-context](../recover-context/SKILL.md) and resume from its returned brief.

When reusing `.cursor/context/current-requirement.md`, resolve it from the repository root and verify that its task and
status match the request. A completed brief is historical context, not a new Red-phase assignment. Do not reopen completed
features or overwrite another task's checkpoint just because that file exists.

Use the agreed story and stable requirement IDs from [interview-requirements](../interview-requirements/SKILL.md).
For materially ambiguous or draft outcomes, pass the known decisions and the specific gap to that skill, or ask one
focused question. Do not infer desired results from existing code or invent requirements to make a test fail.
Existing agreement and authorization remain valid; do not add a confirmation round for a sufficiently defined task.

## Map scenarios to test cases

For every Given/When/Then scenario, create at least one named test case and retain its requirement ID in the test title.
Treat a scenario's related `And` outcomes as assertions in the same case. If one requirement contains independent
scenarios, give them distinct case names under the same ID. Expand scenario examples into separately reported cases.

Build a compact mapping of scenario, test file/name, layer, and expected missing behavior. Choose layers by what they
verify:

- **Unit:** deterministic domain rules, transformations, validation, or service behavior. Use the repository's configured
  runner, such as Jasmine; test public behavior with focused inputs and observable results.
- **UI:** user-visible journeys, navigation, controls, and rendered outcomes. Use Playwright where configured, with
  accessible locators and assertions that reflect the acceptance criteria.
- Use both when a scenario has independently useful logic and UI coverage. Every scenario needs coverage, but do not
  duplicate a whole browser journey at every layer. Reuse existing cases that already cover a scenario and identify them
  in the mapping instead of creating copies.

Keep fixtures and expected values independent of the implementation. Cover the agreed alternatives and boundaries;
label additional suggested behavior as a proposal. Do not create unrelated edge cases or tests that merely mirror code.

## Scaffold tests using the repository's harness

Inspect package scripts, runner configuration, existing specs, fixtures, and test discovery before choosing paths and
commands. Read [test patterns](references/test-patterns.md) when scaffolding Jasmine or Playwright cases in BookMonkey.
Recheck the actual configuration rather than assuming the examples are current or that an installed package is configured.

Write runnable test bodies with real setup, an action, and expected outcomes, using Given/When/Then comments when helpful.
Use existing public entry points and documented contracts. Test files and test-only fixtures/helpers may change; do not
add production stubs, alter feature behavior, add UI selectors, or refactor application code to make the tests runnable.

For browser tests, isolate browser state and intercept external API/cover requests using existing fixtures. Stub external
boundaries, not the feature being tested. Model the agreed starting data without faking the required outcome. Use
Playwright's retrying assertions or the runner's supported clock tools rather than arbitrary sleeps.

If a necessary runner, browser, dependency, or public contract is unavailable, record the exact prerequisite and any
affected cases as **unverified/blocked**. Scaffold those cases where the intended contract is clear, but do not claim
they ran. Avoid silently introducing a new runner, installing dependencies, or changing tooling outside the authorized
scope. Continue independent cases that can run. A missing unit harness must not be misreported as a failing unit test.

## Run tests and verify Red

Run the smallest relevant existing baseline when practical, then execute the new or amended cases using the actual
repository commands. Confirm discovery and report all mapped cases, not only the first failure. Keep unaffected baseline
failures separate from newly observed failures.

Classify each result accurately:

- **Verified Red:** the app or unit harness ran and the assertion failed because the agreed behavior is absent or wrong.
  A required UI control being absent can establish Red when the app and prerequisite state loaded successfully.
- **Already Green:** the acceptance outcome already works. Keep useful coverage, report it, and do not break production
  code or change the expected outcome to manufacture failure. If all cases pass, no new Red behavior was established.
- **Unverified/blocked:** runner/browser startup, server/network setup, syntax, type errors, or missing imports prevent
  the behavior check. Correct test-owned mistakes and rerun; report remaining prerequisites separately from Red evidence.

Do not use unconditional failures, deliberately wrong expectations, `skip`, `todo`, Jasmine `pending`/`xit`, or
Playwright `test.fail()` as substitutes for an observed behavior failure. A future Green implementation must make these
ordinary tests pass without changing their accepted outcomes or removing an expected-failure marker.

## Preserve evidence and hand off

Return the requirement source, changed test paths, scenario mapping, exact run commands, and concise observed results.
For each failure, state the expected result, actual result, and why it points to missing behavior. Include green cases,
unverified cases, and genuine coverage gaps; do not call the whole suite verified Red when only part was exercised.

When a matching canonical requirement brief exists and writes are permitted, append or refresh a test-phase section with
this evidence and the next step. Preserve the agreed story, requirement IDs, task identity, and definition status. Red
completion does not mean the feature is complete. If there is no checkpoint, return the evidence to the caller rather
than creating a competing requirements source.

For an authorized implementation step, pass the brief, scenario mapping, failing test paths, commands, and observed
results to [tdd-green](../tdd-green/SKILL.md). It implements against the agreed expectations and verifies Green while
preserving tests except for demonstrated errors.

Stop at the Red handoff. Production implementation belongs to the next phase; resume it only when the user or calling
workflow has already authorized that transition. Leave legitimate failing tests enabled and visible, and do not commit
or publish them unless requested. Installing this skill only creates the workflow; it must not generate feature tests,
run the completed BookMonkey story, or replace the current requirement brief.
