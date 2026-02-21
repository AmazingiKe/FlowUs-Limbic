# 常见问题

## 一般问题

### Q: FlowUs Limbic 是什么？

**A**: FlowUs Limbic 是一个 Obsidian 插件，实现 Obsidian 与 FlowUs 数据库之间的双向实时同步，特别针对 TODO 任务管理功能进行了优化。

### Q: 这个插件是免费的吗？

**A**: 是的，FlowUs Limbic 是完全开源免费的，使用 MIT 许可证。

### Q: 支持哪些平台？

**A**: 插件支持 Obsidian 所有支持的平台：
- Windows
- macOS
- Linux
- （未来）iOS / Android

### Q: 需要编程知识吗？

**A**: 不需要！插件提供了友好的用户界面，普通用户也可以轻松使用。只有在开发新功能时才需要编程知识。

## 安装和配置

### Q: 如何安装插件？

**A**: 参见 [安装指南](./getting-started/installation.md)。

### Q: 如何获取 Client ID 和 Client Secret？

**A**: 参见 [FlowUs 配置](./getting-started/flowus-setup.md)。

### Q: 重定向 URI 应该填什么？

**A**: 必须填写 `obsidian://flowus-limbic-callback`，注意大小写和格式都必须完全匹配。

### Q: Database ID 在哪里找？

**A**: 打开 FlowUs 数据库后，浏览器地址栏中的 URL 格式为 `https://flowus.cn/database/[数据库ID]`，后面那一串就是 Database ID。

## 使用问题

### Q: 插件会同步我的所有 Obsidian 笔记吗？

**A**: 不会。目前插件只同步 TODO 数据，不会读取或修改您的 Obsidian 笔记文件。

### Q: 可以同步多个数据库吗？

**A**: 当前版本只支持单个数据库。多数据库支持在计划中。

### Q: 同步频率可以调整吗？

**A**: 可以！在插件设置中可以设置从 10 秒到 5 分钟的同步间隔。

### Q: 离线时可以使用吗？

**A**: 可以！插件支持离线模式，所有变更会在本地缓存，网络恢复后自动同步。

### Q: 数据安全吗？

**A**: 是的：
- 所有认证令牌都加密存储
- 数据传输使用 HTTPS
- 您的 FlowUs 凭证只存储在本地
- 插件是开源的，可以审查代码

## 同步问题

### Q: 同步失败怎么办？

**A**: 参见 [常见问题](./troubleshooting/common-issues.md) 和 [调试技巧](./troubleshooting/debugging.md)。

### Q: 如何解决同步冲突？

**A**: 在插件设置中可以选择冲突解决策略：
- 远程优先
- 本地优先
- 时间戳优先
- 手动选择

### Q: 可以手动触发同步吗？

**A**: 可以！在插件设置中点击"立即同步"按钮，或使用命令面板中的 "FlowUs TODO: Sync Now" 命令。

### Q: 同步会消耗 FlowUs API 配额吗？

**A**: 是的，插件会使用 FlowUs API。为了减少消耗：
- 使用增量同步（只同步变更）
- 合理设置同步间隔
- 使用批量操作

## 数据问题

### Q: 数据存储在哪里？

**A**:
- **本地**: 存储在 Obsidian 的插件数据目录中
- **远程**: 存储在您的 FlowUs 数据库中

### Q: 可以迁移数据吗？

**A**: 可以！使用插件设置中的"导出数据"和"导入数据"功能。

### Q: 误删数据可以恢复吗？

**A**: 参见 [数据恢复](./troubleshooting/data-recovery.md)。

### Q: 可以导出为其他格式吗？

**A**: 目前支持导出为 JSON 和 CSV 格式。

## 开发相关

### Q: 如何参与开发？

**A**: 参见 [开发环境搭建](./development/environment-setup.md)。

### Q: 可以添加新的数据类型吗？

**A**: 可以！插件使用 Schema 驱动的设计，参见 [Schema 开发指南](./development/schema-development.md)。

### Q: 有 API 文档吗？

**A**: 有！参见 [API 参考](./reference/api.md)。

### Q: 如何报告 Bug？

**A**:
1. 查看 [常见问题](./troubleshooting/common-issues.md)
2. 查看 [GitHub Issues](https://github.com/yourusername/FlowUs-Limbic/issues)
3. 如果没有类似问题，创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 错误信息
   - 环境信息

## 未来计划

### Q: 未来会添加什么功能？

**A**: 计划中的功能包括：
- 多数据库支持
- 更多数据类型（笔记、日历事件等）
- 更好的冲突解决界面
- 数据统计和报告
- 移动端支持
- 更多集成（与其他 Obsidian 插件）

### Q: 可以请求新功能吗？

**A**: 当然可以！在 [GitHub Issues](https://github.com/yourusername/FlowUs-Limbic/issues) 中提交功能请求。

## 其他

### Q: "Limbic" 是什么意思？

**A**: Limbic（边缘系统）是大脑中负责记忆和情感的部分，象征着这个插件帮助您连接和管理重要的信息。

### Q: 如何获得帮助？

**A**:
- 查看本文档
- 查看 [GitHub Issues](https://github.com/yourusername/FlowUs-Limbic/issues)
- 提交新 Issue
- （未来）加入社区讨论

### Q: 如何支持这个项目？

**A**:
- 🌟 在 GitHub 上给项目 Star
- 🐛 报告 Bug
- 💡 提出功能建议
- 👨‍💻 贡献代码
- 📖 改进文档
- 🗣️ 分享给朋友

### Q: 有社区吗？

**A**: 目前主要通过 GitHub 交流。如果用户增多，会考虑建立 Discord、Telegram 等社区。

---

**没有找到您的问题？** 请提交 [GitHub Issue](https://github.com/yourusername/FlowUs-Limbic/issues)！
