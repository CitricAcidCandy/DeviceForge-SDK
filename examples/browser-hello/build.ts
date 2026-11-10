import { fileURLToPath } from 'node:url';
import { buildBrowserPlugin } from '@deviceforge/plugin-tools';

await buildBrowserPlugin({
  root: fileURLToPath(new URL('.', import.meta.url)),
  entry: 'src/index.ts',
  outputDir: 'dist/browser',
  signal: new AbortController().signal,
});
