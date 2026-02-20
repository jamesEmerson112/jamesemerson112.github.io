# ROADMAP V0.1 - Portfolio Internal Website Enhancements

## Scope
- Improve recruiter readability and consistency across Home, Metrics, and Projects.
- Keep portfolio data source unchanged; focus on frontend presentation and interaction polish.

## Projects Language Clarity

### Dominant Language Selection
- Resolve dominant language from programming languages only.
- If `primaryLanguage` is programming, keep it.
- If `primaryLanguage` is non-programming (for example `JSON`, `Plain Text`), scan language breakdown by:
  1. `code` descending
  2. `lines` descending (fallback tie-break)
  3. `name` ascending (deterministic final tie-break)
- Use the first programming language found.
- If no programming language exists, display `N/A`.

### Language Composition Rules
- Composition remains normalized to all-language code total (`100%`).
- Programming languages keep real language colors.
- Non-programming languages are bucketed into a neutral `Other` segment.
- `Other` also includes unrendered programming tail where applicable.
- `Other` is shown only when share is material (`>= 0.5%`).

### Example
- Repo `watch-and-learn` where top entries are `JSON`, `Plain Text`, then `Python`:
  - Dominant language shown: `Python`
  - Composition legend includes programming entries and `Other` (for non-programming share).
