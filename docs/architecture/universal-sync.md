# 通用同步层详细设计

## 1. 概述

通用同步层是 FlowUs Limbic 的核心，负责将任意数据类型与 FlowUs Block 模型进行双向转换和同步。

---

## 2. 核心类型定义

### 2.1 IUniversalEntity (通用实体接口)

所有可同步的数据类型必须实现此接口：

```typescript
export interface IUniversalEntity {
  id: string;                    // 全局唯一标识符
  type: EntityType;              // 实体类型标识 (如 'todo', 'note')
  createdAt: string;             // ISO 8601 格式创建时间
  updatedAt: string;             // ISO 8601 格式更新时间
  deleted?: boolean;             // 软删除标记
  properties: Record<string, any>; // 业务属性
  content?: BlockNode[];         // 富文本内容 (可选)
}

export type EntityType = string;
```

**设计要点**:
- `id` 在本地和远程保持一致，用于关联同一实体
- `type` 用于 Registry 查找对应的 Schema
- `updatedAt` 是增量同步的核心依据
- `properties` 存储业务特定字段，灵活扩展
- `content` 存储富文本内容，映射为 Block 数组

---

### 2.2 BlockNode (FlowUs Block 节点)

严格对齐 FlowUs API 的 Block 结构：

```typescript
export interface BlockNode {
  object: 'block';               // 固定值
  id?: string;                   // Block ID (创建时为空)
  type: BlockType;               // Block 类型
  created_time?: string;         // 创建时间
  last_edited_time?: string;     // 最后编辑时间
  has_children?: boolean;        // 是否有子 Block
  archived?: boolean;            // 是否归档

  // 类型特定属性 (根据 type 动态)
  [key: string]: any;
}

export type BlockType =
  // 文本类
  | 'paragraph'
  | 'heading_1' | 'heading_2' | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'

  // 媒体类
  | 'image'
  | 'video'
  | 'file'
  | 'pdf'
  | 'bookmark'

  // 高级类
  | 'code'
  | 'equation'
  | 'divider'
  | 'table_of_contents'
  | 'breadcrumb'

  // 数据库类
  | 'child_page'
  | 'child_database'
  | 'embed'
  | 'link_preview'
  | 'synced_block'
  | 'table'
  | 'table_row'
  | 'column_list'
  | 'column';
```

**Block 类型示例**:

```typescript
// 段落 Block
{
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [
      {
        type: 'text',
        text: { content: 'Hello World' },
        annotations: { bold: false, italic: false }
      }
    ],
    color: 'default'
  }
}

// 待办 Block
{
  object: 'block',
  type: 'to_do',
  to_do: {
    rich_text: [{ type: 'text', text: { content: '完成文档' } }],
    checked: false,
    color: 'default'
  }
}

// 代码 Block
{
  object: 'block',
  type: 'code',
  code: {
    rich_text: [{ type: 'text', text: { content: 'console.log("hi")' } }],
    language: 'javascript'
  }
}
```

---

### 2.3 EntitySchema (实体 Schema)

声明式定义实体与 Block 的映射规则：

```typescript
export interface EntitySchema<T extends IUniversalEntity = IUniversalEntity> {
  // 基础信息
  type: EntityType;              // 实体类型标识
  displayName: string;           // 显示名称
  description?: string;          // 描述

  // 属性定义 (对应 FlowUs Database Properties)
  properties: PropertyDefinition[];

  // 转换函数
  toBlocks: (entity: T) => BlockNode[];
  fromBlocks: (blocks: BlockNode[], metadata?: any) => T;

  // 变更检测
  getFingerprint: (entity: T) => string;

  // 验证
  validate?: (entity: T) => ValidationResult;
}

export interface PropertyDefinition {
  name: string;                  // 属性名称 (FlowUs 中显示)
  flowusType: FlowUsPropertyType; // FlowUs 属性类型
  required: boolean;             // 是否必填
  mapTo: string;                 // 映射到实体的字段路径 (支持嵌套)
  defaultValue?: any;            // 默认值
  options?: string[];            // select/multi_select 的选项
}

export type FlowUsPropertyType =
  | 'title'           // 标题 (每个 Database 必须有一个)
  | 'rich_text'       // 富文本
  | 'number'          // 数字
  | 'select'          // 单选
  | 'multi_select'    // 多选
  | 'date'            // 日期
  | 'checkbox'        // 复选框
  | 'url'             // URL
  | 'email'           // 邮箱
  | 'phone_number'    // 电话
  | 'formula'         // 公式
  | 'relation'        // 关联
  | 'rollup'          // 汇总
  | 'created_time'    // 创建时间
  | 'created_by'      // 创建人
  | 'last_edited_time' // 最后编辑时间
  | 'last_edited_by'; // 最后编辑人

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
```

