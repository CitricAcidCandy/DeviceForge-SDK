# 浏览器问候

此工程只引用公开SDK类型与构建工具，不读取宿主源码，不请求网络或设备。插件加载后贡献自己的页面；卸载释放所属DOM，页面输入属于当前实例。

在SDK根目录完成依赖安装和公共包构建后，在本目录执行：

```powershell
npm install --ignore-scripts
npm run build
deviceforge plugin pack manifest.json --out release-package --platform win32-x64
```

本示例不属于SDK根npm工作区，必须在本目录完成独立安装。初次没有锁文件，安装后保留生成的`package-lock.json`；以后可用`npm ci --ignore-scripts`复现该版本集合。包内声明的第三方依赖仍需正常npm渠道或完整离线缓存。

输出目录必须尚不存在，换平台时使用CLI实际支持的目标值。`deviceforge`来自另行取得的CLI发行，不是本SDK仓库隐式安装的命令。

工程复制到别处时，先将`package.json`的两个本地公开依赖改为已取得的TGZ位置，再安装依赖和构建。`dist/browser`与打包产物为生成物，不手工编辑。
