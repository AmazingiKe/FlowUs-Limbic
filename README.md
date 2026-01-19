# FlowUs Limbic 项目概览

## 项目简介

`FlowUs Limbic` 是一个基于 Obsidian 插件架构的前端项目，主要功能是提供 **FlowUs** 系列的插件实现。项目使用 **TypeScript** 编写，构建工具为 **esbuild**，并通过 `main.ts` 暴露插件入口。项目结构简洁，核心代码位于 `src/` 目录下。

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

### 项目结构

```
FlowUs-Limbic/
├── src/
│   ├── main.ts              # 插件入口
│   ├── settings.ts          # 配置接口定义
│   ├── flowus/
│   │   ├── api.ts          # FlowUs API 客户端
│   │   └── oauth.ts        # OAuth 认证模块
│   └── todo/
│       ├── view.ts         # TODO 视图组件
│       └── sync.ts         # TODO 同步管理器
├── build/
│   └── esbuild.base.mjs   # esbuild 基础配置
├── esbuild.config.mjs      # esbuild 构建配置
├── package.json            # 项目依赖
├── tsconfig.json          # TypeScript 配置
├── manifest.json          # Obsidian 插件清单
└── main.js               # 构建输出（自动生成）
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 类型检查
npx tsc --noEmit
```

### 添加新功能

1. 在 `src/flowus/` 或 `src/todo/` 中添加新模块
2. 在 `src/main.ts` 中导入并使用新模块
3. 运行 `npm run build` 构建项目
4. 在 Obsidian 中测试新功能

## 常见问题

### Q: 插件无法加载？

**A:** 请检查以下几点：

1. 确认 `main.js` 和 `manifest.json` 已正确放置在插件目录
2. 检查 Obsidian 版本是否满足 `minAppVersion` 要求
3. 查看 Obsidian 控制台是否有错误信息

### Q: 授权失败？

**A:** 请确认：

1. Client ID 和 Client Secret 是否正确
2. 重定向 URI 是否设置为 `obsidian://flowus-limbic-callback`
3. 网络连接是否正常

### Q: 同步失败？

**A:** 可能的原因：

1. 访问令牌已过期，尝试重新授权
2. Database ID 或 Table Name 配置错误
3. FlowUs API 服务暂时不可用

### Q: TODO 不同步？

**A:** 请检查：

1. 确认已完成授权流程
2. 检查数据库字段是否包含 `title` 和 `completed`
3. 查看控制台日志获取详细错误信息

## 可优化与解耦的方向

| 方向               | 说明                                                                                                     | 预期收益                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **模块化业务逻辑** | 将 `src/flowus` 中的功能拆分为独立的子模块（如 `ui/`, `service/`, `store/`），并使用统一的接口进行交互。 | 提高代码可维护性，便于单元测试和复用。         |
| **插件入口抽象化** | 将插件的导出逻辑抽离到单独的 `src/plugin.ts`，使用工厂模式创建插件实例。                                 | 降低 `main.ts` 的耦合度，使入口文件更简洁。    |
| **配置文件分离**   | 将 `esbuild` 的公共配置抽离为 `build/` 目录下的共享配置文件，使用 `extend` 合并项目特有配置。            | 便于在多个插件项目之间共享构建配置，减少重复。 |
| **依赖注入 (DI)**  | 引入轻量级 DI 容器（如 `tsyringe`），在插件内部通过构造函数注入服务。                                    | 解耦业务实现与具体实现细节，提升可测试性。     |
| **日志统一管理**   | 使用统一的日志库（如 `loglevel`），在插件生命周期统一记录日志级别。                                      | 统一日志格式，便于调试和错误追踪。             |
| **类型声明分离**   | 将公共类型声明放在 `src/types/`，并在业务模块中引用。                                                    | 防止类型重复定义，提升 IDE 智能提示。          |
| **单元测试引入**   | 使用 `vitest` 或 `jest` 为 `src/flowus` 中的核心函数编写测试。                                           | 提升代码可靠性，防止回归。                     |

## 下一步建议

1. **创建模块目录**：在 `src/flowus` 下创建 `ui/`, `service/`, `store/` 子目录，并将现有业务代码迁移至对应模块。
2. **实现插件工厂**：新建 `src/plugin.ts`，使用工厂函数返回插件实例，`main.ts` 只负责导入并导出该实例。
3. **抽离构建配置**：在项目根目录新增 `build/`，把 `esbuild.config.mjs` 中的公共部分抽离为 `build/esbuild.base.mjs`，主配置通过 `import` 合并。
4. **引入 DI 容器**：在 `src/service/` 中使用 `tsyringe` 注入依赖，更新插件初始化逻辑。
5. **添加测试**：配置 `vitest`，为关键业务函数编写单元测试并在 CI 中运行。

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- 作者：Amazing Ike
- 网站：https://amazingike-flowus-libs.com

---

如有其他需求或需要进一步细化的实现方案，请随时告知！
