# 插件公开协议

`apk-plugin-sdk@0.1.0`维护独立于宿主的版本化JSON协议、清单及纯数据模型，依赖serde、serde_json和同仓库的deviceforge-plugin-dependencies，不引用宿主领域、用例、存储或HTTP实现。

开发流程见[服务器指南](../../docs/backend/overview.md)、[公开SDK合同](../../docs/backend/sdk.md)及[单清单打包](../../docs/backend/packaging.md)。在SDK仓库根运行`cargo test --locked -p apk-plugin-sdk`，无需克隆宿主。

## 线协议与模型

| 协议 | 公开模型与用途 |
| --- | --- |
| 1 | Request/Response，单请求和单响应，保留旧字段省略语义 |
| 2 | ArtifactAccess/ArtifactContext/ArtifactOutput，授权输入副本和输出产物 |
| 3 | cooperative模块，开放输入流上的取消与显式清理确认 |
| 4 | context模块，Ready/Start握手和有界剩余预算 |
| 5 | session模块，独立交互会话、持续输入/输出、EOF和清理终态 |
| 6 | services模块，精确版本公共服务及双向服务帧 |

Response.result区分字段缺失和显式null；cleanup不能由进程退出或连接关闭推断。协议版本与库版本各自独立，未使用的新可选能力保持省略以兼容旧清单。

协议4的ReadyFrame和StartFrame严格核对版本、非空关联ID、命令及剩余纳秒预算，0表示到期。纯SDK不读取时钟、不依赖Tokio；固定期限、取消和实际传输由[公开运行库](../plugin-runtime/README.md)负责。[独立协议4示例](../examples/protocol4-echo/README.md)提供可运行验证。

## 能力与资源

Manifest可声明操作、配置、产物、设备、性能、恢复、会话及服务。身份和版本应从单一manifest生成，不在代码和市场资料中重复维护。公开服务使用稳定标识和精确字符串版本，不自动升级或猜测兼容版本。

`resources::managed_resources()`通过`DEVICEFORGE_PLUGIN_RESOURCES`读取本次发布的不可变托管资源；旧部署没有变量时返回None，描述损坏时明确报错，不静默回退。`configuration::managed_config_path()`读取本次调用的配置快照位置。本机路径仅供插件内部使用，不放入公开任务结果、日志或浏览器响应。

产物输入使用授权副本，输出仅写本次独占目录并声明文件名，由宿主核对后发布。清单可声明JSON Pointer输入选择器，不把任意服务器路径作为普通操作参数。

性能与设备模型保持纯验证，不能从平台名称、不可读值或空响应推断实际能力。[性能声明](src/performance.README.md)和[会话模型](src/session/README.md)说明相应边界。
