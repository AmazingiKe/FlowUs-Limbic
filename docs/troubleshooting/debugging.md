# 调试技巧

本指南将帮助您诊断和解决 FlowUs Limbic 插件的问题。

## 启用调试日志

### 在插件设置中启用

1. 打开 Obsidian 设置
2. 进入 "FlowUs Limbic" 设置页面
3. 找到"高级设置"部分
4. 启用"调试日志"选项
5. 将"日志级别"设置为 "Debug"

### 日志级别说明

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| **Error** | 仅错误信息 | 生产环境，只关注严重问题 |
| **Warn** | 警告和错误 | 生产环境，关注潜在问题 |
| **Info** | 一般信息（默认） | 正常使用，了解插件运行状态 |
| **Debug** | 详细调试信息 | 调试问题，获取完整日志 |

## 打开 Obsidian 控制台

### Windows/Linux

按 `Ctrl + Shift + I`（字母 i）或 `F12`

### macOS

按 `Cmd + Option + I`

### 替代方法

1. 点击 Obsidian 左下角的"帮助"按钮（问号图标）
2. 选择"打开开发者工具"

## 查看日志

### 过滤日志

在控制台中，使用过滤框只显示 FlowUs Limbic 的日志：

1. 在控制台顶部的过滤框中输入：`[FlowUs Limbic]`
2. 或使用正则表达式：`/\[FlowUs Limbic\]/`

### 日志格式

所有 FlowUs Limbic 日志都带有统一前缀：

```
[FlowUs Limbic] [级别] 消息内容
```

示例：
```
[FlowUs Limbic] [Info] 插件已加载
[FlowUs Limbic] [Debug] 开始同步
[FlowUs Limbic] [Error] 同步失败: Network error
```

### 保存日志

1. 在控制台中右键点击
2. 选择"另存为..."或"Save as..."
3. 选择保存位置
4. 保存为 `.log` 或 `.txt` 文件

## 常见调试场景

### 调试授权问题

1. 启用调试日志
2. 点击"授权"按钮
3. 观察控制台中的日志：
   ```
   [FlowUs Limbic] [Debug] 生成授权 URL
   [FlowUs Limbic] [Debug] 打开浏览器: https://api.flowus.cn/oauth/authorize?...
   [FlowUs Limbic] [Debug] 等待回调...
   [FlowUs Limbic] [Info] 收到回调，code: xxx
   [FlowUs Limbic] [Debug] 交换 token...
   [FlowUs Limbic] [Info] 授权成功
   ```

4. 如果在某一步停止，检查：
   - 浏览器是否打开
   - 网络连接是否正常
   - FlowUs 应用配置是否正确

### 调试同步问题

1. 启用调试日志
2. 点击"立即同步"按钮
3. 观察同步流程：
   ```
   [FlowUs Limbic] [Info] 开始同步
   [FlowUs Limbic] [Debug] 检查令牌...
   [FlowUs Limbic] [Debug] 令牌有效
   [FlowUs Limbic] [Debug] 获取本地变更...
   [FlowUs Limbic] [Debug] 发现 2 个本地变更
   [FlowUs Limbic] [Debug] 推送到远程...
   [FlowUs Limbic] [Debug] 推送成功
   [FlowUs Limbic] [Debug] 从远程拉取...
   [FlowUs Limbic] [Debug] 拉取到 5 条记录
   [FlowUs Limbic] [Debug] 检测冲突...
   [FlowUs Limbic] [Debug] 无冲突
   [FlowUs Limbic] [Info] 同步完成
   ```

4. 根据日志定位问题：
   - 如果卡在"检查令牌"：可能是授权问题
   - 如果卡在"推送到远程"：可能是网络或 API 问题
   - 如果"检测冲突"发现冲突：查看冲突解决策略

### 调试 API 调用

所有 API 调用都会记录详细日志：

```
[FlowUs Limbic] [Debug] API Request: GET /v1/databases/xxx
[FlowUs Limbic] [Debug] API Response: 200 OK (45ms)
[FlowUs Limbic] [Debug] API Request: POST /v1/databases/xxx/query
[FlowUs Limbic] [Debug] API Response: 200 OK (120ms)
```

查看网络请求详情：

1. 打开控制台的"Network"（网络）标签
2. 过滤请求：输入 `api.flowus.cn`
3. 点击任意请求查看详情：
   - Headers（请求头）
   - Payload（请求体）
   - Response（响应）

### 调试数据转换

如果数据没有正确显示，查看转换日志：

