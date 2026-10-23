import home from './index.html?raw';
import notices from './notices/index.html?raw';
import sqlite from './notices/SQLITE-COPYRIGHT.html?raw';
import engine from './engine-worker.js?raw';
import manifest from './manifest.json';
import { createEntrypointHandler } from './entrypoint-handler.mjs';
export const handleEntrypoint = createEntrypointHandler({home,notices,sqlite,engine},manifest);
