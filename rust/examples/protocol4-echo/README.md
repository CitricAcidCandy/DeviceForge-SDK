# Rust 协议4回显示例

本示例仅依赖本SDK仓库中的公共Rust库，不读取宿主源码。它接受局部操作`echo`，输入`{"message":"你好"}`，返回同一消息；没有设备、网络、文件或后台资源副作用。

在SDK仓库根目录执行：

```powershell
cargo build --locked -p deviceforge-protocol4-echo
```

生成的可执行文件是协议4插件，需要通过Ready/Start握手调用，不能将普通JSON请求直接通过管道当作完整协议。直接验证握手可执行：

```powershell
cargo run --locked -p deviceforge-protocol4-echo --example protocol4-smoke
```

Windows还可以启动刚构建的真实子进程验证标准输入/输出握手，脚本只回收自己启动的示例进程：

```powershell
./rust/examples/protocol4-echo/verify.ps1
```

实际部署使用同目录的`manifest.json`及公开CLI：

```powershell
New-Item -ItemType Directory -Path rust/examples/protocol4-echo/dist -Force | Out-Null
Copy-Item -LiteralPath target/debug/deviceforge-protocol4-echo.exe -Destination rust/examples/protocol4-echo/dist/deviceforge-protocol4-echo.exe
deviceforge plugin pack rust/examples/protocol4-echo/manifest.json --out dist-protocol4-echo --platform win32-x64
```

先完成构建，再打包；跨平台时按目标平台编译并更新清单入口。取消和到期由公共运行库处理；本示例没有资源清理工作，使用`Execution::complete`明确返回清理已完成。
