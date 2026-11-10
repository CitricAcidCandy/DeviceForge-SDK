# 开发材料获取与配套版本

公开仓库为`https://github.com/CitricAcidCandy/DeviceForge-SDK`，发行入口为`https://github.com/CitricAcidCandy/DeviceForge-SDK/releases`。仓库创建、源码推送和附件上传各是独立动作，应以实际可访问状态及发行清单为准。没有真实附件时，不将包名或发行入口描述成已交付下载。

## 所需材料

| 开发目标 | 材料 | 使用方式 |
| --- | --- | --- |
| Rust服务器插件 | `apk-plugin-sdk`、`deviceforge-plugin-runtime`及`deviceforge-plugin-dependencies` | 使用本仓库Rust工作区或发行的公共库源码包；不依赖宿主源码 |
| 浏览器插件 | `deviceforge-plugin-sdk-0.1.0.tgz` | 在自己的工程作为开发依赖安装，包内包含ESM和类型 |
| 浏览器构建与共享契约 | `deviceforge-plugin-tools-0.1.1.tgz` | 安装后调用公开构建/契约生成函数 |
| HTTP类型消费 | `deviceforge-contracts-0.1.0.tgz` | 按需安装，只读公开生成类型 |
| 打包与部署 | 适合本机平台、帮助中含`plugin pack`的DeviceForge CLI | 从已验证发行物取得，生成格式2离线包；CLI实现不在本SDK仓库重复维护 |

SDK库版本、浏览器`apiVersion`、Rust任务协议和离线包格式是不同的版本维度。发布清单应分别声明具体版本、适用平台、Node/Rust要求、文件字节数、SHA-256、下载位置及配套依赖。

浏览器工具链需要包内声明的Vite、React编译插件、Tailwind、Rolldown等第三方依赖；SDK完整UI类型的配套依赖以包内`peerDependencies`为准。TGZ本身不是全部第三方依赖的离线镜像，需要完全离线开发时应另行准备锁定版本的依赖缓存。

## 使用已取得的TGZ

```powershell
npm install --save-dev ./vendor/deviceforge-plugin-sdk-0.1.0.tgz ./vendor/deviceforge-plugin-tools-0.1.1.tgz
```

包已公开发行到registry前，不能将上述命令替换为无渠道说明的包名安装。SDK TGZ不安装到DeviceForge插件市场；安装市场的是根据自己的`manifest.json`生成的完整业务插件包。

## 从源码使用

本仓库的Rust和浏览器公共包能够独立构建。先按根README准备各端依赖，再运行对应公开包的构建与打包命令；不要求访问宿主源码、运行宿主生成器、启动宿主服务或连接设备。

示例目录提供浏览器问候、Node协议1前后端配套；Rust协议4工程在`rust/examples/protocol4-echo`。其中客户端示例只有用户明确操作时才提交业务，查询任务终态不会自动重放未知提交。
