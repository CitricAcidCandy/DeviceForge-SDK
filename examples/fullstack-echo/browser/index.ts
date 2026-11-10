import type { HostContext, WebPlugin } from '@deviceforge/plugin-sdk';

interface Identity { readonly id: string; readonly version: string }

async function mount(target: HTMLElement, context: HostContext) {
  const lifetime = new AbortController();
  const signal = AbortSignal.any([context.signal, lifetime.signal]);
  const document = target.ownerDocument;
  const root = document.createElement('section');
  root.className = 'flex min-h-0 flex-col gap-3 p-6';
  const title = document.createElement('h1');
  title.className = 'text-xl font-semibold';
  title.textContent = '前后端回显';
  const input = document.createElement('textarea');
  input.className = 'min-h-24 rounded border px-3 py-2';
  input.setAttribute('aria-label', '回显消息');
  const output = document.createElement('pre');
  output.className = 'max-h-64 overflow-auto whitespace-pre-wrap text-sm';
  output.setAttribute('role', 'status');
  output.textContent = '输入消息后明确提交，再查询任务结果。';
  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap gap-2';
  const buttons = ['提交', '查询任务', '取消任务'].map((text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.className = 'rounded border px-3 py-2';
    actions.append(button);
    return button;
  });
  const [submit, query, cancel] = buttons;
  if (!submit || !query || !cancel) throw new Error('示例按钮初始化失败');
  let jobId: string | null = null;
  let busy = false;
  async function run(action: () => Promise<void>) {
    if (busy || signal.aborted) return;
    busy = true;
    for (const button of buttons) button.disabled = true;
    try {
      await action();
    } catch (error) {
      if (!signal.aborted) output.textContent = error instanceof Error ? error.message : '操作结果未确认，请查询后再决定是否重试。';
    } finally {
      busy = false;
      if (!signal.aborted) for (const button of buttons) button.disabled = false;
    }
  }
  submit.addEventListener('click', () => {
    void run(async () => {
      if ([...input.value].length > 1000) throw new Error('消息不能超过1000个字符');
      const response = await context.submit('plugin.sdk_fullstack_echo.server.echo', { message: input.value }, signal);
      signal.throwIfAborted();
      jobId = response.data.id;
      output.textContent = `任务 ${jobId}：${response.data.status}，请查询最终结果。`;
    });
  }, { signal });
  query.addEventListener('click', () => {
    void run(async () => {
      if (!jobId) throw new Error('尚无可查询的任务');
      const response = await context.getJob(jobId, signal);
      signal.throwIfAborted();
      output.textContent = JSON.stringify(response.data, null, 2);
    });
  }, { signal });
  cancel.addEventListener('click', () => {
    void run(async () => {
      if (!jobId) throw new Error('尚无可取消的任务');
      const response = await context.cancelJob(jobId, signal);
      signal.throwIfAborted();
      output.textContent = JSON.stringify(response.data, null, 2);
    });
  }, { signal });
  root.append(title, input, actions, output);
  target.append(root);
  return () => {
    // 卸载只撤销本地等待，已接受任务须按原任务身份显式查询或取消。
    lifetime.abort();
    root.remove();
  };
}

export default function fullstack(identity: Identity): WebPlugin {
  return {
    id: identity.id,
    version: identity.version,
    apiVersion: 2,
    panels: [],
    contributions: {
      modules: [{
        id: `${identity.id}.echo`,
        title: '前后端回显',
        route: 'echo',
        mount,
      }],
    },
  };
}
