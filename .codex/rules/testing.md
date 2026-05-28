# Testing And Validation Rules

Apply this rule to new features, refactors, bug fixes, and reviews.

## Validation Order

Use the smallest relevant set in this order:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`

Current repo note:

- No dedicated `npm run test` script exists yet.
- Validation must be reported honestly when blocked by pre-existing repo issues.

## Principles

- Fix the smallest correct scope first.
- Re-run only the affected validation after each meaningful fix.
- Do not suppress errors by weakening type safety or disabling rules without explicit approval.
- Document why tests were not added if the repo has no active test harness for the changed area.
