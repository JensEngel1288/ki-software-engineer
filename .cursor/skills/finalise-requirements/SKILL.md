---
name: finalise-requirements
description: Reconcile an implemented feature with its original acceptance criteria, verify tests and build, update the matching GitHub issue, and report delivery evidence and completion status. Use after Green or optional refactoring when the user wants requirements finalisation and issue closure; installing this skill does not finalise an existing feature or mutate GitHub.
---

# Finalise requirements

Finish the requirements workflow with evidence that the agreed outcome was delivered. Reconcile each acceptance
scenario, verify the final implementation, update the selected issue when authorised, and return a completion summary
that distinguishes verified behavior, delivery state, and remote actions actually completed.

## Recover the requirement and delivery target

Read the caller's story, acceptance criteria, amendments, implementation handoff, and applicable `AGENTS.md` guidance.
Respect review-only or draft-only scope for production changes as well as remote actions.
Use [recover-context](../recover-context/SKILL.md) when task identity, original requirements, or the issue reference is
missing. Check the task identity and sources before reusing `.cursor/context/current-requirement.md`; a completed brief
may support an explicitly requested delivery audit without reopening implementation. Do not finalise a different task
because its checkpoint happens to be present.

Treat the original criteria plus explicit accepted amendments as the contract. Current code, test assertions, branch
names, or a passing Green summary cannot replace them. Preserve requirement IDs and distinguish accepted scope changes
from proposals. Ask one focused question only when a material conflict cannot be resolved from available sources.

Identify the required delivery boundary from the user and issue: for example, a working local feature, a published PR,
a merged change, or a deployment. Require the steps actually agreed, not a new release process. Record the real state
of the implementation, including the current revision and uncommitted changes; passing tests in a dirty workspace do
not prove that a remote commit, PR, or deployment contains those changes.

For an issue-backed task, verify the repository and exact issue by reading its current body, state, relevant comments,
and linked implementation evidence. A branch name supplies a candidate, not authority to close it. If the feature was
defined directly with no issue, continue local finalisation and mark the GitHub step not applicable; do not create an
issue just to complete the workflow. If an expected issue is inaccessible or ambiguous, finish independent verification
and identify the missing access or selector without pretending the remote step succeeded.

## Reconcile every acceptance scenario

Inspect the final diff, relevant production code, tests, and any Green/refactoring evidence. Build a compact traceability
table for every original scenario, including independent Given/When/Then cases grouped under a shared requirement ID:

| Criterion and source | Implementation evidence | Test or other verification | Result and remaining gap |
| -------------------- | ----------------------- | -------------------------- | ------------------------ |

Use results such as **verified**, **unmet**, **unverified**, or **explicitly superseded**. Superseded criteria need an
accepted amendment as evidence. Do not silently waive a criterion, infer coverage from a test title, or mark a requirement
verified merely because some tests pass. Non-code outcomes can use appropriate document or manual evidence rather than
an invented automated test. Label mocked integration, manual checks, and live verification accurately.

Check constraints as well as visible features: persistence/API boundaries, error states, navigation, accessibility, and
other outcomes actually agreed. Compare tests with the source criteria so a mistaken or weakened assertion cannot
silently redefine delivery. Preserve acceptance expectations and all meaningful scenario coverage.

When an unmet criterion falls within the existing implementation authorisation, continue through
[tdd-red](../tdd-red/SKILL.md) and [tdd-green](../tdd-green/SKILL.md) as appropriate, then resume finalisation. Do not stop
at a gap report when the authorised fix can be completed. Resolve genuine requirement decisions with the user instead
of inventing new scope. Refactoring through [angular-refactor](../angular-refactor/SKILL.md) is optional and must serve
the already selected work rather than becoming a new cleanup project.

## Verify the final implementation

Run the repository's required application tests and production build for the final state, plus formatting and other
required checks relevant to the change. Use [root guidance](../../../AGENTS.md) and the actual package/runner configuration
to select commands. Reuse passing results from the current workflow only when they cover the final source, tests,
configuration, and required environment; rerun affected checks after any relevant change. An explicit rerun request
requires a new run.

Record exact commands, scope, browser projects, discovered case counts, passes, failures, skips, and build results. A zero
exit status with no cases or skipped/expected-failure acceptance cases is not delivery evidence. Distinguish application
suites from external demo tests. In BookMonkey, recheck the incomplete Jasmine/Karma scaffold before claiming unit
verification; do not silently replace it with another runner or equate Chromium checks with all configured browsers.

Keep unavailable tooling, environmental failures, and pre-existing failures visible. Continue independent checks and
fix authorised regressions, but do not label required unverified checks as passing. Manual evidence may supplement
automation; it must not silently replace a required test or build. After all required checks pass, avoid repeating them
unless the implementation changes or a remaining concern warrants it.

## Prepare the delivery record

Update the matching canonical brief or designated completion record with the criterion table, actual verification,
delivery state, remaining limitations, and next step. Preserve the story, IDs, amendments, and Red/Green/refactoring
history. Keep implementation verification separate from issue-update/closure status, so partial remote success does not
erase a verified local result or falsely imply full delivery.

Prepare a concrete issue update before any remote write. Include the delivered behavior, verified criteria, exact
checks and scope, relevant implementation/report links, actual delivery boundary reached, and any remaining gap. Use
published GitHub links only when verified; local file paths and local test results are not remotely accessible artifacts.

Read [GitHub completion](references/github-completion.md) when an issue update or closure is in scope. An explicit
invocation to finalise the selected issue authorises this skill's completion update and closure once its conditions
are met, unless the user limited the request to review, verification, or a draft. Honour earlier authorisation without
asking again. If selected implicitly without authorisation for remote writes, finish the concrete verification and
draft first, then ask only for the missing remote action. Skill installation itself authorises no issue mutation.

Close as completed only when every in-scope criterion is verified, required checks pass, the agreed delivery boundary
has been reached, the issue identity is confirmed, and closure is authorised. Keep the issue open when those conditions
are unmet; publish a truthful progress update only if that action is authorised. Do not claim completion merely because
Green ran successfully, or commit, push, merge, deploy, or create another issue to force the delivery condition.

## Return the completion summary

Report the delivered outcome, criterion coverage and gaps, test/build results and limitations, actual delivery state,
and GitHub actions with verified issue/comment links. State whether the issue is closed, open, already closed, pending
access/authorisation, or not applicable. Report partial success precisely, such as an update posted but closure failed.
When this invoked skill authorises remote actions, name and link it in the final summary.

Mark the workflow completed only when its applicable required steps are finished. If implementation is verified but an
expected remote update remains pending, record those states separately and identify the remaining action. Refresh the
local record after remote actions with their confirmed URLs/state; never invent an issue, successful update, or closure.

Installing this skill creates only the workflow and references. It must not rerun or reopen the completed BookMonkey
feature, modify product code/tests, replace the current requirement brief, contact GitHub, or close any issue.
