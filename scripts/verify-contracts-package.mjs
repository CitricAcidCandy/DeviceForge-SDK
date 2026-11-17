import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { extract } from 'it-tar';

const repository = fileURLToPath(new URL('../', import.meta.url));
const output = join(repository, 'artifacts/contracts');
const consumer = join(output, 'consumer');
const packageRoot = join(consumer, 'package');
const allowed = ['package/README.md', 'package/api.d.ts', 'package/package.json'];
const options = process.argv.slice(2);
let archiveOption;
let pathsConfigurationOption;
const consumerOptions = [];
for (let index = 0; index < options.length; index += 2) {
  const value = options[index + 1];
  if (!value || value.startsWith('--')) throw new Error('归档与消费者参数必须提供文件路径');
  if (options[index] === '--archive' && archiveOption === undefined) archiveOption = value;
  else if (options[index] === '--consumer') consumerOptions.push(value);
  else if (options[index] === '--paths-config' && pathsConfigurationOption === undefined)
    pathsConfigurationOption = value;
  else throw new Error('仅支持一个 --archive、一个 --paths-config 和可重复的 --consumer 参数');
}
if (!archiveOption)
  throw new Error('用法：node scripts/verify-contracts-package.mjs --archive <contracts TGZ> [--consumer <源文件>] [--paths-config <直接声明 paths 的配置>]');
const consumerSources = await Promise.all(consumerOptions.map(async (source) => {
  const path = await realpath(resolve(source));
  return { path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') };
}));
let pathsConfiguration = null;
let inheritedPaths = {};
if (pathsConfigurationOption) {
  assert.ok(consumerSources.length > 0, '继承 paths 配置时必须显式提供消费者源文件');
  const path = await realpath(resolve(pathsConfigurationOption));
  const bytes = await readFile(path);
  const config = JSON.parse(bytes.toString('utf8'));
  const paths = config.compilerOptions?.paths;
  assert.ok(paths && typeof paths === 'object' && !Array.isArray(paths), '请指定直接声明 paths 的 JSON 配置');
  const base = resolve(dirname(path), config.compilerOptions.baseUrl ?? '.');
  inheritedPaths = Object.fromEntries(Object.entries(paths).map(([name, targets]) => {
    assert.ok(Array.isArray(targets) && targets.every((target) => typeof target === 'string'), 'paths 映射必须为字符串数组');
    return [name, targets.map((target) => resolve(base, target))];
  }));
  pathsConfiguration = { path, sha256: createHash('sha256').update(bytes).digest('hex') };
}
const archive = await realpath(resolve(archiveOption));
const outputRoot = await realpath(output);
const archiveRelative = relative(outputRoot, archive);
assert.ok(archiveRelative && !isAbsolute(archiveRelative)
  && archiveRelative !== '..' && !archiveRelative.startsWith('..'), '归档必须位于 SDK 固定 artifacts/contracts 目录');
const compressed = await readFile(archive);
const entries = new Map();
for await (const entry of extract()([gunzipSync(compressed)])) {
  const name = entry.header.name;
  assert.ok(allowed.includes(name), '归档只能包含公开声明、包说明和元数据');
  assert.ok(!entries.has(name), '归档不能包含重复文件');
  const chunks = [];
  for await (const chunk of entry.body) chunks.push(chunk);
  entries.set(name, Buffer.concat(chunks));
}
assert.deepEqual([...entries.keys()].sort(), [...allowed].sort());
for (const name of allowed) {
  const local = await readFile(join(repository, 'browser/contracts', name.slice('package/'.length)));
  assert.deepEqual(entries.get(name), local, '归档必须与本次 SDK 工作区文件逐字节一致');
}
const metadata = JSON.parse(entries.get('package/package.json').toString('utf8'));
assert.equal(metadata.name, '@deviceforge/contracts');
assert.equal(metadata.exports['./api'].types, './api.d.ts');
await mkdir(packageRoot, { recursive: true });
assert.equal(await realpath(packageRoot), packageRoot, '消费夹具不能通过链接跳出固定目录');
for (const name of allowed)
  await writeFile(join(packageRoot, name.slice('package/'.length)), entries.get(name));
await writeFile(join(consumer, 'contracts-migration.ts'),
  await readFile(join(repository, 'scripts/tests/fixtures/contracts-migration.ts')));
const configuration = {
  compilerOptions: {
    target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
    strict: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true,
    noEmit: true, skipLibCheck: false, types: [],
    paths: { '@deviceforge/contracts/api': ['./package/api.d.ts'] },
  },
  files: ['./contracts-migration.ts'],
};
await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify(configuration, null, 2) + '\n', 'utf8');
if (consumerSources.length > 0)
  await writeFile(join(consumer, 'tsconfig.consumer.json'), JSON.stringify({
    ...(pathsConfiguration ? { extends: pathsConfiguration.path } : {}),
    compilerOptions: {
      ...configuration.compilerOptions,
      module: 'ESNext', moduleResolution: 'Bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      isolatedModules: true, verbatimModuleSyntax: true,
      allowImportingTsExtensions: true, jsx: 'react-jsx',
      paths: { ...inheritedPaths, ...configuration.compilerOptions.paths },
    },
    files: [...new Set(consumerSources.map(({ path }) => path))],
    include: [],
  }, null, 2) + '\n', 'utf8');
