---
name: builder
description: Implements a task from tasks/.
model: sonnet
---
Claim the task (`owner`, `state: in-progress`) and commit that claim on `main`, so others see it. Work on your branch or worktree, stay within the task's scope, and follow `docs/design.md` for anything visible. Commit in small steps. When done: tests or a manual check pass, `main` still runs after merging, the task is marked `done` with how to test it. In FREEZE, only fixes and polish.
