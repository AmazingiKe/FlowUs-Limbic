# FlowUs Limbic 架构设计文档

## 1. 架构愿景

实现 Obsidian 与 FlowUs 的**通用双向实时同步**，支持任意数据类型通过声明式 Schema 快速接入。

---

## 2. 架构原则

| 原则 | 说明 |
|------|------|
| **Block 统一** | 一切数据最终映射为 FlowUs Block，与 FlowUs API 原生对齐 |
| **Schema 驱动** | 通过声明式 Schema 定义数据模型，零代码侵入核心逻辑 |
| **环境无关** | 存储层、网络层完全抽象，Obsidian/CLI/其他环境复用同一套逻辑 |
| **增量同步** | 基于时间戳和指纹的变更检测，最小化 API 调用 |

---

## 3. 系统分层

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            应用层 (Presentation)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Obsidian UI  │  │  CLI Tools   │  │  Web Dashboard│  │  Other Apps  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          通用同步层 (Universal Sync)                      │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│   │   Entity     │    │  Transformer │    │    Sync      │             │
│   │   Registry   │◄──►│   Engine     │◄──►│   Engine     │             │
│   └──────────────┘    └──────────────┘    └──────────────┘             │
│          ↑                                              ↑               │
│   ┌──────────────┐                              ┌──────────────┐       │
│   │    Schema    │                              │   Conflict   │       │
│   │   Definition │                              │   Resolver   │       │
│   └──────────────┘                              └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          适配层 (Adapter Layer)                          │
│                                                                         │
│   ┌────────────────────────────────┐    ┌──────────────────────────┐   │
│   │      FlowUs API Adapter        │    │    Local Storage Adapter  │   │
│   │  ┌──────────┐  ┌──────────┐   │    │  ┌──────────────────────┐ │   │
│   │  │  Block   │  │ Database │   │    │  │  Obsidian Adapter    │ │   │
│   │  │  Client  │  │  Client  │   │    │  │  (File System)       │ │   │
│   │  └──────────┘  └──────────┘   │    │  └──────────────────────┘ │   │
│   │  ┌──────────┐  ┌──────────┐   │    │  ┌──────────────────────┐ │   │
│   │  │   Page   │  │   User   │   │    │  │  File Adapter        │ │   │
│   │  │  Client  │  │  Client  │   │    │  │  (Node.js)           │ │   │
│   │  └──────────┘  └──────────┘   │    │  └──────────────────────┘ │   │
│   └────────────────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          外部服务 (External Services)                     │
│                      ┌─────────────────────────┐                        │
│                      │    FlowUs Platform      │                        │
│                      │    (API: api.flowus.cn) │                        │
│                      └─────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 核心组件

### 4.1 Entity Registry (实体注册中心)

**职责**: 管理所有数据类型的 Schema 定义，提供运行时类型解析。

**设计要点**:
- 单一注册中心实例，全应用共享
- 延迟加载 Schema，按需注册
- 支持 Schema 热更新（开发调试）

### 4.2 Transformer Engine (转换引擎)

**职责**: 执行 Entity ↔ Block 的双向转换。

**设计要点**:
- 纯函数设计，无副作用
- 管道化处理，支持中间件拦截
- 错误隔离，单个 Block 失败不影响整体

### 4.3 Sync Engine (同步引擎)

**职责**: 协调本地与远程的数据一致性。

**设计要点**:
- 泛型实现，与具体数据类型解耦
- 可插拔冲突解决策略
- 支持批量操作与事务语义

### 4.4 FlowUs Adapter (FlowUs 适配器)

**职责**: 封装 FlowUs API，统一错误处理与重试逻辑。

**设计要点**:
- 分层客户端：Block / Page / Database
- Token 自动刷新与请求队列
- API 限流保护（Rate Limiting）

---

## 5. 数据流

### 5.1 本地 → 远程 (Push)

```
[本地 Entity]
      ↓
[Entity Registry] → 查找对应 Schema
      ↓
[Transformer] → Entity → Block[]
      ↓
[FlowUs Adapter] → 调用 API
      ↓
[FlowUs Platform]
```

### 5.2 远程 → 本地 (Pull)

```
[FlowUs Platform]
      ↓
[FlowUs Adapter] → 接收 Webhook / 轮询 API
      ↓
[Transformer] → Block[] → Entity
      ↓
[Entity Registry] → 验证类型
      ↓
[Local Storage Adapter] → 持久化
      ↓
[本地 Entity]
```

### 5.3 冲突解决

当本地与远程同时变更时：

```
[本地变更 A] ──┐
               ├──► [Conflict Detector] → 检测冲突
[远程变更 B] ──┘               ↓
                      [Conflict Resolver]
                       /      |      \
                Remote    Manual    Custom
                 Wins     Select    Logic
```

---

## 6. 扩展性设计

### 6.1 添加新数据类型

只需 3 步：

1. **定义实体类型** (interface)
2. **编写 Schema** (toBlocks + fromBlocks)
3. **注册到 Registry** (registry.register())

核心代码零修改。

### 6.2 添加新存储后端

实现 `IStorageAdapter` 接口：

```typescript
interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;
}
```

可用于支持：
- 数据库存储 (SQLite/PostgreSQL)
- 云存储 (S3/MinIO)
- 加密存储

### 6.3 添加新冲突策略

实现 `IConflictResolver` 接口：

```typescript
interface IConflictResolver<T> {
  resolve(local: T, remote: T): Resolution<T>;
}
```

内置策略：
- `RemoteWinsResolver`: 远程优先
- `LocalWinsResolver`: 本地优先
- `TimestampResolver`: 时间戳较新者胜
- `ManualResolver`: 用户手动选择

---

## 7. 文件组织

```
src/
├── universal/          # 通用同步层
│   ├── types.ts        # 核心类型定义
│   ├── registry.ts     # 实体注册中心
│   ├── transformer.ts  # 转换引擎
│   └── sync/           # 同步引擎
│
├── flowus/             # FlowUs 适配层
│   ├── api/            # API 客户端
│   ├── adapter.ts      # 适配器实现
│   └── mapper/         # 类型映射器
│
├── entities/           # 业务实体 (可扩展)
│   ├── todo/
│   ├── note/
│   └── ...
│
├── storage/            # 存储适配器
│   ├── interface.ts    # IStorageAdapter
│   ├── obsidian.ts     # Obsidian 实现
│   └── file.ts         # Node.js 文件实现
│
├── sync/               # 同步引擎
│   ├── engine.ts       # 泛型 SyncEngine
│   └── strategy.ts     # 冲突解决策略
│
├── di/                 # 依赖注入配置
│   └── container.ts    # DI 容器初始化
│
└── main.ts             # 插件入口
```

---

## 8. 参考文档

- [通用同步层设计](./UNIVERSAL_SYNC.md)
- [FlowUs API 适配层](./FLOWUS_ADAPTER.md)
- [实体 Schema 定义指南](./ENTITY_SCHEMA.md)
- [快速开始](./QUICK_START.md)
- [FlowUs API 官方文档](https://flowus.cn/share/07168d83-cb08-4ab8-ab73-74fe915054b1)
