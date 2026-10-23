# Cloudflare Workers + Static Assets migration plan

This is a plan derived from current source, not a tested deployment recipe.
Verify current Cloudflare documentation and platform limits when implementing.
No account resources, API credentials, domains, or deployment were created.

1. Keep the live Sites website and original verified baseline unchanged. Build a
   separate repository/deployment and test it before any cutover.
2. Choose a Worker name, account, domain, compatibility date and asset settings.
   The Vite build already has Cloudflare integration and a Worker with ASSETS.
   Audit `vite.config.ts`, `build/sites-worker.ts`, `build/sites-vite-plugin.ts`,
   and connector-preview glue; do not blindly deploy their Sites assumptions.
3. Replace Sites-specific authentication/context and CONNECTORS service bindings.
   Existing Sites connector grants do not migrate to a user-owned Cloudflare
   account. Either disable unavailable history integrations with clear UI or
   implement separately approved authentication/provider access. Never expose
   provider secrets in browser assets or commit them to Git.
4. Preserve route bridge behavior, allowed upstream destinations, byte/time caps,
   protected entrypoint routing, content types, cache/security headers, CSP and
   exact runtime/source-manifest integrity. Check actual asset size/platform
   limits, including WASM and standard-library ZIPs, before deployment.
5. The sanitized `.openai/hosting.json` is `{}` solely to keep the current import
   resolvable without a private project ID. It does not configure a public site.
6. Review the implemented public-release integrity contract described in
   PUBLIC-BUILD-CONTRACT.md. It binds the sanitized source graph and retains
   runtime bytes/checks, but a freshly hashed contract is not an independent audit.
7. The portable local build and Worker HTTP gates have passed with a compatible
   trusted dependency installation. Still test a fresh locked install and browser
   workflows. With separate setup/deployment authorization, deploy a preview. Verify GPX import/export,
   runtime integrity, map assets, connector-unavailable states and security
   headers before requesting cutover approval.

GitHub source publication and Cloudflare deployment are separate actions.
Foreground browser use does not require shipping an APK. Do not promise offline
PWA/installability/background behavior unless separately implemented and tested.
