# 指南在线更新与发布

MCP协议入口和工具目录继续由DeviceForge宿主管理。在线更新只切换开发指南资料，不更新宿主、SDK、构建工具或业务插件，也不改变任何功能的可调用范围。

普通指南查询继续使用`deviceforge.get_plugin_development_guide`，参数仍是`target`与可选`topic`。查询本身不联网获取最新资料、不创建业务任务；开发者读取的是宿主当前接受的完整快照。支持在线更新的新宿主另提供`deviceforge.update_plugin_development_guide`，实际可用状态以该宿主的MCP工具目录为准，不能假设部署前的旧宿主已经具备此功能。

调用更新工具时必须明确选择动作，工具不接受下载地址或本机路径：

```json
{"action": "update"}
```

更新完成后应核对返回的实际采用版本、摘要和来源。需要退回该宿主内置知识时，调用同一工具：

```json
{"action": "reset"}
```

`reset`不联网，不卸载插件，不重放业务操作。指南查询响应外层的`guide_source`、`guide_revision`和`guide_diagnostics`说明当前资料来源、内容身份及诊断；文档项仍仅有`target/topic/content`。更新和恢复均不创建业务Job。

## 生成唯一快照

在本SDK仓库执行：

```powershell
npm run pack:guide
```

命令只使用Node.js标准库，不需要先构建或安装SDK，不访问宿主目录，也不联网。它读取公开指南库的`GUIDE_VERSION`，再读取两端各八个主题；前端`sdk`正文按`SDK正文 + 两个换行 + 组合说明`拼接。固定顺序为`frontend`、`backend`，各自依次为`overview`、`manifest`、`sdk`、`lifecycle`、`examples`、`packaging`、`dependencies`和`validation`。

生成文件为`guides/plugin-guide.json`，结构如下：

```json
{
  "format_version": 1,
  "compatibility_version": 5,
  "guide_version": 5,
  "content_sha256": "文档数组确定性序列化后的64位小写十六进制SHA-256",
  "documents": [
    {"target": "frontend", "topic": "overview", "content": "完整Markdown正文"}
  ]
}
```

示例省略了其余文档，真实资料包必须完整包含十六项。每个文档项仅有`target/topic/content`，不返回宿主源码位置或文档物理地址。正文必须是无BOM的有效UTF-8，每篇100至131072字节，最终JSON文件最多2MiB；缺文件、空白正文、无效版本或超预算均拒绝生成，并保留既有生成物。

`content_sha256`的输入是`JSON.stringify(documents)`的UTF-8字节，字段顺序为`target`、`topic`、`content`，不是排版后的整个JSON。生成命令同时返回完整文件的字节数和`sha256`，用于交付核对；完整文件摘要不能填入`content_sha256`。

## 兼容与离线行为

当前知识和兼容基线均为5。只修正文措辞、补充现有能力示例或更正材料入口时，保持兼容基线，内容摘要会自然变化。新增宿主能力或改变开发契约时，需要提高相应兼容基线，并由支持该能力的新宿主明确接受；不能用在线文字更新让旧宿主假装具有新接口。

宿主保留编译期指南作为离线基线，可使用此前完整验证并保存的缓存。更新失败、断网、超时、超限、摘要不符或不兼容时，继续使用原来可用的完整内容，不能把新旧主题拼在一起，也不能以旧内容冒充更新成功。一次更新不影响已运行的插件和业务作业。

## 发布与获取

生成后先审阅正文和快照，并运行直接相关单元：

```powershell
node --test scripts/tests/guide-snapshot.test.mjs
```

官方计划使用以下原始文件入口分发完整快照：

```text
https://raw.githubusercontent.com/CitricAcidCandy/DeviceForge-SDK/main/guides/plugin-guide.json
```

维护者将正文、快照生成器、直接单元和重新生成的快照一起审阅并发布；提交推送后必须匿名下载上述入口，核对完整字节及摘要，再宣布可获取。也可以用该次完整 Git 修订的原始文件地址取得固定版本。生成本地快照、提交或推送的任何一步都不能代替公开下载核验；运行宿主还需显式 update，或升级到含新内置正文的发行。

本次资料补充了单端／复合发布识别、保留组件 ID、旧安装显式迁移预检／确认、contracts 0.1.1 获取渠道和固定输出覆盖规则；清单版本、指南格式及兼容基线仍为现有值。这些内容按当前公开接口讲解可选能力，并没有让旧宿主承诺支持新接口。迁移必须先核对所用 CLI 与宿主，普通启动不触发迁移。

已公开的`v0.1.0`标签和七份附件保持原字节，不移动标签、不覆盖附件。指南资料与SDK二进制分别发布；本次不发布npm或crates.io，也不要求第三方开发者取得宿主源码。
