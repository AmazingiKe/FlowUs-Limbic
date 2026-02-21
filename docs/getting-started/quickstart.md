# 5 分钟快速开始

本指南将帮助您在 5 分钟内快速上手 FlowUs Limbic。

## 前提条件

- 已安装 Obsidian（v1.11.0+）
- 有一个 FlowUs 账户
- 已完成插件安装（参见 [安装指南](./installation.md)）

## 步骤 1：配置 FlowUs 开发者账户（2 分钟）

1. 访问 [FlowUs 开发者中心](https://api.flowus.cn/)
2. 登录您的 FlowUs 账户
3. 点击"创建应用"
4. 填写应用信息：
   - **应用名称**: FlowUs Limbic
   - **应用描述**: Obsidian 与 FlowUs 数据库同步工具
   - **重定向 URI**: `obsidian://flowus-limbic-callback`
5. 创建成功后，记录下 **Client ID** 和 **Client Secret**

## 步骤 2：创建 FlowUs 数据库（1 分钟）

1. 在 FlowUs 中创建一个新的数据库
2. 添加以下字段：
   - `title`（标题）- 文本类型（必需）
   - `completed`（完成状态）- 复选框类型（必需）
3. （可选）添加更多字段：
   - `description`（描述）- 文本类型
   - `priority`（优先级）- 选择类型（高/中/低）
   - `dueDate`（截止日期）- 日期类型
4. 从浏览器地址栏中复制数据库 ID

## 步骤 3：配置插件（1 分钟）

1. 打开 Obsidian 设置
2. 进入 `FlowUs Limbic` 设置页面
3. 填写以下信息：
   - **Client ID**: 从 FlowUs 开发者中心获取
   - **Client Secret**: 从 FlowUs 开发者中心获取
   - **Database ID**: FlowUs 数据库的 ID
   - **Table Name**: 您的数据库表名
4. 点击"授权"按钮
5. 在弹出的浏览器窗口中完成授权

## 步骤 4：开始使用（1 分钟）

1. 在 Obsidian 中打开命令面板（Ctrl/Cmd + P）
2. 搜索"FlowUs TODO: Open View"并执行
3. 在 TODO 视图中，输入您的第一个 TODO 并按 Enter
4. 查看 FlowUs 数据库，您的 TODO 应该已经同步过去了！

## 恭喜！

您已经成功设置并开始使用 FlowUs Limbic 了！

## 下一步

- [TODO 管理](../features/todo-management.md) - 学习更多 TODO 管理功能
- [同步功能](../features/synchronization.md) - 了解同步机制
- [插件设置](../configuration/plugin-settings.md) - 自定义插件配置
