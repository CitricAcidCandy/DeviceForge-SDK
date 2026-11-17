# 迁移契约发行准备

## 2026-11-17 发行执行授权

用户已经明确授权本文列出的九文件审核提交、独立 `contracts-v0.1.1` 标签推送、三附件公开发行，以及公开下载核验后的宿主固定 HTTPS 依赖、锁文件与迁移 HTTP 工厂接线。现有 Git 凭据可用，无需用户另外提供凭据。执行时使用 GitHub 官方 REST API 创建独立 Release 并上传附件；不提交指南等无关改动，不推送工作分支，不改变旧发行。

下文“尚未授权／未发布／未采用”及 15:26 状态均为授权前审核快照，保留用于说明包身份和验证边界；不作为重新请求授权的条件。真实发行状态以 `contracts-v0.1.1` 的公开 Release、源码提交、三附件及独立下载校验为准。

发行前将 README 和包元数据统一为仓库规定的 LF，避免 Git 提交规范化后与归档字节不同。公开包为 19,510 字节，SHA-256 `98939aa871cc833d7acf5f83dcbcb6d64eab67be79b9e16bf322186b293e100d`，SHA-512 完整性为 `sha512-18jJO1GdFp3ngV37PMYrFqHSFEqAe4mxGndWpn65w5PSyBzzKKXWXu50Moz+R0rmdrU9bOuDLV3zU4HoCSAMjQ==`。声明本身不变，仍为 566,374 字节及下文声明摘要；19,523 字节旧审核包的身份仅作历史。提交后校验脚本会逐成员比对真实 Git blob，而不只依据工作区无改动推断源码一致。

## 本次边界与决策

本次只准备公开 HTTP 声明、直接单元、真实 TGZ 与消费专项。主协调根据用户实现授权作必要的常规选择，将本地 contracts 准备为 0.1.1，只修改该包及根锁对应版本；不表述为用户最初点名要求该版本。不改变其他组件版本、第三方依赖或宿主文件，不提交、推送、上传、移动标签或发布。SDK 既有指南相关改动保留，不混入本次写集。

采用 `plan-and-build`，按生成契约驱动验证：先确认 Rust／OpenAPI 的必填可空规则，再从主维护者最终生成结果逐字节同步；不手写 DTO，也不在 SDK 单独补丁化生成类型。另一条本机别名替换生产依赖的路径不符合固定公开消费要求，不采用。

| 单元 | 职责与输入输出 | 副作用边界 |
| --- | --- | --- |
| `scripts/sync-contracts.mjs` | 显式读取正式 `generated.ts`，原字节同步至 `browser/contracts/api.d.ts` | 只写 SDK 声明；不导出 OpenAPI、不改宿主、不改版本 |
| `scripts/tests/sync-contracts.test.mjs` | 验证原字节同步、重复同步、无效来源与旧目标保护 | 只使用固定 `artifacts/contracts-sync-tests`，用后删除自有文件 |
| `scripts/tests/fixtures/contracts-migration.ts` | 由公开 `paths/components` 索引类型，校验必填可空修订、两条路径、确认输入和 Job 输出 | 不定义第二份 DTO，不发送请求 |
| `scripts/verify-contracts-package.mjs` | 核对 npm 真实 TGZ 三成员及源字节，生成审核清单和独立消费夹具 | 只写固定 `artifacts/contracts`；不改任何 `node_modules` |

现有发行职责保持：宿主维护者拥有 Rust／OpenAPI 和正式生成器；SDK 拥有公开声明快照；生产宿主只通过真实公开 HTTPS 附件及锁文件消费。没有混合业务实现需要拆分。

## 可空性核查与最终来源

2026-11-17 只读核查发现：领域 `MigrationConfiguration.revision` 为 `Option<String>`，带 `#[serde(deserialize_with = "required_revision")]` 与 `#[schemars(required)]`；应用在没有服务器／浏览器配置记录时写入 `None`，设计规定字段必须存在、值为 `string | null`。OpenAPI 直接由该 Rust 类型经 schemars 的 draft2020_12 模式生成，无独立手写 DTO。

当时宿主 `generated.ts` 的 `PluginMigrationPlan`、`PluginMigrationRequest` 及两条路径内联配置修订均只有 `string`，因此没有同步错误版本。主维护者随后交付修复后重新生成的最终文件，已于本轮原字节同步。主维护者报告生成器正文成功，随后已安装公开 TGZ 的只读一致性比对预期退出 1；本次不把整条生成命令描述为退出 0，也不代改宿主或运行其生成命令。

最终同步须以主维护者明确交付的生成文件为准，专项消费必须同时证明四处配置修订为 `string | null` 且字段仍为必填。仅声明字段是 `Option` 或旧单元通过，不等于最终 OpenAPI 与生成类型已正确。

