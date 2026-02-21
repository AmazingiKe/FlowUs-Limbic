# API 参考

本文档提供 FlowUs Limbic 的 API 参考。

> **注意**: 此 API 参考主要面向插件开发者。普通用户请参考 [使用指南](../getting-started/quickstart.md)。

## 目录

- [FlowUsAdapter](#flowusadapter)
- [AuthManager](#authmanager)
- [Entity Registry](#entity-registry)
- [Transformer Engine](#transformer-engine)
- [Sync Engine](#sync-engine)
- [存储适配器](#存储适配器)

---

## FlowUsAdapter

FlowUs API 的统一入口。

### 构造函数

```typescript
constructor(
  storage: IStorageAdapter,
  config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }
)
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `auth` | `AuthManager` | 认证管理器 |
| `block` | `FlowUsBlockClient` | Block API 客户端 |
| `page` | `FlowUsPageClient` | Page API 客户端 |
| `database` | `FlowUsDatabaseClient` | Database API 客户端 |

### 方法

#### initialize()

初始化适配器，加载存储的令牌。

```typescript
async initialize(): Promise<void>
```

**示例**:
```typescript
const adapter = new FlowUsAdapter(storage, config);
await adapter.initialize();
```

---

## AuthManager

管理 OAuth 令牌。

### 方法

#### getAuthorizationUrl()

获取授权 URL。

```typescript
getAuthorizationUrl(state?: string): string
```

**示例**:
```typescript
const authUrl = authManager.getAuthorizationUrl();
window.open(authUrl, '_blank');
```

#### exchangeCode()

使用授权码换取令牌。

```typescript
async exchangeCode(code: string): Promise<TokenInfo>
```

**示例**:
```typescript
const tokenInfo = await authManager.exchangeCode(authorizationCode);
```

#### refreshAccessToken()

刷新访问令牌。

```typescript
async refreshAccessToken(): Promise<TokenInfo>
```

#### getAccessToken()

获取当前有效的访问令牌。

```typescript
async getAccessToken(): Promise<string>
```

#### isAuthenticated()

检查是否已认证。

```typescript
isAuthenticated(): boolean
```

#### logout()

清除认证信息。

```typescript
async logout(): Promise<void>
```

---

## Entity Registry

管理实体 Schema。

### 方法

#### register()

注册实体 Schema。

```typescript
register<T extends IUniversalEntity>(schema: EntitySchema<T>): void
```

**示例**:
```typescript
registry.register(todoSchema);
```

#### get()

获取指定类型的 Schema。

```typescript
get<T extends IUniversalEntity>(type: EntityType): EntitySchema<T>
```

**示例**:
```typescript
const schema = registry.get<Todo>('todo');
```

#### has()

检查类型是否已注册。

```typescript
has(type: EntityType): boolean
```

#### getAllTypes()

获取所有已注册类型。

```typescript
getAllTypes(): EntityType[]
```

#### getAllSchemas()

获取所有 Schema。

```typescript
getAllSchemas(): EntitySchema[]
```

#### lock() / unlock()

锁定/解锁注册中心。

```typescript
lock(): void
unlock(): void
```

---

## Transformer Engine

执行实体与 Block 的双向转换。

### 构造函数

```typescript
constructor(registry: EntityRegistry)
```

### 方法

#### use()

注册中间件。

```typescript
use(middleware: TransformMiddleware): void
```

**示例**:
```typescript
transformer.use(loggingMiddleware);
```

#### toBlocks()

转换实体为 Blocks。

```typescript
toBlocks<T extends IUniversalEntity>(entity: T): BlockNode[]
```

**示例**:
```typescript
const blocks = transformer.toBlocks(todo);
```

#### fromBlocks()

转换 Blocks 为实体。

```typescript
fromBlocks<T extends IUniversalEntity>(
  blocks: BlockNode[],
  entityType: EntityType,
  metadata?: any
): T
```

**示例**:
```typescript
const todo = transformer.fromBlocks<Todo>(blocks, 'todo', metadata);
```

#### toBatchBlocks()

批量转换实体为 Blocks。

```typescript
toBatchBlocks<T extends IUniversalEntity>(entities: T[]): BlockNode[][]
```

#### fromBatchBlocks()

批量转换 Blocks 为实体。

```typescript
fromBatchBlocks<T extends IUniversalEntity>(
  blocksArray: BlockNode[][],
  entityType: EntityType
): T[]
```

---

## Sync Engine

同步引擎。

### 构造函数

```typescript
constructor(
  registry: EntityRegistry,
  transformer: TransformerEngine,
  localAdapter: IStorageAdapter,
  remoteAdapter: FlowUsAdapter,
  options?: SyncOptions
)
```

### 方法

#### sync()

执行同步。

```typescript
async sync(): Promise<SyncResult>
```

**示例**:
```typescript
const result = await syncEngine.sync();
console.log(`Synced ${result.updated} items`);
```

#### push()

推送本地变更到远程。

```typescript
async push(): Promise<SyncResult>
```

#### pull()

拉取远程变更到本地。

```typescript
async pull(): Promise<SyncResult>
```

#### getStatus()

获取同步状态。

```typescript
getStatus(): SyncStatus
```

---

## 存储适配器

### IStorageAdapter 接口

```typescript
interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;
}
```

### ObsidianStorageAdapter

使用 Obsidian 插件数据存储。

```typescript
constructor(plugin: Plugin)
```

### FileStorageAdapter

使用文件系统存储。

```typescript
constructor(basePath: string)
```

### MemoryStorageAdapter

内存存储（用于测试）。

```typescript
constructor()
```

---

## 类型定义

### IUniversalEntity

```typescript
interface IUniversalEntity {
  id: string;
  type: EntityType;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  properties: Record<string, any>;
  content?: BlockNode[];
}
```

### EntitySchema

```typescript
interface EntitySchema<T extends IUniversalEntity = IUniversalEntity> {
  type: EntityType;
  displayName: string;
  description?: string;
  properties: PropertyDefinition[];
  toBlocks: (entity: T) => BlockNode[];
  fromBlocks: (blocks: BlockNode[], metadata?: any) => T;
  getFingerprint: (entity: T) => string;
  validate?: (entity: T) => ValidationResult;
}
```

### BlockNode

```typescript
interface BlockNode {
  object: 'block';
  id?: string;
  type: BlockType;
  created_time?: string;
  last_edited_time?: string;
  has_children?: boolean;
  archived?: boolean;
  [key: string]: any;
}
```

---

## 错误类型

### FlowUsApiError

```typescript
class FlowUsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) { /* ... */ }
}
```

### AuthenticationError

```typescript
class AuthenticationError extends FlowUsApiError {
  constructor(message: string) { /* ... */ }
}
```

### RateLimitError

```typescript
class RateLimitError extends FlowUsApiError {
  constructor(public retryAfter: number) { /* ... */ }
}
```

---

## 插件 API

### 命令

| 命令 ID | 说明 |
|---------|------|
| `flowus-limbic:open-todo-view` | 打开 TODO 视图 |
| `flowus-limbic:sync-now` | 立即同步 |
| `flowus-limbic:open-settings` | 打开设置 |

### 设置 Tab

插件注册的设置 Tab ID 为 `flowus-limbic`。

### 视图

插件注册的视图类型为 `flowus-limbic-todo`。

---

## 下一步

- [架构概览](../architecture/overview.md) - 了解系统架构
- [Schema 开发指南](../development/schema-development.md) - 扩展数据类型
