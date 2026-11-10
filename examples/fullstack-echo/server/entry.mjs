// 标准输出仅写协议；示例不创建外部工具、文件或设备资源。
const LIMIT = 512 * 1024;
async function readRequest() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > LIMIT) throw new Error('请求超过限额');
    chunks.push(chunk);
  }
  const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (request?.protocol_version !== 1 || typeof request.request_id !== 'string' ||
      request.request_id.length === 0 || request.request_id.length > 128)
    throw new Error('协议或请求身份无效');
  return request;
}
function execute(request) {
  const input = request.input;
  if (request.operation !== 'echo' || input === null || typeof input !== 'object' ||
      Array.isArray(input) || Object.keys(input).length !== 1 ||
      typeof input.message !== 'string' || [...input.message].length > 1000)
    throw new Error('操作或输入不符合示例契约');
  return { message: input.message };
}
try {
  const request = await readRequest();
  const response = { protocol_version: 1, request_id: request.request_id };
  try { response.result = execute(request); }
  catch { response.error = '操作或输入不符合示例契约'; }
  process.stdout.write(`${JSON.stringify(response)}\n`);
} catch {
  process.stderr.write('SDK示例请求解析失败\n');
  process.exitCode = 1;
}