## 正式生成链与本地命令

宿主正式入口为 `frontend` 目录的 `npm run generate:api`，依次调用：

1. `cargo run --quiet --manifest-path G:/Rust/DeviceForge/backend/Cargo.toml -p apk-server --bin export-openapi`。
2. 已安装的 `openapi-typescript` 生成 AST，`astToString` 转换，去上游块注释和行尾空白，加入中文生成标识。
3. 写宿主 `frontend/src/services/api/generated.ts`。
4. `sync-plugin-contracts.ts` 只读比较已安装公开包；旧公开包尚未发行时，这一步仍可能报不一致，不能描述为整条生成命令成功。

本轮不执行以上宿主命令。收到最终结果后，在 `G:/Rust/DeviceForge-SDK` 顺序执行：

```powershell
node scripts/sync-contracts.mjs --source G:/Rust/DeviceForge/frontend/src/services/api/generated.ts
node --test scripts/tests/sync-contracts.test.mjs
New-Item -ItemType Directory -Force artifacts/contracts | Out-Null
npm pack --workspace @deviceforge/contracts --pack-destination artifacts/contracts --ignore-scripts --offline --cache artifacts/npm-cache --json
node scripts/verify-contracts-package.mjs --archive artifacts/contracts/deviceforge-contracts-0.1.1.tgz
node node_modules/typescript/bin/tsc -p artifacts/contracts/consumer/tsconfig.json
```

本地版本已按实现授权准备为 `0.1.1`，npm 实际归档为 `deviceforge-contracts-0.1.1.tgz`。旧 `0.1.0` 审核 TGZ 经绝对路径、非重解析点、清单归属与 SHA-256 四重核对后删除，目录只保留新版本一份 TGZ，不删除已发布附件或其他目标。所有产物、npm 缓存和消费夹具均在固定 `artifacts`，同一目标顺序覆盖，不并发打包、不新建编号目录。

`verify-contracts-package.mjs` 只将真实 TGZ 解出的声明映射进 `artifacts/contracts/consumer/tsconfig.json`。该专项 `paths` 映射只用于隔离验证，不可复制到生产配置；不会安装或改写任何 `node_modules`。

指定多个消费者源文件时，可重复传 `--consumer`，另用 `--paths-config` 指定直接声明 paths 的前端 JSON 配置。脚本保留该配置的路径映射含义，将相对目标按原配置目录解析，再仅覆盖 `@deviceforge/contracts/api` 为归档声明；新增 `tsconfig.consumer.json` 的根文件只含显式消费者，`include: []`，依赖闭包由 TypeScript 正常解析。不会继承前端主配置的全量 include，也不映射到宿主 `generated.ts`：

```powershell
node scripts/verify-contracts-package.mjs --archive artifacts/contracts/deviceforge-contracts-0.1.1.tgz --consumer G:/Rust/DeviceForge/frontend/plugins/marketplace/pending-migration/api.ts --consumer G:/Rust/DeviceForge/frontend/plugins/marketplace/pending-migration/http-factory.ts --paths-config G:/Rust/DeviceForge/frontend/tsconfig.workspace-packages.json
node node_modules/typescript/bin/tsc -p artifacts/contracts/consumer/tsconfig.consumer.json
```

主维护者已将待发行 HTTP 源码移入 `frontend/plugins/marketplace/pending-migration/`，保持合法 `.ts` 和正确相对导入，正式 `src` 与 `librarySources` 不编入这两个文件。上述配置仅验证两份待发行源码及其依赖闭包，保留实际输入 SHA-256；正式通用 UI／ports 不因此注入 HTTP 工厂。待公开发行及生产依赖更新后，由主维护者另行迁回、接入视图并验证实际 HTTP 行为。

## 生产正式消费结论

2026-11-17 14:49（Asia/Shanghai）通过公开 GitHub Releases API 只读核查，仓库仅有正式 `v0.1.0`，contracts 附件为 `deviceforge-contracts-0.1.0.tgz`、18,576 字节，未发现可直接采用的公开新契约。宿主 `package.json`、锁文件及实际已安装旧声明一致，旧声明没有 `migration-plan`、`migrate` 两路径。

因此，不做外部发行时，新的生产 `paths[...]` 类型导入无法正式消费这两个接口。本地 SDK 工作区和审核 TGZ 均不能改变这个结论。生产依赖继续固定原公开地址，不使用本机目录、隐式别名或改写 `node_modules` 绕过。待发行 adapter 可保存为 `.ts.pending` 审核交接；只有通用 UI／控制器的独立单元可先验证，不据此启用正式 HTTP 功能。

## 最小发布决策与授权范围

