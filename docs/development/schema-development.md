# Schema 开发指南

FlowUs Limbic 使用声明式 Schema 来定义数据类型，让您可以轻松扩展新的数据类型。

## 目录

- [Schema 概述](#schema-概述)
- [核心概念](#核心概念)
- [创建 Schema](#创建-schema)
- [Schema API](#schema-api)
- [示例：创建 Note Schema](#示例创建-note-schema)
- [高级主题](#高级主题)
- [最佳实践](#最佳实践)

## Schema 概述

### 什么是 Schema？

Schema 是一个声明式定义，描述了：
- 数据类型的结构
- 如何与 FlowUs Block 进行双向转换
- 如何验证数据
- 如何检测变更

### 为什么使用 Schema？

- **零代码侵入核心**: 添加新数据类型不需要修改核心代码
- **类型安全**: 完整的 TypeScript 类型支持
- **可测试性**: 每个 Schema 可以独立测试
- **可组合性**: 可以组合和重用 Schema

## 核心概念

### IUniversalEntity

所有可同步的数据类型都必须实现 `IUniversalEntity` 接口：

```typescript
export interface IUniversalEntity {
  id: string;                    // 全局唯一标识符
  type: EntityType;              // 实体类型标识
  createdAt: string;             // ISO 8601 格式创建时间
  updatedAt: string;             // ISO 8601 格式更新时间
  deleted?: boolean;             // 软删除标记
  properties: Record<string, any>; // 业务属性
  content?: BlockNode[];         // 富文本内容（可选）
}
```

### BlockNode

FlowUs 的 Block 结构：

```typescript
export interface BlockNode {
  object: 'block';
  id?: string;
  type: BlockType;
  created_time?: string;
  last_edited_time?: string;
  has_children?: boolean;
  archived?: boolean;
  [key: string]: any; // 类型特定属性
}
```

### EntitySchema

Schema 定义：

```typescript
export interface EntitySchema<T extends IUniversalEntity = IUniversalEntity> {
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

## 创建 Schema

### 步骤 1：定义实体类型

首先，定义您的实体接口：

```typescript
// src/entities/note/types.ts
import { IUniversalEntity } from '../../universal/types';

export interface Note extends IUniversalEntity {
  type: 'note';
  title: string;
  content: string;
  tags?: string[];
  category?: string;
}
```

### 步骤 2：实现 toBlocks

定义如何将实体转换为 FlowUs Blocks：

```typescript
// src/entities/note/schema.ts
import { EntitySchema, BlockNode } from '../../universal/types';
import { Note } from './types';

const noteSchema: EntitySchema<Note> = {
  type: 'note',
  displayName: '笔记',
  description: '富文本笔记',

  // 属性定义（对应 FlowUs Database 属性）
  properties: [
    {
      name: 'Title',
      flowusType: 'title',
      required: true,
      mapTo: 'title'
    },
    {
      name: 'Tags',
      flowusType: 'multi_select',
      required: false,
      mapTo: 'tags'
    },
    {
      name: 'Category',
      flowusType: 'select',
      required: false,
      mapTo: 'category',
      options: ['工作', '个人', '学习', '其他']
    }
  ],

  // 转换实体为 Blocks
  toBlocks: (note: Note): BlockNode[] => {
    const blocks: BlockNode[] = [];

    // 标题作为 Heading 1
    blocks.push({
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{
          type: 'text',
          text: { content: note.title }
        }]
      }
    });

    // 内容作为 Paragraphs
    // 简单实现：假设 content 是纯文本
    // 复杂实现：可以解析 Markdown 为 Blocks
    if (note.content) {
      const paragraphs = note.content.split('\n\n');
      paragraphs.forEach(para => {
        if (para.trim()) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: para }
              }]
            }
          });
        }
      });
    }

    return blocks;
  },
```

### 步骤 3：实现 fromBlocks

定义如何从 FlowUs Blocks 还原实体：

```typescript
  // 从 Blocks 还原实体
  fromBlocks: (blocks: BlockNode[], metadata?: any): Note => {
    // 找到标题
    const headingBlock = blocks.find(b => b.type === 'heading_1');
    const title = headingBlock?.heading_1?.rich_text[0]?.text?.content || 'Untitled';

    // 收集内容段落
    const contentBlocks = blocks.filter(b => b.type === 'paragraph');
    const content = contentBlocks
      .map(b => b.paragraph?.rich_text[0]?.text?.content || '')
      .join('\n\n');

    return {
      id: metadata?.id || crypto.randomUUID(),
      type: 'note',
      title,
      content,
      tags: metadata?.properties?.Tags?.multi_select?.map((t: any) => t.name) || [],
      category: metadata?.properties?.Category?.select?.name,
      createdAt: metadata?.created_time || new Date().toISOString(),
      updatedAt: metadata?.last_edited_time || new Date().toISOString(),
      properties: {}
    };
  },
