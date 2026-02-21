# 插件设置

FlowUs Limbic 提供了丰富的配置选项，让您可以根据自己的需求自定义插件行为。

## 访问设置

1. 打开 Obsidian 设置
2. 在左侧菜单中找到并点击 "FlowUs Limbic"
3. 进入设置页面

## 基本设置

### FlowUs 连接

#### Client ID
- **说明**: FlowUs 应用的唯一标识符
- **获取方式**: 在 [FlowUs 开发者中心](https://api.flowus.cn/) 创建应用后获得
- **必填**: 是

#### Client Secret
- **说明**: FlowUs 应用的密钥
- **获取方式**: 在 FlowUs 开发者中心创建应用后获得
- **必填**: 是
- **安全提示**: 请妥善保管，不要分享给他人

#### Database ID
- **说明**: FlowUs 数据库的 ID
- **获取方式**: 在 FlowUs 中打开数据库，从浏览器地址栏中复制
- **必填**: 是

#### Table Name
- **说明**: FlowUs 数据库表名
- **默认值**: 通常与数据库名称相同
- **必填**: 是

### 授权状态

#### 授权按钮
- 点击"授权"按钮开始 OAuth 流程
- 浏览器会打开 FlowUs 授权页面
- 授权成功后自动返回 Obsidian

#### 授权状态显示
- **未授权**: 显示红色"未授权"
- **已授权**: 显示绿色"已授权"，并显示过期时间
- **过期**: 显示黄色"已过期"，需要重新授权

#### 注销按钮
- 点击"注销"可以清除当前授权信息
- 注销后需要重新授权才能使用同步功能

## 同步设置

### 同步间隔

- **选项**: 10 秒、30 秒、1 分钟、2 分钟、5 分钟
- **默认值**: 30 秒
- **说明**: 自动同步的时间间隔

> **提示**: 较短的同步间隔可以获得更好的实时性，但会消耗更多 API 请求配额。如果您的 API 配额有限，建议设置为 1-2 分钟。

### 同步方向

- **双向同步**（默认）: 本地和远程变更互同步
- **仅推送**: 只将本地变更推送到远程
- **仅拉取**: 只从远程拉取变更到本地

### 冲突解决策略

当本地和远程同时修改同一项目时，如何处理冲突：

| 策略 | 说明 |
|------|------|
| **远程优先** | 远程版本覆盖本地版本（默认） |
| **本地优先** | 本地版本覆盖远程版本 |
| **时间戳优先** | 较新的版本覆盖较旧的版本 |
| **手动选择** | 每次冲突时手动选择 |

### 自动同步

- **启用自动同步**: 开启/关闭自动同步
- **默认值**: 开启
- **说明**: 关闭后需要手动点击"立即同步"按钮

### 手动同步

- **立即同步**按钮: 点击立即执行一次同步
- **同步状态**: 显示当前同步进度和结果

## 界面设置

### TODO 视图

#### 默认筛选
- **选项**: 全部、未完成、已完成
- **默认值**: 未完成
- **说明**: 打开 TODO 视图时默认显示的筛选条件

#### 默认排序
- **选项**: 截止日期、优先级、创建时间、更新时间
- **默认值**: 截止日期
- **说明**: TODO 列表的默认排序方式

#### 显示已完成
- **默认值**: 关闭
- **说明**: 是否在列表中显示已完成的 TODO

#### 已完成 TODO 样式
- **选项**: 删除线、灰色、隐藏
- **默认值**: 删除线
- **说明**: 已完成 TODO 的显示样式

### 通知设置

#### 同步完成通知
- **默认值**: 关闭
- **说明**: 同步成功时是否显示通知

#### 同步失败通知
- **默认值**: 开启
- **说明**: 同步失败时是否显示通知

#### 冲突提醒
- **默认值**: 开启
- **说明**: 发生同步冲突时是否显示提醒

### 状态栏

#### 显示同步状态
- **默认值**: 开启
- **说明**: 是否在 Obsidian 状态栏显示同步状态

#### 状态更新频率
- **选项**: 实时、10 秒、30 秒、1 分钟
- **默认值**: 实时
- **说明**: 状态栏同步状态的更新频率

## 高级设置

### 数据管理

#### 重置缓存
- 点击"重置缓存"按钮可以清除所有本地缓存数据
- **警告**: 这不会影响 FlowUs 中的数据，但本地未同步的变更会丢失

#### 导出数据
- 点击"导出数据"可以将所有本地数据导出为 JSON 文件
- 用于备份或迁移

#### 导入数据
- 点击"导入数据"可以从 JSON 文件导入数据
- **警告**: 导入会覆盖现有数据，请先备份

### 性能设置

#### 批量大小
- **选项**: 10、20、50、100
- **默认值**: 50
- **说明**: 每次 API 调用处理的项目数量

#### 并发请求数
- **选项**: 1、2、3、5
- **默认值**: 3
- **说明**: 同时发起的 API 请求数量

#### 缓存 TTL
- **选项**: 1 分钟、5 分钟、15 分钟、1 小时
- **默认值**: 5 分钟
- **说明**: API 响应缓存的时间

### 调试设置

#### 启用调试日志
- **默认值**: 关闭
- **说明**: 是否输出详细的调试日志

#### 日志级别
- **选项**: Error、Warn、Info、Debug
- **默认值**: Info
- **说明**: 日志输出的详细程度

#### 打开控制台
- 点击"打开控制台"按钮快速打开 Obsidian 开发者工具

## 设置配置文件

### 配置文件位置

插件设置保存在 Obsidian 的配置目录中：

- **Windows**: `%APPDATA%\Obsidian\plugins\flowus-limbic\data.json`
- **macOS**: `~/Library/Application Support/Obsidian/plugins/flowus-limbic/data.json`
- **Linux**: `~/.config/obsidian/plugins/flowus-limbic/data.json`

### 配置文件格式

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "databaseId": "your-database-id",
  "tableName": "your-table-name",
  "accessToken": "encrypted-access-token",
  "refreshToken": "encrypted-refresh-token",
  "tokenExpiry": 1234567890,
  "syncInterval": 30,
  "syncDirection": "bidirectional",
  "conflictStrategy": "remote-wins",
  "autoSync": true,
  "defaultFilter": "incomplete",
  "defaultSort": "due-date",
  "showCompleted": false,
  "completedStyle": "strikethrough",
  "notifySyncComplete": false,
  "notifySyncError": true,
  "notifyConflict": true,
  "showStatusBar": true,
  "statusUpdateFreq": "realtime",
  "batchSize": 50,
  "concurrentRequests": 3,
  "cacheTTL": 300,
  "debugLogging": false,
  "logLevel": "info"
}
```

## 下一步

- [FlowUs 配置详解](./flowus-setup.md) - 了解更多 FlowUs 配置选项
- [故障排除](../troubleshooting/common-issues.md) - 解决配置问题
