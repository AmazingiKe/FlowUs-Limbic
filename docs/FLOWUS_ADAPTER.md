# FlowUs API 适配层详细设计

## 1. 概述

FlowUs 适配层负责封装 FlowUs API 调用，提供统一的错误处理、认证管理和请求重试机制。

---

## 2. API 客户端分层

```
FlowUsAdapter (统一入口)
      ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Block     │    Page     │  Database   │    User     │
│   Client    │   Client    │   Client    │   Client    │
└─────────────┴─────────────┴─────────────┴─────────────┘
                      ↓
              ┌─────────────────┐
              │  HTTP Client    │
              │  (Axios)        │
              └─────────────────┘
                      ↓
              ┌─────────────────┐
              │  Auth Manager   │
              │  (Token 管理)    │
              └─────────────────┘
```

---

## 3. 核心组件

### 3.1 FlowUsBlockClient (Block API 客户端)

**职责**: 封装 Block 相关的 CRUD 操作

```typescript
// src/flowus/api/block-client.ts
import axios, { AxiosInstance } from 'axios';
import { BlockNode } from '../../universal/types';

export class FlowUsBlockClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Block 详情
   * @see https://flowus.cn/share/07168d83-cb08-4ab8-ab73-74fe915054b1
   */
  async getBlock(blockId: string): Promise<BlockNode> {
    const response = await this.http.get(`/blocks/${blockId}`);
    const block = response.data;

    // 递归获取子 Block
    if (block.has_children) {
      block.children = await this.getChildren(blockId);
    }

    return block;
  }

  /**
   * 获取 Block 的子 Block 列表
   */
  async getChildren(
    blockId: string,
    options?: {
      startCursor?: string;
      pageSize?: number;
    }
  ): Promise<BlockNode[]> {
    const response = await this.http.get(`/blocks/${blockId}/children`, {
      params: {
        start_cursor: options?.startCursor,
        page_size: options?.pageSize || 100
      }
    });

    let results = response.data.results;

    // 处理分页
    if (response.data.has_more && response.data.next_cursor) {
      const nextPage = await this.getChildren(blockId, {
        startCursor: response.data.next_cursor,
        pageSize: options?.pageSize
      });
      results = results.concat(nextPage);
    }

    return results;
  }

  /**
   * 追加子 Block
   */
  async appendChildren(
    blockId: string,
    children: BlockNode[]
  ): Promise<{ results: BlockNode[] }> {
    const response = await this.http.patch(`/blocks/${blockId}/children`, {
      children
    });
    return response.data;
  }

  /**
   * 更新 Block
   */
  async updateBlock(
    blockId: string,
    block: Partial<BlockNode>
  ): Promise<BlockNode> {
    const response = await this.http.patch(`/blocks/${blockId}`, block);
    return response.data;
  }

  /**
   * 删除 Block
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.http.delete(`/blocks/${blockId}`);
  }
}
```

---

### 3.2 FlowUsPageClient (Page API 客户端)

**职责**: 封装 Page 相关操作

```typescript
// src/flowus/api/page-client.ts
export interface FlowUsPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: Record<string, any>;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace';
    database_id?: string;
    page_id?: string;
  };
  url: string;
}

export class FlowUsPageClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Page 详情
   */
  async getPage(pageId: string): Promise<FlowUsPage> {
    const response = await this.http.get(`/pages/${pageId}`);
    return response.data;
  }

  /**
   * 创建 Page
   */
  async createPage(params: {
    parent: FlowUsPage['parent'];
    properties: Record<string, any>;
    children?: BlockNode[];
  }): Promise<FlowUsPage> {
    const response = await this.http.post('/pages', params);
    return response.data;
  }

  /**
   * 更新 Page 属性
   */
  async updatePage(
    pageId: string,
    properties: Record<string, any>
  ): Promise<FlowUsPage> {
    const response = await this.http.patch(`/pages/${pageId}`, {
      properties
    });
    return response.data;
  }

  /**
   * 归档 Page (软删除)
   */
  async archivePage(pageId: string): Promise<FlowUsPage> {
    const response = await this.http.patch(`/pages/${pageId}`, {
      archived: true
    });
    return response.data;
  }
}
```

---

### 3.3 FlowUsDatabaseClient (Database API 客户端)

**职责**: 封装 Database 查询和操作

