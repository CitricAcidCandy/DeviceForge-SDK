# 前后端回显

一份`manifest.json`包含浏览器和Node协议1服务器组件。浏览器只引用公开SDK；服务器无npm依赖，不创建外部资源。两端身份、版本和市场资料由同一清单生成。

在SDK根目录完成公共包安装和构建后，在本目录执行：

```powershell
npm install --ignore-scripts
npm run build
deviceforge plugin pack manifest.json --out release-package --platform win32-x64
```

本示例不属于SDK根npm工作区，必须在本目录完成独立安装。初次没有锁文件，安装后保留生成的`package-lock.json`；以后可用`npm ci --ignore-scripts`复现该版本集合。包内声明的第三方依赖仍需正常npm渠道或完整离线缓存。

`release-package`必须尚不存在。使用另行取得、帮助包含`plugin pack`的CLI；不要假设公共registry已有CLI。本例的两组件入口均为`any`，所选运行环境仍须有兼容Node.js。

只核对服务器协议可执行：

```powershell
'{"protocol_version":1,"request_id":"sdk-example","operation":"echo","input":{"message":"你好"}}' | node server/entry.mjs
```

成功响应应保留协议和请求ID，`result.message`为原消息。此项不代表宿主安装或跨端调用通过。通过正常插件安装入口安装完整离线ZIP后，页面中的“提交”才会创建实际任务，随后明确查询终态或取消；`queued/running`不当业务成功，未知提交不自动重放。

卸载只停止本地等待，不假设已接受的服务器任务被回滚。输入草稿属于当前挂载实例；可用性、任务历史、日志及热装卸须在目标宿主独立验收。复制工程时将本地SDK/工具依赖改为自己取得的TGZ，不访问宿主源码。
