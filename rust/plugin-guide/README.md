# 插件开发指南库

本库把独立SDK仓库维护的公开开发指南编译为静态字符串，供HTTP/MCP宿主和独立文档消费者使用，不依赖宿主源码、运行目录、环境变量或网络请求。

`GUIDE_VERSION`表示知识版本。`frontend`和`backend`模块分别公开八个主题常量：`OVERVIEW`、`MANIFEST`、`SDK`、`LIFECYCLE`、`EXAMPLES`、`PACKAGING`、`DEPENDENCIES`和`VALIDATION`。前端`SDK`正文直接包含开放组合补充内容，不增加请求主题或文档条目。

唯一维护源仍是本仓库的`docs/frontend`和`docs/backend`，本库通过编译期引用嵌入，不复制维护第二份正文。通过公开Git依赖固定完整修订取得本仓库，Cargo会一并取得指南来源；本库尚未发布crates.io。宿主构建后，指南随宿主程序交付，运行时不要求保留SDK检出或指南文件。
