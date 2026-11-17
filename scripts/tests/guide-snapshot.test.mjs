import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, rm, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildGuideSnapshot, GUIDE_TOPICS, MAX_DOCUMENT_BYTES, snapshotBytes, writeGuideSnapshot,
} from '../guide-snapshot.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const fixtureParent = join(repository, 'artifacts/guide-snapshot-tests');

async function fixture(run) {
  await mkdir(fixtureParent, { recursive: true });
  const root = join(fixtureParent, 'case');
  await mkdir(root);
  try {
    await Promise.all([
      mkdir(join(root, 'rust/plugin-guide/src'), { recursive: true }),
      mkdir(join(root, 'docs/frontend'), { recursive: true }),
      mkdir(join(root, 'docs/backend'), { recursive: true }),
    ]);
    await writeFile(join(root, 'rust/plugin-guide/src/lib.rs'), 'pub const GUIDE_VERSION: u32 = 7;\n');
    const writes = [];
    for (const target of ['frontend', 'backend']) {
      for (const topic of GUIDE_TOPICS)
        writes.push(writeFile(join(root, 'docs', target, `${topic}.md`),
          `# ${target}/${topic}\n${'独立指南正文。'.repeat(20)}\n`, 'utf8'));
    }
    writes.push(writeFile(join(root, 'docs/frontend/composition.md'),
      `# 组合说明\n${'正文保持独立。'.repeat(20)}\n`, 'utf8'));
    await Promise.all(writes);
    await run(root);
  } finally {
    // 只回收本用例明确创建且仍位于G盘夹具父目录内的目录。
    const owned = relative(await realpath(fixtureParent), await realpath(root));
    assert.ok(owned && !isAbsolute(owned) && !owned.startsWith('..'));
    assert.equal(resolve(fixtureParent, owned), resolve(root));
    await rm(root, { recursive: true });
  }
}

test('当前十七篇来源生成完整且确定的十六篇快照，组合正文与内容摘要一致', async () => {
  const first = await buildGuideSnapshot(repository);
  const second = await buildGuideSnapshot(repository);
  assert.deepEqual(first, second);
  assert.equal(first.format_version, 1);
  assert.equal(first.guide_version, 5);
  assert.equal(first.compatibility_version, 5);
  assert.equal(first.documents.length, 16);
  assert.deepEqual(first.documents.map(({ target, topic }) => `${target}/${topic}`),
    ['frontend', 'backend'].flatMap((target) => GUIDE_TOPICS.map((topic) => `${target}/${topic}`)));
  assert.equal(first.content_sha256,
    createHash('sha256').update(JSON.stringify(first.documents), 'utf8').digest('hex'));
  const combined = await readFile(join(repository, 'docs/frontend/sdk.md'), 'utf8')
    + '\n\n' + await readFile(join(repository, 'docs/frontend/composition.md'), 'utf8');
  assert.equal(first.documents.find(({ target, topic }) => target === 'frontend' && topic === 'sdk').content,
    combined);
  assert.deepEqual(Object.keys(first.documents[0]), ['target', 'topic', 'content']);
  assert.ok(snapshotBytes(first).length <= 2 * 1024 * 1024);
});

test('对外指南覆盖两端复合身份、显式迁移和真实契约渠道，不泄露宿主本机位置', async () => {
  const snapshot = await buildGuideSnapshot(repository);
  for (const target of ['frontend', 'backend']) {
    const packaging = snapshot.documents.find((document) => document.target === target && document.topic === 'packaging').content;
    for (const term of ['components[].kind', 'component.tgz', 'migration-plan', 'confirmed:true', 'plan_digest', '不重', '0.1.1'])
      assert.ok(packaging.includes(term), `${target}/packaging 缺少 ${term}`);
  }
  const frontend = snapshot.documents.find((document) => document.target === 'frontend' && document.topic === 'packaging').content;
  assert.ok(frontend.includes('/releases/download/contracts-v0.1.1/deviceforge-contracts-0.1.1.tgz'));
  assert.ok(frontend.includes('同目标并发互斥'));
  for (const document of snapshot.documents)
    assert.doesNotMatch(document.content, /[A-Z]:[\\/](?:Rust|Users)[\\/]/u);
});

test('版本直接读取公开指南库，生成结果字节稳定且无需宿主或构建依赖', async () => {
  await fixture(async (root) => {
    const first = await writeGuideSnapshot(root);
    const firstBytes = await readFile(first.path);
    const second = await writeGuideSnapshot(root);
    assert.deepEqual(await readFile(second.path), firstBytes);
    assert.equal(first.guide_version, 7);
    assert.equal(first.compatibility_version, 7);
    assert.equal(first.bytes, firstBytes.length);
    assert.equal(first.sha256, createHash('sha256').update(firstBytes).digest('hex'));
  });
});

test('缺失来源或空白正文拒绝生成，既有生成物保持原字节', async () => {
  await fixture(async (root) => {
    const prior = await writeGuideSnapshot(root);
    const bytes = await readFile(prior.path);
    const path = join(root, 'docs/backend/validation.md');
    await unlink(path);
    await assert.rejects(writeGuideSnapshot(root), { code: 'ENOENT' });
    assert.deepEqual(await readFile(prior.path), bytes);
    await writeFile(path, ' '.repeat(500), 'utf8');
    await assert.rejects(writeGuideSnapshot(root), /100至131072/);
    assert.deepEqual(await readFile(prior.path), bytes);
  });
});

test('BOM和无效UTF-8来源拒绝进入发布快照', async () => {
  await fixture(async (root) => {
    const path = join(root, 'docs/backend/overview.md');
    await writeFile(path, '\uFEFF# 无效来源\n' + '说明。'.repeat(50), 'utf8');
    await assert.rejects(buildGuideSnapshot(root), /不含BOM的有效UTF-8/);
    await writeFile(path, Buffer.from([0xff, 0xfe, 0x61, 0x62]));
    await assert.rejects(buildGuideSnapshot(root), /不含BOM的有效UTF-8/);
  });
});

test('单篇UTF-8字节预算和前端组合后的预算均严格检查', async () => {
  await fixture(async (root) => {
    const path = join(root, 'docs/backend/sdk.md');
    await writeFile(path, '# ' + '界'.repeat(Math.ceil(MAX_DOCUMENT_BYTES / 3)), 'utf8');
    await assert.rejects(buildGuideSnapshot(root), /backend\/sdk.*100至131072/);
    await writeFile(path, '# ' + 'x'.repeat(100), 'utf8');
    await writeFile(join(root, 'docs/frontend/sdk.md'), '# ' + 'x'.repeat(MAX_DOCUMENT_BYTES - 2), 'utf8');
    await assert.rejects(buildGuideSnapshot(root), /frontend\/sdk.*100至131072/);
  });
});

test('总预算包含JSON转义和元数据，不能用十六篇各自合格绕过2MiB限制', async () => {
  await fixture(async (root) => {
    const body = '# ' + 'x'.repeat(MAX_DOCUMENT_BYTES - 2);
    const combinedTail = '# 补充\n';
    for (const target of ['frontend', 'backend']) {
      for (const topic of GUIDE_TOPICS) {
        const content = target === 'frontend' && topic === 'sdk'
          ? body.slice(0, MAX_DOCUMENT_BYTES - 2 - Buffer.byteLength(combinedTail, 'utf8'))
          : body;
        await writeFile(join(root, 'docs', target, `${topic}.md`), content, 'utf8');
      }
    }
    await writeFile(join(root, 'docs/frontend/composition.md'), combinedTail, 'utf8');
    await assert.rejects(buildGuideSnapshot(root), /2MiB总预算/);
  });
});