```typescript
// src/flowus/api/database-client.ts
export interface DatabaseQueryFilter {
  property: string;
  [key: string]: any;
}

export interface DatabaseQuerySort {
  property: string;
  direction: 'ascending' | 'descending';
}

export class FlowUsDatabaseClient {
  constructor(private http: AxiosInstance) {}

  /**
   * 获取 Database 结构
   */
  async getDatabase(databaseId: string): Promise<any> {
    const response = await this.http.get(`/databases/${databaseId}`);
    return response.data;
  }

  /**
   * 查询 Database 条目
   */
  async queryDatabase(params: {
    databaseId: string;
    filter?: DatabaseQueryFilter;
    sorts?: DatabaseQuerySort[];
    startCursor?: string;
    pageSize?: number;
  }): Promise<{ results: FlowUsPage[]; has_more: boolean; next_cursor?: string }> {
    const response = await this.http.post(
      `/databases/${params.databaseId}/query`,
      {
        filter: params.filter,
        sorts: params.sorts,
        start_cursor: params.startCursor,
        page_size: params.pageSize || 100
      }
    );

    return response.data;
  }

  /**
   * 查询所有条目 (自动处理分页)
   */
  async queryAllPages(params: {
    databaseId: string;
    filter?: DatabaseQueryFilter;
    sorts?: DatabaseQuerySort[];
  }): Promise<FlowUsPage[]> {
    let allPages: FlowUsPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const result = await this.queryDatabase({
        ...params,
        startCursor
      });

      allPages = allPages.concat(result.results);
      hasMore = result.has_more;
      startCursor = result.next_cursor;
    }

    return allPages;
  }

  /**
   * 创建 Database 条目 (实际是创建 Page)
   */
  async createDatabasePage(
    databaseId: string,
    properties: Record<string, any>,
    children?: BlockNode[]
  ): Promise<FlowUsPage> {
    const response = await this.http.post('/pages', {
      parent: { database_id: databaseId },
      properties,
      children
    });
    return response.data;
  }
}
```

---

### 3.4 AuthManager (认证管理器)

**职责**: 管理 OAuth Token 的获取、刷新和存储

