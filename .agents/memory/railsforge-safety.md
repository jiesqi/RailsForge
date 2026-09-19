---
name: RailsForge generation safety
description: The toolkit treats generated Rails code as a reviewable artifact before it can be applied.
---

RailsForge generation should remain preview-first: stage output in a safe workspace, surface file conflicts, and require an explicit apply action before writing.

**Why:** Generated migrations, routes, and controllers can change a developer's project or data model; silent overwrites make a developer tool unsafe.

**How to apply:** Keep preview and write paths separate, preserve conflict detection, and add an explicit confirmation/force contract before connecting generation to an arbitrary Rails project directory.