本地 `@deviceforge/contracts@0.1.1` 是主协调根据实现授权作出的必要版本准备，实际只修改 `browser/contracts/package.json` 与根锁对应版本条目，其他 SDK／工具／Rust 版本不联动。真实归档、摘要清单和发行说明均已保存于固定 `artifacts/contracts`；当前没有提交、打标签、推送或远端发行授权。

现有 `npm run pack:browser` 会构建 SDK、工具并把文件写到各包 `dist`；`scripts/prepare-release.ts` 绑定旧版本、三包、HEAD 源码 ZIP，且写旧 `release-output`。它不支持此次独立 contracts 发行，不在本次运行，也不能把有未提交改动的工作区误记成 HEAD 已包含新契约。

现有公开附件中工具包 `0.1.1` 随整体标签 `v0.1.0` 发行，说明附件版本与整体标签可以不同；但没有可直接套用的 contracts 独立增补发行标准。README 当前规定 v0.1.0 标签及附件保持不变，不能据技术可行推定已有新增附件授权。

最终推荐独立 `contracts-v0.1.1`：一次具体审批覆盖本次 SDK 审核写集的提交、独立标签及推送、独立 Release 三附件上传，以及宿主 contracts 固定 HTTPS 依赖／锁更新与既定待发行接线。保留旧 `v0.1.0` 标签及全部附件，不向旧页增补、不升级其他组件。当前没有执行任何提交或远端写入。

仓库 `AGENTS.md` 未强制所有独立 TGZ 必须绑定新源码提交；最终选择绑定新审核提交，是为独立版本提供可追溯源码的发行决策，不是据技能或仓规额外推导出的审批门禁。本地清单诚实记录 `base_revision`、`revision: null`、`uncommitted_contracts: true` 以及三份包源文件的实际 SHA-256。获准后仅提交本次九个路径，确认 HEAD 确实包含包内容，再生成绑定真实提交的最终清单；不混入原有指南脏改动。

本地 0.1.1 归档的确定身份：

- 字节数：`19523`。
- SHA-256：`bdf7aed6e6b819f85c7e99ef782b2d6c993d5ace99f82fc65412f264ca47bf41`。
- npm 完整性：`sha512-UKYIQxgVBsc5kNVAI3R0Hk1Bu4wJqKI0xOIgbemX4uK2DnrzLYaHipfS3yo7JPnco2m3FAgcMzvZOwkYGXw3Kg==`。
- 声明 SHA-256：`87354057944c7c0a62e60c9a5a0ae184a6482103789a8810fe397e0c3069c558`。

批准后先对下列九个 SDK 路径显式暂存并检查暂存区只含这些文件，再提交；若已有他人暂存内容，不提交混合暂存区。以下提交、标签和远端命令本轮均未执行。`<已审核SDK提交>` 必须替换为本次真实提交完整 SHA，不使用当前旧 HEAD：

```powershell
git add -- browser/contracts/api.d.ts browser/contracts/package.json browser/contracts/README.md package-lock.json scripts/sync-contracts.mjs scripts/verify-contracts-package.mjs scripts/tests/sync-contracts.test.mjs scripts/tests/fixtures/contracts-migration.ts docs/contracts-migration-release.md
git diff --cached --name-only
git commit -m "发布契约 0.1.1：补齐插件迁移 API"
node scripts/verify-contracts-package.mjs --archive artifacts/contracts/deviceforge-contracts-0.1.1.tgz --consumer G:/Rust/DeviceForge/frontend/plugins/marketplace/pending-migration/api.ts --consumer G:/Rust/DeviceForge/frontend/plugins/marketplace/pending-migration/http-factory.ts --paths-config G:/Rust/DeviceForge/frontend/tsconfig.workspace-packages.json
git tag contracts-v0.1.1 <已审核SDK提交>
git push origin contracts-v0.1.1
gh release create contracts-v0.1.1 artifacts/contracts/deviceforge-contracts-0.1.1.tgz artifacts/contracts/contracts-manifest.json artifacts/contracts/contracts-SHA256SUMS.txt --repo CitricAcidCandy/DeviceForge-SDK --verify-tag --title "HTTP 契约 0.1.1：迁移 API" --notes-file artifacts/contracts/contracts-release-notes.md
```

`verify-contracts-package.mjs` 在提交后核对 TGZ 与源码相同，更新清单 `source.revision` 为该真实 HEAD；不需更改或重打同字节 TGZ。仅推送独立标签及其指向提交，不批量推送工作分支。Release 创建命令没有 `--clobber`，同标签或同名附件冲突应停止核查。

准确规划地址如下，发行页和三份新附件尚未创建；这些是可审批目标，不表示当前可下载：

