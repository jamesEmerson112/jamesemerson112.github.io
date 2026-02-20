---
name: triple-pass-plan-implementation
description: Execute the latest approved implementation plan in exactly three coding passes to enhance quality and refactor safely. Use when a user asks for multi-pass implementation, iterative enhancement, or staged refactoring of the most recent plan without changing scope.
---

# Triple Pass Plan Implementation

## Workflow

1. Identify plan baseline.
- Locate the latest plan in this priority order:
  1) explicit plan in the current thread;
  2) active plan steps;
  3) latest roadmap/backlog item in the repository.
- Resolve conflicts by selecting the most recent user-approved plan and state the assumption.
- Translate the selected plan into a concrete acceptance checklist.

2. Set pass contract.
- Freeze scope to the acceptance checklist.
- Define verification for each pass before coding (tests, lint, build, or manual checks).
- Create a running work log with sections `Pass 1`, `Pass 2`, and `Pass 3`.

3. Execute Pass 1 (baseline implementation).
- Implement minimally complete behavior for all checklist items.
- Prefer direct, readable code over optimization.
- Run verification and fix correctness regressions.
- Record what is complete and what remains weak.

4. Execute Pass 2 (enhancement).
- Improve robustness, edge-case handling, test coverage, and usability without expanding scope.
- Reduce technical debt introduced in Pass 1.
- Re-run verification and compare results with Pass 1.
- Record measurable improvements.

5. Execute Pass 3 (refactor and hardening).
- Refactor for maintainability by simplifying structure, removing duplication, and improving naming/module boundaries.
- Optimize only when it improves clarity or resolves a validated hotspot.
- Add focused comments or docs only for non-obvious behavior.
- Run full verification and confirm no behavioral regression.

6. Report outcome.
- Summarize each pass with implemented items, checks run, notable refactors, and remaining risks.
- Call out any skipped verification and the reason.

## Guardrails

- Run exactly three passes unless the user explicitly requests a different count.
- Avoid introducing net-new features outside the selected plan.
- Keep changes reviewable and avoid unrelated rewrites.
- Pause and ask focused questions when blocked by missing requirements or environment failures.

## Trigger Examples

- "Implement the latest plan in three rounds."
- "Do a baseline build, then improve and refactor in two more passes."
- "Run a strict 3-pass implementation of this roadmap item."
