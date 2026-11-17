import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const GUIDE_TOPICS = Object.freeze([
  'overview', 'manifest', 'sdk', 'lifecycle', 'examples', 'packaging',
  'dependencies', 'validation',
]);
export const MAX_DOCUMENT_BYTES = 131_072;
export const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const repository = fileURLToPath(new URL('../', import.meta.url));

async function text(path) {
  const bytes = await readFile(path);
  let content;
  try {
    // 先核对原始字节，避免解码器自动吞掉BOM后误收文件。
    if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])))
      throw new Error('存在BOM');
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('指南来源必须为不含BOM的有效UTF-8');
  }
  if (content.includes('\uFEFF')) throw new Error('指南来源不能包含BOM');
  return content;
}

function version(source) {
  const match = /^pub const GUIDE_VERSION:\s*u32\s*=\s*(\d+);\s*$/m.exec(source);
  const value = match ? Number(match[1]) : 0;
  if (!Number.isInteger(value) || value < 1 || value > 4_294_967_295)
    throw new Error('公开指南库必须声明有效的GUIDE_VERSION');
  return value;
}

/** 只读取唯一正文源并返回数据，不联网、不运行代码、不写入文件。 */
export async function buildGuideSnapshot(root = repository) {
  const guideVersion = version(await text(join(root, 'rust/plugin-guide/src/lib.rs')));
  const documents = [];
  for (const target of ['frontend', 'backend']) {
    for (const topic of GUIDE_TOPICS) {
      let content = await text(join(root, 'docs', target, `${topic}.md`));
      if (target === 'frontend' && topic === 'sdk')
        content += '\n\n' + await text(join(root, 'docs/frontend/composition.md'));
      const bytes = Buffer.byteLength(content, 'utf8');
      if (bytes < 100 || bytes > MAX_DOCUMENT_BYTES || !content.trim())
        throw new Error(`指南正文${target}/${topic}必须为100至131072个UTF-8字节`);
      documents.push({ target, topic, content });
    }
  }
  const snapshot = {
    format_version: 1,
    compatibility_version: guideVersion,
    guide_version: guideVersion,
    content_sha256: createHash('sha256')
      .update(JSON.stringify(documents), 'utf8').digest('hex'),
    documents,
  };
  // 总预算使用最终发布字节，不能只累计Markdown而忽略JSON转义和元数据。
  snapshotBytes(snapshot);
  return snapshot;
}

export function snapshotBytes(snapshot) {
  const bytes = Buffer.from(JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  if (bytes.length > MAX_SNAPSHOT_BYTES) throw new Error('指南快照超过2MiB总预算');
  return bytes;
}

/** 构建成功后才替换生成物；校验失败时不触碰既有快照。 */
export async function writeGuideSnapshot(root = repository) {
  const snapshot = await buildGuideSnapshot(root);
  const bytes = snapshotBytes(snapshot);
  const path = join(root, 'guides/plugin-guide.json');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  return {
    path,
    bytes: bytes.length,
    guide_version: snapshot.guide_version,
    compatibility_version: snapshot.compatibility_version,
    content_sha256: snapshot.content_sha256,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    documents: snapshot.documents.length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(await writeGuideSnapshot(), null, 2));
