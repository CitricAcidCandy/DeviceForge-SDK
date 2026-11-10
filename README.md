# DeviceForge SDK

面向独立插件开发者的公共契约、Rust运行库、浏览器构建工具、中文指南和可运行示例。开发插件无需取得DeviceForge宿主源码。

本仓库由DeviceForge工程的公开开发材料拆出；宿主继续使用同一份SDK，不维护第二份公共实现。CLI和宿主程序由DeviceForge工程发行，SDK发行材料会标明配套版本及取得方式。

## 目录

| 目录 | 内容 |
| --- | --- |
| rust/ | apk-plugin-sdk、deviceforge-plugin-runtime、指南正文库及其公共依赖 |
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

源码仓库：[CitricAcidCandy/DeviceForge-SDK](https://github.com/CitricAcidCandy/DeviceForge-SDK)。[v0.1.0 发行](https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/tag/v0.1.0)已有七份可下载附件，完整直链、大小、SHA-256及平台说明见[开发材料获取](docs/distribution.md)。尚未发布 npm／crates.io。

正常插件工程直接安装固定发行 URL，无需先构建本 SDK 或将它放在宿主旁边：

```powershell
npm install --save-dev https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/v0.1.0/deviceforge-plugin-sdk-0.1.0.tgz https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/v0.1.0/deviceforge-plugin-tools-0.1.1.tgz
```

Rust 工程用公开 Git 地址及固定完整修订声明依赖，示例见[服务器 SDK 指南](docs/backend/sdk.md)。两种方式均需正常获取各自清单声明的第三方依赖，公开归档不含完整离线缓存。

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

## 宿主消费方式

宿主的浏览器包通过固定 HTTPS TGZ 与锁文件消费，Rust 公共库及 `deviceforge-plugin-guide` 通过公开 Git 地址和完整修订消费。宿主正常构建不要求相邻 SDK 目录、源码路径别名或本仓库预先生成 `lib/dist`。只有修改 SDK 自身时才需要单独检出本仓库。

`deviceforge-plugin-guide` 在自身编译时嵌入公开正文，宿主不再从开发机目录定位文档。新正文知识版本为5；已运行程序仍返回其编译时版本，更新源码不等于运行服务已经更新。公开 v0.1.0 标签及附件保持不可变，指南及宿主依赖修复由后续固定 Git 修订提供。

## 边界

- 插件通过公开契约接入，不导入宿主业务实现或访问宿主工程路径。
- 原生命周期、代次隔离、合作取消及资源清理语义保持。可信代码忽略取消不代表外部副作用已停止。
- 仅维护一份manifest.json；打包生成组件、市场与发布清单，不要求重复填写身份。
- 指南可读取与开发发行物可下载分别验证；任务结束但业务结果失败不算供应成功。