```

### 步骤 4：实现 getFingerprint

定义如何计算数据指纹（用于变更检测）：

```typescript
  // 计算指纹，用于检测变更
  getFingerprint: (note: Note): string => {
    // 包含所有会影响同步的字段
    const data = {
      title: note.title,
      content: note.content,
      tags: note.tags?.sort().join(','),
      category: note.category
    };
    return JSON.stringify(data);
  },
```

### 步骤 5：实现 validate（可选）

定义如何验证数据：

```typescript
  // 验证数据
  validate: (note: Note): ValidationResult => {
    const errors: string[] = [];

    if (!note.title || note.title.trim().length === 0) {
      errors.push('标题不能为空');
    }

    if (note.title.length > 1000) {
      errors.push('标题不能超过 1000 字符');
    }

    if (note.content.length > 100000) {
      errors.push('内容不能超过 100000 字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
```

### 步骤 6：注册 Schema

```typescript
// src/entities/note/schema.ts
import { registry } from '../../universal/registry';

// ... Schema 定义 ...

// 注册 Schema
registry.register(noteSchema);
```

### 步骤 7：导入 Schema

在插件入口处导入：

```typescript
// src/main.ts
import './entities/note/schema'; // 自动注册
```

## Schema API

### PropertyDefinition

```typescript
interface PropertyDefinition {
  name: string;                  // 属性名称（FlowUs 中显示）
  flowusType: FlowUsPropertyType; // FlowUs 属性类型
  required: boolean;             // 是否必填
  mapTo: string;                 // 映射到实体的字段路径
  defaultValue?: any;            // 默认值
  options?: string[];            // select/multi_select 的选项
}
```

### FlowUsPropertyType

```typescript
type FlowUsPropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by';
```

## 示例：创建 Note Schema

完整示例见上文。

## 高级主题

### 中间件

可以为 TransformerEngine 添加中间件：

```typescript
import { TransformerEngine } from '../universal/transformer';

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

### 组合 Schema

可以组合多个 Schema：

```typescript
// 基础 Schema
const baseSchema = {
  getFingerprint: (entity) => `${entity.updatedAt}`,
  validate: (entity) => ({ valid: true })
};

// 继承基础 Schema
const noteSchema = {
  ...baseSchema,
  type: 'note',
  // ... 其他属性
};
```

### 动态 Schema

可以动态加载 Schema：

```typescript
async function loadSchemaFromRemote(url: string) {
  const response = await fetch(url);
  const schemaDef = await response.json();

  const schema = buildSchemaFromDefinition(schemaDef);
  registry.register(schema);
}
```

## 最佳实践

### 1. 保持 Schema 简单

每个 Schema 只负责一种数据类型，避免过度复杂。

### 2. 提供合理的默认值

```typescript
{
  name: 'Priority',
  flowusType: 'select',
  required: false,
  mapTo: 'priority',
  defaultValue: 'medium',
  options: ['low', 'medium', 'high']
}
```

### 3. 实现健壮的 fromBlocks

处理各种边界情况：

```typescript
fromBlocks: (blocks, metadata) => {
  // 使用默认值
  const title = blocks[0]?.heading_1?.rich_text[0]?.text?.content || 'Untitled';

  // 安全访问嵌套属性
  const tags = metadata?.properties?.Tags?.multi_select?.map((t: any) => t.name) || [];

  // ...
}
```

### 4. 指纹计算要高效

```typescript
// 好：只包含关键字段
getFingerprint: (todo) => `${todo.title}:${todo.completed}:${todo.updatedAt}`

// 不好：包含大字段
getFingerprint: (note) => JSON.stringify(note)
```

### 5. 验证要严格但友好

```typescript
validate: (entity) => {
  const errors: string[] = [];

  if (!entity.title) {
    errors.push('标题不能为空');
  }

  if (entity.title.length > 1000) {
    errors.push('标题不能超过 1000 字符（当前：${entity.title.length}）');
  }

  return { valid: errors.length === 0, errors };
}
```

### 6. 编写测试

为每个 Schema 编写测试：

```typescript
describe('NoteSchema', () => {
  it('should convert note to blocks', () => {
    const note = createTestNote();
    const blocks = noteSchema.toBlocks(note);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('should restore note from blocks', () => {
    const note = createTestNote();
    const blocks = noteSchema.toBlocks(note);
    const restored = noteSchema.fromBlocks(blocks, { id: note.id });
    expect(restored.title).toBe(note.title);
  });

  it('should detect changes via fingerprint', () => {
    const note1 = createTestNote();
    const note2 = { ...note1, title: 'Changed' };
    expect(noteSchema.getFingerprint(note1))
      .not.toBe(noteSchema.getFingerprint(note2));
  });
});
```

## 下一步

- [架构概览](../architecture/overview.md) - 了解系统架构
- [通用同步层](../architecture/universal-sync.md) - 深入了解通用同步层
- [测试指南](./testing-guidelines.md) - 学习如何测试
