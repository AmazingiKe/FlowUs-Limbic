# FlowUs Kit Tools 架构设计文档

## 1. 设计意图
实现 FlowUs 同步逻辑的原子化，使其能够独立于 Obsidian 运行，支持自动化脚本及终端交互。

## 2. 模块划分
### 核心层: `@flowus-kit/sdk`
- **FlowUsAuthenticator**: 处理 OAuth 2.0 刷新逻辑。
- **FlowUsClient**: 封装 Pages/Blocks API。
- **Adapters**: 定义 `HttpAdapter` 和 `StorageAdapter` 抽象类。

### 交互层: `@flowus-kit/cli`
- **Command Line**: 使用 `commander` 构建，支持 `auth`, `todo [ls|add|done]`, `config`。
- **Formatter**: 将 API 返回的 JSON 转换为终端 Friendly 的表格。

### 适配层: `obsidian-bridge`
- **ObsidianStorage**: 实现 `StorageAdapter`，对接插件 `loadData/saveData`。

## 3. 关键路径解耦
现有的 `src/flowus/api.ts` 中的 `FlowUsAPI` 类将重构：
1. 移除 `this.settings`。
2. 构造函数改为接收 `FlowUsConfig` 对象。
3. 拦截器中的 Token 存储逻辑通过注入的 `StorageAdapter` 实现。

## 4. CLI 使用示例
```bash
# 身份验证
flowus-kit login

# 列出所有待办
flowus-kit todo ls --database <db_id>

# 完成一个任务
flowus-kit todo done <block_id>
```
