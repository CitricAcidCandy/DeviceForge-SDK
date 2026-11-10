# DeviceForge SDK

面向独立插件开发者的公共契约、Rust运行库、浏览器构建工具、中文指南和可运行示例。开发插件无需取得DeviceForge宿主源码。

本仓库由DeviceForge工程的公开开发材料拆出；宿主继续使用同一份SDK，不维护第二份公共实现。CLI和宿主程序由DeviceForge工程发行，SDK发行材料会标明配套版本及取得方式。

## 目录

| 目录 | 内容 |
| --- | --- |
| rust/ | apk-plugin-sdk、deviceforge-plugin-runtime及其公共依赖 |
| browser/sdk/ | 浏览器SDK v2及其ESM/TypeScript发行构建 |
| browser/tools/ | 独立浏览器构建与服务契约生成工具 |
| browser/contracts/ | 公开HTTP接口生成类型快照 |
| docs/frontend/ | 浏览器插件开发指南 |
| docs/backend/ | 服务器插件开发指南 |
| examples/ | 独立浏览器及前后端配套示例 |
| rust/examples/ | Rust协议4示例 |

## 版本与获取

| 材料 | 版本 | 协议或要求 |
| --- | --- | --- |
| apk-plugin-sdk | 0.1.0 | 包含Rust任务协议4公共类型 |
| deviceforge-plugin-runtime | 0.1.0 | 合作取消、绝对期限及清理回执 |
| @deviceforge/plugin-sdk | 0.1.0 | 浏览器apiVersion 2 |
| @deviceforge/plugin-tools | 0.1.1 | Node.js 22.18以上 |
| @deviceforge/contracts | 0.1.0 | 公开HTTP类型快照 |
| @deviceforge/cli | 0.1.0 | 配套平台包，包含plugin pack及格式2离线包支持 |

浏览器SDK、Rust协议、CLI和离线包格式分别版本化，不能用其中一个版本号推断其他协议。

源码仓库：[CitricAcidCandy/DeviceForge-SDK](https://github.com/CitricAcidCandy/DeviceForge-SDK)。预编译开发包及版本清单见[发行页](https://github.com/CitricAcidCandy/DeviceForge-SDK/releases)；仅以发行页实际附件为准，源码标签不表示npm或crates.io已发布。

## 从源码准备开发包

需要Node.js 22.18以上和支持edition 2024的Rust工具链。在任意独立目录执行：

```powershell
git clone https://github.com/CitricAcidCandy/DeviceForge-SDK.git
cd DeviceForge-SDK
npm ci
npm run pack:browser
cargo test --locked -p apk-plugin-sdk -p deviceforge-plugin-runtime -p deviceforge-plugin-dependencies
cargo run --locked -p deviceforge-protocol4-echo --example protocol4-smoke
```

三个浏览器包生成到各自的`browser/<包>/dist/`。插件工程用`npm install <实际TGZ绝对路径>`安装需要的包；Rust工程通过本仓库`rust/`中的公共crate或完整源码归档声明路径依赖，不引用宿主工程。第三方依赖仍通过正常npm／Cargo渠道获取，不承诺源码归档自带完整离线缓存。

中文指南入口为[开发文档](docs/README.md)，示例见[examples](examples/)。浏览器SDK与构建工具可单独使用；打包格式2插件时，另安装与本机平台配套的DeviceForge CLI。

## 宿主开发时的目录

宿主工程与本仓库默认同级放置：

```text
Rust/
  DeviceForge/
  DeviceForge-SDK/
```

先在SDK仓库执行`npm ci`及`npm run pack:browser`，再安装宿主依赖。浏览器宿主消费公开包出口；Rust宿主消费三个公共crate；MCP指南在宿主编译时嵌入，不要求已发行程序运行时读取本仓库。

## 边界

- 插件通过公开契约接入，不导入宿主业务实现或访问宿主工程路径。
- 原生命周期、代次隔离、合作取消及资源清理语义保持。可信代码忽略取消不代表外部副作用已停止。
- 仅维护一份manifest.json；打包生成组件、市场与发布清单，不要求重复填写身份。
- 指南可读取与开发发行物可下载分别验证；任务结束但业务结果失败不算供应成功。
