/**
 * Public release gate: real generated Worker graph plus Miniflare's real ASSETS.
 * Review this verifier, its source-gate dependency and the fixed contract anchor
 * together. Neither verifier nor the contract is a self-trusted asset.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const EXPECTED_PUBLIC_CONTRACT_SHA256 = 'e73a34550be7d38d82e902bbf2648750d3756fb7b12b12d9d0075dddc2e8a8ee';
const CONTRACT_PATH = 'checks/public-release/integrity.json';
const BUILD_ID = 'ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2';
const NEW_BASE = `runtime/pyodide/${BUILD_ID}/`;
const OLD_BASE = 'runtime/pyodide/314.0.7/';
const PRIMARY = Object.freeze([
  'pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm',
  'python_stdlib.zip', 'pyodide-lock.json',
]);
const COMPANIONS = Object.freeze([
  'package.json', 'pyodide.js', 'pyodide.js.map', 'pyodide.mjs.map',
]);
const REQUIRED_NOTICES = Object.freeze([
  'notices/NOTICE.md',
  'notices/runtime-assets-manifest.json',
  'notices/runtime-build-provenance.json',
  'notices/source-index.json',
  'notices/notices-source-manifest.json',
  'notices/CPYTHON-3.14.8-LICENSE.txt',
  'notices/CPYTHON-3.14.8-THIRD-PARTY.rst',
  'notices/CPYTHON-EXPAT-2.9.0-COPYING.txt',
]);
const MUTABLE_NOTICE_PATHS = new Set(REQUIRED_NOTICES.slice(0, 5));
const PROTECTED_ENDPOINTS = Object.freeze({
  '/index.html': '/',
  '/notices/index.html': '/notices/',
  '/notices/SQLITE-COPYRIGHT.html': '/notices/SQLITE-COPYRIGHT',
  '/engine-worker.js': '/engine-worker.js',
});
// Copied as an independent expectation, not imported from unchecked app code.
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self' https://pdf.utmb.world https://46eaea7aca.clvaw-cdnwnd.com https://drive.usercontent.google.com https://tiles.openfreemap.org; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'";
const SHA256 = /^[a-f0-9]{64}$/u;
const ORIGIN = 'https://runtime-assets.test';
const GENERATED_LIMITS = Object.freeze({members: 8192, depth: 16, fileBytes: 64 * 1024 * 1024, totalBytes: 256 * 1024 * 1024});
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function regularPath(file, kind = 'file') {
  const absolute = path.resolve(file);
  let cursor = path.parse(absolute).root;
  for (const segment of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const stat = fs.lstatSync(cursor);
    assert(!stat.isSymbolicLink(), `Symlink not permitted: ${cursor}`);
    assert(stat.isFile() || stat.isDirectory(), `Special file not permitted: ${cursor}`);
    if (cursor !== absolute) assert(stat.isDirectory(), `Non-directory ancestor: ${cursor}`);
  }
  const stat = fs.lstatSync(absolute);
  assert(kind === 'directory' ? stat.isDirectory() : stat.isFile(), `Expected ${kind}: ${absolute}`);
  return absolute;
}

function readPinnedContract(root) {
  assert.match(EXPECTED_PUBLIC_CONTRACT_SHA256, SHA256, 'Replace the reviewed fixed contract anchor before running; do not derive it at runtime.');
  const file = regularPath(path.join(root, CONTRACT_PATH));
  const raw = fs.readFileSync(file);
  assert.equal(sha256(raw), EXPECTED_PUBLIC_CONTRACT_SHA256, 'External public/source contract changed.');
  // The fixed raw SHA-256 anchors the reviewed canonical JSON bytes. Full schema,
  // path, inventory and source checks are performed by verifyRuntimeAssets before
  // any generated application code starts; no separate duplicate-key parser is claimed.
  const contract = JSON.parse(raw.toString('utf8'));
  assert.equal(contract.schema, 'ridgegeo-public-release-integrity/1');
  assert.equal(contract.build_id, BUILD_ID);
  assert(contract.public_files && typeof contract.public_files === 'object' && !Array.isArray(contract.public_files));
  assert(contract.critical_source_files && typeof contract.critical_source_files === 'object' && !Array.isArray(contract.critical_source_files));
  assert(Array.isArray(contract.protected_entrypoints));
  return contract;
}

function readGeneratedFiles(directory) {
  regularPath(directory, 'directory');
  const result = [];
  const state = {members: 1, bytes: 0};
  const scan = (current, depth) => {
    assert(depth <= GENERATED_LIMITS.depth, `Generated Worker depth limit: ${current}`);
    regularPath(current, 'directory');
    // opendir avoids first allocating an unbounded readdir result. The member
    // limit counts every visited directory, file, and rejected special member.
    const directoryHandle = fs.opendirSync(current);
    try {
      let row;
      while ((row = directoryHandle.readSync()) !== null) {
        assert(++state.members <= GENERATED_LIMITS.members, 'Generated Worker member limit.');
        assert(depth + 1 <= GENERATED_LIMITS.depth, `Generated Worker member depth limit: ${current}/${row.name}`);
        const file = path.join(current, row.name);
        assert(!row.isSymbolicLink(), `Generated Worker symlink: ${file}`);
        if (row.isDirectory()) scan(file, depth + 1);
        else {
          assert(row.isFile(), `Generated Worker special file: ${file}`);
          regularPath(file);
          const stat = fs.lstatSync(file);
          assert(stat.isFile() && !stat.isSymbolicLink(), `Generated Worker member changed kind: ${file}`);
          assert(Number.isSafeInteger(stat.size) && stat.size >= 0 && stat.size <= GENERATED_LIMITS.fileBytes, `Generated Worker file-size limit: ${file}`);
          state.bytes += stat.size;
          assert(state.bytes <= GENERATED_LIMITS.totalBytes, 'Generated Worker aggregate byte limit.');
          result.push(file);
        }
      }
    } finally {
      directoryHandle.closeSync();
    }
  };
  scan(directory, 0);
  return result.sort();
}

function readBoundedGeneratedFile(file, maximum = GENERATED_LIMITS.fileBytes) {
  regularPath(file);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    assert(stat.isFile(), `Generated input is not a regular file: ${file}`);
    assert(Number.isSafeInteger(stat.size) && stat.size >= 0 && stat.size <= maximum, `Generated input exceeds bounded read: ${file}`);
    // At most the fixed maximum plus one byte is ever allocated/read. An extra
    // byte catches growth after stat without an unbounded readFile allocation.
    const output = Buffer.allocUnsafe(stat.size + 1);
    let length = 0;
    while (length < output.length) {
      const count = fs.readSync(fd, output, length, Math.min(64 * 1024, output.length - length), null);
      if (count === 0) break;
      length += count;
      assert(length <= stat.size, `Generated input grew during read: ${file}`);
    }
    assert.equal(length, stat.size, `Generated input shrank during read: ${file}`);
    assert.equal(fs.fstatSync(fd).size, stat.size, `Generated input size changed during read: ${file}`);
    return output.subarray(0, length);
  } finally {
    fs.closeSync(fd);
  }
}

function generatedSnapshot(built) {
  let totalBytes = 0;
  return Object.fromEntries(readGeneratedFiles(built).map(file => {
    const raw = readBoundedGeneratedFile(file, Math.min(GENERATED_LIMITS.fileBytes, GENERATED_LIMITS.totalBytes - totalBytes));
    totalBytes += raw.length;
    assert(totalBytes <= GENERATED_LIMITS.totalBytes, 'Generated Worker snapshot aggregate byte limit.');
    return [path.relative(built, file).split(path.sep).join('/'), {bytes: raw.length, sha256: sha256(raw)}];
  }));
}

function secure(response, label) {
  assert.equal(response.headers.get('content-security-policy'), CSP, `${label}: CSP`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', `${label}: nosniff`);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer', `${label}: referrer policy`);
  assert.equal(response.headers.get('set-cookie'), null, `${label}: unexpected cookie`);
}

function cacheTokens(response) {
  return (response.headers.get('cache-control') || '').split(',').map(token => token.trim().toLowerCase()).filter(Boolean).sort();
}

function expectedCache(response, kind, label) {
  const tokens = cacheTokens(response);
  if (kind === 'immutable') assert.deepEqual(tokens, ['immutable', 'max-age=31536000', 'public'], `${label}: immutable cache`);
  else if (kind === 'no-cache') assert.deepEqual(tokens, ['no-cache'], `${label}: mutable cache`);
  else {
    // Unversioned notices and corresponding source must not become immutable.
    // Miniflare's pinned local asset worker defaults to this zero-age policy.
    const actual = tokens.join(',');
    assert(['no-cache', 'max-age=0,must-revalidate,public'].includes(actual), `${label}: notices must revalidate, got ${actual}`);
  }
}

function expectedMime(relative) {
  const ext = path.posix.extname(relative).toLowerCase();
  return ({
    '.mjs': 'text/javascript', '.js': 'text/javascript',
    '.wasm': 'application/wasm', '.zip': 'application/zip',
    '.json': 'application/json', '.map': 'application/json',
    '.txt': 'text/plain', '.md': 'text/markdown',
    '.gz': 'application/gzip', '.tar': 'application/x-tar',
    '.c': 'text/x-c', '.h': 'text/x-c', '.sh': 'application/x-sh',
    '.toml': 'application/toml', '.yaml': 'text/yaml', '.yml': 'text/yaml',
  })[ext] || null;
}

function checkMime(response, expected, label) {
  const header = response.headers.get('content-type');
  const actual = header?.split(';', 1)[0].trim().toLowerCase() ?? null;
  if (expected) assert.equal(actual, expected, `${label}: MIME`);
  else {
    // The established local binding has no fixed MIME for e.g. .rst, .patch,
    // .py and extensionless license files. Record rather than invent one.
    assert.notEqual(actual, 'text/html', `${label}: static notice became HTML`);
    assert.notEqual(actual, 'application/xhtml+xml', `${label}: static notice became XHTML`);
  }
  return header;
}

function urlFor(relative) {
  return new URL('/' + relative.split('/').map(encodeURIComponent).join('/'), ORIGIN);
}

async function exactBody(response, pin, label) {
  assert(Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 && SHA256.test(pin.sha256), `${label}: invalid size/hash pin`);
  if (pin.bytes === 0 && response.body === null) {
    assert.equal(pin.sha256, sha256(Buffer.alloc(0)), `${label}: empty HTTP SHA-256`);
    return;
  }
  assert(response.body, `${label}: missing GET body`);
  const reader = response.body.getReader();
  const digest = crypto.createHash('sha256');
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      assert(bytes <= pin.bytes, `${label}: response exceeds fixed byte length`);
      digest.update(part.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  assert.equal(bytes, pin.bytes, `${label}: HTTP byte length`);
  assert.equal(digest.digest('hex'), pin.sha256, `${label}: HTTP SHA-256`);
}

async function emptyBody(response, label) {
  assert.equal((await response.arrayBuffer()).byteLength, 0, `${label}: unexpected body`);
}

async function oneAsset(worker, item) {
  const url = item.url || urlFor(item.relative);
  const label = url.pathname;
  const get = await worker.dispatchFetch(url, {redirect: 'manual', headers: {'Accept-Encoding': 'identity'}});
  assert.equal(get.status, 200, `${label}: GET`);
  secure(get, label + ' GET');
  expectedCache(get, item.cache, label + ' GET');
  const contentType = checkMime(get, item.mime, label + ' GET');
  const etag = get.headers.get('etag');
  assert(typeof etag === 'string' && /^"[^"\s]+"$/u.test(etag), `${label}: missing/invalid strong ETag`);
  if (item.protected) assert.equal(etag, `"sha256-${item.pin.sha256}"`, `${label}: protected ETag`);
  // Static ASSETS has its own ETag algorithm; body SHA-256 remains independently
  // pinned. Do not falsely treat a platform ETag as the fixed SHA-256 identity.
  const length = get.headers.get('content-length');
  if (length !== null) assert.equal(length, String(item.pin.bytes), `${label}: Content-Length`);
  assert([null, 'identity'].includes(get.headers.get('content-encoding')), `${label}: identity encoding requested`);
  await exactBody(get, item.pin, label);

  const head = await worker.dispatchFetch(url, {method: 'HEAD', redirect: 'manual', headers: {'Accept-Encoding': 'identity'}});
  assert.equal(head.status, 200, `${label}: HEAD`);
  secure(head, label + ' HEAD');
  expectedCache(head, item.cache, label + ' HEAD');
  assert.equal(head.headers.get('content-type'), contentType, `${label}: HEAD MIME`);
  assert.equal(head.headers.get('etag'), etag, `${label}: HEAD ETag`);
  const headLength = head.headers.get('content-length');
  if (headLength !== null) assert.equal(headLength, String(item.pin.bytes), `${label}: HEAD Content-Length`);
  await emptyBody(head, label + ' HEAD');

  const cached = await worker.dispatchFetch(url, {redirect: 'manual', headers: {'If-None-Match': etag, 'Accept-Encoding': 'identity'}});
  assert.equal(cached.status, 304, `${label}: conditional GET`);
  secure(cached, label + ' 304');
  expectedCache(cached, item.cache, label + ' 304');
  assert.equal(cached.headers.get('etag'), etag, `${label}: 304 ETag`);
  // Source inspection suggests the pinned ASSETS and protected handler carry
  // MIME on 304. This assertion is unexecuted, not an RFC requirement or a claim
  // of verified generated-Worker behavior; an actual failure needs review.
  assert.equal(cached.headers.get('content-type'), contentType, `${label}: 304 MIME`);
  await emptyBody(cached, label + ' 304');
  return {path: label, bytes: item.pin.bytes, sha256: item.pin.sha256, etag, contentType, mimeExpectation: item.mime, cacheControl: get.headers.get('cache-control'), statuses: [200, 200, 304]};
}

async function missingAsset(worker, relative, protectedHashes) {
  // The 404 security/cache/body assertions below are proposed and unexecuted.
  // Source review is not proof that the generated fallback will satisfy them.
  const url = urlFor(relative);
  for (const method of ['GET', 'HEAD']) {
    const response = await worker.dispatchFetch(url, {method, redirect: 'manual', headers: {'Accept-Encoding': 'identity'}});
    assert.equal(response.status, 404, `${url.pathname}: missing ${method} must not return an SPA success`);
    secure(response, `${url.pathname} missing ${method}`);
    assert.equal(response.headers.get('location'), null, `${url.pathname}: missing asset redirect`);
    assert(!cacheTokens(response).includes('immutable'), `${url.pathname}: 404 must not be immutable`);
    if (method === 'HEAD') await emptyBody(response, `${url.pathname} missing HEAD`);
    else {
      const reader = response.body?.getReader();
      const hash = crypto.createHash('sha256');
      let bytes = 0;
      if (reader) {
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.byteLength;
            assert(bytes <= 2 * 1024 * 1024, `${url.pathname}: unbounded 404 response`);
            hash.update(part.value);
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      }
      assert(!protectedHashes.has(hash.digest('hex')), `${url.pathname}: missing asset returned a protected entrypoint body`);
    }
  }
  return {path: url.pathname, statuses: [404, 404], spaSuccess: false};
}

/** Returns the fixed validated contract; onReport receives a local-only receipt. */
export async function verifyBuiltRuntimeAssets(root = process.cwd(), {distRoot = path.join(root, 'dist'), onReport = () => {}} = {}) {
  root = regularPath(root, 'directory');
  distRoot = regularPath(distRoot, 'directory');
  assert.equal(typeof onReport, 'function');
  const client = regularPath(path.join(distRoot, 'client'), 'directory');
  const built = regularPath(path.join(distRoot, 'server'), 'directory');
  const contract = readPinnedContract(root);
  const {verifyRuntimeAssets} = await import('./verify-runtime-assets.mjs');
  const validated = await verifyRuntimeAssets(root, {distRoot: client});
  assert.deepEqual(validated, contract, 'Source gate must return this exact externally pinned contract.');

  // These are prerequisites, not evidence inferred from public manifests alone.
  const expectedRuntimePaths = [
    ...PRIMARY.map(name => OLD_BASE + name),
    ...[...PRIMARY, ...COMPANIONS].map(name => NEW_BASE + name),
  ].sort();
  const actualRuntimePaths = Object.keys(contract.public_files).filter(name => name.startsWith('runtime/')).sort();
  assert.deepEqual(actualRuntimePaths, expectedRuntimePaths, 'Exact retained/active runtime and companion set required.');
  for (const file of [...REQUIRED_NOTICES, 'python-engine.mjs', '_headers']) assert(Object.hasOwn(contract.public_files, file), `Missing required public pin: ${file}`);
  assert.deepEqual(contract.protected_entrypoints.map(row => row.path).sort(), Object.keys(PROTECTED_ENDPOINTS).sort(), 'Exact four protected entrypoints required.');
  for (const row of contract.protected_entrypoints) {
    assert(!fs.existsSync(path.join(client, row.path.slice(1))), `Protected entrypoint shadow in dist/client: ${row.path}`);
    assert(!fs.existsSync(path.join(root, 'public', row.path.slice(1))), `Protected entrypoint shadow in public: ${row.path}`);
  }

  const before = generatedSnapshot(built);
  const config = JSON.parse(readBoundedGeneratedFile(path.join(built, 'wrangler.json'), 1024 * 1024).toString('utf8'));
  assert.equal(config.main, 'index.js', 'Use the actual generated Worker entry.');
  assert.equal(config.compatibility_date, '2026-05-15');
  assert.deepEqual(config.compatibility_flags, ['nodejs_compat', 'global_fetch_strictly_public']);
  assert.equal(config.assets?.binding, 'ASSETS');
  assert.deepEqual(config.services, [], 'Public release has no provisioned Sites connector services.');
  assert.deepEqual(config.d1_databases, [], 'Public release does not provision a database.');
  assert.deepEqual(config.r2_buckets, [], 'Public release does not provision object storage.');
  assert.deepEqual(config.vars, {}, 'Public release has no embedded host variables.');
  assert.deepEqual(config.assets?.run_worker_first, ['/api/routes/*']);
  assert.equal(config.assets?.not_found_handling, 'none', 'Missing static files must not use SPA fallback.');
  assert.equal(config.assets?.html_handling, undefined, 'Review changed HTML handling before running this gate.');
  assert.equal(path.resolve(built, config.assets.directory), client, 'Use this generated dist/client, not a substitute asset directory.');
  const entry = regularPath(path.join(built, config.main));
  const generated = readGeneratedFiles(built);
  const modules = [entry, ...generated.filter(file => file !== entry && /\.m?js$/u.test(file))].map(file => ({type: 'ESModule', path: file}));
  const require = createRequire(import.meta.url);
  const miniflarePackage = JSON.parse(fs.readFileSync(require.resolve('miniflare/package.json'), 'utf8'));
  assert.equal(miniflarePackage.version, '4.20260515.0', 'Re-review local asset implementation semantics if the pinned Miniflare version changes.');
  const {Miniflare} = await import('miniflare');
  let outbound = 0;
  const worker = new Miniflare({
    modules,
    modulesRoot: built,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags,
    cf: false,
    assets: {
      directory: client,
      binding: config.assets.binding,
      routerConfig: {has_user_worker: true, static_routing: {user_worker: config.assets.run_worker_first}},
      assetConfig: {not_found_handling: config.assets.not_found_handling},
    },
    // No stubbed handler/ASSETS and no live network dependency. Miniflare reads
    // the real client _headers, including the runtime MIME/cache/security rules.
    outboundService: () => {
      outbound++;
      return new Response('Outbound denied in runtime asset verification', {status: 403});
    },
  });
  const results = [], missing = [], unavailableApis = [];
  try {
    const targets = Object.keys(contract.public_files).filter(relative => relative.startsWith('runtime/') || relative.startsWith('notices/') || relative === 'python-engine.mjs').sort();
    for (const relative of targets) {
      results.push(await oneAsset(worker, {
        relative,
        pin: contract.public_files[relative],
        mime: expectedMime(relative),
        cache: relative.startsWith('runtime/') ? 'immutable' : relative === 'python-engine.mjs' || MUTABLE_NOTICE_PATHS.has(relative) ? 'no-cache' : 'revalidate',
      }));
    }
    for (const pin of contract.protected_entrypoints) {
      results.push(await oneAsset(worker, {
        relative: pin.path.slice(1),
        url: new URL(PROTECTED_ENDPOINTS[pin.path], ORIGIN),
        pin,
        mime: pin.path.endsWith('.html') ? 'text/html' : 'text/javascript',
        cache: 'no-cache',
        protected: true,
      }));
    }
    const protectedHashes = new Set(contract.protected_entrypoints.map(row => row.sha256));
    const missingPaths = [
      ...[OLD_BASE, NEW_BASE].flatMap(base => ['mjs', 'wasm', 'zip', 'json', 'map'].map(ext => `${base}__missing_runtime_verification__.${ext}`)),
      'notices/__missing_runtime_notice__.txt',
      `notices/runtime-source/${BUILD_ID}/__missing_corresponding_source__.txt`,
    ];
    for (const relative of missingPaths) {
      assert(!Object.hasOwn(contract.public_files, relative), `404 probe collides with a public asset: ${relative}`);
      missing.push(await missingAsset(worker, relative, protectedHashes));
    }
    // The actual built routes must refuse absent trusted hosting context, even
    // when a browser supplies invented identity/authorization headers.
    for (const [endpoint,method,status,error] of [
      ['/api/history/intervals/context','GET',503,'hosting_session_not_configured'],
      ['/api/history/intervals/activities','GET',503,'hosting_session_not_configured'],
      ['/api/history/intervals/import','POST',503,'hosting_session_not_configured'],
      ['/api/routes/unknown','GET',404,'unknown_source'],
    ]) {
      const response = await worker.dispatchFetch(new URL(endpoint, ORIGIN), {
        method, headers: {origin:ORIGIN, authorization:'Bearer synthetic-public-release-test', 'oai-authenticated-user-id':'synthetic-user'},
      });
      assert.equal(response.status,status,endpoint+' fail-closed status');
      assert.equal(response.headers.get('cache-control'),'no-store, private');
      assert.equal(response.headers.get('x-content-type-options'),'nosniff');
      assert.equal(response.headers.get('referrer-policy'),'no-referrer');
      assert.equal(response.headers.get('set-cookie'),null);
      assert.equal((await response.json()).error,error,endpoint+' fail-closed reason');
      unavailableApis.push({path:endpoint,method,status,error});
    }
    assert.equal(outbound, 0, 'Worker initialization and checked requests must not contact an external service.');
    // Detect concurrent edits across the verification window. This is not a
    // defense against a hostile writer that changes and restores files midway.
    assert.deepEqual(generatedSnapshot(built), before, 'Generated Worker graph/config changed during verification.');
    assert.deepEqual(readPinnedContract(root), contract, 'Contract changed during verification.');
    assert.deepEqual(await verifyRuntimeAssets(root, {distRoot: client}), contract, 'Source/public/dist prerequisites changed during verification.');
  } finally {
    await worker.dispose();
  }
  assert.equal(outbound, 0, 'Disposal must not contact an external service.');
  onReport({
    schema: 'ridgeq-built-runtime-http-gate/1',
    build_id: BUILD_ID,
    expected_contract_sha256: EXPECTED_PUBLIC_CONTRACT_SHA256,
    status: 'passed',
    scope: 'Generated Worker graph and real local static-ASSETS binding; not a browser, production deployment, fresh build or Python/WASM execution claim.',
    identity: {sourceAndPublicContract: 'verified before and after', generatedModuleCount: modules.length, generatedFilesStable: true},
    generatedLimits: GENERATED_LIMITS,
    miniflareVersion: miniflarePackage.version,
    checkedAssets: results.length,
    checkedRequests: results.length * 3 + missing.length * 2 + unavailableApis.length,
    unavailableApis,
    runtimeFiles: expectedRuntimePaths.length,
    outboundRequests: outbound,
    assets: results,
    missing,
    limitations: [
      'This gate executes the generated Worker locally; it is not a browser or production acceptance test.',
      'Public runtime API, ABI and Python/Expat behavior are not established by HTTP byte identity; separate approved runtime evidence is required.',
      'Extensionless, .rst and other unclassified source/notice MIME values are recorded, not asserted to have an invented fixed type.',
      'Generated modules are the supplied build graph; source pins and HTTP checks do not independently reproduce compiler provenance.',
      'Verifier scripts and this contract are trusted only through the reviewed release source, not through this public-assets inventory.',
    ],
  });
  return contract;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.length <= 2, 'Usage: node scripts/verify-built-runtime-assets.mjs [projectRoot [distRoot]]');
  const root = path.resolve(args[0] || process.cwd());
  const distRoot = path.resolve(args[1] || path.join(root, 'dist'));
  await verifyBuiltRuntimeAssets(root, {distRoot, onReport: report => console.log(JSON.stringify(report, null, 2))});
}
