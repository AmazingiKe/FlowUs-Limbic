# 变更日志

本文档记录 FlowUs Limbic 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增

- 初始项目架构
- 核心插件类实现
- 设置界面
- FlowUs API 客户端
- OAuth 2.0 认证
- 通用同步层框架
- Entity Registry
- Transformer Engine
- TODO Schema 定义
- 文档体系

### 变更

### 废弃

### 修复

### 安全

---

## [0.1.0] - 2024-02-15

### 新增

- ✅ 项目初始化
- ✅ TypeScript 配置
- ✅ esbuild 构建系统
- ✅ Obsidian 插件基础结构
- ✅ 设置接口定义
- ✅ 设置 Tab UI
- ✅ FlowUs API 客户端骨架
- ✅ OAuth 认证模块骨架
- ✅ 通用同步层类型定义
- ✅ Entity Registry 实现
- ✅ Transformer Engine 实现
- ✅ TODO Entity 类型
- ✅ TODO Schema 定义
- ✅ 完整文档体系
  - 入门指南
  - 功能文档
  - 配置指南
  - 故障排除
  - 架构文档
  - 开发者文档
  - API 参考

---

## 版本说明

### 版本类型

- **主版本 (MAJOR)**: 不兼容的 API 修改
- **次版本 (MINOR)**: 向下兼容的功能性新增
- **修订版本 (PATCH)**: 向下兼容的问题修正

### 变更类型

- **新增 (Added)**: 新功能
- **变更 (Changed)**: 现有功能的变更
- **废弃 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: Bug 修复
- **安全 (Security)**: 安全相关修复

---

## 如何贡献

### 提交变更时

1. 修改代码
2. 更新本文档，将变更添加到 `[未发布]` 部分
3. 提交 PR

### 发布新版本时

1. 将 `[未发布]` 改为新版本号和日期
2. 添加新的 `[未发布]` 部分在顶部
3. 更新 git 标签

---

## 路线图

### 0.2.0 - 核心功能

- [ ] 完整的 FlowUs API 客户端实现
- [ ] OAuth 2.0 完整流程
- [ ] TODO 视图 UI
- [ ] 基础同步功能

### 0.3.0 - 同步增强

- [ ] 增量同步
- [ ] 冲突解决
- [ ] 离线模式

### 0.4.0 - 高级功能

- [ ] 优先级
- [ ] 截止日期
- [ ] 标签系统

### 1.0.0 - 正式发布

- [ ] 完整测试
- [ ] 性能优化
- [ ] 文档完善

---

[未发布]: https://github.com/yourusername/FlowUs-Limbic/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/FlowUs-Limbic/releases/tag/v0.1.0
