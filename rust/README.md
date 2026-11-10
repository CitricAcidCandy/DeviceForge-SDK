# Rust 公共SDK与运行库

本目录的三份公共库属于本SDK仓库的Cargo工作区，源码和测试均已从宿主工程迁出，没有宿主私有模块依赖。

| 包 | 版本 | 职责 | 直接第三方依赖 |
| --- | --- | --- | --- |
| apk-plugin-sdk | 0.1.0 | 协议、清单、能力和纯数据模型 | serde、serde_json及本仓库依赖模型 |
| deviceforge-plugin-runtime | 0.1.0 | 协议3/4/5/6异步传输、取消、期限和清理确认 | serde、serde_json、Tokio、tokio-util；Windows另有windows-sys |
| deviceforge-plugin-dependencies | 0.1.0 | 独立依赖声明、版本与纯规则 | serde、serde_json、schemars、semver、regex |

根目录`Cargo.lock`固定依赖解析结果。首次构建仍需获取其中的第三方依赖，锁文件不等于完整离线缓存；需要完全离线时，先通过自己的可信Cargo镜像或供应渠道备齐对应依赖。

独立克隆本仓库后可直接执行：

```powershell
cargo test --locked -p apk-plugin-sdk -p deviceforge-plugin-dependencies -p deviceforge-plugin-runtime
cargo build --locked -p deviceforge-protocol4-echo
cargo run --locked -p deviceforge-protocol4-echo --example protocol4-smoke
./rust/examples/protocol4-echo/verify.ps1
```

[协议4示例](examples/protocol4-echo/README.md)包含可运行握手校验、单一开发清单及显式CLI打包步骤。公开开发合同见[后端SDK指南](../docs/backend/sdk.md)和[生命周期指南](../docs/backend/lifecycle.md)。

库版本、浏览器SDK版本和线协议版本分别独立。协议4使用Ready/Start及固定期限，不能把普通协议1请求直接发给协议4插件。关闭等待不表示外部资源已释放；仅在自有资源清理完成后返回`Execution::complete`。