---

## 3. Entity Registry (实体注册中心)

### 3.1 设计目标

- 运行时动态注册 Schema
- 类型安全的 Schema 查找
- 支持 Schema 热更新 (开发模式)
- 提供 Schema 元数据查询

### 3.2 实现

```typescript
// src/universal/registry.ts
export class EntityRegistry {
  private schemas = new Map<EntityType, EntitySchema>();
  private locked = false;

  /**
   * 注册实体 Schema
   */
  register<T extends IUniversalEntity>(schema: EntitySchema<T>): void {
    if (this.locked) {
      throw new Error('Registry is locked, cannot register new schemas');
    }

    // 验证 Schema 完整性
    this.validateSchema(schema);

    if (this.schemas.has(schema.type)) {
      console.warn(`Schema for type "${schema.type}" already exists, overwriting`);
    }

    this.schemas.set(schema.type, schema);
  }

  /**
   * 获取指定类型的 Schema
   */
  get<T extends IUniversalEntity>(type: EntityType): EntitySchema<T> {
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`No schema registered for type: ${type}`);
    }
    return schema as EntitySchema<T>;
  }

  /**
   * 检查类型是否已注册
   */
  has(type: EntityType): boolean {
    return this.schemas.has(type);
  }

  /**
   * 获取所有已注册类型
   */
  getAllTypes(): EntityType[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * 获取所有 Schema
   */
  getAllSchemas(): EntitySchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * 锁定注册中心 (生产环境)
   */
  lock(): void {
    this.locked = true;
  }

  /**
   * 解锁注册中心 (开发模式)
   */
  unlock(): void {
    this.locked = false;
  }

  /**
   * 验证 Schema 完整性
   */
  private validateSchema(schema: EntitySchema): void {
    if (!schema.type) {
      throw new Error('Schema must have a type');
    }
    if (!schema.displayName) {
      throw new Error('Schema must have a displayName');
    }
    if (!schema.toBlocks || typeof schema.toBlocks !== 'function') {
      throw new Error('Schema must have a toBlocks function');
    }
    if (!schema.fromBlocks || typeof schema.fromBlocks !== 'function') {
      throw new Error('Schema must have a fromBlocks function');
    }
    if (!schema.getFingerprint || typeof schema.getFingerprint !== 'function') {
      throw new Error('Schema must have a getFingerprint function');
    }

    // 验证至少有一个 title 类型属性
    const hasTitleProperty = schema.properties.some(p => p.flowusType === 'title');
    if (!hasTitleProperty) {
      throw new Error('Schema must have at least one property with flowusType "title"');
    }
  }
}

// 全局单例
export const registry = new EntityRegistry();
```

---

## 4. Transformer Engine (转换引擎)

### 4.1 设计目标

- 执行 Entity ↔ Block 双向转换
- 管道化处理，支持中间件
- 错误隔离，单个转换失败不影响整体
- 提供转换上下文传递

### 4.2 实现

