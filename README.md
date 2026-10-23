# RidGeo

## 線上配速規劃網站

[開啟 RidGeo 配速規劃網站](https://ridgeq.brycelin.chatgpt.site)

線上部署版本可能與本儲存庫的原始碼版本不同；更新本儲存庫不會自動部署或更新線上網站。

Public-source candidate for RidGeo 0.5.56, intended repository owner
`yung13yubabie`. Original project code is MIT licensed; third-party code and data
retain their own terms. This copy has not been published or deployed and does
not modify the existing website.

## Run locally

Requires Node >=22.13.0 and npm. On a clean clone:

```sh
npm run install:ci
npm run build
npm start
```

`npm start` runs the generated Worker locally on 127.0.0.1 (Wrangler normally
uses port 8787). `npm run dev` runs the framework development preview. Builds use
the portable profile by default; no private Sites project ID is required.
The install resolves the committed lockfile; a fresh network install has not
been tested as part of this public-source preparation.

The build is gated: exact public/runtime and executable-source SHA-256 closure,
protected entrypoint identity/non-shadowing, provider schema, route-admission,
generated client graph, generated Worker startup, real local static-ASSETS HTTP
bytes/MIME/cache/security checks, and fail-closed unavailable history APIs.
See `docs/PUBLIC-BUILD-CONTRACT.md` for trust boundaries and review instructions.
The public release contract is distinct from historical private acceptance.

Additional checks:

```sh
npm run check:public-integrity
npm run check:gpx-acquisition
npm run check:strict-bridge-acquisition
npm run check:catalog-dates
```

Do not automatically regenerate hashes to make a failing build pass. Source or
runtime changes require review of their behavior and of the new contract pins.

## What is included

Browser UI/GPX processing: `public/`. Protected entrypoints, routing and history
services: `server/`. Framework and build glue: `app/`, `build/`, `lib/`, `scripts/`.
Both active and rollback Pyodide runtimes, WASM, standard-library ZIPs, frozen
Python source, source patches and third-party notices are required and retained.

## Hosting and integration limits

A clean clone has no Sites connector grants, verified history session, provider
credentials, database or storage bindings. History APIs fail closed instead of
inventing account access. Development-only Sites sign-in emulation is not real
authentication. A production authentication/payment/provider implementation is
not supplied. Do not treat development preview identity as a trusted session.

See `docs/DEPLOYMENT-MIGRATION.md` before planning separate Cloudflare hosting.
No paid Cloudflare setup, domain, account, secret, production deployment, APK,
PWA/offline guarantee or live-site migration is included. Local build and HTTP
checks do not prove browser Python/WASM behavior or deployment readiness.

## License and release review

`LICENSE` applies only to original code the copyright holder can license.
`THIRD_PARTY_NOTICES.md` and embedded upstream/data notices remain applicable.
Publication remains conditional on licensing/data/branding and privacy review;
see `docs/PUBLIC-RELEASE-REVIEW.md`. A successful build is not permission to
publish or evidence that every redistributed material is MIT licensed.
