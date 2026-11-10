# 公开异步插件运行库

`deviceforge-plugin-runtime@0.1.0`依赖公开SDK、Tokio、tokio-util及JSON；Windows标准流准备另使用windows-sys的句柄和控制台接口。它不引用宿主领域、用例、存储或HTTP，不执行业务设备操作。

在SDK仓库根运行`cargo test --locked -p deviceforge-plugin-runtime`，或运行[独立协议4示例](../examples/protocol4-echo/README.md)。开发流程与线格式见[SDK指南](../../docs/backend/sdk.md)及[生命周期](../../docs/backend/lifecycle.md)。

## 入口

| 入口 | 处理器与行为 |
| --- | --- |
| serve_once / serve_io | 协议3，请求及合作取消信号，返回Execution |
| serve_once_with_context / serve_io_with_context | 协议4，请求及InvocationContext，Ready/Start后进入处理器 |
| serve_session / serve_session_io | 协议5，独立交互会话与有界输入/输出 |
| serve_once_with_services / serve_io_with_services | 协议6，通过宿主双向帧消费精确版本公共服务 |

标准流入口在Windows准备有效句柄并撤销可继承位，防止派生工具持有协议管道阻止EOF；可注入I/O入口不改变进程全局句柄。

协议4在发送Ready前固定单调时钟C0，再按唯一Start的剩余预算形成同一截止点。等待Start消耗原预算，0不重新授予时间。InvocationContext.check区分取消和到期，两者同时发生时到期优先；deadline()始终返回原截止点，cancellation()返回共享信号。

## 有界传输与真实清理

请求上限512KiB，控制与握手帧上限4KiB，响应上限1MiB。传输先限制缓冲再读取，末帧按写入、显式刷新、关闭输出的顺序提交。会话逐块、累计和队列上限另见[会话模块](src/session/README.md)。

stdin关闭、取消、坏控制或期限到达会通知业务处理器。运行库继续等待已开始的处理器真正返回Execution，不丢弃Future伪造成功。仅在所有自有资源已清理时返回Execution::complete；未确认或清理失败使用CleanupOutcome::Failed。晚到成功不得覆盖取消或到期结果，原清理声明仍保留。

调用方丢弃运行入口、输出失败或直接进程退出都不构成外部资源已释放的证明。资源互斥、业务副作用、后台恢复和真机效果由所属业务插件处理。
