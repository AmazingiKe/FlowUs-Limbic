# 测试指南

本文档介绍 FlowUs Limbic 的测试策略和最佳实践。

## 测试框架

项目使用 **Vitest** 作为测试框架：

- 与 Jest 兼容的 API
- 极快的执行速度
- 内置 TypeScript 支持
- 内置 coverage 报告

## 测试类型

### 1. 单元测试

测试独立的函数和类，不依赖外部系统。

**示例**：
```typescript
// src/universal/transformer.test.ts
import { describe, it, expect } from 'vitest';
import { TransformerEngine } from './transformer';
import { registry } from './registry';
import { todoSchema } from '../entities/todo/schema';

describe('TransformerEngine', () => {
  beforeAll(() => {
    registry.register(todoSchema);
  });

  it('should transform todo to blocks', () => {
    const transformer = new TransformerEngine(registry);
    const todo = {
      id: '123',
      type: 'todo',
      title: '测试任务',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: {}
    };

    const blocks = transformer.toBlocks(todo);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('to_do');
  });
});
```

### 2. 集成测试

测试多个组件的协作。

**示例**：
```typescript
// src/flowus/adapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FlowUsAdapter } from './adapter';
import { MockStorageAdapter } from '../storage/mock-adapter';

describe('FlowUsAdapter', () => {
  let adapter: FlowUsAdapter;
  let storage: MockStorageAdapter;

  beforeEach(() => {
    storage = new MockStorageAdapter();
    adapter = new FlowUsAdapter(storage, {
      clientId: 'test-id',
      clientSecret: 'test-secret',
      redirectUri: 'obsidian://callback'
    });
  });

  it('should initialize', async () => {
    await adapter.initialize();
    expect(adapter.auth).toBeDefined();
  });
});
```

### 3. E2E 测试

测试完整的用户流程。

**注意**：E2E 测试需要 Obsidian 测试环境，比较复杂。

## 运行测试

### 运行所有测试

```bash
npm test
```

### 监听模式

```bash
npm test -- --watch
```

### 运行特定测试

```bash
# 按文件名
npm test -- transformer.test.ts

# 按测试名
npm test -- -t "should transform todo to blocks"
```

### 覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录。

## Mock 策略

### Mock FlowUs API

```typescript
// src/flowus/__mocks__/api.ts
export class MockFlowUsApi {
  databases = new Map();

  async getDatabase(databaseId: string) {
    return this.databases.get(databaseId);
  }

  async queryDatabase(params: any) {
    return { results: [], has_more: false };
  }

  // Mock 方法
  mockDatabase(id: string, data: any) {
    this.databases.set(id, data);
  }
}
```

### Mock Storage

```typescript
// src/storage/mock-adapter.ts
import { IStorageAdapter } from './interface';

export class MockStorageAdapter implements IStorageAdapter {
  private store = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(pattern?: string): Promise<string[]> {
    if (!pattern) {
      return Array.from(this.store.keys());
    }
    const regex = new RegExp(pattern);
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  // 测试辅助方法
  clear() {
    this.store.clear();
  }
}
```

### Mock Obsidian API

```typescript
// src/__mocks__/obsidian.ts
export class MockPlugin {
  settings = {};
  addCommand = vi.fn();
  addSettingTab = vi.fn();
  registerView = vi.fn();
}

export class MockNotice {
  constructor(message: string) {}
  hide = vi.fn();
}
```

## 测试最佳实践

### 1. AAA 模式

```typescript
it('should do something', () => {
  // Arrange - 准备
  const todo = createTestTodo();
  const transformer = createTransformer();

  // Act - 执行
  const result = transformer.toBlocks(todo);

  // Assert - 断言
  expect(result).toBeDefined();
});
```

### 2. 使用测试工厂

```typescript
// src/test/factories.ts
export function createTestTodo(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'todo',
    title: '测试任务',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    properties: {},
    ...overrides
  };
}

export function createTestBlock(overrides = {}) {
  return {
    object: 'block',
    type: 'to_do',
    to_do: {
      rich_text: [{ type: 'text', text: { content: '测试' } }],
      checked: false
    },
    ...overrides
  };
}
```

### 3. 每个测试独立

```typescript
describe('MyClass', () => {
  let myClass: MyClass;

  // 每个测试前重新创建
  beforeEach(() => {
    myClass = new MyClass();
  });

  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ });
});
```

### 4. 测试行为，不是实现

```typescript
// 好：测试行为
it('should mark todo as completed', () => {
  todo.markCompleted();
  expect(todo.completed).toBe(true);
});

// 不好：测试实现细节
it('should set internal completed flag', () => {
  todo.markCompleted();
  expect(todo._internalCompletedFlag).toBe(true);
});
```

### 5. 描述性的测试名称

```typescript
// 好
it('should return null when todo not found', () => {});
it('should throw validation error when title is empty', () => {});

// 不好
it('test 1', () => {});
it('should work', () => {});
```

## 测试覆盖率目标

| 类型 | 目标覆盖率 |
|------|-----------|
| 核心模块（universal） | 80%+ |
| 适配器（flowus） | 70%+ |
| 实体（entities） | 80%+ |
| 整体 | 70%+ |

## CI 集成

### GitHub Actions

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 调试测试

### 使用 VS Code 调试

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### 在测试中使用 console.log

```typescript
it('should debug', () => {
  const result = someFunction();
  console.log('Debug result:', result);
  expect(result).toBeDefined();
});
```

## 下一步

- [Schema 开发指南](./schema-development.md) - 学习如何开发 Schema
- [架构决策记录](./architecture-decisions.md) - 了解技术决策
