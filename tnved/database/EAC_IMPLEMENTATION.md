# EAC 合规规则库：建库与内容核对规范

更新时间：2026-11-13。供项目产品设计与数据标注使用。**不是法律意见，未审核的规则禁止用于确定性认证判断。**

## 目标

维护一个可复用的商品合规知识库，让 TN VED 查询、EAC 合格评定初筛、OGR 发货前资料核对共享数据。

- 只用官方/权威监管来源作为法律证据；原始俄文保留，中文用于阅读和检索
- TN VED 作为商品归类和法规适用范围的候选线索，**不得仅凭编码判断 CoC / DoC**
- 保存版本与未来生效时间，不能把已公布未生效的修订当成现行要求
- 每一条「商品 → 法规 → 文件」判断可追溯到来源、条款、审核人和审核时间
- EAC 标志不是证书文件，CoC 和 DoC 是不同的合格评定文件；SGR（国家注册）和豁免/不适用说明须另列，不能把后者当作一种 EAC 合格评定方式

## 已有数据库结构

| 表 | 作用 | 重点质量字段 |
|---|---|---|
| `tariff_codes` | 10位 TN VED 编码与官方俄文 | source_id, effective_from/to |
| `code_translations` | 机器翻译和人工校正 | review_status, source_ru_sha256, reviewed_by |
| `sources` | 官方法规、修改文件、登记来源 | url, published_at, version_label |
| `regulations` | TR CU/TR EAEU 法规目录 | source_id, effective_from/to, review_status |
| `regulation_clauses` | 按条款拆分适用、排除、文件条件 | clause_reference, source_id, effective_from/to |
| `applicability_rules` | **经审核后才可执行**的条件规则 | rule_type, predicates_json, result_document, review_status |
| `products` | 真实 SKU 属性 | 材质、用途、适用年龄、电压、是否电动等 |
| `product_classifications` | 商品与候选海关编码多对多 | decision, rationale, evidence_url |
| `compliance_assessments` | 商品 × 法规的逐项判断结果 | status, rule_ids_json, evidence_json |
| `review_tasks` | 待核对、待补充、版本变化任务 | subject_type, status, assignee |
| `audit_events` | 审核和变更历史 | action, actor, event_at |

若上线证书查询，还应增加 **`issued_documents`** 和 **`document_checks`**：申请人、产品型号、发证国家、证书号码、适用法规、有效期、登记状态及“最后一次官方核验时间”。不要爬取后就永久显示“有效”。证书官方核验入口：
- CoC 俄罗斯： https://pub.fsa.gov.ru/rss/certificate
- DoC 俄罗斯： https://pub.fsa.gov.ru/rds/declaration
- 欧亚经济联盟： https://portal.eaeunion.org/sites/commonprocesses/ruru/Pages/ConformityDocsRegistryDetails.aspx

## 每一条法规的内容标注字段

最小标注粒度为**条款或附录中的具体规则**，不要用整篇 PDF 摘要代替。

1. 法规标识：如 `TR_CU_008_2011`、俄文法定名称、中文辅助译名、颁布机关；
2. 法规版本：批准日期、发布日期、**生效日期**、是否仍有效、修改它的决议；
3. 适用范围：商品定义、可适用年龄、功能、规格、是否有特定用途；
4. 排除范围：条款及附录中的全部排除情况，**保存原文**；
5. 合格评定：CoC、DoC、SGR 等文件要求（仅当条款明确），方案代码以及申请人资格；
6. 适用证据：法条编号、条文摘要、原文链接、页码、颁布/生效日期；
7. 核对状态：`draft` → `verified`（审核人确认）→ 后续修订需重新审核。

注意：部分技术法规规定同一法规下的不同商品类别可走不同的合格评定形式，不能把「一条法规 → 一种文件」写死。

## 数据采集和审核流水线

`官方法规目录 → 获取法规与修正决议 → 按条/附录解析 → 原文+中文对照 → 结构化条件 → 核对排除范围 → 人工审核 → 发布规则 → 版本更新检测`

自动系统负责下载、提取、翻译、搜索、显示候选；**人工法务/认证专家**负责确认法律适用、排除条件、条款是否过期及文件形式。没有审核记录的规则只展示“待核实”。

建议每周检查官方目录或法规索引是否存在新修订。发现变更时，为受影响条款生成 `review_tasks`，暂停基于旧规则的确定性建议，直到审查完毕。

