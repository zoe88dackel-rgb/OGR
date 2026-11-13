# TN VED 海关编码查询（独立静态网页）

本页面在 \`tnved/\` 文件夹独立运行。不使用 N55 源码，也不引用本站其他页面的 JS / CSS。

- \`index.html\`: 纯 HTML + CSS + JavaScript，按 10 位编码、编码前缀、俄文名称查找。
- \`catalog.json\`: 俄罗斯 FNS 公开的完整有效期目录，自动生成。默认无需外部 API。
- \`build_catalog.py\`: 将官方 TNVED.ZIP 的 CP866 数据转换成可离线托管的 JSON。
- \`.github/workflows/tnved-catalog.yml\`: 自动下载、校验、每周同步新快照。

数据来源 https://www.nalog.gov.ru/rn77/program/5961290/ （2026-04-27 资料快照）。
该工具用于查找候选海关编码，不是正式归类裁定，不直接判断 EAC/CoC/DoC。

要启用 GitHub Pages：仓库 Settings → Pages → Source：Deploy from a branch；Branch：main；Folder：/(root)。
静态页面地址在发布成功后为：
https://zoe88dackel-rgb.github.io/OGR/tnved/