const review = {
  state: 'local-review-only',
  package: metadata.name,
  package_version: metadata.version,
  release_version_decision: '本地版本已准备；远端发行须单独授权，不得覆盖现有公开附件',
  filename: relative(outputRoot, archive),
  bytes: compressed.length,
  sha256: createHash('sha256').update(compressed).digest('hex'),
  integrity: `sha512-${createHash('sha512').update(compressed).digest('base64')}`,
  declaration_sha256: createHash('sha256').update(entries.get('package/api.d.ts')).digest('hex'),
  files: allowed,
  consumer_tsconfig: 'artifacts/contracts/consumer/tsconfig.json',
  additional_consumer_tsconfig: consumerSources.length > 0
    ? 'artifacts/contracts/consumer/tsconfig.consumer.json' : null,
  additional_consumer_sources: consumerSources,
  additional_consumer_paths_config: pathsConfiguration,
  validation: '归档成员和源字节已核对，专项类型检查须另行执行',
};
await writeFile(join(output, 'review.json'), JSON.stringify(review, null, 2) + '\n', 'utf8');
const baseRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repository, encoding: 'utf8', windowsHide: true,
}).trim();
const sourceChanged = execFileSync('git', ['status', '--porcelain', '--', 'browser/contracts'], {
  cwd: repository, encoding: 'utf8', windowsHide: true,
}).trim().length > 0;
if (!sourceChanged) {
  for (const name of allowed) {
    const path = `browser/contracts/${name.slice('package/'.length)}`;
    const committed = execFileSync('git', ['show', `${baseRevision}:${path}`], {
      cwd: repository, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
    });
    assert.deepEqual(entries.get(name), committed, '正式清单必须绑定与归档原字节一致的源码提交');
  }
}
const tag = `contracts-v${metadata.version}`;
const releaseUrl = `https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/tag/${tag}`;
const downloadUrl = `https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/${tag}/${review.filename}`;
const manifest = {
  format_version: 1,
  state: sourceChanged ? 'prepared-local' : 'source-bound',
  package: metadata.name,
  version: metadata.version,
  source: {
    repository: 'https://github.com/CitricAcidCandy/DeviceForge-SDK',
    base_revision: baseRevision,
    revision: sourceChanged ? null : baseRevision,
    uncommitted_contracts: sourceChanged,
    files: Object.fromEntries(allowed.map((name) => [
      `browser/contracts/${name.slice('package/'.length)}`,
      createHash('sha256').update(entries.get(name)).digest('hex'),
    ])),
  },
  planned_release: { tag, release_url: releaseUrl, download_url: downloadUrl, published: false },
  assets: [{ filename: review.filename, bytes: review.bytes, sha256: review.sha256, integrity: review.integrity }],
};
await writeFile(join(output, 'contracts-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
await writeFile(join(output, 'contracts-SHA256SUMS.txt'), `${review.sha256}  ${review.filename}\n`, 'utf8');
await writeFile(join(output, 'contracts-release-notes.md'), [
  `# HTTP 契约 ${metadata.version}：插件迁移 API`,
  '',
  '新增 migration-plan 与 migrate 公开类型；配置 revision 必填且可为 string 或 null。',
  '仅发行 contracts 声明，不升级 plugin-sdk、tools 或 Rust 公共库。',
  '',
  `文件：${review.filename}；字节数：${review.bytes}。`,
  `SHA-256：${review.sha256}。`,
  '',
  `发行页：${releaseUrl}`,
  `下载地址：${downloadUrl}`,
  sourceChanged ? '本地声明尚未提交，revision 为 null；不能作为正式发行清单。'
    : `源码提交：${baseRevision}；归档三成员与该提交的工作区原字节一致。`,
  '采用独立 contracts 标签，不移动旧标签、不覆盖旧附件；公开可用性须在上传后独立下载核验。',
  '',
].join('\n'), 'utf8');
console.log(JSON.stringify(review, null, 2));
