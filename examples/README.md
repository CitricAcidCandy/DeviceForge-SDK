# 独立插件示例

- [浏览器问候](browser-hello/README.md)：只依赖公开SDK和构建工具，贡献插件页面，不执行服务器任务。
- [前后端回显](fullstack-echo/README.md)：一份清单包含浏览器与Node协议1组件，演示显式提交、任务查询和取消。
- Rust协议4工程位于`rust/examples/protocol4-echo`，使用公开运行库处理Ready/Start、期限和取消。

先按SDK根README安装并构建公共浏览器包，再在所选示例目录执行`npm install --ignore-scripts`和`npm run build`。根工作区不包含示例，不能省略示例自己的依赖安装。示例没有预置锁文件，首次安装会生成该工程的`package-lock.json`；需要固定重复构建时保留此锁文件并改用`npm ci --ignore-scripts`。

示例使用本仓库公共包的本地依赖；复制到其他独立工程时，将`file:`依赖改为自己取得的TGZ位置。TGZ的配套第三方依赖通过正常npm渠道获取，不表示已备齐完全离线缓存。

只维护示例自己的`manifest.json`。生成的组件清单、市场资料和格式2离线包由公开CLI创建；不要手工维护第二份组件身份和版本。
