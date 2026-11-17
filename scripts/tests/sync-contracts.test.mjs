import assert from 'node:assert/strict';
import { mkdir, readFile, realpath, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { syncContracts } from '../sync-contracts.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const directory = resolve(repository, 'artifacts/contracts-sync-tests');
const source = resolve(directory, 'generated.ts');
const target = resolve(directory, 'api.d.ts');
const generated = '// 此文件从 Rust 公开接口模式生成，请通过 npm run generate:api 更新。\n'
  + 'export interface paths {}\nexport interface components {}\n';

test('生成声明按原字节同步，拒绝无效来源且不覆盖旧目标', async () => {
  await mkdir(directory, { recursive: true });
  const owned = relative(await realpath(repository), await realpath(directory));
  assert.equal(owned, join('artifacts', 'contracts-sync-tests'));
  assert.ok(!isAbsolute(owned));
  try {
    await writeFile(source, generated, 'utf8');
    await writeFile(target, '原有声明', 'utf8');
    assert.deepEqual(await syncContracts(source, target), {
      changed: true, bytes: Buffer.byteLength(generated),
    });
    assert.deepEqual(await readFile(target), await readFile(source));
    assert.deepEqual(await syncContracts(source, target), {
      changed: false, bytes: Buffer.byteLength(generated),
    });
    await assert.rejects(syncContracts(target, target), /来源不能与 SDK 声明目标相同/);
    for (const invalid of [
      Buffer.from('export interface paths {}\nexport interface components {}\n'),
      Buffer.from('\uFEFF' + generated),
      Buffer.from(generated.replace('export interface components {}', '')),
      Buffer.from([0xff, 0xfe]),
    ]) {
      await writeFile(source, invalid);
      await assert.rejects(syncContracts(source, target), /正式 generate:api|有效 UTF-8/);
      assert.equal(await readFile(target, 'utf8'), generated);
    }
    await unlink(source);
    await assert.rejects(syncContracts(source, target), { code: 'ENOENT' });
    assert.equal(await readFile(target, 'utf8'), generated);
  } finally {
    for (const file of [source, target]) {
      await unlink(file).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
});
