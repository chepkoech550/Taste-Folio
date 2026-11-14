# Testing

## Automated checks

```sh
npm run check
```

Runs:

1. `npm run typecheck`.
2. `npm run build`.
3. `npm test` against the built Worker.

The integration suite creates an isolated Miniflare environment and applies the initial migration to its in-memory database. Test identities are supplied directly to that local Worker only.

Coverage includes missing authentication, invalid origin, required publication content, draft/published separation, owner isolation, published page rendering, image upload and access controls, unpublishing and unsafe evidence-link rejection.

Passing these checks does not verify production sign in, third-party payments, all browser layouts or hiring outcomes.

## Manual acceptance check

| Task | Expected result |
| --- | --- |
| Enter an introduction and skills | Draft retains the information |
| Add a project | Role and personal contribution are explicit |
| Link a skill to a project | Portfolio shows the corresponding project count |
| Upload a permitted photo | Image renders and is owned by the uploader |
| Publish incomplete content | Useful validation explains what is missing |
| Publish complete content | Stable portfolio URL is available |
| Edit a published portfolio | Existing published version remains unchanged |
| Republish | Portfolio reflects the new version |
| Unpublish | Shared portfolio content is unavailable |
| Open email/WhatsApp | The intended contact action is shown |
| Read payment details | UI states payments are external and unconfirmed |
| Use a narrow phone screen | Text and primary actions remain usable |

Record the device, task, actual result and any linked issue. Use illustrative test data for public issues. Do not publish contact details, payment identifiers or user photos without permission.
