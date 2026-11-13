# TN VED 与 EAC 可复用商品合规数据库

这是 **全新独立数据库**。不引用 N55 的项目、HTML、源码和任何数据库。

## 当前

- 使用已公开导入的 13,293 条俄罗斯 FNS 10 位 TN VED 编码和对应中文机译。
- 俄文原文永远保存；中文名字按 `machine/unreviewed/needs_context/approved` 审核状态分开。
- 将 2026-04-27 FNS 快照和 EEC 官方法规原文作为独立版本来源。
- 数据库文件：`tnved/database/compliance.sqlite`（SQLite，可下载，可导入其他数据库）。
- 结构：`schema.sql`，构建：`build.py`，人工审核覆盖：`curated.json`。
- 自动构建校验：GitHub Actions 的 `tnved-compliance-db.yml`。只有通过校验才保存发布。
- 现有静态网站继续读取 `catalog.json` 与 `zh.json`，不需要数据库服务器。

## 为什么 EAC 要另建表

**TN VED 代码 ≠ EAC 认证结论。** EAEU 技术法规有适用范围、排除清单、产品属性以及生效版本的限制。不能用编码直接查 CoC 或 DoC。

`regulations` 和 `regulation_clauses` 保存原始法规、条款和版本；`applicability_rules` 保存经审核的产品属性条件；`products` 保存具体商品属性；`product_classifications` 保存候选商品海关编码；`compliance_assessments` 保存合规初筛及证据。

仅当规则有**官方来源、法规条款、商品属性条件、审核人和审核日期**时，允许将适用规则标为 `verified`。产品合规判断也要留存证据和审查状态。**尚未审查的法规和规则不作为确定的认证建议发布。**

数据库目前仅预置 TR CU 008/2011（玩具安全）的官方参考条款，不会自动给儿童积木生成 CoC / DoC 结论。未来扩充法规时应核对现行修订版本。

## 每条编码如何核对

| 项目 | 保存位置 | 审核规则 |
|---|---|---|
| 10 位 TN VED 编码和俄文名称 | `tariff_codes` | 必须来自 FNS 官方下载数据 |
| 官方目录来源及版本 | `sources` | 保留 URL、快照日期、原数据哈希 |
| 中文译名及模型 | `code_translations` | 原始机译不自动等于已审核 |
| 人工批准译名 | `curated.json.translations_reviewed` | 必须写审核人、审核日期、对应俄文名称 SHA256 |
| 术语过短、需要上级品目解释 | `review_tasks` | 自动建立复核任务 |
| EAC 技术法规/条款 | `regulations` / `regulation_clauses` | 标明官方地址、条款与修订状态 |
| 适用/排除/文件类型规则 | `applicability_rules` | 未经审核不能用于确定性判断 |
| 商品实际用途、材质等 | `products` | 与归类候选及 EAC 评估分别关联 |

## 使用 SQLite

下载 `compliance.sqlite`，用 DB Browser for SQLite 或 SQLite CLI 打开。

```sql
SELECT c.code,c.name_ru,t.translated_name,t.review_status
FROM tariff_codes c
JOIN code_translations t ON c.code=t.code
WHERE c.code='9503003500';

SELECT regulation_id,title_zh,source_id,review_status
FROM regulations;

SELECT * FROM verified_applicability;
```

以后接 Cloudflare D1 时，可以基于此 schema 做迁移和分页接口。若要多用户在线编辑审核记录，需要另外部署受控后台和权限系统；目前的纯 GitHub Pages 静态站不具备这些能力。

**官方来源**：FNS https://www.nalog.gov.ru/rn77/program/5961290/ ，EEC TR CU 008/2011 https://eec.eaeunion.org/upload/medialibrary/419/TR-TS-Toys.pdf 。必须检查快照后续的修订，中文翻译不得用于正式报关归类裁定。