## 首批法规（扩展至 11 部来源参考，未作最终法律审核）

| 法规 | 常见方向 | 法规编号 | 说明 |
|---|---|---|---|
| 玩具安全 | 儿童积木及玩具 | TR CU 008/2011 | 需核对玩具定义、排除清单、Article 6 |
| 儿童青少年用品安全 | 童装、部分儿童用品 | TR CU 007/2011 | 与玩具法规适用范围不同 |
| 轻工业产品安全 | 成人服饰、纺织品 | TR CU 017/2011 | 需按子类和用途细分 |
| 低压设备安全 | 相关额定电压电器 | TR CU 004/2011 | 额定电压及附录范围重要 |
| 电磁兼容性 | 相关电子电气设备 | TR CU 020/2011 | 检查电磁兼容适用与排除 |
| 电气电子有害物质限制 | 适用的电子电气产品 | TR EAEU 037/2016 | 不可仅凭是否带电判断 |

**重点版本风险**：EEC 理事会 2026-09-09 第106号决议涉及 TR CU 008/2011，2027-03-27 才生效。数据库已单独保存这条“未来生效变更”来源，不把它当成 2026-11-13 现行规则。来源 https://docs.eaeunion.org/documents/461/10947/

## 示例：塑料儿童积木

```json
{
  "product": "塑料儿童拼插积木",
  "candidate_tnved": "9503003500",
  "attributes_required": [
    "商品实际用途",
    "适用年龄",
    "是否属于技术法规定义的玩具",
    "是否落入TR CU 008/2011附录1排除范围",
    "材料及生产用途",
    "是否有电子/电动部件"
  ],
  "candidate_regulation": "TR CU 008/2011",
  "source_clauses": ["Article 1","Article 6","Annex 1"],
  "possible_assessment": "CoC (requires scope confirmation)",
  "database_output": "待核实 / 不自动给证书结论"
}
```

对于**普通儿童玩具**，TR CU 008/2011 Article 6 规定合格评定采取认证形式，但一定要先确认商品属于本法规适用范围。原文：https://eec.eaeunion.org/upload/medialibrary/419/TR-TS-Toys.pdf

## 服务层的建议输出

用户输入商品 → 补充材质、用途、年龄、电压等必要属性 → 列出候选 TN VED → 列出**可能适用的多项法规** → 逐条解释适用/排除 → 显示文件类型和来源（仅经核验）→ 证书号可跳官方核验。

输出状态至少分：
- **信息不足**：缺商品属性或法规原文尚未审核；
- **可能适用**：候选，需要进一步确认；
- **经审核适用**：来源、有效期、条款、排除条件全部复核；
- **不适用**：有明确的排除/不适用法律依据；
- **版本待更新**：来源已有修订，旧结论不可直接复用。

## 待做事项

1. 收集各法规**当前合并修订文本**，系统化对照历史决议、过渡期；
2. 核对规章正文 + 附录范围 + 产品类别 + 文件形式/方案；
3. 将 `draft` 规则标注审核，并组织认证专业人员签核；
4. 建立商品参数补充问答及多规则冲突提示；
5. 根据官方支持的条件接入证书登记查询；对无法确认状态的号码不输出“有效”。

公开使用时不要写“只要查到 TN VED 就知道 EAC 必须办哪种文件”。


## 2026-11-13 建库进展

已从原六部法规增加到 **11 部**，新增：TR CU 005/2011 包装、TR CU 009/2011 化妆品、TR CU 010/2011 机械设备、TR CU 019/2011 防护用品、TR CU 021/2011 食品安全。分别保存官方 EEC 原始决议目录。当前数据库包含 50 个分条参考位置、22 条候选规则及 6 个案例。全部维持参考或待审状态。

数据库生成：`python tnved/database/build.py && python tnved/database/enrich_eac.py && python tnved/database/test_eac.py`。

人工审条款：`python tnved/eac/review.py --type clause --id TR_CU_008_2011_clause_1 --reviewer '审核人' --evidence-url 'https://docs.eaeunion.org/...' --note '逐项核对适用范围、排除条件、版本和相关附录的完整记录'`。规则可通过 `--type rule --id toy_scope` 审核。该命令仅记录人工审查结果，不能替代专业法律核实。

正式网页： https://zoe88dackel-rgb.github.io/OGR/tnved/eac/
