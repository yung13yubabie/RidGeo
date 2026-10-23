# Public build integrity and provenance contract

This release uses `checks/public-release/integrity.json`, schema
`ridgegeo-public-release-integrity/1`. Its raw SHA-256 is fixed separately in
both `scripts/verify-runtime-assets.mjs` and
`scripts/verify-built-runtime-assets.mjs`. No build-time repinning exists.

## What changed, and what did not

The former private-acceptance contract included an old hosting identity,
documentation/package bytes and internal acceptance artifacts. They are not
execution requirements and are not supplied or silently considered passed.
This release establishes a new public baseline, not historical acceptance.
The source gate and generated-Worker HTTP gate now agree on this new contract.

All 323 public assets retain their exact supplied bytes and SHA-256 values.
The 65-member/49-Python-source graph, both runtime distributions, WASM header,
strict lock schema, corresponding source/notices/source-map closure, four
protected entrypoints and their non-shadowing rules remain checked. Runtime
payloads, API routing, security headers and application behavior were not
replaced with mocks or weakened to accommodate public distribution.

Source coverage is expanded to an exact closed set beneath app/, build/, lib/,
server/, scripts/ and checks/, plus the named root build/config files. That
includes relocated history server code, route services, connector context,
build helpers and the included tests. Any added/removed executable source fails
closure. The contract and its two verifier anchors are excluded from self-pins:
self-hashing them would create circular trust, not independent verification.
Provider structural declarations retain their independent schema hash check.

## Actual runtime gates

A portable build runs the normal compiler, validates the generated client
manifest and protected namespaces, initializes the actual generated Worker and
serves actual generated static assets through pinned Miniflare/workerd.
HTTP checks cover exact byte hashes, MIME/cache/CSP/security headers,
GET/HEAD/304, missing-file 404 without SPA fallback, and unavailable history
APIs rejecting invented browser identity. No mock ASSETS substitute is used by
the runtime-asset gate. Outbound requests are denied and counted; zero is
required. The generated Worker files are snapshotted before/after execution.
Generated client files are restricted to exact manifest-reachable chunks and
metadata; arbitrary additions under assets/ or .vite/ are rejected.

`check:public-integrity` copies sources into a temporary directory and verifies
that altered contract/WASM/API/config/entrypoint bytes, extra assets/source,
entrypoint shadowing and symlinks are rejected. It restores its own test copy,
never modifies original source, and requires a clean final pass. Its --built mode,
required by npm run build, additionally rejects extra generated assets/metadata,
a missing manifest chunk and altered client-entry metadata. Generated chunk
content is not an independently reproduced compiler attestation.

## Trust boundary and review

A fixed hash detects drift relative to a reviewed baseline. A coordinated edit
of the contract and its verifier anchors can create a different baseline, so
these three files require independent review and an authenticated release
commit/tag or an externally recorded digest. This repository alone is not
cryptographic proof of its own publisher or compiler provenance.

Review any intentional source change, its relevant tests and runtime behavior
before updating pins. Review both verifier anchors together; preserve exact
public closure and all runtime/protected/security assertions. Do not repin
unreviewed bytes simply because a build fails. Dependency resolution remains in
package-lock.json; no vendored node_modules or developer execution profile
belongs in a public source snapshot.

## Verification scope

A passing local build establishes only its asserted source, generated-Worker
and local HTTP properties. It does not establish historical private acceptance,
fresh dependency installation, independent runtime recompilation, browser
Python/WASM execution, all GPX workflows, live upstream availability, production
Cloudflare behavior, credential safety or legal rights to redistribute data.
These are separate publication/deployment review tasks, not waived gates.
