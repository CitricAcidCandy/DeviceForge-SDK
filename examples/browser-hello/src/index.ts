import type { WebPlugin } from '@deviceforge/plugin-sdk';

interface Identity { readonly id: string; readonly version: string }

export default function hello(identity: Identity): WebPlugin {
  return {
    id: identity.id,
    version: identity.version,
    apiVersion: 2,
    panels: [],
    contributions: {
      modules: [{
        id: `${identity.id}.hello`,
        title: 'SDK问候',
        route: 'hello',
        async mount(target, context) {
          context.signal.throwIfAborted();
          const root = target.ownerDocument.createElement('section');
          root.className = 'flex min-h-0 flex-col gap-3 p-6';
          const title = target.ownerDocument.createElement('h1');
          title.className = 'text-xl font-semibold';
          title.textContent = '插件已通过公开SDK加载';
          const input = target.ownerDocument.createElement('input');
          input.className = 'rounded border px-3 py-2';
          input.setAttribute('aria-label', '本实例草稿');
          input.placeholder = '切换页面后可核对本实例草稿';
          root.append(title, input);
          target.append(root);
          return () => root.remove();
        },
      }],
    },
  };
}
