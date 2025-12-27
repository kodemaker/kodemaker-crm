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

- **Use GitHub CLI to create PR**: Run `gh pr create --title "..." --body "..."` with the PR description
- Create PR with descriptive title (follows commit message format)
- Link related issues using keywords: `Fixes #123`, `Closes #456`, `Related to #789`
- Add appropriate labels
- Request reviewers if needed
- **Provide the PR link**: After creating the PR, share the GitHub URL with the user

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

**IMPORTANT: This step is REQUIRED and should be done automatically after creating the PR.**

**After completing the feature/change and creating the PR:**

1. **Documentation:**

   - Write a short, high-level description of the feature
   - Store in `docs/features/{feature-name}/README.md` (if complex feature)
   - If feature doc exists, update it with new information
   - See `docs/DOCUMENTATION_STRATEGY.md` for when to create feature docs

2. **Production Readiness Check:**

   - Analyze the implementation
   - Consider if anything else needs to be done for production readiness
   - Clean up any test/debug code
   - Verify all edge cases are handled

3. **Knowledge Capture:**

   **IMPORTANT:** Most sessions won't have learnings worth documenting. That's expected and fine.

   **For AI assistants (Cursor/Claude):**

   **This step is MANDATORY - do not skip it.** After creating the PR, evaluate learnings:

   **Step 1: Evaluate Learnings**

   Ask yourself: "What did I learn in this session that, if I had known earlier, would have let me complete the task faster?"

   For each potential learning, evaluate using this decision process:

   1. **Is this non-obvious?** (Not immediately apparent from reading code)

      - If no → don't document
      - If yes → continue

   2. **Is this reusable across features?** (Applies to multiple features or future work)

      - If no → `docs/features/{feature-name}/README.md` (if complex feature) or skip
      - If yes → continue

   3. **Would this have saved time if known earlier?** (Prevents bugs, avoids mistakes)
      - If no → skip
      - If yes → document in appropriate location

   **Step 2: Present Evaluation to User**

   Always present your evaluation to the user before documenting:

   ```
   Evaluated learnings from this session:
   - [Learning 1]: [Brief description] → [Decision: document in AGENTS.md / docs/features/{feature}/README.md / skip]
   - [Learning 2]: [Brief description] → [Decision: document / skip]
   - [Summary]: [X] learnings to document, [Y] skipped (not non-obvious/reusable/time-saving)
   ```

   If no learnings meet the criteria, state clearly:

   ```
   Evaluated learnings: Nothing important to document
   - All learnings were either obvious, feature-specific, or not time-saving
   ```

   **Step 3: Document (if approved)**

   Only after user review, document learnings in appropriate locations:

   - **Reusable patterns/gotchas** → `AGENTS.md` (must be non-obvious AND reusable)
   - **Feature-specific learnings** → `docs/features/{feature-name}/README.md` (if complex feature)
   - **Architecture decisions** → `docs/adr/` (if significant decision with trade-offs)

   See `docs/DOCUMENTATION_STRATEGY.md` for full guidelines on where to document.

   **What TO document:**

   - Gotchas that are easy to miss
   - Patterns that prevent bugs
   - Non-obvious best practices
   - Reusable patterns across features

   **What NOT to document:**

   - Obvious patterns (e.g., "use TypeScript types")
   - Feature-specific implementation details (goes in `docs/features/{feature-name}/README.md`)
   - One-off solutions that won't be reused

   **Example evaluation:**

   ```
   Evaluated learnings from this session:
   - Server sorting mismatch: Server sorted lastName/firstName but client displayed firstName/lastName → Document in AGENTS.md (non-obvious, reusable pattern)
   - Type extraction: leadCounts type was duplicated → Document in AGENTS.md (prevents bugs, reusable)
   - Contact deduplication logic: Specific to company-contacts-section → Skip (feature-specific, not complex enough for feature doc)
   - Summary: 2 learnings to document in AGENTS.md, 1 skipped
   ```

4. **Final Steps:**
   - If ready: commit, push, and create PR (if not already done)
   - If not ready: document what's remaining in PR description or issue
   - **Always capture learnings before ending the session**

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
