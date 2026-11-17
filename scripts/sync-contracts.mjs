import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const destination = fileURLToPath(new URL('../browser/contracts/api.d.ts', import.meta.url));
const banner = '// 此文件从 Rust 公开接口模式生成，请通过 npm run generate:api 更新。\n';

export async function syncContracts(source, target = destination) {
  const input = resolve(source);
  const output = resolve(target);
  if (input === output) throw new Error('生成来源不能与 SDK 声明目标相同');
  const bytes = await readFile(input);
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error('生成来源必须为有效 UTF-8');
  }
  if (!content.startsWith(banner)
    || !content.includes('export interface paths {')
    || !content.includes('export interface components {'))
    throw new Error('来源必须是正式 generate:api 生成的完整公开声明，不接受手写 DTO 或模式补丁');
  const previous = await readFile(output).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  const changed = !previous?.equals(bytes);
  if (changed) await writeFile(output, bytes);
  return { changed, bytes: bytes.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length !== 2 || argumentsList[0] !== '--source')
    throw new Error('用法：node scripts/sync-contracts.mjs --source <已完成正式生成的 generated.ts 绝对路径>');
  console.log(JSON.stringify(await syncContracts(argumentsList[1])));
}
