# TN VED / 海关编码中俄双语查询（独立静态站）

独立页面： https://zoe88dackel-rgb.github.io/OGR/tnved/

本项目独立开发的纯 HTML / CSS / JavaScript 工具，不使用 N55 任何源码或前端。

## 功能

- 完整导入俄罗斯 FNS 发布的 **13,293 条 10 位海关编码**，可按编码前缀或俄文名称搜索
- 逐条生成 **俄文原文 + 中文机器译文**，中文关键词支持查询完整目录
- 查看编码、俄文原文，复制编码，跳转 Alta-Soft 交叉核对
- 可导出全部中俄译名为 Excel 可用的 UTF-8 BOM CSV
- 移动端兼容，GitHub Pages 免费托管

## 文件

- `index.html`：原生前端，查询、双语展示和 CSV 下载
- `catalog.json`：FNS 官方快照，字段 `rows: [[code, russian_name], ...]`
- `zh.json`：全量中文**机器翻译**，由翻译 Workflow 自动生成，不是官方译本
- `build_catalog.py`：从 FNS 的 TNVED.ZIP 构建原始全量目录
- `translate_zh.py`：使用开放模型 `facebook/m2m100_418M` 进行离线直译，16 个分片并行，合并后验证 100% 编码覆盖
- `.github/workflows/tnved-catalog.yml`：每周同步官方数据源
- `.github/workflows/tnved-translate-zh.yml`：运行全量机器翻译、校验及提交中文对照文件

## 使用

输入中文商品名称、俄文原文、10 位编码或前 2–10 位编码进行检索。结果同时显示中文和俄文。点击「下载全量中俄对照 CSV」可取得编码、中译和俄文原文三列。中文翻译由自动模型生成，可能存在专业术语错误、漏译或分类误读，不可作为法律意见或正式归类依据。

**数据日期**：俄罗斯 FNS 快照 2026-04-27；必须核对 [EEC 最新法定目录](https://eec.eaeunion.org/comission/department/catr/ett/) 中之后的变更。

**注意**：中文翻译文件需在 GitHub Workflow 成功完成并写入 `zh.json` 后网页才会显示全量中文对照。编码数量与译文数量不一致时网页自动回退俄文目录，避免将不完整翻译冒充全量。

## 依赖

站点运行时不依赖任何付费 API、数据库、Node、Python 或 CDN。翻译构建时采用MIT 许可的 M2M100 418M 模型（Apache 2.0 许可证）和 GitHub Actions。

