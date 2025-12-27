# Documentation Strategy

This document defines where different types of documentation should live in the codebase and when to create them.

## Documentation Locations

The codebase uses several documentation locations, each serving a specific purpose:

- **`README.md`**: Project overview, getting started, feature list, deployment
- **`AGENTS.md`**: Agent-specific patterns, gotchas, best practices, common pitfalls
- **`docs/features/{feature-name}/README.md`**: All feature documentation (unified location)
- **`docs/DESIGN_SYSTEM.md`**: Design system documentation
- **`docs/COSMOS.md`**: React Cosmos tooling documentation
- **`docs/adr/`**: Architecture Decision Records (formal decisions with context)
- **`.cursor/commands/`**: Workflow commands and checklists

## Documentation Types and Locations

### Agent Patterns & Best Practices → `AGENTS.md`

**When to use:**

- Reusable patterns that apply across multiple features
- Gotchas that are easy to miss
- Best practices that prevent bugs
- Common pitfalls and their fixes

**Threshold:** Must be both **non-obvious** AND **reusable** across multiple features

**Examples:**

- "Use predicate functions for SWR cache invalidation"
- "Server sorting must match client display order"
- "Extract shared types to prevent inconsistencies"

**What NOT to put here:**

- Obvious patterns (e.g., "use TypeScript types")
- Feature-specific implementation details
- One-off solutions

### Feature Documentation → `docs/features/{feature-name}/README.md`

**When to use:**

- Complex features with non-trivial implementation details
- Features with multiple components and interactions
- Features with non-obvious data flows
- Features with extension points (adding columns, statuses, etc.)
- Cross-cutting features that span multiple directories (API + DB + UI + components)

**Where:** `docs/features/{feature-name}/README.md` (always)

**Threshold:** Only for **complex features** that need implementation context

**Examples:**

- `docs/features/kanban/README.md` - Kanban board (drag-and-drop, DnD implementation, data flow)
- `docs/features/activity-events/README.md` - Activity events (SSE, real-time updates, architecture)

**What to include:**

- Overview of what the feature does
- Component architecture and data flow
- Key concepts and patterns specific to this feature
- How to extend (add columns, statuses, etc.)
- List of key files and their purpose (with full paths)

**Additional deep-dive files:**

- Can have separate files in the same folder (e.g., `docs/features/activity-events/schema.md`)
- Use descriptive names: `schema.md`, `architecture.md`, `api.md`, `components.md`

**Feature README Template:**

```markdown
# [Feature Name]

Brief overview of what the feature does.

## Overview

High-level description

## Architecture

Component structure, data flow

## Key Concepts

Important patterns, gotchas specific to this feature

## Extending

How to add new [columns/statuses/etc.]

## Files

List of key files and their purpose (with full paths)
```

**Benefits of unified location:**

- Agents always know where to look (`docs/features/`)
- No confusion about component folder vs docs folder
- All feature docs in one place
- Version controlled (not in gitignored `.claude/`)

### Tooling Documentation → `docs/`

**When to use:**

- System-level documentation (not feature-specific)
- Tooling and setup documentation
- Design system documentation

**Examples:**

- `docs/DESIGN_SYSTEM.md` - Design system (colors, typography, components)
- `docs/COSMOS.md` - React Cosmos tooling documentation

**Naming:** PascalCase for tooling docs (e.g., `DESIGN_SYSTEM.md`, `COSMOS.md`)

### Architecture Decisions → `docs/adr/`

**When to use:**

- Significant architectural decisions with trade-offs
- Decisions that affect the entire codebase
- Decisions that future developers need to understand

**What to include:**

- Context (why the decision was needed)
- Decision (what was chosen)
- Alternatives considered
- Consequences (positive and negative)

**Example:** `docs/adr/0001-adopt-pnpm-and-harden-node-supply-chain.md`

### Project Overview → `README.md`

**When to use:**

- High-level project information
- Getting started guide
- Feature overview
- Deployment instructions
- API overview

## Learning Capture Guidelines

**Critical Rule:** Only capture learnings that are:

1. **Non-obvious** - Not immediately apparent from reading code
2. **Reusable** - Apply to multiple features or future work
3. **Time-saving** - Would have saved significant time if known earlier

### Decision Process

Before documenting a learning, ask:

1. **Is this non-obvious?**

   - If no → don't document
   - If yes → continue

2. **Is this reusable across features?**

   - If no → feature README (if complex feature) or skip
   - If yes → continue

3. **Would this have saved time if known earlier?**
   - If no → skip
   - If yes → document in appropriate location

### What TO Document

- Gotchas that are easy to miss
- Patterns that prevent bugs
- Non-obvious best practices
- Reusable patterns across features

**Examples:**

- "Server sorting must match client display order to avoid confusion"
- "Extract shared types to prevent type inconsistencies"
- "Use predicate functions for SWR cache invalidation to refresh all related endpoints"

### What NOT to Document

- Obvious patterns (e.g., "use TypeScript types")
- Feature-specific implementation details (goes in feature README)
- One-off solutions that won't be reused
- Things that are clear from reading the code

### Where to Document Learnings

- **Reusable patterns/gotchas** → `AGENTS.md`
- **Feature-specific learnings** → `docs/features/{feature-name}/README.md` (if complex feature)
- **Architecture decisions** → `docs/adr/` (if significant)

## Feature Documentation Decision Tree

```
Is the feature complex with non-trivial implementation?
├─ NO → No feature doc needed
└─ YES → Does it have:
    ├─ Multiple components with interactions?
    ├─ Non-obvious data flows?
    ├─ Extension points (adding columns, statuses, etc.)?
    ├─ Complex state management?
    └─ If any YES → Create docs/features/{feature-name}/README.md
```

**Note:** All feature docs go in `docs/features/` - no component-level READMEs. This ensures agents always know where to look.

## Best Practices

1. **Keep it concise** - Documentation should be just enough, not overwhelming
2. **Update as you go** - Don't let documentation get stale
3. **Link between docs** - Reference related documentation
4. **Use examples** - Show, don't just tell
5. **Review periodically** - Remove outdated information

## References

- See `AGENTS.md` for agent-specific patterns
- See `.cursor/commands/create-pr-or-commit.md` for learning capture workflow
- See `docs/adr/` for architecture decisions
- See `docs/features/` for all feature documentation
- See `docs/DESIGN_SYSTEM.md` for design system documentation
- See `docs/COSMOS.md` for React Cosmos tooling
