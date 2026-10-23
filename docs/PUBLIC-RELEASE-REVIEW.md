# Public release review status

Status: portable public build implemented and locally verified; publication
conditional. No repository remote, deployment or credentials were created.
The existing website, original build and earlier preparation copy are untouched.

## Public contract migration

The private-acceptance manifest is replaced by a distinct public release
contract, not relabeled as historical acceptance. Read
`PUBLIC-BUILD-CONTRACT.md` for exact coverage and trust limitations.
Public runtime assets and protected entrypoints are unchanged. Source coverage
now includes runtime/API/build modules rather than only the former narrow set.
The only changes to the runtime verifiers are the new schema/path/fixed anchors,
expanded source closure, exact generated-client membership (no wildcard assets/
or .vite/ additions), explicit unconfigured-host probes, and accurate scope
wording. Runtime/HTTP/security assertions remain active.

## Exclusions and retained runtime code

Old Git history, private host identity, credentials, development snapshots,
generated outputs, screenshots and historical acceptance evidence are excluded.
Required frozen Python, standard-library ZIP/WASM, corresponding source, licenses
and notices are retained. The three history core modules remain genuine runtime
code under `server/history-provider/core/`; their relocated imports and the
exact pinned provider structural declarations are included.

The public hosted-origin GPX extension namespace in GPX import/export is retained
as a compatibility identifier, not an account binding or credential. Changing it
would change GPX semantics; reviewers should note this attribution/privacy choice.

## Before publication or production migration

- Independently review the new contract and both anchors with the exact diff.
- Confirm the intended repository name and scope before publishing.
- Resolve third-party, branding, catalog/course data and artwork rights in
  `THIRD_PARTY_NOTICES.md`; owner-code MIT does not relicense third-party data.
- Review a final source-only inventory and scan results. Heuristic scans cannot
  prove absence of private material or secrets, especially in binary content.
- Test a fresh locked install and browser GPX/Python/WASM flows separately.
- Revalidate the target Cloudflare platform limits, routing, auth and connector
  behavior in a separate approved deployment. No paid/auth setup is implemented.

`repin-manual-pace.py` still references a historical acceptance bootstrap and
must not be used without its separate reviewed acceptance suite. It is not part
of normal build/runtime execution. No APK, live cutover, public hosting or
security/legal-completeness guarantee is implied by the successful local build.
