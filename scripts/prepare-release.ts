import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'release-output');
const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root, encoding: 'utf8', windowsHide: true,
}).trim();
const cliIndex = process.argv.indexOf('--cli');
const cli = cliIndex >= 0 ? process.argv[cliIndex + 1] : undefined;

interface ReleaseAsset {
  readonly filename: string;
  readonly version: string;
  readonly platform: string;
  readonly bytes: number;
  readonly sha256: string;
}

await mkdir(output, { recursive: true });
const assets: ReleaseAsset[] = [];
async function add(source: string, version: string, platform = 'any'): Promise<void> {
  const filename = basename(source);
  const destination = join(output, filename);
  if (resolve(source) !== resolve(destination)) await copyFile(source, destination);
  const bytes = await readFile(destination);
  assets.push({
    filename, version, platform, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

for (const [project, filename, version] of [
  ['sdk', 'deviceforge-plugin-sdk-0.1.0.tgz', '0.1.0'],
  ['tools', 'deviceforge-plugin-tools-0.1.1.tgz', '0.1.1'],
  ['contracts', 'deviceforge-contracts-0.1.0.tgz', '0.1.0'],
] as const) {
  await add(join(root, 'browser', project, 'dist', filename), version);
}

// 归档来自本仓库提交，保留完整公开源码、锁文件、指南与示例的相对路径。
const sourceArchive = join(output, 'deviceforge-sdk-sources-0.1.0.zip');
execFileSync('git', [
  'archive', '--format=zip', `--output=${sourceArchive}`, 'HEAD',
], { cwd: root, stdio: 'pipe', windowsHide: true });
await add(sourceArchive, '0.1.0');

if (cli) {
  if (basename(cli) !== 'deviceforge-cli-0.1.0.tgz')
    throw new Error('CLI文件名与本批明确的配套版本不一致');
  await add(resolve(cli), '0.1.0', 'win32-x64');
}

await writeFile(join(output, 'manifest.json'), JSON.stringify({
  format_version: 1,
  state: 'prepared',
  source_repository: 'https://github.com/CitricAcidCandy/DeviceForge-SDK',
  source_revision: sourceRevision,
  compatibility: {
    browser_api_version: 2,
    rust_task_protocol_version: 4,
    plugin_release_format_versions: [1, 2],
    node: '>=22.18.0',
    rust_edition: '2024',
  },
  assets,
  dependencies: {
    rust: '归档内Cargo.toml与Cargo.lock；通过正常Cargo依赖渠道取得第三方库',
    browser: '各TGZ的package.json；通过正常npm依赖渠道取得声明的第三方包',
  },
}, null, 2) + '\n', 'utf8');
await writeFile(join(output, 'SHA256SUMS.txt'),
  assets.map((asset) => `${asset.sha256}  ${asset.filename}`).join('\n') + '\n', 'utf8');
console.log(JSON.stringify({ state: 'prepared', output, assets }, null, 2));
