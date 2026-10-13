# JavaScript runtime boundary audit — 2026-10-13

## Production crash found and fixed

The production Movefield/Grizzly plan builder could crash with `Cannot read properties of undefined (reading 'uid')` while loading plan choices. The recovered JavaScript modules imported a module namespace and immediately copied it into a `var` alias. Circular imports between training, source programs, and other domain modules allowed the optimized bundle to capture an uninitialized namespace object.

The existing CommonJS source-test loader initialized export objects before executing modules, so it did not reproduce the production failure. The TypeScript checks inspected the adjacent declarations rather than the JavaScript function bodies.

Replaced 109 eager namespace aliases in 19 canonical modules with direct namespace imports, preserving live module bindings. The change covers the shared training engine and the three native runtime UI modules. Synced the canonical domain files to the mobile snapshot so Movefield and Grizzly receive the same fix.

The separate mobile UI audit also found and fixed an undefined `sourceChoice` in the plan setup runtime. The new runtime gate includes a canary for this exact class of missed reference.

## Verification

| Check | Result |
| --- | --- |
| Production Vite bundle before the import fix | The reported `undefined.uid` crash reproduced in both optimized and minified output. |
| Production Vite bundle after the fix | Both modes passed. Each executed 201 plan builds, acceptances, and persisted reopen checks. |
| Creator plan loading | All eight source versions built across all seven start weekdays in each production bundle mode. |
| Real sample wizard path | The bodybuilding sample returned 26 options, including nine fitting options, without the production crash. |
| JavaScript hazards | All 40 canonical and copied runtime implementations passed undefined-name, duplicate declaration/key, unreachable-code, unsafe-optional-chain, and constant-binary-expression checks. |
| Runtime declarations | All 40 implementation modules exposed the same value exports promised by their adjacent declarations. |
| Local import boundaries | 150 local imports and 605 namespace property accesses resolved; referenced native assets existed. |
| Audit script lint | Passed. |

Run the lasting checks with:

```sh
node scripts/check-runtime-boundaries.mjs
node scripts/check-production-training.mjs
```

The static gate rejects newly introduced eager namespace copies as well as undefined names and invalid local imports. The production test bundles and executes the actual domain code with Vite, which specifically covers the initialization-order risk hidden by the old source loader.

The receipt from the failing build is retained locally at `.sites-runtime/production-training/before.json`; the current passing receipt is at `.sites-runtime/production-training/receipt.json`. This report records their outcome for the repository checkpoint.

## Scope

These checks verify runtime module integrity and production plan loading. They do not qualify physical-device behavior, app store acceptance, external authentication providers, or every possible user interaction. Browser and native interaction results are tracked in the other audit reports.
