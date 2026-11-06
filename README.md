# OGR 卖家指南

OGR 中国卖家指南，纯静态网站，无需构建。

主任务路径：了解 OGR → 准入初筛 → 费用与收益 → 首票供货 → 回款经营。

首页保留原有滚动动画、图标动效与展示设计，首页样式和滚动脚本分别固定在 `home-original.css`、`home-original.js`，不加载内页的任务布局样式。初步测算后进入开通和 SKU 预审，审核后按实际报价复核。`compliance.html` 是首票供货的文件指引；证书教学等补充内容默认折叠，原有深链接会自动展开。

工具与资料：`calculator.html` 利润测算；`resources.html` 项目原文、证书教学、百问百答及模式比较入口。导航无需 JavaScript 即可使用。

页面：首页；理解模式（认识 OGR、模式对比）；判断准入（主体与品类、合规与认证）；测算收益与资金（类目佣金、费用与资金）；开通发货；回款经营。

## 部署到 GitHub Pages

1. 把这些文件推到仓库的 `main` 分支根目录
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`，目录 `/ (root)`
3. 约 1 分钟后访问 `https://<用户名>.github.io/<仓库名>/`

主资料：
- OGR 卖家手册（项目、费用、结算、退货、FAQ）：https://mcnr4asdohn7.feishu.cn/wiki/GHFMwMTVVi674Xk6fSncdgdinuc
- OGR 发货全流程（操作八步与发货前自查）：https://mcnr4asdohn7.feishu.cn/wiki/HeK6wvasciYfHKkxq6pcEM03nAe

主资料优先于旧会议、旧源码及其他补充材料。本次核对日期：2026-11-05；手册页面显示更新于 11 月 4 日。

利润计算器独立于阅读章节，由顶部「算一算利润」进入。费用说明位于 finance.html。佣金原始表保留 108 行数据，提供目录切换、搜索和分页；手机改为按类目展示费率。
