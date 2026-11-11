---
name: interview-requirements
description: Interview the user one question at a time to turn a rough feature idea into a user story, Given/When/Then acceptance criteria, scope, constraints, and technical notes. Use when the user wants structured requirements and a shared definition of success before tests or implementation, rather than recovery of an already agreed specification.
---

# Interview requirements

Build a shared definition of success through a short, adaptive conversation. The deliverable is a source-backed user
story with testable acceptance criteria and technical notes, suitable for handoff to tests, implementation, or refactoring.

## Start with what is known

Read the user's idea, available conversation, applicable `AGENTS.md` guidance, and any explicitly referenced brief or issue.
If `.cursor/context/current-requirement.md` exists, resolve it from the repository root and check its task identity and
status before reusing it. Preserve confirmed answers and later corrections instead of starting the interview again.

Use [recover-context](../recover-context/SKILL.md) only when earlier agreed requirements or the selected task were lost.
For a genuinely new idea, start the interview directly. When recovery hands off an incomplete definition, continue from
its known decisions and open questions; do not send the same unanswered question back through recovery.

Inspect repository context read-only as needed to learn existing capabilities and technical constraints. Do not ask the
user for facts the repository can establish, or infer desired behavior from the current implementation. A GitHub issue
number is not required to interview a user about a new feature.

## Ask one focused question at a time

Ask the next question that most reduces uncertainty about the desired outcome. Use the environment's question tool when
available, or ask directly in chat. Wait for the user's actual answer before advancing to the next dependent question.
Do not send a full questionnaire, answer your own questions, or treat silence as agreement. Offer a few concrete choices
when they help, while leaving room for the user's own answer.

Start with the goal or actor if those are unknown; for example, “What should this feature help the user accomplish?”
Then cover only the gaps that matter:

- **Goal and actor:** intended user, problem to solve, and observable benefit or success signal.
- **Core behavior:** starting situation, user action or system event, and expected result. Clarify what changes from today.
- **Scope and priority:** the smallest useful first version, explicit exclusions, and what can wait.
- **Constraints:** relevant platform, data, integration, accessibility, time, or operational limits. Separate genuine
  requirements from implementation preferences.
- **Important alternatives:** relevant empty, failure, permission, persistence, or other boundary behavior. Ask about cases
  that could materially change the story; avoid a checklist of unrelated hypothetical risks.

After an answer, briefly reflect any consequential decision and ask the next unresolved question. Reuse information the
user volunteers even when it answers a later topic. Treat follow-ups as amendments unless the user clearly changes tasks.
If an idea contains independent actors or outcomes, suggest a story split and establish which first slice to define.

Do not prescribe a fixed number of rounds. Finish when the goal, scope, material constraints, and observable outcomes are
clear enough to draft. If the user asks for a draft earlier, provide it with unresolved decisions identified. When the
user delegates a choice, make a reasonable proposal within the stated scope and label that choice explicitly.

## Produce the user story and definition of success

Return a concise document with these sections, omitting inapplicable detail rather than inventing it:

1. **Title, task status, and definition status.** Use the same task statuses as context recovery: active, completed, or
   needs clarification. Separately label the definition draft or agreed. Record sources as the relevant user answers,
   amendments, requirement paths, or verified issue links.
2. **Goal and user story.** State the user benefit, followed by “As a [actor], I want [capability], so that [benefit].”
   Retain the user's intent rather than describing an implementation mechanism as the benefit.
3. **Scope and constraints.** List agreed inclusions, exclusions, priorities, and constraints. Distinguish existing project
   constraints from decisions made during the interview.
4. **Acceptance criteria.** Assign stable IDs such as `R1` to independently verifiable scenarios. Preserve IDs for unchanged
   requirements from an existing brief. Write each scenario as:

   ```text
   R1 — Scenario title
   Given [the relevant starting condition]
   When [one meaningful user action or system event occurs]
   Then [the observable expected result]
   And [a related observable result, if needed]
   ```

   Include the primary success scenario and the material alternatives established in the interview. Avoid vague outcomes
   such as “works correctly,” invented numeric targets, or technical internals unless they are explicit requirements.
   Trace criteria to answers or accepted sources; clearly label proposed criteria that still need a decision.

5. **Technical notes.** Separate confirmed repository facts and constraints from suggested implementation approaches.
   Identify relevant integration points, data changes, dependencies, and a validation outline mapped to requirement IDs.
   Mark unverified technical assumptions; do not invent API contracts or present a suggested design as agreed scope.
6. **Open questions and handoff.** Identify genuine unresolved decisions, their effect on readiness, and the next authorized
   workflow step. Distinguish blockers from optional refinements. This defines what success means for subsequent work.

Present the concrete draft for correction. Ask one focused follow-up if a material decision remains. Mark the definition
agreed only when the user's answers or response to the draft actually establish agreement; silence is not confirmation.
Existing agreement and authorization remain valid, so do not add a second approval round just for ceremony.

## Preserve context and hand off

When local writes are permitted and the selected task is clear, save or refresh the story and brief in
`.cursor/context/current-requirement.md`. Use an existing designated task file instead when the repository has one, and
retain a pointer so recovery has one canonical source. Keep draft/agreed status, sources, stable requirement IDs, and open
questions together. Do not replace a different task's brief without clear task selection.

Pass the brief or its canonical path to the calling agent or skill. Tests should verify these acceptance criteria, and
implementation and refactoring should serve or preserve them. If the interview pauses or context is lost, hand recovery
the known answers and the next unanswered question so the user is not interviewed twice.

When the next authorized step is test generation before implementation, hand the agreed story, acceptance criteria, and
canonical path to [tdd-red](../tdd-red/SKILL.md). It creates scenario-linked unit/UI tests and records observed Red
failures before production changes; a missing runner is reported separately from a behavior failure.

Complete the requirements deliverable before transitioning to execution. Creating this definition does not itself
authorize product code, test implementation, issue publication, or external updates. Resume an explicitly authorized next
phase when its requirements are sufficiently clear; ask only about decisions still needed for dependent work.
When installing this skill, create the workflow without seeding a live feature brief or starting an unrelated interview.
