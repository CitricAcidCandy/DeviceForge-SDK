import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repository = resolve(import.meta.dirname, '..');
const npm = process.env['npm_execpath'];
if (!npm) throw new Error('请通过npm run pack:browser执行，以使用当前npm发行工具。');
for (const name of ['tools', 'contracts']) {
  const destination = resolve(repository, 'browser', name, 'dist');
  await mkdir(destination, { recursive: true });
  const workspace = name === 'tools' ? '@deviceforge/plugin-tools' : '@deviceforge/contracts';
  const result = spawnSync(process.execPath,
    [npm, 'pack', '--workspace', workspace, '--pack-destination', destination, '--ignore-scripts'],
    { cwd: repository, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`公开包${workspace}打包失败，退出码${result.status ?? '未知'}。`);
}
