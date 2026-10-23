import { handleEntrypoint } from "../server/entrypoints/bundled-entrypoints";
import { fetchProtectedAsset, protectAssetResponse } from "../server/asset-security/asset-security.mjs";
import { handleHistoryProviderRequest } from "../server/history-provider/history-provider.mjs";
import { handleRouteRequest } from "../server/route-bridge/route-bridge.mjs";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const historyResponse = await handleHistoryProviderRequest(request);
    if (historyResponse) return historyResponse;
    const routeResponse = await handleRouteRequest(request);
    if (routeResponse) return routeResponse;
    const entrypointResponse = handleEntrypoint(request);
    if (entrypointResponse) return entrypointResponse;
    const assetResponse = await fetchProtectedAsset(request, env);
    if (assetResponse) return assetResponse;
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return protectAssetResponse(await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx)), request);
  },
};
