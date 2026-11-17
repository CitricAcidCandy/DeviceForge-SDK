# DeviceForge 公开接口契约

本开发包只包含从 Rust 公开 OpenAPI 同步的 TypeScript 类型，不含宿主实现、浏览器请求器、业务规则或 React。

插件通过 `import type { paths, components } from '@deviceforge/contracts/api'` 索引公开接口；实际通信使用 SDK 的公开传输能力并校验未知响应。类型不能代替运行时校验，也不能证明旧服务器已经支持新增接口。

`api.d.ts` 是派生产物，不手工编辑。宿主维护者先完成正式 `generate:api`，再在 SDK 仓库执行以下命令，逐字节同步生成结果；该同步命令只读取显式来源，不运行宿主、不修改宿主或已安装包。

```powershell
node scripts/sync-contracts.mjs --source G:/Rust/DeviceForge/frontend/src/services/api/generated.ts
```

上述宿主路径仅供维护者同步，不是第三方插件依赖。第三方通过[已公开发行的 TGZ](../../docs/distribution.md)安装类型包，无需访问宿主源码；包尚未在 npm registry 发行，不能直接按包名假设渠道存在。

迁移 API 的本地准备、真实归档消费验证与发布审批边界见[迁移契约发行准备](../../docs/contracts-migration-release.md)。本地源码更新或同版本审核 TGZ 不会更新宿主锁定的公开附件。
