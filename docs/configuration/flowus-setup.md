# FlowUs 配置详解

本文档提供 FlowUs 开发者中心的详细配置指南，包括高级选项和最佳实践。

## 目录

- [创建应用](#创建应用)
- [OAuth 配置详解](#oauth-配置详解)
- [API 权限](#api-权限)
- [安全设置](#安全设置)
- [数据库设计](#数据库设计)
- [测试工具](#测试工具)
- [应用发布](#应用发布)
- [最佳实践](#最佳实践)

## 创建应用

### 应用信息详解

| 字段 | 说明 | 建议 |
|------|------|------|
| **应用名称** | 应用的显示名称 | 使用 "FlowUs Limbic" 或您的自定义名称 |
| **应用描述** | 应用的功能说明 | 清晰描述插件用途，如 "Obsidian 与 FlowUs 数据库双向同步工具" |
| **应用类型** | 应用的类型 | 选择 "Web 应用" 或 "桌面应用" |
| **应用图标** | 应用的图标 | 上传插件图标，提高辨识度 |

### 应用图标规范

- **格式**: PNG、JPG 或 SVG
- **尺寸**: 512x512 像素（推荐）
- **背景**: 透明或纯色
- **内容**: 简洁明了，避免过多细节

## OAuth 配置详解

### 授权模式

#### Authorization Code（推荐）

最安全的授权模式，适用于所有场景：

```
+---------+                               +---------------+
|         |--(A)- Authorization Request ->|   Resource    |
|         |                               |     Owner     |
|         |<-(B)-- Authorization Code ---|               |
|         |                               +---------------+
|         |
|         |                               +---------------+
| Client  |--(C)-- Authorization Code -->| Authorization |
|         |                               |     Server    |
|         |<-(D)----- Access Token -------|               |
|         |                               +---------------+
```

**优点**:
- 安全性最高
- 支持刷新令牌
- 适合长期使用

#### 其他模式（不推荐）

- **Implicit**: 仅用于纯前端应用，不支持刷新令牌
- **Client Credentials**: 仅用于服务器间通信，无需用户授权
- **Password Credentials**: 直接使用用户名密码，极不推荐

### 授权范围

| 范围 | 说明 | 必需 |
|------|------|------|
| `all` | 所有权限 | ✅ 推荐 |
| `database:read` | 读取数据库 | ✅ |
| `database:write` | 写入数据库 | ✅ |
| `user:read` | 读取用户信息 | ✅ |
| `block:read` | 读取 Block | ❌ |
| `block:write` | 写入 Block | ❌ |

### 重定向 URI

#### 格式要求

重定向 URI 必须完全匹配：

```
obsidian://flowus-limbic-callback
```

**注意事项**:
- 必须使用 `obsidian://` 协议
- 路径必须是 `flowus-limbic-callback`
- 不能有查询参数
- 不能有末尾斜杠
- 大小写敏感

#### 为什么使用自定义协议？

- Obsidian 可以注册自定义协议处理程序
- 授权完成后可以自动返回 Obsidian
- 更安全，不需要本地服务器

#### 多个重定向 URI

如果您需要在多个环境中测试，可以添加多个重定向 URI：

```
obsidian://flowus-limbic-callback（生产）
obsidian://flowus-limbic-dev（开发）
http://localhost:3000/callback（本地测试）
```

### 令牌有效期

| 令牌类型 | 建议有效期 | 说明 |
|---------|-----------|------|
| **访问令牌** | 1 小时 | 短期有效，降低泄露风险 |
| **刷新令牌** | 30 天 | 长期有效，用于换取新的访问令牌 |

#### 有效期设置策略

- **安全性要求高**: 访问令牌 15 分钟，刷新令牌 7 天
- **平衡**: 访问令牌 1 小时，刷新令牌 30 天（推荐）
- **便利性优先**: 访问令牌 24 小时，刷新令牌 90 天

## API 权限

### 权限列表详解

#### 数据库权限

```json
{
  "database:read": {
    "description": "读取数据库结构和内容",
    "operations": [
      "获取数据库信息",
      "查询数据库条目",
      "读取属性定义"
    ]
  },
  "database:write": {
    "description": "修改数据库内容",
    "operations": [
      "创建条目",
      "更新条目",
      "删除条目",
      "批量操作"
    ]
  }
}
```

#### 用户权限

```json
{
  "user:read": {
    "description": "读取用户基本信息",
    "operations": [
      "获取用户 ID",
      "获取用户名",
      "获取用户头像"
    ]
  }
}
```

#### Block 权限

```json
{
  "block:read": {
    "description": "读取 Block 内容",
    "operations": [
      "获取 Block 详情",
      "获取子 Block"
    ]
  },
  "block:write": {
    "description": "修改 Block 内容",
    "operations": [
      "创建 Block",
      "更新 Block",
      "删除 Block",
      "移动 Block"
    ]
  }
}
```

### 最小权限原则

只申请必要的权限：

| 功能 | 所需权限 |
|------|---------|
| 基础 TODO 同步 | `database:read`, `database:write`, `user:read` |
| 富文本描述 | `block:read`, `block:write` |
| 完整功能 | `all` |

## 安全设置

### PKCE（推荐）

#### 什么是 PKCE？

PKCE（Proof Key for Code Exchange）是一种增强 OAuth 2.0 安全性的机制，特别适用于公共客户端。

#### 工作原理

```
1. 客户端生成随机字符串 code_verifier
2. 客户端计算 code_challenge = S256(code_verifier)
3. 客户端在授权请求中发送 code_challenge
4. 授权服务器记录 code_challenge
5. 客户端在令牌请求中发送 code_verifier
6. 授权服务器验证 code_verifier
```

#### 启用 PKCE

在 FlowUs 开发者中心：

1. 进入应用设置
2. 找到"安全设置"部分
3. 启用"PKCE"选项

### 状态参数验证

#### 什么是状态参数？

状态参数（state）用于防止 CSRF 攻击，是一个随机字符串。

#### 工作原理

1. 客户端生成随机 state
2. 客户端在授权请求中发送 state
3. 授权服务器在回调中返回相同的 state
4. 客户端验证 state 是否匹配

#### 启用状态验证

在应用设置中启用"状态参数验证"。

### IP 白名单（可选）

如果您的应用只在特定网络环境中使用，可以配置 IP 白名单：

```
192.168.1.0/24（内网）
10.0.0.0/8（内网）
203.0.113.0/24（特定公网）
```

**注意**: IP 白名单会限制应用的使用场景，通常不推荐用于面向用户的应用。

### Client Secret 安全

#### 安全存储

- **不要**: 将 Client Secret 提交到代码仓库
- **不要**: 在客户端代码中硬编码 Client Secret
- **不要**: 通过不安全的渠道传输 Client Secret
- **要**: 使用环境变量存储
- **要**: 使用密钥管理服务
- **要**: 定期轮换 Client Secret

#### 轮换 Client Secret

如果怀疑 Client Secret 泄露：

1. 在开发者中心生成新的 Client Secret
2. 更新插件配置中的 Client Secret
3. 旧的 Client Secret 会在 24 小时后失效（或立即失效）

## 数据库设计

### 字段详细说明

#### 必需字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `title` | 标题 | TODO 的标题，每个数据库必须有且仅有一个标题字段 |
| `completed` | 复选框 | 标记 TODO 是否完成 |

#### 可选字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `description` | 富文本 | TODO 的详细描述 |
| `priority` | 选择 | 优先级（高/中/低） |
| `dueDate` | 日期 | 截止日期 |
| `tags` | 多选 | 标签 |
| `assignee` | 人员 | 负责人 |
| `status` | 选择 | 状态（待办/进行中/已完成） |

### 数据库模板

您可以使用以下 JSON 作为数据库模板：

```json
{
  "title": "FlowUs Limbic TODO",
  "properties": {
    "title": {
      "type": "title",
      "name": "标题"
    },
    "completed": {
      "type": "checkbox",
      "name": "完成"
    },
    "description": {
      "type": "rich_text",
      "name": "描述"
    },
    "priority": {
      "type": "select",
      "name": "优先级",
      "options": [
        { "name": "高", "color": "red" },
        { "name": "中", "color": "yellow" },
        { "name": "低", "color": "green" }
      ]
    },
    "dueDate": {
      "type": "date",
      "name": "截止日期"
    },
    "tags": {
      "type": "multi_select",
      "name": "标签",
      "options": [
        { "name": "工作", "color": "blue" },
        { "name": "个人", "color": "purple" },
        { "name": "学习", "color": "green" }
      ]
    }
  }
}
```

### 获取数据库 ID

#### 方法一：从 URL 获取

打开数据库后，浏览器地址栏中的 URL 格式：

```
https://flowus.cn/database/[数据库ID]
```

例如：
```
https://flowus.cn/database/abc123def456
                            ↑
                        数据库 ID
```

#### 方法二：从 API 获取

使用 FlowUs API 获取数据库列表：

```bash
curl https://api.flowus.cn/v1/databases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 测试工具

### OAuth 测试工具

FlowUs 开发者中心提供了 OAuth 测试工具：

#### 测试授权流程

1. 在应用详情页找到"测试工具"部分
2. 输入重定向 URI：`obsidian://flowus-limbic-callback`
3. 点击"测试授权"按钮
4. 浏览器会跳转到授权页面
5. 完成授权后会回调到重定向 URI
6. 检查是否成功获取到授权码

#### 测试令牌交换

使用授权码换取访问令牌：

```bash
curl -X POST https://api.flowus.cn/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTHORIZATION_CODE",
    "redirect_uri": "obsidian://flowus-limbic-callback"
  }'
```

### API 调试工具

#### 测试数据库查询

```bash
curl https://api.flowus.cn/v1/databases/YOUR_DATABASE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 测试数据库查询

```bash
curl -X POST https://api.flowus.cn/v1/databases/YOUR_DATABASE_ID/query \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_size": 10
  }'
```

## 应用发布

### 提交审核

当您完成开发和测试后，可以提交应用审核：

1. 在应用详情页点击"提交审核"
2. 填写审核信息：

| 字段 | 说明 |
|------|------|
| **应用用途** | 详细描述应用的功能和用途 |
| **目标用户** | 应用的目标用户群体 |
| **数据使用** | 说明如何使用和保护用户数据 |
| **隐私政策** | 链接到您的隐私政策（可选） |
| **服务条款** | 链接到您的服务条款（可选） |

### 审核流程

1. **提交审核**: 您提交审核申请
2. **审核中**: FlowUs 团队审核（3-5 个工作日）
3. **审核通过**: 应用获得生产环境访问权限
4. **审核未通过**: 根据反馈修改后重新提交

### 审核标准

- ✅ 应用功能清晰明确
- ✅ 数据使用说明详细
- ✅ 隐私保护措施完善
- ✅ 不违反 FlowUs 服务条款
- ✅ 提供有效的联系方式

## 最佳实践

### 安全性最佳实践

1. **启用 PKCE**: 始终启用 PKCE 增强安全性
2. **使用状态参数**: 启用状态参数验证防止 CSRF
3. **定期轮换密钥**: 每 90 天轮换一次 Client Secret
4. **最小权限原则**: 只申请必要的 API 权限
5. **加密存储**: 在客户端加密存储令牌

### 性能最佳实践

1. **合理设置令牌有效期**: 平衡安全性和用户体验
2. **使用缓存**: 缓存 API 响应减少请求次数
3. **批量操作**: 使用批量 API 减少请求次数
4. **实现重试机制**: 处理临时性网络错误
5. **指数退避**: 限流时使用指数退避策略

### 用户体验最佳实践

1. **清晰的错误信息**: 提供易于理解的错误提示
2. **无缝授权流程**: 优化授权流程，减少用户操作
3. **离线支持**: 支持离线使用，网络恢复后自动同步
4. **同步状态反馈**: 清晰显示同步状态
5. **冲突解决**: 提供友好的冲突解决界面

## 常见问题

参见 [常见问题](../faq.md) 部分。
