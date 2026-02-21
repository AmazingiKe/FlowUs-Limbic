# 开发环境搭建

本指南将帮助您搭建 FlowUs Limbic 插件的开发环境。

## 前置要求

在开始之前，请确保您已安装以下工具：

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.0.0 | JavaScript 运行时 |
| **npm** | >= 9.0.0 或 yarn >= 1.22.0 | 包管理器 |
| **Git** | 任意 | 版本控制 |
| **Obsidian** | >= 1.11.0 | 用于测试插件 |
| **代码编辑器** | 任意 | 推荐 VS Code |

### 安装 Node.js

访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装：

```bash
node --version
npm --version
```

### 安装 Git

访问 [Git 官网](https://git-scm.com/) 下载并安装。

验证安装：

```bash
git --version
```

## 克隆仓库

### 方式一：使用 HTTPS

```bash
git clone https://github.com/yourusername/FlowUs-Limbic.git
cd FlowUs-Limbic
```

### 方式二：使用 SSH

```bash
git clone git@github.com:yourusername/FlowUs-Limbic.git
cd FlowUs-Limbic
```

### 方式三：Fork 后克隆

如果您计划贡献代码：

1. 在 GitHub 上 Fork 项目
2. 克隆您的 Fork：
   ```bash
   git clone git@github.com:您的用户名/FlowUs-Limbic.git
   cd FlowUs-Limbic
   ```
3. 添加上游远程：
   ```bash
   git remote add upstream https://github.com/yourusername/FlowUs-Limbic.git
   ```

## 安装依赖

### 使用 npm

```bash
npm install
```

### 使用 yarn

```bash
yarn install
```

## 项目结构

```
FlowUs-Limbic/
├── src/                  # 源代码
│   ├── main.ts          # 插件入口
│   ├── settings.ts      # 设置接口
│   ├── settings-tab.ts  # 设置界面
│   ├── flowus/          # FlowUs 相关模块
│   │   ├── api.ts      # API 客户端
│   │   └── oauth.ts    # OAuth 认证
│   └── todo/            # TODO 模块
│       ├── sync.ts     # 同步管理器
│       └── view.ts     # TODO 视图
├── build/               # 构建配置
│   └── esbuild.base.mjs
├── docs/                # 文档
├── esbuild.config.mjs   # esbuild 配置
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
├── manifest.json        # Obsidian 插件清单
└── README.md           # 项目说明
```

## 开发工作流

### 1. 创建开发分支

```bash
git checkout -b feature/您的功能名
# 或
git checkout -b fix/您修复的问题
```

### 2. 启动开发模式

```bash
npm run dev
```

这会启动 esbuild 的监听模式，文件变更时自动重新构建。

### 3. 链接到 Obsidian 插件目录

为了在 Obsidian 中测试，需要将构建输出链接到 Obsidian 插件目录。

#### Windows (管理员 PowerShell)

```powershell
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Obsidian\plugins\flowus-limbic" -Target "D:\path\to\FlowUs-Limbic"
```

#### macOS

```bash
ln -s /path/to/FlowUs-Limbic ~/Library/Application\ Support/Obsidian/plugins/flowus-limbic
```

#### Linux

```bash
ln -s /path/to/FlowUs-Limbic ~/.config/obsidian/plugins/flowus-limbic
```

### 4. 在 Obsidian 中测试

1. 打开 Obsidian
2. 进入 `设置` → `社区插件`
3. 找到 "FlowUs Limbic" 并启用
4. 测试您的修改

### 5. 运行类型检查

```bash
npx tsc --noEmit
```

### 6. 运行测试（如果有）

```bash
npm test
```

## 构建

### 开发构建

```bash
npm run dev
```

监听文件变化并自动重新构建，生成未压缩的代码和 sourcemap。

### 生产构建

```bash
npm run build
```

生成压缩的代码，无 sourcemap，用于发布。

## 配置开发环境

### VS Code 配置

推荐安装以下扩展：

- **TypeScript and JavaScript Language Features** (内置)
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **GitLens** - Git 增强

`.vscode/settings.json` 示例：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 调试配置

`.vscode/launch.json` 示例：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Obsidian",
      "port": 9229,
      "protocol": "inspector"
    }
  ]
}
```

## 代码规范

### 代码风格

- 使用 TypeScript 严格模式
- 遵循项目现有的代码风格
- 使用有意义的变量名和函数名
- 保持函数简短，单一职责

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

Type 类型：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：

```
feat(todo): 添加优先级筛选功能

- 添加优先级筛选 UI
- 更新同步逻辑支持优先级
- 添加相关测试

Closes #123
```

## 测试

### 单元测试

```bash
npm test
```

### 手动测试清单

- [ ] 插件可以正常加载
- [ ] 设置界面可以正常打开
- [ ] 授权流程正常工作
- [ ] TODO 可以正常创建
- [ ] TODO 可以正常编辑
- [ ] TODO 可以正常删除
- [ ] 同步功能正常工作
- [ ] 离线模式正常工作

## 常见开发问题

### Q: esbuild 报错？

**A**: 尝试：
1. 删除 `node_modules` 和 `package-lock.json`
2. 重新运行 `npm install`
3. 确保 Node.js 版本符合要求

### Q: Obsidian 不加载插件？

**A**: 检查：
1. 符号链接是否正确创建
2. `main.js` 和 `manifest.json` 是否存在
3. Obsidian 控制台是否有错误
4. 尝试重启 Obsidian

### Q: 如何调试？

**A**:
1. 打开 Obsidian 控制台（`Ctrl/Cmd + Shift + I`）
2. 查看 Console 标签
3. 使用 `console.log()` 输出调试信息
4. 或使用 VS Code 的调试器附加

## 下一步

- [Schema 开发指南](./schema-development.md) - 学习如何扩展数据类型
- [构建系统](./build-system.md) - 了解构建配置
- [测试指南](./testing-guidelines.md) - 学习如何编写测试
- [架构决策记录](./architecture-decisions.md) - 了解技术决策
