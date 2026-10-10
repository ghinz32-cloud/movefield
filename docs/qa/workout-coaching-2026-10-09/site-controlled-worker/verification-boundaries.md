# Verification boundaries

The six-file worker repair is published as c60ee243baaf88eb9aa7dbd4c1dea16a01af1d58, full tree0d84999d80c57c7731713aea85cec5901e54475c. Root local code checkpoint873b3e0 has the same tree; subsequent connector-history merge df5f36a preserves both histories with that tree.

Local types, scoped lint,47 shared hashes,34 offline scenarios,745 policy assertions,102 runtime assertions, zero-warning production build and3/3 production suites pass. Official quality38002481257 succeeds on exactly this source and equivalent integration tree, with75/75 suites,29 UI scenarios/168 assertions and3/3 production checks.

The full whitespace check flags original whitespace in byte-preserved official CLI/build logs. Application/source changes pass the whitespace check when receipt logs are excluded. Receipt bytes and SHA-256 inventories are deliberately retained unchanged.

Managed hosting verifies101/101 served file hashes,82/82 current offline asset hashes/200/no redirects/public cache control, current SW/manifest, first module and25 shell references. Static runtime HTTP responses omit CSP; the current-build controller supplies strict CSP only after code hash verification.34/34 controlled fixtures cover that behavior; actual browser registration/controller and runtime requests were not executed.

Raw service-access HTTP responses carry Set-Cookie, so the raw no-cookie diagnostic correctly fails for82/82 assets and the shell. This does not prove a browser installation failure: the Fetch Standard defines basic filtered responses as excluding forbidden response headers including Set-Cookie. Actual browser Response.type, filtering, installation and GPU behavior remain unobserved. See [basic filtered responses](https://fetch.spec.whatwg.org/#concept-filtered-response-basic) and [forbidden response-header names](https://fetch.spec.whatwg.org/#forbidden-response-header-name). No cookie values or service credentials are retained.

The provider key is absent. API sign-in refusal is checked; positive authenticated jobs and model inference are unexecuted. Native inference/account auth and physical/store signing remain unavailable. Public Pages has no cloud backend. Actual native compilation/inspection/artifact retention is separate from device installation and complete binary replay/SCA.
