# Setup New Feature: $ARGUMENTS

You are helping set up a new feature. Be actionable and thorough.

## Step 1: Clarify Requirements

Ask 2-3 focused questions to understand:

- The core problem being solved
- Key acceptance criteria
- Any constraints or preferences

Keep it brief - don't over-question.

## Step 2: Explore the Codebase

Use the Explore agent to investigate:

- Similar features we can learn from
- Existing patterns and conventions
- Database schema and API patterns
- UI component library and design system

**Important:** Note both good patterns to follow AND bad patterns to avoid or improve. If you find inconsistencies, tech debt, or anti-patterns, flag them and suggest better approaches rather than blindly copying.

## Step 3: Create Plan File

Write a detailed implementation plan to `../plans/{project-name}-{feature-name}.md` containing:

```markdown
# Feature: {name}

## Summary

{One paragraph description}

## Requirements

- {Bullet list of acceptance criteria}

## Technical Approach

### Data Model

{Schema changes, new tables/columns}

### API Endpoints

{Routes, methods, request/response shapes}

### UI Components

{Component hierarchy and responsibilities}

### Patterns to Follow

{Good patterns found in codebase}

### Improvements Over Existing Code

{Bad patterns to avoid, suggested improvements}

## Implementation Steps

{Numbered list of concrete tasks}

## Testing Strategy

{What to test and how}
```

## Step 4: Get Approval

Present the plan summary and ask for approval before proceeding.

## Step 5: Set Up Feature Branch

After approval:

1. Create branch: `git checkout -b feature/{feature-name}`
2. Add any new dependencies if needed
3. Create the todo list from the implementation steps

## Step 6: Begin Implementation

Enter plan mode with the approved plan and start implementing.

---

Start by asking clarifying questions about "$ARGUMENTS".
