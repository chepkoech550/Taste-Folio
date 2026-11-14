# Contributing

## Keep changes reviewable

1. Open an issue describing the user problem and completion criteria.
2. Create a short branch such as `feat/flash-checkout`, `fix/photo-upload` or `docs/demo-guide`.
3. Make a focused change.
4. Run `npm run check` for code changes. For documentation-only changes, verify paths and commands affected by the edit.
5. Open a pull request using the provided template.
6. Review the result and merge when the relevant checks pass.

`main` is the reviewed source. Repository branch protection has not been configured automatically. Do not describe it as enforced until it is set up in GitHub.

Use concrete commit messages, for example `feat: publish portfolio snapshots` or `fix: keep draft images private`. Avoid including generated output, runtime data or credentials.

## Product boundaries

Prioritise the complete portfolio and payment journey. State what works and what remains a mock or plan. Preserve the maroon/gold visual direction and the focused interface. Do not add ratings, review systems or verified badges without a defined evidence process.

## Data and licences

Use example data in tests. Obtain permission for user photos and client information. Keep third-party licences, identify substantial reused work, and disclose AI assistance. A project-wide licence is still pending the owner's choice.