```typescript
// src/flowus/auth/manager.ts
import { IStorageAdapter } from '../../storage/interface';

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export class AuthManager {
  private tokenInfo: TokenInfo | null = null;

  constructor(
    private storage: IStorageAdapter,
    private config: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }
  ) {}

  /**
   * 初始化 - 从存储加载 Token
   */
  async initialize(): Promise<void> {
    const stored = await this.storage.get<TokenInfo>('flowus_token');
    if (stored) {
      this.tokenInfo = stored;
    }
  }

  /**
   * 获取授权 URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'all',
      state: state || Math.random().toString(36).substring(2)
    });

    return `https://api.flowus.cn/oauth/authorize?${params.toString()}`;
  }

  /**
   * 使用授权码换取 Token
   */
  async exchangeCode(code: string): Promise<TokenInfo> {
    const response = await fetch('https://api.flowus.cn/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.tokenInfo = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    await this.storage.set('flowus_token', this.tokenInfo);
    return this.tokenInfo;
  }

  /**
   * 刷新 Token
   */
  async refreshAccessToken(): Promise<TokenInfo> {
    if (!this.tokenInfo?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://api.flowus.cn/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenInfo.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.tokenInfo = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    await this.storage.set('flowus_token', this.tokenInfo);
    return this.tokenInfo;
  }

  /**
   * 获取当前有效的 Access Token
   */
  async getAccessToken(): Promise<string> {
    if (!this.tokenInfo) {
      throw new Error('Not authenticated');
    }

    // Token 即将过期 (提前 5 分钟刷新)
    if (Date.now() + 5 * 60 * 1000 >= this.tokenInfo.expiresAt) {
      await this.refreshAccessToken();
    }

    return this.tokenInfo.accessToken;
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.tokenInfo !== null;
  }

  /**
   * 清除认证信息
   */
  async logout(): Promise<void> {
    this.tokenInfo = null;
    await this.storage.remove('flowus_token');
  }
}
```

---

### 3.5 HTTP Client (Axios 封装)

**职责**: 统一 HTTP 请求配置、拦截器、错误处理

```typescript
// src/flowus/api/http-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthManager } from '../auth/manager';

export class FlowUsHttpClient {
  private client: AxiosInstance;

  constructor(
    private authManager: AuthManager,
    private baseURL = 'https://api.flowus.cn/v1'
  ) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'FlowUs-Version': '2024-01-01'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 配置请求/响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器 - 注入 Token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.authManager.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 错误处理
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // 401 未授权 - 尝试刷新 Token
        if (error.response?.status === 401) {
          try {
            await this.authManager.refreshAccessToken();
            // 重试原请求
            return this.client.request(error.config!);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw new Error('Authentication failed, please re-login');
          }
        }

        // 429 限流 - 等待后重试
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

          console.warn(`Rate limited, retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.client.request(error.config!);
        }

        // 5xx 服务器错误 - 重试 3 次
        if (error.response?.status && error.response.status >= 500) {
          const retryCount = (error.config as any).__retryCount || 0;
          if (retryCount < 3) {
            (error.config as any).__retryCount = retryCount + 1;
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.client.request(error.config!);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * 标准化错误格式
   */
  private normalizeError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      return new Error(
        data?.message || `API Error: ${error.response.status} ${error.response.statusText}`
      );
    }

    if (error.request) {
      return new Error('Network error: No response from server');
    }

    return new Error(error.message || 'Unknown error');
  }

  /**
   * 获取 Axios 实例
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}
```

---

## 4. FlowUsAdapter (统一适配器)

**职责**: 组装所有客户端，提供统一入口

```typescript
// src/flowus/adapter.ts
import { FlowUsHttpClient } from './api/http-client';
import { FlowUsBlockClient } from './api/block-client';
import { FlowUsPageClient } from './api/page-client';
import { FlowUsDatabaseClient } from './api/database-client';
import { AuthManager } from './auth/manager';
import { IStorageAdapter } from '../storage/interface';

export class FlowUsAdapter {
  public readonly block: FlowUsBlockClient;
  public readonly page: FlowUsPageClient;
  public readonly database: FlowUsDatabaseClient;
  public readonly auth: AuthManager;

  constructor(
    storage: IStorageAdapter,
    config: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }
  ) {
    // 初始化认证管理器
    this.auth = new AuthManager(storage, config);

    // 初始化 HTTP 客户端
    const httpClient = new FlowUsHttpClient(this.auth);
    const axiosInstance = httpClient.getInstance();

    // 初始化各个 API 客户端
    this.block = new FlowUsBlockClient(axiosInstance);
    this.page = new FlowUsPageClient(axiosInstance);
    this.database = new FlowUsDatabaseClient(axiosInstance);
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    await this.auth.initialize();
  }
}
```

---

## 5. 使用示例

### 5.1 初始化

```typescript
// src/main.ts
import { FlowUsAdapter } from './flowus/adapter';
import { ObsidianStorageAdapter } from './storage/obsidian-adapter';

const storage = new ObsidianStorageAdapter(plugin);
const flowus = new FlowUsAdapter(storage, {
  clientId: settings.clientId,
  clientSecret: settings.clientSecret,
  redirectUri: 'obsidian://flowus-limbic-callback'
});

await flowus.initialize();
```

### 5.2 OAuth 授权流程

```typescript
// 1. 获取授权 URL
const authUrl = flowus.auth.getAuthorizationUrl();
window.open(authUrl, '_blank');

// 2. 处理回调 (在 Obsidian Protocol Handler 中)
plugin.registerObsidianProtocolHandler('flowus-limbic-callback', async (params) => {
  const code = params.code;
  if (code) {
    await flowus.auth.exchangeCode(code);
    new Notice('授权成功！');
  }
});
```

### 5.3 查询 Database

```typescript
// 查询所有待办
const pages = await flowus.database.queryAllPages({
  databaseId: settings.databaseId,
  filter: {
    property: 'Status',
    select: { equals: 'In Progress' }
  },
  sorts: [
    { property: 'Due Date', direction: 'ascending' }
  ]
});

console.log(`Found ${pages.length} todos`);
```

### 5.4 创建 Page

```typescript
const newPage = await flowus.page.createPage({
  parent: { database_id: settings.databaseId },
  properties: {
    'Title': {
      title: [{ text: { content: '完成架构文档' } }]
    },
    'Status': {
      select: { name: 'To Do' }
    }
  },
  children: [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: '详细描述...' } }]
      }
    }
  ]
});
```

### 5.5 更新 Block

```typescript
await flowus.block.updateBlock(blockId, {
  type: 'to_do',
  to_do: {
    rich_text: [{ text: { content: '已完成的任务' } }],
    checked: true
  }
});
```

---

## 6. 错误处理

### 6.1 错误类型

```typescript
export class FlowUsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'FlowUsApiError';
  }
}

export class AuthenticationError extends FlowUsApiError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends FlowUsApiError {
  constructor(public retryAfter: number) {
    super(`Rate limit exceeded, retry after ${retryAfter}s`, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}
```

### 6.2 错误处理示例

```typescript
try {
  await flowus.database.queryDatabase({ databaseId: 'xxx' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 重新授权
    const authUrl = flowus.auth.getAuthorizationUrl();
    window.open(authUrl);
  } else if (error instanceof RateLimitError) {
    // 等待后重试
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
  } else {
    console.error('API Error:', error);
  }
}
```

---

## 7. 性能优化

### 7.1 请求批处理

```typescript
export class BatchRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 5); // 每批 5 个请求
      await Promise.all(batch.map(fn => fn()));
      await new Promise(resolve => setTimeout(resolve, 100)); // 间隔 100ms
    }

    this.processing = false;
  }
}
```

### 7.2 响应缓存

```typescript
export class ResponseCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }
}
```

---

## 8. 测试

### 8.1 Mock HTTP Client

```typescript
export class MockFlowUsHttpClient {
  private responses = new Map<string, any>();

  mockResponse(url: string, data: any): void {
    this.responses.set(url, data);
  }

  async get(url: string): Promise<any> {
    const data = this.responses.get(url);
    if (!data) throw new Error(`No mock for ${url}`);
    return { data };
  }
}
```

### 8.2 集成测试

```typescript
describe('FlowUsAdapter', () => {
  it('should query database pages', async () => {
    const adapter = new FlowUsAdapter(mockStorage, mockConfig);
    await adapter.initialize();

    const pages = await adapter.database.queryAllPages({
      databaseId: 'test-db'
    });

    expect(pages).toHaveLength(10);
  });
});
```