```typescript
// src/universal/transformer.ts
export interface TransformContext {
  entityType: EntityType;
  direction: 'toBlocks' | 'fromBlocks';
  metadata?: Record<string, any>;
}

export interface TransformMiddleware {
  name: string;
  execute: (
    input: any,
    context: TransformContext,
    next: () => any
  ) => any;
}

export class TransformerEngine {
  private middlewares: TransformMiddleware[] = [];

  constructor(private registry: EntityRegistry) {}

  /**
   * 注册中间件
   */
  use(middleware: TransformMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Entity → Block[]
   */
  toBlocks<T extends IUniversalEntity>(entity: T): BlockNode[] {
    const schema = this.registry.get<T>(entity.type);

    const context: TransformContext = {
      entityType: entity.type,
      direction: 'toBlocks'
    };

    try {
      // 执行中间件管道
      const result = this.executeMiddlewares(
        entity,
        context,
        () => schema.toBlocks(entity)
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to transform entity to blocks: ${error.message}`
      );
    }
  }

  /**
   * Block[] → Entity
   */
  fromBlocks<T extends IUniversalEntity>(
    blocks: BlockNode[],
    entityType: EntityType,
    metadata?: any
  ): T {
    const schema = this.registry.get<T>(entityType);

    const context: TransformContext = {
      entityType,
      direction: 'fromBlocks',
      metadata
    };

    try {
      const result = this.executeMiddlewares(
        blocks,
        context,
        () => schema.fromBlocks(blocks, metadata)
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to transform blocks to entity: ${error.message}`
      );
    }
  }

  /**
   * 批量转换 Entity → Block[]
   */
  toBatchBlocks<T extends IUniversalEntity>(entities: T[]): BlockNode[][] {
    return entities.map(entity => {
      try {
        return this.toBlocks(entity);
      } catch (error) {
        console.error(`Failed to transform entity ${entity.id}:`, error);
        return [];
      }
    });
  }

  /**
   * 批量转换 Block[] → Entity
   */
  fromBatchBlocks<T extends IUniversalEntity>(
    blocksArray: BlockNode[][],
    entityType: EntityType
  ): T[] {
    return blocksArray.map((blocks, index) => {
      try {
        return this.fromBlocks<T>(blocks, entityType);
      } catch (error) {
        console.error(`Failed to transform blocks at index ${index}:`, error);
        return null;
      }
    }).filter(Boolean) as T[];
  }

  /**
   * 执行中间件管道
   */
  private executeMiddlewares(
    input: any,
    context: TransformContext,
    finalHandler: () => any
  ): any {
    let index = 0;

    const next = (): any => {
      if (index >= this.middlewares.length) {
        return finalHandler();
      }

      const middleware = this.middlewares[index++];
      return middleware.execute(input, context, next);
    };

    return next();
  }
}
```

### 4.3 内置中间件

```typescript
// src/universal/middlewares/validation.ts
export const validationMiddleware: TransformMiddleware = {
  name: 'validation',
  execute: (input, context, next) => {
    if (context.direction === 'toBlocks') {
      const schema = registry.get(context.entityType);
      if (schema.validate) {
        const result = schema.validate(input);
        if (!result.valid) {
          throw new Error(`Validation failed: ${result.errors.join(', ')}`);
        }
      }
    }
    return next();
  }
};

// src/universal/middlewares/logging.ts
export const loggingMiddleware: TransformMiddleware = {
  name: 'logging',
  execute: (input, context, next) => {
    console.log(`[Transform] ${context.direction} for ${context.entityType}`);
    const startTime = Date.now();

    try {
      const result = next();
      console.log(`[Transform] Completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`[Transform] Failed:`, error);
      throw error;
    }
  }
};
```

---

## 5. 使用示例

### 5.1 定义 TODO Schema

```typescript
// src/entities/todo/schema.ts
import { registry } from '../../universal/registry';
import { EntitySchema, BlockNode } from '../../universal/types';

export interface Todo extends IUniversalEntity {
  type: 'todo';
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  description?: string;
}

