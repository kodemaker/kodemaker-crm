# Code Review Checklist

## Overview

Comprehensive checklist for conducting thorough code reviews to ensure quality, security, and maintainability.

## Review Categories

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs or logic errors

### Code Quality

- [ ] Code is readable and well-structured
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] No code duplication
- [ ] Follows project conventions

### Security

- [ ] No obvious security vulnerabilities
- [ ] Input validation is present
- [ ] Sensitive data is handled properly
- [ ] No hardcoded secrets

## Next Steps

After completing the code review and fixing any issues:

1. **Fix any issues found** during the review
2. **Re-review** if significant changes were made
3. **Proceed to commit/PR creation** using `.cursor/commands/create-pr-or-commit.md`

**For AI assistants:**

- After completing this checklist, use: "Follow the create-pr-or-commit command"
- This ensures code is reviewed before being committed or PR'd
