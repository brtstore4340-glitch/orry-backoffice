# State Management Rules

- Prefer the nearest possible state owner.
- Use server data directly in server components when feasible.
- Use client state for transient UI concerns only.
- Do not introduce Zustand, Redux, or another global store unless the repo clearly needs it and the task justifies it.
- URL parameters or route segments should drive navigational state when that state should be shareable or refresh-safe.
- Avoid duplicating derived values in state.
