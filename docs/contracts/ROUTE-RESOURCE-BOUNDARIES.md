# Route resource and confidentiality boundaries

This is a scoped common-flow hardening contract. It covers acquisition through
raw admission, computation ownership and local export. It does not certify all
dependencies, every catalogue source, browser hardware or personal accuracy.

## 1. Byte acquisition, partitioning and cancellation

Local files and route responses retain the 5 MiB decoded-source ceiling. The
server bridge owns one bounded byte container, copies each chunk immediately,
and retains no per-chunk collection. Empty chunks therefore cannot amplify
retained object count, and reused transport views cannot change earlier bytes.
No source is truncated, resampled or silently repaired.

The server checks its absolute elapsed deadline after awaited stages and before
hashing or returning bytes. It yields a task after 64 nonterminal chunks or
256 KiB, including at a partition boundary immediately before EOF. Queued
request cancellation and timers can then run. Pending fetch/read/hash work races
the same cancellation/deadline. A late fetch body is discarded; terminal paths
remove listeners, clear deadline/yield timers and cancel/release the reader
promptly. If native hashing has already started, that request keeps its
concurrency reservation until the actual digest fulfills or rejects; settlement
releases it exactly once. Cancellation/timeout returns without awaiting that
work. A Promise race does not interrupt native hashing, so releasing its slot
early would allow retries to overlap uncounted work and retained source bytes.

The existing 15-second default, 30-second server maximum, two concurrent server
requests and per-fixed-source cooldown are unchanged. These are per-isolate
limits, not a global rate limit or a Cloudflare memory-capacity guarantee.

An upstream Content-Length is a transfer length, and may describe compressed
bytes while Fetch exposes decoded bytes. Identity/unencoded upstream bodies
are checked against their declaration when present. Encoded responses use the
same bounded decoded-byte container and reviewed SHA. The browser direct path
also treats an absent Content-Encoding on a CORS-filtered response as unknown:
that header is not CORS-safelisted. Explicit identity/basic unencoded responses
retain declaration equality. The same-origin bridge response is generated from
verified decoded bytes with its own exact Content-Length; its strict browser
client declaration/provenance checks remain unchanged.

Primary protocol references:
- https://developers.cloudflare.com/workers/runtime-apis/fetch/
- https://fetch.spec.whatwg.org/#cors-safelisted-response-header-name
- https://fetch.spec.whatwg.org/#concept-filtered-response-cors

## 2. Untrusted XML/text through admission and export

Every raw-GPX engine operation still passes the shared admission before
operation-specific geometry/model work. Existing ceilings remain 50,000 points,
32 levels, 2,000 segments, 200 waypoints, 250,000 elements, 2 MiB total text,
8,192 uncaptured node characters, 32 attributes and 4,096 attribute characters.
Names/descriptions retain their existing scalar bounds. DTD/entity/external XML,
processing instructions, malformed UTF-16, scalar children and foreign canonical
ancestors are refused. See GPX-ADMISSION.md for the authoritative detail.

Text is data. Source strings do not select a runtime asset, URL fetch or script.
The UI uses text nodes for source names and metadata; export writes XML text
nodes and rechecks the source/output tree and byte budget. Literal angle
brackets remain escaped text, and provenance claims remain claims. A string
that resembles a URL in a GPX extension is not permission to request it.

Original download bytes, geometry and source identities stay unchanged.
Enriched output retains the native GPX namespace/version and explicit adopted
checkpoint provenance; it cannot turn unverified source facts into official
coordinates, times or model eligibility. Optional enrichment is still
synchronous main-thread XML work and is not a phone responsiveness guarantee.

The pinned Expat 2.7.3 runtime is unchanged. Its known dependency-security repair
remains open. Parser-input mitigations and these tests are not that repair.

## 3. Compute, repeated operations and accepted-work ownership

The module Worker accepts only known operations and one active request. The
transport binds generation/request identities; cancel, timeout or dispose
terminates the owned Worker and ignores old callbacks. A new source or newer
foreground request cannot accept an earlier result. Fatal raw admission remains
distinct from optional details failure or model ineligibility.

Local/multiple-history contracts keep their existing per-file, aggregate-byte,
record, cell, plain-data/node and wall-time budgets. Drawing keeps its separate
draft, bounded point/history budgets and explicit replacement confirmation.
This batch does not widen those limits, change mathematical code, bypass
missing-elevation/steep-route gates or infer new personal parameters.

## 4. Fixed network targets, provenance and confidentiality

Visitors cannot supply a proxy URL. The server resolves a fixed catalogue ID to
a reviewed HTTPS host/path or an exact reviewed Google URL. It requires the
platform strictly-public network guard, requests manual redirects and refuses
every redirect or substituted final URL. Cookies, authorization, incoming
identifiers and upstream headers are not forwarded. Responses remain
no-store/private and same-origin with nosniff/no-referrer headers. Default
timeouts, source hashes and accepted-revision consent remain mandatory.

The direct browser path keeps its fixed origins/endpoints, CORS and redirect
refusal. It does not upload selected GPX bytes. Public map tiles remain the
explicitly enabled, separately disclosed exception: viewport geography and
ordinary network metadata reach the fixed map provider. Drawing does not send a
route, timestamps, checkpoints or history payload to that provider.

A changed official source produces a revision refusal before normal import.
Explicitly acknowledging the exact changed hash, where the server protocol
permits it, labels it source_changed_unreviewed. It cannot inherit the old
reviewed metadata. The normal browser bridge client still accepts only its
fixed reviewed hash/provenance.

## Evidence and stopping boundary

`node checks/route-resource-boundaries/pure.mjs` exercises actual modules under
bounded synthetic transport/Worker models, a host-Python XML DOM adapter and
host-Python shared admission. It does not perform external malicious requests.
The maintained acquisition, strict bridge-client and full Taiwan source-adapter
checks separately preserve legitimate original-source controls.

Independent review, production build/protected-entrypoint checks, exact deployed
browser interaction and device capacity are separate evidence levels. No
production publication is authorized by this contract. A completed scoped test
run must report those unrun levels rather than call the application secure.
