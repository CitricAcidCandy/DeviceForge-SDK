import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildBrowserPlugin } from '@deviceforge/plugin-tools';

await buildBrowserPlugin({
  root: fileURLToPath(new URL('.', import.meta.url)),
  entry: 'browser/index.ts',
  outputDir: 'dist/browser',
  signal: new AbortController().signal,
});
await mkdir(new URL('dist/server/', import.meta.url), { recursive: true });
await copyFile(new URL('server/entry.mjs', import.meta.url), new URL('dist/server/entry.mjs', import.meta.url));
