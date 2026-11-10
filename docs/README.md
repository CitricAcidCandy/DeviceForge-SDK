# 插件开发指南

本目录是公开插件开发知识的唯一正文来源。指南按浏览器、服务器两端以及八个主题组织；`frontend/composition.md` 作为浏览器SDK主题的补充正文。宿主MCP在编译时嵌入这些文件，运行时不需要读取本仓库，也不接受调用者文件路径。

| 主题 | 浏览器 | 服务器 |
| --- | --- | --- |
| 总览 | [开发流程](frontend/overview.md) | [开发流程](backend/overview.md) |
| 单一清单 | [清单与市场资料](frontend/manifest.md) | [清单与市场资料](backend/manifest.md) |
| SDK | [浏览器接口](frontend/sdk.md)、[开放组合](frontend/composition.md) | [协议与运行库](backend/sdk.md) |
| 生命周期 | [贡献与资源归属](frontend/lifecycle.md) | [任务、取消与清理](backend/lifecycle.md) |
| 示例 | [完整代码](frontend/examples.md) | [完整代码](backend/examples.md) |
| 打包 | [浏览器构建](frontend/packaging.md) | [单清单与完整发布](backend/packaging.md) |
| 依赖 | [公共依赖消费](frontend/dependencies.md) | [工具与运行环境](backend/dependencies.md) |
| 调试与验收 | [浏览器调试](frontend/validation.md) | [服务器调试](backend/validation.md) |

获取方式及发行边界见[开发材料获取](distribution.md)，可运行工程见[独立示例](../examples/README.md)。
