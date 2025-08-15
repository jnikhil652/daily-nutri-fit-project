# Spec Requirements Document

> Spec: Supabase Environment Variable Rename
> Created: 2025-01-27
> Status: Planning
> Priority: P3 (Low) - Technical debt cleanup, not blocking any functionality

## Overview

Rename the Supabase environment variable from `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `EXPO_PUBLIC_SUPABASE_KEY` throughout the codebase to improve naming consistency and align with updated conventions. This change affects environment configuration, code references, and documentation.

## User Stories

### Developer Experience

As a developer working on the DailyNutriFit app, I want the Supabase environment variable to have a clear and consistent name, so that the configuration is easier to understand and maintain.

**Workflow:** Developer sets up the project, copies `.env.example` to `.env`, fills in the `EXPO_PUBLIC_SUPABASE_KEY` value, and the app connects to Supabase successfully.

### Project Setup

As a new team member, I want the environment variable names to be intuitive and well-documented, so that I can quickly set up the development environment without confusion.

**Workflow:** New developer follows setup instructions, sees clear variable names in documentation, and successfully configures the project on first attempt.

## Spec Scope

1. **Environment Variable Rename** - Change `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `EXPO_PUBLIC_SUPABASE_KEY` in all configuration files
2. **Code References Update** - Update all TypeScript/JavaScript files that reference the old variable name
3. **Documentation Update** - Update README.md and any other documentation that mentions the old variable name
4. **Example Files Update** - Update `.env.example` with the new variable name

## Out of Scope

- Changing the actual Supabase API key value
- Modifying Supabase project configuration
- Updating any external documentation or deployment scripts
- Adding new environment variables

## Expected Deliverable

1. All references to `EXPO_PUBLIC_SUPABASE_ANON_KEY` are replaced with `EXPO_PUBLIC_SUPABASE_KEY`
2. The app continues to function correctly with the new environment variable name
3. Documentation accurately reflects the new variable name
4. Setup instructions are updated and tested

## Technical Requirements

- Maintain backward compatibility during transition if needed
- Ensure no breaking changes to existing functionality
- Update all relevant files in a single coordinated change
- Verify the app builds and runs successfully after changes

## Files to be Modified

- `/lib/supabase.ts` - Update environment variable reference
- `/.env.example` - Update variable name in example file
- `/README.md` - Update setup instructions and documentation
- Any other files that reference the old variable name

## Success Criteria

- [ ] All code references use the new variable name
- [ ] Documentation is updated and accurate
- [ ] App builds and runs without errors
- [ ] Environment setup process works with new variable name
- [ ] No references to the old variable name remain in the codebase