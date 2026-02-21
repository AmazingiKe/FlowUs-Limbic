# 安装指南

本指南将帮助您在 Obsidian 中安装 FlowUs Limbic 插件。

## 前置要求

在安装之前，请确保您满足以下要求：

- **Obsidian 版本**: v1.11.0 或更高版本
- **FlowUs 账户**: 一个有效的 FlowUs 账户
- **网络连接**: 能够访问 FlowUs API（https://api.flowus.cn）

## 安装方式

### 方式一：手动安装（推荐）

#### 1. 下载插件

1. 访问 [FlowUs Limbic GitHub 仓库](https://github.com/yourusername/FlowUs-Limbic)
2. 点击 "Releases" 页面
3. 下载最新版本的 `flowus-limbic.zip` 文件
4. 解压 ZIP 文件到本地目录

或者，您可以克隆仓库并自行构建：

```bash
git clone https://github.com/yourusername/FlowUs-Limbic.git
cd FlowUs-Limbic
npm install
npm run build
```

#### 2. 安装到 Obsidian

1. 打开 Obsidian
2. 进入 `设置` → `社区插件`
3. 关闭 `安全模式`（如果已开启）
4. 点击 `打开插件文件夹` 按钮
5. 在插件文件夹中创建 `flowus-limbic` 子文件夹
6. 将以下文件复制到 `flowus-limbic` 文件夹：
   - `main.js`
   - `manifest.json`
   - （可选）`styles.css`（如果存在）

#### 3. 启用插件

1. 返回 Obsidian 的 `社区插件` 设置页面
2. 刷新插件列表
3. 找到 `FlowUs Limbic` 并点击启用开关

### 方式二：开发模式

如果您想参与开发或测试最新功能，可以使用开发模式：

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/FlowUs-Limbic.git
cd FlowUs-Limbic

# 2. 安装依赖
npm install

# 3. 启动开发模式（监听文件变化）
npm run dev
```

然后，将项目文件夹符号链接到 Obsidian 插件文件夹：

**Windows (管理员 PowerShell):**
```powershell
New-Item -ItemType SymbolicLink -Path "%APPDATA%\Obsidian\plugins\flowus-limbic" -Target "D:\path\to\FlowUs-Limbic"
```

**macOS/Linux:**
```bash
ln -s /path/to/FlowUs-Limbic ~/Library/Application\ Support/Obsidian/plugins/flowus-limbic
```

## 验证安装

安装完成后，您可以通过以下方式验证插件是否正常工作：

1. 打开 Obsidian 设置
2. 在左侧菜单中应该能看到 `FlowUs Limbic` 选项
3. 点击进入设置页面，应该能看到插件配置界面

## 下一步

- [FlowUs 配置](./flowus-setup.md) - 配置 FlowUs 开发者账户
- [快速开始](./quickstart.md) - 开始使用插件

## 常见问题

### Q: 插件文件夹在哪里？

**A:** 插件文件夹的默认位置：

- **Windows**: `%APPDATA%\Obsidian\plugins\`
- **macOS**: `~/Library/Application Support/Obsidian/plugins/`
- **Linux**: `~/.config/obsidian/plugins/`

您也可以在 Obsidian 中通过 `设置` → `社区插件` → `打开插件文件夹` 快速打开。

### Q: 插件不显示在列表中？

**A:** 请检查：

1. `main.js` 和 `manifest.json` 是否正确放置在 `flowus-limbic` 文件夹中
2. Obsidian 版本是否满足要求（v1.11.0+）
3. 重启 Obsidian 试试

### Q: 如何更新插件？

**A:** 更新步骤与安装类似：

1. 下载新版本的插件文件
2. 替换插件文件夹中的 `main.js` 和 `manifest.json`
3. 重启 Obsidian 或在社区插件页面禁用再启用插件
