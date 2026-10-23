export const CONTENT_SECURITY_POLICY="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self' https://pdf.utmb.world https://46eaea7aca.clvaw-cdnwnd.com https://drive.usercontent.google.com https://tiles.openfreemap.org; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'";
export const ASSET_FIRST_BINARIES = Object.freeze(['/runtime/pyodide/ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2/pyodide.asm.wasm','/runtime/pyodide/ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2/python_stdlib.zip']);
export function protectAssetResponse(response, request) {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  const previousCache = headers.get('Cache-Control') || '';
  if (headers.has('Set-Cookie') || request.headers.has('Authorization')) headers.set('Cache-Control', 'no-store, private');
  else if (!/(?:^|,)\s*(?:private|no-store)(?:\s|,|=|$)/i.test(previousCache)) headers.set('Cache-Control', 'no-cache');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
export async function fetchProtectedAsset(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') return new Response('Static resources are temporarily unavailable.', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':CONTENT_SECURITY_POLICY,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) { if (response.body) await response.body.cancel(); return null; }
  return protectAssetResponse(response, request);
}
