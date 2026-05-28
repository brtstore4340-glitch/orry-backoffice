# Error Handling Rules

- Cover loading, empty, error, and success states for user-visible flows.
- Prefer safe recovery paths over generic crashes.
- Auth failures should redirect or block access server-side as the existing ORRY flow expects.
- Financial, inventory, and approval actions should fail clearly without partial UI claims that the action succeeded.
- Log or audit sensitive failures through the existing project patterns when appropriate.
