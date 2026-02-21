# FlowUs Limbic 项目概览

## 项目简介

`FlowUs Limbic` 是一个基于 Obsidian 插件架构的前端项目，主要功能是提供 **FlowUs** 系列的插件实现。项目使用 **TypeScript** 编写，构建工具为 **esbuild**，并通过 `main.ts` 暴露插件入口。项目结构简洁，核心代码位于 `src/` 目录下。

## 📚 文档

完整的文档位于 [`docs/`](./docs/README.md) 目录：

### 快速开始

- [项目概述](docs/getting-started/overview.md) - 了解 FlowUs Limbic
- [安装指南](docs/getting-started/installation.md) - 安装插件
- [快速开始](docs/getting-started/quickstart.md) - 5 分钟上手
- [FlowUs 配置](docs/getting-started/flowus-setup.md) - 配置 FlowUs

### 功能文档

- [TODO 管理](docs/features/todo-management.md) - 基本功能
- [同步功能](docs/features/synchronization.md) - 同步机制
- [高级 TODO 功能](docs/features/advanced-todo.md) - 高级功能

### 其他

- [常见问题](docs/faq.md) - FAQ
- [故障排除](docs/troubleshooting/common-issues.md) - 解决问题
- [开发者文档](docs/development/environment-setup.md) - 参与开发
- [架构文档](docs/architecture/overview.md) - 系统架构
- [变更日志](docs/releases/changelog.md) - 版本历史

## 功能特性

- **双向同步**：实现 Obsidian 与 FlowUs 数据库的双向实时同步
- **TODO 管理**：支持在 Obsidian 中创建、编辑、删除 FlowUs 数据库中的 TODO 项目
- **OAuth 认证**：使用 OAuth 2.0 协议安全访问 FlowUs API
- **自动令牌刷新**：自动处理访问令牌的过期和刷新
- **实时更新**：支持自动同步机制，保持数据一致性

## 代码结构与运行原理

- **`esbuild.config.mjs`** – 项目的构建配置文件，负责将 `src/` 中的 TypeScript 编译为单文件 `main.js`，并生成对应的 `manifest.json` 用于 Obsidian 插件加载。
- **`src/main.ts`** – 插件的入口文件，定义了 `FlowUsLimbicPlugin` 类并在不同运行环境（Node、浏览器、全局）下导出插件实例。
- **`src/settings.ts`** – 插件配置接口定义，包含 OAuth 认证和数据库连接所需的配置项。
- **`src/flowus/`** – FlowUs 相关业务逻辑实现目录，包含 API 客户端和 OAuth 认证模块。
- **`src/todo/`** – 待办事项目录，包含 TODO 视图和同步管理器。

项目的加载流程如下：

1. Obsidian 启动时读取 `manifest.json`，定位到 `main.js`。
2. `esbuild` 将 `src/main.ts` 编译为 `main.js`，其中包含插件类 `FlowUsLimbicPlugin`。
3. 插件实例在 `onload` 生命周期中执行初始化逻辑（目前仅打印日志），`onunload` 中执行清理。

## 安装方法

### 方式一：手动安装

1. 克隆或下载本项目到本地：

   ```bash
   git clone https://github.com/yourusername/FlowUs-Limbic.git
   cd FlowUs-Limbic
   ```

2. 安装项目依赖：

   ```bash
   npm install
   ```

3. 构建项目：

   ```bash
   npm run build
   ```

4. 将以下文件复制到 Obsidian 的插件目录：

   - `main.js`
   - `manifest.json`

   **插件目录位置**：

   - Windows: `%APPDATA%\Obsidian\plugins\flowus-limbic\`
   - macOS: `~/Library/Application Support/Obsidian/plugins/flowus-limbic/`
   - Linux: `~/.config/obsidian/plugins/flowus-limbic/`

5. 在 Obsidian 中启用插件：
   - 打开 Obsidian
   - 进入 `设置` → `社区插件`
   - 找到 `FlowUs Limbic` 并启用

### 方式二：开发模式

1. 按照方式一的步骤 1-2 安装依赖

2. 启动开发模式（自动监听文件变化并重新构建）：

   ```bash
   npm run dev
   ```

3. 将构建后的文件复制到插件目录（或创建符号链接）

## 配置步骤

### 1. 获取 FlowUs 应用凭证

1. 访问 [FlowUs 开发者平台](https://api.flowus.cn/)
2. 创建新应用，获取以下信息：
   - **Client ID**：应用标识符
   - **Client Secret**：应用密钥（请妥善保管）

### 2. 配置 FlowUs 数据库

1. 在 FlowUs 中创建一个数据库
2. 确保数据库包含以下字段：
   - `title`（标题）：文本类型
   - `completed`（完成状态）：复选框类型
3. 记录数据库的 ID 和表名

### 3. 在 Obsidian 中配置插件

1. 打开 Obsidian 设置
2. 找到 `FlowUs Limbic` 插件设置
3. 填写以下信息：
   - **Client ID**：从 FlowUs 开发者平台获取
   - **Client Secret**：从 FlowUs 开发者平台获取
   - **Database ID**：FlowUs 数据库的 ID
   - **Table Name**：数据库表名

### 4. 完成授权

1. 在插件设置中点击"授权"按钮
2. 浏览器将跳转到 FlowUs 授权页面
3. 登录并授权应用访问您的 FlowUs 数据
4. 授权完成后，插件将自动保存访问令牌

## 使用方法

### 创建 TODO

1. 在 Obsidian 中打开 FlowUs TODO 视图
2. 在输入框中输入 TODO 内容
3. 点击"添加"按钮或按 Enter 键
4. TODO 将自动同步到 FlowUs 数据库

### 管理 TODO

- **标记完成**：点击 TODO 项前的复选框
- **删除 TODO**：点击 TODO 项右侧的"删除"按钮
- **查看状态**：已完成的 TODO 会显示删除线

### 自动同步

- 插件默认每 30 秒自动同步一次
- 可以在插件设置中调整同步间隔
- 手动触发同步：在插件设置中点击"立即同步"按钮

### 查看同步状态

- 在 Obsidian 控制台（Ctrl+Shift+I）中查看同步日志
- 成功同步会显示：`FlowUs TODO sync completed successfully`
- 同步失败会显示错误信息并弹出通知

## 开发指南

详细的开发指南请参见：
- [开发环境搭建](docs/development/environment-setup.md) - 搭建开发环境
- [构建系统](docs/development/build-system.md) - 了解构建配置
- [测试指南](docs/development/testing-guidelines.md) - 学习如何测试
- [Schema 开发指南](docs/development/schema-development.md) - 扩展数据类型

## 常见问题

详细的 FAQ 请参见 [docs/faq.md](docs/faq.md)。

## 架构设计

- [架构概览](docs/architecture/overview.md) - 系统整体架构
- [通用同步层](docs/architecture/universal-sync.md) - 通用同步层设计
- [FlowUs 适配器](docs/architecture/flowus-adapter.md) - FlowUs API 适配层

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- 作者：Amazing Ike
- 网站：https://amazingike-flowus-libs.com

---

如有其他需求或需要进一步细化的实现方案，请随时告知！