- 独立发行页：`https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/tag/contracts-v0.1.1`。
- 新契约 TGZ：`https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/contracts-v0.1.1/deviceforge-contracts-0.1.1.tgz`。
- 新独立清单：`https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/contracts-v0.1.1/contracts-manifest.json`。
- 新摘要清单：`https://github.com/CitricAcidCandy/DeviceForge-SDK/releases/download/contracts-v0.1.1/contracts-SHA256SUMS.txt`。

上传后必须从 GitHub 返回值读取真实下载地址，独立下载并核对摘要与包内版本，不能只用上传命令退出码宣称采用完成：

```powershell
$contractsUrl = gh api repos/CitricAcidCandy/DeviceForge-SDK/releases/tags/contracts-v0.1.1 --jq '.assets[] | select(.name == "deviceforge-contracts-0.1.1.tgz") | .browser_download_url'
```

宿主维护者随后在独立授权范围内更新生产固定 HTTPS 依赖与锁文件，运行新 adapter 专项及公开声明只读一致性校验，再迁回 HTTP 工厂并接视图。本地 artifacts 不替代生产来源。

请求用户的一次授权应完整写明：批准以上九文件的审核提交、`contracts-v0.1.1` 标签推送与独立三附件发行；公开下载摘要核对后，批准宿主仅更新 contracts 固定地址及锁、迁回既有待发行 HTTP 源码并连接视图。用户未授权前全部保持本地准备状态。

## 已验与未验记录

- 已验：同步脚本直接单元 1 项通过，包含重复同步、来源缺失／格式／BOM／UTF-8 拒绝与旧目标保留。
- 已核查：正式生成链、旧发行脚本、生产固定依赖与现有公开发行元数据。
- 已验：最终生成结果与 SDK `api.d.ts` 原字节一致，566,374 字节，SHA-256 为 `87354057944c7c0a62e60c9a5a0ae184a6482103789a8810fe397e0c3069c558`。
- 最终本地包：`artifacts/contracts/deviceforge-contracts-0.1.1.tgz`，19,523 字节，三成员与工作区原字节相同，包内版本 0.1.1；SHA-256 为 `bdf7aed6e6b819f85c7e99ef782b2d6c993d5ace99f82fc65412f264ca47bf41`。包自身 SHA-512 及成员清单在 `artifacts/contracts/review.json`。
- 历史 0.1.0 审核 TGZ 已核验归属后删除，不再作为当前交付；固定目录只保留最终 0.1.1 一份 TGZ。
- 已验：归档声明的迁移专项 `tsconfig.json` 退出 0，四处配置修订均精确为 `string | null` 且字段必填；来源联合类型、两路径、确认输入及原 Job 输出保持一致。
- 已验：原 workbench API＋HTTP 工厂先通过；最终改用 `pending-migration/api.ts`、`pending-migration/http-factory.ts`，等待展示类型补齐 `targetId` 后，继承前端 paths、仅替换 0.1.1 TGZ 声明的最小 `tsconfig.consumer.json` 退出 0（2026-11-17 15:18，Asia/Shanghai）。这是静态类型证据，不是生产已启用、HTTP 运行成功或业务单元通过。
- 最终受检 pending API SHA-256 为 `c89f2044fce33398f3e66a3e628af8f63ee4943516277a324fae1966abc4fe44`，HTTP 工厂为 `4d7d4792c7c78168420b3bcfb4082d2ebce846631cac2c4d290dca8281edfc3d`；展示类型输入 SHA-256 为 `57045d1a0ce52a06b6032df66ffabff842953443f3273b1bdbbfe755765127e3`。
- 本地版本差异仅 contracts `0.1.0 → 0.1.1` 与根锁对应条目；plugin-sdk 仍为 0.1.0、tools 仍为既有 0.1.1，未重新构建这些目标。
- 原有十五份指南等 dirty 文件摘要全部保持；宿主生产依赖、锁和已安装 contracts 声明摘要保持未改。
- 未执行：全量测试、全量类型、构建、浏览器、设备、运行服务、提交、标签、推送及任何远端写入。

## 最终就绪状态

2026-11-17 15:26（Asia/Shanghai）状态为 `ready_for_release_approval`。重新核对冻结后的两份 pending HTTP 源码、包含 `targetId` 的展示类型、前端 paths 配置和最终 0.1.1 TGZ，摘要均与最后通过专项的输入一致，因此不重复执行已通过的单元或类型检查。包与审核写集已准备完成，仅剩前述一次独立发行及宿主采用授权。

主协调另行报告：本地界面控制行为 56 项前端单元、2 项后端单元及 strict 已通过。该结果属于宿主维护者的验证范围，本 SDK 任务未重复执行，也不计为 SDK 自测数量。当前生产保留通用 UI 与注入点，HTTP 源码仍位于 `pending-migration/`，远端发行和生产采用均未完成。