```
[FlowUs Limbic] [Debug] 转换 Entity -> Blocks
[FlowUs Limbic] [Debug] 输入: { id: "xxx", title: "测试", completed: false }
[FlowUs Limbic] [Debug] 输出: [{ type: "to_do", ... }]
[FlowUs Limbic] [Debug] 转换 Blocks -> Entity
[FlowUs Limbic] [Debug] 输入: [{ type: "to_do", ... }]
[FlowUs Limbic] [Debug] 输出: { id: "xxx", title: "测试", completed: false }
```

## 网络诊断

### 测试网络连接

在浏览器中访问以下 URL，测试是否能连接到 FlowUs API：

```
https://api.flowus.cn/
```

如果能打开，说明网络连接正常。

### 测试 API 端点

使用 curl 测试 API 端点（替换为您的实际参数）：

```bash
# 测试获取数据库信息
curl -X GET https://api.flowus.cn/v1/databases/YOUR_DATABASE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 测试查询数据库
curl -X POST https://api.flowus.cn/v1/databases/YOUR_DATABASE_ID/query \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_size": 5}'
```

### 检查防火墙/代理

如果您在公司网络或使用代理：

1. 检查是否需要配置代理
2. 检查防火墙是否允许访问 `api.flowus.cn`
3. 尝试在其他网络环境（如手机热点）中测试

## 数据诊断

### 导出数据

在插件设置中点击"导出数据"，导出为 JSON 格式。

### 检查数据格式

查看导出的 JSON 数据，确认：

```json
{
  "todos": [
    {
      "id": "xxx",
      "type": "todo",
      "title": "测试任务",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "properties": {}
    }
  ],
  "syncState": {
    "lastSyncAt": "2024-01-01T00:00:00Z",
    "cursor": "xxx"
  }
}
```

### 验证 FlowUs 数据

直接在 FlowUs 中检查数据：

1. 打开您的 FlowUs 数据库
2. 确认字段名称和类型正确
3. 检查数据是否完整

## 常见错误代码

### HTTP 状态码

| 代码 | 说明 | 解决方案 |
|------|------|---------|
| 400 | 请求参数错误 | 检查请求参数是否正确 |
| 401 | 未授权 | 重新授权 |
| 403 | 权限不足 | 检查 FlowUs 应用权限 |
| 404 | 资源不存在 | 检查 Database ID 是否正确 |
| 429 | 请求过多 | 等待后重试，调长同步间隔 |
| 500 | 服务器错误 | FlowUs 服务器问题，稍后重试 |
| 502 | 网关错误 | FlowUs 服务器问题，稍后重试 |
| 503 | 服务不可用 | FlowUs 服务器问题，稍后重试 |

### 插件错误代码

| 代码 | 说明 | 解决方案 |
|------|------|---------|
| `AUTH_ERROR` | 认证失败 | 重新授权 |
| `TOKEN_EXPIRED` | 令牌过期 | 重新授权或刷新令牌 |
| `SYNC_CONFLICT` | 同步冲突 | 根据冲突策略处理 |
| `NETWORK_ERROR` | 网络错误 | 检查网络连接 |
| `API_ERROR` | API 错误 | 查看详细错误信息 |
| `VALIDATION_ERROR` | 数据验证失败 | 检查数据格式 |

## 提交调试信息

### 收集信息

提交 Issue 时，请包含以下信息：

1. **环境信息**:
   - Obsidian 版本
   - FlowUs Limbic 版本
   - 操作系统（Windows/macOS/Linux）
   - 浏览器（如果涉及）

2. **问题描述**:
   - 问题发生的时间
   - 复现步骤
   - 预期行为
   - 实际行为

3. **调试信息**:
   - 控制台日志（保存为文件）
   - 网络请求截图
   - 导出的数据（如果不敏感）
   - 配置截图（隐藏敏感信息）

### 安全提示

提交公开 Issue 时注意：

- ❌ 不要包含 Client Secret
- ❌ 不要包含 Access Token
- ❌ 不要包含数据库 ID（如敏感）
- ❌ 不要包含个人数据
- ✅ 可以模糊化或删除敏感信息

## 重置调试状态

### 清除日志

控制台日志会在 Obsidian 重启时自动清除。

### 重置调试设置

1. 在插件设置中关闭"调试日志"
2. 将"日志级别"恢复为 "Info"
3. 重启 Obsidian

### 完全重置

如果需要完全重置：

1. 关闭 Obsidian
2. 删除插件文件夹中的 `data.json`
3. 重新打开 Obsidian
4. 重新配置插件

## 下一步

如果调试后仍无法解决问题：

- 查看 [常见问题](./common-issues.md)
- 查看 [数据恢复](./data-recovery.md)
- 提交 [GitHub Issue](https://github.com/yourusername/FlowUs-Limbic/issues)