const todoSchema: EntitySchema<Todo> = {
  type: 'todo',
  displayName: '待办事项',
  description: 'GTD 任务管理',

  properties: [
    {
      name: 'Title',
      flowusType: 'title',
      required: true,
      mapTo: 'title'
    },
    {
      name: 'Completed',
      flowusType: 'checkbox',
      required: true,
      mapTo: 'completed',
      defaultValue: false
    },
    {
      name: 'Priority',
      flowusType: 'select',
      required: false,
      mapTo: 'priority',
      options: ['low', 'medium', 'high']
    },
    {
      name: 'Due Date',
      flowusType: 'date',
      required: false,
      mapTo: 'dueDate'
    },
    {
      name: 'Tags',
      flowusType: 'multi_select',
      required: false,
      mapTo: 'tags'
    }
  ],

  toBlocks: (todo) => {
    const blocks: BlockNode[] = [
      {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: todo.title } }],
          checked: todo.completed,
          color: 'default'
        }
      }
    ];

    // 添加描述
    if (todo.description) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: todo.description } }]
        }
      });
    }

    return blocks;
  },

  fromBlocks: (blocks, metadata) => {
    const todoBlock = blocks.find(b => b.type === 'to_do');
    const paraBlock = blocks.find(b => b.type === 'paragraph');

    if (!todoBlock) {
      throw new Error('No to_do block found');
    }

    return {
      id: metadata?.id || '',
      type: 'todo',
      title: todoBlock.to_do.rich_text[0]?.text?.content || 'Untitled',
      completed: todoBlock.to_do.checked || false,
      description: paraBlock?.paragraph?.rich_text[0]?.text?.content,
      createdAt: metadata?.created_time || new Date().toISOString(),
      updatedAt: metadata?.last_edited_time || new Date().toISOString(),
      properties: {}
    } as Todo;
  },

  getFingerprint: (todo) => {
    return `${todo.title}:${todo.completed}:${todo.updatedAt}`;
  },

  validate: (todo) => {
    const errors: string[] = [];

    if (!todo.title || todo.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (todo.priority && !['low', 'medium', 'high'].includes(todo.priority)) {
      errors.push('Invalid priority value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// 注册 Schema
registry.register(todoSchema);
```

### 5.2 使用转换引擎

```typescript
// src/main.ts
import { registry } from './universal/registry';
import { TransformerEngine } from './universal/transformer';
import './entities/todo/schema';  // 自动注册

const transformer = new TransformerEngine(registry);

// Entity → Block
const todo: Todo = {
  id: '123',
  type: 'todo',
  title: '完成架构文档',
  completed: false,
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  properties: {}
};

const blocks = transformer.toBlocks(todo);
console.log(blocks);

// Block → Entity
const restoredTodo = transformer.fromBlocks<Todo>(blocks, 'todo', {
  id: '123',
  created_time: '2024-01-01T00:00:00Z',
  last_edited_time: '2024-01-01T00:00:00Z'
});
console.log(restoredTodo);
```

---

## 6. 扩展点

### 6.1 自定义中间件

```typescript
const encryptionMiddleware: TransformMiddleware = {
  name: 'encryption',
  execute: (input, context, next) => {
    if (context.direction === 'toBlocks') {
      // 加密敏感字段
      const encrypted = encryptSensitiveFields(input);
      return next(encrypted);
    }
    return next();
  }
};

transformer.use(encryptionMiddleware);
```

### 6.2 动态 Schema 加载

```typescript
async function loadSchemaFromRemote(url: string) {
  const response = await fetch(url);
  const schemaDef = await response.json();

  const schema = buildSchemaFromDefinition(schemaDef);
  registry.register(schema);
}
```

---

## 7. 性能优化

### 7.1 批量转换

使用 `toBatchBlocks` 和 `fromBatchBlocks` 减少函数调用开销。

### 7.2 缓存指纹

```typescript
const fingerprintCache = new Map<string, string>();

function getCachedFingerprint(entity: IUniversalEntity): string {
  const cached = fingerprintCache.get(entity.id);
  if (cached) return cached;

  const schema = registry.get(entity.type);
  const fingerprint = schema.getFingerprint(entity);
  fingerprintCache.set(entity.id, fingerprint);

  return fingerprint;
}
```

### 7.3 惰性加载 Schema

只在首次使用时加载 Schema，避免启动时加载所有类型。

---

## 8. 测试策略

### 8.1 单元测试

```typescript
describe('TransformerEngine', () => {
  it('should transform todo to blocks', () => {
    const todo: Todo = { /* ... */ };
    const blocks = transformer.toBlocks(todo);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('to_do');
  });

  it('should restore todo from blocks', () => {
    const blocks: BlockNode[] = [ /* ... */ ];
    const todo = transformer.fromBlocks<Todo>(blocks, 'todo');

    expect(todo.title).toBe('Test');
    expect(todo.completed).toBe(false);
  });
});
```

### 8.2 集成测试

```typescript
describe('End-to-End Transform', () => {
  it('should preserve data through round-trip', () => {
    const original: Todo = { /* ... */ };

    const blocks = transformer.toBlocks(original);
    const restored = transformer.fromBlocks<Todo>(blocks, 'todo', {
      id: original.id,
      created_time: original.createdAt,
      last_edited_time: original.updatedAt
    });

    expect(restored).toEqual(original);
  });
});
```
