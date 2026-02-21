import axios, { AxiosInstance } from 'axios';
import { Authenticator } from './auth';
import { TodoItem } from './types';

/**
 * @class FlowUsClient
 * @description 核心 API 客户端，负责与 FlowUs 后端通信
 */
export class FlowUsClient {
  private client: AxiosInstance;
  private readonly BASE_URL = 'https://api.flowus.cn/v1';

  constructor(private authenticator: Authenticator) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: { 'Content-Type': 'application/json' }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(async (config) => {
      if (await this.authenticator.isTokenExpired()) {
        await this.authenticator.refresh();
      }

      const token = await this.authenticator.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * 获取数据库中的页面（TODO）
   */
  async getPages(databaseId: string, tableName?: string): Promise<TodoItem[]> {
    const response = await this.client.get('/pages', {
      params: { database_id: databaseId, filter: { table_name: tableName } }
    });

    return response.data.items.map((item: any) => this.mapToTodo(item));
  }

  /**
   * 创建页面
   */
  async createPage(databaseId: string, properties: any): Promise<TodoItem> {
    const response = await this.client.post('/pages', {
      parent: { database_id: databaseId },
      properties
    });
    return this.mapToTodo(response.data);
  }

  /**
   * 更新块（Block）
   */
  async updateBlock(blockId: string, properties: any): Promise<TodoItem> {
    const response = await this.client.patch(`/blocks/${blockId}`, { properties });
    return this.mapToTodo(response.data);
  }

  /**
   * 删除块
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.client.delete(`/blocks/${blockId}`);
  }

  private mapToTodo(item: any): TodoItem {
    return {
      id: item.id,
      title: item.properties.title?.title[0]?.text?.content || 'Untitled',
      completed: item.properties.completed?.checkbox || false,
      createdAt: item.created_time,
      updatedAt: item.last_edited_time,
      ...item
    };
  }
}
