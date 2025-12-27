# Create PR or Commit

## Overview

Create well-structured pull requests or commits following best practices, with proper descriptions, meaningful commit separation, and knowledge capture.

**Prerequisite:** Always run the code review checklist first (`.cursor/commands/code-review-checklist.md`) before creating commits or PRs.

## Usage

- Default: Creates a PR (recommended for most changes)
- Override: Use `--commit` argument to create a commit only
- Big changes: Automatically separates file changes into meaningful commits

## Steps

### 0. Code Review (Required First Step)

**Before proceeding, complete a code review using the code review checklist:**

- Follow `.cursor/commands/code-review-checklist.md`
- Review all changed files for:
  - Functionality: Does code work correctly? Edge cases handled?
  - Code Quality: Readable, well-structured, follows conventions?
  - Security: No vulnerabilities, proper input validation?
- Fix any issues identified during review
- Only proceed to commit/PR creation after code review passes

**For AI assistants:**

- Use: "Follow the code-review-checklist command first"
- Review code systematically using the checklist
- Document any issues found and ensure they're fixed

### 1. Pre-commit Analysis

- Review all changed files
- Identify logical groupings of changes
- Determine if changes should be split into multiple commits
- Check for test/debug code that needs cleanup

### 2. Prepare Changes

**For big changes, separate into meaningful commits:**

- Group related file changes together
- Each commit should represent a complete, logical change
- Order commits from foundational to feature-specific
- Example groupings:
  - Database schema changes
  - API route changes
  - Component updates
  - Test updates
  - Documentation

**Clean up before committing:**

- Remove any test/debug code (should be done in code review)
- Remove console.logs and temporary comments (should be done in code review)
- Ensure code follows project conventions (should be verified in code review)
- Run linter and fix any issues (should be verified in code review)

### 3. Write Commit Messages

Follow the commit message template structure:

```
<type>: <subject> (max 72 chars)

Why:

* Reason 1 for the change
* Reason 2 if applicable

This change:

* What the change does (bullet point 1)
* What the change does (bullet point 2)

Note:
- Any important notes or considerations
- Keep line length at 80 characters for detailed sections
```

**Commit types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `style`: Code style changes (formatting, etc.)

**Subject line guidelines:**

- Use imperative mood ("Add feature" not "Added feature")
- Keep under 72 characters
- Be specific and descriptive
- Start with lowercase (unless it's a proper noun)

### 4. Create Commits

**For single logical change:**

- Create one commit with all related changes
- Use the commit message template

**For big changes:**

- Create multiple commits, each with a focused message
- Each commit should be independently reviewable
- Use `git add -p` or selective staging to group files

### 5. Push and Create PR (if not --commit)

**Prepare branch:**

- Ensure all changes are committed
- Push branch to remote: `git push origin <branch-name>`
- Verify branch is up to date with main: `git fetch origin && git rebase origin/main` (if needed)

**Write PR description:**

Use this structure:

```markdown
## Overview

Brief summary of what this PR does and why.

## Changes

- Change 1: Description
- Change 2: Description
- Change 3: Description

## Context

Why this change was needed. Link to related issues if applicable.

## Breaking Changes

List any breaking changes, or "None" if none.

## Testing

- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Tested in [browser/environment]
```

**Set up PR:**

- Create PR with descriptive title (follows commit message format)
- Link related issues using keywords: `Fixes #123`, `Closes #456`, `Related to #789`
- Add appropriate labels
- Request reviewers if needed

### 6. PR Checklist

Use this checklist in the PR description. Note: Most items should already be verified in the code review step (step 0).

```markdown
## Checklist

- [ ] Code review completed (see code-review-checklist.md)
- [ ] Code follows project conventions
- [ ] Tests added/updated and passing
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or breaking changes documented)
- [ ] Manual testing completed
- [ ] Linter passes with no errors
- [ ] TypeScript/types are correct
- [ ] No console.logs or debug code
- [ ] Screenshots added (if UI changes)
```

**Note:** The code review checklist (`.cursor/commands/code-review-checklist.md`) covers:

- Functionality checks
- Code quality checks
- Security checks

The PR checklist above focuses on PR-specific items and serves as a final verification.

### 7. End of Session: Capture Learnings

**After completing the feature/change:**

1. **Documentation:**

   - Write a short, high-level description of the feature
   - Store in a README file in the feature's directory (if applicable)
   - If README exists, update it with new information

2. **Production Readiness Check:**

   - Analyze the implementation
   - Consider if anything else needs to be done for production readiness
   - Clean up any test/debug code
   - Verify all edge cases are handled

3. **Knowledge Capture:**

   Ask yourself (or have AI assistant answer):

   > What did you learn in this session that, if you had known earlier, would have let you complete the task faster?

   **For AI assistants (Cursor/Claude):**

   After getting the answer, take learnings that could help future sessions:

   - Condense the learnings into actionable insights
   - Add them to relevant documentation files:
     - `AGENTS.md` for agent-specific patterns
     - `README.md` for general project knowledge
     - Feature-specific docs for domain knowledge
     - `docs/` directory for architectural decisions

   **Example learning format:**

   ```markdown
   ## Learnings from [Feature Name]

   - Pattern: When doing X, always remember to Y
   - Gotcha: The API endpoint Z requires authentication even for GET requests
   - Best practice: Use pattern matching for SWR cache invalidation
   ```

4. **Final Steps:**
   - If ready: commit, push, and create PR (if not already done)
   - If not ready: document what's remaining in PR description or issue

## Working with Cursor and Claude

**For Cursor:**

- This command can be executed step-by-step
- Use Cursor's chat to guide through each step
- Cursor can help write commit messages and PR descriptions
- Use Cursor's git integration to stage and commit files

**For Claude:**

- Reference this command file when asking Claude to help with PRs/commits
- Claude can follow the structure and templates provided
- Use Claude to help with knowledge capture and documentation
- Claude can review code and suggest commit groupings

**Best Practice:**

- Both assistants can read and follow this command file
- Use consistent language: "Follow the create-pr-or-commit command"
- Update this file as you discover better patterns

## Examples

**Example 1: Simple feature (single commit)**

```
feat: add alphabetical sorting to contacts list

Why:

* Users requested contacts sorted by first name for easier scanning
* Matches UI display order (first name appears first)

This change:

* Add client-side sorting by firstName, then lastName
* Update contacts-client.tsx to sort before rendering

Note:
- Server-side sorting already exists but client-side ensures consistency
```

**Example 2: Big change (multiple commits)**

```
Commit 1: feat: add sorting to companies API endpoint
Commit 2: fix: refresh contacts list after creating new contact
Commit 3: fix: deduplicate contacts in company detail view
Commit 4: refactor: add client-side sorting to list views
```

## Workflow Summary

**Standard workflow:**

1. Complete code review (`.cursor/commands/code-review-checklist.md`)
2. Fix any issues found in code review
3. Follow this command to create commits/PR
4. Capture learnings at end of session

**For AI assistants:**

- Always start with: "Follow the code-review-checklist command"
- Then proceed with: "Follow the create-pr-or-commit command"
- This ensures quality before committing

## Tips

- **Review first**: Always complete code review before committing
- **Commit often**: Small, focused commits are easier to review
- **Write clear messages**: Future you (and reviewers) will thank you
- **Link issues**: Use GitHub keywords to auto-link issues
- **Capture learnings**: Build institutional knowledge over time
